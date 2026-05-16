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

  const handleLogin = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setPwError('')
    } else {
      setPwError('Wrong password')
    }
  }

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setSubmissions(data || [])
        setLoading(false)
      })

    const channel = supabase
      .channel('admin:submissions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        setSubmissions((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authed])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

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
            <p>{submissions.length} question{submissions.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="logout-btn" onClick={() => setAuthed(false)}>Log Out</button>
        </div>

        {loading ? (
          <p className="admin-loading">Loading...</p>
        ) : submissions.length === 0 ? (
          <div className="admin-empty">
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="admin-list">
            {submissions.map((s) => (
              <div key={s.id} className="admin-card">
                <div className="admin-card-top">
                  <span className="admin-card-name">{s.name || 'Anonymous'}</span>
                  <span className="admin-card-date">{formatDate(s.created_at)}</span>
                </div>
                <p className="admin-card-question">{s.question}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
