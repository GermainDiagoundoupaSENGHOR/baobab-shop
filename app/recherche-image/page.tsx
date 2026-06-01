'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RechercheImage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [photo, setPhoto] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch {
      alert('Impossible d\'accéder à la caméra')
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
  }

  const takePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setPhoto(canvas.toDataURL('image/jpeg'))
    stopCamera()
  }

  const searchWithPhoto = async () => {
    if (!photo) return
    setLoading(true)
    setTimeout(() => {
      router.push('/recherche?q=produit')
      setLoading(false)
    }, 2000)
  }

  return (
    <div style={{
      background: '#1a1a1a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.8)',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 100,
      }}>
        <button
          onClick={() => { stopCamera(); router.back() }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Retour
        </button>
        <h2 style={{ color: 'white', fontSize: 16, margin: 0 }}>
          🔍 Recherche par image
        </h2>
        <div style={{ width: 60 }} />
      </div>

      <div style={{
        marginTop: 60,
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 500,
        background: '#000',
      }}>
        {!photo ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', display: 'block' }}
          />
        ) : (
          <img src={photo} style={{ width: '100%', display: 'block' }} alt="Photo prise" />
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        {!photo ? (
          <button
            onClick={takePhoto}
            style={{
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 64,
              height: 64,
              fontSize: 28,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            📷
          </button>
        ) : (
          <>
            <button
              onClick={() => { setPhoto(null); startCamera() }}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                padding: '12px 24px',
                borderRadius: 24,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              🔄 Reprendre
            </button>
            <button
              onClick={searchWithPhoto}
              disabled={loading}
              style={{
                background: '#2D6A4F',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 24,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {loading ? '⏳ Recherche...' : '🔍 Rechercher'}
            </button>
          </>
        )}
      </div>

      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
        Pointez la caméra vers un produit et prenez une photo
      </p>
    </div>
  )
}