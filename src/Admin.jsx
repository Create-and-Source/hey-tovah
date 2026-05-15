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
  }, [authed])

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (!authed) {
    return (
      <div className="page">
        <div className="container">
          <div className="header">
            <h1>Admin</h1>
            <p className="subtitle">Enter password to view submissions</p>
          </div>
          <form onSubmit={handleLogin} className="form">
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
              />
            </div>
            {pwError && <p className="error">{pwError}</p>}
            <button type="submit" className="btn">Enter</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Submissions</h1>
            <p className="subtitle">{submissions.length} question{submissions.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <button className="btn btn-small" onClick={() => setAuthed(false)}>Log Out</button>
        </div>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : submissions.length === 0 ? (
          <div className="empty">
            <p>No submissions yet. Share your form link to start collecting questions.</p>
          </div>
        ) : (
          <div className="submissions-list">
            {submissions.map((s) => (
              <div key={s.id} className="submission-card">
                <div className="card-header">
                  <span className="card-name">{s.name}</span>
                  <span className="card-date">{formatDate(s.created_at)}</span>
                </div>
                <p className="card-question">{s.question}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Admin
