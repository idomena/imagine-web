import { ImageResponse } from 'next/og'

// 512×512 — used for iOS "Add to Home Screen" and PWA manifest
export const size        = { width: 512, height: 512 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  // Satisfy — the closest Google Font match to the script "Imagine" logo
  let fontData: ArrayBuffer | null = null
  try {
    fontData = await fetch(
      'https://fonts.gstatic.com/s/satisfy/v21/rP2Hp2yn6lkG50LoOZSCHBeHFl0.woff',
      { next: { revalidate: 86400 } } as RequestInit,
    ).then(r => r.arrayBuffer())
  } catch { /* render with fallback */ }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
      }}
    >
      <span
        style={{
          fontFamily: fontData ? 'Satisfy' : 'Georgia, serif',
          fontStyle:  fontData ? 'normal' : 'italic',
          fontSize:   '390px',
          color:      '#0e8f82',   // matches the logo's teal
          lineHeight: 1,
          paddingTop: '60px',     // optical vertical centering for script descenders
        }}
      >
        I
      </span>
    </div>,
    {
      ...size,
      fonts: fontData
        ? [{ name: 'Satisfy', data: fontData, style: 'normal', weight: 400 }]
        : [],
    },
  )
}
