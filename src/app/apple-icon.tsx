import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)',
        borderRadius: '40px',
      }}
    >
      <span
        style={{
          color: 'white',
          fontSize: '120px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        I
      </span>
    </div>,
    { ...size },
  )
}
