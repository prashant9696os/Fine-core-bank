
import { useState } from 'react'
import {
  Landmark,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  KeyRound,
} from 'lucide-react'
import { apiRequest } from '../services/api'

function Register({ onRegistered, onShowLogin }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    gender: '',
    password: '',
  })

  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('register')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          address: form.address.trim(),
        }),
      })

      setStep('otp')
      setSuccess(data.message || 'OTP sent successfully to your email.')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP.')
      return
    }

    setLoading(true)

    try {
      const data = await apiRequest('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      })

      if (!data.access_token) {
        throw new Error(
          data.message || 'OTP verified, but login token was not returned.'
        )
      }

      setSuccess('Email verified successfully. Opening your dashboard...')

      onRegistered(data.access_token)
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const data = await apiRequest('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
        }),
      })

      setSuccess(data.message || 'A new OTP has been sent to your email.')
      setOtp('')
    } catch (err) {
      setError(err.message || 'Could not resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <Landmark size={32} />
          <span>FinCore</span>
        </div>

        <div className="auth-visual-content">
          <h1>Banking made simple and secure.</h1>
          <p>
            Manage your money, track transactions, and experience secure
            digital banking with FinCore.
          </p>
        </div>

        <div className="auth-visual-footer">
          Secure Digital Banking Platform
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          {step === 'register' ? (
            <>
              <div className="auth-card-heading">
                <h2>Create your account</h2>
                <p>Enter your details to get started with FinCore.</p>
              </div>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <form onSubmit={handleRegister}>
                <div className="auth-input-wrapper">
                  <User size={18} />
                  <input
                    type="text"
                    name="full_name"
                    placeholder="Full Name"
                    value={form.full_name}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="auth-input-wrapper">
                  <Mail size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="auth-input-wrapper">
                  <Phone size={18} />
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="Mobile Number"
                    value={form.mobile}
                    onChange={handleChange}
                    minLength={10}
                    maxLength={15}
                    required
                  />
                </div>

                <div className="auth-input-wrapper">
                  <MapPin size={18} />
                  <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={form.address}
                    onChange={handleChange}
                    minLength={5}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="auth-input-wrapper">
                  <User size={18} />
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="auth-input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password (minimum 8 characters)"
                    value={form.password}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={128}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP...' : 'Create Account'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" onClick={onShowLogin}>
                  Login
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-card-heading">
                <div className="auth-otp-icon">
                  <ShieldCheck size={32} />
                </div>
                <h2>Verify your email</h2>
                <p>
                  We have sent a 6-digit OTP to
                  <strong> {form.email}</strong>.
                </p>
              </div>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <form onSubmit={handleVerifyOTP}>
                <div className="auth-input-wrapper">
                  <KeyRound size={18} />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(event) =>
                      setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>

              <div className="auth-otp-actions">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('register')
                    setOtp('')
                    setError('')
                    setSuccess('')
                  }}
                  disabled={loading}
                >
                  Back to Details
                </button>
              </div>

              <p className="auth-switch">
                Already have an account?{' '}
                <button type="button" onClick={onShowLogin}>
                  Login
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Register
