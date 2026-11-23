
import { useEffect, useState } from 'react'
import { UserPlus, Trash2, RefreshCw } from 'lucide-react'
import { apiRequest } from '../services/api'

export default function Beneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([])
  const [accountNumber, setAccountNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadBeneficiaries() {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/beneficiaries/')
      setBeneficiaries(Array.isArray(data) ? data : data.beneficiaries || [])
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
          account_number: accountNumber.trim(),
        }),
      })
      setAccountNumber('')
      setMessage('Beneficiary added successfully.')
      await loadBeneficiaries()
    } catch (err) {
      setError(err.message || 'Unable to add beneficiary.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteBeneficiary(id) {
    if (!window.confirm('Delete this beneficiary?')) return

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
          <p>Manage accounts you transfer money to.</p>
        </div>
        <button type="button" onClick={loadBeneficiaries} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}
      {message && <p role="status" style={{ color: '#15803d' }}>{message}</p>}

      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
      }}>
        <h2><UserPlus size={20} /> Add Beneficiary</h2>
        <form onSubmit={addBeneficiary} style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 16,
        }}>
          <input
            value={accountNumber}
            onChange={(event) => setAccountNumber(event.target.value)}
            placeholder="Recipient account number"
            required
            style={{ flex: 1, minWidth: 220, padding: 12 }}
          />
          <button type="submit" disabled={busy}>
            {busy ? 'Adding...' : 'Add Beneficiary'}
          </button>
        </form>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 24,
        marginTop: 20,
      }}>
        <h2>Saved Beneficiaries</h2>

        {loading && <p>Loading beneficiaries...</p>}
        {!loading && beneficiaries.length === 0 && (
          <p>No beneficiaries found.</p>
        )}

        {beneficiaries.map((item) => {
          const id = item.id ?? item.beneficiary_id
          return (
            <div key={id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              padding: '16px 0',
              borderBottom: '1px solid #e5e7eb',
            }}>
              <div>
                <strong>{item.name || item.beneficiary_name || 'Beneficiary'}</strong>
                <p>Account: {item.account_number || item.beneficiary_account_number || 'Not available'}</p>
              </div>
              <button
                type="button"
                onClick={() => deleteBeneficiary(id)}
                disabled={id == null}
                aria-label="Delete beneficiary"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
