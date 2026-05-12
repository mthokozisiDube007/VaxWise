import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms, createFarm, updateFarm, getFarmWorkers, inviteWorker, updateWorker, removeWorker } from '../api/farmsApi';
import { useMobile } from '../hooks/useMobile';
import { useFormErrors } from '../hooks/useFormErrors';
import FieldError from '../components/FieldError';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

const EMPTY_FARM = { farmName: '', farmType: 'Livestock', province: 'Gauteng', streetName: '', cityTown: '', glnNumber: '' };
const EMPTY_INVITE = { email: '', role: 'Worker', customTitle: '' };
const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];

export default function FarmsPage() {
  const { activeFarmId, selectFarm } = useAuth();
  const qc = useQueryClient();
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const [farmForm, setFarmForm] = useState(EMPTY_FARM);
  const [editingFarm, setEditingFarm] = useState(null);
  const [editFarmForm, setEditFarmForm] = useState(EMPTY_FARM);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [inviteLink, setInviteLink] = useState('');
  const [editingWorker, setEditingWorker] = useState(null);
  const [editWorkerForm, setEditWorkerForm] = useState({ role: '', customTitle: '' });

  const isMobile = useMobile();
  const farmErr = useFormErrors();
  const inviteErr = useFormErrors();
  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: getFarms });
  const { data: workers = [] } = useQuery({ queryKey: ['workers', selectedFarmId], queryFn: () => getFarmWorkers(selectedFarmId), enabled: !!selectedFarmId });

  const createMut = useMutation({
    mutationFn: createFarm,
    onSuccess: (farm) => {
      qc.invalidateQueries({ queryKey: ['farms'] });
      selectFarm(farm.farmId);
      setShowCreateFarm(false);
      setFarmForm(EMPTY_FARM);
      farmErr.clearAll();
    },
  });
  const updateFarmMut = useMutation({
    mutationFn: updateFarm,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['farms'] }); setEditingFarm(null); },
  });
  const inviteMut = useMutation({ mutationFn: inviteWorker, onSuccess: (data) => { setInviteLink(data.invitationLink || ''); setInviteForm(EMPTY_INVITE); inviteErr.clearAll(); qc.invalidateQueries({ queryKey: ['workers', selectedFarmId] }); } });
  const updateWorkerMut = useMutation({
    mutationFn: updateWorker,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workers', selectedFarmId] }); setEditingWorker(null); },
  });
  const removeMut = useMutation({ mutationFn: removeWorker, onSuccess: () => qc.invalidateQueries({ queryKey: ['workers', selectedFarmId] }) });

  const setF = (k, v) => setFarmForm(f => ({ ...f, [k]: v }));
  const setI = (k, v) => setInviteForm(f => ({ ...f, [k]: v }));
  const selectedFarm = farms.find(f => f.farmId === selectedFarmId);

  return (
    <div className="text-slate-50">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-1">Farm Management</h1>
          <p className="text-slate-400 text-sm">Manage your farms, workers, and access control</p>
        </div>
        <button
          onClick={() => { setShowCreateFarm(v => !v); farmErr.clearAll(); }}
          className={showCreateFarm
            ? 'inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors'
            : 'inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors'}
        >
          {showCreateFarm ? 'Cancel' : '+ New Farm'}
        </button>
      </div>

      {showCreateFarm && (
        <div className={card}>
          <h3 className="text-xl font-bold text-slate-50 mb-5">Create New Farm</h3>
          <form onSubmit={e => {
            e.preventDefault();
            const ok = farmErr.validate({
              farmName: () => !farmForm.farmName.trim() ? 'Farm name is required' : '',
            });
            if (!ok) return;
            const { streetName, cityTown, ...rest } = farmForm;
            createMut.mutate({ ...rest, address: [streetName, cityTown].filter(Boolean).join(', ') });
          }}>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-4 mb-5`}>
              <div>
                <label className={lbl}>Farm Name</label>
                <input value={farmForm.farmName} onChange={farmErr.field('farmName').onChange(e => setF('farmName', e.target.value))} className={`${inp} ${farmErr.field('farmName').error ? 'border-red-500' : ''}`} onFocus={farmErr.field('farmName').onFocus} onBlur={farmErr.field('farmName').onBlur} />
                <FieldError msg={farmErr.field('farmName').error} />
              </div>
              <div>
                <label className={lbl}>Farm Type</label>
                <select value={farmForm.farmType} onChange={e => setF('farmType', e.target.value)} className={inp}>
                  <option className="bg-slate-800">Livestock</option>
                  <option className="bg-slate-800">Crops</option>
                  <option className="bg-slate-800">Mixed</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Province</label>
                <select value={farmForm.province} onChange={e => setF('province', e.target.value)} className={inp}>
                  {PROVINCES.map(p => <option key={p} className="bg-slate-800">{p}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Street Name</label>
                <input value={farmForm.streetName} onChange={e => setF('streetName', e.target.value)} placeholder="e.g. 12 Farm Road" className={inp} />
              </div>
              <div>
                <label className={lbl}>City / Town</label>
                <input value={farmForm.cityTown} onChange={e => setF('cityTown', e.target.value)} placeholder="e.g. Pretoria" className={inp} />
              </div>
              <div>
                <label className={lbl}>GLN Number</label>
                <input value={farmForm.glnNumber} onChange={e => setF('glnNumber', e.target.value)} className={inp} />
              </div>
            </div>
            {createMut.isError && <p className="text-red-400 text-sm mb-3">Failed to create farm.</p>}
            <button type="submit" disabled={createMut.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
              {createMut.isPending ? 'Creating…' : 'Create Farm'}
            </button>
          </form>
        </div>
      )}

      <div className="grid gap-4 mb-7" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {farms.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center col-span-full text-slate-600">
            <p className="text-2xl mb-2 text-slate-400">◈</p>
            <p className="text-sm">No farms yet. Create one above.</p>
          </div>
        )}
        {farms.map(farm => {
          const isActive = activeFarmId === farm.farmId;
          const isSelected = selectedFarmId === farm.farmId;
          return (
            <div
              key={farm.farmId}
              onClick={() => setSelectedFarmId(farm.farmId)}
              className={`bg-slate-800 border border-slate-700 rounded-xl p-5 cursor-pointer transition-colors ${isSelected ? 'border-l-4 border-l-amber-400 ring-1 ring-amber-400/20' : isActive ? 'border-l-4 border-l-teal-500' : 'border-l-4 border-l-slate-700'}`}
            >
              {editingFarm === farm.farmId ? (
                <form onSubmit={e => { e.preventDefault(); const { streetName, cityTown, ...rest } = editFarmForm; updateFarmMut.mutate({ farmId: farm.farmId, ...rest, address: [streetName, cityTown].filter(Boolean).join(', ') }); }} onClick={e => e.stopPropagation()}>
                  <div className="grid gap-2.5 mb-3">
                    <div><label className={lbl}>Farm Name</label><input value={editFarmForm.farmName} onChange={e => setEditFarmForm(f => ({ ...f, farmName: e.target.value }))} required className={inp} /></div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className={lbl}>Type</label>
                        <select value={editFarmForm.farmType} onChange={e => setEditFarmForm(f => ({ ...f, farmType: e.target.value }))} className={inp}>
                          {['Livestock','Crops','Mixed'].map(t => <option key={t} className="bg-slate-800">{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Province</label>
                        <select value={editFarmForm.province} onChange={e => setEditFarmForm(f => ({ ...f, province: e.target.value }))} className={inp}>
                          {PROVINCES.map(p => <option key={p} className="bg-slate-800">{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={lbl}>Street Name</label>
                      <input value={editFarmForm.streetName || ''} onChange={e => setEditFarmForm(f => ({ ...f, streetName: e.target.value }))} placeholder="e.g. 12 Farm Road" className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>City / Town</label>
                      <input value={editFarmForm.cityTown || ''} onChange={e => setEditFarmForm(f => ({ ...f, cityTown: e.target.value }))} placeholder="e.g. Pretoria" className={inp} />
                    </div>
                    <div><label className={lbl}>GLN Number</label><input value={editFarmForm.glnNumber} onChange={e => setEditFarmForm(f => ({ ...f, glnNumber: e.target.value }))} className={inp} /></div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={updateFarmMut.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">Save</button>
                    <button type="button" onClick={() => setEditingFarm(null)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Cancel</button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="mb-1 font-bold text-base text-slate-50">{farm.farmName}</p>
                    <p className="mb-1 text-xs text-slate-400">{farm.farmType} · {farm.province}</p>
                    {farm.address && <p className="mb-1.5 text-[11px] text-teal-400/70">{farm.address}</p>}
                    {farm.glnNumber && <p className="text-[11px] text-slate-600 font-mono">GLN {farm.glnNumber}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 items-end">
                    <button
                      onClick={e => { e.stopPropagation(); selectFarm(farm.farmId); }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${isActive ? 'bg-teal-500 text-slate-900' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20 hover:bg-teal-500/20'}`}
                    >
                      {isActive ? '✓ Active' : 'Set Active'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingFarm(farm.farmId); const parts = (farm.address || '').split(', '); setEditFarmForm({ farmName: farm.farmName, farmType: farm.farmType, province: farm.province, streetName: parts[0] || '', cityTown: parts.slice(1).join(', ') || '', glnNumber: farm.glnNumber || '' }); }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedFarm && (
        <div className={card}>
          <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
            <div>
              <h3 className="text-xl font-bold text-slate-50 mb-0.5">Workers — {selectedFarm.farmName}</h3>
              <p className="text-slate-400 text-sm">{workers.length} team member{workers.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => { setShowInvite(v => !v); setInviteLink(''); inviteErr.clearAll(); }}
              className={showInvite
                ? 'inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors'
                : 'inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors'}
            >
              {showInvite ? 'Cancel' : '+ Invite Worker'}
            </button>
          </div>

          {showInvite && (
            <div className="bg-slate-900 rounded-lg p-5 mb-5 border border-slate-700">
              <form onSubmit={e => {
                e.preventDefault();
                const ok = inviteErr.validate({
                  email: () => !inviteForm.email.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(inviteForm.email) ? 'Enter a valid email address' : '',
                });
                if (!ok) return;
                inviteMut.mutate({ farmId: selectedFarmId, ...inviteForm });
              }}>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-3 mb-4`}>
                  <div>
                    <label className={lbl}>Email</label>
                    <input type="email" value={inviteForm.email} onChange={inviteErr.field('email').onChange(e => setI('email', e.target.value))} className={`${inp} ${inviteErr.field('email').error ? 'border-red-500' : ''}`} onFocus={inviteErr.field('email').onFocus} onBlur={inviteErr.field('email').onBlur} />
                    <FieldError msg={inviteErr.field('email').error} />
                  </div>
                  <div>
                    <label className={lbl}>Role</label>
                    <select value={inviteForm.role} onChange={e => setI('role', e.target.value)} className={inp}>
                      <option className="bg-slate-800">Worker</option>
                      <option className="bg-slate-800">FarmManager</option>
                      <option className="bg-slate-800">Vet</option>
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Job Title (optional)</label>
                    <input value={inviteForm.customTitle} onChange={e => setI('customTitle', e.target.value)} placeholder="e.g. Head Herdsman" className={inp} />
                  </div>
                </div>
                <button type="submit" disabled={inviteMut.isPending} className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">
                  {inviteMut.isPending ? 'Sending…' : 'Send Invitation'}
                </button>
              </form>
              {inviteLink && (
                <div className="mt-4 p-3.5 bg-slate-950 border border-teal-500/30 rounded-lg">
                  <p className="mb-1.5 text-sm font-bold text-teal-400">✓ Invitation created — share this link:</p>
                  <code className="text-xs break-all text-slate-400 font-mono">{inviteLink}</code>
                </div>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Name / Email','Role','Title','Status','Actions'].map(h => (
                    <th key={h} className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-900 border-b border-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-600 text-sm">No workers on this farm yet.</td>
                  </tr>
                ) : workers.map((w, i) => (
                  <tr key={w.farmWorkerId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'}>
                    <td className="px-3.5 py-3 text-sm border-b border-slate-700 font-bold text-slate-50">
                      <div>{w.fullName || '—'}</div>
                      <div className="text-xs text-slate-400 font-normal">{w.email}</div>
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-slate-700 text-slate-50">
                      {editingWorker === w.farmWorkerId ? (
                        <select value={editWorkerForm.role} onChange={e => setEditWorkerForm(f => ({ ...f, role: e.target.value }))}
                          className={inp}>
                          {['Worker','FarmManager','Vet'].map(r => <option key={r} className="bg-slate-800">{r}</option>)}
                        </select>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-700">{w.role}</span>
                      )}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-slate-700 text-slate-400">
                      {editingWorker === w.farmWorkerId ? (
                        <input value={editWorkerForm.customTitle} onChange={e => setEditWorkerForm(f => ({ ...f, customTitle: e.target.value }))}
                          className={inp} />
                      ) : (w.customTitle || '—')}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-slate-700 text-slate-50">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${w.status === 'Active' ? 'bg-teal-950 text-teal-400' : 'bg-slate-800 text-slate-600'}`}>{w.status}</span>
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-slate-700 text-slate-50">
                      {editingWorker === w.farmWorkerId ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => updateWorkerMut.mutate({ farmId: selectedFarmId, userId: w.userId, ...editWorkerForm })}
                            disabled={updateWorkerMut.isPending}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold rounded-lg text-sm transition-colors disabled:opacity-60">Save</button>
                          <button onClick={() => setEditingWorker(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setEditingWorker(w.farmWorkerId); setEditWorkerForm({ role: w.role, customTitle: w.customTitle || '' }); }}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition-colors"
                          >Edit</button>
                          <button
                            onClick={() => removeMut.mutate({ farmId: selectedFarmId, userId: w.userId })}
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors"
                          >Remove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
