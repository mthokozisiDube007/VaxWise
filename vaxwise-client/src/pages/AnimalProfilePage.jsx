import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnimalById } from '../api/animalsApi';
import { getVaccinationsByAnimal } from '../api/vaccinationsApi';
import { getHealthRecords } from '../api/healthApi';
import { useMobile } from '../hooks/useMobile';

const th = 'px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50';
const td = 'px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

const STATUS = {
  Active:        { cls: 'bg-teal-500/10 text-teal-400 border-teal-500/25',   label: 'Active' },
  UnderTreatment:{ cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25', label: 'Treatment' },
  Quarantined:   { cls: 'bg-red-500/10 text-red-400 border-red-500/25',      label: 'Quarantine' },
  Sold:          { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/25', label: 'Sold' },
  Deceased:      { cls: 'bg-slate-700/30 text-slate-500 border-slate-600/25', label: 'Deceased' },
};

const sevColor = (sev) => {
  if (sev === 'Critical') return 'text-red-400 border-red-500/25 bg-red-500/10';
  if (sev === 'High') return 'text-red-400 border-red-500/25 bg-red-500/10';
  if (sev === 'Medium') return 'text-amber-400 border-amber-500/25 bg-amber-500/10';
  return 'text-teal-400 border-teal-500/25 bg-teal-500/10';
};

function StatBox({ label, value, sub }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function ageFromDob(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 24) return `${months} months`;
  return `${Math.floor(months / 12)} years ${months % 12}m`;
}

export default function AnimalProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const { data: animal, isLoading: loadingAnimal } = useQuery({
    queryKey: ['animal', id],
    queryFn: () => getAnimalById(id),
  });

  const { data: vaccinations = [], isLoading: loadingVacc } = useQuery({
    queryKey: ['vacc-history', id],
    queryFn: () => getVaccinationsByAnimal(id),
    enabled: !!id,
  });

  const { data: healthRecords = [], isLoading: loadingHealth } = useQuery({
    queryKey: ['health-history', id],
    queryFn: () => getHealthRecords(id),
    enabled: !!id,
  });

  if (loadingAnimal) return (
    <div className="p-10 text-slate-400">Loading profile…</div>
  );
  if (!animal) return (
    <div className="p-10 text-red-400">Animal not found.</div>
  );

  const score = animal.complianceScore ?? 0;
  const scoreColorClass = score >= 80 ? 'text-teal-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  const scoreStrokeColor = score >= 80 ? '#2dd4bf' : score >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="text-slate-50">

      {/* Back button */}
      <button
        onClick={() => navigate('/animals')}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors mb-5"
      >
        ← Back to Animals
      </button>

      {/* Animal header */}
      <div className={card}>
        <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold text-teal-400`}>
                {animal.earTagNumber}
              </h1>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS[animal.status]?.cls ?? STATUS.Active.cls}`}>
                {animal.status}
              </span>
            </div>
            <p className="text-slate-400 text-[15px]">
              {animal.animalTypeName} · {animal.breed} · {animal.gender === 'M' ? 'Male' : 'Female'}
            </p>
          </div>

          {/* Compliance ring */}
          <div className="text-center">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Compliance</p>
            <div className="relative w-[72px] h-[72px]">
              <svg viewBox="0 0 36 36" className="rotate-[-90deg] w-[72px] h-[72px]">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreStrokeColor} strokeWidth="3"
                  strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-base font-bold ${scoreColorClass}`}>
                {score}%
              </span>
            </div>
          </div>
        </div>

        {/* Stat boxes */}
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
          <StatBox label="Age" value={ageFromDob(animal.dateOfBirth)} sub={new Date(animal.dateOfBirth).toLocaleDateString('en-ZA')} />
          <StatBox label="Weight" value={`${animal.currentWeightKg} kg`} />
          <StatBox label="RFID Tag" value={animal.rfidTag || '—'} />
          <StatBox label="Purchase Price" value={`R ${Number(animal.purchasePrice).toLocaleString()}`} sub={new Date(animal.purchaseDate).toLocaleDateString('en-ZA')} />
        </div>
      </div>

      {/* Vaccination history */}
      <div className={card}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl text-slate-50 mb-0.5">Vaccination History</h2>
            <p className="text-[13px] text-slate-400">{vaccinations.length} event{vaccinations.length !== 1 ? 's' : ''} recorded</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${vaccinations.length > 0 ? STATUS.Active.cls : STATUS.Sold.cls}`}>
            {vaccinations.length} total
          </span>
        </div>

        {loadingVacc ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : vaccinations.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p className="text-2xl mb-2">◈</p>
            <p>No vaccinations recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Vaccine', 'Date', 'Batch', 'Dose', 'Vet / SAVC', 'Next Due'].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vaccinations.map((v, i) => {
                  const overdue = v.nextDueDate && new Date(v.nextDueDate) < new Date();
                  return (
                    <tr key={v.eventId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                      <td className={`${td} font-semibold text-teal-400`}>{v.vaccineName}</td>
                      <td className={td}>{new Date(v.eventTimestamp).toLocaleDateString('en-ZA')}</td>
                      <td className={`${td} font-mono text-xs text-slate-400`}>{v.vaccineBatch || '—'}</td>
                      <td className={td}>{v.doseMl ? `${v.doseMl} ml` : '—'}</td>
                      <td className={`${td} text-[13px]`}>{v.savcNumber || v.veterinarianName || '—'}</td>
                      <td className={`${td} ${overdue ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                        {v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString('en-ZA') : '—'}
                        {overdue && (
                          <span className="ml-1.5 text-[11px] bg-red-500/10 text-red-400 border border-red-500/25 px-1.5 py-0.5 rounded-full">
                            OVERDUE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Health history */}
      <div className={card}>
        <div className="mb-5">
          <h2 className="text-xl text-slate-50 mb-0.5">Health Records</h2>
          <p className="text-[13px] text-slate-400">{healthRecords.length} record{healthRecords.length !== 1 ? 's' : ''} on file</p>
        </div>

        {loadingHealth ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : healthRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-600">
            <p className="text-2xl mb-2 text-teal-400">✓</p>
            <p>No health issues recorded</p>
          </div>
        ) : (
          <div>
            {healthRecords.map((r) => {
              const sev = sevColor(r.severity);
              const borderColor = r.severity === 'Critical' || r.severity === 'High'
                ? 'border-red-400'
                : r.severity === 'Medium'
                ? 'border-amber-400'
                : 'border-teal-400';
              return (
                <div key={r.healthRecordId} className={`border-l-[3px] ${borderColor} pl-4 mb-5`}>
                  <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sev} mr-2`}>
                        {r.severity || r.recordType}
                      </span>
                      <span className="text-xs text-slate-600">
                        {new Date(r.treatmentDate || r.createdAt).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                    {r.isWithdrawalActive && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/25">
                        Withdrawal: {r.daysUntilClear}d remaining
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-50 mb-1"><strong>Symptoms:</strong> {r.symptoms}</p>
                  {r.diagnosis && r.diagnosis !== 'Pending veterinary assessment' && (
                    <p className="text-[13px] text-slate-400 mb-0.5"><strong>Dx:</strong> {r.diagnosis}</p>
                  )}
                  {r.medicationUsed && (
                    <p className="text-[13px] text-slate-400 mb-0.5"><strong>Tx:</strong> {r.medicationUsed}{r.dosage ? ` · ${r.dosage}` : ''}</p>
                  )}
                  {r.vetName && r.vetName !== 'Farm Worker Report' && (
                    <p className="text-xs text-slate-600">Vet: {r.vetName}</p>
                  )}
                  {r.outcome && (
                    <p className="text-xs text-slate-600 mt-1 italic">{r.outcome}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
