import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { verifyCertificate } from '../api/certificatesApi';

const STATUS_STYLE = {
  Valid:    { bg: '#0A2518', color: '#22C55E', border: 'rgba(34,197,94,0.3)', icon: '✓' },
  Expired:  { bg: '#1A2B1F', color: '#8C8677', border: '#2D4A34', icon: '○' },
  Tampered: { bg: '#1A0A0A', color: '#EF4444', border: 'rgba(239,68,68,0.3)', icon: '✕' },
};

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #1F3326', gap: '16px' }}>
      <span style={{ fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
      <span style={{ fontSize: '13px', color: '#F0EDE8', textAlign: 'right', fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif", wordBreak: 'break-all' }}>{value}</span>
    </div>
  );
}

export default function PublicVerifyPage() {
  const { certId } = useParams();

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ['verify', certId],
    queryFn: () => verifyCertificate(certId),
    retry: false,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#111812', fontFamily: "'DM Sans', sans-serif", padding: '40px 20px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', background: '#22C55E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>🛡️</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#F0EDE8' }}>VaxWise</span>
          <span style={{ fontSize: '11px', color: '#8C8677', background: '#1A2B1F', padding: '3px 10px', borderRadius: '20px', border: '1px solid #2D4A34', marginLeft: '4px' }}>Certificate Verification</span>
        </div>

        {isLoading && (
          <div style={{ background: '#1A2B1F', borderRadius: '16px', padding: '48px', border: '1px solid #1F3326', textAlign: 'center', color: '#8C8677' }}>
            Verifying certificate…
          </div>
        )}

        {error && (
          <div style={{ background: '#1A0A0A', borderRadius: '16px', padding: '40px', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>✕</p>
            <p style={{ color: '#EF4444', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>Certificate Not Found</p>
            <p style={{ color: '#8C8677', fontSize: '13px' }}>Certificate #{certId} does not exist or has been removed.</p>
          </div>
        )}

        {cert && (() => {
          const s = STATUS_STYLE[cert.verificationStatus] || STATUS_STYLE.Tampered;
          return (
            <>
              {/* Status banner */}
              <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: '14px', padding: '20px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: s.bg, border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: s.color, fontWeight: '700', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <p style={{ fontSize: '18px', fontFamily: "'Playfair Display', serif", color: s.color, fontWeight: '700', marginBottom: '2px' }}>
                    {cert.verificationStatus === 'Valid' ? 'Certificate Valid' : cert.verificationStatus === 'Expired' ? 'Certificate Expired' : 'Certificate Tampered'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#8C8677' }}>
                    {cert.verificationStatus === 'Valid'
                      ? `Valid until ${new Date(cert.expiresAt).toLocaleDateString('en-ZA')}`
                      : cert.verificationStatus === 'Expired'
                      ? `Expired on ${new Date(cert.expiresAt).toLocaleDateString('en-ZA')}`
                      : 'This certificate has been flagged as tampered — do not accept.'}
                  </p>
                </div>
              </div>

              {/* Details card */}
              <div style={{ background: '#1A2B1F', borderRadius: '14px', padding: '24px 28px', border: '1px solid #1F3326' }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#F0EDE8', marginBottom: '4px' }}>Vaccination Certificate</h3>
                <p style={{ fontSize: '12px', color: '#8C8677', marginBottom: '20px' }}>Certificate #{cert.certId}</p>

                <Row label="Animal Ear Tag" value={cert.animalEarTag} mono />
                <Row label="Farmer" value={cert.farmerName} />
                <Row label="Vaccine" value={cert.vaccineName} />
                <Row label="Batch Number" value={cert.vaccineBatch} mono />
                <Row label="Vet (SAVC)" value={cert.savcNumber} mono />
                <Row label="Location" value={cert.gpsCoordinates} mono />
                <Row label="Event Date" value={new Date(cert.eventTimestamp).toLocaleString('en-ZA', { timeZone: 'UTC', hour12: false })} />
                <Row label="Issued" value={new Date(cert.issuedAt ?? cert.eventTimestamp).toLocaleDateString('en-ZA')} />
                <Row label="Expires" value={new Date(cert.expiresAt).toLocaleDateString('en-ZA')} />

                <div style={{ marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Audit Hash (SHA-256)</span>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#4A4A42', wordBreak: 'break-all', marginTop: '6px', padding: '10px 12px', background: '#162219', borderRadius: '6px', border: '1px solid #1F3326' }}>{cert.auditHash}</p>
                </div>
              </div>

              <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#4A4A42' }}>
                Verified by VaxWise · DALRRD-aligned biosecurity platform
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
