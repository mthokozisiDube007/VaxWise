import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateCertificate, getFarmCertificates, verifyCertificate } from '../api/certificatesApi';

const S = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#333' },
  btn: (color) => ({ background: color, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }),
  tab: (active) => ({ padding: '10px 20px', border: 'none', borderBottom: active ? '3px solid #1A5276' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', color: active ? '#1A5276' : '#666', fontSize: '14px' }),
  th: { padding: '10px', textAlign: 'left', color: '#1A5276', fontSize: '13px' },
  td: { padding: '10px', fontSize: '14px', borderBottom: '1px solid #f0f0f0' },
};

const STATUS_COLOR = { Valid: '#1E8449', Expired: '#888', Tampered: '#E74C3C' };

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

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>📜 Certificates</h1>

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'list', label: '📋 My Certificates' },
          { key: 'generate', label: '+ Generate' },
          { key: 'verify', label: '🔍 Verify' },
        ].map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'list' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Issued Certificates ({certs.length})</h3>
          {certs.length === 0 ? <p style={{ color: '#666' }}>No certificates issued yet.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Cert ID', 'Animal', 'Vaccine', 'Issued', 'Expires', 'Status', 'Verify URL'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{certs.map(c => (
                <tr key={c.certId}>
                  <td style={S.td}><strong>#{c.certId}</strong></td>
                  <td style={S.td}>{c.animalEarTag}</td>
                  <td style={S.td}>{c.vaccineName}</td>
                  <td style={S.td}>{new Date(c.issuedAt).toLocaleDateString()}</td>
                  <td style={S.td}>{new Date(c.expiresAt).toLocaleDateString()}</td>
                  <td style={S.td}><span style={{ fontSize: '12px', fontWeight: 'bold', color: STATUS_COLOR[c.status] || '#888' }}>● {c.status}</span></td>
                  <td style={S.td}><a href={c.qrCodeUrl} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1A5276' }}>Verify</a></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'generate' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 8px', color: '#1A5276' }}>Generate Certificate</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>Enter the vaccination event ID. The certificate will include the SHA-256 audit hash and a QR verification code.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '400px', marginBottom: '16px' }}>
            <input type="number" value={generateEventId} onChange={e => setGenerateEventId(e.target.value)} placeholder="Vaccination Event ID" style={{ ...S.input, flex: 1 }} />
            <button onClick={() => generateMut.mutate(parseInt(generateEventId))} disabled={!generateEventId || generateMut.isPending} style={S.btn('#1A5276')}>
              {generateMut.isPending ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {generateMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed. Check the event ID.</p>}
          {generatedCert && (
            <div style={{ border: '2px solid #1E8449', borderRadius: '10px', padding: '20px', maxWidth: '500px', background: '#EAFAF1' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 'bold', fontSize: '18px', color: '#1E8449' }}>✅ Certificate #{generatedCert.certId}</p>
              <p style={{ margin: '0 0 12px', color: '#555', fontSize: '13px' }}>Animal: <strong>{generatedCert.animalEarTag}</strong> · {generatedCert.vaccineName}</p>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#555' }}>Issued: {new Date(generatedCert.issuedAt).toLocaleDateString()} · Expires: {new Date(generatedCert.expiresAt).toLocaleDateString()}</p>
              <p style={{ margin: '8px 0 4px', fontSize: '12px', fontWeight: 'bold', color: '#1A5276' }}>SHA-256 Audit Hash:</p>
              <code style={{ fontSize: '11px', wordBreak: 'break-all', color: '#1A5276', display: 'block', background: 'white', padding: '8px', borderRadius: '4px' }}>{generatedCert.auditHash}</code>
              {generatedCert.pdfBase64 && (
                <a href={`data:application/pdf;base64,${generatedCert.pdfBase64}`} download={`cert-${generatedCert.certId}.pdf`}
                  style={{ ...S.btn('#1A5276'), display: 'inline-block', marginTop: '12px', textDecoration: 'none', fontSize: '13px' }}>
                  ⬇ Download PDF
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 8px', color: '#1A5276' }}>Verify Certificate</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>Inspectors and buyers can verify any certificate by ID without logging in.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '400px', marginBottom: '16px' }}>
            <input type="number" value={verifyId} onChange={e => setVerifyId(e.target.value)} placeholder="Certificate ID" style={{ ...S.input, flex: 1 }} />
            <button onClick={handleVerify} disabled={!verifyId} style={S.btn('#1A5276')}>Verify</button>
          </div>
          {verifyResult && (
            <div style={{ border: `2px solid ${STATUS_COLOR[verifyResult.verificationStatus] || '#888'}`, borderRadius: '10px', padding: '20px', maxWidth: '500px' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 'bold', color: STATUS_COLOR[verifyResult.verificationStatus] }}>
                {verifyResult.verificationStatus === 'Valid' ? '✅ VALID CERTIFICATE' : verifyResult.verificationStatus === 'Expired' ? '⚠️ EXPIRED' : '❌ TAMPERED / INVALID'}
              </p>
              <div style={{ fontSize: '14px', display: 'grid', gap: '6px' }}>
                <p style={{ margin: 0 }}>Animal: <strong>{verifyResult.animalEarTag}</strong></p>
                <p style={{ margin: 0 }}>Vaccine: <strong>{verifyResult.vaccineName}</strong> · Batch: {verifyResult.vaccineBatch}</p>
                <p style={{ margin: 0 }}>Vet SAVC: {verifyResult.savcNumber}</p>
                <p style={{ margin: 0 }}>Event: {new Date(verifyResult.eventTimestamp).toLocaleString()}</p>
                <p style={{ margin: 0 }}>Expires: {new Date(verifyResult.expiresAt).toLocaleDateString()}</p>
                <p style={{ margin: '8px 0 4px', fontSize: '12px', fontWeight: 'bold', color: '#1A5276' }}>Audit Hash:</p>
                <code style={{ fontSize: '11px', wordBreak: 'break-all', color: '#888' }}>{verifyResult.auditHash}</code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
