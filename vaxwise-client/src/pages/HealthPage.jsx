import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { recordTreatment, getHealthRecords, getCurrentHealth, checkOutbreak } from '../api/healthApi';
import { getAllAnimals } from '../api/animalsApi';
import { downloadDalrrdReport } from '../api/reportsApi';

const S = {
  card: { background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(11,31,20,0.05), 0 4px 16px rgba(11,31,20,0.05)', marginBottom: '24px' },
  inp: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E0D9CE', fontSize: '14px', boxSizing: 'border-box', background: '#FDFCF8', color: '#1A1A18', fontFamily: "'DM Sans', sans-serif" },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tab: (a) => ({ padding: '8px 18px', border: 'none', borderRadius: '20px', background: a ? '#0B1F14' : 'transparent', cursor: 'pointer', fontWeight: a ? '600' : '400', color: a ? '#FFF' : '#8C8677', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }),
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#F8F5F0', borderBottom: '1px solid #EDE8DF' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #F0EBE2', color: '#1A1A18' },
  btn: (c) => ({ background: c, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }),
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
    onSuccess: () => { qc.invalidateQueries(['health-current']); setForm(EMPTY_FORM); },
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
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#0B1F14', marginBottom: '4px' }}>Health Management</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>Treatment records, health history, and outbreak detection</p>
      </div>

      <div style={{ display: 'flex', gap: '6px', background: 'white', padding: '5px', borderRadius: '12px', width: 'fit-content', marginBottom: '24px', boxShadow: '0 1px 4px rgba(11,31,20,0.06)' }}>
        {tabs.map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {/* Under Treatment */}
      {tab === 'current' && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14' }}>Animals Under Treatment</h3>
            <span style={{ background: current.length > 0 ? '#FEF2F2' : '#F0FDF4', color: current.length > 0 ? '#DC2626' : '#15803D', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
              {current.length} active
            </span>
          </div>
          {current.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: '#B0A898' }}>
              <p style={{ fontSize: '24px', marginBottom: '8px' }}>♥</p>
              <p style={{ fontSize: '14px' }}>No animals under treatment</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#FEF2F2' }}>
                  {['Animal', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Date', 'Withdrawal'].map(h => (
                    <th key={h} style={{ ...S.th, background: '#FEF2F2', color: '#B91C1C' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{current.map(r => (
                  <tr key={r.healthRecordId}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#0B1F14' }}>{r.animalEarTag}</td>
                    <td style={S.td}>{r.symptoms}</td>
                    <td style={S.td}>{r.diagnosis}</td>
                    <td style={S.td}>{r.medicationUsed} {r.dosage && <span style={{ color: '#8C8677', fontSize: '12px' }}>({r.dosage})</span>}</td>
                    <td style={S.td}>{r.vetName}</td>
                    <td style={S.td}>{new Date(r.treatmentDate).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>
                      {r.isWithdrawalActive ? (
                        <span style={{ background: '#FFFBEB', color: '#B45309', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {r.daysUntilClear}d left — clears {new Date(r.withdrawalClearDate).toLocaleDateString('en-ZA')}
                        </span>
                      ) : r.withdrawalDays > 0 ? (
                        <span style={{ background: '#F0FDF4', color: '#15803D', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>Cleared</span>
                      ) : (
                        <span style={{ color: '#B0A898', fontSize: '12px' }}>—</span>
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
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '20px' }}>Record Treatment</h3>
          <form onSubmit={e => { e.preventDefault(); recordMut.mutate({ ...form, animalId: parseInt(form.animalId), withdrawalDays: parseInt(form.withdrawalDays) || 0 }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={S.lbl}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required style={S.inp}>
                  <option value="">— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Record Type</label>
                <select value={form.recordType} onChange={e => set('recordType', e.target.value)} style={S.inp}>
                  <option>Treatment</option><option>VetVisit</option><option>Observation</option>
                </select>
              </div>
              <div>
                <label style={S.lbl}>Treatment Date</label>
                <input type="date" value={form.treatmentDate} onChange={e => set('treatmentDate', e.target.value)} required style={S.inp} />
              </div>
              {[['Symptoms', 'symptoms'], ['Diagnosis', 'diagnosis'], ['Medication Used', 'medicationUsed'], ['Dosage', 'dosage'], ['Vet Name', 'vetName'], ['Outcome', 'outcome']].map(([label, key]) => (
                <div key={key}><label style={S.lbl}>{label}</label><input value={form[key]} onChange={e => set(key, e.target.value)} style={S.inp} /></div>
              ))}
              <div>
                <label style={S.lbl}>
                  Withdrawal Period (days){' '}
                  <span style={{ fontWeight: '400', color: '#B0A898', textTransform: 'none', letterSpacing: 0 }}>— 0 if not applicable</span>
                </label>
                <input type="number" min="0" max="365" value={form.withdrawalDays} onChange={e => set('withdrawalDays', e.target.value)} style={S.inp} />
              </div>
            </div>
            {recordMut.isError && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>Failed to record. Check animal selection.</p>}
            <button type="submit" disabled={recordMut.isPending} style={S.btn('#B91C1C')}>
              {recordMut.isPending ? 'Recording…' : 'Record Treatment'}
            </button>
          </form>
        </div>
      )}

      {/* Health History */}
      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '20px' }}>Health History</h3>
          <div style={{ marginBottom: '20px', maxWidth: '320px' }}>
            <label style={S.lbl}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} style={S.inp}>
              <option value="">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? <p style={{ color: '#8C8677' }}>No health records found.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>
                  {['Type', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Outcome', 'Date', 'Withdrawal Clear'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{history.map(r => (
                  <tr key={r.healthRecordId}>
                    <td style={S.td}><span style={{ background: '#F0EBE1', color: '#6E6B60', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{r.recordType}</span></td>
                    <td style={S.td}>{r.symptoms}</td>
                    <td style={S.td}>{r.diagnosis}</td>
                    <td style={S.td}>{r.medicationUsed}</td>
                    <td style={S.td}>{r.vetName}</td>
                    <td style={S.td}>{r.outcome}</td>
                    <td style={S.td}>{new Date(r.treatmentDate).toLocaleDateString('en-ZA')}</td>
                    <td style={S.td}>
                      {r.withdrawalDays > 0 ? (
                        <span style={{ fontSize: '12px', color: r.isWithdrawalActive ? '#B45309' : '#15803D' }}>
                          {new Date(r.withdrawalClearDate).toLocaleDateString('en-ZA')}
                          {r.isWithdrawalActive && <span style={{ color: '#B45309' }}> ({r.daysUntilClear}d)</span>}
                        </span>
                      ) : <span style={{ color: '#B0A898', fontSize: '12px' }}>—</span>}
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
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '8px' }}>Outbreak Detection</h3>
          <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '24px' }}>Alert fires when 3+ animals show the same symptom within 48 hours.</p>
          <div style={{ display: 'flex', gap: '12px', maxWidth: '480px', marginBottom: '20px' }}>
            <input value={symptomCheck} onChange={e => setSymptomCheck(e.target.value)} placeholder="e.g. FMD, respiratory, diarrhoea" style={{ ...S.inp, flex: 1 }} />
            <button onClick={handleOutbreakCheck} style={S.btn('#B91C1C')}>Check</button>
          </div>
          {outbreakResult && (
            <div style={{ padding: '20px', borderRadius: '10px', background: outbreakResult.outbreakDetected ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${outbreakResult.outbreakDetected ? '#FECACA' : '#86EFAC'}` }}>
              <p style={{ fontWeight: '700', color: outbreakResult.outbreakDetected ? '#B91C1C' : '#15803D', marginBottom: '8px', fontSize: '16px' }}>
                {outbreakResult.outbreakDetected ? '🚨 OUTBREAK DETECTED' : '✓ No Outbreak Detected'}
              </p>
              <p style={{ fontSize: '14px', color: '#1A1A18' }}>{outbreakResult.alertMessage}</p>
              {outbreakResult.affectedEarTags?.length > 0 && (
                <p style={{ marginTop: '10px', fontSize: '13px', color: '#6E6B60' }}>
                  Affected: <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{outbreakResult.affectedEarTags.join(', ')}</strong>
                </p>
              )}
              {outbreakResult.isNotifiable && (
                <div style={{ marginTop: '14px', padding: '14px 16px', background: '#7F1D1D', borderRadius: '8px', color: 'white' }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                    DALRRD Notifiable: {outbreakResult.notifiableDiseaseName}
                  </p>
                  <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                    Reporting deadline:{' '}
                    <strong>
                      {outbreakResult.dalrrdReportDeadline
                        ? new Date(outbreakResult.dalrrdReportDeadline).toLocaleString('en-ZA')
                        : 'N/A'}
                    </strong>
                  </p>
                  {reportError && <p style={{ fontSize: '12px', color: '#FCA5A5', marginBottom: '8px' }}>{reportError}</p>}
                  <button
                    onClick={handleDownloadReport}
                    disabled={reportLoading}
                    style={{ background: 'white', color: '#7F1D1D', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: reportLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: reportLoading ? 0.7 : 1 }}
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
