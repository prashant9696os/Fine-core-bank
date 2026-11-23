import { useState } from 'react'
import {
  Landmark, User, Mail, Phone, MapPin, Lock, ArrowRight, ShieldCheck,
} from 'lucide-react'
import { apiRequest } from '../services/api'

export default function Register() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    gender: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleRegister(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      setSuccess('Registration successful! You can now sign in.')
      setForm({
        full_name: '',
        email: '',
        mobile: '',
        address: '',
        gender: '',
        password: '',
      })
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <span className="login-brand-icon"><Landmark size={25} /></span>
          <span>FINE CORE<small>SMART BANKING</small></span>
        </div>

        <div className="login-promo">
          <span className="login-label">YOUR FINANCIAL JOURNEY</span>
          <h1>Bank smarter.<br />Live better.<br /><span>Start today.</span></h1>
          <p>Create your account and manage your banking in one place.</p>
        </div>

        <div className="login-security">
          <ShieldCheck size={18} /> Secure account registration
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={handleRegister}>
          <span className="login-welcome">GET STARTED</span>
          <h2>Create your account</h2>
          <p className="login-subtitle">Enter your details to register with Fine Core.</p>

          {error && <div className="login-error" role="alert">{error}</div>}
          {success && <div className="register-success" role="status">{success}</div>}

          <label htmlFor="full_name">Full name</label>
          <div className="login-input">
            <User size={18} />
            <input id="full_name" name="full_name" placeholder="Your full name"
              value={form.full_name} onChange={update} required />
          </div>

          <label htmlFor="register-email">Email address</label>
          <div className="login-input">
            <Mail size={18} />
            <input id="register-email" name="email" type="email"
              placeholder="you@example.com" value={form.email}
              onChange={update} required />
          </div>

          <label htmlFor="mobile">Mobile number</label>
          <div className="login-input">
            <Phone size={18} />
            <input id="mobile" name="mobile" type="tel"
              placeholder="Mobile number" value={form.mobile}
              onChange={update} required />
          </div>

          <label htmlFor="address">Address</label>
          <div className="login-input">
            <MapPin size={18} />
            <input id="address" name="address" placeholder="Your address"
              value={form.address} onChange={update} required />
          </div>

          <label htmlFor="gender">Gender</label>
          <div className="login-input">
            <select id="gender" name="gender" value={form.gender}
              onChange={update} required>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <label htmlFor="register-password">Password</label>
          <div className="login-input">
            <Lock size={18} />
            <input id="register-password" name="password" type="password"
              placeholder="Create a password" value={form.password}
              onChange={update} required minLength={8} />
          </div>

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
            <ArrowRight size={18} />
          </button>

          <p className="register-login-link">
            Already registered? <a href="/?login=1">Sign in</a>
          </p>
        </form>
      </section>
    </main>
  )
}