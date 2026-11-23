
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem('access_token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed. Please try again.')
  }

  return data
}

export function saveToken(token) {
  sessionStorage.setItem('access_token', token)
}

export function clearToken() {
  sessionStorage.removeItem('access_token')
}
