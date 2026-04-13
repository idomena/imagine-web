import { ImageResponse } from 'next/og'

export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Teal blob top-left */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -120,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.25) 0%, transparent 70%)',
        }}
      />
      {/* Indigo blob bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: -100,
          right: -100,
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)',
        }}
      />

      {/* Logo mark */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}
      >
        <span style={{ color: 'white', fontSize: 52, fontWeight: 800, fontFamily: 'sans-serif', lineHeight: 1 }}>I</span>
      </div>

      {/* Wordmark */}
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          fontFamily: 'sans-serif',
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          marginBottom: 20,
        }}
      >
        Imagine
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 400,
          fontFamily: 'sans-serif',
          color: '#64748b',
          letterSpacing: '-0.01em',
          maxWidth: 700,
          textAlign: 'center',
        }}
      >
        The world&apos;s first AI-powered app marketplace
      </div>
    </div>,
    { ...size },
  )
}
