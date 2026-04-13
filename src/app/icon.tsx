import { ImageResponse } from 'next/og'

export const size        = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #14b8a6 0%, #6366f1 100%)',
        borderRadius: '7px',
      }}
    >
      <span
        style={{
          color: 'white',
          fontSize: '22px',
          fontWeight: 800,
          fontFamily: 'sans-serif',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        I
      </span>
    </div>,
    { ...size },
  )
}
