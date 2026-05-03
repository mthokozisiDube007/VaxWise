import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { recordTreatment, getHealthRecords, getCurrentHealth, checkOutbreak } from '../api/healthApi';
import { getAllAnimals } from '../api/animalsApi';
import { downloadDalrrdReport } from '../api/reportsApi';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  inp: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #2D4A34', fontSize: '14px', boxSizing: 'border-box', background: '#162219', color: '#F0EDE8', fontFamily: "'DM Sans', sans-serif", outline: 'none' },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' },
  tab: (a) => ({ padding: '8px 20px', border: 'none', borderRadius: '8px', background: a ? '#22C55E' : 'transparent', cursor: 'pointer', fontWeight: a ? '700' : '400', color: a ? '#0B1F14' : '#8C8677', fontSize: '13px', fontFamily: "'DM Sans', sans-serif', transition: 'all 0.15s'" }),
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
  btn: (c) => ({ background: c, color: c === '#22C55E' ? '#0B1F14' : 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }),
};

const EMPTY_FORM = {
  animalId: '', recordType: 'Treatment', symptoms: '', diagnosis: '',
  medicationUsed: '', dosage: '', vetName: '', outcome: '',
  treatmentDate: new Date().toISOString().split('T')[0], withdrawalDays: 0,
};

