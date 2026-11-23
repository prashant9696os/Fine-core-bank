
import { useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import {
  Landmark,
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  HandCoins,
  LogOut,
  Menu,
} from 'lucide-react'

export default function App() {
  const [page, setPage] = useState('Dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [token, setToken] = useState(
    localStorage.getItem('access_token'),
  )

  const isRegisterPage = window.location.pathname === '/register'

  function logout() {
    localStorage.removeItem('access_token')
    setToken(null)
    setPage('Dashboard')
    window.history.pushState({}, '', '/')
  }

  function navigate(nextPage) {
    setPage(nextPage)
    setMenuOpen(false)
  }

  if (!token) {
    return isRegisterPage ? <Register /> : <Login />
  }

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Transactions', icon: ArrowLeftRight },
    { name: 'My Accounts', icon: Landmark },
    { name: 'Cards', icon: CreditCard },
    { name: 'Loans', icon: HandCoins },
  ]

  return (
    <div className="app-layout">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="login-brand">
          <span className="login-brand-icon">
            <Landmark size={24} />
          </span>
          <span>
            FINE CORE
            <small>SMART BANKING</small>
          </span>
        </div>

        <nav>
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? 'active' : ''}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <button className="nav-item logout-button" onClick={logout}>
          <LogOut size={19} />
          <span>Sign out</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <Menu size={22} />
          </button>
          <div>
            <h2>{page}</h2>
            <p>Welcome to your Fine Core banking dashboard.</p>
          </div>
        </header>

        {page === 'Dashboard' ? (
          <section className="dashboard-content">
            <div className="welcome-card">
              <p>FINE CORE BANKING</p>
              <h1>Welcome back!</h1>
              <span>Your banking workspace is ready.</span>
            </div>

            <div className="dashboard-grid">
              {navigation.slice(1).map(({ name, icon: Icon }) => (
                <button
                  className="dashboard-card"
                  key={name}
                  onClick={() => navigate(name)}
                >
                  <Icon size={26} />
                  <h3>{name}</h3>
                  <p>Open {name.toLowerCase()}</p>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="page-panel">
            <h2>{page}</h2>
            <p>
              This section still needs to be connected to its corresponding
              banking API.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}
