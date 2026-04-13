import { ImageResponse } from 'next/og'

// 32×32 — browser tab favicon
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
        background: '#0e8f82',
        borderRadius: '6px',
      }}
    >
      <span
        style={{
          color:      'white',
          fontSize:   '22px',
          fontWeight: 700,
          fontFamily: 'serif',
          fontStyle:  'italic',
          lineHeight: 1,
          paddingTop: '3px',
        }}
      >
        I
      </span>
    </div>,
    { ...size },
  )
}
