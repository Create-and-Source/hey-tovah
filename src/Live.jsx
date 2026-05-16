import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import './Live.css'

export default function Live() {
  const [submissions, setSubmissions] = useState([])
  const listRef = useRef(null)

  useEffect(() => {
    supabase
      .from('submissions')
      .select('*')
      .eq('approved', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSubmissions(data)
      })

    const channel = supabase
      .channel('live:submissions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'submissions' }, (payload) => {
        setSubmissions((prev) => [payload.new, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleApprove = async (id) => {
    await supabase.from('submissions').update({ approved: true }).eq('id', id)
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDeny = async (id) => {
    await supabase.from('submissions').delete().eq('id', id)
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="live-page">
      <div className="live-top">
        <div className="live-indicator">LIVE</div>
        <span className="live-count">{submissions.length} pending</span>
      </div>

      <div className="live-list" ref={listRef}>
        {submissions.length === 0 && (
          <div className="live-empty">
            <p>Waiting for questions...</p>
          </div>
        )}
        {submissions.map((s) => (
          <div key={s.id} className="live-card">
            <div className="live-card-meta">
              <span className="live-card-name">{s.name || 'Anonymous'}</span>
              <span className="live-card-time">{getTimeAgo(s.created_at)}</span>
            </div>
            <p className="live-card-question">{s.question}</p>
            <div className="live-card-actions">
              <button className="live-approve" onClick={() => handleApprove(s.id)}>Approve</button>
              <button className="live-deny" onClick={() => handleDeny(s.id)}>Deny</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
