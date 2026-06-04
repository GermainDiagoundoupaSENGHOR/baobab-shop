import Link from 'next/link'

export default function Home() {
  const categories = [
    { icon: '📱', label: 'Électronique', href: '/electronique', color: '#1B4332' },
    { icon: '👗', label: 'Vêtements', href: '/vetements', color: '#5C3317' },
    { icon: '🌱', label: 'Agriculture', href: '/agriculture', color: '#2D6A4F' },
    { icon: '🎧', label: 'Accessoires', href: '/electronique', color: '#8B5E3C' },
  ]

  const promos = [
    { emoji: '📱', title: 'Smartphones', sub: 'Jusqu\'à -30%', color: '#1B8EF8', bg: '#EBF5FF' },
    { emoji: '👗', title: 'Mode', sub: 'Nouveautés', color: '#FF6600', bg: '#FFF3EB' },
    { emoji: '🌱', title: 'Agriculture', sub: 'Semences fraîches', color: '#2D6A4F', bg: '#EBFFF3' },
  ]

  return (
    <main>
      {/* HERO */}
      <section style={{
        backgroundImage: 'linear-gradient(rgba(58,31,10,0.65), rgba(58,31,10,0.80)), url("https://www.publicdomainpictures.net/pictures/590000/velka/baobab-tree-africa-1709928044FwT.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '80px 24px 60px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: '#2D6A4F',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          padding: '4px 14px',
          borderRadius: 20,
          marginBottom: 16,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          🇸🇳 Le marché digital du Sénégal
        </div>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#F5ECD7',
          fontSize: 44,
          marginBottom: 12,
          lineHeight: 1.2,
        }}>
          B<span style={{ color: '#52B788' }}>@</span>OB
          <span style={{ color: '#52B788' }}>@</span>B Shop
        </h1>
        <p style={{
          color: 'rgba(245,236,215,0.85)',
          fontSize: 16,
          maxWidth: 480,
          margin: '0 auto 28px',
          lineHeight: 1.6,
        }}>
          Électronique, Vêtements, Agriculture — Livraison partout au Sénégal
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/electronique" style={{
            background: '#2D6A4F', color: 'white',
            padding: '13px 28px', borderRadius: 24,
            textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>
            🛍️ Découvrir
          </Link>
          <Link href="/assistant" style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#F5ECD7', border: '1.5px solid rgba(245,236,215,0.5)',
            padding: '13px 28px', borderRadius: 24,
            textDecoration: 'none', fontWeight: 700, fontSize: 15,
          }}>
            🤖 Assistant IA
          </Link>
        </div>
      </section>

      {/* BANNIÈRES PROMO */}
      <section style={{ padding: '20px 16px', background: '#F5ECD7' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {promos.map((p) => (
            <div key={p.title} style={{
              background: p.bg,
              borderRadius: 12,
              padding: '16px 12px',
              textAlign: 'center',
              border: `1px solid ${p.color}22`,
            }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{p.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.title}</div>
              <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: '8px 16px 20px', background: '#F5ECD7' }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          color: '#3A1F0A', fontSize: 20,
          marginBottom: 14,
        }}>
          🛒 Nos catégories
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {categories.map((cat) => (
            <Link key={cat.label} href={cat.href} style={{
              background: 'white',
              borderRadius: 12,
              padding: '16px 8px',
              textAlign: 'center',
              textDecoration: 'none',
              border: '1px solid #E8D5B0',
              transition: 'transform 0.2s',
            }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>{cat.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: cat.color }}>{cat.label}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* POURQUOI BAOBAB */}
      <section style={{ padding: '20px 16px', background: 'white', margin: '0 16px 20px', borderRadius: 16, border: '1px solid #E8D5B0' }}>
        <h2 style={{
          fontFamily: 'Georgia, serif',
          color: '#3A1F0A', fontSize: 18,
          marginBottom: 16, textAlign: 'center',
        }}>
          🌳 Pourquoi B@OB@B Shop ?
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[
            { icon: '📦', title: 'Livraison rapide', sub: 'Partout au Sénégal en 2-4 jours' },
            { icon: '🌊', title: 'Wave & Orange Money', sub: 'Paiement simple et sécurisé' },
            { icon: '🤖', title: 'Assistant IA', sub: 'En Wolof, Français et English' },
            { icon: '🔒', title: '100% Sécurisé', sub: 'Vos données sont protégées' },
          ].map((f) => (
            <div key={f.title} style={{
              display: 'flex', gap: 10,
              alignItems: 'flex-start',
              padding: 10,
              background: '#F5ECD7',
              borderRadius: 10,
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#3A1F0A' }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#7A5C42', marginTop: 2 }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        background: '#3A1F0A',
        padding: '28px 16px',
        gap: 20,
      }}>
        {[
          { icon: '📦', title: 'Livraison rapide', sub: 'Partout au Sénégal' },
          { icon: '🌊', title: 'Paiement Wave', sub: 'Simple & sécurisé' },
          { icon: '🟠', title: 'Orange Money', sub: 'Accepté partout' },
          { icon: '🔒', title: 'Sécurisé', sub: 'Données protégées' },
        ].map((f) => (
          <div key={f.title} style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ color: '#F5ECD7', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{f.title}</div>
            <div style={{ color: 'rgba(245,236,215,0.6)', fontSize: 11 }}>{f.sub}</div>
          </div>
        ))}
      </section>
    </main>
  )
}