import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchPoints, deletePoint } from '../api'
import PointForm from '../components/PointForm'
import ProfileForm from '../components/ProfileForm'

export default function AdminDashboard() {
  const [tab, setTab]           = useState('locations')
  const [points, setPoints]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editPoint, setEditPoint] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()

  function loadPoints() {
    setLoading(true)
    fetchPoints()
      .then(setPoints)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(loadPoints, [])

  function logout() {
    localStorage.removeItem('map_portfolio_token')
    navigate('/admin/login')
  }

  function openNew() { setEditPoint(null); setFormOpen(true) }
  function openEdit(p) { setEditPoint(p); setFormOpen(true) }

  async function handleDelete(point) {
    if (!window.confirm(`Delete "${point.title}"? This cannot be undone.`)) return
    setDeletingId(point.id)
    try {
      await deletePoint(point.id)
      setPoints((prev) => prev.filter((p) => p.id !== point.id))
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleFormSave(saved) {
    if (editPoint) setPoints((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
    else setPoints((prev) => [saved, ...prev])
    setFormOpen(false)
    setEditPoint(null)
  }

  const TAB_STYLE = (active) => ({
    padding: '8px 18px', border: 'none', borderRadius: 7,
    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
    background: active ? '#111' : 'transparent',
    color: active ? 'white' : '#6b7280',
    transition: 'all 0.15s',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: 'white', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px', height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Map Portfolio</span>
          <span style={{ color: '#d1d5db' }}>|</span>
          <Link to="/" style={{ fontSize: '0.8rem', color: '#6b7280', textDecoration: 'none', fontWeight: 500 }}>
            ← View Map
          </Link>
        </div>
        <button onClick={logout} style={{ background: 'none', border: '1px solid #e5e7eb', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
          Logout
        </button>
      </header>

      <main style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: '#f3f4f6', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          <button style={TAB_STYLE(tab === 'locations')} onClick={() => setTab('locations')}>Locations</button>
          <button style={TAB_STYLE(tab === 'profile')} onClick={() => setTab('profile')}>Profile &amp; Info</button>
        </div>

        {/* Locations tab */}
        {tab === 'locations' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>Locations</h2>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {loading ? 'Loading…' : `${points.length} location${points.length !== 1 ? 's' : ''} on the map`}
                </p>
              </div>
              <button
                onClick={openNew}
                style={{ background: '#111', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 7, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
              >
                + Add Location
              </button>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>Loading…</div>}

            {!loading && points.length === 0 && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '0.9rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗺️</div>
                No locations yet. Add your first one!
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {points.map((point) => (
                <div
                  key={point.id}
                  style={{
                    background: 'white', borderRadius: 10, border: '1px solid #e5e7eb',
                    padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
                >
                  <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {point.thumbnail ? (
                      <img src={`/uploads/${point.thumbnail.filename}`} alt={point.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: '1.4rem' }}>📍</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{point.title}</div>
                    <div style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: 3 }}>{point.short_text}</div>
                    <div style={{ color: '#c4c4c4', fontSize: '0.72rem' }}>
                      {point.lat.toFixed(4)}, {point.lng.toFixed(4)} · {point.images?.length || 0} image{point.images?.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                    <button onClick={() => openEdit(point)} style={{ background: '#f3f4f6', border: 'none', padding: '7px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, color: '#374151' }}>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(point)}
                      disabled={deletingId === point.id}
                      style={{ background: '#fef2f2', color: '#b91c1c', border: 'none', padding: '7px 14px', borderRadius: 6, cursor: deletingId === point.id ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      {deletingId === point.id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '28px 28px' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>Profile &amp; Contact Info</h2>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: 24 }}>
              This info appears on your public map page — name, photo, and social links.
            </p>
            <ProfileForm />
          </div>
        )}
      </main>

      {formOpen && (
        <PointForm
          point={editPoint}
          onSave={handleFormSave}
          onClose={() => { setFormOpen(false); setEditPoint(null) }}
        />
      )}
    </div>
  )
}
