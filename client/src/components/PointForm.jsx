import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { createPoint, updatePoint, UPLOAD_BASE } from '../api'

// ── Geocoding autocomplete using Nominatim (no API key needed) ──
function LocationSearch({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef()

  function handleChange(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(timerRef.current)
    if (val.length < 3) { setResults([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=6&accept-language=en`
        const res = await fetch(url, { headers: { 'User-Agent': 'MapPortfolio/1.0' } })
        const data = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch { /* network error — silently ignore */ }
      setSearching(false)
    }, 450)
  }

  function handleSelect(r) {
    setQuery(r.display_name)
    setResults([])
    setOpen(false)
    onSelect(parseFloat(r.lat), parseFloat(r.lon))
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search location… e.g. Kocani, Macedonia"
          style={{ ...inputStyle, paddingRight: 36 }}
        />
        {searching && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: '#9ca3af' }}>
            ⌛
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9999,
          maxHeight: 210, overflowY: 'auto',
        }}>
          {results.map((r, i) => {
            const parts = r.display_name.split(',')
            const primary = parts[0].trim()
            const secondary = parts.slice(1).join(',').trim()
            return (
              <div
                key={i}
                onMouseDown={() => handleSelect(r)}
                style={{
                  padding: '9px 13px', cursor: 'pointer', lineHeight: 1.4,
                  borderTop: i > 0 ? '1px solid #f3f4f6' : 'none',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#111' }}>{primary}</div>
                {secondary && <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 1 }}>{secondary}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Map that shows the pinned location; click to fine-tune ──
const PIN_ICON = new L.DivIcon({
  className: '',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#e74c3c;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function ClickHandler({ onChange }) {
  useMapEvents({ click: (e) => onChange(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyToOnChange({ lat, lng }) {
  const map = useMap()
  const prevRef = useRef(null)
  useEffect(() => {
    if (lat != null && lng != null) {
      const key = `${lat},${lng}`
      if (key !== prevRef.current) {
        prevRef.current = key
        map.flyTo([lat, lng], Math.max(map.getZoom(), 10), { animate: true, duration: 0.5 })
      }
    }
  }, [lat, lng])
  return null
}

function LocationMap({ lat, lng, onChange }) {
  const hasPos = lat != null && lng != null
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb', marginTop: 8 }}>
      <MapContainer
        center={hasPos ? [lat, lng] : [20, 0]}
        zoom={hasPos ? 8 : 2}
        style={{ height: 180, cursor: 'crosshair' }}
        zoomControl
      >
        <TileLayer
          attribution='&copy; OpenStreetMap &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <FlyToOnChange lat={lat} lng={lng} />
        <ClickHandler onChange={onChange} />
        {hasPos && <Marker position={[lat, lng]} icon={PIN_ICON} />}
      </MapContainer>
      <div style={{ padding: '6px 10px', background: '#f9fafb', borderTop: '1px solid #e5e7eb', fontSize: '0.72rem', color: '#9ca3af' }}>
        {hasPos
          ? `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)} — Click map to fine-tune`
          : 'Search above or click the map to set a location'}
      </div>
    </div>
  )
}

// ── Helpers ──
const inputStyle = {
  display: 'block', width: '100%',
  padding: '9px 11px', border: '1px solid #d1d5db',
  borderRadius: 7, fontSize: '0.875rem',
  outline: 'none', fontFamily: 'inherit', color: '#111',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 7 }}>
        {label}{required && <span style={{ color: '#e74c3c', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ── Main form ──
export default function PointForm({ point, onSave, onClose }) {
  const isEdit = !!point

  const [title, setTitle]         = useState(point?.title || '')
  const [shortText, setShortText] = useState(point?.short_text || '')
  const [fullText, setFullText]   = useState(point?.full_text || '')
  const [lat, setLat]             = useState(point?.lat != null ? point.lat : null)
  const [lng, setLng]             = useState(point?.lng != null ? point.lng : null)
  const [newImages, setNewImages]         = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [deleteImageIds, setDeleteImageIds] = useState([])
  const [thumbnailId, setThumbnailId]     = useState(point?.thumbnail?.id || point?.images?.[0]?.id || null)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const fileInputRef = useRef()

  function handleLocationChange(newLat, newLng) {
    setLat(parseFloat(newLat.toFixed(6)))
    setLng(parseFloat(newLng.toFixed(6)))
  }

  function handleFileChange(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setNewImages((prev) => [...prev, ...files])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreviews((prev) => [...prev, { url: ev.target.result }])
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removeNewImage(index) {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleDeleteImage(imgId) {
    setDeleteImageIds((prev) => prev.includes(imgId) ? prev.filter((id) => id !== imgId) : [...prev, imgId])
    if (thumbnailId === imgId) setThumbnailId(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (lat == null || lng == null) { setError('Please search for a location or click the map.'); return }
    setError('')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('short_text', shortText.trim())
      fd.append('full_text', fullText.trim())
      fd.append('lat', lat)
      fd.append('lng', lng)
      newImages.forEach((f) => fd.append('images', f))
      if (isEdit && deleteImageIds.length > 0) fd.append('delete_image_ids', JSON.stringify(deleteImageIds))
      if (thumbnailId) fd.append('thumbnail_image_id', String(thumbnailId))
      const saved = isEdit ? await updatePoint(point.id, fd) : await createPoint(fd)
      onSave(saved)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        .point-form-modal {
          position: fixed; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2001; background: white; border-radius: 14px;
          width: 90vw; max-width: 960px; max-height: 92vh;
          overflow: hidden; display: flex; flex-direction: column;
          box-shadow: 0 25px 80px rgba(0,0,0,0.3);
        }
        .point-form-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
        }
        @media (max-width: 760px) {
          .point-form-cols { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .point-form-modal {
            width: 100%; max-width: 100%;
            height: 100%; max-height: 100%;
            top: 0; left: 0; transform: none; border-radius: 0;
          }
        }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000 }} />

      <div className="point-form-modal">
        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{isEdit ? 'Edit Location' : 'New Location'}</h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 22px' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 13px', borderRadius: 7, fontSize: '0.85rem', marginBottom: 16 }}>{error}</div>
            )}

            <div className="point-form-cols">
              {/* Left column — text fields + images */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Title" required>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Orlando" style={inputStyle} />
                </Field>

                <Field label="Short Text" required>
                  <input value={shortText} onChange={(e) => setShortText(e.target.value)} required placeholder="e.g. May 2025" style={inputStyle} />
                </Field>

                <Field label="Full Description" required>
                  <textarea value={fullText} onChange={(e) => setFullText(e.target.value)} required placeholder="Write about this experience, what you did, memories…" rows={6} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65 }} />
                </Field>

                {/* Existing images (edit mode) */}
                {isEdit && point.images?.length > 0 && (
                  <Field label="Current Images">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {point.images.map((img) => {
                        const marked = deleteImageIds.includes(img.id)
                        const isThumb = thumbnailId === img.id
                        return (
                          <div key={img.id} style={{ position: 'relative', opacity: marked ? 0.35 : 1 }}>
                            <img
                              src={`${UPLOAD_BASE}/uploads/${img.filename}`}
                              alt=""
                              onClick={() => !marked && setThumbnailId(img.id)}
                              style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: 7, border: isThumb ? '2px solid #2563eb' : '2px solid transparent', cursor: marked ? 'default' : 'pointer', background: '#f3f4f6' }}
                            />
                            <button type="button" onClick={() => toggleDeleteImage(img.id)} style={{ position: 'absolute', top: -6, right: -6, background: marked ? '#16a34a' : '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {marked ? '↩' : '✕'}
                            </button>
                            {isThumb && !marked && (
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#2563eb', color: 'white', fontSize: '0.55rem', textAlign: 'center', borderRadius: '0 0 5px 5px', padding: '1px 0' }}>THUMB</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 6 }}>Click image to set as thumbnail · Click ✕ to remove</p>
                  </Field>
                )}

                {/* Upload new images */}
                <Field label="Upload Images">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: '2px dashed #d1d5db', borderRadius: 8, padding: '16px', textAlign: 'center', cursor: 'pointer', color: '#9ca3af', fontSize: '0.83rem', transition: 'border-color 0.15s, color 0.15s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#374151' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#9ca3af' }}
                  >
                    📷 Click to select images (multiple allowed)
                  </div>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  {imagePreviews.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {imagePreviews.map((p, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={p.url} alt="" style={{ width: 68, height: 68, objectFit: 'contain', borderRadius: 7, background: '#f3f4f6' }} />
                          <button type="button" onClick={() => removeNewImage(i)} style={{ position: 'absolute', top: -6, right: -6, background: '#dc2626', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </Field>
              </div>

              {/* Right column — location */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Field label="Location">
                  <LocationSearch onSelect={handleLocationChange} />
                  <LocationMap lat={lat} lng={lng} onChange={handleLocationChange} />
                  {lat != null && lng != null && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input value={lat} onChange={(e) => setLat(parseFloat(e.target.value) || null)} placeholder="Latitude" style={{ ...inputStyle, flex: 1, fontSize: '0.78rem' }} />
                      <input value={lng} onChange={(e) => setLng(parseFloat(e.target.value) || null)} placeholder="Longitude" style={{ ...inputStyle, flex: 1, fontSize: '0.78rem' }} />
                    </div>
                  )}
                </Field>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0, background: 'white' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', background: '#f3f4f6', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '9px 24px', background: saving ? '#9ca3af' : '#111', color: 'white', border: 'none', borderRadius: 7, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Location'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
