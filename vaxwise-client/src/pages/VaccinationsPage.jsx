import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { captureVaccination, getVaccinationsByAnimal, getUpcomingVaccinations, getVaccineSchedules } from '../api/vaccinationsApi';
import { getAllAnimals } from '../api/animalsApi';

const S = {
  card: { background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(11,31,20,0.05), 0 4px 16px rgba(11,31,20,0.05)', marginBottom: '24px' },
  inp: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E0D9CE', fontSize: '14px', boxSizing: 'border-box', background: '#FDFCF8', color: '#1A1A18', fontFamily: "'DM Sans', sans-serif" },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tab: (a) => ({ padding: '8px 18px', border: 'none', borderRadius: '20px', background: a ? '#0B1F14' : 'transparent', cursor: 'pointer', fontWeight: a ? '600' : '400', color: a ? '#FFF' : '#8C8677', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }),
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#F8F5F0', borderBottom: '1px solid #EDE8DF' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #F0EBE2', color: '#1A1A18' },
  btn: (c) => ({ background: c, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }),
};

const EMPTY_FORM = { animalId: '', vaccineName: '', vaccineBatch: '', manufacturer: '', expiryDate: '', nextDueDate: '', gpsCoordinates: '', captureMode: 'Online' };

export default function VaccinationsPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [form, setForm] = useState(EMPTY_FORM);
  const [auditHash, setAuditHash] = useState('');
  const [historyAnimalId, setHistoryAnimalId] = useState('');
  const [schedules, setSchedules] = useState([]);

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const { data: upcoming = [] } = useQuery({ queryKey: ['upcoming'], queryFn: getUpcomingVaccinations });
  const { data: history = [] } = useQuery({
    queryKey: ['vac-history', historyAnimalId],
    queryFn: () => getVaccinationsByAnimal(historyAnimalId),
    enabled: !!historyAnimalId,
  });

  // Load vaccine schedule when animal is selected
  useEffect(() => {
    const animal = animals.find(a => a.animalId === parseInt(form.animalId));
    if (animal?.animalTypeId) {
      getVaccineSchedules(animal.animalTypeId).then(setSchedules).catch(() => setSchedules([]));
    } else {
      setSchedules([]);
    }
  }, [form.animalId, animals]);

  const matchedSchedule = schedules.find(s => s.vaccineName === form.vaccineName);

  const captureMut = useMutation({
    mutationFn: captureVaccination,
    onSuccess: (data) => {
      setAuditHash(data.auditHash);
      qc.invalidateQueries(['upcoming']);
      qc.invalidateQueries(['dashboard']);
      setForm(EMPTY_FORM);
    },
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    ...(hasRole('Vet') ? [{ key: 'capture', label: '+ Capture Event' }] : []),
    { key: 'history', label: 'History' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#0B1F14', marginBottom: '4px' }}>Vaccinations</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>DALRRD-compliant vaccination records with SHA-256 audit hashing</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', background: 'white', padding: '5px', borderRadius: '12px', width: 'fit-content', marginBottom: '24px', boxShadow: '0 1px 4px rgba(11,31,20,0.06)' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14' }}>Due in Next 7 Days</h3>
            <span style={{ background: upcoming.length > 0 ? '#FEF3C7' : '#F0FDF4', color: upcoming.length > 0 ? '#B45309' : '#15803D', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
              {upcoming.length} due
            </span>
          </div>
          {upcoming.length === 0 ? (
            <p style={{ color: '#8C8677', textAlign: 'center', padding: '32px' }}>✓ No vaccinations due this week.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Animal', 'Vaccine', 'Batch', 'Due Date', 'GPS'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{upcoming.map(v => (
                <tr key={v.eventId}>
                  <td style={{ ...S.td, fontWeight: '700', color: '#0B1F14' }}>{v.animalEarTag}</td>
                  <td style={S.td}>{v.vaccineName}</td>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{v.vaccineBatch}</td>
                  <td style={S.td}>{new Date(v.nextDueDate).toLocaleDateString('en-ZA')}</td>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{v.gpsCoordinates}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {/* Capture Event */}
      {tab === 'capture' && hasRole('Vet') && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '6px' }}>Capture Vaccination Event</h3>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Each event is cryptographically hashed (SHA-256) and cannot be altered after capture.</p>

          {/* Schedule library hint */}
          {schedules.length > 0 && (
            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '9px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#15803D' }}>
              {schedules.length} SA-registered vaccines available for this animal type — select a name below for auto-scheduling.
            </div>
          )}

          <form onSubmit={e => {
            e.preventDefault();
            captureMut.mutate({ ...form, animalId: parseInt(form.animalId), nextDueDate: form.nextDueDate || null });
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={S.lbl}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required style={S.inp}>
                  <option value="">— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>

              {/* Vaccine name with datalist from schedule library */}
              <div>
                <label style={S.lbl}>Vaccine Name</label>
                <input
                  list="vaccine-schedule-list"
                  value={form.vaccineName}
                  onChange={e => set('vaccineName', e.target.value)}
                  required
                  placeholder="Type or select from schedule…"
                  style={S.inp}
                />
                <datalist id="vaccine-schedule-list">
                  {schedules.map(s => <option key={s.vaccineScheduleId} value={s.vaccineName} />)}
                </datalist>
                {matchedSchedule && (
                  <p style={{ fontSize: '11px', color: '#177A3E', marginTop: '4px' }}>
                    ✓ In schedule — next due auto-calculated ({matchedSchedule.intervalDays}-day interval)
                    {matchedSchedule.isNotifiable && <span style={{ color: '#B91C1C', marginLeft: '6px' }}>· DALRRD notifiable</span>}
                  </p>
                )}
              </div>

              {[['Batch Number', 'vaccineBatch'], ['Manufacturer', 'manufacturer']].map(([label, key]) => (
                <div key={key}><label style={S.lbl}>{label}</label><input value={form[key]} onChange={e => set(key, e.target.value)} required style={S.inp} /></div>
              ))}

              <div>
                <label style={S.lbl}>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required style={S.inp} />
              </div>

              <div>
                <label style={S.lbl}>
                  Next Due Date{' '}
                  <span style={{ fontWeight: '400', color: '#B0A898', textTransform: 'none', letterSpacing: 0 }}>
                    {matchedSchedule ? '— auto-calculated' : '— optional'}
                  </span>
                </label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={e => set('nextDueDate', e.target.value)}
                  disabled={!!matchedSchedule}
                  style={{ ...S.inp, opacity: matchedSchedule ? 0.5 : 1 }}
                />
              </div>

              <div>
                <label style={S.lbl}>GPS Coordinates</label>
                <input value={form.gpsCoordinates} onChange={e => set('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" required style={S.inp} />
              </div>
            </div>

            {captureMut.isError && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>Failed to capture. Check all fields.</p>}
            <button type="submit" disabled={captureMut.isPending} style={S.btn('#177A3E')}>
              {captureMut.isPending ? 'Capturing…' : '🔒 Capture & Generate Hash'}
            </button>
          </form>

          {auditHash && (
            <div style={{ marginTop: '24px', padding: '20px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '10px' }}>
              <p style={{ fontWeight: '700', color: '#15803D', marginBottom: '6px' }}>✓ Vaccination captured — SHA-256 Audit Hash</p>
              <p style={{ fontSize: '12px', color: '#6E6B60', marginBottom: '10px' }}>This hash is cryptographic proof of the event and cannot be altered.</p>
              <code style={{ display: 'block', fontSize: '12px', wordBreak: 'break-all', color: '#0B1F14', fontFamily: "'JetBrains Mono', monospace", background: 'white', padding: '10px 14px', borderRadius: '7px', border: '1px solid #D1FAE5' }}>{auditHash}</code>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '20px' }}>Vaccination History</h3>
          <div style={{ marginBottom: '20px', maxWidth: '320px' }}>
            <label style={S.lbl}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={S.inp}>
              <option value="">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? <p style={{ color: '#8C8677' }}>No vaccination records for this animal.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Vaccine', 'Batch', 'Date', 'Next Due', 'Mode', 'Audit Hash'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>{history.map(v => (
                <tr key={v.eventId}>
                  <td style={S.td}>{v.vaccineName}</td>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>{v.vaccineBatch}</td>
                  <td style={S.td}>{new Date(v.eventTimestamp).toLocaleDateString('en-ZA')}</td>
                  <td style={S.td}>{new Date(v.nextDueDate).toLocaleDateString('en-ZA')}</td>
                  <td style={S.td}><span style={{ background: '#F0EBE1', color: '#6E6B60', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{v.captureMode}</span></td>
                  <td style={S.td}><code style={{ fontSize: '11px', color: '#B0A898', fontFamily: "'JetBrains Mono', monospace" }}>{v.auditHash?.slice(0, 16)}…</code></td>
                </tr>
              ))}</tbody>
            </table>
          ))}
        </div>
      )}
    </div>
  );
}
