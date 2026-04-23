import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import MapView from '../components/MapView'
import PointModal from '../components/PointModal'
import { fetchPoints, fetchProfile } from '../api'

function toUrl(v) {
  if (!v) return v
  return v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`
}

const SOCIAL = [
  { key: 'email',     icon: '✉',  getHref: (v) => `mailto:${v}`, internal: true },
  { key: 'phone',     icon: '☎',  getHref: (v) => `tel:${v}`,    internal: true },
  { key: 'linkedin',  icon: 'in', getHref: toUrl,                 internal: false },
  { key: 'instagram', icon: '◎',  getHref: toUrl,                 internal: false },
  { key: 'website',   icon: '⊕',  getHref: toUrl,                 internal: false },
]

function SocialLink({ icon, href, value, internal, isText }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <a
        href={href}
        target={!internal ? '_blank' : undefined}
        rel="noreferrer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 30, height: 30,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          borderRadius: '50%',
          textDecoration: 'none',
          fontSize: isText ? '0.65rem' : '0.85rem',
          fontWeight: isText ? 700 : 400,
          color: '#374151',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          transform: hovered ? 'scale(1.15)' : 'scale(1)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
      >
        {icon}
      </a>
      {hovered && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(17,17,17,0.88)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: 6,
          fontSize: '0.7rem',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 2000,
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}>
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%',
            transform: 'translateX(-50%)',
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '5px solid rgba(17,17,17,0.88)',
          }} />
          {value}
        </div>
      )}
    </div>
  )
}

function Avatar({ profile }) {
  const initials = (profile.name || 'M')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (profile.avatar) {
    return (
      <img
        src={`/uploads/${profile.avatar}`}
        alt={profile.name}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.9)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      />
    )
  }
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%',
      background: 'linear-gradient(135deg,#374151,#111)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontSize: '0.78rem', fontWeight: 700,
      flexShrink: 0, border: '2px solid rgba(255,255,255,0.6)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      {initials}
    </div>
  )
}

export default function MapPage() {
  const [points, setPoints]   = useState([])
  const [profile, setProfile] = useState({ name: 'Maja Saveva', subtitle: 'Digital Portfolio' })
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchPoints(), fetchProfile()])
      .then(([pts, prof]) => {
        setPoints(pts)
        if (prof && (prof.name || prof.subtitle)) setProfile(prof)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const activeSocials = SOCIAL.filter(({ key }) => profile[key])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {loading ? (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: '#f0f0f0', zIndex: 1000,
          flexDirection: 'column', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #e5e7eb',
            borderTop: '3px solid #374151', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Loading map…</span>
        </div>
      ) : (
        <MapView points={points} onPointClick={setSelected} />
      )}

      {/* ── Top-centre header ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '16px 0 0', pointerEvents: 'none',
        gap: 8,
      }}>
        {/* Name pill */}
        <div style={{
          background: 'rgba(255,255,255,0.93)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: 50,
          padding: '8px 20px 8px 10px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.13)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Avatar profile={profile} />
          <div>
            <div style={{ fontSize: '0.98rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f0f0f', lineHeight: 1.2 }}>
              {profile.name || 'Maja Saveva'}
            </div>
            <div style={{ fontSize: '0.6rem', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9ca3af', marginTop: 1 }}>
              {profile.subtitle || 'Digital Portfolio'}
            </div>
          </div>
        </div>

        {/* Social links row */}
        {activeSocials.length > 0 && (
          <div style={{ display: 'flex', gap: 6, pointerEvents: 'all' }}>
            {activeSocials.map(({ key, icon, getHref, internal }) => (
              <SocialLink
                key={key}
                icon={icon}
                href={getHref(profile[key])}
                value={profile[key]}
                internal={internal}
                isText={key === 'linkedin'}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Experience count badge (top-right) ── */}
      {!loading && (
        <div style={{
          position: 'absolute', top: 20, right: 16, zIndex: 1000,
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 20, padding: '6px 14px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)', textAlign: 'center',
        }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111', lineHeight: 1 }}>
            {points.length}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#9ca3af', marginTop: 2, letterSpacing: '0.05em' }}>
            {points.length === 1 ? 'experience' : 'experiences'}
          </div>
        </div>
      )}

      {/* ── Admin link (bottom-right) ── */}
      <Link to="/admin" style={{
        position: 'absolute', bottom: 32, right: 16, zIndex: 1000,
        background: 'rgba(17,17,17,0.75)', color: 'white',
        padding: '7px 15px', borderRadius: 6,
        textDecoration: 'none', fontSize: '0.76rem', fontWeight: 500,
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)', letterSpacing: '0.02em',
      }}>
        ⚙ Admin
      </Link>

      {selected && <PointModal point={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
