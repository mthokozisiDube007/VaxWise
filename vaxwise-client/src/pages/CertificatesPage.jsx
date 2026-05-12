import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { generateCertificate, getFarmCertificates, verifyCertificate } from '../api/certificatesApi';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';
const th = 'px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50';
const td = 'px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

const STATUS = {
  Valid:    { cls: 'bg-teal-500/10 text-teal-400 border-teal-500/25',   label: 'Valid' },
  Expired:  { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25', label: 'Expired' },
  Tampered: { cls: 'bg-red-500/10 text-red-400 border-red-500/25',      label: 'Tampered' },
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
    <div className="text-slate-50">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-slate-50 mb-1">Certificates</h1>
        <p className="text-slate-400 text-sm">DALRRD-compliant vaccination certificates with SHA-256 tamper detection</p>
      </div>

      <div className="flex gap-1 bg-slate-800 p-1 rounded-xl w-fit mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-teal-500 font-bold text-slate-900' : 'font-normal text-slate-400 hover:text-slate-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <div className={card}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-serif text-xl text-slate-50 mb-0.5">Issued Certificates</h3>
              <p className="text-xs text-slate-400">All certificates issued for this farm</p>
            </div>
            <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
              {certs.length} total
            </span>
          </div>
          {certs.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <p className="text-3xl mb-2 text-slate-400">◎</p>
              <p className="text-sm">No certificates issued yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>{['Cert ID','Animal','Vaccine','Issued','Expires','Status','Verify'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
                </thead>
                <tbody>{certs.map((c, i) => (
                  <tr key={c.certId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                    <td className={`${td} font-mono text-[13px] font-bold text-slate-400`}>#{c.certId}</td>
                    <td className={`${td} font-bold text-teal-400`}>{c.animalEarTag}</td>
                    <td className={td}>{c.vaccineName}</td>
                    <td className={`${td} text-slate-400 text-[13px]`}>{new Date(c.issuedAt).toLocaleDateString('en-ZA')}</td>
                    <td className={`${td} text-slate-400 text-[13px]`}>{new Date(c.expiresAt).toLocaleDateString('en-ZA')}</td>
                    <td className={td}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS[c.status]?.cls ?? STATUS.Valid.cls}`}>
                        ● {STATUS[c.status]?.label ?? c.status}
                      </span>
                    </td>
                    <td className={td}>
                      <a href={c.qrCodeUrl} target="_blank" rel="noreferrer" className="text-teal-400 text-[13px] font-semibold no-underline hover:text-teal-300 transition-colors">View ↗</a>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'generate' && (
        <div className={card}>
          <h3 className="font-serif text-xl text-slate-50 mb-1">Generate Certificate</h3>
          <p className="text-slate-400 text-[13px] mb-6">Enter the vaccination event ID. The certificate will embed the SHA-256 audit hash and a QR verification code.</p>
          <div className="flex gap-3 max-w-[480px] mb-5">
            <input
              type="number"
              value={generateEventId}
              onChange={e => setGenerateEventId(e.target.value)}
              placeholder="Vaccination Event ID"
              className={`${inp} flex-1`}
            />
            <button
              onClick={() => generateMut.mutate(parseInt(generateEventId))}
              disabled={!generateEventId || generateMut.isPending}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-xs transition-colors ${(!generateEventId || generateMut.isPending) ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {generateMut.isPending ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {generateMut.isError && <p className="text-red-400 text-[13px] mb-3">Failed. Check the event ID.</p>}
          {generatedCert && (
            <div className="p-6 bg-slate-900 border border-teal-500/30 rounded-xl max-w-[540px]">
              <p className="mb-1 font-serif text-xl font-bold text-teal-400">
                Certificate #{generatedCert.certId}
              </p>
              <p className="mb-4 text-slate-400 text-[13px]">
                {generatedCert.animalEarTag} · {generatedCert.vaccineName} · Issued {new Date(generatedCert.issuedAt).toLocaleDateString('en-ZA')} · Expires {new Date(generatedCert.expiresAt).toLocaleDateString('en-ZA')}
              </p>
              <p className={`${lbl} mb-1.5`}>SHA-256 Audit Hash</p>
              <code className="block text-[11px] break-all text-green-300 font-mono bg-slate-800 px-3.5 py-2.5 rounded-lg border border-slate-700 mb-4">
                {generatedCert.auditHash}
              </code>
              {generatedCert.pdfBase64 && (
                <a
                  href={`data:application/pdf;base64,${generatedCert.pdfBase64}`}
                  download={`cert-${generatedCert.certId}.pdf`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-xs transition-colors no-underline"
                >
                  Download PDF
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div className={card}>
          <h3 className="font-serif text-xl text-slate-50 mb-1">Verify Certificate</h3>
          <p className="text-slate-400 text-[13px] mb-6">Inspectors and buyers can verify any certificate by ID — no login required.</p>
          <div className="flex gap-3 max-w-[480px] mb-5">
            <input
              type="number"
              value={verifyId}
              onChange={e => setVerifyId(e.target.value)}
              placeholder="Certificate ID"
              className={`${inp} flex-1`}
            />
            <button
              onClick={handleVerify}
              disabled={!verifyId}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-xs transition-colors ${!verifyId ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              Verify
            </button>
          </div>
          {verifyResult && (() => {
            const isValid = verifyResult.verificationStatus === 'Valid';
            const isTampered = verifyResult.verificationStatus === 'Tampered';
            const borderCls = isValid ? 'border-teal-500/30' : isTampered ? 'border-red-500/30' : 'border-slate-700';
            const statusCls = isValid ? 'text-teal-400' : isTampered ? 'text-red-400' : 'text-slate-400';
            return (
              <div className={`p-6 rounded-xl bg-slate-800 border ${borderCls} max-w-[540px]`}>
                <p className={`font-serif text-lg font-bold ${statusCls} mb-4`}>
                  {isValid ? '✓ Valid Certificate' : isTampered ? '✗ Tampered / Invalid' : '⚠ Expired'}
                </p>
                <div className="grid gap-3 text-sm mb-4">
                  {[
                    ['Animal', verifyResult.animalEarTag],
                    ['Vaccine', `${verifyResult.vaccineName} · Batch ${verifyResult.vaccineBatch}`],
                    ['Vet SAVC', verifyResult.savcNumber],
                    ['Event', new Date(verifyResult.eventTimestamp).toLocaleString('en-ZA')],
                    ['Expires', new Date(verifyResult.expiresAt).toLocaleDateString('en-ZA')],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-4">
                      <span className="min-w-[80px] text-[11px] font-semibold text-slate-400 uppercase tracking-wide pt-0.5">{label}</span>
                      <span className="font-semibold text-slate-50">{value}</span>
                    </div>
                  ))}
                </div>
                <p className={`${lbl} mb-1.5`}>Audit Hash</p>
                <code className="text-[11px] break-all text-slate-600 font-mono">{verifyResult.auditHash}</code>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
