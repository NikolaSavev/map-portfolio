import { useState, useEffect, useRef } from 'react'
import { fetchProfile, updateProfile } from '../api'

const inputStyle = {
  display: 'block', width: '100%',
  padding: '9px 11px', border: '1px solid #d1d5db',
  borderRadius: 7, fontSize: '0.875rem',
  outline: 'none', fontFamily: 'inherit', color: '#111',
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

export default function ProfileForm() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const fileRef = useRef()

  useEffect(() => {
    fetchProfile()
      .then((p) => setProfile(p || {}))
      .catch(() => setProfile({}))
      .finally(() => setLoading(false))
  }, [])

  function set(key, val) {
    setProfile((prev) => ({ ...prev, [key]: val }))
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSaved(false)
    try {
      const fd = new FormData()
      fd.append('name', profile.name || '')
      fd.append('subtitle', profile.subtitle || '')
      fd.append('bio', profile.bio || '')
      fd.append('email', profile.email || '')
      fd.append('phone', profile.phone || '')
      fd.append('linkedin', profile.linkedin || '')
      fd.append('instagram', profile.instagram || '')
      fd.append('website', profile.website || '')
      if (avatarFile) fd.append('avatar', avatarFile)

      const updated = await updateProfile(fd)
      setProfile(updated)
      setAvatarFile(null)
      setAvatarPreview(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>

  const currentAvatar = avatarPreview || (profile.avatar ? `/uploads/${profile.avatar}` : null)
  const initials = (profile.name || 'M').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: 7, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        {saved && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '10px 14px', borderRadius: 7, fontSize: '0.85rem' }}>
            Profile saved successfully.
          </div>
        )}

        {/* Avatar */}
        <Field label="Profile Photo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="avatar"
                  style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#374151,#111)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '1.2rem', fontWeight: 700,
                  border: '3px solid #e5e7eb',
                }}>
                  {initials}
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                background: '#111', color: 'white',
                borderRadius: '50%', width: 22, height: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', border: '2px solid white',
              }}>
                ✎
              </div>
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                Choose photo
              </button>
              <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>Shown as a circle next to your name on the map</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>
        </Field>

        {/* Name + Subtitle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Name">
            <input value={profile.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="Maja Saveva" style={inputStyle} />
          </Field>
          <Field label="Tagline" hint="(shown under name)">
            <input value={profile.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="Digital Portfolio" style={inputStyle} />
          </Field>
        </div>

        {/* Bio */}
        <Field label="Bio" hint="(optional short description)">
          <textarea
            value={profile.bio || ''}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="A short bio or description…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </Field>

        {/* Contact */}
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#c4c4c4', marginBottom: 12 }}>
            Contact &amp; Social Links
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Email">
                <input value={profile.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="hello@example.com" type="email" style={inputStyle} />
              </Field>
              <Field label="Phone">
                <input value={profile.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+1 234 567 8900" style={inputStyle} />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="LinkedIn URL">
                <input value={profile.linkedin || ''} onChange={(e) => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" style={inputStyle} />
              </Field>
              <Field label="Instagram URL">
                <input value={profile.instagram || ''} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/…" style={inputStyle} />
              </Field>
            </div>
            <Field label="Website">
              <input value={profile.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://yourwebsite.com" style={inputStyle} />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 28px', background: saving ? '#9ca3af' : '#111',
              color: 'white', border: 'none', borderRadius: 7,
              fontSize: '0.875rem', fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>
    </form>
  )
}
