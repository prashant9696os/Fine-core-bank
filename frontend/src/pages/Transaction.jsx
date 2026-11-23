
import { useEffect, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Search,
  ReceiptText,
  Wallet,
  ArrowLeftRight,
  Banknote,
} from 'lucide-react'
import { apiRequest } from '../services/api'

export default function Transaction({ initialOperation = 'deposit' }) {
  const [transactions, setTransactions] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [operation, setOperation] = useState(initialOperation)
  const [amount, setAmount] = useState('')
  const [recipientAccount, setRecipientAccount] = useState('')

  useEffect(() => {
    if (['deposit', 'withdraw', 'transfer'].includes(initialOperation)) {
      setOperation(initialOperation)
      setError('')
      setMessage('')
    }
  }, [initialOperation])

  async function loadTransactions() {
    setLoading(true)
    setError('')

    try {
      const [history, account] = await Promise.all([
        apiRequest('/transactions/me'),
        apiRequest('/accounts/me'),
      ])

      setTransactions(
        Array.isArray(history) ? history : history.transactions || []
      )
      setBalance(account.balance)
    } catch (err) {
      setError(err.message || 'Unable to load banking information.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
  }, [])

  async function handleMoneyOperation(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0) {
      setError('Please enter an amount greater than zero.')
      return
    }

    if (Math.round(value * 100) !== value * 100) {
      setError('Please enter no more than two decimal places.')
      return
    }

    if (operation === 'withdraw' && balance !== null && value > Number(balance)) {
      setError('Insufficient balance.')
      return
    }

    if (operation === 'transfer' && !recipientAccount.trim()) {
      setError('Please enter the recipient account number.')
      return
    }

    setBusy(true)

    try {
      let endpoint = '/accounts/deposit'
      let body = { amount: value }

      if (operation === 'withdraw') {
        endpoint = '/accounts/withdraw'
      } else if (operation === 'transfer') {
        endpoint = '/accounts/transfer'
        body = {
          amount: value,
          recipient_account_number: recipientAccount.trim(),
        }
      }

      const result = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      })

      setMessage(result.message || 'Transaction completed successfully.')
      setAmount('')
      setRecipientAccount('')
      await loadTransactions()
    } catch (err) {
      setError(err.message || 'Transaction failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const searchText = [
      transaction.reference,
      transaction.type,
      transaction.description,
      transaction.status,
      transaction.direction,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchText.includes(search.toLowerCase())
  })

  const recentTransactions = [...transactions].slice(0, 5)

  function formatAmount(transaction) {
    const amountText = Number(transaction.amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

    const currency = transaction.currency || 'INR'
    const sign = transaction.direction === 'credit' ? '+' : '-'

    return `${sign}${currency} ${amountText}`
  }

  function formatDate(date) {
    if (!date) return 'Date unavailable'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Date unavailable'
    }

    return parsedDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <main className="transactions-page">
      <header className="transactions-header">
        <div>
          <h1>Banking Transactions</h1>
          <p>Deposit, withdraw, transfer money, and review your activity.</p>
        </div>

        <button
          type="button"
          className="transactions-refresh"
          onClick={loadTransactions}
          disabled={loading || busy}
        >
          <RefreshCw size={17} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </header>

      <section className="transactions-summary">
        <article className="transactions-summary-card">
          <Wallet size={20} />
          <span>Available Balance</span>
          <strong>
            {balance === null
              ? '—'
              : `INR ${Number(balance).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </strong>
        </article>

        <article className="transactions-summary-card">
          <span>Total Transactions</span>
          <strong>{transactions.length}</strong>
        </article>

        <article className="transactions-summary-card">
          <span>Total Credits</span>
          <strong>
            {transactions.filter((item) => item.direction === 'credit').length}
          </strong>
        </article>

        <article className="transactions-summary-card">
          <span>Total Debits</span>
          <strong>
            {transactions.filter((item) => item.direction === 'debit').length}
          </strong>
        </article>
      </section>

      <section className="transactions-panel">
        <div className="transactions-panel-header">
          <div>
            <h2>Manage Your Money</h2>
            <p>Select an operation and enter the required details.</p>
          </div>
        </div>

        <div className="money-operation-tabs">
          <button
            type="button"
            className={operation === 'deposit' ? 'active' : ''}
            onClick={() => {
              setOperation('deposit')
              setError('')
              setMessage('')
            }}
          >
            <ArrowDownLeft size={18} />
            Deposit
          </button>

          <button
            type="button"
            className={operation === 'withdraw' ? 'active' : ''}
            onClick={() => {
              setOperation('withdraw')
              setError('')
              setMessage('')
            }}
          >
            <ArrowUpRight size={18} />
            Withdraw
          </button>

          <button
            type="button"
            className={operation === 'transfer' ? 'active' : ''}
            onClick={() => {
              setOperation('transfer')
              setError('')
              setMessage('')
            }}
          >
            <ArrowLeftRight size={18} />
            Transfer
          </button>
        </div>

        <form className="money-operation-form" onSubmit={handleMoneyOperation}>
          <label>
            Amount (INR)
            <input
              type="number"
              min="0.01"
              step="0.01"
              max="9999999999.99"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
              required
              disabled={busy}
            />
          </label>

          {operation === 'transfer' && (
            <label>
              Recipient Account Number
              <input
                type="text"
                value={recipientAccount}
                onChange={(event) => setRecipientAccount(event.target.value)}
                placeholder="Enter recipient account number"
                minLength={3}
                maxLength={30}
                required
                disabled={busy}
              />
            </label>
          )}

          {error && <p className="transactions-error" role="alert">{error}</p>}
          {message && <p className="transactions-success" role="status">{message}</p>}

          <button type="submit" disabled={busy || loading}>
            <Banknote size={18} />
            {busy
              ? 'Processing...'
              : operation === 'deposit'
                ? 'Deposit Money'
                : operation === 'withdraw'
                  ? 'Withdraw Money'
                  : 'Transfer Money'}
          </button>
        </form>
      </section>

      <section className="transactions-panel">
        <div className="transactions-panel-header">
          <div>
            <h2>Recent Transactions</h2>
            <p>Your five latest transactions.</p>
          </div>
        </div>

        {recentTransactions.length === 0 && !loading && (
          <p>No recent transactions found.</p>
        )}

        {recentTransactions.map((item, index) => (
          <div key={item.reference || index} className="transaction-type-cell">
            <strong>{item.description || item.type || 'Transaction'}</strong>
            <span>{formatDate(item.created_at)}</span>
            <strong>{formatAmount(item)}</strong>
          </div>
        ))}
      </section>

      <section className="transactions-panel">
        <div className="transactions-panel-header">
          <div>
            <h2>Transaction History</h2>
            <p>Review your account transactions.</p>
          </div>

          <div className="transactions-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search transactions..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search transactions"
            />
          </div>
        </div>

        {loading && (
          <div className="transactions-message">
            Loading your transactions...
          </div>
        )}

        {!loading && error && (
          <div className="transactions-error">
            <p>{error}</p>
            <button type="button" onClick={loadTransactions}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && filteredTransactions.length === 0 && (
          <div className="transactions-empty">
            <ReceiptText size={40} />
            <h3>No transactions found</h3>
            <p>
              {search
                ? 'Try searching with another keyword.'
                : 'Your transactions will appear here.'}
            </p>
          </div>
        )}

        {!loading && !error && filteredTransactions.length > 0 && (
          <div className="transactions-table-wrapper">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction, index) => {
                  const isCredit = transaction.direction === 'credit'

                  return (
                    <tr
                      key={
                        transaction.reference ||
                        `${transaction.created_at}-${index}`
                      }
                    >
                      <td>
                        <div className="transaction-type-cell">
                          <span
                            className={`transaction-direction-icon ${
                              isCredit ? 'credit' : 'debit'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft size={18} />
                            ) : (
                              <ArrowUpRight size={18} />
                            )}
                          </span>

                          <div>
                            <strong>
                              {transaction.description ||
                                transaction.type ||
                                'Bank transaction'}
                            </strong>
                            <span>{transaction.type || 'Transaction'}</span>
                          </div>
                        </div>
                      </td>

                      <td>{transaction.reference || '—'}</td>
                      <td>{formatDate(transaction.created_at)}</td>

                      <td>
                        <strong
                          className={isCredit ? 'credit-text' : 'debit-text'}
                        >
                          {formatAmount(transaction)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`transaction-status ${
                            (transaction.status || 'unknown').toLowerCase()
                          }`}
                        >
                          {transaction.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
