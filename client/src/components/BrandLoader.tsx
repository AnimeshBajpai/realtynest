import { cn } from '../lib/utils'

/**
 * Branded loader — animated building icon that pulses.
 * Use size="sm" for inline buttons, "md" for cards, "lg" for full-page.
 */
export default function BrandLoader({
  size = 'sm',
  className,
}: {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(sizeMap[size], 'animate-pulse', className)}
    >
      {/* Building body */}
      <rect x="3" y="6" width="18" height="16" rx="1.5" className="fill-primary/20 stroke-primary" strokeWidth="1.5" />
      {/* Roof */}
      <path d="M1 6l11-4 11 4" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Windows row 1 */}
      <rect x="6" y="9" width="3" height="3" rx="0.5" className="fill-primary" />
      <rect x="15" y="9" width="3" height="3" rx="0.5" className="fill-primary" />
      {/* Windows row 2 */}
      <rect x="6" y="14" width="3" height="3" rx="0.5" className="fill-primary/60" />
      <rect x="15" y="14" width="3" height="3" rx="0.5" className="fill-primary/60" />
      {/* Door */}
      <rect x="10" y="16" width="4" height="6" rx="0.75" className="fill-primary" />
    </svg>
  )
}

/** Full-page centered loader */
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <BrandLoader size="lg" />
      <span className="text-sm text-text-secondary animate-pulse">Loading...</span>
    </div>
  )
}

/** Inline button loader — replaces Loader2 in buttons */
export function ButtonLoader({ className }: { className?: string }) {
  return <BrandLoader size="sm" className={className} />
}
