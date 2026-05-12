import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import { useFormErrors } from '../hooks/useFormErrors';
import FieldError from '../components/FieldError';
import {
  captureVaccination, getVaccinationsByAnimal, getUpcomingVaccinations,
  getVaccineSchedules, batchCaptureVaccination, getHerdImmunity, exportVaccinationsCsv
} from '../api/vaccinationsApi';
import { createVaccinationSchedule, getVaccinationSchedules, updateScheduleStatus } from '../api/vaccinationSchedulesApi';
import { getAllAnimals } from '../api/animalsApi';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';
const th = 'px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50';
const td = 'px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

const SA_VACCINES = [
  'FMD Type SAT1','FMD Type SAT2','FMD Type SAT3','FMD Type A','FMD Type O',
  'Brucellosis (S19)','Brucellosis (RB51)','Brucellosis (Rev 1)',
  'Lumpy Skin Disease','Rift Valley Fever','Anthrax','Black Quarter','Botulism',
  'Pasteurellosis','Heartwater','Three-Day Stiff Sickness','BVD','IBR',
  'Pulpy Kidney (Enterotoxaemia)','Bluetongue','Tetanus','Wesselsbron Disease',
  'Caseous Lymphadenitis (CL)',
  'African Swine Fever','Classical Swine Fever','PRRS','Parvovirus','Erysipelas',
  'Newcastle Disease','Infectious Bursal Disease (Gumboro)','Marek\'s Disease',
  'Infectious Bronchitis','Fowl Pox','Avian Influenza',
];

const countdownCls = (days) => {
  if (days < 0) return 'text-red-400 font-semibold';
  if (days <= 7) return 'text-amber-400 font-semibold';
  return 'text-teal-400';
};

const coverageColor = (rate) => rate >= 80 ? 'text-teal-400' : rate >= 60 ? 'text-amber-400' : 'text-red-400';

