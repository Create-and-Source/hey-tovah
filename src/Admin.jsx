import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './Admin.css'

const ADMIN_PASSWORD = 'heytovah2026'

function Admin() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('pending')

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Wrong password')
    }
  }

  const fetchSubmissions = () => {
    setLoading(true)
    supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSubmissions(data || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    if (!authed) return
    fetchSubmissions()

    const channel = supabase
      .channel('admin:submissions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        setSubmissions((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authed])

  const handleApprove = async (id) => {
    await supabase.from('submissions').update({ approved: true }).eq('id', id)
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, approved: true } : s))
  }

  const handleDeny = async (id) => {
    await supabase.from('submissions').delete().eq('id', id)
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const filtered = submissions.filter((s) => {
    if (filter === 'pending') return !s.approved
    if (filter === 'approved') return s.approved
    return true
  })

  if (!authed) {
    return (
      <div className="admin-page">
        <div className="admin-login">
          <h1>Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
            {pwError && <p className="pw-error">{pwError}</p>}
            <button type="submit">Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-panel">
        <div className="admin-top">
          <div>
            <h1>Submissions</h1>
            <p>{submissions.filter((s) => !s.approved).length} pending</p>
          </div>
          <button className="logout-btn" onClick={() => setAuthed(false)}>Log Out</button>
        </div>

        <div className="admin-filters">
          <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
            Pending ({submissions.filter((s) => !s.approved).length})
          </button>
          <button className={`filter-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
            Approved ({submissions.filter((s) => s.approved).length})
          </button>
          <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
            All ({submissions.length})
          </button>
        </div>

        {loading ? (
          <p className="admin-loading">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <p>{filter === 'pending' ? 'No pending questions.' : 'No submissions yet.'}</p>
          </div>
        ) : (
          <div className="admin-list">
            {filtered.map((s) => (
              <div key={s.id} className={`admin-card ${s.approved ? 'approved' : ''}`}>
                <div className="admin-card-top">
                  <span className="admin-card-name">{s.name || 'Anonymous'}</span>
                  <span className="admin-card-date">{formatDate(s.created_at)}</span>
                </div>
                <p className="admin-card-question">{s.question}</p>
                {!s.approved && (
                  <div className="admin-card-actions">
                    <button className="approve-btn" onClick={() => handleApprove(s.id)}>Approve</button>
                    <button className="deny-btn" onClick={() => handleDeny(s.id)}>Deny</button>
                  </div>
                )}
                {s.approved && <span className="approved-badge">Approved</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
