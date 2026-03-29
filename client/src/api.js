const BASE = '/api'

function authHeaders() {
  const token = localStorage.getItem('map_portfolio_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchPoints() {
  const res = await fetch(`${BASE}/points`)
  if (!res.ok) throw new Error('Failed to fetch points')
  return res.json()
}

export async function fetchPoint(id) {
  const res = await fetch(`${BASE}/points/${id}`)
  if (!res.ok) throw new Error('Failed to fetch point')
  return res.json()
}

export async function createPoint(formData) {
  const res = await fetch(`${BASE}/points`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to create point')
  }
  return res.json()
}

export async function updatePoint(id, formData) {
  const res = await fetch(`${BASE}/points/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update point')
  }
  return res.json()
}

export async function deletePoint(id) {
  const res = await fetch(`${BASE}/points/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete point')
  return res.json()
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Login failed')
  }
  return res.json()
}

export async function fetchProfile() {
  const res = await fetch(`${BASE}/profile`)
  if (!res.ok) throw new Error('Failed to fetch profile')
  return res.json()
}

export async function updateProfile(formData) {
  const res = await fetch(`${BASE}/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to update profile')
  }
  return res.json()
}
