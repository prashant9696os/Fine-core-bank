import { useState } from 'react'
import { apiRequest, saveToken } from '../services/api'
import './Login.css'

export default function Login({ onLoginSuccess, onShowRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      })

      saveToken(data.access_token)

      setEmail('')
      setPassword('')

      onLoginSuccess(data.access_token)
    } catch (err) {
      setError(err.message || 'Unable to login. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <div className="brand-icon">F</div>
          <span>FINE CORE</span>
        </div>

        <div className="auth-visual-content">
          <span className="visual-label">SMART BANKING EXPERIENCE</span>

          <h1>Banking made simple. Life made better.</h1>

          <p>
            Manage your money, track transactions and enjoy
            secure digital banking with Fine Core.
          </p>

          <div className="visual-card">
            <span>YOUR FINANCIAL PARTNER</span>
            <h2>Bank with confidence.</h2>

            <div className="visual-card-bottom">
              <span>FINE CORE BANKING</span>
              <span>FC • 2026</span>
            </div>
          </div>
        </div>

        <p className="visual-footer">
          Secure banking. Smarter future.
        </p>
      </section>

      <section className="auth-form-section">
        <form
          className="auth-card"
          onSubmit={handleLogin}
          autoComplete="off"
        >
          <div className="mobile-brand">
            <div className="brand-icon">F</div>
            <span>FINE CORE</span>
          </div>

          <span className="form-eyebrow">WELCOME BACK</span>

          <h2>Sign in to your account</h2>

          <p className="form-description">
            Enter your credentials to access your banking dashboard.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <label htmlFor="email">Email address</label>

          <input
            id="email"
            name="fine-core-login-email"
            className="auth-input"
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="fine-core-login-password"
            className="auth-input"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          <button
            className="auth-submit-button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
            {!loading && <span>→</span>}
          </button>

          <div className="auth-register-link">
            <span>Don't have an account?</span>

            <button
              type="button"
              onClick={onShowRegister}
            >
              Create New Account
            </button>
          </div>

          <div className="auth-security">
            <span>🔒</span>
            Your banking information is protected.
          </div>

          <p className="auth-copyright">
            © 2026 Fine Core Banking. All rights reserved.
          </p>
        </form>
      </section>
    </main>
  )
}