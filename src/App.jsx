import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import './App.css'

export function Landing() {
  const navigate = useNavigate()
  return (
    <div className="landing">
      <video className="bg-video" src="/bg.mp4" autoPlay muted loop playsInline />
      <div className="bg-overlay" />
      <div className="landing-content">
        <img src="/tovah.jpg" alt="Tovah" className="landing-avatar" />
        <h1>Hey Tovah</h1>
        <p className="landing-tagline">Psychology. Coaching. Real talk.</p>
        <div className="landing-buttons">
          <button className="landing-btn" onClick={() => navigate('/bio')}>
            Meet Tovah
          </button>
          <button className="landing-btn landing-btn-primary" onClick={() => navigate('/ask')}>
            Ask an Anonymous Question
          </button>
        </div>
      </div>
    </div>
  )
}

export function Bio() {
  const navigate = useNavigate()
  return (
    <div className="bio-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="bio-content">
        <img src="/tovah.jpg" alt="Tovah" className="bio-avatar" />
        <h1>Tovah</h1>
        <div className="bio-credentials">
          <span className="credential">B.S. Psychology</span>
          <span className="credential">Minor in Family Studies & Human Development</span>
          <span className="credential">M.A. Forensic Psychology</span>
          <span className="credential">Certified Life Coach</span>
        </div>
        <div className="bio-text">
          <p>I go live on TikTok to have real conversations about the things people are too afraid to say out loud — relationships, self-worth, patterns, boundaries, all of it.</p>
          <p>No judgment. No generic advice. Just honest perspective grounded in psychology and lived experience.</p>
          <p>If you have something on your mind but don't want to say it in the comments, send me an anonymous question and I'll answer it on live.</p>
        </div>
        <button className="bio-cta" onClick={() => navigate('/ask')}>
          Ask a Question
        </button>
      </div>
    </div>
  )
}

export function AskPage() {
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [showNameField, setShowNameField] = useState(false)
  const [name, setName] = useState('')
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const feedRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    supabase
      .from('submissions')
      .select('id, question, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) setMessages(data.reverse())
      })

    const channel = supabase
      .channel('public:submissions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'submissions' }, (payload) => {
        if (payload.new.approved) {
          setMessages((prev) => [...prev.slice(-29), { id: payload.new.id, question: payload.new.question, created_at: payload.new.created_at }])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return
    setSending(true)

    const payload = { question: question.trim(), approved: false }
    if (name.trim()) payload.name = name.trim()

    const { error } = await supabase.from('submissions').insert([payload])

    setSending(false)
    if (!error) {
      setQuestion('')
      setJustSent(true)
      setTimeout(() => setJustSent(false), 4000)
      inputRef.current?.focus()
    }
  }

  const getTimeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="ask-page">
      <video className="ask-bg" src="/bg.mp4" muted playsInline preload="auto" />
      <div className="ask-bg-overlay" />
      <div className="ask-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="ask-header-text">
          <div className="live-badge">LIVE</div>
          <span>Ask Tovah anything — 100% anonymous</span>
        </div>
      </div>

      <div className="chat-feed" ref={feedRef}>
        {messages.length === 0 && (
          <div className="empty-feed">
            <p>Questions Tovah has answered will show here</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="chat-bubble">
            <span className="bubble-avatar">?</span>
            <div className="bubble-content">
              <span className="bubble-text">{msg.question}</span>
              <span className="bubble-time">{getTimeAgo(msg.created_at)}</span>
            </div>
          </div>
        ))}
        {justSent && (
          <div className="sent-confirmation">Sent! Your question is anonymous and will appear once Tovah reviews it.</div>
        )}
      </div>

      <div className="input-area">
        {showNameField && (
          <div className="name-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name (optional — only Tovah sees this)"
              maxLength={100}
              className="name-input"
            />
          </div>
        )}
        <form onSubmit={handleSubmit} className="chat-input-row">
          <button
            type="button"
            className="name-toggle"
            onClick={() => setShowNameField(!showNameField)}
            title={showNameField ? 'Hide name field' : 'Add your name (optional)'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask Tovah anything..."
            maxLength={2000}
            className="chat-input"
            disabled={sending}
          />
          <button type="submit" className="send-btn" disabled={sending || !question.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
