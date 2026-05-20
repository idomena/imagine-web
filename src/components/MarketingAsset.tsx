import Image from 'next/image'

export function MarketingAsset() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: '#2D8B7A' }}>

      {/* Main split */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-16 flex items-center gap-20">

        {/* -------- LEFT: Typography -------- */}
        <div className="flex-1 flex flex-col items-center gap-9 animate-fade-in text-center">

          <Image src="/imagine-logo.png" alt="Imagine" width={360} height={108} className="object-contain" priority unoptimized style={{ filter: 'brightness(0) invert(1)' }} />

          <h1
            className="text-[70px] leading-[1.12] font-black tracking-[-0.025em] text-white"
            style={{
              fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)',
              textShadow: '0 2px 24px rgba(0,0,0,0.18)',
            }}
          >
            Your app deserves
            <br />
            to be{' '}
            <span style={{ color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>found.</span>
          </h1>

        </div>

        {/* -------- RIGHT: Two 3D phones -------- */}
        <div className="flex-shrink-0 relative" style={{ width: 500, height: 620 }}>

          {/* ── BACK PHONE — true CSS 3D ── */}
          <div
            className="absolute"
            style={{
              top: 0, left: 0, zIndex: 1,
              width: 235, height: 470,
              animation: 'float 4s ease-in-out infinite',
              animationDelay: '-2s',
              transformOrigin: 'top left',
              transform: 'perspective(900px) rotateY(-42deg) rotateX(10deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, transform: 'translateZ(14px)' }}>
              <PhoneChatApp />
            </div>

            {/* Left side face */}
            <div style={{
              position: 'absolute',
              top: 11, left: -13,
              width: 13, height: 448,
              transformOrigin: 'right center',
              transform: 'rotateY(90deg)',
              background: 'linear-gradient(180deg, #6b6560 0%, #3a3530 30%, #201e1b 52%, #3a3530 72%, #6b6560 100%)',
              borderRadius: '5px 0 0 5px',
            }} />

            {/* Top edge */}
            <div style={{
              position: 'absolute',
              top: -13, left: 11,
              width: 213, height: 13,
              transformOrigin: 'bottom center',
              transform: 'rotateX(-90deg)',
              background: 'linear-gradient(90deg, #555050, #2a2724 60%, #555050)',
              borderRadius: '3px 3px 0 0',
            }} />

            {/* Bottom edge */}
            <div style={{
              position: 'absolute',
              bottom: -13, left: 11,
              width: 213, height: 13,
              transformOrigin: 'top center',
              transform: 'rotateX(90deg)',
              background: 'linear-gradient(90deg, #555050, #2a2724 60%, #555050)',
              borderRadius: '0 0 3px 3px',
            }} />
          </div>

          {/* ── FRONT PHONE ── */}
          <div
            className="absolute"
            style={{
              top: 55, left: 150, zIndex: 2,
              animation: 'float 4s ease-in-out infinite',
              animationDelay: '0s',
              transformOrigin: 'center center',
              transform: 'perspective(1200px) rotateY(-18deg) rotateX(6deg)',
              filter: 'drop-shadow(0 52px 80px rgba(28,25,23,0.36)) drop-shadow(0 18px 36px rgba(28,25,23,0.20))',
            }}
          >
            <PhoneMarketApp />
          </div>

          {/* ── REFLECTIONS ── */}
          <div style={{
            position: 'absolute',
            top: 555, left: 0, right: 0,
            height: 1,
            background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.06) 80%, transparent 100%)',
          }} />

          <div style={{
            position: 'absolute',
            top: 475, left: -25, width: 245, height: 90,
            transformOrigin: 'top center',
            transform: 'perspective(900px) rotateX(80deg) rotateY(-42deg) scaleX(0.88)',
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(28,25,22,0.22), transparent 100%)',
            filter: 'blur(6px)', opacity: 0.7, pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute',
            top: 555, left: 138, width: 270, height: 100,
            transformOrigin: 'top center',
            transform: 'perspective(1200px) rotateX(75deg) rotateY(-18deg) scaleX(0.88)',
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(28,25,22,0.28), transparent 100%)',
            filter: 'blur(8px)', opacity: 0.75, pointerEvents: 'none',
          }} />

        </div>
      </div>

      {/* Fine-print badge */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] text-stone-400 font-medium tracking-wide uppercase animate-fade-in">
        <div className="w-1 h-1 rounded-full bg-[#2D8B7A]" />
        imaginehq.services
        <div className="w-1 h-1 rounded-full bg-[#2D8B7A]" />
      </div>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Phone shell wrapper
// ---------------------------------------------------------------------------
function PhoneShell({ children, width = 256, height = 512 }: {
  children: React.ReactNode
  width?: number
  height?: number
}) {
  return (
    <div
      className="relative rounded-[44px] bg-stone-900 p-[9px]"
      style={{
        width,
        height,
        boxShadow: '0 0 0 1px rgba(255,255,255,0.07) inset, 0 0 0 1px rgba(0,0,0,0.5)',
      }}
    >
      {/* Dynamic island */}
      <div className="absolute top-[17px] left-1/2 -translate-x-1/2 w-[82px] h-[24px] rounded-full bg-black z-20" />
      {/* Side buttons (left) */}
      <div className="absolute left-[-3px] top-[100px] w-[3px] h-[36px] bg-stone-700 rounded-l-sm" />
      <div className="absolute left-[-3px] top-[148px] w-[3px] h-[52px] bg-stone-700 rounded-l-sm" />
      <div className="absolute left-[-3px] top-[212px] w-[3px] h-[52px] bg-stone-700 rounded-l-sm" />
      {/* Power button (right) */}
      <div className="absolute right-[-3px] top-[160px] w-[3px] h-[68px] bg-stone-700 rounded-r-sm" />
      {/* Screen */}
      <div className="w-full h-full rounded-[36px] overflow-hidden bg-white flex flex-col">
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Phone 1 — Home screen (front phone)
// ---------------------------------------------------------------------------
function PhoneMarketApp() {
  return (
    <PhoneShell width={250} height={500}>
      <Image
        src="/screen-home.jpg"
        alt="Imagine home screen"
        width={1170}
        height={2532}
        className="w-full h-full object-cover object-top"
        unoptimized
      />
    </PhoneShell>
  )
}

// ---------------------------------------------------------------------------
// Phone 2 — Submit screen (back phone)
// ---------------------------------------------------------------------------
function PhoneChatApp() {
  return (
    <PhoneShell width={235} height={470}>
      <Image
        src="/screen-submit.jpg"
        alt="Imagine submit screen"
        width={1170}
        height={2532}
        className="w-full h-full object-cover object-top"
        unoptimized
      />
    </PhoneShell>
  )
}
