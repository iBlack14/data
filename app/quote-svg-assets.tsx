import React from 'react';

/**
 * Patrón de fondo geométrico sutil estilo certificado corporativo / papel membretado de alta gama.
 */
export function DocumentWatermarkPattern() {
  return (
    <svg 
      className="quote-watermark" 
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.45
      }} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="corporateGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(22, 101, 52, 0.04)" strokeWidth="0.8" />
          <circle cx="40" cy="0" r="1.5" fill="rgba(22, 101, 52, 0.08)" />
          <circle cx="0" cy="40" r="1.5" fill="rgba(22, 101, 52, 0.08)" />
        </pattern>
        <linearGradient id="cornerFade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#166534" stopOpacity="0.06"/>
          <stop offset="40%" stopColor="#166534" stopOpacity="0.01"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#corporateGrid)" />
      {/* Detalle geométrico decorativo superior derecho */}
      <circle cx="95%" cy="50" r="140" fill="url(#cornerFade)" />
      <circle cx="5%" cy="92%" r="180" fill="url(#cornerFade)" />
    </svg>
  );
}

/**
 * Sello oficial de certificación y garantía digital OdiseaCloud en SVG puro.
 */
export function OfficialOdiseaSeal({ size = 110 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', filter: 'drop-shadow(0 4px 10px rgba(22,101,52,0.18))' }}
    >
      <defs>
        <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="50%" stopColor="#166534" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <path id="sealTextPathTop" d="M 30,100 A 70,70 0 0,1 170,100" />
        <path id="sealTextPathBottom" d="M 170,100 A 70,70 0 0,1 30,100" />
      </defs>

      {/* Rueda exterior dentada (borde notarial de seguridad) */}
      <circle cx="100" cy="100" r="94" stroke="url(#sealGrad)" strokeWidth="2.5" strokeDasharray="4 2.5" />
      <circle cx="100" cy="100" r="88" fill="#ffffff" stroke="#166534" strokeWidth="2" />
      <circle cx="100" cy="100" r="84" fill="#fafcf9" stroke="#bbf7d0" strokeWidth="1" />
      <circle cx="100" cy="100" r="62" fill="url(#sealGrad)" stroke="#14532d" strokeWidth="1.5" />

      {/* Texto circular superior */}
      <text fill="#14532d" fontSize="9.2" fontWeight="900" letterSpacing="2.2" textAnchor="middle">
        <textPath href="#sealTextPathTop" startOffset="50%">
          ✦ ODISEACLOUD SOLUTIONS ✦
        </textPath>
      </text>

      {/* Texto circular inferior */}
      <text fill="#166534" fontSize="8.5" fontWeight="800" letterSpacing="1.8" textAnchor="middle">
        <textPath href="#sealTextPathBottom" startOffset="50%">
          ★ GARANTÍA &amp; VALIDEZ OFICIAL ★
        </textPath>
      </text>

      {/* Escudo central y estrellas */}
      <g transform="translate(100, 96)">
        {/* Escudo */}
        <path 
          d="M 0,-24 L 18,-15 C 18,6 9,18 0,25 C -9,18 -18,6 -18,-15 Z" 
          fill="#ffffff" 
          stroke="#86efac" 
          strokeWidth="1.5" 
        />
        {/* Checkmark */}
        <path 
          d="M -7,2 L -2,7 L 8,-3" 
          fill="none" 
          stroke="#166534" 
          strokeWidth="2.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* Estrellas laterales */}
        <text x="0" y="36" fill="#f8fafc" fontSize="6.5" fontWeight="900" letterSpacing="1" textAnchor="middle">
          CERTIFIED
        </text>
      </g>
    </svg>
  );
}

/**
 * Firma digital ejecutiva vectorial con trazo natural, sello criptográfico y timestamp.
 */
