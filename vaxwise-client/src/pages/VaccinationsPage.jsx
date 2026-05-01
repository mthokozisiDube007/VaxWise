import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { captureVaccination, getVaccinationsByAnimal, getUpcomingVaccinations } from '../api/vaccinationsApi';
import { getAllAnimals } from '../api/animalsApi';

const S = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#333' },
  btn: (color) => ({ background: color, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }),
  tab: (active) => ({ padding: '10px 20px', border: 'none', borderBottom: active ? '3px solid #1A5276' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', color: active ? '#1A5276' : '#666', fontSize: '14px' }),
  th: { padding: '10px', textAlign: 'left', color: '#1A5276', fontSize: '13px' },
  td: { padding: '10px', fontSize: '14px', borderBottom: '1px solid #f0f0f0' },
};

const EMPTY_FORM = { animalId: '', vaccineName: '', vaccineBatch: '', manufacturer: '', expiryDate: '', nextDueDate: '', gpsCoordinates: '', captureMode: 'Online' };

export default function VaccinationsPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [form, setForm] = useState(EMPTY_FORM);
  const [auditHash, setAuditHash] = useState('');
  const [historyAnimalId, setHistoryAnimalId] = useState('');

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const { data: upcoming = [] } = useQuery({ queryKey: ['upcoming'], queryFn: getUpcomingVaccinations });
  const { data: history = [] } = useQuery({
    queryKey: ['vac-history', historyAnimalId],
    queryFn: () => getVaccinationsByAnimal(historyAnimalId),
    enabled: !!historyAnimalId,
  });

  const captureMut = useMutation({
    mutationFn: captureVaccination,
    onSuccess: (data) => {
      setAuditHash(data.auditHash);
      qc.invalidateQueries(['upcoming']);
      setForm(EMPTY_FORM);
    },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>💉 Vaccinations</h1>

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'upcoming', label: '📅 Upcoming' },
          ...(hasRole('Vet') ? [{ key: 'capture', label: '+ Capture Event' }] : []),
          { key: 'history', label: '📋 History' },
        ].map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'upcoming' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Due in Next 7 Days</h3>
          {upcoming.length === 0 ? <p style={{ color: '#666' }}>No vaccinations due this week.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Animal', 'Vaccine', 'Batch', 'Due Date', 'GPS'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{upcoming.map(v => (
                <tr key={v.eventId}>
                  <td style={S.td}><strong>{v.animalEarTag}</strong></td>
                  <td style={S.td}>{v.vaccineName}</td>
                  <td style={S.td}>{v.vaccineBatch}</td>
                  <td style={S.td}>{new Date(v.nextDueDate).toLocaleDateString()}</td>
                  <td style={S.td}>{v.gpsCoordinates}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'capture' && hasRole('Vet') && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Capture Vaccination Event</h3>
          <form onSubmit={e => { e.preventDefault(); captureMut.mutate({ ...form, animalId: parseInt(form.animalId) }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required style={S.input}>
                  <option value="">— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              {[
                { label: 'Vaccine Name', key: 'vaccineName' },
                { label: 'Batch Number', key: 'vaccineBatch' },
                { label: 'Manufacturer', key: 'manufacturer' },
              ].map(({ label, key }) => (
                <div key={key}><label style={S.label}>{label}</label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)} required style={S.input} /></div>
              ))}
              <div><label style={S.label}>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Next Due Date</label>
                <input type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>GPS Coordinates</label>
                <input value={form.gpsCoordinates} onChange={e => set('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" required style={S.input} /></div>
            </div>
            {captureMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to capture. Check all fields.</p>}
            <button type="submit" disabled={captureMut.isPending} style={S.btn('#1E8449')}>
              {captureMut.isPending ? 'Capturing...' : '🔒 Capture & Generate Hash'}
            </button>
          </form>

          {auditHash && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#EAFAF1', border: '1px solid #1E8449', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#1E8449' }}>✅ Vaccination captured — Audit Hash (SHA-256)</p>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#555' }}>This hash is cryptographic proof of the event. It cannot be altered.</p>
              <code style={{ display: 'block', fontSize: '12px', wordBreak: 'break-all', color: '#1A5276', fontFamily: 'monospace' }}>{auditHash}</code>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Vaccination History</h3>
          <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
            <label style={S.label}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={S.input}>
              <option value="">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (
            history.length === 0 ? <p style={{ color: '#666' }}>No vaccination records for this animal.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#EAF2FB' }}>
                  {['Vaccine', 'Batch', 'Date', 'Next Due', 'Mode', 'Audit Hash'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{history.map(v => (
                  <tr key={v.eventId}>
                    <td style={S.td}>{v.vaccineName}</td>
                    <td style={S.td}>{v.vaccineBatch}</td>
                    <td style={S.td}>{new Date(v.eventTimestamp).toLocaleDateString()}</td>
                    <td style={S.td}>{new Date(v.nextDueDate).toLocaleDateString()}</td>
                    <td style={S.td}><span style={{ fontSize: '11px', background: '#EAF2FB', padding: '2px 6px', borderRadius: '4px' }}>{v.captureMode}</span></td>
                    <td style={S.td}><code style={{ fontSize: '10px', color: '#888' }}>{v.auditHash?.slice(0, 16)}…</code></td>
                  </tr>
                ))}</tbody>
              </table>
            )
          )}
        </div>
      )}
    </div>
  );
}
