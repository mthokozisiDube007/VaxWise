import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { verifyCertificate } from '../api/certificatesApi';

const CERT_STATUS = {
  Valid:    { cls: 'bg-teal-500/10 text-teal-400 border-teal-500/25',   label: 'Valid', icon: '✓' },
  Expired:  { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25', label: 'Expired', icon: '⚠' },
  Tampered: { cls: 'bg-red-500/10 text-red-400 border-red-500/25',      label: 'Tampered', icon: '✗' },
};

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-start py-3 border-b border-slate-700 gap-4">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-50 text-right break-all${mono ? ' font-mono' : ''}`}>{value}</span>
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
    <div className="min-h-screen bg-slate-900 px-5 py-10">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-center gap-2.5 mb-9">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-slate-900" />
          </div>
          <span className="text-lg font-bold text-slate-50">VaxWise</span>
          <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700 ml-1">Certificate Verification</span>
        </div>

        {isLoading && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center text-slate-400 text-sm">
            Verifying certificate…
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-10 text-center">
            <p className="text-3xl mb-3">✕</p>
            <p className="text-red-400 font-bold text-base mb-2">Certificate Not Found</p>
            <p className="text-slate-400 text-sm">Certificate #{certId} does not exist or has been removed.</p>
          </div>
        )}

        {cert && (() => {
          const s = CERT_STATUS[cert.verificationStatus] || CERT_STATUS.Tampered;
          return (
            <>
              {/* Status banner */}
              <div className={`border rounded-2xl px-6 py-5 mb-5 flex items-center gap-4 ${s.cls}`}>
                <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl font-bold shrink-0 ${s.cls}`}>{s.icon}</div>
                <div>
                  <p className={`text-lg font-bold mb-0.5 ${s.cls.split(' ').find(c => c.startsWith('text-'))}`}>
                    {cert.verificationStatus === 'Valid' ? 'Certificate Valid' : cert.verificationStatus === 'Expired' ? 'Certificate Expired' : 'Certificate Tampered'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {cert.verificationStatus === 'Valid'
                      ? `Valid until ${new Date(cert.expiresAt).toLocaleDateString('en-ZA')}`
                      : cert.verificationStatus === 'Expired'
                      ? `Expired on ${new Date(cert.expiresAt).toLocaleDateString('en-ZA')}`
                      : 'This certificate has been flagged as tampered — do not accept.'}
                  </p>
                </div>
              </div>

              {/* Details card */}
              <div className="bg-slate-800 border border-slate-700 rounded-2xl px-7 py-6">
                <h3 className="text-lg font-bold text-slate-50 mb-1">Vaccination Certificate</h3>
                <p className="text-xs text-slate-400 mb-5">Certificate #{cert.certId}</p>

                <Row label="Animal Ear Tag" value={cert.animalEarTag} mono />
                <Row label="Farmer" value={cert.farmerName} />
                <Row label="Vaccine" value={cert.vaccineName} />
                <Row label="Batch Number" value={cert.vaccineBatch} mono />
                <Row label="Vet (SAVC)" value={cert.savcNumber} mono />
                <Row label="Location" value={cert.gpsCoordinates} mono />
                <Row label="Event Date" value={new Date(cert.eventTimestamp).toLocaleString('en-ZA', { timeZone: 'UTC', hour12: false })} />
                <Row label="Issued" value={new Date(cert.issuedAt ?? cert.eventTimestamp).toLocaleDateString('en-ZA')} />
                <Row label="Expires" value={new Date(cert.expiresAt).toLocaleDateString('en-ZA')} />

                <div className="mt-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Audit Hash (SHA-256)</span>
                  <p className="font-mono text-[11px] text-slate-500 break-all mt-1.5 px-3 py-2.5 bg-slate-900 rounded-md border border-slate-700">{cert.auditHash}</p>
                </div>
              </div>

              <p className="text-center mt-6 text-xs text-slate-600">
                Verified by VaxWise · DALRRD-aligned biosecurity platform
              </p>
            </>
          );
        })()}
      </div>
    </div>
  );
}
