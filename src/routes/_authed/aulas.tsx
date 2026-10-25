import { createFileRoute } from '@tanstack/react-router'
import Treinos from '@/pages/Treinos'

export const Route = createFileRoute('/_authed/aulas')({ ssr: false, component: Treinos })
