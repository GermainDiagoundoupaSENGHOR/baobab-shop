import Link from 'next/link'

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section style={{
        backgroundImage: 'linear-gradient(rgba(58,31,10,0.7), rgba(58,31,10,0.85)), url("https://www.publicdomainpictures.net/pictures/590000/velka/baobab-tree-africa-1709928044FwT.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '120px 24px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: 'Georgia, serif',
          color: '#F5ECD7',
          fontSize: 48,
          marginBottom: 12,
        }}>
          B<span style={{ color: '#52B788' }}>@</span>OB
          <span style={{ color: '#52B788' }}>@</span>B Shop
        </h1>
        <p style={{ color: 'rgba(245,236,215,0.8)', fontSize: 18, maxWidth: 500, margin: '0 auto 32px' }}>
          Le marché digital du Sénégal — Électronique, Vêtements et plus
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/electronique" style={{
            background: '#2D6A4F',
            color: 'white',
            padding: '14px 32px',
            borderRadius: 24,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
          }}>
            📱 Électronique
          </Link>
          <Link href="/vetements" style={{
            background: 'transparent',
            color: '#F5ECD7',
            padding: '14px 32px',
            borderRadius: 24,
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: 16,
            border: '2px solid rgba(245,236,215,0.5)',
          }}>
            👗 Vêtements
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        background: '#3A1F0A',
        padding: '40px 24px',
        gap: 24,
      }}>
        {[
          { icon: '📦', title: 'Livraison rapide', sub: 'Partout au Sénégal' },
          { icon: '🌊', title: 'Paiement Wave', sub: 'Simple & sécurisé' },
          { icon: '🟠', title: 'Orange Money', sub: 'Accepté partout' },
          { icon: '🔒', title: 'Sécurisé', sub: 'Vos données protégées' },
        ].map((f) => (
          <div key={f.title} style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ color: '#F5ECD7', fontWeight: 700, marginBottom: 4 }}>{f.title}</div>
            <div style={{ color: 'rgba(245,236,215,0.6)', fontSize: 13 }}>{f.sub}</div>
          </div>
        ))}
      </section>
    </main>
  )
}