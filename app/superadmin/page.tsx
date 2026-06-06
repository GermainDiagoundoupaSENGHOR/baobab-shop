'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'react-qr-code'

interface Employee {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  created_at: string
}

const SUPER_ADMIN_EMAIL = 'senghorgermaindiagounda@gmail.com'

export default function SuperAdmin() {
  const [user, setUser] = useState<any>(null)
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Amadou Diallo', email: 'amadou@gmail.com', role: 'employee', created_at: '2026-06-01' },
    { id: '2', name: 'Fatou Sow', email: 'fatou@gmail.com', role: 'admin', created_at: '2026-06-02' },
    { id: '3', name: 'Moussa Ndiaye', email: 'moussa@gmail.com', role: 'employee', created_at: '2026-06-03' },
  ])
  const [selectedQR, setSelectedQR] = useState<Employee | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [])

  const promoteToAdmin = (id: string) => {
    setEmployees(employees.map(e =>
      e.id === id ? { ...e, role: 'admin' } : e
    ))
    alert('✅ Employé promu Admin !')
  }

  const demoteToEmployee = (id: string) => {
    setEmployees(employees.map(e =>
      e.id === id ? { ...e, role: 'employee' } : e
    ))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div style={{
        background: '#F5ECD7', minHeight: '100vh',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A' }}>
            Accès refusé
          </h2>
          <p style={{ color: '#7A5C42' }}>
            Seul le Super Admin peut accéder à cette page
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #3A1F0A, #5C3317)',
          borderRadius: 16, padding: '24px',
          marginBottom: 24, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              color: '#F5ECD7', fontSize: 24, margin: 0,
            }}>
              👑 Super Admin
            </h1>
            <p style={{ color: 'rgba(245,236,215,0.7)', fontSize: 13, margin: '4px 0 0' }}>
              Contrôle total de B@OB@B Shop
            </p>
          </div>
          <div style={{
            background: '#2D6A4F', borderRadius: 12,
            padding: '10px 16px', textAlign: 'center',
          }}>
            <div style={{ color: '#F5ECD7', fontSize: 11, fontWeight: 600 }}>SUPER ADMIN</div>
            <div style={{ color: '#52B788', fontSize: 12, marginTop: 2 }}>● Connecté</div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '👥', label: 'Total employés', value: employees.length },
            { icon: '⚙️', label: 'Admins', value: employees.filter(e => e.role === 'admin').length },
            { icon: '👤', label: 'Employés', value: employees.filter(e => e.role === 'employee').length },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 12,
              padding: '20px 16px', textAlign: 'center',
              border: '1px solid #E8D5B0',
            }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#3A1F0A' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#7A5C42' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* LISTE EMPLOYÉS */}
        <div style={{
          background: 'white', borderRadius: 14,
          border: '1px solid #E8D5B0', overflow: 'hidden',
          marginBottom: 24,
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #F5ECD7',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>
              👥 Gestion des employés
            </h2>
          </div>

          {employees.map((emp, i) => (
            <div key={emp.id} style={{
              display: 'flex', alignItems: 'center',
              gap: 14, padding: '16px 20px',
              borderBottom: i < employees.length - 1 ? '1px solid #F5ECD7' : 'none',
            }}>
              {/* AVATAR */}
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white',
                fontWeight: 700, fontSize: 18, flexShrink: 0,
              }}>
                {emp.name[0]}
              </div>

              {/* INFOS */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: '#7A5C42' }}>{emp.email}</div>
              </div>

              {/* ROLE */}
              <div style={{
                background: emp.role === 'admin' ? '#D8F3DC' : '#F5ECD7',
                color: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C',
                fontSize: 11, fontWeight: 700,
                padding: '4px 12px', borderRadius: 20,
              }}>
                {emp.role === 'admin' ? '⚙️ Admin' : '👤 Employé'}
              </div>

              {/* ACTIONS */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setSelectedQR(emp)}
                  style={{
                    background: '#3A1F0A', color: 'white',
                    border: 'none', padding: '7px 12px',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontWeight: 600,
                    fontFamily: 'sans-serif',
                  }}
                >
                  📱 QR Code
                </button>
                {emp.role === 'employee' ? (
                  <button
                    onClick={() => promoteToAdmin(emp.id)}
                    style={{
                      background: '#2D6A4F', color: 'white',
                      border: 'none', padding: '7px 12px',
                      borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                      fontFamily: 'sans-serif',
                    }}
                  >
                    ⬆️ Promouvoir
                  </button>
                ) : (
                  <button
                    onClick={() => demoteToEmployee(emp.id)}
                    style={{
                      background: '#FFE4E4', color: '#e53e3e',
                      border: 'none', padding: '7px 12px',
                      borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, fontWeight: 600,
                      fontFamily: 'sans-serif',
                    }}
                  >
                    ⬇️ Rétrograder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL QR CODE */}
      {selectedQR && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000,
          padding: 24,
        }} onClick={() => setSelectedQR(null)}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: 32, textAlign: 'center',
            maxWidth: 340, width: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontFamily: 'Georgia, serif',
              color: '#3A1F0A', fontSize: 20, marginBottom: 4,
            }}>
              📱 QR Code
            </h2>
            <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 24 }}>
              {selectedQR.name}
            </p>

            {/* QR CODE AVEC BAOBAB AU MILIEU */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <QRCode
                value={`baobab-shop://employee/${selectedQR.id}/${selectedQR.email}`}
                size={220}
                fgColor="#3A1F0A"
                bgColor="white"
              />
              {/* LOGO BAOBAB AU CENTRE */}
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white',
                padding: 6, borderRadius: 8,
                width: 48, height: 48,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
              }}>
                <img
                  src="/baobab-logo.png"
                  alt="Baobab"
                  style={{ width: 40, height: 40, objectFit: 'contain' }}
                />
              </div>
            </div>

            <div style={{
              background: '#F5ECD7', borderRadius: 10,
              padding: '12px 16px', marginTop: 20, marginBottom: 20,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#3A1F0A' }}>{selectedQR.name}</div>
              <div style={{ fontSize: 12, color: '#7A5C42' }}>{selectedQR.email}</div>
              <div style={{
                display: 'inline-block',
                background: selectedQR.role === 'admin' ? '#D8F3DC' : '#F5ECD7',
                color: selectedQR.role === 'admin' ? '#2D6A4F' : '#8B5E3C',
                fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 12, marginTop: 6,
              }}>
                {selectedQR.role === 'admin' ? '⚙️ Admin' : '👤 Employé'}
              </div>
            </div>

            <button
              onClick={() => setSelectedQR(null)}
              style={{
                width: '100%', background: '#3A1F0A',
                color: 'white', border: 'none',
                padding: '12px', borderRadius: 20,
                cursor: 'pointer', fontWeight: 700,
                fontSize: 14, fontFamily: 'sans-serif',
              }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}