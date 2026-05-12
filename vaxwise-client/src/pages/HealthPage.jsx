import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import { recordTreatment, getHealthRecords, getCurrentHealth, checkOutbreak } from '../api/healthApi';
import { getAllAnimals } from '../api/animalsApi';
import { downloadDalrrdReport } from '../api/reportsApi';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';
const th = 'px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50';
const td = 'px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

const EMPTY_FORM = {
  animalId: '', recordType: 'Treatment', symptoms: '', diagnosis: '',
  medicationUsed: '', dosage: '', vetName: '', outcome: '',
  treatmentDate: new Date().toISOString().split('T')[0], withdrawalDays: 0,
};

export default function HealthPage() {
  const { hasRole } = useAuth();
  const isMobile = useMobile();
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
    <div className="text-slate-50">
      <div className="mb-7">
        <h1 className="text-3xl font-bold text-slate-50 mb-1">Health Management</h1>
        <p className="text-slate-400 text-sm">Treatment records, health history, and outbreak detection</p>
      </div>

      <div className="overflow-x-auto mb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-xl w-fit min-w-max border border-slate-700">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={tab === t.key
                ? 'px-5 py-2 rounded-lg bg-teal-500 text-slate-900 font-bold text-sm transition-all'
                : 'px-5 py-2 rounded-lg bg-transparent text-slate-400 font-normal text-sm transition-all hover:text-slate-200'}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Under Treatment */}
      {tab === 'current' && (
        <div className={card}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xl font-semibold text-slate-50">Animals Under Treatment</h3>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${current.length > 0 ? 'bg-red-950 text-red-400' : 'bg-teal-950 text-teal-400'}`}>
              {current.length} active
            </span>
          </div>
          {current.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-2 text-teal-400">♥</p>
              <p className="text-sm text-slate-600">No animals under treatment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Animal', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Date', 'Withdrawal'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-red-400 uppercase tracking-wide bg-red-950/30">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {current.map((r, i) => (
                    <tr key={r.healthRecordId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                      <td className={`${td} font-bold text-teal-400`}>{r.animalEarTag}</td>
                      <td className={td}>{r.symptoms}</td>
                      <td className={td}>{r.diagnosis}</td>
                      <td className={td}>
                        {r.medicationUsed}{r.dosage && <span className="text-slate-400 text-xs"> ({r.dosage})</span>}
                      </td>
                      <td className={td}>{r.vetName}</td>
                      <td className={td}>{new Date(r.treatmentDate).toLocaleDateString('en-ZA')}</td>
                      <td className={td}>
                        {r.isWithdrawalActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/25 whitespace-nowrap">
                            {r.daysUntilClear}d — clears {new Date(r.withdrawalClearDate).toLocaleDateString('en-ZA')}
                          </span>
                        ) : r.withdrawalDays > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-teal-500/10 text-teal-400 border-teal-500/25">Cleared</span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Record Treatment */}
      {tab === 'record' && hasRole('Vet') && (
        <div className={card}>
          <h3 className="text-xl font-semibold text-slate-50 mb-5">Record Treatment</h3>
          <form onSubmit={e => { e.preventDefault(); recordMut.mutate({ ...form, animalId: parseInt(form.animalId), withdrawalDays: parseInt(form.withdrawalDays) || 0 }); }}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-6`}>
              <div>
                <label className={lbl}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required className={inp}>
                  <option value="" className="bg-slate-800">— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId} className="bg-slate-800">{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Record Type</label>
                <select value={form.recordType} onChange={e => set('recordType', e.target.value)} className={inp}>
                  <option className="bg-slate-800">Treatment</option>
                  <option className="bg-slate-800">VetVisit</option>
                  <option className="bg-slate-800">Observation</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Treatment Date</label>
                <input type="date" value={form.treatmentDate} onChange={e => set('treatmentDate', e.target.value)} required className={`${inp} [color-scheme:dark]`} />
              </div>
              {[['Symptoms', 'symptoms'], ['Diagnosis', 'diagnosis'], ['Medication Used', 'medicationUsed'], ['Dosage', 'dosage'], ['Vet Name', 'vetName'], ['Outcome', 'outcome']].map(([label, key]) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)} className={inp} />
                </div>
              ))}
              <div>
                <label className={lbl}>
                  Withdrawal Period (days){' '}
                  <span className="font-normal text-slate-600 normal-case tracking-normal">— 0 if none</span>
                </label>
                <input type="number" min="0" max="365" value={form.withdrawalDays} onChange={e => set('withdrawalDays', e.target.value)} className={inp} />
              </div>
            </div>
            {recordMut.isError && <p className="text-red-400 text-sm mb-3">Failed to record. Check animal selection.</p>}
            <button
              type="submit"
              disabled={recordMut.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {recordMut.isPending ? 'Recording…' : 'Record Treatment'}
            </button>
          </form>
        </div>
      )}

      {/* Health History */}
      {tab === 'history' && (
        <div className={card}>
          <h3 className="text-xl font-semibold text-slate-50 mb-5">Health History</h3>
          <div className="mb-5 max-w-xs">
            <label className={lbl}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} className={inp}>
              <option value="" className="bg-slate-800">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId} className="bg-slate-800">{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? (
            <p className="text-slate-400">No health records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Type', 'Symptoms', 'Diagnosis', 'Medication', 'Vet', 'Outcome', 'Date', 'Withdrawal Clear'].map(h => (
                      <th key={h} className={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((r, i) => (
                    <tr key={r.healthRecordId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                      <td className={td}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-500/10 text-slate-400 border-slate-500/25">
                          {r.recordType}
                        </span>
                      </td>
                      <td className={td}>{r.symptoms}</td>
                      <td className={td}>{r.diagnosis}</td>
                      <td className={td}>{r.medicationUsed}</td>
                      <td className={td}>{r.vetName}</td>
                      <td className={td}>{r.outcome}</td>
                      <td className={td}>{new Date(r.treatmentDate).toLocaleDateString('en-ZA')}</td>
                      <td className={td}>
                        {r.withdrawalDays > 0 ? (
                          <span className={`text-xs ${r.isWithdrawalActive ? 'text-amber-400' : 'text-teal-400'}`}>
                            {new Date(r.withdrawalClearDate).toLocaleDateString('en-ZA')}
                            {r.isWithdrawalActive && <span className="text-amber-400"> ({r.daysUntilClear}d)</span>}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Outbreak Detection */}
      {tab === 'outbreak' && (
        <div className={card}>
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Outbreak Detection</h3>
          <p className="text-slate-400 text-sm mb-6">Alert fires when 3+ animals show the same symptom within 48 hours.</p>
          <div className={`flex gap-3 mb-5 ${isMobile ? 'w-full' : 'max-w-lg'}`}>
            <input
              value={symptomCheck}
              onChange={e => setSymptomCheck(e.target.value)}
              placeholder="e.g. FMD, respiratory, diarrhoea"
              className={`${inp} flex-1`}
            />
            <button
              onClick={handleOutbreakCheck}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Check
            </button>
          </div>
          {outbreakResult && (
            <div className={`rounded-xl border overflow-hidden ${outbreakResult.outbreakDetected ? 'border-red-900' : 'border-teal-900'}`}>
              <div className={`px-5 py-4 ${outbreakResult.outbreakDetected ? 'bg-red-950/50' : 'bg-teal-950/50'}`}>
                <p className={`font-bold mb-1.5 text-base ${outbreakResult.outbreakDetected ? 'text-red-400' : 'text-teal-400'}`}>
                  {outbreakResult.outbreakDetected ? '🚨 OUTBREAK DETECTED' : '✓ No Outbreak Detected'}
                </p>
                <p className="text-sm text-slate-50 opacity-85">{outbreakResult.alertMessage}</p>
                {outbreakResult.affectedEarTags?.length > 0 && (
                  <p className="mt-2.5 text-sm text-slate-400">
                    Affected: <strong className="font-mono text-slate-50">{outbreakResult.affectedEarTags.join(', ')}</strong>
                  </p>
                )}
              </div>
              {outbreakResult.isNotifiable && (
                <div className="px-5 py-3.5 bg-red-950/50 border-t border-red-900">
                  <p className="font-bold text-sm text-red-400 mb-1">
                    DALRRD Notifiable: {outbreakResult.notifiableDiseaseName}
                  </p>
                  <p className="text-sm text-slate-50 opacity-85 mb-3">
                    Reporting deadline:{' '}
                    <strong>{outbreakResult.dalrrdReportDeadline ? new Date(outbreakResult.dalrrdReportDeadline).toLocaleString('en-ZA') : 'N/A'}</strong>
                  </p>
                  {reportError && <p className="text-xs text-red-300 mb-2">{reportError}</p>}
                  <button
                    onClick={handleDownloadReport}
                    disabled={reportLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
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
