import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import {
  captureVaccination, getVaccinationsByAnimal, getUpcomingVaccinations,
  getVaccineSchedules, batchCaptureVaccination, getHerdImmunity, exportVaccinationsCsv
} from '../api/vaccinationsApi';
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

const coverageColor = (pct, threshold) => pct >= threshold ? '#22C55E' : pct >= threshold * 0.7 ? '#F59E0B' : '#EF4444';

const EMPTY_FORM = { animalId: '', vaccineName: '', vaccineBatch: '', manufacturer: '', expiryDate: '', nextDueDate: '', gpsCoordinates: '', captureMode: 'Online' };
const EMPTY_BATCH = { vaccineName: '', vaccineBatch: '', manufacturer: '', expiryDate: '', nextDueDate: '', gpsCoordinates: '', animalTypeFilter: '' };

// Overlay for batch vaccination modal
function BatchModal({ animals, onClose }) {
  const qc = useQueryClient();
  const isMobile = useMobile();
  const [form, setForm] = useState(EMPTY_BATCH);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [schedules, setSchedules] = useState([]);
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const animalTypes = [...new Map(animals.map(a => [a.animalTypeId, { id: a.animalTypeId, name: a.animalTypeName }])).values()];
  const filtered = form.animalTypeFilter
    ? animals.filter(a => a.animalTypeId === parseInt(form.animalTypeFilter))
    : animals;

  useEffect(() => {
    if (form.animalTypeFilter) {
      getVaccineSchedules(parseInt(form.animalTypeFilter)).then(setSchedules).catch(() => setSchedules([]));
    } else {
      setSchedules([]);
    }
  }, [form.animalTypeFilter]);

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(a => a.animalId)));
  };

  const batchMut = useMutation({
    mutationFn: batchCaptureVaccination,
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ['upcoming'] });
      qc.invalidateQueries({ queryKey: ['herd-immunity'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' }}>
      <div style={{ background: '#1A2B1F', borderRadius: isMobile ? '16px 16px 0 0' : '16px', border: '1px solid #2D4A34', width: '100%', maxWidth: isMobile ? '100%' : '760px', maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto', padding: isMobile ? '20px 16px' : '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F0EDE8', marginBottom: '4px' }}>Batch Vaccination</h2>
            <p style={{ fontSize: '13px', color: '#8C8677' }}>Vaccinate multiple animals with the same vaccine in one operation</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8C8677', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
        </div>

        {result ? (
          <div>
            <div style={{ background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <p style={{ fontWeight: '700', color: '#22C55E', marginBottom: '8px', fontSize: '16px' }}>
                ✓ Batch complete — {result.successCount} vaccinated
              </p>
              {result.failureCount > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <p style={{ color: '#EF4444', fontWeight: '600', marginBottom: '6px' }}>{result.failureCount} failed:</p>
                  {result.failures.map(f => (
                    <p key={f.animalId} style={{ fontSize: '13px', color: '#F59E0B', marginBottom: '2px' }}>Animal #{f.animalId}: {f.reason}</p>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} style={S.btn('#22C55E')}>Close</button>
          </div>
        ) : (
          <form onSubmit={e => {
            e.preventDefault();
            if (selectedIds.size === 0) return;
            batchMut.mutate({ ...form, animalIds: [...selectedIds], expiryDate: form.expiryDate, nextDueDate: form.nextDueDate || null });
          }}>
            {/* Vaccine details */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={S.lbl}>Filter by Animal Type</label>
                <select value={form.animalTypeFilter} onChange={e => { set('animalTypeFilter', e.target.value); setSelectedIds(new Set()); }} style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'}>
                  <option value="" style={{ background: '#162219' }}>— All types —</option>
                  {animalTypes.map(t => <option key={t.id} value={t.id} style={{ background: '#162219' }}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Vaccine Name</label>
                <input list="batch-vaccine-list" value={form.vaccineName} onChange={e => set('vaccineName', e.target.value)} required placeholder="Type or select…" style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                <datalist id="batch-vaccine-list">{schedules.map(s => <option key={s.vaccineScheduleId} value={s.vaccineName} />)}</datalist>
              </div>
              <div>
                <label style={S.lbl}>Batch Number</label>
                <input value={form.vaccineBatch} onChange={e => set('vaccineBatch', e.target.value)} required style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
              <div>
                <label style={S.lbl}>Manufacturer</label>
                <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} required style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
              <div>
                <label style={S.lbl}>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required style={{ ...S.inp, colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={S.lbl}>GPS Coordinates</label>
                <input value={form.gpsCoordinates} onChange={e => set('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" required style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
            </div>

            {/* Animal selection */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={S.lbl}>Select Animals ({selectedIds.size} selected)</label>
                <button type="button" onClick={toggleAll} style={{ background: 'none', border: '1px solid #2D4A34', color: '#8C8677', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #2D4A34', borderRadius: '8px' }}>
                {filtered.map((a, i) => (
                  <label key={a.animalId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: i % 2 === 0 ? '#162219' : '#1A2B1F', cursor: 'pointer' }}>
                    <input type="checkbox" checked={selectedIds.has(a.animalId)} onChange={() => {
                      const next = new Set(selectedIds);
                      next.has(a.animalId) ? next.delete(a.animalId) : next.add(a.animalId);
                      setSelectedIds(next);
                    }} style={{ accentColor: '#22C55E', width: '16px', height: '16px' }} />
                    <span style={{ fontWeight: '600', color: '#22C55E' }}>{a.earTagNumber}</span>
                    <span style={{ color: '#8C8677', fontSize: '13px' }}>{a.breed} · {a.animalTypeName}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '12px', color: a.complianceScore >= 75 ? '#22C55E' : '#F59E0B' }}>Score: {a.complianceScore}</span>
                  </label>
                ))}
              </div>
            </div>

            {batchMut.isError && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Batch failed. Check all fields.</p>}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={batchMut.isPending || selectedIds.size === 0}
                style={{ ...S.btn('#22C55E'), opacity: (batchMut.isPending || selectedIds.size === 0) ? 0.6 : 1, cursor: (batchMut.isPending || selectedIds.size === 0) ? 'not-allowed' : 'pointer' }}>
                {batchMut.isPending ? 'Processing…' : `Vaccinate ${selectedIds.size} Animals`}
              </button>
              <button type="button" onClick={onClose} style={{ ...S.btn('#2D4A34'), color: '#F0EDE8' }}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VaccinationsPage() {
  const { hasRole } = useAuth();
  const isMobile = useMobile();
  const qc = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [form, setForm] = useState(EMPTY_FORM);
  const [auditHash, setAuditHash] = useState('');
  const [historyAnimalId, setHistoryAnimalId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [showBatch, setShowBatch] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const { data: upcoming = [] } = useQuery({ queryKey: ['upcoming'], queryFn: getUpcomingVaccinations });
  const { data: history = [] } = useQuery({
    queryKey: ['vac-history', historyAnimalId],
    queryFn: () => getVaccinationsByAnimal(historyAnimalId),
    enabled: !!historyAnimalId,
  });
  const { data: herdImmunity = [], isLoading: herdLoading } = useQuery({
    queryKey: ['herd-immunity'],
    queryFn: getHerdImmunity,
    enabled: tab === 'herd',
    staleTime: 60_000,
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

  const handleExport = async () => {
    setExporting(true);
    try { await exportVaccinationsCsv(); } finally { setExporting(false); }
  };

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    ...(hasRole('Vet') ? [{ key: 'capture', label: '+ Capture Event' }] : []),
    { key: 'history', label: 'History' },
    { key: 'herd', label: 'Herd Immunity' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      {showBatch && <BatchModal animals={animals} onClose={() => setShowBatch(false)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? '26px' : '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Vaccinations</h1>
          <p style={{ color: '#8C8677', fontSize: '14px' }}>DALRRD-compliant vaccination records with SHA-256 audit hashing</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {hasRole('Vet') && (
            <button onClick={() => setShowBatch(true)} style={{ ...S.btn('#177A3E'), fontSize: '13px', padding: '9px 18px' }}>
              Batch Vaccinate
            </button>
          )}
          <button onClick={handleExport} disabled={exporting} style={{ background: 'none', border: '1px solid #2D4A34', color: '#8C8677', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: exporting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '24px', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ display: 'flex', gap: '4px', background: '#162219', padding: '4px', borderRadius: '10px', width: 'fit-content', minWidth: 'max-content' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={S.lbl}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'}>
                  <option value="" style={{ background: '#162219' }}>— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId} style={{ background: '#162219' }}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Vaccine Name</label>
                <input list="vaccine-schedule-list" value={form.vaccineName} onChange={e => set('vaccineName', e.target.value)} required placeholder="Type or select from schedule…" style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                <datalist id="vaccine-schedule-list">{schedules.map(s => <option key={s.vaccineScheduleId} value={s.vaccineName} />)}</datalist>
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
                  <input value={form[key]} onChange={e => set(key, e.target.value)} required style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                </div>
              ))}
              <div>
                <label style={S.lbl}>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required style={{ ...S.inp, colorScheme: 'dark' }} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
              <div>
                <label style={S.lbl}>Next Due Date <span style={{ fontWeight: '400', color: '#4A4A42', textTransform: 'none', letterSpacing: 0 }}>{matchedSchedule ? '— auto-calculated' : '— optional'}</span></label>
                <input type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} disabled={!!matchedSchedule} style={{ ...S.inp, colorScheme: 'dark', opacity: matchedSchedule ? 0.4 : 1, cursor: matchedSchedule ? 'not-allowed' : 'auto' }} />
              </div>
              <div>
                <label style={S.lbl}>GPS Coordinates</label>
                <input value={form.gpsCoordinates} onChange={e => set('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" required style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
            </div>
            {captureMut.isError && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Failed to capture. Check all fields.</p>}
            <button type="submit" disabled={captureMut.isPending} style={{ ...S.btn('#22C55E'), opacity: captureMut.isPending ? 0.7 : 1, cursor: captureMut.isPending ? 'not-allowed' : 'pointer' }}>
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
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={S.inp} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'}>
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
                      <span style={{ background: '#1A2B1F', color: '#8C8677', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #2D4A34' }}>{v.captureMode}</span>
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

      {/* Herd Immunity */}
      {tab === 'herd' && (
        <div>
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F0EDE8', marginBottom: '4px' }}>Herd Immunity Coverage</h3>
            <p style={{ fontSize: '13px', color: '#8C8677' }}>Coverage vs DALRRD-aligned thresholds per notifiable disease. Green = protected, red = at risk.</p>
          </div>

          {herdLoading ? (
            <p style={{ color: '#8C8677', padding: '40px 0' }}>Calculating herd immunity…</p>
          ) : herdImmunity.length === 0 ? (
            <div style={{ ...S.card, textAlign: 'center', padding: '60px' }}>
              <p style={{ color: '#4A4A42', fontSize: '14px' }}>No vaccination data available. Capture vaccinations first.</p>
            </div>
          ) : (
            // Group by animal type
            Object.entries(
              herdImmunity.reduce((acc, r) => {
                if (!acc[r.animalTypeName]) acc[r.animalTypeName] = [];
                acc[r.animalTypeName].push(r);
                return acc;
              }, {})
            ).map(([typeName, items]) => (
              <div key={typeName} style={S.card}>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#F0EDE8', marginBottom: '20px' }}>{typeName}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                  {items.map(r => {
                    const color = coverageColor(r.coveragePercent, r.thresholdPercent);
                    return (
                      <div key={r.vaccineName} style={{ background: '#162219', borderRadius: '10px', padding: '18px 20px', border: `1px solid ${r.isProtected ? '#1F3326' : '#450A0A'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div>
                            <p style={{ fontWeight: '700', color: '#F0EDE8', fontSize: '14px', marginBottom: '2px' }}>{r.vaccineName}</p>
                            <p style={{ fontSize: '11px', color: '#8C8677' }}>{r.diseaseName}</p>
                          </div>
                          <span style={{ background: r.isProtected ? '#052E16' : '#450A0A', color: r.isProtected ? '#22C55E' : '#EF4444', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                            {r.isProtected ? 'Protected' : 'At Risk'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: '#1F3326', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                            <div style={{ height: '100%', width: `${r.coveragePercent}%`, background: color, borderRadius: '3px', transition: 'width 0.8s ease' }} />
                            <div style={{ position: 'absolute', top: 0, left: `${r.thresholdPercent}%`, width: '2px', height: '100%', background: '#F59E0B', opacity: 0.8 }} title={`Threshold: ${r.thresholdPercent}%`} />
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color, minWidth: '48px', textAlign: 'right' }}>{r.coveragePercent}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8C8677' }}>
                          <span>{r.protectedAnimals}/{r.totalAnimals} animals protected</span>
                          <span>Threshold: {r.thresholdPercent}%</span>
                        </div>
                        {!r.isProtected && (
                          <p style={{ fontSize: '11px', color: '#F59E0B', marginTop: '8px' }}>
                            {r.animalsNeededForThreshold} more animal{r.animalsNeededForThreshold !== 1 ? 's' : ''} needed
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