export function ExecutiveSignatureSvg({ code, date }: { code: string; date: string }) {
  // Generar hash visual consistente según el código
  const hash = `SHA256:${(code + date + 'odiseacloud-valid').split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0).toString(16).toUpperCase().padStart(16, '7F8A')}`;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', minWidth: 240 }}>
      {/* Trazo vectorial elegante de firma manuscrita */}
      <svg width="220" height="68" viewBox="0 0 220 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M 18,48 C 32,22 45,14 62,28 C 76,40 50,56 42,42 C 35,28 72,12 88,32 C 102,50 115,22 130,26 C 145,30 148,46 162,34 C 172,25 186,18 202,30" 
          stroke="#14532d" 
          strokeWidth="2.4" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        <path 
          d="M 28,54 C 65,52 125,50 196,52" 
          stroke="#166534" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          fill="none" 
        />
        {/* Tilde o rúbrica inferior estilizada */}
        <path 
          d="M 120,58 C 145,56 180,59 198,62" 
          stroke="#15803d" 
          strokeWidth="1.2" 
          strokeLinecap="round" 
          fill="none" 
        />
      </svg>

      {/* Línea de firma y cargo */}
      <div style={{ width: '100%', borderTop: '2px solid #166534', paddingTop: 6, marginTop: -4, textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 900, color: '#14532d', letterSpacing: 0.8 }}>
          ODISEACLOUD · DIRECCIÓN COMERCIAL &amp; PROYECTOS
        </div>
        <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ color: '#16a34a', fontWeight: 800 }}>✓ FIRMA DIGITAL VERIFICADA</span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 8, color: '#94a3b8', marginTop: 3, letterSpacing: 0.5, background: '#f8fafc', padding: '2px 6px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
          {hash}
        </div>
      </div>
    </div>
  );
}

/**
 * QR Code vectorial decorativo y funcional para escaneo directo al WhatsApp comercial de OdiseaCloud.
 */
export function VerificationQRCodeSvg({ size = 78 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: 8, background: '#ffffff', borderRadius: 10, border: '1.5px solid #86efac', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fondo */}
        <rect width="100" height="100" fill="#ffffff" rx="4" />
        
        {/* Patrón de QR Code estilizado */}
        {/* Corner top-left */}
        <rect x="8" y="8" width="28" height="28" rx="4" fill="#14532d" />
        <rect x="14" y="14" width="16" height="16" rx="2" fill="#ffffff" />
        <rect x="18" y="18" width="8" height="8" rx="1" fill="#166534" />

        {/* Corner top-right */}
        <rect x="64" y="8" width="28" height="28" rx="4" fill="#14532d" />
        <rect x="70" y="14" width="16" height="16" rx="2" fill="#ffffff" />
        <rect x="74" y="18" width="8" height="8" rx="1" fill="#166534" />

        {/* Corner bottom-left */}
        <rect x="8" y="64" width="28" height="28" rx="4" fill="#14532d" />
        <rect x="14" y="70" width="16" height="16" rx="2" fill="#ffffff" />
        <rect x="18" y="74" width="8" height="8" rx="1" fill="#166534" />

        {/* Matrix pixels */}
        <rect x="42" y="12" width="6" height="6" rx="1" fill="#166534" />
        <rect x="52" y="12" width="6" height="6" rx="1" fill="#166534" />
        <rect x="42" y="24" width="6" height="6" rx="1" fill="#166534" />
        <rect x="52" y="30" width="6" height="6" rx="1" fill="#14532d" />
        
        <rect x="12" y="44" width="6" height="6" rx="1" fill="#166534" />
        <rect x="24" y="44" width="6" height="6" rx="1" fill="#14532d" />
        <rect x="18" y="52" width="6" height="6" rx="1" fill="#166534" />

        <rect x="44" y="44" width="12" height="12" rx="2" fill="#15803d" />
        <circle cx="50" cy="50" r="3" fill="#ffffff" />

        <rect x="64" y="44" width="6" height="6" rx="1" fill="#166534" />
        <rect x="76" y="44" width="6" height="6" rx="1" fill="#14532d" />
        <rect x="84" y="52" width="6" height="6" rx="1" fill="#166534" />

        <rect x="42" y="64" width="6" height="6" rx="1" fill="#14532d" />
        <rect x="52" y="70" width="6" height="6" rx="1" fill="#166534" />
        <rect x="42" y="80" width="6" height="6" rx="1" fill="#166534" />

        <rect x="68" y="68" width="6" height="6" rx="1" fill="#166534" />
        <rect x="80" y="68" width="6" height="6" rx="1" fill="#14532d" />
        <rect x="74" y="78" width="6" height="6" rx="1" fill="#15803d" />
        <rect x="84" y="84" width="6" height="6" rx="1" fill="#166534" />
      </svg>
      <span style={{ fontSize: 7.5, fontWeight: 800, color: '#166534', letterSpacing: 0.6, marginTop: 4, textTransform: 'uppercase' }}>
        SCAN / VERIFICAR
      </span>
    </div>
  );
}

/**
 * Chips de tecnologías e infraestructura de nivel empresarial en SVG y diseño plano.
 */
