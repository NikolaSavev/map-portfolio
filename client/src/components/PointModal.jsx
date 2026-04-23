import { useState, useEffect } from 'react'
import { UPLOAD_BASE } from '../api'

export default function PointModal({ point, onClose }) {
  const [lightboxImg, setLightboxImg] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (lightboxImg) setLightboxImg(null)
        else onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [lightboxImg, onClose])

  const heroImage = point.thumbnail || point.images?.[0] || null

  return (
    <>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 24px)) }
          to   { opacity: 1; transform: translate(-50%, -50%) }
        }
        .point-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2001;
          background: white;
          border-radius: 16px;
          width: 90vw;
          max-width: 1200px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          animation: slideUp 0.2s ease;
        }
        @media (max-width: 640px) {
          .point-modal {
            width: 100%;
            max-width: 100%;
            height: 100%;
            max-height: 100%;
            top: 0; left: 0;
            transform: none;
            border-radius: 0;
            animation: fadeIn 0.15s ease;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          zIndex: 2000, backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.15s ease',
        }}
      />

      <div className="point-modal">
        {/* Hero image */}
        {heroImage ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              background: '#111', display: 'flex',
              justifyContent: 'center', alignItems: 'center',
              maxHeight: '50vh', overflow: 'hidden',
            }}>
              <img
                src={`${UPLOAD_BASE}/uploads/${heroImage.filename}`}
                alt={point.title}
                style={{ maxWidth: '100%', maxHeight: '50vh', width: 'auto', height: 'auto', display: 'block' }}
              />
            </div>
            <div style={{ padding: '16px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{point.title}</h2>
                <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.9rem' }}>{point.short_text}</p>
              </div>
              <button onClick={onClose} style={closeBtnStyle}>✕</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{point.title}</h2>
              <p style={{ color: '#6b7280', marginTop: 4, fontSize: '0.9rem' }}>{point.short_text}</p>
            </div>
            <button onClick={onClose} style={closeBtnStyle}>✕</button>
          </div>
        )}

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px 28px', flex: 1 }}>
          <p style={{ color: '#374151', lineHeight: 1.78, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
            {point.full_text}
          </p>

          {point.images?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c4c4c4', marginBottom: 12 }}>
                {point.images.length === 1 ? '1 Photo' : `${point.images.length} Photos`}
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: point.images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 10,
              }}>
                {point.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setLightboxImg(img)}
                    style={{
                      borderRadius: 10, overflow: 'hidden', cursor: 'zoom-in',
                      background: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center',
                      transition: 'opacity 0.15s', aspectRatio: point.images.length === 1 ? 'unset' : '4/3',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <img
                      src={`${UPLOAD_BASE}/uploads/${img.filename}`}
                      alt=""
                      style={{
                        width: '100%',
                        height: point.images.length === 1 ? 'auto' : '100%',
                        objectFit: point.images.length === 1 ? 'contain' : 'cover',
                        display: 'block',
                        borderRadius: 10,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={`${UPLOAD_BASE}/uploads/${lightboxImg.filename}`}
            alt=""
            style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 6 }}
          />
        </div>
      )}
    </>
  )
}

const closeBtnStyle = {
  background: '#f3f4f6', border: 'none', borderRadius: '50%',
  width: 32, height: 32, cursor: 'pointer', fontSize: '0.9rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, marginLeft: 12,
}
