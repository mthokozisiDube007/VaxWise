import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { captureVaccination, getVaccinationsByAnimal, getUpcomingVaccinations, getVaccineSchedules } from '../api/vaccinationsApi';
import { getAllAnimals } from '../api/animalsApi';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  inp: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #2D4A34', fontSize: '14px', boxSizing: 'border-box', background: '#162219', color: '#F0EDE8', fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.15s' },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tab: (a) => ({ padding: '8px 20px', border: 'none', borderRadius: '8px', background: a ? '#22C55E' : 'transparent', cursor: 'pointer', fontWeight: a ? '700' : '400', color: a ? '#0B1F14' : '#8C8677', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }),
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
  btn: (c) => ({ background: c, color: c === '#22C55E' ? '#0B1F14' : 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }),
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
      qc.invalidateQueries({ queryKey: ['upcoming'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
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
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Vaccinations</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>DALRRD-compliant vaccination records with SHA-256 audit hashing</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: '#162219', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Due in Next 7 Days</h3>
              <p style={{ fontSize: '12px', color: '#8C8677' }}>Animals requiring vaccination within the next week</p>
            </div>
            <span style={{ background: upcoming.length > 0 ? '#431407' : '#052E16', color: upcoming.length > 0 ? '#F59E0B' : '#22C55E', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
              {upcoming.length} due
            </span>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#4A4A42' }}>
              <p style={{ fontSize: '28px', marginBottom: '8px', color: '#22C55E' }}>✓</p>
              <p style={{ fontSize: '14px' }}>No vaccinations due this week.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Animal', 'Vaccine', 'Batch', 'Due Date', 'GPS'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{upcoming.map((v, i) => (
                  <tr key={v.eventId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#22C55E' }}>{v.animalEarTag}</td>
                    <td style={S.td}>{v.vaccineName}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{v.vaccineBatch}</td>
                    <td style={{ ...S.td, color: new Date(v.nextDueDate) <= new Date() ? '#EF4444' : '#F0EDE8', fontWeight: new Date(v.nextDueDate) <= new Date() ? '600' : '400' }}>
                      {new Date(v.nextDueDate).toLocaleDateString('en-ZA')}
                    </td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{v.gpsCoordinates}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Capture Event */}
      {tab === 'capture' && hasRole('Vet') && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '4px' }}>Capture Vaccination Event</h3>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Each event is cryptographically hashed (SHA-256) and cannot be altered after capture.</p>

          {schedules.length > 0 && (
            <div style={{ background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '9px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: '#86EFAC' }}>
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
                <select
                  value={form.animalId}
                  onChange={e => set('animalId', e.target.value)}
                  required
                  style={S.inp}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                >
                  <option value="" style={{ background: '#162219' }}>— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId} style={{ background: '#162219' }}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>

              <div>
                <label style={S.lbl}>Vaccine Name</label>
                <input
                  list="vaccine-schedule-list"
                  value={form.vaccineName}
                  onChange={e => set('vaccineName', e.target.value)}
                  required
                  placeholder="Type or select from schedule…"
                  style={S.inp}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                />
                <datalist id="vaccine-schedule-list">
                  {schedules.map(s => <option key={s.vaccineScheduleId} value={s.vaccineName} />)}
                </datalist>
                {matchedSchedule && (
                  <p style={{ fontSize: '11px', color: '#22C55E', marginTop: '4px' }}>
                    ✓ In schedule — next due auto-calculated ({matchedSchedule.intervalDays}-day interval)
                    {matchedSchedule.isNotifiable && <span style={{ color: '#EF4444', marginLeft: '6px' }}>· DALRRD notifiable</span>}
                  </p>
                )}
              </div>

              {[['Batch Number', 'vaccineBatch'], ['Manufacturer', 'manufacturer']].map(([label, key]) => (
                <div key={key}>
                  <label style={S.lbl}>{label}</label>
                  <input
                    value={form[key]}
                    onChange={e => set(key, e.target.value)}
                    required
                    style={S.inp}
                    onFocus={e => e.target.style.borderColor = '#22C55E'}
                    onBlur={e => e.target.style.borderColor = '#2D4A34'}
                  />
                </div>
              ))}

              <div>
                <label style={S.lbl}>Expiry Date</label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={e => set('expiryDate', e.target.value)}
                  required
                  style={{ ...S.inp, colorScheme: 'dark' }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                />
              </div>

              <div>
                <label style={S.lbl}>
                  Next Due Date{' '}
                  <span style={{ fontWeight: '400', color: '#4A4A42', textTransform: 'none', letterSpacing: 0 }}>
                    {matchedSchedule ? '— auto-calculated' : '— optional'}
                  </span>
                </label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={e => set('nextDueDate', e.target.value)}
                  disabled={!!matchedSchedule}
                  style={{ ...S.inp, colorScheme: 'dark', opacity: matchedSchedule ? 0.4 : 1, cursor: matchedSchedule ? 'not-allowed' : 'auto' }}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                />
              </div>

              <div>
                <label style={S.lbl}>GPS Coordinates</label>
                <input
                  value={form.gpsCoordinates}
                  onChange={e => set('gpsCoordinates', e.target.value)}
                  placeholder="-26.2023,28.0293"
                  required
                  style={S.inp}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                />
              </div>
            </div>

            {captureMut.isError && (
              <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Failed to capture. Check all fields.</p>
            )}
            <button
              type="submit"
              disabled={captureMut.isPending}
              style={{ ...S.btn('#22C55E'), opacity: captureMut.isPending ? 0.7 : 1, cursor: captureMut.isPending ? 'not-allowed' : 'pointer' }}
            >
              {captureMut.isPending ? 'Capturing…' : '🔒 Capture & Generate Hash'}
            </button>
          </form>

          {auditHash && (
            <div style={{ marginTop: '24px', padding: '20px', background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px' }}>
              <p style={{ fontWeight: '700', color: '#22C55E', marginBottom: '6px' }}>✓ Vaccination captured — SHA-256 Audit Hash</p>
              <p style={{ fontSize: '12px', color: '#8C8677', marginBottom: '10px' }}>This hash is cryptographic proof of the event and cannot be altered.</p>
              <code style={{ display: 'block', fontSize: '12px', wordBreak: 'break-all', color: '#86EFAC', fontFamily: "'JetBrains Mono', monospace", background: '#162219', padding: '10px 14px', borderRadius: '7px', border: '1px solid #2D4A34' }}>{auditHash}</code>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '20px' }}>Vaccination History</h3>
          <div style={{ marginBottom: '20px', maxWidth: '320px' }}>
            <label style={S.lbl}>Select Animal</label>
            <select
              value={historyAnimalId}
              onChange={e => setHistoryAnimalId(e.target.value)}
              style={S.inp}
              onFocus={e => e.target.style.borderColor = '#22C55E'}
              onBlur={e => e.target.style.borderColor = '#2D4A34'}
            >
              <option value="" style={{ background: '#162219' }}>— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId} style={{ background: '#162219' }}>{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? (
            <p style={{ color: '#8C8677', padding: '20px 0' }}>No vaccination records for this animal.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Vaccine', 'Batch', 'Date', 'Next Due', 'Mode', 'Audit Hash'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
                <tbody>{history.map((v, i) => (
                  <tr key={v.eventId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={S.td}>{v.vaccineName}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{v.vaccineBatch}</td>
                    <td style={S.td}>{new Date(v.eventTimestamp).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>{new Date(v.nextDueDate).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>
                      <span style={{ background: '#1A2B1F', color: '#8C8677', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #2D4A34' }}>
                        {v.captureMode}
                      </span>
                    </td>
                    <td style={S.td}>
                      <code style={{ fontSize: '11px', color: '#4A4A42', fontFamily: "'JetBrains Mono', monospace" }}>{v.auditHash?.slice(0, 16)}…</code>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