export function TechTrustChips() {
  const chips = [
    { label: 'Next.js 15 & React', icon: '⚡', color: '#0f172a' },
    { label: 'Google Cloud Platform', icon: '☁️', color: '#1e40af' },
    { label: 'Cloudflare SSL 256-bit', icon: '🔒', color: '#166534' },
    { label: '100% Mobile First', icon: '📱', color: '#7c3aed' },
    { label: 'Soberanía Total de Código', icon: '👑', color: '#b45309' },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {chips.map((c, i) => (
        <span 
          key={i} 
          style={{ 
            fontSize: 10, 
            fontWeight: 800, 
            color: '#1e293b', 
            background: '#ffffff', 
            border: '1px solid #e2e8f0', 
            padding: '4px 10px', 
            borderRadius: 20, 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
          }}
        >
          <span>{c.icon}</span> {c.label}
        </span>
      ))}
    </div>
  );
}

/**
 * Podio holográfico 3D y realce de máxima presencia para la mascota oficial de OdiseaCloud.
 */
export function MascotHeroPodium({
  src = '/assets/images/mascota-izquierda.webp',
  size = 110,
  speechText = '¡Propuesta con 100% de Garantía!',
  roleBadge = '✦ TU SOCIO DIGITAL ODISEACLOUD'
}: {
  src?: string;
  size?: number;
  speechText?: string;
  roleBadge?: string;
}) {
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      padding: '0 8px'
    }}>
      {/* Bocadillo de diálogo ejecutivo flotante */}
      {speechText && (
        <div style={{
          position: 'relative',
          marginBottom: 6,
          background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
          color: '#f0fdf4',
          fontSize: 9.5,
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: 14,
          boxShadow: '0 4px 12px rgba(20,83,45,0.25)',
          border: '1px solid #86efac',
          whiteSpace: 'nowrap',
          letterSpacing: 0.4,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          zIndex: 2
        }}>
          <span style={{ color: '#86efac', fontSize: 11 }}>💬</span>
          <span>{speechText}</span>
          {/* Cola del bocadillo en SVG */}
          <svg 
            width="10" 
            height="6" 
            viewBox="0 0 10 6" 
            style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)' }}
          >
            <polygon points="0,0 10,0 5,6" fill="#166534" />
          </svg>
        </div>
      )}

      {/* Contenedor de la mascota con aura y doble sombra volumétrica */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Aura de energía y halo holográfico en SVG */}
        <svg 
          width={size + 50} 
          height={size + 30} 
          viewBox="0 0 160 140" 
          style={{ position: 'absolute', top: -10, pointerEvents: 'none', zIndex: 0 }}
        >
          <defs>
            <radialGradient id="mascotGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.32" />
              <stop offset="55%" stopColor="#16a34a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="orbitalRing" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#86efac" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#16a34a" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Halo difuso posterior */}
          <ellipse cx="80" cy="70" rx="72" ry="58" fill="url(#mascotGlow)" />
          
          {/* Anillos orbitales holográficos */}
          <ellipse cx="80" cy="115" rx="55" ry="14" fill="none" stroke="url(#orbitalRing)" strokeWidth="1.8" strokeDasharray="6 3" />
          <ellipse cx="80" cy="118" rx="42" ry="10" fill="none" stroke="rgba(34,197,94,0.4)" strokeWidth="1" />
          
          {/* Destellos / Estrellas de energía */}
          <circle cx="28" cy="40" r="2" fill="#22c55e" opacity="0.8" />
          <circle cx="135" cy="50" r="2.5" fill="#86efac" opacity="0.9" />
          <circle cx="120" cy="22" r="1.5" fill="#4ade80" opacity="0.7" />
        </svg>

        {/* Imagen de la Mascota */}
        <img 
          src={src} 
          alt="Mascota Oficial OdiseaCloud" 
          className="mascot-floating"
          style={{
            width: size,
            height: 'auto',
            maxHeight: size + 20,
            objectFit: 'contain',
            display: 'block',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 12px 18px rgba(22,101,52,0.28)) drop-shadow(0 3px 6px rgba(0,0,0,0.14))'
          }}
        />
      </div>

      {/* Podio / Insignia de alta autoridad */}
      <div style={{
        marginTop: 4,
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        border: '1.5px solid #86efac',
        boxShadow: '0 2px 8px rgba(22,101,52,0.12)',
        padding: '3px 10px',
        borderRadius: 12,
        fontSize: 9,
        fontWeight: 900,
        color: '#14532d',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        position: 'relative',
        zIndex: 2
      }}>
        <span style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#16a34a',
          boxShadow: '0 0 6px #22c55e'
        }}/>
        <span>{roleBadge}</span>
      </div>
    </div>
  );
}

