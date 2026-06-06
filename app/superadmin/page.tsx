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
  payment_type: 'salary' | 'percentage'
  salary: number
  percentage: number
}

const SUPER_ADMIN_EMAIL = 'senghorgermaindiagounda@gmail.com'

export default function SuperAdmin() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedQR, setSelectedQR] = useState<Employee | null>(null)
  const [selectedPay, setSelectedPay] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState<'employees' | 'payments'>('employees')
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '1', name: 'Amadou Diallo', email: 'amadou@gmail.com', role: 'employee', created_at: '2026-06-01', payment_type: 'salary', salary: 150000, percentage: 0 },
    { id: '2', name: 'Fatou Sow', email: 'fatou@gmail.com', role: 'admin', created_at: '2026-06-02', payment_type: 'percentage', salary: 0, percentage: 10 },
    { id: '3', name: 'Moussa Ndiaye', email: 'moussa@gmail.com', role: 'employee', created_at: '2026-06-03', payment_type: 'salary', salary: 120000, percentage: 0 },
  ])

  const totalRevenue = 4500000
  const totalSalaries = employees.reduce((sum, e) => {
    if (e.payment_type === 'salary') return sum + e.salary
    return sum + (totalRevenue * e.percentage / 100)
  }, 0)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    getUser()
  }, [])

  const updatePayment = (emp: Employee) => {
    setEmployees(employees.map(e => e.id === emp.id ? emp : e))
    setSelectedPay(null)
    alert('✅ Paiement mis à jour !')
  }

  const promoteToAdmin = (id: string) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, role: 'admin' } : e))
  }

  const demoteToEmployee = (id: string) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, role: 'employee' } : e))
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>

  if (!user || user.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div style={{ background: '#F5ECD7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
          <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A' }}>Accès refusé</h2>
          <p style={{ color: '#7A5C42' }}>Seul le Super Admin peut accéder à cette page</p>
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
          borderRadius: 16, padding: 24,
          marginBottom: 24, display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', color: '#F5ECD7', fontSize: 24, margin: 0 }}>
              👑 Super Admin
            </h1>
            <p style={{ color: 'rgba(245,236,215,0.7)', fontSize: 13, margin: '4px 0 0' }}>
              Contrôle total de B@OB@B Shop
            </p>
          </div>
          <div style={{ background: '#2D6A4F', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ color: '#F5ECD7', fontSize: 11, fontWeight: 600 }}>SUPER ADMIN</div>
            <div style={{ color: '#52B788', fontSize: 12, marginTop: 2 }}>● Connecté</div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '👥', label: 'Employés', value: employees.length },
            { icon: '⚙️', label: 'Admins', value: employees.filter(e => e.role === 'admin').length },
            { icon: '💰', label: 'Revenus', value: totalRevenue.toLocaleString('fr-FR') + ' F' },
            { icon: '💸', label: 'Salaires', value: totalSalaries.toLocaleString('fr-FR') + ' F' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'white', borderRadius: 12,
              padding: '16px', textAlign: 'center',
              border: '1px solid #E8D5B0',
            }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#3A1F0A', marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#7A5C42' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { key: 'employees', label: '👥 Employés' },
            { key: 'payments', label: '💰 Paiements' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} style={{
              padding: '9px 20px', borderRadius: 20,
              border: '1.5px solid',
              borderColor: activeTab === tab.key ? '#3A1F0A' : '#E8D5B0',
              background: activeTab === tab.key ? '#3A1F0A' : 'white',
              color: activeTab === tab.key ? '#F5ECD7' : '#7A5C42',
              fontWeight: 600, fontSize: 13,
              cursor: 'pointer', fontFamily: 'sans-serif',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* LISTE EMPLOYÉS */}
        {activeTab === 'employees' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7' }}>
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
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white',
                  fontWeight: 700, fontSize: 18, flexShrink: 0,
                }}>
                  {emp.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: '#7A5C42' }}>{emp.email}</div>
                  <div style={{ fontSize: 11, color: '#2D6A4F', marginTop: 2 }}>
                    {emp.payment_type === 'salary'
                      ? `💵 Salaire fixe: ${emp.salary.toLocaleString('fr-FR')} FCFA`
                      : `📊 Commission: ${emp.percentage}% des bénéfices`
                    }
                  </div>
                </div>
                <div style={{
                  background: emp.role === 'admin' ? '#D8F3DC' : '#F5ECD7',
                  color: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C',
                  fontSize: 11, fontWeight: 700,
                  padding: '4px 12px', borderRadius: 20,
                }}>
                  {emp.role === 'admin' ? '⚙️ Admin' : '👤 Employé'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setSelectedQR(emp)} style={{
                    background: '#3A1F0A', color: 'white',
                    border: 'none', padding: '7px 10px',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontFamily: 'sans-serif',
                  }}>📱 QR</button>
                  <button onClick={() => setSelectedPay({ ...emp })} style={{
                    background: '#C9860A', color: 'white',
                    border: 'none', padding: '7px 10px',
                    borderRadius: 8, cursor: 'pointer',
                    fontSize: 12, fontFamily: 'sans-serif',
                  }}>💰 Payer</button>
                  {emp.role === 'employee' ? (
                    <button onClick={() => promoteToAdmin(emp.id)} style={{
                      background: '#2D6A4F', color: 'white',
                      border: 'none', padding: '7px 10px',
                      borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, fontFamily: 'sans-serif',
                    }}>⬆️</button>
                  ) : (
                    <button onClick={() => demoteToEmployee(emp.id)} style={{
                      background: '#FFE4E4', color: '#e53e3e',
                      border: 'none', padding: '7px 10px',
                      borderRadius: 8, cursor: 'pointer',
                      fontSize: 12, fontFamily: 'sans-serif',
                    }}>⬇️</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TABLEAU PAIEMENTS */}
        {activeTab === 'payments' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>
                💰 Gestion des paiements
              </h2>
              <div style={{ fontSize: 13, color: '#7A5C42' }}>
                Total à payer: <strong style={{ color: '#e53e3e' }}>{totalSalaries.toLocaleString('fr-FR')} FCFA</strong>
              </div>
            </div>
            {employees.map((emp, i) => {
              const montant = emp.payment_type === 'salary'
                ? emp.salary
                : Math.round(totalRevenue * emp.percentage / 100)
              return (
                <div key={emp.id} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 14, padding: '16px 20px',
                  borderBottom: i < employees.length - 1 ? '1px solid #F5ECD7' : 'none',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white',
                    fontWeight: 700, fontSize: 18, flexShrink: 0,
                  }}>
                    {emp.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: '#7A5C42' }}>
                      {emp.payment_type === 'salary' ? '💵 Salaire fixe' : `📊 ${emp.percentage}% des bénéfices`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#2D6A4F' }}>
                      {montant.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div style={{ fontSize: 11, color: '#7A5C42' }}>Ce mois</div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Payer ${montant.toLocaleString('fr-FR')} FCFA à ${emp.name} ?`)) {
                        alert(`✅ Paiement de ${montant.toLocaleString('fr-FR')} FCFA envoyé à ${emp.name} !`)
                      }
                    }}
                    style={{
                      background: '#2D6A4F', color: 'white',
                      border: 'none', padding: '8px 16px',
                      borderRadius: 20, cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                      fontFamily: 'sans-serif',
                    }}
                  >
                    💸 Payer
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL QR CODE */}
      {selectedQR && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 24,
        }} onClick={() => setSelectedQR(null)}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: 32, textAlign: 'center',
            maxWidth: 340, width: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, marginBottom: 4 }}>
              📱 QR Code
            </h2>
            <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 24 }}>{selectedQR.name}</p>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <QRCode
                value={`baobab-shop://employee/${selectedQR.id}/${selectedQR.email}`}
                size={220}
                fgColor="#3A1F0A"
                bgColor="white"
              />
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'white', padding: 6,
                borderRadius: 8, width: 48, height: 48,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src="/baobab-logo.png" alt="Baobab" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              </div>
            </div>
            <button onClick={() => setSelectedQR(null)} style={{
              marginTop: 20, width: '100%', background: '#3A1F0A',
              color: 'white', border: 'none', padding: '12px',
              borderRadius: 20, cursor: 'pointer', fontWeight: 700,
              fontSize: 14, fontFamily: 'sans-serif',
            }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {selectedPay && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 24,
        }} onClick={() => setSelectedPay(null)}>
          <div style={{
            background: 'white', borderRadius: 20,
            padding: 32, maxWidth: 400, width: '100%',
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, marginBottom: 4 }}>
              💰 Mode de paiement
            </h2>
            <p style={{ color: '#7A5C42', fontSize: 13, marginBottom: 24 }}>{selectedPay.name}</p>

            {/* CHOIX TYPE */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div
                onClick={() => setSelectedPay({ ...selectedPay, payment_type: 'salary' })}
                style={{
                  border: `2px solid ${selectedPay.payment_type === 'salary' ? '#2D6A4F' : '#E8D5B0'}`,
                  borderRadius: 12, padding: 16, textAlign: 'center',
                  cursor: 'pointer',
                  background: selectedPay.payment_type === 'salary' ? '#D8F3DC' : 'white',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>💵</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>Salaire fixe</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>Montant mensuel fixe</div>
              </div>
              <div
                onClick={() => setSelectedPay({ ...selectedPay, payment_type: 'percentage' })}
                style={{
                  border: `2px solid ${selectedPay.payment_type === 'percentage' ? '#2D6A4F' : '#E8D5B0'}`,
                  borderRadius: 12, padding: 16, textAlign: 'center',
                  cursor: 'pointer',
                  background: selectedPay.payment_type === 'percentage' ? '#D8F3DC' : 'white',
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>📊</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>Commission</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>% des bénéfices</div>
              </div>
            </div>

            {/* INPUT MONTANT */}
            {selectedPay.payment_type === 'salary' ? (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6 }}>
                  Salaire mensuel (FCFA)
                </label>
                <input
                  type="number"
                  value={selectedPay.salary}
                  onChange={(e) => setSelectedPay({ ...selectedPay, salary: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 150000"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid #E8D5B0', borderRadius: 8,
                    fontSize: 16, fontFamily: 'sans-serif',
                    boxSizing: 'border-box' as const,
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6 }}>
                  Pourcentage des bénéfices (%)
                </label>
                <input
                  type="number"
                  value={selectedPay.percentage}
                  onChange={(e) => setSelectedPay({ ...selectedPay, percentage: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 10"
                  min="1" max="50"
                  style={{
                    width: '100%', padding: '12px 14px',
                    border: '1.5px solid #E8D5B0', borderRadius: 8,
                    fontSize: 16, fontFamily: 'sans-serif',
                    boxSizing: 'border-box' as const,
                  }}
                />
                <p style={{ fontSize: 12, color: '#7A5C42', marginTop: 6 }}>
                  💡 Revenus ce mois: {totalRevenue.toLocaleString('fr-FR')} FCFA →
                  Montant: {Math.round(totalRevenue * selectedPay.percentage / 100).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedPay(null)} style={{
                flex: 1, background: '#F5ECD7', color: '#5C3317',
                border: '1.5px solid #E8D5B0', padding: '12px',
                borderRadius: 20, cursor: 'pointer', fontWeight: 600,
                fontSize: 14, fontFamily: 'sans-serif',
              }}>
                Annuler
              </button>
              <button onClick={() => updatePayment(selectedPay)} style={{
                flex: 2, background: '#2D6A4F', color: 'white',
                border: 'none', padding: '12px',
                borderRadius: 20, cursor: 'pointer', fontWeight: 700,
                fontSize: 14, fontFamily: 'sans-serif',
              }}>
                ✅ Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}