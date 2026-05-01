import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { recordTreatment, getHealthRecords, getCurrentHealth, checkOutbreak } from '../api/healthApi';
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

const EMPTY_FORM = { animalId: '', recordType: 'Treatment', symptoms: '', diagnosis: '', medicationUsed: '', dosage: '', vetName: '', outcome: '', treatmentDate: new Date().toISOString().split('T')[0] };

export default function HealthPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('current');
  const [form, setForm] = useState(EMPTY_FORM);
  const [historyAnimalId, setHistoryAnimalId] = useState('');
  const [symptomCheck, setSymptomCheck] = useState('');
  const [outbreakResult, setOutbreakResult] = useState(null);

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const { data: current = [] } = useQuery({ queryKey: ['health-current'], queryFn: getCurrentHealth });
  const { data: history = [] } = useQuery({
    queryKey: ['health-history', historyAnimalId],
    queryFn: () => getHealthRecords(historyAnimalId),
    enabled: !!historyAnimalId,
  });

  const recordMut = useMutation({
    mutationFn: recordTreatment,
    onSuccess: () => { qc.invalidateQueries(['health-current']); setForm(EMPTY_FORM); },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleOutbreakCheck = async () => {
    if (!symptomCheck.trim()) return;
    const result = await checkOutbreak(symptomCheck);
    setOutbreakResult(result);
  };

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>🏥 Health Management</h1>

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'current', label: '🩺 Under Treatment' },
          ...(hasRole('Vet') ? [{ key: 'record', label: '+ Record Treatment' }] : []),
          { key: 'history', label: '📋 History' },
          { key: 'outbreak', label: '🚨 Outbreak Check' },
        ].map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'current' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Animals Currently Under Treatment ({current.length})</h3>
          {current.length === 0 ? <p style={{ color: '#666' }}>No animals under treatment.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#FDEDEC' }}>
                {['Animal', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Date'].map(h => <th key={h} style={{ ...S.th, color: '#C0392B' }}>{h}</th>)}
              </tr></thead>
              <tbody>{current.map(r => (
                <tr key={r.healthRecordId}>
                  <td style={S.td}><strong>{r.animalEarTag}</strong></td>
                  <td style={S.td}>{r.symptoms}</td>
                  <td style={S.td}>{r.diagnosis}</td>
                  <td style={S.td}>{r.medicationUsed} {r.dosage && `(${r.dosage})`}</td>
                  <td style={S.td}>{r.vetName}</td>
                  <td style={S.td}>{new Date(r.treatmentDate).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'record' && hasRole('Vet') && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Record Treatment</h3>
          <form onSubmit={e => { e.preventDefault(); recordMut.mutate({ ...form, animalId: parseInt(form.animalId) }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required style={S.input}>
                  <option value="">— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label style={S.label}>Record Type</label>
                <select value={form.recordType} onChange={e => set('recordType', e.target.value)} style={S.input}>
                  <option>Treatment</option>
                  <option>VetVisit</option>
                  <option>Observation</option>
                </select>
              </div>
              <div><label style={S.label}>Treatment Date</label>
                <input type="date" value={form.treatmentDate} onChange={e => set('treatmentDate', e.target.value)} required style={S.input} /></div>
              {[
                { label: 'Symptoms', key: 'symptoms' },
                { label: 'Diagnosis', key: 'diagnosis' },
                { label: 'Medication Used', key: 'medicationUsed' },
                { label: 'Dosage', key: 'dosage' },
                { label: 'Vet Name', key: 'vetName' },
                { label: 'Outcome', key: 'outcome' },
              ].map(({ label, key }) => (
                <div key={key}><label style={S.label}>{label}</label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)} style={S.input} /></div>
              ))}
            </div>
            {recordMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to record. Check animal selection.</p>}
            <button type="submit" disabled={recordMut.isPending} style={S.btn('#C0392B')}>
              {recordMut.isPending ? 'Recording...' : 'Record Treatment'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Health History</h3>
          <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
            <label style={S.label}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={S.input}>
              <option value="">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? <p style={{ color: '#666' }}>No health records found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Type', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Outcome', 'Date'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{history.map(r => (
                <tr key={r.healthRecordId}>
                  <td style={S.td}><span style={{ fontSize: '11px', background: '#EAF2FB', padding: '2px 6px', borderRadius: '4px' }}>{r.recordType}</span></td>
                  <td style={S.td}>{r.symptoms}</td>
                  <td style={S.td}>{r.diagnosis}</td>
                  <td style={S.td}>{r.medicationUsed}</td>
                  <td style={S.td}>{r.vetName}</td>
                  <td style={S.td}>{r.outcome}</td>
                  <td style={S.td}>{new Date(r.treatmentDate).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          ))}
        </div>
      )}

      {tab === 'outbreak' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Outbreak Detection</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>
            Enter a symptom keyword. An alert fires if 3 or more animals show the same symptom within 48 hours.
          </p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '16px' }}>
            <input value={symptomCheck} onChange={e => setSymptomCheck(e.target.value)} placeholder="e.g. FMD, respiratory, diarrhoea" style={{ ...S.input, flex: 1 }} />
            <button onClick={handleOutbreakCheck} style={S.btn('#C0392B')}>Check</button>
          </div>
          {outbreakResult && (
            <div style={{ padding: '16px', borderRadius: '8px', background: outbreakResult.outbreakDetected ? '#FDEDEC' : '#EAFAF1', border: `1px solid ${outbreakResult.outbreakDetected ? '#E74C3C' : '#1E8449'}` }}>
              <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: outbreakResult.outbreakDetected ? '#C0392B' : '#1E8449' }}>
                {outbreakResult.outbreakDetected ? '🚨 OUTBREAK DETECTED' : '✅ No Outbreak'}
              </p>
              <p style={{ margin: 0, fontSize: '14px' }}>{outbreakResult.alertMessage}</p>
              {outbreakResult.affectedEarTags?.length > 0 && (
                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#555' }}>
                  Affected animals: {outbreakResult.affectedEarTags.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
