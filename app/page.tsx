'use client'

import { useState, useEffect, useCallback } from 'react'
import questionsData from '@/data/questions.json'

type Question = {
  id: number
  category: string
  question: string
  options: string[]
  answer: number
}

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)
  const [shuffledQs, setShuffledQs] = useState<Question[]>([])

  const shuffle = useCallback((arr: Question[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [])

  const startGame = () => {
    const sq = shuffle(questionsData)
    setShuffledQs(sq)
    setCurrent(0)
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setSelected(null)
    setShowResult(false)
    setFinished(false)
    setStarted(true)
  }

  const handleAnswer = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const correct = idx === shuffledQs[current].answer
    if (correct) {
      setScore(s => s + 1)
      setStreak(s => {
        const ns = s + 1
        setBestStreak(b => Math.max(b, ns))
        return ns
      })
    } else {
      setStreak(0)
    }
    setShowResult(true)
  }

  const nextQuestion = () => {
    if (current < shuffledQs.length - 1) {
      setCurrent(c => c + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  const getGrade = () => {
    const pct = score / shuffledQs.length * 100
    if (pct >= 90) return { label: '🌟  Excellent!', color: '#ffd700' }
    if (pct >= 70) return { label: '👏  Good Job!', color: '#4caf50' }
    if (pct >= 50) return { label: '💪  Keep Trying!', color: '#ff9800' }
    return { label: '📚  Study More!', color: '#f44336' }
  }

  if (!started) {
    return (
      <div className="container" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 500, padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            English Quest
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Test your English vocabulary and grammar skills!
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            <div className="stat-badge">📖 {questionsData.length} Questions</div>
            <div className="stat-badge">🎯 Multiple Choice</div>
            <div className="stat-badge">⚡ Streak Rewards</div>
          </div>
          <button className="btn-primary" onClick={startGame} style={{ fontSize: '1.2rem', padding: '1rem 3rem' }}>
            Start Game 🚀
          </button>
        </div>
      </div>
    )
  }

  if (finished) {
    const grade = getGrade()
    return (
      <div className="container" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 500, padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉</div>
          <h2 style={{ fontSize: grade.color === '#ffd700' ? '2.2rem' : '1.8rem', color: grade.color, marginBottom: '0.5rem' }}>
            {grade.label}
          </h2>
          <div style={{ fontSize: '3rem', fontWeight: 800, color: '#333', margin: '1rem 0' }}>
            {score} / {shuffledQs.length}
          </div>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>
            Score: {Math.round(score / shuffledQs.length * 100)}%
          </div>
          <div style={{ margin: '1.5rem 0', color: '#888' }}>
            🔥 Best Streak: {bestStreak}
          </div>
          <div style={{ width: '100%', height: 12, background: '#e0e0e0', borderRadius: 6, margin: '1.5rem 0', overflow: 'hidden' }}>
            <div style={{
              width: `${score / shuffledQs.length * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              borderRadius: 6,
              transition: 'width 1s ease'
            }} />
          </div>
          <button className="btn-primary" onClick={startGame} style={{ marginTop: '1rem' }}>
            Play Again 🔄
          </button>
        </div>
      </div>
    )
  }

  const q = shuffledQs[current]
  const progress = ((current + 1) / shuffledQs.length) * 100

  return (
    <div className="container" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
        <div style={{ color: '#fff', fontWeight: 600 }}>📚 English Quest</div>
        <div style={{ display: 'flex', gap: '1.5rem', color: '#fff' }}>
          <span>⭐ {score}</span>
          <span>🔥 {streak}</span>
          <span>{current + 1}/{shuffledQs.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)', zIndex: 10 }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: '#fff',
          transition: 'width 0.5s ease',
          borderRadius: '0 2px 2px 0'
        }} />
      </div>

      <div className="card" style={{ maxWidth: 600, width: '100%', marginTop: '1rem', animation: 'fadeIn 0.3s ease' }} key={q.id}>
        {/* Category tag */}
        <span className="category-tag">{q.category}</span>

        {/* Question */}
        <h2 className="question-text">{q.question}</h2>

        {/* Options */}
        <div className="options-grid">
          {q.options.map((opt, idx) => {
            let bg = 'var(--option-bg)'
            let border = 'var(--option-border)'
            let symbol = 'ABCD'[idx]

            if (showResult) {
              if (idx === q.answer) {
                bg = '#e8f5e9'
                border = '#4caf50'
                symbol = '✓'
              } else if (idx === selected && idx !== q.answer) {
                bg = '#ffebee'
                border = '#f44336'
                symbol = '✗'
              }
            } else if (selected === idx) {
              bg = '#e3f2fd'
              border = '#667eea'
            }

            return (
              <button
                key={idx}
                className="option-btn"
                style={{
                  background: bg,
                  borderColor: border,
                  cursor: showResult ? 'default' : 'pointer'
                }}
                onClick={() => handleAnswer(idx)}
                disabled={showResult}
              >
                <span className="option-symbol" style={{ background: border, color: '#fff' }}>{symbol}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        {/* Feedback + Next */}
        {showResult && (
          <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: selected === q.answer ? '#4caf50' : '#f44336', marginBottom: '1rem' }}>
              {selected === q.answer ? '✅ Correct!' : `❌ Oops! The answer was: ${q.options[q.answer]}`}
            </div>
            <button className="btn-primary" onClick={nextQuestion}>
              {current < shuffledQs.length - 1 ? 'Next Question →' : 'See Results 🎯'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
