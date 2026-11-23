
import { useEffect, useState } from 'react'
import { Landmark, RefreshCw, Wallet, ArrowDownToLine, ArrowUpFromLine, Send } from 'lucide-react'
import { apiRequest } from '../services/api'

export default function MyAccounts() {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [operation, setOperation] = useState('deposit')

  async function loadAccount() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/accounts/me')
      setAccount(data)
    } catch (err) {
      setError(err.message || 'Unable to load account details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccount()
  }, [])

  async function submitOperation(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    if (operation === 'transfer' && !recipient.trim()) {
      setError('Enter the recipient account number.')
      return
    }

    const payload = { amount: value }
    if (operation === 'transfer') {
      payload.recipient_account_number = recipient.trim()
    }

    setBusy(true)
    try {
      const result = await apiRequest(`/accounts/${operation}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setMessage(result.message || `${operation[0].toUpperCase()}${operation.slice(1)} completed successfully.`)
      setAmount('')
      setRecipient('')
      await loadAccount()
    } catch (err) {
      setError(err.message || 'Transaction failed.')
    } finally {
      setBusy(false)
    }
  }

  function formatBalance(balance) {
    return Number(balance || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const cardStyle = {
    background: '#fff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    marginTop: '20px',
  }

  return (
    <section style={{ padding: '10px 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1>My Accounts</h1>
          <p>View your account and manage your transactions.</p>
        </div>
        <button type="button" onClick={loadAccount} disabled={loading}>
          <RefreshCw size={16} /> {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && <p>Loading account details...</p>}
      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#15803d' }}>{message}</p>}

      {!loading && account && (
        <>
          <div style={{ ...cardStyle, background: '#172554', color: '#fff' }}>
            <Wallet size={30} />
            <p>Available Balance</p>
            <h2 style={{ fontSize: '32px' }}>
              {account.currency || 'INR'} {formatBalance(account.balance)}
            </h2>
            <p>Account Number: {account.account_number}</p>
          </div>

          <div style={cardStyle}>
            <Landmark size={25} />
            <h2>Account Information</h2>
            <p><strong>Account Number:</strong> {account.account_number}</p>
            <p><strong>Currency:</strong> {account.currency || 'INR'}</p>
            <p><strong>Status:</strong> {account.status}</p>
            <p><strong>Created At:</strong> {account.created_at
              ? new Date(account.created_at).toLocaleDateString('en-IN')
              : 'Not available'}</p>
          </div>

          <div style={cardStyle}>
            <h2>Banking Operations</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', margin: '16px 0' }}>
              <button type="button" onClick={() => { setOperation('deposit'); setError(''); setMessage('') }}>
                <ArrowDownToLine size={16} /> Deposit
              </button>
              <button type="button" onClick={() => { setOperation('withdraw'); setError(''); setMessage('') }}>
                <ArrowUpFromLine size={16} /> Withdraw
              </button>
              <button type="button" onClick={() => { setOperation('transfer'); setError(''); setMessage('') }}>
                <Send size={16} /> Transfer
              </button>
            </div>

            <h3>{operation === 'deposit' ? 'Deposit Money' : operation === 'withdraw' ? 'Withdraw Money' : 'Transfer Money'}</h3>

            <form onSubmit={submitOperation} style={{ display: 'grid', gap: '14px', maxWidth: '420px' }}>
              <label>
                Amount
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  style={{ display: 'block', width: '100%', padding: '12px', marginTop: '6px' }}
                />
              </label>

              {operation === 'transfer' && (
                <label>
                  Recipient Account Number
                  <input
                    type="text"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    required
                    style={{ display: 'block', width: '100%', padding: '12px', marginTop: '6px' }}
                  />
                </label>
              )}

              <button type="submit" disabled={busy}>
                {busy ? 'Processing...' : `Confirm ${operation}`}
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  )
}

