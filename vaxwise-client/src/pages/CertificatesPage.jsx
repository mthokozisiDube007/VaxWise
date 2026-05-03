import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateCertificate, getFarmCertificates, verifyCertificate } from '../api/certificatesApi';

const S = {
  card: { background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(11,31,20,0.05), 0 4px 16px rgba(11,31,20,0.05)', marginBottom: '24px' },
  inp: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E0D9CE', fontSize: '14px', boxSizing: 'border-box', background: '#FDFCF8', color: '#1A1A18', fontFamily: "'DM Sans', sans-serif" },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tab: (a) => ({ padding: '8px 18px', border: 'none', borderRadius: '20px', background: a ? '#0B1F14' : 'transparent', cursor: 'pointer', fontWeight: a ? '600' : '400', color: a ? '#FFF' : '#8C8677', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }),
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#F8F5F0', borderBottom: '1px solid #EDE8DF' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #F0EBE2', color: '#1A1A18' },
  btn: (c) => ({ background: c, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }),
};

const STATUS = {
  Valid: { bg: '#F0FDF4', color: '#15803D' },
  Expired: { bg: '#F8F8F8', color: '#9CA3AF' },
  Tampered: { bg: '#FEF2F2', color: '#DC2626' },
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
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#0B1F14', marginBottom: '4px' }}>Certificates</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>DALRRD-compliant vaccination certificates with SHA-256 tamper detection</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', background: 'white', padding: '5px', borderRadius: '12px', width: 'fit-content', marginBottom: '24px', boxShadow: '0 1px 4px rgba(11,31,20,0.06)' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'list' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14' }}>Issued Certificates</h3>
            <span style={{ background: '#F0EBE1', color: '#6E6B60', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>{certs.length} total</span>
          </div>
          {certs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#B0A898' }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>◎</p>
              <p style={{ fontSize: '14px' }}>No certificates issued yet</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Cert ID','Animal','Vaccine','Issued','Expires','Status','Verify'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{certs.map(c => {
                const st = STATUS[c.status] || { bg: '#F1F5F9', color: '#64748B' };
                return (
                  <tr key={c.certId}>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: '700', color: '#0B1F14' }}>#{c.certId}</td>
                    <td style={{ ...S.td, fontWeight: '700', color: '#0B1F14' }}>{c.animalEarTag}</td>
                    <td style={S.td}>{c.vaccineName}</td>
                    <td style={{ ...S.td, color: '#8C8677', fontSize: '13px' }}>{new Date(c.issuedAt).toLocaleDateString('en-ZA')}</td>
                    <td style={{ ...S.td, color: '#8C8677', fontSize: '13px' }}>{new Date(c.expiresAt).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>
                      <span style={{ background: st.bg, color: st.color, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{c.status}</span>
                    </td>
                    <td style={S.td}>
                      <a href={c.qrCodeUrl} target="_blank" rel="noreferrer" style={{ color: '#C9850B', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>View ↗</a>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'generate' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '6px' }}>Generate Certificate</h3>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Enter the vaccination event ID. The certificate will embed the SHA-256 audit hash and a QR verification code.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '20px' }}>
            <input type="number" value={generateEventId} onChange={e => setGenerateEventId(e.target.value)} placeholder="Vaccination Event ID" style={{ ...S.inp, flex: 1 }} />
            <button onClick={() => generateMut.mutate(parseInt(generateEventId))} disabled={!generateEventId || generateMut.isPending} style={S.btn('#0B1F14')}>
              {generateMut.isPending ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {generateMut.isError && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>Failed. Check the event ID.</p>}
          {generatedCert && (
            <div style={{ padding: '24px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '12px', maxWidth: '540px' }}>
              <p style={{ margin: '0 0 4px', fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#15803D' }}>
                Certificate #{generatedCert.certId}
              </p>
              <p style={{ margin: '0 0 16px', color: '#6E6B60', fontSize: '13px' }}>
                {generatedCert.animalEarTag} · {generatedCert.vaccineName} · Issued {new Date(generatedCert.issuedAt).toLocaleDateString('en-ZA')} · Expires {new Date(generatedCert.expiresAt).toLocaleDateString('en-ZA')}
              </p>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SHA-256 Audit Hash</p>
              <code style={{ display: 'block', fontSize: '11px', wordBreak: 'break-all', color: '#0B1F14', fontFamily: "'JetBrains Mono', monospace", background: 'white', padding: '10px 14px', borderRadius: '7px', border: '1px solid #D1FAE5', marginBottom: '16px' }}>{generatedCert.auditHash}</code>
              {generatedCert.pdfBase64 && (
                <a href={`data:application/pdf;base64,${generatedCert.pdfBase64}`} download={`cert-${generatedCert.certId}.pdf`}
                  style={{ ...S.btn('#177A3E'), display: 'inline-block', textDecoration: 'none', fontSize: '13px' }}>
                  Download PDF
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '6px' }}>Verify Certificate</h3>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Inspectors and buyers can verify any certificate by ID — no login required.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '20px' }}>
            <input type="number" value={verifyId} onChange={e => setVerifyId(e.target.value)} placeholder="Certificate ID" style={{ ...S.inp, flex: 1 }} />
            <button onClick={handleVerify} disabled={!verifyId} style={S.btn('#0B1F14')}>Verify</button>
          </div>
          {verifyResult && (() => {
            const isValid = verifyResult.verificationStatus === 'Valid';
            const isTampered = verifyResult.verificationStatus === 'Tampered';
            return (
              <div style={{ padding: '24px', borderRadius: '12px', background: isValid ? '#F0FDF4' : isTampered ? '#FEF2F2' : '#F8F8F8', border: `1px solid ${isValid ? '#86EFAC' : isTampered ? '#FECACA' : '#E5E7EB'}`, maxWidth: '540px' }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: '700', color: isValid ? '#15803D' : isTampered ? '#DC2626' : '#6B7280', marginBottom: '16px' }}>
                  {isValid ? '✓ Valid Certificate' : isTampered ? '✗ Tampered / Invalid' : '⚠ Expired'}
                </p>
                <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                  {[
                    ['Animal', verifyResult.animalEarTag],
                    ['Vaccine', `${verifyResult.vaccineName} · Batch ${verifyResult.vaccineBatch}`],
                    ['Vet SAVC', verifyResult.savcNumber],
                    ['Event', new Date(verifyResult.eventTimestamp).toLocaleString('en-ZA')],
                    ['Expires', new Date(verifyResult.expiresAt).toLocaleDateString('en-ZA')],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ minWidth: '80px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', paddingTop: '2px' }}>{label}</span>
                      <span style={{ fontWeight: '600', color: '#0B1F14' }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Audit Hash</p>
                  <code style={{ fontSize: '11px', wordBreak: 'break-all', color: '#8C8677', fontFamily: "'JetBrains Mono', monospace" }}>{verifyResult.auditHash}</code>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
