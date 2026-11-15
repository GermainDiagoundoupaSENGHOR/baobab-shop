'use client'
import { useState } from 'react'

// Étoiles dorées brillantes à choisir (1 à 5)
export default function StarRating({
  value, onChange,
}: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  const labels = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent !']
  const active = hover || value

  return (
    <div>
      <style>{`
        @keyframes bbShine { 0%,100% { filter: drop-shadow(0 0 4px #F5C542) } 50% { filter: drop-shadow(0 0 12px #FFD700) } }
      `}</style>
      <div style={{ display: 'flex', gap: 8 }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= active
          return (
            <button
              key={n} type="button"
              onClick={() => onChange(n === value ? 0 : n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                transform: on ? 'scale(1.15)' : 'scale(1)', transition: 'transform .15s',
                animation: on ? 'bbShine 1.8s ease-in-out infinite' : 'none',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id={`g${n}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FFF3A0" />
                    <stop offset="50%" stopColor="#F5C542" />
                    <stop offset="100%" stopColor="#D4920A" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"
                  fill={on ? `url(#g${n})` : 'rgba(255,255,255,0.12)'}
                  stroke={on ? '#FFE27A' : 'rgba(255,255,255,0.35)'}
                  strokeWidth="1" strokeLinejoin="round"
                />
                {on && <path d="M9 7.5l1.2-2" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />}
              </svg>
            </button>
          )
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#F5C542', minHeight: 18 }}>
        {labels[active]}
      </div>
    </div>
  )
}