export default function HealthPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('current');
  const [form, setForm] = useState(EMPTY_FORM);
  const [historyAnimalId, setHistoryAnimalId] = useState('');
  const [symptomCheck, setSymptomCheck] = useState('');
  const [outbreakResult, setOutbreakResult] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const { data: current = [] } = useQuery({ queryKey: ['health-current'], queryFn: getCurrentHealth });
  const { data: history = [] } = useQuery({
    queryKey: ['health-history', historyAnimalId],
    queryFn: () => getHealthRecords(historyAnimalId),
    enabled: !!historyAnimalId,
  });

  const recordMut = useMutation({
    mutationFn: recordTreatment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['health-current'] }); setForm(EMPTY_FORM); },
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleOutbreakCheck = async () => {
    if (!symptomCheck.trim()) return;
    const r = await checkOutbreak(symptomCheck);
    setOutbreakResult(r);
    setReportError('');
  };

  const handleDownloadReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      await downloadDalrrdReport();
    } catch {
      setReportError('Could not generate report. Ensure a notifiable outbreak is active on this farm.');
    } finally {
      setReportLoading(false);
    }
  };

  const tabs = [
    { key: 'current', label: 'Under Treatment' },
    ...(hasRole('Vet') ? [{ key: 'record', label: '+ Record Treatment' }] : []),
    { key: 'history', label: 'History' },
    { key: 'outbreak', label: '🚨 Outbreak Check' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Health Management</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>Treatment records, health history, and outbreak detection</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', background: '#162219', padding: '4px', borderRadius: '10px', width: 'fit-content', marginBottom: '24px', border: '1px solid #1F3326' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* Under Treatment */}
      {tab === 'current' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8' }}>Animals Under Treatment</h3>
            <span style={{ background: current.length > 0 ? '#450A0A' : '#052E16', color: current.length > 0 ? '#EF4444' : '#22C55E', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
              {current.length} active
            </span>
          </div>
          {current.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#4A4A42' }}>
              <p style={{ fontSize: '24px', marginBottom: '8px', color: '#22C55E' }}>♥</p>
              <p style={{ fontSize: '14px' }}>No animals under treatment</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Animal', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Date', 'Withdrawal'].map(h => (
                    <th key={h} style={{ ...S.th, background: '#1A0A0A', color: '#EF4444' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{current.map((r, i) => (
                  <tr key={r.healthRecordId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#22C55E' }}>{r.animalEarTag}</td>
                    <td style={S.td}>{r.symptoms}</td>
                    <td style={S.td}>{r.diagnosis}</td>
                    <td style={S.td}>{r.medicationUsed} {r.dosage && <span style={{ color: '#8C8677', fontSize: '12px' }}>({r.dosage})</span>}</td>
                    <td style={S.td}>{r.vetName}</td>
                    <td style={S.td}>{new Date(r.treatmentDate).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>
                      {r.isWithdrawalActive ? (
                        <span style={{ background: '#2A1500', color: '#F59E0B', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                          {r.daysUntilClear}d — clears {new Date(r.withdrawalClearDate).toLocaleDateString('en-ZA')}
                        </span>
                      ) : r.withdrawalDays > 0 ? (
                        <span style={{ background: '#052E16', color: '#22C55E', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>Cleared</span>
                      ) : (
                        <span style={{ color: '#4A4A42', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Treatment */}
      {tab === 'record' && hasRole('Vet') && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '20px' }}>Record Treatment</h3>
          <form onSubmit={e => { e.preventDefault(); recordMut.mutate({ ...form, animalId: parseInt(form.animalId), withdrawalDays: parseInt(form.withdrawalDays) || 0 }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={S.lbl}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required style={{ ...S.inp }}>
                  <option value="" style={{ background: '#162219' }}>— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId} style={{ background: '#162219' }}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Record Type</label>
                <select value={form.recordType} onChange={e => set('recordType', e.target.value)} style={{ ...S.inp }}>
                  <option style={{ background: '#162219' }}>Treatment</option>
                  <option style={{ background: '#162219' }}>VetVisit</option>
                  <option style={{ background: '#162219' }}>Observation</option>
                </select>
              </div>
              <div>
                <label style={S.lbl}>Treatment Date</label>
                <input type="date" value={form.treatmentDate} onChange={e => set('treatmentDate', e.target.value)} required style={{ ...S.inp, colorScheme: 'dark' }} />
              </div>
              {[['Symptoms', 'symptoms'], ['Diagnosis', 'diagnosis'], ['Medication Used', 'medicationUsed'], ['Dosage', 'dosage'], ['Vet Name', 'vetName'], ['Outcome', 'outcome']].map(([label, key]) => (
                <div key={key}><label style={S.lbl}>{label}</label><input value={form[key]} onChange={e => set(key, e.target.value)} style={S.inp} /></div>
              ))}
              <div>
                <label style={S.lbl}>
                  Withdrawal Period (days){' '}
                  <span style={{ fontWeight: '400', color: '#4A4A42', textTransform: 'none', letterSpacing: 0 }}>— 0 if none</span>
                </label>
                <input type="number" min="0" max="365" value={form.withdrawalDays} onChange={e => set('withdrawalDays', e.target.value)} style={S.inp} />
              </div>
            </div>
            {recordMut.isError && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Failed to record. Check animal selection.</p>}
            <button type="submit" disabled={recordMut.isPending} style={S.btn('#EF4444')}>
              {recordMut.isPending ? 'Recording…' : 'Record Treatment'}
            </button>
          </form>
        </div>
      )}

      {/* Health History */}
      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '20px' }}>Health History</h3>
          <div style={{ marginBottom: '20px', maxWidth: '320px' }}>
            <label style={S.lbl}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={{ ...S.inp }}>
              <option value="" style={{ background: '#162219' }}>— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId} style={{ background: '#162219' }}>{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? <p style={{ color: '#8C8677' }}>No health records found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Type', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Outcome', 'Date', 'Withdrawal Clear'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{history.map((r, i) => (
                  <tr key={r.healthRecordId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={S.td}><span style={{ background: '#162219', color: '#8C8677', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', border: '1px solid #2D4A34' }}>{r.recordType}</span></td>
                    <td style={S.td}>{r.symptoms}</td>
                    <td style={S.td}>{r.diagnosis}</td>
                    <td style={S.td}>{r.medicationUsed}</td>
                    <td style={S.td}>{r.vetName}</td>
                    <td style={S.td}>{r.outcome}</td>
                    <td style={S.td}>{new Date(r.treatmentDate).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>
                      {r.withdrawalDays > 0 ? (
                        <span style={{ fontSize: '12px', color: r.isWithdrawalActive ? '#F59E0B' : '#22C55E' }}>
                          {new Date(r.withdrawalClearDate).toLocaleDateString('en-ZA')}
                          {r.isWithdrawalActive && <span style={{ color: '#F59E0B' }}> ({r.daysUntilClear}d)</span>}
                        </span>
                      ) : <span style={{ color: '#4A4A42', fontSize: '12px' }}>—</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Outbreak Detection */}
      {tab === 'outbreak' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '8px' }}>Outbreak Detection</h3>
          <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '24px' }}>Alert fires when 3+ animals show the same symptom within 48 hours.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '20px' }}>
            <input value={symptomCheck} onChange={e => setSymptomCheck(e.target.value)} placeholder="e.g. FMD, respiratory, diarrhoea" style={{ ...S.inp, flex: 1 }} />
            <button onClick={handleOutbreakCheck} style={S.btn('#EF4444')}>Check</button>
          </div>
          {outbreakResult && (
            <div style={{ borderRadius: '10px', border: `1px solid ${outbreakResult.outbreakDetected ? '#7F1D1D' : '#166534'}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', background: outbreakResult.outbreakDetected ? '#1A0A0A' : '#052E16' }}>
                <p style={{ fontWeight: '700', color: outbreakResult.outbreakDetected ? '#EF4444' : '#22C55E', marginBottom: '6px', fontSize: '16px' }}>
                  {outbreakResult.outbreakDetected ? '🚨 OUTBREAK DETECTED' : '✓ No Outbreak Detected'}
                </p>
                <p style={{ fontSize: '14px', color: '#F0EDE8', opacity: 0.85 }}>{outbreakResult.alertMessage}</p>
                {outbreakResult.affectedEarTags?.length > 0 && (
                  <p style={{ marginTop: '10px', fontSize: '13px', color: '#8C8677' }}>
                    Affected: <strong style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F0EDE8' }}>{outbreakResult.affectedEarTags.join(', ')}</strong>
                  </p>
                )}
              </div>
              {outbreakResult.isNotifiable && (
                <div style={{ padding: '14px 20px', background: '#1A0A0A', borderTop: '1px solid #7F1D1D' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: '#EF4444', marginBottom: '4px' }}>
                    DALRRD Notifiable: {outbreakResult.notifiableDiseaseName}
                  </p>
                  <p style={{ fontSize: '13px', color: '#F0EDE8', opacity: 0.85, marginBottom: '12px' }}>
                    Reporting deadline:{' '}
                    <strong>{outbreakResult.dalrrdReportDeadline ? new Date(outbreakResult.dalrrdReportDeadline).toLocaleString('en-ZA') : 'N/A'}</strong>
                  </p>
                  {reportError && <p style={{ fontSize: '12px', color: '#FCA5A5', marginBottom: '8px' }}>{reportError}</p>}
                  <button
                    onClick={handleDownloadReport}
                    disabled={reportLoading}
                    style={{ background: '#EF4444', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: reportLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: reportLoading ? 0.7 : 1 }}
                  >
                    {reportLoading ? 'Generating PDF…' : '⬇ Download DALRRD Report'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
