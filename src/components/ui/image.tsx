import * as React from 'react'

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  // Mantido por compatibilidade com os componentes da app: "fit" mostra a imagem inteira, "fill" corta.
  fittingType?: 'fit' | 'fill'
}

// Imagem simples, com carregamento preguiçoso. Se falhar, some (sem placeholder partido).
export function Image({ fittingType = 'fill', className, alt, onError, ...props }: ImageProps) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return null
  return (
    <img
      {...props}
      alt={alt ?? ''}
      loading="lazy"
      className={`${fittingType === 'fit' ? 'object-contain' : 'object-cover'} ${className ?? ''}`}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
    />
  )
}
