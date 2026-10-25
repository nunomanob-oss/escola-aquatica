import { createFileRoute } from '@tanstack/react-router'
import Painel from '@/pages/Painel'

export const Route = createFileRoute('/_authed/painel')({ ssr: false, component: Painel })
