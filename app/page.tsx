'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import questionsData from '@/data/questions.json'

type Question = {
  id: number
  category: string
  question: string
  options: string[]
  answer: number
}

type Particle = { id: number; x: number; y: number; color: string; life: number }
type Enemy = { id: number; text: string; x: number; y: number; index: number; alive: boolean; speed: number }

export default function Home() {
  const [phase, setPhase] = useState<'menu' | 'playing' | 'result'>('menu')
  const [shuffledQs, setShuffledQs] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [lives, setLives] = useState(3)
  const [particles, setParticles] = useState<Particle[]>([])
  const [shake, setShake] = useState(false)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  const [enemies, setEnemies] = useState<Enemy[]>([])
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const particleId = useRef(0)
  const questionRef = useRef<HTMLDivElement>(null)
  const gameAreaRef = useRef<HTMLDivElement>(null)

  const shuffle = useCallback((arr: Question[]) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }, [])

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    const newP: Particle[] = []
    for (let i = 0; i < count; i++) {
      particleId.current++
      newP.push({
        id: particleId.current,
        x, y, color,
        life: 1,
      })
    }
    setParticles(prev => [...prev, ...newP])
  }, [])

  const spawnEnemies = useCallback((q: Question) => {
    const area = gameAreaRef.current?.getBoundingClientRect()
    const w = area?.width ?? 600
    const enemies: Enemy[] = q.options.map((text, idx) => ({
      id: idx,
      text,
      x: 60 + (w - 120) * (idx / (q.options.length - 1 || 1)),
      y: -80 - Math.random() * 120,
      index: idx,
      alive: true,
      speed: 0.4 + Math.random() * 0.3,
    }))
    setEnemies(enemies)
  }, [])

  const startGame = useCallback(() => {
    const sq = shuffle(questionsData)
    setShuffledQs(sq)
    setCurrent(0)
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setLives(3)
    setParticles([])
    setShake(false)
    setFlash(null)
    setTimer(0)
    setPhase('playing')
    spawnEnemies(sq[0])
  }, [shuffle, spawnEnemies])

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimer(t => t + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [phase])

  // Enemy animation
  useEffect(() => {
    if (phase !== 'playing' || enemies.length === 0) return
    const interval = setInterval(() => {
      setEnemies(prev => prev.map(e => ({
        ...e,
        y: e.y + e.speed,
      })))
    }, 16)
    return () => clearInterval(interval)
  }, [phase, enemies.length])

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return
    const interval = setInterval(() => {
      setParticles(prev => {
        const next = prev
          .map(p => ({ ...p, x: p.x + (Math.random() - 0.5) * 6, y: p.y - Math.random() * 4, life: p.life - 0.03 }))
          .filter(p => p.life > 0)
        return next
      })
    }, 30)
    return () => clearInterval(interval)
  }, [particles.length])

  const nextQuestion = useCallback(() => {
    const next = current + 1
    if (next >= shuffledQs.length) {
      setPhase('result')
      setEnemies([])
      return
    }
    setCurrent(next)
    setEnemies([])
    setTimeout(() => spawnEnemies(shuffledQs[next]), 100)
  }, [current, shuffledQs, spawnEnemies])

  const handleShoot = useCallback((enemyIdx: number) => {
    const q = shuffledQs[current]
    if (!q) return
    const correct = enemyIdx === q.answer

    if (correct) {
      setFlash('correct')
      setScore(s => s + 10 * (1 + combo))
      setCombo(c => {
        const nc = c + 1
        setMaxCombo(mc => Math.max(mc, nc))
        return nc
      })
      // Spawn particles at enemy position
      const enemy = enemies.find(e => e.index === enemyIdx)
      if (enemy) {
        spawnParticles(enemy.x, enemy.y, '#4caf50', 16)
      }
      setTimeout(() => {
        setFlash(null)
        nextQuestion()
      }, 400)
    } else {
      setFlash('wrong')
      setShake(true)
      setCombo(0)
      setLives(l => {
        if (l <= 1) {
          setTimeout(() => {
            setPhase('result')
            setEnemies([])
          }, 600)
          return 0
        }
        return l - 1
      })
      const enemy = enemies.find(e => e.index === enemyIdx)
      if (enemy) {
        spawnParticles(enemy.x, enemy.y, '#f44336', 10)
      }
      setTimeout(() => {
        setShake(false)
        setFlash(null)
      }, 500)
    }
  }, [current, shuffledQs, enemies, combo, spawnParticles, nextQuestion])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const getGrade = () => {
    if (!shuffledQs.length) return { label: '—', color: '#999' }
    const pct = score / (shuffledQs.length * 10) * 100
    if (pct >= 90) return { label: '🌟 LEGENDARY', color: '#ffd700' }
    if (pct >= 70) return { label: '👏 WARRIOR', color: '#4caf50' }
    if (pct >= 50) return { label: '💪 SCOUT', color: '#ff9800' }
    return { label: '📚 APPRENTICE', color: '#f44336' }
  }

  // --- MENU ---
  if (phase === 'menu') {
    return (
      <div className="container" style={{
        background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 30%, #2d1b69 70%, #0a0a2e 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Stars */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}

        <div className="menu-card" style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          maxWidth: 500,
        }}>
          {/* Floating rockets */}
          <div className="float-rocket" style={{ position: 'absolute', top: -60, left: '20%', fontSize: '2.5rem', animation: 'floatRocket 2s ease-in-out infinite' }}>🚀</div>
          <div className="float-rocket" style={{ position: 'absolute', top: -30, right: '15%', fontSize: '2rem', animation: 'floatRocket 2.5s ease-in-out infinite 0.5s' }}>⭐</div>

          <div style={{ fontSize: '4rem', marginBottom: '0.5rem', filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.3))' }}>🚀</div>
          <h1 className="game-title" style={{
            fontSize: '2.8rem',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #ffd700, #ff6b6b, #667eea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
            letterSpacing: '2px',
          }}>
            ENGLISH BLASTER
          </h1>
          <p className="subtitle" style={{ color: '#aaa', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Shoot the correct answers to defend your base! 🎯
          </p>

          <div className="stats-row" style={{
            display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap'
          }}>
            <div className="info-badge">📖 {questionsData.length} Rounds</div>
            <div className="info-badge">❤️ 3 Lives</div>
            <div className="info-badge">🔥 Combo System</div>
          </div>

          <button className="btn-glow" onClick={startGame} style={{
            fontSize: '1.3rem',
            padding: '1rem 3.5rem',
            borderRadius: '50px',
            background: 'linear-gradient(135deg, #ff6b6b, #667eea)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 0 30px rgba(102,126,234,0.5)',
            transition: 'all 0.3s ease',
            letterSpacing: '1px',
          }}>
            START GAME 🔫
          </button>

          <div style={{ marginTop: '2rem', color: '#666', fontSize: '0.85rem' }}>
            Click the correct answer to shoot!<br />
            Wrong answer = ❤️ lost
          </div>
        </div>

        <style jsx>{`
          .star {
            position: absolute;
            background: #fff;
            border-radius: 50%;
            animation: twinkle 2s ease-in-out infinite;
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          @keyframes floatRocket {
            0%, 100% { transform: translateY(0) rotate(-10deg); }
            50% { transform: translateY(-15px) rotate(10deg); }
          }
          .btn-glow:hover {
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 0 50px rgba(102,126,234,0.7) !important;
          }
          .btn-glow:active {
            transform: translateY(0) scale(0.98);
          }
          @media (max-width: 600px) {
            .game-title { font-size: 2rem !important; }
            .info-badge { font-size: 0.8rem; padding: 0.4rem 0.8rem; }
          }
        `}</style>
      </div>
    )
  }

  // --- RESULT ---
  if (phase === 'result') {
    const grade = getGrade()
    const totalPossible = shuffledQs.length * 10
    return (
      <div className="container" style={{
        background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 50%, #2d1b69 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        {/* Stars */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="star" style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            background: '#fff',
            borderRadius: '50%',
            animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}

        <div className="card" style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          padding: '3rem 2rem',
          textAlign: 'center',
          maxWidth: 450,
          width: '100%',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏆</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: grade.color, marginBottom: '0.5rem' }}>
            {grade.label}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '1rem 0' }}>
            {score} / {totalPossible}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1.5rem 0', color: '#aaa', flexWrap: 'wrap' }}>
            <div>⏱ {formatTime(timer)}</div>
            <div>🔥 Max Combo: {maxCombo}</div>
            <div>❤️ {lives} left</div>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, margin: '1rem 0 2rem', overflow: 'hidden' }}>
            <div style={{
              width: `${totalPossible > 0 ? (score / totalPossible) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff6b6b, #ffd700, #4caf50)',
              borderRadius: 4,
              transition: 'width 1.5s ease',
            }} />
          </div>
          <button className="btn-glow" onClick={startGame} style={{
            fontSize: '1.1rem', padding: '0.8rem 2.5rem', borderRadius: 50,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 0 20px rgba(102,126,234,0.4)',
          }}>
            Play Again 🔄
          </button>
        </div>
      </div>
    )
  }

  // --- PLAYING ---
  const q = shuffledQs[current]
  if (!q) return null

  return (
    <div ref={gameAreaRef} className="game-area" style={{
      background: 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 40%, #2d1b69 100%)',
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    }}>
      {/* Stars background */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} className="star" style={{
          position: 'absolute', left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
          width: `${1 + Math.random() * 2}px`, height: `${1 + Math.random() * 2}px`,
          background: '#fff', borderRadius: '50%',
          animation: `twinkle ${1.5 + Math.random() * 2}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`,
        }} />
      ))}

      {/* Ground */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'linear-gradient(0deg, rgba(45,27,105,0.8) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* UI overlay - scores */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 20,
        padding: '0.8rem 1.2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} style={{ fontSize: '1.5rem', filter: i < lives ? 'none' : 'grayscale(1) opacity(0.3)' }}>❤️</span>
          ))}
        </div>
        <div style={{ textAlign: 'right', color: '#fff' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>⭐ {score}</div>
          <div style={{ fontSize: '0.85rem', color: '#ffd700' }}>🔥 x{combo}</div>
        </div>
      </div>

      {/* Timer & progress */}
      <div style={{
        position: 'fixed', top: 52, left: 0, right: 0, zIndex: 20,
        display: 'flex', justifyContent: 'space-between', padding: '0 1rem',
        color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
      }}>
        <span>{current + 1}/{shuffledQs.length}</span>
        <span>⏱ {formatTime(timer)}</span>
      </div>

      {/* Question panel */}
      <div ref={questionRef} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 20, padding: '1rem 1rem 2rem',
      }}>
        <div style={{
          background: shake ? 'rgba(244,67,54,0.2)' : 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: '1.2rem 1.5rem',
          maxWidth: 600, margin: '0 auto',
          border: `1px solid ${
            flash === 'correct' ? 'rgba(76,175,80,0.5)' :
            flash === 'wrong' ? 'rgba(244,67,54,0.5)' :
            'rgba(255,255,255,0.1)'
          }`,
          transform: shake ? 'translateX(5px)' : 'none',
          transition: 'all 0.1s ease',
          textAlign: 'center',
        }}>
          <span className="category-tag" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #ff6b6b, #667eea)',
            color: '#fff', padding: '0.2rem 0.8rem', borderRadius: 12,
            fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem',
          }}>{q.category}</span>
          <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 600, lineHeight: 1.5 }}>
            {q.question}
          </div>
        </div>
      </div>

      {/* Enemies */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
        {enemies.filter(e => e.alive && e.y < window.innerHeight - 200).map(enemy => (
          <button
            key={enemy.id}
            className="enemy-btn"
            style={{
              position: 'absolute',
              left: enemy.x - 80,
              top: enemy.y,
              width: 160,
              padding: '0.8rem 0.5rem',
              borderRadius: 16,
              background: flash === 'correct'
                ? 'rgba(76,175,80,0.3)'
                : 'rgba(255,255,255,0.1)',
              border: `2px solid ${
                flash === 'correct' ? '#4caf50' :
                flash === 'wrong' ? '#f44336' :
                'rgba(255,255,255,0.3)'
              }`,
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(5px)',
              transition: 'all 0.15s ease',
              pointerEvents: 'auto',
              animation: flash === 'correct' && enemy.index === q.answer ? 'explode 0.4s ease forwards' : 'none',
            }}
            onClick={() => handleShoot(enemy.index)}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.08)'
              e.currentTarget.style.borderColor = '#ffd700'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255,215,0,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {enemy.text}
          </button>
        ))}
      </div>

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.x,
          top: p.y,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: p.color,
          opacity: p.life,
          pointerEvents: 'none',
          zIndex: 30,
          boxShadow: `0 0 6px ${p.color}`,
        }} />
      ))}

      {/* Flash overlay */}
      {flash === 'correct' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 15,
          background: 'rgba(76,175,80,0.1)',
          pointerEvents: 'none',
          animation: 'flashCorrect 0.4s ease forwards',
        }} />
      )}
      {flash === 'wrong' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 15,
          background: 'rgba(244,67,54,0.1)',
          pointerEvents: 'none',
          animation: 'flashWrong 0.4s ease forwards',
        }} />
      )}

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(0); opacity: 0; }
        }
        @keyframes flashCorrect {
          0% { background: rgba(76,175,80,0.15); }
          100% { background: transparent; }
        }
        @keyframes flashWrong {
          0% { background: rgba(244,67,54,0.15); }
          100% { background: transparent; }
        }
        .enemy-btn:hover {
          transform: scale(1.08);
          border-color: #ffd700 !important;
          box-shadow: 0 0 20px rgba(255,215,0,0.3) !important;
        }
      `}</style>
    </div>
  )
}
