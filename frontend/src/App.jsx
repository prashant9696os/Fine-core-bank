
import { useEffect, useState } from 'react'
import {
  Landmark,
  LayoutDashboard,
  ArrowLeftRight,
  HandCoins,
  LogOut,
  Menu,
  Wallet,
  ShieldCheck,
  UserRound,
  X,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  Activity,
} from 'lucide-react'

import './App.css'
import Login from './pages/Login'
import Register from './pages/Register'
import Transaction from './pages/Transaction'
import MyAccounts from './pages/MyAccounts'
import Beneficiaries from './pages/Beneficiaries'
import {
  apiRequest,
  clearToken,
  saveToken,
} from './services/api'

export default function App() {
  const [token, setToken] = useState(() =>
    sessionStorage.getItem('access_token')
  )

  const [authPage, setAuthPage] = useState(
    window.location.pathname === '/register' ? 'register' : 'login'
  )

  const [authLoading, setAuthLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileError, setProfileError] = useState('')
  const [transactionOperation, setTransactionOperation] = useState('deposit')

  const [loanAmount, setLoanAmount] = useState('')
  const [loanPurpose, setLoanPurpose] = useState('')
  const [loanTerm, setLoanTerm] = useState('12')
  const [loans, setLoans] = useState([])
  const [loanLoading, setLoanLoading] = useState(false)
  const [loanSubmitting, setLoanSubmitting] = useState(false)
  const [loanError, setLoanError] = useState('')
  const [loanSuccess, setLoanSuccess] = useState('')

  useEffect(() => {
    let active = true

    async function verifySession() {
      if (!token) {
        if (active) {
          setProfile(null)
          setAuthLoading(false)
        }
        return
      }

      try {
        setAuthLoading(true)
        setProfileError('')

        const data = await apiRequest('/auth/me')

        if (active) {
          setProfile(data)
        }
      } catch (error) {
        if (active) {
          clearToken()
          setToken(null)
          setProfile(null)
          setProfileError('')
          setAuthPage('login')
          window.history.replaceState({}, '', '/')
        }
      } finally {
        if (active) {
          setAuthLoading(false)
        }
      }
    }

    verifySession()

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    if (!token) {
      setLoans([])
      return
    }

    let active = true

    async function loadLoans() {
      try {
        setLoanLoading(true)
        setLoanError('')

        const data = await apiRequest('/loans/me')

        if (active) {
          setLoans(data.loans || [])
        }
      } catch (error) {
        if (active) {
          setLoanError(error.message)
        }
      } finally {
        if (active) {
          setLoanLoading(false)
        }
      }
    }

    loadLoans()

    return () => {
      active = false
    }
  }, [token])

  function showAuthPage(nextPage) {
    setAuthPage(nextPage)

    window.history.pushState(
      {},
      '',
      nextPage === 'register' ? '/register' : '/'
    )
  }

  function handleLoginSuccess(accessToken) {
    saveToken(accessToken)
    setProfile(null)
    setAuthLoading(true)
    setToken(accessToken)
    window.history.replaceState({}, '', '/')
  }

  function logout() {
    clearToken()
    setToken(null)
    setProfile(null)
    setProfileError('')
    setMenuOpen(false)
    setAuthPage('login')
    setLoans([])
    setLoanError('')
    setLoanSuccess('')
    setLoanAmount('')
    setLoanPurpose('')
    setLoanTerm('12')
    window.history.replaceState({}, '', '/')
  }

  function goToSection(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })

    setMenuOpen(false)
  }

  function openTransaction(operation) {
    setTransactionOperation(operation)
    goToSection('transactions')
  }

  function handleNavigation(id) {
    if (id === 'monitoring') {
      window.open(
        'http://localhost:3000/d/adngmdh/91ef51b?from=now-6h&to=now&timezone=browser',
        '_blank',
        'noopener,noreferrer'
      )

      setMenuOpen(false)
      return
    }

    if (['deposit', 'withdraw', 'transfer'].includes(id)) {
      openTransaction(id)
    } else {
      goToSection(id)
    }
  }

  async function handleLoanSubmit(event) {
    event.preventDefault()

    setLoanError('')
    setLoanSuccess('')

    const amount = Number(loanAmount)
    const termMonths = Number(loanTerm)

    if (!Number.isFinite(amount) || amount <= 0) {
      setLoanError('Please enter a valid loan amount.')
      return
    }

    if (!loanPurpose.trim()) {
      setLoanError('Please enter the loan purpose.')
      return
    }

    if (!Number.isInteger(termMonths) || termMonths <= 0) {
      setLoanError('Please select a valid repayment duration.')
      return
    }

    try {
      setLoanSubmitting(true)

      const data = await apiRequest('/loans/apply', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          purpose: loanPurpose.trim(),
          term_months: termMonths,
        }),
      })

      setLoanSuccess(
        data.message || 'Your loan application was submitted successfully.'
      )

      setLoanAmount('')
      setLoanPurpose('')
      setLoanTerm('12')

      try {
        const updatedData = await apiRequest('/loans/me')
        setLoans(updatedData.loans || [])
      } catch (error) {
        setLoanError(
          'Your application was submitted, but loan history could not be refreshed.'
        )
      }
    } catch (error) {
      setLoanError(error.message)
    } finally {
      setLoanSubmitting(false)
    }
  }

  function getLoanStatusClass(status) {
    const normalizedStatus = String(status || '').toLowerCase()

    if (normalizedStatus === 'approved') {
      return 'loan-status-approved'
    }

    if (normalizedStatus === 'rejected') {
      return 'loan-status-rejected'
    }

    return 'loan-status-pending'
  }

  if (authLoading) {
    return (
      <div className="auth-loading">
        <Landmark size={32} />
        <h2>FINE CORE</h2>
        <p>Loading your secure banking session...</p>
      </div>
    )
  }

  if (!token) {
    return authPage === 'register' ? (
      <Register
        onRegistered={handleLoginSuccess}
        onShowLogin={() => showAuthPage('login')}
      />
    ) : (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onShowRegister={() => showAuthPage('register')}
      />
    )
  }

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'My Accounts', id: 'accounts', icon: Landmark },
    { name: 'Deposit', id: 'deposit', icon: ArrowDownToLine },
    { name: 'Withdraw', id: 'withdraw', icon: ArrowUpFromLine },
    { name: 'Transfer', id: 'transfer', icon: ArrowLeftRight },
    { name: 'Transaction History', id: 'transactions', icon: Wallet },
    { name: 'Beneficiaries', id: 'beneficiaries', icon: UserRound },
    { name: 'Loans', id: 'loans', icon: HandCoins },
    { name: 'My Profile', id: 'profile', icon: UserRound },
    { name: 'Monitoring Dashboard', id: 'monitoring', icon: Activity },
  ]

  const quickActions = [
    {
      title: 'Check Balance',
      description: 'View your available account balance.',
      icon: Eye,
      id: 'accounts',
      color: 'blue',
    },
    {
      title: 'Deposit Money',
      description: 'Add money to your bank account.',
      icon: ArrowDownToLine,
      id: 'deposit',
      color: 'green',
    },
    {
      title: 'Withdraw Money',
      description: 'Withdraw money from your bank account.',
      icon: ArrowUpFromLine,
      id: 'withdraw',
      color: 'orange',
    },
    {
      title: 'Transfer Money',
      description: 'Send money to another bank account.',
      icon: ArrowLeftRight,
      id: 'transfer',
      color: 'purple',
    },
    {
      title: 'Transaction History',
      description: 'Review your previous transactions.',
      icon: Wallet,
      id: 'transactions',
      color: 'cyan',
    },
    {
      title: 'Beneficiaries',
      description: 'Manage your saved beneficiaries.',
      icon: UserRound,
      id: 'beneficiaries',
      color: 'pink',
    },
    {
      title: 'Loan Management',
      description: 'Apply for a loan and track its status.',
      icon: HandCoins,
      id: 'loans',
      color: 'orange',
    },
    {
      title: 'My Profile',
      description: 'View your registered information.',
      icon: UserRound,
      id: 'profile',
      color: 'blue',
    },
    {
      title: 'Grafana Monitoring',
      description: 'Monitor API performance and system health.',
      icon: Activity,
      id: 'monitoring',
      color: 'purple',
    },
  ]

  const userName = profile?.full_name || 'My Account'

  return (
    <div className="app-layout">
      {menuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <Landmark size={25} />
          </div>

          <div>
            <h2>FINE CORE</h2>
            <span>Digital Banking</span>
          </div>

          <button
            type="button"
            className="mobile-menu-button sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="sidebar-label">MAIN MENU</p>

        <nav className="sidebar-navigation">
          {navigation.map(({ name, id, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className="sidebar-link"
              onClick={() => handleNavigation(id)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-security">
          <div className="security-icon">
            <ShieldCheck size={21} />
          </div>

          <strong>Secure Banking</strong>
          <p>Your financial information is protected.</p>
        </div>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-link logout-button"
            onClick={logout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="main-layout">
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={23} />
          </button>

          <div className="topbar-title">
            <span>YOUR FINANCIAL SPACE</span>
            <strong>Dashboard</strong>
          </div>

          <div className="topbar-actions">
            <div className="topbar-secure">
              <ShieldCheck size={17} />
              <span>Secure Session</span>
            </div>

            <div className="topbar-user">
              <div className="user-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span>{userName}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <section id="dashboard" className="dashboard-welcome">
            <div className="dashboard-heading">
              <div>
                <span className="form-eyebrow">FINANCIAL OVERVIEW</span>
                <h1>Welcome to FINE CORE</h1>
                <p>Manage all your banking activities in one place.</p>
              </div>

              <div className="dashboard-heading-icon">
                <Landmark size={30} />
              </div>
            </div>

            <section className="dashboard-banner">
              <div className="banner-content">
                <span className="banner-label">
                  <ShieldCheck size={16} />
                  YOUR MONEY. YOUR CONTROL.
                </span>

                <h2>Bank smarter. Live better.</h2>

                <p>
                  Check your balance, manage transactions and
                  track your financial activities.
                </p>

                <button
                  type="button"
                  className="banner-button"
                  onClick={() => goToSection('accounts')}
                >
                  Check My Balance
                  <Eye size={17} />
                </button>
              </div>

              <div className="banner-illustration">
                <div className="banner-circle banner-circle-one" />
                <div className="banner-circle banner-circle-two" />

                <div className="banner-bank-icon">
                  <Landmark size={66} />
                </div>

                <div className="banner-mini-card">
                  <ShieldCheck size={18} />
                  <span>Protected Access</span>
                </div>
              </div>
            </section>

            <div className="section-heading">
              <div>
                <h2>Quick Banking Actions</h2>
                <p>Select a service to continue.</p>
              </div>
            </div>

            <div className="dashboard-cards">
              {quickActions.map(
                ({ title, description, icon: Icon, id, color }) => (
                  <article className="dashboard-card" key={title}>
                    <div className={`dashboard-card-icon ${color}`}>
                      <Icon size={24} />
                    </div>

                    <h3>{title}</h3>
                    <p>{description}</p>

                    <button
                      type="button"
                      onClick={() => handleNavigation(id)}
                    >
                      Open Service
                      <ArrowLeftRight size={17} />
                    </button>
                  </article>
                )
              )}
            </div>
          </section>

          <section id="accounts" className="dashboard-feature-section">
            <MyAccounts />
          </section>

          <section id="transactions" className="dashboard-feature-section">
            <Transaction initialOperation={transactionOperation} />
          </section>

          <section id="beneficiaries" className="dashboard-feature-section">
            <Beneficiaries />
          </section>

          <section
            id="loans"
            className="dashboard-feature-section loan-section"
          >
            <div className="section-heading">
              <div>
                <h2>Loan Management</h2>
                <p>Apply for a loan and manage your applications.</p>
              </div>
            </div>

            <div className="placeholder-page">
              <HandCoins size={32} />
              <h3>Apply for a Loan</h3>
              <p>Enter your loan details below.</p>

              <form
                onSubmit={handleLoanSubmit}
                className="loan-application-form"
              >
                <div className="form-group">
                  <label htmlFor="loanAmount">Loan Amount (₹)</label>
                  <input
                    id="loanAmount"
                    type="number"
                    min="1"
                    max="10000000"
                    step="0.01"
                    value={loanAmount}
                    onChange={(event) => setLoanAmount(event.target.value)}
                    placeholder="Enter loan amount"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="loanPurpose">Loan Purpose</label>
                  <input
                    id="loanPurpose"
                    type="text"
                    minLength="3"
                    maxLength="200"
                    value={loanPurpose}
                    onChange={(event) => setLoanPurpose(event.target.value)}
                    placeholder="Example: Education, Home, Personal"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="loanTerm">Repayment Duration</label>
                  <select
                    id="loanTerm"
                    value={loanTerm}
                    onChange={(event) => setLoanTerm(event.target.value)}
                    required
                  >
                    <option value="12">12 Months</option>
                    <option value="24">24 Months</option>
                    <option value="36">36 Months</option>
                    <option value="48">48 Months</option>
                    <option value="60">60 Months</option>
                    <option value="120">120 Months</option>
                    <option value="180">180 Months</option>
                    <option value="240">240 Months</option>
                    <option value="360">360 Months</option>
                  </select>
                </div>

                {loanError && (
                  <p className="loan-message loan-error" role="alert">
                    {loanError}
                  </p>
                )}

                {loanSuccess && (
                  <p className="loan-message loan-success" role="status">
                    {loanSuccess}
                  </p>
                )}

                <button
                  type="submit"
                  className="banner-button"
                  disabled={loanSubmitting}
                >
                  {loanSubmitting
                    ? 'Submitting...'
                    : 'Submit Loan Application'}
                </button>
              </form>
            </div>

            <div className="section-heading">
              <div>
                <h2>My Loan Applications</h2>
                <p>Track your loan application history and status.</p>
              </div>
            </div>

            <div className="placeholder-page loan-history">
              {loanLoading ? (
                <p>Loading your loan applications...</p>
              ) : loans.length === 0 ? (
                loanError ? (
                  <p>{loanError}</p>
                ) : (
                  <p>No loan applications found.</p>
                )
              ) : (
                <div className="loan-table-wrapper">
                  <table className="loan-table">
                    <thead>
                      <tr>
                        <th>Loan ID</th>
                        <th>Amount</th>
                        <th>Purpose</th>
                        <th>Duration</th>
                        <th>Applied On</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loans.map((loan) => (
                        <tr key={loan.loan_id}>
                          <td>{loan.loan_id}</td>
                          <td>
                            ₹{Number(loan.amount).toLocaleString('en-IN')}
                          </td>
                          <td>{loan.purpose}</td>
                          <td>{loan.term_months} Months</td>
                          <td>{loan.applied_on || '—'}</td>
                          <td>
                            <span
                              className={`loan-status ${getLoanStatusClass(
                                loan.status
                              )}`}
                            >
                              {loan.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section id="profile" className="dashboard-feature-section">
            <div className="section-heading">
              <div>
                <h2>My Profile</h2>
                <p>Your registered information.</p>
              </div>
            </div>

            <div className="placeholder-page">
              <UserRound size={32} />

              {profile && (
                <div className="profile-details">
                  <div className="profile-detail-item">
                    <span>Name</span>
                    <strong>{profile.full_name || '—'}</strong>
                  </div>

                  <div className="profile-detail-item">
                    <span>Email</span>
                    <strong>{profile.email || '—'}</strong>
                  </div>

                  <div className="profile-detail-item">
                    <span>Mobile</span>
                    <strong>{profile.mobile || '—'}</strong>
                  </div>
                </div>
              )}

              {profileError && <p role="alert">{profileError}</p>}
            </div>
          </section>

          <div className="dashboard-bottom-note">
            <ShieldCheck size={20} />

            <div>
              <strong>Your security matters</strong>
              <p>
                Never share your password or authentication token
                with anyone.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
