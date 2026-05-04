import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms, createFarm, updateFarm, getFarmWorkers, inviteWorker, updateWorker, removeWorker } from '../api/farmsApi';
import { useMobile } from '../hooks/useMobile';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  inp: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #2D4A34', fontSize: '14px', boxSizing: 'border-box', background: '#162219', color: '#F0EDE8', fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.15s' },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
  btn: (c) => ({ background: c, color: c === '#22C55E' ? '#0B1F14' : 'white', border: 'none', padding: '10px 22px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }),
};

const EMPTY_FARM = { farmName: '', farmType: 'Livestock', province: 'Gauteng', gpsCoordinates: '', glnNumber: '' };
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
  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: getFarms });
  const { data: workers = [] } = useQuery({ queryKey: ['workers', selectedFarmId], queryFn: () => getFarmWorkers(selectedFarmId), enabled: !!selectedFarmId });

  const createMut = useMutation({
    mutationFn: createFarm,
    onSuccess: (farm) => {
      qc.invalidateQueries({ queryKey: ['farms'] });
      selectFarm(farm.farmId);
      setShowCreateFarm(false);
      setFarmForm(EMPTY_FARM);
    },
  });
  const updateFarmMut = useMutation({
    mutationFn: updateFarm,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['farms'] }); setEditingFarm(null); },
  });
  const inviteMut = useMutation({ mutationFn: inviteWorker, onSuccess: (data) => { setInviteLink(data.invitationLink || ''); setInviteForm(EMPTY_INVITE); qc.invalidateQueries({ queryKey: ['workers', selectedFarmId] }); } });
  const updateWorkerMut = useMutation({
    mutationFn: updateWorker,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['workers', selectedFarmId] }); setEditingWorker(null); },
  });
  const removeMut = useMutation({ mutationFn: removeWorker, onSuccess: () => qc.invalidateQueries({ queryKey: ['workers', selectedFarmId] }) });

  const setF = (k, v) => setFarmForm(f => ({ ...f, [k]: v }));
  const setI = (k, v) => setInviteForm(f => ({ ...f, [k]: v }));
  const selectedFarm = farms.find(f => f.farmId === selectedFarmId);

  const focusGreen = e => e.target.style.borderColor = '#22C55E';
  const blurGreen = e => e.target.style.borderColor = '#2D4A34';

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Farm Management</h1>
          <p style={{ color: '#8C8677', fontSize: '14px' }}>Manage your farms, workers, and access control</p>
        </div>
        <button
          onClick={() => setShowCreateFarm(v => !v)}
          style={{ padding: '10px 22px', background: showCreateFarm ? 'transparent' : '#22C55E', color: showCreateFarm ? '#22C55E' : '#0B1F14', border: showCreateFarm ? '1.5px solid #22C55E' : 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
        >
          {showCreateFarm ? 'Cancel' : '+ New Farm'}
        </button>
      </div>

      {showCreateFarm && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '20px' }}>Create New Farm</h3>
          <form onSubmit={e => { e.preventDefault(); createMut.mutate(farmForm); }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={S.lbl}>Farm Name</label>
                <input value={farmForm.farmName} onChange={e => setF('farmName', e.target.value)} required style={S.inp} onFocus={focusGreen} onBlur={blurGreen} />
              </div>
              <div>
                <label style={S.lbl}>Farm Type</label>
                <select value={farmForm.farmType} onChange={e => setF('farmType', e.target.value)} style={S.inp} onFocus={focusGreen} onBlur={blurGreen}>
                  <option style={{ background: '#162219' }}>Livestock</option>
                  <option style={{ background: '#162219' }}>Crops</option>
                  <option style={{ background: '#162219' }}>Mixed</option>
                </select>
              </div>
              <div>
                <label style={S.lbl}>Province</label>
                <select value={farmForm.province} onChange={e => setF('province', e.target.value)} style={S.inp} onFocus={focusGreen} onBlur={blurGreen}>
                  {PROVINCES.map(p => <option key={p} style={{ background: '#162219' }}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>GPS Coordinates</label>
                <input value={farmForm.gpsCoordinates} onChange={e => setF('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" style={S.inp} onFocus={focusGreen} onBlur={blurGreen} />
              </div>
              <div>
                <label style={S.lbl}>GLN Number</label>
                <input value={farmForm.glnNumber} onChange={e => setF('glnNumber', e.target.value)} style={S.inp} onFocus={focusGreen} onBlur={blurGreen} />
              </div>
            </div>
            {createMut.isError && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Failed to create farm.</p>}
            <button type="submit" disabled={createMut.isPending} style={{ ...S.btn('#22C55E'), opacity: createMut.isPending ? 0.7 : 1 }}>
              {createMut.isPending ? 'Creating…' : 'Create Farm'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {farms.length === 0 && (
          <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#4A4A42' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px', color: '#8C8677' }}>◈</p>
            <p style={{ fontSize: '14px' }}>No farms yet. Create one above.</p>
          </div>
        )}
        {farms.map(farm => {
          const isActive = activeFarmId === farm.farmId;
          const isSelected = selectedFarmId === farm.farmId;
          return (
            <div
              key={farm.farmId}
              onClick={() => setSelectedFarmId(farm.farmId)}
              style={{
                ...S.card,
                marginBottom: 0,
                cursor: 'pointer',
                borderLeft: `4px solid ${isSelected ? '#F59E0B' : isActive ? '#22C55E' : '#2D4A34'}`,
                outline: isSelected ? '1px solid rgba(245,158,11,0.2)' : 'none',
                transition: 'border-color 0.15s',
              }}
            >
              {editingFarm === farm.farmId ? (
                <form onSubmit={e => { e.preventDefault(); updateFarmMut.mutate({ farmId: farm.farmId, ...editFarmForm }); }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
                    <div><label style={S.lbl}>Farm Name</label><input value={editFarmForm.farmName} onChange={e => setEditFarmForm(f => ({ ...f, farmName: e.target.value }))} required style={S.inp} onFocus={focusGreen} onBlur={blurGreen} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={S.lbl}>Type</label>
                        <select value={editFarmForm.farmType} onChange={e => setEditFarmForm(f => ({ ...f, farmType: e.target.value }))} style={S.inp} onFocus={focusGreen} onBlur={blurGreen}>
                          {['Livestock','Crops','Mixed'].map(t => <option key={t} style={{ background: '#162219' }}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.lbl}>Province</label>
                        <select value={editFarmForm.province} onChange={e => setEditFarmForm(f => ({ ...f, province: e.target.value }))} style={S.inp} onFocus={focusGreen} onBlur={blurGreen}>
                          {PROVINCES.map(p => <option key={p} style={{ background: '#162219' }}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div><label style={S.lbl}>GLN Number</label><input value={editFarmForm.glnNumber} onChange={e => setEditFarmForm(f => ({ ...f, glnNumber: e.target.value }))} style={S.inp} onFocus={focusGreen} onBlur={blurGreen} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="submit" disabled={updateFarmMut.isPending} style={{ ...S.btn('#22C55E'), fontSize: '12px', padding: '7px 16px', opacity: updateFarmMut.isPending ? 0.7 : 1 }}>Save</button>
                    <button type="button" onClick={() => setEditingFarm(null)} style={{ ...S.btn('transparent'), color: '#8C8677', border: '1px solid #2D4A34', fontSize: '12px', padding: '7px 16px' }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '16px', color: '#F0EDE8' }}>{farm.farmName}</p>
                    <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#8C8677' }}>{farm.farmType} · {farm.province}</p>
                    {farm.glnNumber && <p style={{ margin: 0, fontSize: '11px', color: '#4A4A42', fontFamily: "'JetBrains Mono', monospace" }}>GLN {farm.glnNumber}</p>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <button
                      onClick={e => { e.stopPropagation(); selectFarm(farm.farmId); }}
                      style={{ background: isActive ? '#22C55E' : 'rgba(34,197,94,0.1)', color: isActive ? '#0B1F14' : '#22C55E', border: isActive ? 'none' : '1px solid rgba(34,197,94,0.2)', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}
                    >
                      {isActive ? '✓ Active' : 'Set Active'}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setEditingFarm(farm.farmId); setEditFarmForm({ farmName: farm.farmName, farmType: farm.farmType, province: farm.province, gpsCoordinates: farm.gpsCoordinates || '', glnNumber: farm.glnNumber || '' }); }}
                      style={{ background: 'transparent', color: '#8C8677', border: '1px solid #2D4A34', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontFamily: "'DM Sans', sans-serif" }}
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
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Workers — {selectedFarm.farmName}</h3>
              <p style={{ color: '#8C8677', fontSize: '13px' }}>{workers.length} team member{workers.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={() => { setShowInvite(v => !v); setInviteLink(''); }}
              style={{ padding: '8px 18px', background: showInvite ? 'transparent' : '#22C55E', color: showInvite ? '#22C55E' : '#0B1F14', border: showInvite ? '1.5px solid #22C55E' : 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
            >
              {showInvite ? 'Cancel' : '+ Invite Worker'}
            </button>
          </div>

          {showInvite && (
            <div style={{ background: '#162219', borderRadius: '10px', padding: '20px', marginBottom: '20px', border: '1px solid #2D4A34' }}>
              <form onSubmit={e => { e.preventDefault(); inviteMut.mutate({ farmId: selectedFarmId, ...inviteForm }); }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <label style={S.lbl}>Email</label>
                    <input type="email" value={inviteForm.email} onChange={e => setI('email', e.target.value)} required style={S.inp} onFocus={focusGreen} onBlur={blurGreen} />
                  </div>
                  <div>
                    <label style={S.lbl}>Role</label>
                    <select value={inviteForm.role} onChange={e => setI('role', e.target.value)} style={S.inp} onFocus={focusGreen} onBlur={blurGreen}>
                      <option style={{ background: '#162219' }}>Worker</option>
                      <option style={{ background: '#162219' }}>FarmManager</option>
                      <option style={{ background: '#162219' }}>Vet</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>Job Title (optional)</label>
                    <input value={inviteForm.customTitle} onChange={e => setI('customTitle', e.target.value)} placeholder="e.g. Head Herdsman" style={S.inp} onFocus={focusGreen} onBlur={blurGreen} />
                  </div>
                </div>
                <button type="submit" disabled={inviteMut.isPending} style={{ ...S.btn('#22C55E'), opacity: inviteMut.isPending ? 0.7 : 1 }}>
                  {inviteMut.isPending ? 'Sending…' : 'Send Invitation'}
                </button>
              </form>
              {inviteLink && (
                <div style={{ marginTop: '16px', padding: '14px 18px', background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '700', color: '#22C55E' }}>✓ Invitation created — share this link:</p>
                  <code style={{ fontSize: '12px', wordBreak: 'break-all', color: '#8C8677', fontFamily: "'JetBrains Mono', monospace" }}>{inviteLink}</code>
                </div>
              )}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name / Email','Role','Title','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#4A4A42', fontSize: '14px' }}>No workers on this farm yet.</td>
                  </tr>
                ) : workers.map((w, i) => (
                  <tr key={w.farmWorkerId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#F0EDE8' }}>
                      <div>{w.fullName || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#8C8677', fontWeight: '400' }}>{w.email}</div>
                    </td>
                    <td style={S.td}>
                      {editingWorker === w.farmWorkerId ? (
                        <select value={editWorkerForm.role} onChange={e => setEditWorkerForm(f => ({ ...f, role: e.target.value }))}
                          style={{ ...S.inp, padding: '5px 8px', fontSize: '12px' }}
                          onFocus={focusGreen} onBlur={blurGreen}>
                          {['Worker','FarmManager','Vet'].map(r => <option key={r} style={{ background: '#162219' }}>{r}</option>)}
                        </select>
                      ) : (
                        <span style={{ background: '#1A2B1F', color: '#8C8677', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #2D4A34' }}>{w.role}</span>
                      )}
                    </td>
                    <td style={{ ...S.td, color: '#8C8677' }}>
                      {editingWorker === w.farmWorkerId ? (
                        <input value={editWorkerForm.customTitle} onChange={e => setEditWorkerForm(f => ({ ...f, customTitle: e.target.value }))}
                          style={{ ...S.inp, padding: '5px 8px', fontSize: '12px' }}
                          onFocus={focusGreen} onBlur={blurGreen} />
                      ) : (w.customTitle || '—')}
                    </td>
                    <td style={S.td}>
                      <span style={{ background: w.status === 'Active' ? '#052E16' : '#1A2B1F', color: w.status === 'Active' ? '#22C55E' : '#4A4A42', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{w.status}</span>
                    </td>
                    <td style={S.td}>
                      {editingWorker === w.farmWorkerId ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => updateWorkerMut.mutate({ farmId: selectedFarmId, userId: w.userId, ...editWorkerForm })}
                            disabled={updateWorkerMut.isPending}
                            style={{ background: '#22C55E', color: '#0B1F14', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                          <button onClick={() => setEditingWorker(null)}
                            style={{ background: 'transparent', color: '#8C8677', border: '1px solid #2D4A34', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => { setEditingWorker(w.farmWorkerId); setEditWorkerForm({ role: w.role, customTitle: w.customTitle || '' }); }}
                            style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
                          >Edit</button>
                          <button
                            onClick={() => removeMut.mutate({ farmId: selectedFarmId, userId: w.userId })}
                            style={{ background: '#450A0A', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
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
