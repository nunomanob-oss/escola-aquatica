#!/usr/bin/env python3
"""Linha temporal de um teste k6 (janelas de 30 s): VUs, RPS, p50/p95/p99 por tipo, erros e CPU do servidor.
Uso: python3 perf/scripts/timeline.py perf/results/<pasta>   (lê k6-raw.csv.gz e monitor.ndjson)
A coluna SLO marca as janelas em que p95 leitura ≤ 300 ms, p95 escrita ≤ 800 ms, p99 ≤ 1000 ms e erros < 0,1%."""
import csv, gzip, json, sys, os
from collections import defaultdict

d = sys.argv[1]
W = int(os.environ.get('WINDOW', 30))
win = defaultdict(lambda: {'vus': 0, 'dur': defaultdict(list), 'all': [], 'reqs': 0, 'fail': 0, 'apperr': 0})
t0 = None
with gzip.open(os.path.join(d, 'k6-raw.csv.gz'), 'rt') as f:
    r = csv.DictReader(f)
    for row in r:
        t = int(row['timestamp'])
        t0 = t if t0 is None else t0
        w = win[(t - t0) // W]
        m = row['metric_name']
        if m == 'vus':
            w['vus'] = max(w['vus'], int(float(row['metric_value'])))
        elif m == 'http_req_duration':
            v = float(row['metric_value'])
            tags = dict(x.split('=', 1) for x in (row.get('extra_tags') or '').split('&') if '=' in x)
            kind = row.get('kind') or tags.get('kind', '')
            w['dur'][kind].append(v); w['all'].append(v); w['reqs'] += 1
        elif m == 'errors_by_type':  # 1 linha por pedido falhado (HTTP, timeout ou erro da app com HTTP 200)
            w['fail'] += 1

mon = []
try:
    mon = [json.loads(l) for l in open(os.path.join(d, 'monitor.ndjson'))]
except FileNotFoundError:
    pass
from datetime import datetime, timezone
def cpu_at(i):
    if not mon or t0 is None: return '', ''
    a, b = t0 + i * W, t0 + (i + 1) * W
    s = [m for m in mon if a <= datetime.fromisoformat(m['t'].replace('Z', '+00:00')).timestamp() < b]
    if not s: return '', ''
    cpu = sum(m.get('serverCpuPct', 0) for m in s) / len(s)
    lag = max(m.get('lagP99ms', 0) for m in s)
    return f'{cpu:.0f}', f'{lag:.0f}'

def pct(v, p):
    if not v: return float('nan')
    v = sorted(v); return v[min(len(v) - 1, int(len(v) * p))]

print(f'{"t(s)":>6} {"VUs":>6} {"RPS":>7} {"rd p50":>7} {"rd p95":>7} {"wr p95":>7} {"p99":>7} {"erros%":>7} {"srvCPU%":>8} {"lag99":>6}  SLO')
for i in sorted(win):
    w = win[i]
    rd, wr = w['dur'].get('read', []), w['dur'].get('write', [])
    errs = 100 * w['fail'] / w['reqs'] if w['reqs'] else 0
    ok = (pct(rd, .95) <= 300 if rd else True) and (pct(wr, .95) <= 800 if wr else True) and (pct(w['all'], .99) <= 1000 if w['all'] else True) and errs < 0.1
    cpu, lag = cpu_at(i)
    print(f'{i*W:>6} {w["vus"]:>6} {w["reqs"]/W:>7.1f} {pct(rd,.5):>7.0f} {pct(rd,.95):>7.0f} {pct(wr,.95):>7.0f} {pct(w["all"],.99):>7.0f} {errs:>7.2f} {cpu:>8} {lag:>6}  {"ok" if ok else "FALHA"}')
