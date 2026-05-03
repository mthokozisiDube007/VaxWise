import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateCertificate, getFarmCertificates, verifyCertificate } from '../api/certificatesApi';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  inp: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #2D4A34', fontSize: '14px', boxSizing: 'border-box', background: '#162219', color: '#F0EDE8', fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.15s' },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tab: (a) => ({ padding: '8px 20px', border: 'none', borderRadius: '8px', background: a ? '#22C55E' : 'transparent', cursor: 'pointer', fontWeight: a ? '700' : '400', color: a ? '#0B1F14' : '#8C8677', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }),
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
  btn: (c) => ({ background: c, color: c === '#22C55E' ? '#0B1F14' : 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }),
};

const STATUS = {
  Valid: { bg: '#052E16', color: '#22C55E' },
  Expired: { bg: '#1A2B1F', color: '#4A4A42' },
  Tampered: { bg: '#450A0A', color: '#EF4444' },
};

export default function CertificatesPage() {
  const [tab, setTab] = useState('list');
  const [generateEventId, setGenerateEventId] = useState('');
  const [generatedCert, setGeneratedCert] = useState(null);
  const [verifyId, setVerifyId] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const { data: certs = [], refetch } = useQuery({ queryKey: ['certificates'], queryFn: getFarmCertificates });

  const generateMut = useMutation({
    mutationFn: generateCertificate,
    onSuccess: (data) => { setGeneratedCert(data); refetch(); },
  });

  const handleVerify = async () => {
    if (!verifyId) return;
    const result = await verifyCertificate(parseInt(verifyId));
    setVerifyResult(result);
  };

  const tabs = [{ key: 'list', label: 'My Certificates' }, { key: 'generate', label: '+ Generate' }, { key: 'verify', label: 'Verify' }];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Certificates</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>DALRRD-compliant vaccination certificates with SHA-256 tamper detection</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: '#162219', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'list' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Issued Certificates</h3>
              <p style={{ fontSize: '12px', color: '#8C8677' }}>All certificates issued for this farm</p>
            </div>
            <span style={{ background: '#1A2B1F', color: '#8C8677', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: '1px solid #2D4A34' }}>
              {certs.length} total
            </span>
          </div>
          {certs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#4A4A42' }}>
              <p style={{ fontSize: '28px', marginBottom: '8px', color: '#8C8677' }}>◎</p>
              <p style={{ fontSize: '14px' }}>No certificates issued yet</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Cert ID','Animal','Vaccine','Issued','Expires','Status','Verify'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>{certs.map((c, i) => {
                  const st = STATUS[c.status] || { bg: '#1A2B1F', color: '#8C8677' };
                  return (
                    <tr key={c.certId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: '700', color: '#8C8677' }}>#{c.certId}</td>
                      <td style={{ ...S.td, fontWeight: '700', color: '#22C55E' }}>{c.animalEarTag}</td>
                      <td style={S.td}>{c.vaccineName}</td>
                      <td style={{ ...S.td, color: '#8C8677', fontSize: '13px' }}>{new Date(c.issuedAt).toLocaleDateString('en-ZA')}</td>
                      <td style={{ ...S.td, color: '#8C8677', fontSize: '13px' }}>{new Date(c.expiresAt).toLocaleDateString('en-ZA')}</td>
                      <td style={S.td}>
                        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{c.status}</span>
                      </td>
                      <td style={S.td}>
                        <a href={c.qrCodeUrl} target="_blank" rel="noreferrer" style={{ color: '#22C55E', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>View ↗</a>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'generate' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '4px' }}>Generate Certificate</h3>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Enter the vaccination event ID. The certificate will embed the SHA-256 audit hash and a QR verification code.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '20px' }}>
            <input
              type="number"
              value={generateEventId}
              onChange={e => setGenerateEventId(e.target.value)}
              placeholder="Vaccination Event ID"
              style={{ ...S.inp, flex: 1 }}
              onFocus={e => e.target.style.borderColor = '#22C55E'}
              onBlur={e => e.target.style.borderColor = '#2D4A34'}
            />
            <button
              onClick={() => generateMut.mutate(parseInt(generateEventId))}
              disabled={!generateEventId || generateMut.isPending}
              style={{ ...S.btn('#22C55E'), opacity: !generateEventId || generateMut.isPending ? 0.6 : 1 }}
            >
              {generateMut.isPending ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {generateMut.isError && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Failed. Check the event ID.</p>}
          {generatedCert && (
            <div style={{ padding: '24px', background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', maxWidth: '540px' }}>
              <p style={{ margin: '0 0 4px', fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#22C55E' }}>
                Certificate #{generatedCert.certId}
              </p>
              <p style={{ margin: '0 0 16px', color: '#8C8677', fontSize: '13px' }}>
                {generatedCert.animalEarTag} · {generatedCert.vaccineName} · Issued {new Date(generatedCert.issuedAt).toLocaleDateString('en-ZA')} · Expires {new Date(generatedCert.expiresAt).toLocaleDateString('en-ZA')}
              </p>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' }}>SHA-256 Audit Hash</p>
              <code style={{ display: 'block', fontSize: '11px', wordBreak: 'break-all', color: '#86EFAC', fontFamily: "'JetBrains Mono', monospace", background: '#162219', padding: '10px 14px', borderRadius: '7px', border: '1px solid #2D4A34', marginBottom: '16px' }}>
                {generatedCert.auditHash}
              </code>
              {generatedCert.pdfBase64 && (
                <a
                  href={`data:application/pdf;base64,${generatedCert.pdfBase64}`}
                  download={`cert-${generatedCert.certId}.pdf`}
                  style={{ ...S.btn('#22C55E'), display: 'inline-block', textDecoration: 'none', fontSize: '13px' }}
                >
                  Download PDF
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '4px' }}>Verify Certificate</h3>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Inspectors and buyers can verify any certificate by ID — no login required.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '20px' }}>
            <input
              type="number"
              value={verifyId}
              onChange={e => setVerifyId(e.target.value)}
              placeholder="Certificate ID"
              style={{ ...S.inp, flex: 1 }}
              onFocus={e => e.target.style.borderColor = '#22C55E'}
              onBlur={e => e.target.style.borderColor = '#2D4A34'}
            />
            <button
              onClick={handleVerify}
              disabled={!verifyId}
              style={{ ...S.btn('#22C55E'), opacity: !verifyId ? 0.6 : 1 }}
            >
              Verify
            </button>
          </div>
          {verifyResult && (() => {
            const isValid = verifyResult.verificationStatus === 'Valid';
            const isTampered = verifyResult.verificationStatus === 'Tampered';
            const borderColor = isValid ? 'rgba(34,197,94,0.3)' : isTampered ? 'rgba(239,68,68,0.3)' : '#2D4A34';
            const statusColor = isValid ? '#22C55E' : isTampered ? '#EF4444' : '#8C8677';
            return (
              <div style={{ padding: '24px', borderRadius: '12px', background: '#162219', border: `1px solid ${borderColor}`, maxWidth: '540px' }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: statusColor, marginBottom: '16px' }}>
                  {isValid ? '✓ Valid Certificate' : isTampered ? '✗ Tampered / Invalid' : '⚠ Expired'}
                </p>
                <div style={{ display: 'grid', gap: '12px', fontSize: '14px', marginBottom: '16px' }}>
                  {[
                    ['Animal', verifyResult.animalEarTag],
                    ['Vaccine', `${verifyResult.vaccineName} · Batch ${verifyResult.vaccineBatch}`],
                    ['Vet SAVC', verifyResult.savcNumber],
                    ['Event', new Date(verifyResult.eventTimestamp).toLocaleString('en-ZA')],
                    ['Expires', new Date(verifyResult.expiresAt).toLocaleDateString('en-ZA')],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ minWidth: '80px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: '2px' }}>{label}</span>
                      <span style={{ fontWeight: '600', color: '#F0EDE8' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Hash</p>
                <code style={{ fontSize: '11px', wordBreak: 'break-all', color: '#4A4A42', fontFamily: "'JetBrains Mono', monospace" }}>{verifyResult.auditHash}</code>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
