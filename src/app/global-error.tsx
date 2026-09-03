'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4ecf1',
          color: '#2a1424',
          fontFamily: 'Georgia, serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: 380 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#a97722',
              fontFamily: 'monospace',
            }}
          >
            Algo falló
          </p>
          <h1 style={{ marginTop: 12, fontSize: 28 }}>Esta hoja se atascó</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: '#6b4a60' }}>
            Prueba de nuevo. Si sigue igual, pide el enlace otra vez a quien te invitó.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              minHeight: 44,
              cursor: 'pointer',
              padding: '0 20px',
              borderRadius: 2,
              border: '1px solid #55193f',
              background: '#7b2d5e',
              color: '#fbf6f9',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
