// Cliente das entidades: mesma forma de chamadas que a app antiga (list / filter / create / update / delete),
// mas cada chamada vai para uma função de servidor com a base de dados Postgres.
import { entityList, entityWrite } from "@/server/entities";

type Row = Record<string, any>;
type ListOptions = {
    limit?: number;
    sort?: string;
    cursor?: string;
    distinct?: string;
};

function makeEntity(
    name:
        | "Level"
        | "LevelContent"
        | "Exercise"
        | "WorkoutSheet"
        | "ClassSummary",
) {
    const fetchRows = async (
        query: Record<string, string | number | boolean> = {},
        options: ListOptions = {},
    ) => {
        const sort = options.sort ?? undefined;
        const descending = sort?.startsWith("-") ?? false;
        const rows = await entityList({
            data: {
                entity: name,
                query,
                sort: sort
                    ? (sort.replace(/^-/, "") as
                          | "order_index"
                          | "session_date"
                          | "date")
                    : undefined,
                descending,
                limit: options.limit ?? 500,
            },
        });
        return { items: rows as Row[], next_cursor: null as string | null };
    };

    return {
        list: (options: ListOptions = {}) => fetchRows({}, options),
        filter: async (
            query: Record<string, string | number | boolean> = {},
            options: ListOptions = {},
        ) => {
            const res = await fetchRows(query, options);
            if (!options.distinct) return res;
            // Valores distintos de um campo (ex.: subcategorias), calculados no cliente.
            const field = options.distinct;
            const values = [
                ...new Set(res.items.map((row) => row[field]).filter(Boolean)),
            ];
            return values;
        },
        create: (data: Row) =>
            entityWrite({
                data: { entity: name as "Exercise", op: "create", data },
            }),
        update: (id: string, data: Row) =>
            entityWrite({
                data: { entity: name as "Exercise", op: "update", id, data },
            }),
        delete: (id: string) =>
            entityWrite({
                data: { entity: name as "Exercise", op: "delete", id },
            }),
    };
}

export const entities = {
    Level: makeEntity("Level"),
    LevelContent: makeEntity("LevelContent"),
    Exercise: makeEntity("Exercise"),
    WorkoutSheet: makeEntity("WorkoutSheet"),
    ClassSummary: makeEntity("ClassSummary"),
};
