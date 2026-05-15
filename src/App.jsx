import { useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [name, setName] = useState('')
  const [question, setQuestion] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase
      .from('submissions')
      .insert([{ name: name.trim(), question: question.trim() }])

    setLoading(false)

    if (insertError) {
      setError('Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
    setName('')
    setQuestion('')
  }

  const handleAnother = () => {
    setSubmitted(false)
    setError('')
  }

  return (
    <div className="page">
      <div className="container">
        <div className="header">
          <h1>Hey Tovah</h1>
          <p className="subtitle">Submit your question for the show</p>
        </div>

        {submitted ? (
          <div className="success">
            <div className="success-icon">&#10003;</div>
            <h2>Question Submitted</h2>
            <p>Thanks for sending in your question! Stay tuned.</p>
            <button onClick={handleAnother} className="btn">
              Submit Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name or nickname"
                required
                maxLength={100}
              />
            </div>

            <div className="field">
              <label htmlFor="question">Your Question</label>
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What do you want to ask Tovah?"
                required
                rows={5}
                maxLength={2000}
              />
              <span className="char-count">{question.length}/2000</span>
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Question'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App