const EMPTY_SCHEDULE = { vaccineType: '', animalTypeFilter: '', dueDate: '', notes: '' };
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-50 mb-1">Batch Vaccination</h2>
            <p className="text-sm text-slate-400">Vaccinate multiple animals with the same vaccine in one operation</p>
          </div>
          <button onClick={onClose} className="text-slate-400 text-xl cursor-pointer bg-transparent border-none p-1">✕</button>
        </div>

        {result ? (
          <div>
            <div className="bg-teal-950/50 border border-teal-500/30 rounded-lg p-5 mb-5">
              <p className="font-bold text-teal-400 mb-2 text-base">
                ✓ Batch complete — {result.successCount} vaccinated
              </p>
              {result.failureCount > 0 && (
                <div className="mt-3">
                  <p className="text-red-400 font-semibold mb-1.5">{result.failureCount} failed:</p>
                  {result.failures.map(f => (
                    <p key={f.animalId} className="text-sm text-amber-400 mb-0.5">Animal #{f.animalId}: {f.reason}</p>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors">Close</button>
          </div>
        ) : (
          <form onSubmit={e => {
            e.preventDefault();
            if (selectedIds.size === 0) return;
            batchMut.mutate({ ...form, animalIds: [...selectedIds], expiryDate: form.expiryDate, nextDueDate: form.nextDueDate || null });
          }}>
            {/* Vaccine details */}
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-3.5 mb-5`}>
              <div>
                <label className={lbl}>Filter by Animal Type</label>
                <select value={form.animalTypeFilter} onChange={e => { set('animalTypeFilter', e.target.value); setSelectedIds(new Set()); }} className={inp}>
                  <option value="" className="bg-slate-800">— All types —</option>
                  {animalTypes.map(t => <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Vaccine Name</label>
                <input list="batch-vaccine-list" value={form.vaccineName} onChange={e => set('vaccineName', e.target.value)} required placeholder="Type or select…" className={inp} />
                <datalist id="batch-vaccine-list">{schedules.map(s => <option key={s.vaccineScheduleId} value={s.vaccineName} />)}</datalist>
              </div>
              <div>
                <label className={lbl}>Batch Number</label>
                <input value={form.vaccineBatch} onChange={e => set('vaccineBatch', e.target.value)} required className={inp} />
              </div>
              <div>
                <label className={lbl}>Manufacturer</label>
                <input value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} required className={inp} />
              </div>
              <div>
                <label className={lbl}>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required className={inp} style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className={lbl}>GPS Coordinates</label>
                <input value={form.gpsCoordinates} onChange={e => set('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" required className={inp} />
              </div>
            </div>

            {/* Animal selection */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2.5">
                <label className={lbl}>Select Animals ({selectedIds.size} selected)</label>
                <button type="button" onClick={toggleAll} className="bg-transparent border border-slate-700 text-slate-400 rounded-md px-3 py-1 text-xs cursor-pointer">
                  {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="max-h-[200px] overflow-y-auto border border-slate-700 rounded-lg">
                {filtered.map((a, i) => (
                  <label key={a.animalId} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}`}>
                    <input type="checkbox" checked={selectedIds.has(a.animalId)} onChange={() => {
                      const next = new Set(selectedIds);
                      next.has(a.animalId) ? next.delete(a.animalId) : next.add(a.animalId);
                      setSelectedIds(next);
                    }} className="accent-teal-500 w-4 h-4" />
                    <span className="font-semibold text-teal-400">{a.earTagNumber}</span>
                    <span className="text-slate-400 text-sm">{a.breed} · {a.animalTypeName}</span>
                    <span className={`ml-auto text-xs ${a.complianceScore >= 75 ? 'text-teal-400' : 'text-amber-400'}`}>Score: {a.complianceScore}</span>
                  </label>
                ))}
              </div>
            </div>

            {batchMut.isError && <p className="text-red-400 text-sm mb-3">Batch failed. Check all fields.</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={batchMut.isPending || selectedIds.size === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                {batchMut.isPending ? 'Processing…' : `Vaccinate ${selectedIds.size} Animals`}
              </button>
              <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Cancel</button>
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
  const [tab, setTab] = useState('schedule');
  const [form, setForm] = useState(EMPTY_FORM);
  const [auditHash, setAuditHash] = useState('');
  const [historyAnimalId, setHistoryAnimalId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [showBatch, setShowBatch] = useState(false);
  const [exporting, setExporting] = useState(false);
  // Scheduling state
  const [schedForm, setSchedForm] = useState(EMPTY_SCHEDULE);
  const [selectedSchedIds, setSelectedSchedIds] = useState(new Set());
  const [schedSuccess, setSchedSuccess] = useState('');
  const schedErr = useFormErrors();

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
  const { data: vacSchedules = [] } = useQuery({
    queryKey: ['vac-schedules'],
    queryFn: getVaccinationSchedules,
    enabled: tab === 'schedule',
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

  const schedMut = useMutation({
    mutationFn: createVaccinationSchedule,
    onSuccess: (data) => {
      setSchedSuccess(data.message);
      setSchedForm(EMPTY_SCHEDULE);
      setSelectedSchedIds(new Set());
      schedErr.clearAll();
      qc.invalidateQueries({ queryKey: ['vac-schedules'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const cancelScheduleMut = useMutation({
    mutationFn: ({ id }) => updateScheduleStatus({ id, status: 'Cancelled' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vac-schedules'] }),
  });

  const schedFilteredAnimals = schedForm.animalTypeFilter
    ? animals.filter(a => a.animalTypeId === parseInt(schedForm.animalTypeFilter))
    : animals;

  const toggleSchedAll = () => {
    if (selectedSchedIds.size === schedFilteredAnimals.length) setSelectedSchedIds(new Set());
    else setSelectedSchedIds(new Set(schedFilteredAnimals.map(a => a.animalId)));
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportVaccinationsCsv(); } finally { setExporting(false); }
  };

  const tabs = [
    { key: 'schedule', label: 'Schedule' },
    { key: 'upcoming', label: 'Upcoming' },
    ...(hasRole('Vet') ? [{ key: 'capture', label: '+ Capture Event' }] : []),
    { key: 'history', label: 'History' },
    { key: 'herd', label: 'Herd Immunity' },
  ];

  return (
    <div className="text-slate-50">
      {showBatch && <BatchModal animals={animals} onClose={() => setShowBatch(false)} />}

      <div className="flex justify-between items-start mb-8 flex-wrap gap-3">
        <div>
          <h1 className={`font-bold text-slate-50 mb-1 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>Vaccinations</h1>
          <p className="text-slate-400 text-sm">DALRRD-compliant vaccination records with SHA-256 audit hashing</p>
        </div>
        <div className="flex gap-2.5">
          {hasRole('Vet') && (
            <button onClick={() => setShowBatch(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors">
              Batch Vaccinate
            </button>
          )}
          <button onClick={handleExport} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-60">
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto mb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg w-fit min-w-max">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 border-none rounded-lg cursor-pointer text-[13px] transition-colors ${tab === t.key ? 'bg-teal-500 font-bold text-slate-900' : 'bg-transparent font-normal text-slate-400 hover:text-slate-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule */}
      {tab === 'schedule' && (
        <div>
          {/* Countdown list */}
          {vacSchedules.length > 0 && (
            <div className={card}>
              <h3 className="text-xl font-bold text-slate-50 mb-1">Vaccination Schedule</h3>
              <p className="text-sm text-slate-400 mb-5">{vacSchedules.length} schedule{vacSchedules.length !== 1 ? 's' : ''} active</p>
              <div className="flex flex-col gap-2.5">
                {vacSchedules.map(vs => {
                  const cls = countdownCls(vs.daysUntilDue);
                  const countdownLabel = vs.daysUntilDue < 0
                    ? `Overdue by ${Math.abs(vs.daysUntilDue)}d`
                    : vs.daysUntilDue === 0
                    ? 'Due TODAY'
                    : `Due in ${vs.daysUntilDue}d`;
                  return (
                    <div key={vs.scheduleId} className={`flex items-center justify-between flex-wrap gap-2.5 bg-slate-800/60 rounded-lg px-4 py-3.5 border ${vs.status === 'Overdue' ? 'border-red-500/30' : 'border-slate-700'}`}>
                      <div className="flex items-center gap-3.5">
                        <div className="bg-slate-900/60 rounded-lg px-3 py-1.5 min-w-[90px] text-center">
                          <p className={`text-[11px] font-bold m-0 ${cls}`}>{countdownLabel}</p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-50 text-sm m-0 mb-0.5">{vs.vaccineType}</p>
                          <p className="text-xs text-slate-400 m-0">
                            <span className="font-mono text-teal-400">{vs.earTagNumber}</span>
                            {' · '}{vs.animalTypeName}
                            {' · '}{new Date(vs.scheduledDate).toLocaleDateString('en-ZA')}
                          </p>
                          {vs.notes && <p className="text-[11px] text-slate-600 mt-1 italic">{vs.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${vs.status === 'Overdue' ? 'bg-red-500/10 text-red-400 border-red-500/25' : vs.status === 'Scheduled' ? 'bg-teal-500/10 text-teal-400 border-teal-500/25' : 'bg-slate-700/50 text-slate-400 border-slate-700'}`}>
                          {vs.status}
                        </span>
                        {hasRole('FarmOwner') && (vs.status === 'Scheduled' || vs.status === 'Overdue') && (
                          <button onClick={() => cancelScheduleMut.mutate({ id: vs.scheduleId })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Schedule form — FarmOwner only */}
          {hasRole('FarmOwner') && (
            <div className={card}>
              <h3 className="text-xl font-bold text-slate-50 mb-1">Schedule Vaccination</h3>
              <p className="text-sm text-slate-400 mb-5">Schedule one vaccine for multiple animals at once</p>

              {schedSuccess && (
                <div className="bg-teal-950/50 border border-teal-500/30 rounded-lg px-4 py-3 mb-5">
                  <p className="text-teal-400 text-sm font-semibold m-0">✓ {schedSuccess}</p>
                </div>
              )}

              <form onSubmit={e => {
                e.preventDefault();
                const ok = schedErr.validate({
                  vaccineType: () => !schedForm.vaccineType ? 'Please select a vaccine type' : '',
                  dueDate: () => !schedForm.dueDate ? 'Due date is required' : '',
                  animals: () => selectedSchedIds.size === 0 ? 'Select at least one animal' : '',
                });
                if (!ok) return;
                setSchedSuccess('');
                schedMut.mutate({ vaccineType: schedForm.vaccineType, animalIds: [...selectedSchedIds], scheduledDate: schedForm.dueDate, notes: schedForm.notes || undefined });
              }}>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-5`}>
                  <div>
                    <label className={lbl}>Vaccine Type</label>
                    <select value={schedForm.vaccineType} onChange={schedErr.field('vaccineType').onChange(e => setSchedForm(f => ({ ...f, vaccineType: e.target.value })))} className={schedErr.field('vaccineType').style(inp)} onFocus={schedErr.field('vaccineType').onFocus} onBlur={schedErr.field('vaccineType').onBlur}>
                      <option value="" className="bg-slate-800">— Select vaccine —</option>
                      {SA_VACCINES.map(v => <option key={v} value={v} className="bg-slate-800">{v}</option>)}
                    </select>
                    <FieldError msg={schedErr.field('vaccineType').error} />
                  </div>
                  <div>
                    <label className={lbl}>Due Date</label>
                    <input type="date" value={schedForm.dueDate} onChange={schedErr.field('dueDate').onChange(e => setSchedForm(f => ({ ...f, dueDate: e.target.value })))} min={new Date(Date.now() + 86400000).toISOString().slice(0,10)} className={schedErr.field('dueDate').style(inp)} onFocus={schedErr.field('dueDate').onFocus} onBlur={schedErr.field('dueDate').onBlur} style={{ colorScheme: 'dark' }} />
                    <FieldError msg={schedErr.field('dueDate').error} />
                  </div>
                </div>

                <div className="mb-4">
                  <label className={lbl}>Filter by Animal Type (optional)</label>
                  <select value={schedForm.animalTypeFilter} onChange={e => { setSchedForm(f => ({ ...f, animalTypeFilter: e.target.value })); setSelectedSchedIds(new Set()); }} className={`${inp} max-w-[240px]`}>
                    <option value="" className="bg-slate-800">All types</option>
                    {[['Cattle',1],['Sheep',2],['Goat',3],['Pig',4],['Chicken',5]].map(([n,v]) => <option key={v} value={v} className="bg-slate-800">{n}</option>)}
                  </select>
                </div>

                <div className="mb-5">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className={`${lbl} ${schedErr.field('animals').error ? 'text-red-400' : ''}`}>Select Animals ({selectedSchedIds.size} selected)</label>
                    <button type="button" onClick={toggleSchedAll} className="bg-transparent border border-slate-700 text-slate-400 rounded-md px-3 py-1 text-xs cursor-pointer">
                      {selectedSchedIds.size === schedFilteredAnimals.length && schedFilteredAnimals.length > 0 ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className={`max-h-[220px] overflow-y-auto border rounded-lg ${schedErr.field('animals').error ? 'border-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.15)]' : 'border-slate-700'}`}>
                    {schedFilteredAnimals.length === 0 ? (
                      <p className="p-5 text-slate-600 text-center text-sm">No animals found.</p>
                    ) : schedFilteredAnimals.map((a, i) => (
                      <label key={a.animalId} className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer ${i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}`} onClick={() => schedErr.clearError('animals')}>
                        <input type="checkbox" checked={selectedSchedIds.has(a.animalId)} onChange={() => {
                          const next = new Set(selectedSchedIds);
                          next.has(a.animalId) ? next.delete(a.animalId) : next.add(a.animalId);
                          setSelectedSchedIds(next);
                        }} className="accent-teal-500 w-4 h-4" />
                        <span className="font-semibold text-teal-400 font-mono">{a.earTagNumber}</span>
                        <span className="text-slate-400 text-sm">{a.breed} · {a.animalTypeName}</span>
                        <span className={`ml-auto text-[11px] font-bold ${a.complianceScore >= 75 ? 'text-teal-400' : 'text-amber-400'}`}>{a.complianceScore}%</span>
                      </label>
                    ))}
                  </div>
                  <FieldError msg={schedErr.field('animals').error} />
                </div>

                <div className="mb-5">
                  <label className={lbl}>Notes (optional)</label>
                  <textarea value={schedForm.notes} onChange={e => setSchedForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inp} resize-y`} />
                </div>

                {schedMut.isError && <p className="text-red-400 text-sm mb-3">{schedMut.error?.response?.data?.message || 'Failed to schedule.'}</p>}
                <button type="submit" disabled={schedMut.isPending || selectedSchedIds.size === 0 || !schedForm.vaccineType}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                  {schedMut.isPending ? 'Scheduling…' : `Schedule for ${selectedSchedIds.size} Animal${selectedSchedIds.size !== 1 ? 's' : ''}`}
                </button>
              </form>
            </div>
          )}

          {vacSchedules.length === 0 && !hasRole('FarmOwner') && (
            <div className={`${card} text-center py-16 text-slate-600`}>
              <p className="text-2xl mb-2">◈</p>
              <p>No vaccinations scheduled yet. Ask your Farm Owner to schedule vaccinations.</p>
            </div>
          )}
        </div>
      )}

      {/* Upcoming */}
      {tab === 'upcoming' && (
        <div className={card}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-bold text-slate-50 mb-0.5">Due in Next 7 Days</h3>
              <p className="text-xs text-slate-400">Animals requiring vaccination within the next week</p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${upcoming.length > 0 ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' : 'bg-teal-500/10 text-teal-400 border-teal-500/25'}`}>
              {upcoming.length} due
            </span>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-10 text-slate-600">
              <p className="text-3xl mb-2 text-teal-400">✓</p>
              <p className="text-sm">No vaccinations due this week.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr>{['Animal', 'Vaccine', 'Batch', 'Due Date', 'GPS'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>{upcoming.map((v, i) => (
                  <tr key={v.eventId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                    <td className={`${td} font-bold text-teal-400`}>{v.animalEarTag}</td>
                    <td className={td}>{v.vaccineName}</td>
                    <td className={`${td} font-mono text-xs text-slate-400`}>{v.vaccineBatch}</td>
                    <td className={`${td} ${new Date(v.nextDueDate) <= new Date() ? 'text-red-400 font-semibold' : 'text-slate-300'}`}>
                      {new Date(v.nextDueDate).toLocaleDateString('en-ZA')}
                    </td>
                    <td className={`${td} font-mono text-xs text-slate-400`}>{v.gpsCoordinates}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Capture Event */}
      {tab === 'capture' && hasRole('Vet') && (
        <div className={card}>
          <h3 className="text-xl font-bold text-slate-50 mb-1">Capture Vaccination Event</h3>
          <p className="text-slate-400 text-sm mb-6">Each event is cryptographically hashed (SHA-256) and cannot be altered after capture.</p>

          {schedules.length > 0 && (
            <div className="bg-teal-950/50 border border-teal-500/30 rounded-lg px-3.5 py-2.5 mb-5 text-sm text-teal-300">
              {schedules.length} SA-registered vaccines available for this animal type — select a name below for auto-scheduling.
            </div>
          )}

          <form onSubmit={e => {
            e.preventDefault();
            captureMut.mutate({ ...form, animalId: parseInt(form.animalId), nextDueDate: form.nextDueDate || null });
          }}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-5`}>
              <div>
                <label className={lbl}>Animal</label>
                <select value={form.animalId} onChange={e => set('animalId', e.target.value)} required className={inp}>
                  <option value="" className="bg-slate-800">— Select animal —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId} className="bg-slate-800">{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Vaccine Name</label>
                <input list="vaccine-schedule-list" value={form.vaccineName} onChange={e => set('vaccineName', e.target.value)} required placeholder="Type or select from schedule…" className={inp} />
                <datalist id="vaccine-schedule-list">{schedules.map(s => <option key={s.vaccineScheduleId} value={s.vaccineName} />)}</datalist>
                {matchedSchedule && (
                  <p className="text-[11px] text-teal-400 mt-1">
                    ✓ In schedule — next due auto-calculated ({matchedSchedule.intervalDays}-day interval)
                    {matchedSchedule.isNotifiable && <span className="text-red-400 ml-1.5">· DALRRD notifiable</span>}
                  </p>
                )}
              </div>
              {[['Batch Number', 'vaccineBatch'], ['Manufacturer', 'manufacturer']].map(([label, key]) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  <input value={form[key]} onChange={e => set(key, e.target.value)} required className={inp} />
                </div>
              ))}
              <div>
                <label className={lbl}>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required className={inp} style={{ colorScheme: 'dark' }} />
              </div>
              <div>
                <label className={lbl}>Next Due Date <span className="font-normal text-slate-600 normal-case tracking-normal">{matchedSchedule ? '— auto-calculated' : '— optional'}</span></label>
                <input type="date" value={form.nextDueDate} onChange={e => set('nextDueDate', e.target.value)} disabled={!!matchedSchedule} className={inp} style={{ colorScheme: 'dark', opacity: matchedSchedule ? 0.4 : 1, cursor: matchedSchedule ? 'not-allowed' : 'auto' }} />
              </div>
              <div>
                <label className={lbl}>GPS Coordinates</label>
                <input value={form.gpsCoordinates} onChange={e => set('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" required className={inp} />
              </div>
            </div>
            {captureMut.isError && <p className="text-red-400 text-sm mb-3">Failed to capture. Check all fields.</p>}
            <button type="submit" disabled={captureMut.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
              {captureMut.isPending ? 'Capturing…' : '🔒 Capture & Generate Hash'}
            </button>
          </form>

          {auditHash && (
            <div className="mt-6 p-5 bg-teal-950/50 border border-teal-500/30 rounded-lg">
              <p className="font-bold text-teal-400 mb-1.5">✓ Vaccination captured — SHA-256 Audit Hash</p>
              <p className="text-xs text-slate-400 mb-2.5">This hash is cryptographic proof of the event and cannot be altered.</p>
              <code className="block text-xs break-all text-teal-300 font-mono bg-slate-800 px-3.5 py-2.5 rounded-lg border border-slate-700">{auditHash}</code>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className={card}>
          <h3 className="text-xl font-bold text-slate-50 mb-5">Vaccination History</h3>
          <div className="mb-5 max-w-xs">
            <label className={lbl}>Select Animal</label>
            <select value={historyAnimalId} onChange={e => setHistoryAnimalId(e.target.value)} className={inp}>
              <option value="" className="bg-slate-800">— Select animal —</option>
              {animals.map(a => <option key={a.animalId} value={a.animalId} className="bg-slate-800">{a.earTagNumber} ({a.breed})</option>)}
            </select>
          </div>
          {historyAnimalId && (history.length === 0 ? (
            <p className="text-slate-400 py-5">No vaccination records for this animal.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead><tr>{['Vaccine', 'Batch', 'Date', 'Next Due', 'Mode', 'Audit Hash'].map(h => <th key={h} className={th}>{h}</th>)}</tr></thead>
                <tbody>{history.map((v, i) => (
                  <tr key={v.eventId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                    <td className={td}>{v.vaccineName}</td>
                    <td className={`${td} font-mono text-xs text-slate-400`}>{v.vaccineBatch}</td>
                    <td className={td}>{new Date(v.eventTimestamp).toLocaleDateString('en-ZA')}</td>
                    <td className={td}>{new Date(v.nextDueDate).toLocaleDateString('en-ZA')}</td>
                    <td className={td}>
                      <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-700">{v.captureMode}</span>
                    </td>
                    <td className={td}>
                      <code className="text-[11px] text-slate-600 font-mono">{v.auditHash?.slice(0, 16)}…</code>
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
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-50 mb-1">Herd Immunity Coverage</h3>
            <p className="text-sm text-slate-400">Coverage vs DALRRD-aligned thresholds per notifiable disease. Green = protected, red = at risk.</p>
          </div>

          {herdLoading ? (
            <p className="text-slate-400 py-10">Calculating herd immunity…</p>
          ) : herdImmunity.length === 0 ? (
            <div className={`${card} text-center py-16`}>
              <p className="text-slate-600 text-sm">No vaccination data available. Capture vaccinations first.</p>
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
              <div key={typeName} className={card}>
                <h4 className="text-lg font-bold text-slate-50 mb-5">{typeName}</h4>
                <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {items.map(r => {
                    const colorCls = coverageColor(r.coveragePercent, r.thresholdPercent);
                    const barBg = r.coveragePercent >= 80 ? '#14b8a6' : r.coveragePercent >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={r.vaccineName} className={`bg-slate-800/60 rounded-lg px-5 py-4.5 border ${r.isProtected ? 'border-slate-700' : 'border-red-500/30'}`} style={{ padding: '18px 20px' }}>
                        <div className="flex justify-between items-start mb-2.5">
                          <div>
                            <p className="font-bold text-slate-50 text-sm mb-0.5">{r.vaccineName}</p>
                            <p className="text-[11px] text-slate-400">{r.diseaseName}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${r.isProtected ? 'bg-teal-500/10 text-teal-400 border-teal-500/25' : 'bg-red-500/10 text-red-400 border-red-500/25'}`}>
                            {r.isProtected ? 'Protected' : 'At Risk'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden relative">
                            <div style={{ height: '100%', width: `${r.coveragePercent}%`, background: barBg, borderRadius: '9999px', transition: 'width 0.8s ease' }} />
                            <div style={{ position: 'absolute', top: 0, left: `${r.thresholdPercent}%`, width: '2px', height: '100%', background: '#f59e0b', opacity: 0.8 }} title={`Threshold: ${r.thresholdPercent}%`} />
                          </div>
                          <span className={`text-sm font-bold ${colorCls} min-w-[48px] text-right`}>{r.coveragePercent}%</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>{r.protectedAnimals}/{r.totalAnimals} animals protected</span>
                          <span>Threshold: {r.thresholdPercent}%</span>
                        </div>
                        {!r.isProtected && (
                          <p className="text-[11px] text-amber-400 mt-2">
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
