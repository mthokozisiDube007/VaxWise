import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordBreeding, getBreedingHistory, getUpcomingBirths, recordBirth } from '../api/breedingApi';
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

const EMPTY_BREED = { femaleAnimalId: '', maleAnimalId: '', breedingDate: new Date().toISOString().split('T')[0], notes: '' };
const EMPTY_BIRTH = { breedingRecordId: '', numberOfOffspring: '', birthWeightKg: '', survivalStatus: 'AllSurvived', actualBirthDate: new Date().toISOString().split('T')[0] };

export default function BreedingPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('upcoming');
  const [breedForm, setBreedForm] = useState(EMPTY_BREED);
  const [birthForm, setBirthForm] = useState(EMPTY_BIRTH);
  const [historyAnimalId, setHistoryAnimalId] = useState('');

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const females = animals.filter(a => a.gender === 'F');
  const males = animals.filter(a => a.gender === 'M');

  const { data: upcoming = [] } = useQuery({ queryKey: ['upcoming-births'], queryFn: getUpcomingBirths });
  const { data: history = [] } = useQuery({
    queryKey: ['breed-history', historyAnimalId],
    queryFn: () => getBreedingHistory(historyAnimalId),
    enabled: !!historyAnimalId,
  });

  const breedMut = useMutation({
    mutationFn: recordBreeding,
    onSuccess: () => { qc.invalidateQueries(['upcoming-births']); setBreedForm(EMPTY_BREED); },
  });

  const birthMut = useMutation({
    mutationFn: recordBirth,
    onSuccess: () => { qc.invalidateQueries(['animals']); qc.invalidateQueries(['upcoming-births']); setBirthForm(EMPTY_BIRTH); },
  });

  const setB = (k, v) => setBreedForm(f => ({ ...f, [k]: v }));
  const setBf = (k, v) => setBirthForm(f => ({ ...f, [k]: v }));

  const daysUntil = (date) => {
    const diff = new Date(date) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>🐣 Breeding Management</h1>

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'upcoming', label: '📅 Upcoming Births' },
          { key: 'record', label: '+ Record Breeding' },
          { key: 'birth', label: '+ Record Birth' },
          { key: 'history', label: '📋 History' },
        ].map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'upcoming' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Births Expected in Next 14 Days</h3>
          {upcoming.length === 0 ? <p style={{ color: '#666' }}>No births expected in the next 14 days.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Female', 'Male', 'Type', 'Expected Date', 'Days Left', 'Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{upcoming.map(r => {
                const days = daysUntil(r.expectedBirthDate);
                return (
                  <tr key={r.breedingRecordId}>
                    <td style={S.td}><strong>{r.femaleEarTag}</strong></td>
                    <td style={S.td}>{r.maleEarTag}</td>
                    <td style={S.td}>{r.animalTypeName}</td>
                    <td style={S.td}>{new Date(r.expectedBirthDate).toLocaleDateString()}</td>
                    <td style={S.td}><span style={{ fontWeight: 'bold', color: days <= 3 ? '#E74C3C' : '#D4AC0D' }}>{days}d</span></td>
                    <td style={S.td}><span style={{ fontSize: '11px', background: '#EAF2FB', padding: '2px 6px', borderRadius: '4px' }}>{r.status}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'record' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Record Breeding Event</h3>
          <form onSubmit={e => { e.preventDefault(); breedMut.mutate({ ...breedForm, femaleAnimalId: parseInt(breedForm.femaleAnimalId), maleAnimalId: parseInt(breedForm.maleAnimalId) }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Female Animal</label>
                <select value={breedForm.femaleAnimalId} onChange={e => setB('femaleAnimalId', e.target.value)} required style={S.input}>
                  <option value="">— Select female —</option>
                  {females.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Male Animal</label>
                <select value={breedForm.maleAnimalId} onChange={e => setB('maleAnimalId', e.target.value)} required style={S.input}>
                  <option value="">— Select male —</option>
                  {males.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div><label style={S.label}>Breeding Date</label><input type="date" value={breedForm.breedingDate} onChange={e => setB('breedingDate', e.target.value)} required style={S.input} /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Notes</label><input value={breedForm.notes} onChange={e => setB('notes', e.target.value)} style={S.input} /></div>
            </div>
            {breedMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to record breeding event.</p>}
            <button type="submit" disabled={breedMut.isPending} style={S.btn('#1A5276')}>
              {breedMut.isPending ? 'Recording...' : 'Record Breeding'}
            </button>
          </form>
        </div>
      )}

      {tab === 'birth' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Record Birth Outcome</h3>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>Offspring will be automatically registered as new animals.</p>
          <form onSubmit={e => { e.preventDefault(); birthMut.mutate({ breedingRecordId: parseInt(birthForm.breedingRecordId), numberOfOffspring: parseInt(birthForm.numberOfOffspring), birthWeightKg: parseFloat(birthForm.birthWeightKg), survivalStatus: birthForm.survivalStatus, actualBirthDate: birthForm.actualBirthDate }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div><label style={S.label}>Breeding Record ID</label><input type="number" value={birthForm.breedingRecordId} onChange={e => setBf('breedingRecordId', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Number of Offspring</label><input type="number" min="1" value={birthForm.numberOfOffspring} onChange={e => setBf('numberOfOffspring', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Birth Weight (kg)</label><input type="number" step="0.1" value={birthForm.birthWeightKg} onChange={e => setBf('birthWeightKg', e.target.value)} required style={S.input} /></div>
              <div>
                <label style={S.label}>Survival Status</label>
                <select value={birthForm.survivalStatus} onChange={e => setBf('survivalStatus', e.target.value)} style={S.input}>
                  <option value="AllSurvived">All Survived</option>
                  <option value="SomeLost">Some Lost</option>
                  <option value="AllLost">All Lost</option>
                </select>
              </div>
              <div><label style={S.label}>Actual Birth Date</label><input type="date" value={birthForm.actualBirthDate} onChange={e => setBf('actualBirthDate', e.target.value)} required style={S.input} /></div>
            </div>
            {birthMut.isSuccess && (
              <div style={{ padding: '10px', background: '#EAFAF1', border: '1px solid #1E8449', borderRadius: '6px', marginBottom: '12px' }}>
                <p style={{ margin: 0, color: '#1E8449', fontSize: '13px', fontWeight: 'bold' }}>✅ Birth recorded. Offspring registered: {birthMut.data?.offspringEarTags?.join(', ')}</p>
              </div>
            )}
            {birthMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to record birth. Check breeding record ID.</p>}
            <button type="submit" disabled={birthMut.isPending} style={S.btn('#1E8449')}>
              {birthMut.isPending ? 'Recording...' : 'Record Birth'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Breeding History</h3>
          <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
            <label style={S.label}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={S.input}>
              <option value="">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.gender === 'M' ? 'Male' : 'Female'} {a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? <p style={{ color: '#666' }}>No breeding records.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Female', 'Male', 'Type', 'Breeding Date', 'Expected Birth', 'Status'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{history.map(r => (
                <tr key={r.breedingRecordId}>
                  <td style={S.td}>{r.femaleEarTag}</td>
                  <td style={S.td}>{r.maleEarTag}</td>
                  <td style={S.td}>{r.animalTypeName}</td>
                  <td style={S.td}>{new Date(r.breedingDate).toLocaleDateString()}</td>
                  <td style={S.td}>{new Date(r.expectedBirthDate).toLocaleDateString()}</td>
                  <td style={S.td}><span style={{ fontSize: '11px', background: '#EAF2FB', padding: '2px 6px', borderRadius: '4px' }}>{r.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          ))}
        </div>
      )}
    </div>
  );
}
