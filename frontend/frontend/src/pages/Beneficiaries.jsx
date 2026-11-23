
import { useEffect, useState } from 'react'
import { UserPlus, Trash2, RefreshCw } from 'lucide-react'
import { apiRequest } from '../services/api'

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([])
  const [form, setForm] = useState({
    beneficiary_name: '',
    account_number: '',
    bank_name: '',
  })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadBeneficiaries() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/beneficiaries/')
      setBeneficiaries(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Unable to load beneficiaries.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBeneficiaries()
  }, [])

  async function addBeneficiary(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    try {
      await apiRequest('/beneficiaries/', {
        method: 'POST',
        body: JSON.stringify({
          beneficiary_name: form.beneficiary_name.trim(),
          account_number: form.account_number.trim(),
          bank_name: form.bank_name.trim(),
        }),
      })

      setForm({
        beneficiary_name: '',
        account_number: '',
        bank_name: '',
      })
      setMessage('Beneficiary added successfully.')
      await loadBeneficiaries()
    } catch (err) {
      setError(err.message || 'Unable to add beneficiary.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteBeneficiary(id) {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) {
      return
    }

    setError('')
    setMessage('')

    try {
      await apiRequest(`/beneficiaries/${id}`, {
        method: 'DELETE',
      })
      setMessage('Beneficiary deleted successfully.')
      await loadBeneficiaries()
    } catch (err) {
      setError(err.message || 'Unable to delete beneficiary.')
    }
  }

  const cardStyle = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: 12,
    marginTop: 6,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    boxSizing: 'border-box',
  }

  return (
    <section style={{ padding: '10px 0' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div>
          <h1>Beneficiaries</h1>
          <p>Manage your saved transfer recipients.</p>
        </div>

        <button type="button" onClick={loadBeneficiaries} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#15803d' }}>{message}</p>}

      <div style={cardStyle}>
        <h2><UserPlus size={20} /> Add Beneficiary</h2>

        <form onSubmit={addBeneficiary} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginTop: 20,
        }}>
          <label>
            Beneficiary Name
            <input
              style={inputStyle}
              value={form.beneficiary_name}
              onChange={(event) => setForm({
                ...form,
                beneficiary_name: event.target.value,
              })}
              required
              minLength={2}
              maxLength={100}
              placeholder="Enter full name"
            />
          </label>

          <label>
            Account Number
            <input
              style={inputStyle}
              value={form.account_number}
              onChange={(event) => setForm({
                ...form,
                account_number: event.target.value,
              })}
              required
              maxLength={20}
              placeholder="Enter account number"
            />
          </label>

          <label>
            Bank Name
            <input
              style={inputStyle}
              value={form.bank_name}
              onChange={(event) => setForm({
                ...form,
                bank_name: event.target.value,
              })}
              required
              minLength={2}
              maxLength={100}
              placeholder="Enter bank name"
            />
          </label>

          <div style={{ alignSelf: 'end' }}>
            <button type="submit" disabled={busy}>
              {busy ? 'Adding...' : 'Add Beneficiary'}
            </button>
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h2>Saved Beneficiaries</h2>

        {loading && <p>Loading beneficiaries...</p>}

        {!loading && beneficiaries.length === 0 && (
          <p>No beneficiaries added yet.</p>
        )}

        {!loading && beneficiaries.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: '16px 0',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <div>
              <strong>{item.beneficiary_name}</strong>
              <p>Account: {item.account_number}</p>
              <p>Bank: {item.bank_name}</p>
            </div>

            <button
              type="button"
              onClick={() => deleteBeneficiary(item.id)}
              disabled={busy}
              aria-label={`Delete ${item.beneficiary_name}`}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
