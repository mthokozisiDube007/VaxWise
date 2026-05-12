import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllAnimals, createAnimal, updateAnimal, deleteAnimal, exportAnimalsCsv, exportAnimalsPdf, updateAnimalWeight } from '../api/animalsApi';
import { recordTreatment } from '../api/healthApi';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import { useFormErrors } from '../hooks/useFormErrors';
import FieldError from '../components/FieldError';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';
const th = 'px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50';
const td = 'px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50';

const STATUS = {
  Active:         { cls: 'bg-teal-500/10 text-teal-400 border-teal-500/25',   label: 'Active' },
  UnderTreatment: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25', label: 'Treatment' },
  Quarantined:    { cls: 'bg-red-500/10 text-red-400 border-red-500/25',      label: 'Quarantine' },
  Sold:           { cls: 'bg-slate-500/10 text-slate-400 border-slate-500/25', label: 'Sold' },
  Deceased:       { cls: 'bg-slate-700/30 text-slate-500 border-slate-600/25', label: 'Deceased' },
};

const SICK_FORM_INIT = { symptoms: '', severity: 'Mild', notes: '' };

const BREEDS = {
  1: ['Angus','Bonsmara','Brahman','Boran','Drakensberger','Friesland','Hereford','Holstein','Jersey','Limousin','Nguni','Simmental','South Devon','Sussex','Tuli'],
  2: ['Merino','Dohne Merino','Dorper','South African Mutton Merino','Damara','Persian','Romanov','Karakul','Suffolk','Van Rooy','Meatmaster'],
  3: ['Boer','Saanen','Alpine','Kalahari Red','Savanna','Toggenburg','Angora','Indigenous Veld Goat'],
  4: ['Large White','Landrace','South African Landrace','Duroc','Hampshire','Pietrain','Kolbroek','Windsnyer'],
  5: ['Boschveld','Potchefstroom Koekoek','Naked Neck','Ovambo','Venda','Australorp','Rhode Island Red','Leghorn','Plymouth Rock','New Hampshire'],
};

