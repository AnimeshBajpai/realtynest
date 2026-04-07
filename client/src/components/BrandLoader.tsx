/**
 * Branded loader — animated building icon with construction effect.
 * Windows light up sequentially, giving a "building coming alive" feel.
 */

const style = `
@keyframes rn-build {
  0%   { transform: translateY(4px) scale(0.95); opacity: 0.5; }
  50%  { transform: translateY(0) scale(1.05); opacity: 1; }
  100% { transform: translateY(4px) scale(0.95); opacity: 0.5; }
}
@keyframes rn-win1 { 0%,100%{ opacity:0.2 } 25%{ opacity:1 } }
@keyframes rn-win2 { 0%,100%{ opacity:0.2 } 50%{ opacity:1 } }
@keyframes rn-win3 { 0%,100%{ opacity:0.2 } 75%{ opacity:1 } }
@keyframes rn-win4 { 0%,100%{ opacity:0.15 } 60%{ opacity:0.9 } }
@keyframes rn-door { 0%,100%{ opacity:0.6 } 50%{ opacity:1 } }
`

const PRIMARY = '#4f46e5'
const PRIMARY20 = 'rgba(79,70,229,0.2)'
const PRIMARY60 = 'rgba(79,70,229,0.6)'

function BuildingIcon({ size }: { size: number }) {
  return (
    <>
      <style>{style}</style>
      <svg
        viewBox="0 0 24 26"
        fill="none"
        width={size}
        height={size}
        style={{ animation: 'rn-build 1.4s ease-in-out infinite' }}
      >
        {/* Building body */}
        <rect x="3" y="6" width="18" height="18" rx="1.5" fill={PRIMARY20} stroke={PRIMARY} strokeWidth="1.5" />
        {/* Roof */}
        <path d="M1 6l11-4 11 4" stroke={PRIMARY} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Windows row 1 — light up sequentially */}
        <rect x="6" y="9" width="3" height="3" rx="0.5" fill={PRIMARY}
          style={{ animation: 'rn-win1 1.6s ease-in-out infinite' }} />
        <rect x="10.5" y="9" width="3" height="3" rx="0.5" fill={PRIMARY}
          style={{ animation: 'rn-win2 1.6s ease-in-out infinite' }} />
        <rect x="15" y="9" width="3" height="3" rx="0.5" fill={PRIMARY}
          style={{ animation: 'rn-win3 1.6s ease-in-out infinite' }} />
        {/* Windows row 2 */}
        <rect x="6" y="14" width="3" height="3" rx="0.5" fill={PRIMARY60}
          style={{ animation: 'rn-win3 1.6s ease-in-out infinite' }} />
        <rect x="10.5" y="14" width="3" height="3" rx="0.5" fill={PRIMARY60}
          style={{ animation: 'rn-win1 1.6s ease-in-out infinite' }} />
        <rect x="15" y="14" width="3" height="3" rx="0.5" fill={PRIMARY60}
          style={{ animation: 'rn-win2 1.6s ease-in-out infinite' }} />
        {/* Door */}
        <rect x="9.5" y="18" width="5" height="6" rx="0.75" fill={PRIMARY}
          style={{ animation: 'rn-door 1.6s ease-in-out infinite' }} />
      </svg>
    </>
  )
}

/** Default branded loader with configurable size */
export default function BrandLoader({
  size = 'md',
  label,
}: {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}) {
  const px = { sm: 20, md: 36, lg: 56 }[size]
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <BuildingIcon size={px} />
      {label && (
        <span style={{ fontSize: size === 'sm' ? 10 : 12, color: '#6b7280', animation: 'rn-door 1.6s ease-in-out infinite' }}>
          {label}
        </span>
      )}
    </div>
  )
}

/** Full-page centered loader — prominent building animation */
export function PageLoader({ label = 'Loading...' }: { label?: string } = {}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '80px 0', gap: 12,
    }}>
      <BuildingIcon size={64} />
      <span style={{ fontSize: 14, fontWeight: 500, color: '#6b7280', animation: 'rn-door 1.6s ease-in-out infinite' }}>
        {label}
      </span>
    </div>
  )
}

/** Inline button loader — small building for inside buttons */
export function ButtonLoader() {
  return <BuildingIcon size={18} />
}

/**
 * Semi-transparent overlay with centered building animation.
 * Wrap any section/page to show during API actions.
 *
 * Usage: {saving && <ActionOverlay label="Saving..." />}
 */
export function ActionOverlay({ label = 'Please wait...' }: { label?: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(2px)',
    }}>
      <BuildingIcon size={72} />
      <span style={{
        marginTop: 16, fontSize: 15, fontWeight: 600, color: PRIMARY,
        animation: 'rn-door 1.6s ease-in-out infinite',
      }}>
        {label}
      </span>
    </div>
  )
}
