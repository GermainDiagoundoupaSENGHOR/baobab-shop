'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'

interface Employee {
  id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  created_at: string
  payment_type: 'salary' | 'percentage'
  salary: number
  percentage: number
  pin_code?: string
}

interface OrderData {
  total: number
  status: string
  created_at: string
}

const SUPER_ADMIN_EMAIL = 'baobabshop@gmail.com'
const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString()

export default function SuperAdmin() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedQR, setSelectedQR] = useState<Employee | null>(null)
  const [selectedPay, setSelectedPay] = useState<Employee | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'employees' | 'payments' | 'charts' | 'stats' | 'scanner' | 'settings'>('employees')
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [scanResult, setScanResult] = useState<string | null>(null)
  const [scannedEmployee, setScannedEmployee] = useState<Employee | null>(null)
  const [orders, setOrders] = useState<OrderData[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [newEmployee, setNewEmployee] = useState({
    name: '', email: '', role: 'employee' as 'admin' | 'employee',
    payment_type: 'salary' as 'salary' | 'percentage',
    salary: 0, percentage: 0,
    pin_code: generatePin(),
  })
  const [paymentSettings, setPaymentSettings] = useState({
    id: '', wave_link: '', orange_number: '',
    bank_name: '', bank_account_name: '', bank_account_number: '', bank_iban: '',
  })
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser()
      setUser(authData.user)
      if (authData.user?.email === SUPER_ADMIN_EMAIL) {
        await loadEmployees()
        await loadStats()
        await loadPaymentSettings()
        await loadOrders()
      }
      setLoading(false)
    }
    init()

    const channel = supabase
      .channel('realtime-orders')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
      }, async () => {
        await loadStats()
        await loadOrders()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (!selectedQR || !qrCanvasRef.current) return
    const canvas = qrCanvasRef.current
    const ctx = canvas.getContext('2d')!
    const size = 220
    canvas.width = size
    canvas.height = size
    const qrImg = new Image()
    qrImg.crossOrigin = 'anonymous'
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=baobab-shop://employee/${selectedQR.id}/${selectedQR.email}&margin=10&ecc=H`
    qrImg.onload = () => {
      ctx.drawImage(qrImg, 0, 0, size, size)
      const cx = size / 2, cy = size / 2, r = 32
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      const logo = new Image()
      logo.src = '/image.png'
      logo.onload = () => { ctx.drawImage(logo, cx - 24, cy - 24, 48, 48) }
      logo.onerror = () => {
        ctx.font = 'bold 28px serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🌳', cx, cy)
      }
    }
  }, [selectedQR])

  useEffect(() => {
    if (activeTab !== 'scanner' || scanResult) return
    let scanner: Html5QrcodeScanner | null = null
    const timeout = setTimeout(() => {
      scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false)
      scanner.render(
        (decodedText) => {
          setScanResult(decodedText)
          scanner?.clear().catch(() => {})
          const parts = decodedText.split('/')
          const employeeId = parts[3]
          const found = employees.find(e => e.id === employeeId)
          setScannedEmployee(found || null)
        },
        () => {}
      )
    }, 300)
    return () => {
      clearTimeout(timeout)
      scanner?.clear().catch(() => {})
    }
  }, [activeTab, scanResult, employees])

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('total, status, created_at')
      .order('created_at', { ascending: true })
    if (data && data.length > 0) {
      setOrders(data)
      processChartData(data)
    }
  }

  const processChartData = (data: OrderData[]) => {
    const grouped: Record<string, { revenus: number, pertes: number, commandes: number }> = {}
    data.forEach(order => {
      const date = new Date(order.created_at)
      const key = `${date.getDate()}/${date.getMonth() + 1}`
      if (!grouped[key]) grouped[key] = { revenus: 0, pertes: 0, commandes: 0 }
      grouped[key].commandes++
      if (order.status === 'annulé' || order.status === 'cancelled') {
        grouped[key].pertes += order.total || 0
      } else {
        grouped[key].revenus += order.total || 0
      }
    })
    setChartData(Object.entries(grouped).map(([date, vals]) => ({
      date,
      revenus: Math.round(vals.revenus),
      pertes: Math.round(vals.pertes),
      commandes: vals.commandes,
    })))
  }

  const loadEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false })
    if (error) return showMsg('❌ Erreur chargement employés', 'error')
    setEmployees(data || [])
  }

  const loadStats = async () => {
    const { data: ordersData } = await supabase.from('orders').select('total')
    if (ordersData) {
      setTotalOrders(ordersData.length)
      setTotalRevenue(ordersData.reduce((sum, o) => sum + (o.total || 0), 0))
    }
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    setTotalUsers(count || 0)
  }

  const loadPaymentSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').limit(1).single()
    if (data) setPaymentSettings(data)
  }

  const savePaymentSettings = async () => {
    const { error } = await supabase.from('payment_settings')
      .update({
        wave_link: paymentSettings.wave_link,
        orange_number: paymentSettings.orange_number,
        bank_name: paymentSettings.bank_name,
        bank_account_name: paymentSettings.bank_account_name,
        bank_account_number: paymentSettings.bank_account_number,
        bank_iban: paymentSettings.bank_iban,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentSettings.id)
    if (error) return showMsg('❌ Erreur: ' + error.message, 'error')
    showMsg('✅ Coordonnées de paiement mises à jour !', 'success')
  }

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email)
      return showMsg('❌ Nom et email obligatoires !', 'error')
    const { error } = await supabase.from('employees').insert([{
      name: newEmployee.name,
      email: newEmployee.email,
      role: newEmployee.role,
      payment_type: newEmployee.payment_type,
      salary: newEmployee.salary,
      percentage: newEmployee.percentage,
      pin_code: newEmployee.pin_code,
    }])
    if (error) return showMsg('❌ Erreur: ' + error.message, 'error')
    showMsg(`✅ Employé ajouté ! PIN : ${newEmployee.pin_code}`, 'success')
    setShowAddModal(false)
    setNewEmployee({
      name: '', email: '', role: 'employee', payment_type: 'salary',
      salary: 0, percentage: 0, pin_code: generatePin(),
    })
    await loadEmployees()
  }

  const deleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer ${name} ?`)) return
    const { error } = await supabase.from('employees').delete().eq('id', id)
    if (error) return showMsg('❌ Erreur suppression', 'error')
    showMsg('✅ Employé supprimé !', 'success')
    await loadEmployees()
  }

  const updateRole = async (id: string, role: 'admin' | 'employee') => {
    const { error } = await supabase.from('employees').update({ role }).eq('id', id)
    if (error) return showMsg('❌ Erreur mise à jour', 'error')
    showMsg('✅ Rôle mis à jour !', 'success')
    await loadEmployees()
  }

  const updatePayment = async (emp: Employee) => {
    const { error } = await supabase.from('employees')
      .update({ payment_type: emp.payment_type, salary: emp.salary, percentage: emp.percentage })
      .eq('id', emp.id)
    if (error) return showMsg('❌ Erreur mise à jour paiement', 'error')
    showMsg('✅ Paiement mis à jour !', 'success')
    setSelectedPay(null)
    await loadEmployees()
  }

  const downloadQR = () => {
    if (!qrCanvasRef.current) return
    const link = document.createElement('a')
    link.download = `qr-${selectedQR?.name}.png`
    link.href = qrCanvasRef.current.toDataURL()
    link.click()
  }

  const totalSalaries = employees.reduce((sum, e) => {
    if (e.payment_type === 'salary') return sum + e.salary
    return sum + (totalRevenue * e.percentage / 100)
  }, 0)

  const totalPertes = orders.filter(o => o.status === 'annulé' || o.status === 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0)

  if (loading) return <div style={{ textAlign: 'center', padding: 60, fontSize: 32 }}>⏳</div>

  if (!user || user.email !== SUPER_ADMIN_EMAIL) return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A' }}>Accès refusé</h2>
        <p style={{ color: '#7A5C42' }}>Seul le Super Admin peut accéder à cette page</p>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#F5ECD7', minHeight: '100vh', padding: 24, fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* MESSAGE */}
        {message && (
          <div style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`,
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            borderRadius: 10, padding: '10px 20px', fontSize: 13,
            fontWeight: 600, zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', whiteSpace: 'nowrap',
          }}>
            {message.text}
          </div>
        )}

        {/* HEADER */}
        <div style={{
          background: 'linear-gradient(135deg, #3A1F0A, #5C3317)',
          borderRadius: 16, padding: 24, marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', color: '#F5ECD7', fontSize: 24, margin: 0 }}>
              👑 Super Admin
            </h1>
            <p style={{ color: 'rgba(245,236,215,0.7)', fontSize: 13, margin: '4px 0 0' }}>
              Contrôle total de B@OB@B Shop
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ background: '#2D6A4F', borderRadius: 12, padding: '10px 16px', textAlign: 'center' }}>
              <div style={{ color: '#F5ECD7', fontSize: 11, fontWeight: 600 }}>SUPER ADMIN</div>
              <div style={{ color: '#52B788', fontSize: 12, marginTop: 2 }}>● Connecté</div>
            </div>
            <button onClick={() => setShowLogoutModal(true)} style={{
              background: '#e53e3e', color: 'white', border: 'none', borderRadius: 12,
              padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>🚪 Déconnexion</button>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '👥', label: 'Employés', value: employees.length },
            { icon: '🛒', label: 'Commandes', value: totalOrders },
            { icon: '💰', label: 'Revenus', value: totalRevenue.toLocaleString('fr-FR') + ' F' },
            { icon: '👤', label: 'Clients', value: totalUsers },
          ].map((s) => (
            <div key={s.label} style={{ background: 'white', borderRadius: 12, padding: 16, textAlign: 'center', border: '1px solid #E8D5B0' }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#3A1F0A', marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#7A5C42' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { key: 'employees', label: '👥 Employés' },
            { key: 'payments', label: '💰 Paiements' },
            { key: 'charts', label: '📈 Graphiques' },
            { key: 'stats', label: '📊 Statistiques' },
            { key: 'scanner', label: '📷 Scanner' },
            { key: 'settings', label: '⚙️ Mes coordonnées' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => {
              setActiveTab(tab.key as any)
              setScanResult(null)
              setScannedEmployee(null)
            }} style={{
              padding: '9px 20px', borderRadius: 20, border: '1.5px solid',
              borderColor: activeTab === tab.key ? '#3A1F0A' : '#E8D5B0',
              background: activeTab === tab.key ? '#3A1F0A' : 'white',
              color: activeTab === tab.key ? '#F5ECD7' : '#7A5C42',
              fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ONGLET EMPLOYÉS */}
        {activeTab === 'employees' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>👥 Gestion des employés</h2>
              <button onClick={() => setShowAddModal(true)} style={{ background: '#2D6A4F', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>➕ Ajouter</button>
            </div>
            {employees.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#7A5C42' }}>Aucun employé. Cliquez sur ➕ Ajouter.</div>
            ) : employees.map((emp, i) => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < employees.length - 1 ? '1px solid #F5ECD7' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {emp.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: '#7A5C42' }}>{emp.email}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: '#2D6A4F' }}>
                      {emp.payment_type === 'salary' ? `💵 ${emp.salary.toLocaleString('fr-FR')} FCFA` : `📊 ${emp.percentage}%`}
                    </span>
                    {emp.pin_code && (
                      <span style={{ fontSize: 11, color: '#C9860A', fontWeight: 700 }}>
                        🔐 PIN: {emp.pin_code}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ background: emp.role === 'admin' ? '#D8F3DC' : '#F5ECD7', color: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>
                  {emp.role === 'admin' ? '⚙️ Admin' : '👤 Employé'}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSelectedQR(emp)} style={{ background: '#3A1F0A', color: 'white', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>📱</button>
                  <button onClick={() => setSelectedPay({ ...emp })} style={{ background: '#C9860A', color: 'white', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>💰</button>
                  {emp.role === 'employee' ? (
                    <button onClick={() => updateRole(emp.id, 'admin')} style={{ background: '#2D6A4F', color: 'white', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>⬆️</button>
                  ) : (
                    <button onClick={() => updateRole(emp.id, 'employee')} style={{ background: '#FFE4E4', color: '#e53e3e', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>⬇️</button>
                  )}
                  <button onClick={() => deleteEmployee(emp.id, emp.name)} style={{ background: '#fee2e2', color: '#e53e3e', border: 'none', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ONGLET PAIEMENTS */}
        {activeTab === 'payments' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>💰 Paiements du mois</h2>
              <div style={{ fontSize: 13, color: '#7A5C42' }}>Total: <strong style={{ color: '#e53e3e' }}>{totalSalaries.toLocaleString('fr-FR')} FCFA</strong></div>
            </div>
            {employees.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#7A5C42' }}>Aucun employé.</div>
            ) : employees.map((emp, i) => {
              const montant = emp.payment_type === 'salary' ? emp.salary : Math.round(totalRevenue * emp.percentage / 100)
              return (
                <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < employees.length - 1 ? '1px solid #F5ECD7' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: emp.role === 'admin' ? '#2D6A4F' : '#8B5E3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{emp.name[0]}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E' }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: '#7A5C42' }}>{emp.payment_type === 'salary' ? '💵 Salaire fixe' : `📊 ${emp.percentage}% des bénéfices`}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 12 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#2D6A4F' }}>{montant.toLocaleString('fr-FR')} FCFA</div>
                    <div style={{ fontSize: 11, color: '#7A5C42' }}>Ce mois</div>
                  </div>
                  <button onClick={() => showMsg(`✅ Paiement de ${montant.toLocaleString('fr-FR')} FCFA envoyé à ${emp.name} !`, 'success')} style={{ background: '#2D6A4F', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>💸 Payer</button>
                </div>
              )
            })}
          </div>
        )}

        {/* ONGLET GRAPHIQUES */}
        {activeTab === 'charts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ background: '#D8F3DC', borderRadius: 14, padding: 20, textAlign: 'center', border: '1px solid #6ee7b7' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>💰</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#2D6A4F' }}>{totalRevenue.toLocaleString('fr-FR')} FCFA</div>
                <div style={{ fontSize: 12, color: '#2D6A4F', marginTop: 2 }}>Revenus totaux</div>
              </div>
              <div style={{ background: '#fee2e2', borderRadius: 14, padding: 20, textAlign: 'center', border: '1px solid #fca5a5' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>📉</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#e53e3e' }}>{totalPertes.toLocaleString('fr-FR')} FCFA</div>
                <div style={{ fontSize: 12, color: '#e53e3e', marginTop: 2 }}>Pertes (annulations)</div>
              </div>
              <div style={{ background: '#EBF8FF', borderRadius: 14, padding: 20, textAlign: 'center', border: '1px solid #90cdf4' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>📦</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#1B8EF8' }}>{totalOrders}</div>
                <div style={{ fontSize: 12, color: '#1B8EF8', marginTop: 2 }}>Total commandes</div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 14, padding: 60, textAlign: 'center', border: '1px solid #E8D5B0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
                <p style={{ color: '#7A5C42' }}>Aucune donnée disponible pour les graphiques</p>
              </div>
            ) : (
              <>
                {/* AREA CHART */}
                <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E8D5B0' }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 16, marginBottom: 20 }}>📈 Évolution revenus vs pertes (FCFA)</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorPertes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#e53e3e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#e53e3e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5ECD7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7A5C42' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#7A5C42' }} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                      <Tooltip formatter={(value: any) => [value.toLocaleString('fr-FR') + ' FCFA']} contentStyle={{ borderRadius: 8, border: '1px solid #E8D5B0' }} />
                      <Legend />
                      <Area type="monotone" dataKey="revenus" name="Revenus" stroke="#2D6A4F" strokeWidth={2} fill="url(#colorRevenus)" />
                      <Area type="monotone" dataKey="pertes" name="Pertes" stroke="#e53e3e" strokeWidth={2} fill="url(#colorPertes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* LINE CHART */}
                <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E8D5B0' }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 16, marginBottom: 20 }}>🛒 Courbe d'évolution des commandes</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5ECD7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7A5C42' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#7A5C42' }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8D5B0' }} />
                      <Legend />
                      <Line type="monotone" dataKey="commandes" name="Commandes" stroke="#C9860A" strokeWidth={2} dot={{ fill: '#C9860A', r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="revenus" name="Revenus (FCFA)" stroke="#2D6A4F" strokeWidth={2} dot={{ fill: '#2D6A4F', r: 3 }} />
                      <Line type="monotone" dataKey="pertes" name="Pertes (FCFA)" stroke="#e53e3e" strokeWidth={2} dot={{ fill: '#e53e3e', r: 3 }} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* BAR CHART */}
                <div style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E8D5B0' }}>
                  <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 16, marginBottom: 20 }}>📊 Comparaison revenus / pertes par jour</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F5ECD7" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#7A5C42' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#7A5C42' }} tickFormatter={(v) => v.toLocaleString('fr-FR')} />
                      <Tooltip formatter={(value: any) => [value.toLocaleString('fr-FR') + ' FCFA']} contentStyle={{ borderRadius: 8, border: '1px solid #E8D5B0' }} />
                      <Legend />
                      <Bar dataKey="revenus" name="Revenus" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pertes" name="Pertes" fill="#e53e3e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* ONGLET STATS */}
        {activeTab === 'stats' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { icon: '💰', label: 'Revenus totaux', value: totalRevenue.toLocaleString('fr-FR') + ' FCFA', color: '#2D6A4F' },
              { icon: '💸', label: 'Masse salariale', value: totalSalaries.toLocaleString('fr-FR') + ' FCFA', color: '#e53e3e' },
              { icon: '📦', label: 'Commandes totales', value: totalOrders, color: '#C9860A' },
              { icon: '👤', label: 'Clients inscrits', value: totalUsers, color: '#3A1F0A' },
              { icon: '👥', label: 'Total employés', value: employees.length, color: '#8B5E3C' },
              { icon: '⚙️', label: 'Admins', value: employees.filter(e => e.role === 'admin').length, color: '#2D6A4F' },
            ].map((s) => (
              <div key={s.label} style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #E8D5B0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#7A5C42', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ONGLET SCANNER */}
        {activeTab === 'scanner' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8D5B0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5ECD7' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: 0 }}>📷 Scanner QR Code</h2>
            </div>
            <div style={{ padding: 24 }}>
              {!scanResult ? (
                <div>
                  <p style={{ fontSize: 13, color: '#7A5C42', marginBottom: 16, textAlign: 'center' }}>Pointez la caméra vers le QR code d'un employé</p>
                  <div id="qr-reader" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} />
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {scannedEmployee ? (
                    <div style={{ background: '#D8F3DC', border: '1px solid #6ee7b7', borderRadius: 14, padding: 24, maxWidth: 360, margin: '0 auto' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                      <h3 style={{ color: '#2D6A4F', fontFamily: 'Georgia, serif', margin: '0 0 16px' }}>Employé identifié !</h3>
                      <div style={{ background: 'white', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', background: scannedEmployee.role === 'admin' ? '#2D6A4F' : '#8B5E3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 20 }}>{scannedEmployee.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: '#2C1A0E' }}>{scannedEmployee.name}</div>
                            <div style={{ fontSize: 13, color: '#7A5C42' }}>{scannedEmployee.email}</div>
                          </div>
                        </div>
                        {[
                          { label: 'Rôle', value: scannedEmployee.role === 'admin' ? '⚙️ Admin' : '👤 Employé' },
                          { label: 'Paiement', value: scannedEmployee.payment_type === 'salary' ? `💵 ${scannedEmployee.salary.toLocaleString('fr-FR')} FCFA` : `📊 ${scannedEmployee.percentage}% des bénéfices` },
                          { label: 'Ajouté le', value: new Date(scannedEmployee.created_at).toLocaleDateString('fr-FR') },
                        ].map((item) => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5ECD7', fontSize: 13 }}>
                            <span style={{ color: '#7A5C42', fontWeight: 600 }}>{item.label}</span>
                            <span style={{ color: '#2C1A0E', fontWeight: 600 }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 14, padding: 24, maxWidth: 360, margin: '0 auto' }}>
                      <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
                      <h3 style={{ color: '#991b1b', fontFamily: 'Georgia, serif', margin: '0 0 8px' }}>Employé non trouvé</h3>
                      <p style={{ fontSize: 13, color: '#7A5C42', margin: '0 0 16px', wordBreak: 'break-all' }}>{scanResult}</p>
                    </div>
                  )}
                  <button onClick={() => { setScanResult(null); setScannedEmployee(null) }} style={{ marginTop: 20, padding: '12px 32px', background: '#3A1F0A', color: 'white', border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    📷 Scanner à nouveau
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET COORDONNÉES */}
        {activeTab === 'settings' && (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8D5B0', padding: 24 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 17, margin: '0 0 4px' }}>⚙️ Mes coordonnées de paiement</h2>
            <p style={{ fontSize: 12, color: '#7A5C42', margin: '0 0 20px' }}>Ces informations seront affichées aux clients lors de la confirmation de leur commande.</p>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F5ECD7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img src="/wave.png" alt="Wave" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>Wave Business</h3>
              </div>
              <input type="text" placeholder="https://pay.wave.com/m/M_xxx/c/sn/" value={paymentSettings.wave_link}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, wave_link: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #F5ECD7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img src="/orange.png" alt="Orange Money" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>Orange Money</h3>
              </div>
              <input type="tel" placeholder="77 123 45 67" value={paymentSettings.orange_number}
                onChange={(e) => setPaymentSettings({ ...paymentSettings, orange_number: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏦</div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#2C1A0E', margin: 0 }}>Virement bancaire</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Nom de la banque', key: 'bank_name', placeholder: 'Ecobank, CBAO, etc.' },
                  { label: 'Titulaire du compte', key: 'bank_account_name', placeholder: 'B@OB@B SHOP SARL' },
                  { label: 'Numéro de compte', key: 'bank_account_number', placeholder: 'SN08 SN12 3456 7890...' },
                  { label: 'IBAN (optionnel)', key: 'bank_iban', placeholder: 'SN08SN12345678...' },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4 }}>{f.label}</label>
                    <input type="text" placeholder={f.placeholder} value={(paymentSettings as any)[f.key]}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, [f.key]: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' as const }} />
                  </div>
                ))}
              </div>
            </div>
            <button onClick={savePaymentSettings} style={{ width: '100%', padding: '14px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 20, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              ✅ Enregistrer mes coordonnées
            </button>
          </div>
        )}
      </div>

      {/* MODAL CONFIRMATION DÉCONNEXION */}
      {showLogoutModal && (
        <div onClick={() => setShowLogoutModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚪</div>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 20, margin: '0 0 8px' }}>Déconnexion</h3>
            <p style={{ color: '#7A5C42', fontSize: 14, margin: '0 0 24px' }}>Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '12px', background: '#F5ECD7', color: '#3A1F0A', border: '1px solid #E8D5B0', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '12px', background: '#e53e3e', color: 'white', border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🚪 Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AJOUTER EMPLOYÉ */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' as const }}>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, margin: '0 0 20px' }}>➕ Ajouter un employé</h3>
            {[
              { label: 'Nom complet', key: 'name', type: 'text', placeholder: 'Amadou Diallo' },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'amadou@gmail.com' },
            ].map((field) => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const }}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder} value={(newEmployee as any)[field.key]}
                  onChange={(e) => setNewEmployee({ ...newEmployee, [field.key]: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            ))}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const }}>Rôle</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['employee', 'admin'] as const).map((r) => (
                  <div key={r} onClick={() => setNewEmployee({ ...newEmployee, role: r })} style={{ border: `2px solid ${newEmployee.role === r ? '#2D6A4F' : '#E8D5B0'}`, background: newEmployee.role === r ? '#D8F3DC' : 'white', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newEmployee.role === r ? '#2D6A4F' : '#7A5C42' }}>
                    {r === 'employee' ? '👤 Employé' : '⚙️ Admin'}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const }}>Type de paiement</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['salary', 'percentage'] as const).map((t) => (
                  <div key={t} onClick={() => setNewEmployee({ ...newEmployee, payment_type: t })} style={{ border: `2px solid ${newEmployee.payment_type === t ? '#2D6A4F' : '#E8D5B0'}`, background: newEmployee.payment_type === t ? '#D8F3DC' : 'white', borderRadius: 8, padding: '10px', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: newEmployee.payment_type === t ? '#2D6A4F' : '#7A5C42' }}>
                    {t === 'salary' ? '💵 Salaire fixe' : '📊 Commission'}
                  </div>
                ))}
              </div>
            </div>
            {newEmployee.payment_type === 'salary' ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const }}>Salaire (FCFA)</label>
                <input type="number" placeholder="150000" value={newEmployee.salary || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, salary: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const }}>Pourcentage (%)</label>
                <input type="number" placeholder="10" min="1" max="50" value={newEmployee.percentage || ''}
                  onChange={(e) => setNewEmployee({ ...newEmployee, percentage: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const }} />
              </div>
            )}

            {/* PIN CODE GÉNÉRÉ AUTOMATIQUEMENT */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 4, textTransform: 'uppercase' as const }}>
                🔐 Code PIN (à donner à l'employé)
              </label>
              <div style={{ background: '#F5ECD7', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #E8D5B0' }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#3A1F0A', letterSpacing: 6, fontFamily: 'monospace' }}>
                  {newEmployee.pin_code}
                </span>
                <button onClick={() => setNewEmployee({ ...newEmployee, pin_code: generatePin() })} style={{ background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  🔄 Regénérer
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#e53e3e', margin: '6px 0 0', fontWeight: 600 }}>
                ⚠️ Notez ce code et transmettez-le à l'employé. Il en aura besoin pour accéder à la page Admin.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '12px', background: '#F5ECD7', color: '#3A1F0A', border: '1px solid #E8D5B0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={addEmployee} style={{ flex: 2, padding: '12px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Ajouter</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE */}
      {selectedQR && (
        <div onClick={() => setSelectedQR(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, textAlign: 'center', maxWidth: 320, width: '100%' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, margin: '0 0 4px' }}>📱 QR Code</h3>
            <p style={{ color: '#7A5C42', fontSize: 13, margin: '0 0 16px' }}>{selectedQR.name}</p>
            <div style={{ display: 'inline-block', border: '2px solid #E8D5B0', borderRadius: 12, padding: 8, marginBottom: 12 }}>
              <canvas ref={qrCanvasRef} style={{ display: 'block', width: 220, height: 220 }} />
            </div>
            <p style={{ fontSize: 10, color: '#9A7B5A', margin: '0 0 16px', wordBreak: 'break-all', fontFamily: 'monospace' }}>{selectedQR.id}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadQR} style={{ flex: 1, padding: '10px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⬇️ Télécharger</button>
              <button onClick={() => setSelectedQR(null)} style={{ flex: 1, padding: '10px', background: '#F5ECD7', color: '#3A1F0A', border: '1px solid #E8D5B0', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT */}
      {selectedPay && (
        <div onClick={() => setSelectedPay(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 400, width: '100%' }}>
            <h3 style={{ fontFamily: 'Georgia, serif', color: '#3A1F0A', fontSize: 18, margin: '0 0 4px' }}>💰 Mode de paiement</h3>
            <p style={{ color: '#7A5C42', fontSize: 13, margin: '0 0 20px' }}>{selectedPay.name}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {(['salary', 'percentage'] as const).map((t) => (
                <div key={t} onClick={() => setSelectedPay({ ...selectedPay, payment_type: t })} style={{ border: `2px solid ${selectedPay.payment_type === t ? '#2D6A4F' : '#E8D5B0'}`, background: selectedPay.payment_type === t ? '#D8F3DC' : 'white', borderRadius: 12, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{t === 'salary' ? '💵' : '📊'}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#2C1A0E' }}>{t === 'salary' ? 'Salaire fixe' : 'Commission'}</div>
                </div>
              ))}
            </div>
            {selectedPay.payment_type === 'salary' ? (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6, textTransform: 'uppercase' as const }}>Salaire mensuel (FCFA)</label>
                <input type="number" value={selectedPay.salary}
                  onChange={(e) => setSelectedPay({ ...selectedPay, salary: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' as const }} />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7A5C42', display: 'block', marginBottom: 6, textTransform: 'uppercase' as const }}>Pourcentage (%)</label>
                <input type="number" value={selectedPay.percentage} min="1" max="50"
                  onChange={(e) => setSelectedPay({ ...selectedPay, percentage: parseInt(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8D5B0', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' as const }} />
                <p style={{ fontSize: 12, color: '#7A5C42', marginTop: 6 }}>
                  💡 Montant estimé: {Math.round(totalRevenue * selectedPay.percentage / 100).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelectedPay(null)} style={{ flex: 1, padding: '12px', background: '#F5ECD7', color: '#3A1F0A', border: '1px solid #E8D5B0', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
              <button onClick={() => updatePayment(selectedPay)} style={{ flex: 2, padding: '12px', background: '#2D6A4F', color: 'white', border: 'none', borderRadius: 20, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>✅ Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}