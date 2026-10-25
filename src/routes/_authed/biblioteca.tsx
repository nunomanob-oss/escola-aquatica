import { createFileRoute } from '@tanstack/react-router'
import Biblioteca from '@/pages/Biblioteca'

export const Route = createFileRoute('/_authed/biblioteca')({ ssr: false, component: Biblioteca })
