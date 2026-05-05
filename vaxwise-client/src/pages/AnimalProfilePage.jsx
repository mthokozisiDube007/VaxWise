import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAnimalById } from '../api/animalsApi';
import { getVaccinationsByAnimal } from '../api/vaccinationsApi';
import { getHealthRecords } from '../api/healthApi';
import { useMobile } from '../hooks/useMobile';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '20px' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
};

const STATUS = {
  Active: { bg: '#052E16', color: '#22C55E' },
  UnderTreatment: { bg: '#450A0A', color: '#EF4444' },
  Quarantined: { bg: '#431407', color: '#F59E0B' },
  Sold: { bg: '#1A2B1F', color: '#8C8677' },
  Deceased: { bg: '#1A2B1F', color: '#4A4A42' },
};

const SEV_COLOR = { Mild: '#22C55E', Moderate: '#F59E0B', Severe: '#EF4444', Critical: '#EF4444' };

function StatBox({ label, value, sub }) {
  return (
    <div style={{ background: '#162219', borderRadius: '10px', padding: '16px 20px', border: '1px solid #1F3326' }}>
      <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: '700', color: '#F0EDE8', fontFamily: "'Playfair Display', serif" }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: '#4A4A42', marginTop: '4px' }}>{sub}</p>}
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
  const pad = isMobile ? '16px' : '28px 32px';

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
    <div style={{ padding: '40px', color: '#8C8677', fontFamily: "'DM Sans', sans-serif" }}>Loading profile…</div>
  );
  if (!animal) return (
    <div style={{ padding: '40px', color: '#EF4444', fontFamily: "'DM Sans', sans-serif" }}>Animal not found.</div>
  );

  const st = STATUS[animal.status] || { bg: '#1A2B1F', color: '#8C8677' };
  const score = animal.complianceScore ?? 0;
  const scoreColor = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/animals')}
        style={{ background: 'none', border: 'none', color: '#8C8677', fontSize: '13px', cursor: 'pointer', marginBottom: '20px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'DM Sans', sans-serif" }}
      >
        ← Back to Animals
      </button>

      {/* Animal header */}
      <div style={{ ...S.card, padding: pad }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '28px' : '36px', fontWeight: '700', color: '#22C55E' }}>
                {animal.earTagNumber}
              </h1>
              <span style={{ background: st.bg, color: st.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                {animal.status}
              </span>
            </div>
            <p style={{ color: '#8C8677', fontSize: '15px' }}>
              {animal.animalTypeName} · {animal.breed} · {animal.gender === 'M' ? 'Male' : 'Female'}
            </p>
          </div>

          {/* Compliance ring */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Compliance</p>
            <div style={{ position: 'relative', width: '72px', height: '72px' }}>
              <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '72px', height: '72px' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1F3326" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                  strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
              </svg>
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700', color: scoreColor, fontFamily: "'Playfair Display', serif" }}>
                {score}%
              </span>
            </div>
          </div>
        </div>

        {/* Stat boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
          <StatBox label="Age" value={ageFromDob(animal.dateOfBirth)} sub={new Date(animal.dateOfBirth).toLocaleDateString('en-ZA')} />
          <StatBox label="Weight" value={`${animal.currentWeightKg} kg`} />
          <StatBox label="RFID Tag" value={animal.rfidTag || '—'} />
          <StatBox label="Purchase Price" value={`R ${Number(animal.purchasePrice).toLocaleString()}`} sub={new Date(animal.purchaseDate).toLocaleDateString('en-ZA')} />
        </div>
      </div>

      {/* Vaccination history */}
      <div style={{ ...S.card, padding: pad }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Vaccination History</h2>
            <p style={{ fontSize: '13px', color: '#8C8677' }}>{vaccinations.length} event{vaccinations.length !== 1 ? 's' : ''} recorded</p>
          </div>
          <span style={{ background: vaccinations.length > 0 ? '#052E16' : '#1A2B1F', color: vaccinations.length > 0 ? '#22C55E' : '#8C8677', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: '1px solid #1F3326' }}>
            {vaccinations.length} total
          </span>
        </div>

        {loadingVacc ? (
          <p style={{ color: '#8C8677', fontSize: '14px' }}>Loading…</p>
        ) : vaccinations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#4A4A42' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>◈</p>
            <p>No vaccinations recorded yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Vaccine', 'Date', 'Batch', 'Dose', 'Vet / SAVC', 'Next Due'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vaccinations.map((v, i) => {
                  const overdue = v.nextDueDate && new Date(v.nextDueDate) < new Date();
                  return (
                    <tr key={v.eventId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                      <td style={{ ...S.td, fontWeight: '600', color: '#22C55E' }}>{v.vaccineName}</td>
                      <td style={S.td}>{new Date(v.eventTimestamp).toLocaleDateString('en-ZA')}</td>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{v.vaccineBatch || '—'}</td>
                      <td style={S.td}>{v.doseMl ? `${v.doseMl} ml` : '—'}</td>
                      <td style={{ ...S.td, fontSize: '13px' }}>{v.savcNumber || v.veterinarianName || '—'}</td>
                      <td style={{ ...S.td, color: overdue ? '#EF4444' : '#F0EDE8', fontWeight: overdue ? '600' : '400' }}>
                        {v.nextDueDate ? new Date(v.nextDueDate).toLocaleDateString('en-ZA') : '—'}
                        {overdue && <span style={{ marginLeft: '6px', fontSize: '11px', background: '#450A0A', color: '#EF4444', padding: '2px 6px', borderRadius: '10px' }}>OVERDUE</span>}
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
      <div style={{ ...S.card, padding: pad }}>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Health Records</h2>
          <p style={{ fontSize: '13px', color: '#8C8677' }}>{healthRecords.length} record{healthRecords.length !== 1 ? 's' : ''} on file</p>
        </div>

        {loadingHealth ? (
          <p style={{ color: '#8C8677', fontSize: '14px' }}>Loading…</p>
        ) : healthRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#4A4A42' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px', color: '#22C55E' }}>✓</p>
            <p>No health issues recorded</p>
          </div>
        ) : (
          <div>
            {healthRecords.map((r) => {
              const sevColor = SEV_COLOR[r.severity] || '#8C8677';
              return (
                <div key={r.healthRecordId} style={{ borderLeft: `3px solid ${sevColor}`, paddingLeft: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <span style={{ background: '#162219', color: sevColor, fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', border: `1px solid ${sevColor}44`, marginRight: '8px' }}>
                        {r.severity || r.recordType}
                      </span>
                      <span style={{ fontSize: '12px', color: '#4A4A42' }}>
                        {new Date(r.treatmentDate || r.createdAt).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                    {r.isWithdrawalActive && (
                      <span style={{ background: '#431407', color: '#F59E0B', fontSize: '11px', fontWeight: '700', padding: '2px 10px', borderRadius: '20px' }}>
                        Withdrawal: {r.daysUntilClear}d remaining
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: '#F0EDE8', marginBottom: '4px' }}><strong>Symptoms:</strong> {r.symptoms}</p>
                  {r.diagnosis && r.diagnosis !== 'Pending veterinary assessment' && (
                    <p style={{ fontSize: '13px', color: '#8C8677', marginBottom: '2px' }}><strong>Dx:</strong> {r.diagnosis}</p>
                  )}
                  {r.medicationUsed && (
                    <p style={{ fontSize: '13px', color: '#8C8677', marginBottom: '2px' }}><strong>Tx:</strong> {r.medicationUsed}{r.dosage ? ` · ${r.dosage}` : ''}</p>
                  )}
                  {r.vetName && r.vetName !== 'Farm Worker Report' && (
                    <p style={{ fontSize: '12px', color: '#4A4A42' }}>Vet: {r.vetName}</p>
                  )}
                  {r.outcome && (
                    <p style={{ fontSize: '12px', color: '#4A4A42', marginTop: '4px', fontStyle: 'italic' }}>{r.outcome}</p>
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