export default function AnimalsPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const isWorker = hasRole('FarmWorker');
  const isOwnerOrManager = hasRole('FarmOwner') || hasRole('FarmManager');
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [form, setForm] = useState({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ breed: '', currentWeightKg: 0, status: 'Active' });
  // Farm Worker — weight update
  const [weightEditId, setWeightEditId] = useState(null);
  const [weightValue, setWeightValue] = useState('');
  // Farm Worker — report sick modal
  const [sickAnimal, setSickAnimal] = useState(null);
  const [sickForm, setSickForm] = useState(SICK_FORM_INIT);
  const [sickSaving, setSickSaving] = useState(false);
  const [sickError, setSickError] = useState('');
  const isMobile = useMobile();
  const animalErr = useFormErrors();

  const { data: animals = [], isLoading } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });

  const createMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setShowForm(false);
      setForm({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0 });
      animalErr.clearAll();
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateAnimal,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animals'] }); setEditingId(null); },
  });

  const deleteMutation = useMutation({ mutationFn: deleteAnimal, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] }) });

  const weightMutation = useMutation({
    mutationFn: updateAnimalWeight,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['animals'] }); setWeightEditId(null); },
  });

  const handleReportSick = async () => {
    if (!sickForm.symptoms.trim()) { setSickError('Please describe the symptoms.'); return; }
    setSickSaving(true); setSickError('');
    try {
      await recordTreatment({
        animalId: sickAnimal.animalId,
        recordType: 'Sick Report',
        symptoms: sickForm.symptoms,
        diagnosis: 'Pending veterinary assessment',
        medicationUsed: '',
        dosage: '',
        vetName: 'Farm Worker Report',
        outcome: sickForm.notes || '',
        treatmentDate: new Date().toISOString(),
        withdrawalDays: 0,
      });
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setSickAnimal(null);
      setSickForm(SICK_FORM_INIT);
    } catch (e) {
      setSickError(e.response?.data?.message || 'Failed to submit report.');
    } finally { setSickSaving(false); }
  };

  if (isLoading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 bg-slate-800 rounded-lg w-48" />
      <div className="h-64 bg-slate-800 rounded-xl border border-slate-700" />
    </div>
  );

  return (
    <div className="text-slate-50">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-1">Animal Registry</h1>
          <p className="text-slate-400 text-sm">{animals.length} animal{animals.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div className="flex gap-2.5 items-center">
          <button
            onClick={async () => { setExporting(true); try { await exportAnimalsCsv(); } finally { setExporting(false); } }}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-60"
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          {(hasRole('Admin') || hasRole('FarmOwner')) && (
            <button
              onClick={async () => { setExportingPdf(true); setPdfError(''); try { await exportAnimalsPdf(); } catch { setPdfError('PDF export failed. Please try again.'); } finally { setExportingPdf(false); } }}
              disabled={exportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {exportingPdf ? 'Generating…' : 'Export PDF'}
            </button>
          )}
          {pdfError && <span className="text-red-400 text-xs">{pdfError}</span>}
          {(hasRole('FarmOwner') || hasRole('FarmManager')) && (
            <button
              onClick={() => { setShowForm(v => !v); animalErr.clearAll(); }}
              className={showForm
                ? 'inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors'
                : 'inline-flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors'}
            >
              {showForm ? 'Cancel' : '+ Register Animal'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5">
          <h3 className="text-xl font-semibold text-slate-50 mb-5">Register New Animal</h3>
          <form onSubmit={e => {
            e.preventDefault();
            const ok = animalErr.validate({
              earTagNumber: () => !form.earTagNumber.trim() ? 'Ear tag number is required' : '',
              rfidTag: () => !form.rfidTag.trim() ? 'RFID tag is required' : '',
              breed: () => !form.breed ? 'Please select a breed' : '',
              dateOfBirth: () => !form.dateOfBirth ? 'Date of birth is required' : '',
            });
            if (!ok) return;
            createMutation.mutate(form);
          }}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-5`}>
              {[
                { label: 'Ear Tag Number', key: 'earTagNumber', type: 'text' },
                { label: 'RFID Tag', key: 'rfidTag', type: 'text' },
                { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
                { label: 'Weight (kg)', key: 'currentWeightKg', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className={lbl}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={animalErr.field(key).onChange(e => setForm({ ...form, [key]: e.target.value }))}
                    className={inp}
                    style={animalErr.field(key).style({ colorScheme: type === 'date' ? 'dark' : undefined })}
                    onFocus={animalErr.field(key).onFocus}
                    onBlur={animalErr.field(key).onBlur}
                  />
                  <FieldError msg={animalErr.field(key).error} />
                </div>
              ))}
              <div>
                <label className={lbl}>Animal Type</label>
                <select
                  value={form.animalTypeId}
                  onChange={e => setForm({ ...form, animalTypeId: parseInt(e.target.value), breed: '' })}
                  className={inp}
                >
                  {[['Cattle',1],['Sheep',2],['Goat',3],['Pig',4],['Chicken',5]].map(([n,v]) => (
                    <option key={v} value={v} className="bg-slate-800">{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Breed</label>
                <select
                  value={form.breed}
                  onChange={animalErr.field('breed').onChange(e => setForm({ ...form, breed: e.target.value }))}
                  className={inp}
                  onFocus={animalErr.field('breed').onFocus}
                  onBlur={animalErr.field('breed').onBlur}
                >
                  <option value="" className="bg-slate-800">— Select breed —</option>
                  {(BREEDS[form.animalTypeId] || []).map(b => (
                    <option key={b} value={b} className="bg-slate-800">{b}</option>
                  ))}
                </select>
                <FieldError msg={animalErr.field('breed').error} />
              </div>
              <div>
                <label className={lbl}>Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  className={inp}
                >
                  <option value="M" className="bg-slate-800">Male</option>
                  <option value="F" className="bg-slate-800">Female</option>
                </select>
              </div>
            </div>
            {createMutation.isError && (
              <p className="text-red-400 text-sm mb-3">Failed to register animal. Please check all fields.</p>
            )}
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {createMutation.isPending ? 'Registering…' : 'Register Animal'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5">
        {animals.length === 0 ? (
          <div className="text-center py-12 text-slate-600">
            <p className="text-3xl mb-2.5 text-slate-400">◈</p>
            <p className="text-sm font-medium text-slate-400 mb-1.5">No animals registered yet</p>
            <p className="text-xs">Click "Register Animal" to add your first livestock record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Ear Tag', 'Type', 'Breed', 'Gender', 'Weight', 'Status', 'Compliance', 'Actions'].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{animals.map((animal, i) => {
                const st = STATUS[animal.status] || STATUS.Active;
                const score = animal.complianceScore ?? 0;
                const scoreColor = score >= 80 ? 'bg-teal-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';
                const scoreText = score >= 80 ? 'text-teal-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
                return (
                  <tr key={animal.animalId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                    <td className={`${td} font-bold text-teal-400 font-mono text-[13px]`}>
                      {isOwnerOrManager ? (
                        <button onClick={() => navigate(`/animals/${animal.animalId}`)}
                          className="bg-transparent border-none text-teal-400 cursor-pointer font-bold font-mono text-[13px] p-0 underline underline-offset-[3px]">
                          {animal.earTagNumber}
                        </button>
                      ) : animal.earTagNumber}
                    </td>
                    <td className={td}>{animal.animalTypeName}</td>
                    <td className={td}>
                      {editingId === animal.animalId
                        ? <input value={editForm.breed} onChange={e => setEditForm(f => ({ ...f, breed: e.target.value }))} className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-50 outline-none focus:border-teal-500 transition-colors" />
                        : animal.breed}
                    </td>
                    <td className={td}>{animal.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td className={`${td} font-mono text-[13px]`}>
                      {editingId === animal.animalId
                        ? <input type="number" value={editForm.currentWeightKg} onChange={e => setEditForm(f => ({ ...f, currentWeightKg: parseFloat(e.target.value) }))} className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-50 outline-none focus:border-teal-500 transition-colors" />
                        : `${animal.currentWeightKg} kg`}
                    </td>
                    <td className={td}>
                      {editingId === animal.animalId ? (
                        <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-50 outline-none focus:border-teal-500 transition-colors">
                          {Object.keys(STATUS).map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS[animal.status]?.cls ?? STATUS.Active.cls}`}>
                          ● {STATUS[animal.status]?.label ?? animal.status}
                        </span>
                      )}
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-700 rounded-full max-w-[72px] overflow-hidden">
                          <div className={`h-full ${scoreColor} rounded-full transition-[width] duration-700`} style={{ width: `${score}%` }} />
                        </div>
                        <span className={`text-xs font-mono font-semibold ${scoreText}`}>{score}%</span>
                      </div>
                    </td>
                    <td className={td}>
                      {/* Owner/Manager: full edit */}
                      {isOwnerOrManager && (
                        editingId === animal.animalId ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => updateMutation.mutate({ id: animal.animalId, ...editForm })} disabled={updateMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">Save</button>
                            <button onClick={() => setEditingId(null)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditingId(animal.animalId); setEditForm({ breed: animal.breed, currentWeightKg: animal.currentWeightKg, status: animal.status }); }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Edit</button>
                            {hasRole('Admin') && (
                              <button onClick={() => deleteMutation.mutate(animal.animalId)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors">Delete</button>
                            )}
                          </div>
                        )
                      )}

                      {/* Farm Worker: weight update + report sick */}
                      {isWorker && (
                        weightEditId === animal.animalId ? (
                          <div className="flex gap-1.5 items-center">
                            <input type="number" value={weightValue} onChange={e => setWeightValue(e.target.value)}
                              className="w-[72px] px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-slate-50 outline-none focus:border-teal-500 transition-colors" />
                            <button onClick={() => weightMutation.mutate({ id: animal.animalId, weightKg: parseFloat(weightValue) })} disabled={weightMutation.isPending}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">Save</button>
                            <button onClick={() => setWeightEditId(null)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">✕</button>
                          </div>
                        ) : (
                          <div className="flex gap-1.5">
                            <button onClick={() => { setWeightEditId(animal.animalId); setWeightValue(String(animal.currentWeightKg)); }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">⚖ Weight</button>
                            <button onClick={() => { setSickAnimal(animal); setSickForm(SICK_FORM_INIT); setSickError(''); }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors">🚨 Sick</button>
                          </div>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
      {/* Report Sick Modal */}
      {sickAnimal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-5">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-[480px]">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xl font-semibold text-red-400 mb-0.5">Report Sick Animal</h3>
                <p className="text-sm text-slate-400">{sickAnimal.earTagNumber} · {sickAnimal.animalTypeName}</p>
              </div>
              <button onClick={() => setSickAnimal(null)} className="bg-transparent border-none text-slate-400 text-xl cursor-pointer hover:text-slate-200 transition-colors">✕</button>
            </div>

            <label className={lbl}>Symptoms *</label>
            <textarea
              value={sickForm.symptoms}
              onChange={e => setSickForm(f => ({ ...f, symptoms: e.target.value }))}
              placeholder="Describe what you observed (e.g. limping, not eating, discharge)…"
              rows={4}
              className={`${inp} resize-y mb-4`}
            />

            <label className={lbl}>Severity</label>
            <div className="flex gap-2 mb-4">
              {['Mild', 'Moderate', 'Severe', 'Critical'].map(sv => (
                <button key={sv} onClick={() => setSickForm(f => ({ ...f, severity: sv }))}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                    sickForm.severity === sv
                      ? (sv === 'Critical' || sv === 'Severe')
                        ? 'border-red-400 bg-red-500/10 text-slate-50'
                        : sv === 'Moderate'
                          ? 'border-amber-400 bg-amber-500/10 text-slate-50'
                          : 'border-teal-400 bg-teal-500/10 text-slate-50'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >{sv}</button>
              ))}
            </div>

            <label className={lbl}>Additional Notes</label>
            <textarea
              value={sickForm.notes}
              onChange={e => setSickForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any other observations…"
              rows={2}
              className={`${inp} resize-y mb-5`}
            />

            {sickError && <p className="text-red-400 text-sm mb-3">{sickError}</p>}

            <div className="flex gap-2.5">
              <button onClick={() => setSickAnimal(null)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Cancel</button>
              <button onClick={handleReportSick} disabled={sickSaving}
                className="flex-[2] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                {sickSaving ? 'Submitting…' : '🚨 Submit Health Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
