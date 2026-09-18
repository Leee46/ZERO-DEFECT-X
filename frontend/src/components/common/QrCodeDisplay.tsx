import React, { useState, useEffect } from 'react';
import { QrCode, Smartphone, ExternalLink } from 'lucide-react';

interface QrCodeDisplayProps {
  url: string;
  size?: number;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ url, size = 180 }) => {
  const [imgError, setImgError] = useState(false);

  // Encode URL for QR code generation
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=ffffff&bgcolor=121c2c`;

  return (
    <div
      style={{
        backgroundColor: '#121C2C',
        border: '1px solid #4F7CAC',
        borderRadius: '6px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4F7CAC' }}>
        <Smartphone size={20} />
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EDF3', letterSpacing: '0.05em' }}>
          SCAN WITH PHONE
        </span>
      </div>

      <div
        style={{
          padding: '0.75rem',
          backgroundColor: '#070B14',
          borderRadius: '6px',
          border: '1px solid #26364A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: `${size}px`,
          minHeight: `${size}px`
        }}
      >
        {!imgError ? (
          <img
            src={qrApiUrl}
            alt="Scan QR code with phone camera"
            width={size}
            height={size}
            onError={() => setImgError(true)}
            style={{ borderRadius: '4px' }}
          />
        ) : (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4F7CAC',
              fontSize: '0.8rem',
              gap: '0.5rem'
            }}
          >
            <QrCode size={48} />
            <span>QR CODE</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '100%' }}>
        <span style={{ fontSize: '0.75rem', color: '#8D9AAA' }}>
          Connect phone to same Wi-Fi & scan code to open Mobile Inspection
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            color: '#4F7CAC',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            wordBreak: 'break-all',
            padding: '0.4rem 0.6rem',
            backgroundColor: '#162235',
            borderRadius: '4px',
            border: '1px solid #26364A'
          }}
        >
          <span>{url}</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
