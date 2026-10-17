import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social card. Mirrors the on-site terminal hero: zinc-950 plate, phosphor
 * bloom, engineering grid, the ascending-ledger mark, and the evidence-ticker
 * pills. Keep the headline copy in sync with the home hero.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 80,
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(760px 460px at 4% -14%, rgba(16,185,129,0.26), transparent 62%),' +
            'radial-gradient(620px 420px at 104% 8%, rgba(56,189,248,0.14), transparent 60%),' +
            'linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px),' +
            'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Brand lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              border: '1.5px solid rgba(255,255,255,0.12)',
              backgroundColor: '#0f1014',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 18.5 9.2 12l3.6 3.4L20 6.5"
                stroke="#34d399"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15.4 6.5H20v4.6"
                stroke="#34d399"
                strokeOpacity="0.55"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="18.5" r="1.9" fill="#34d399" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4.5,
              fontWeight: 700,
              color: '#ffffff',
              display: 'flex',
            }}
          >
            AI CAPITAL TRACKER
          </div>
        </div>

        <div
          style={{
            fontSize: 66,
            fontWeight: 800,
            marginTop: 34,
            lineHeight: 1.1,
            letterSpacing: -1.5,
            maxWidth: 900,
            display: 'flex',
          }}
        >
          Follow the capital flows behind AI infrastructure.
        </div>

        <div
          style={{
            marginTop: 36,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 20,
          }}
        >
          {['SEC EDGAR', 'Company IR', 'FERC', 'Zero estimates'].map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                border: '1px solid rgba(52,211,153,0.3)',
                backgroundColor: 'rgba(16,185,129,0.1)',
                color: '#6ee7b7',
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 19,
                letterSpacing: 0.5,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}