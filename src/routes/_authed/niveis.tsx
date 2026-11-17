import { createFileRoute } from '@tanstack/react-router'
import Niveis from '@/pages/Niveis'

export const Route = createFileRoute('/_authed/niveis')({ ssr: false, component: Niveis })
