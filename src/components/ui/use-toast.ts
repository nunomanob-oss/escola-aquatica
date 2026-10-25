import { toast as sonnerToast } from 'sonner'

// Compatível com a chamada antiga: toast({ title, description, variant: "destructive" }).
export function toast({
  title,
  description,
  variant,
}: {
  title: string
  description?: string
  variant?: 'default' | 'destructive'
}) {
  if (variant === 'destructive') sonnerToast.error(title, { description })
  else sonnerToast.success(title, { description })
}
