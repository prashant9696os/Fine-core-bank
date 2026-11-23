
import { useState } from 'react'
import {
  Landmark,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { saveToken } from '../services/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const body = new URLSearchParams({
        username: email,
        password,
      })

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed.')
      }

      if (!data.access_token) {
        throw new Error('The server did not return an access token.')
      }

      saveToken(data.access_token)
      window.location.href = '/'
    } catch (err) {
      setError(err.message || 'Unable to connect to the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="login-brand-icon">
            <Landmark size={25} />
          </span>
          <span>
            FINE CORE
            <small>SMART BANKING</small>
          </span>
        </div>

        <div className="login-promo">
          <span className="login-label">BANKING, REIMAGINED</span>
          <h1>
            Your money.
            <br />
            Your future.
            <br />
            <span>Your control.</span>
          </h1>
          <p>Manage your finances with clarity, confidence and security.</p>
        </div>

        <div className="login-security">
          <ShieldCheck size={18} />
          Secure access to your account
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={handleLogin}>
          <span className="login-welcome">WELCOME BACK</span>
          <h2>Sign in to Fine Core</h2>
          <p className="login-subtitle">
            Enter your account details to continue.
          </p>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <label htmlFor="email">Email address</label>
          <div className="login-input">
            <Mail size={18} />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="login-input">
            <Lock size={18} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in securely'}
            <ArrowRight size={18} />
          </button>

          <p className="register-login-link">
            Don't have an account? <a href="/register">Create account</a>
          </p>

          <div className="login-form-footer">
            <ShieldCheck size={16} />
            Your credentials are protected.
          </div>
        </form>
      </section>
    </main>
  )
}
