import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms, createFarm, getFarmWorkers, inviteWorker, removeWorker } from '../api/farmsApi';

const S = {
  card: { background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(11,31,20,0.05), 0 4px 16px rgba(11,31,20,0.05)', marginBottom: '24px' },
  inp: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E0D9CE', fontSize: '14px', boxSizing: 'border-box', background: '#FDFCF8', color: '#1A1A18', fontFamily: "'DM Sans', sans-serif" },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#F8F5F0', borderBottom: '1px solid #EDE8DF' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #F0EBE2', color: '#1A1A18' },
  btn: (c) => ({ background: c, color: 'white', border: 'none', padding: '10px 22px', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }),
};

const EMPTY_FARM = { farmName: '', farmType: 'Livestock', province: 'Gauteng', gpsCoordinates: '', glnNumber: '' };
const EMPTY_INVITE = { email: '', role: 'Worker', customTitle: '' };
const PROVINCES = ['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];

export default function FarmsPage() {
  const { activeFarmId, selectFarm } = useAuth();
  const qc = useQueryClient();
  const [showCreateFarm, setShowCreateFarm] = useState(false);
  const [farmForm, setFarmForm] = useState(EMPTY_FARM);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [inviteLink, setInviteLink] = useState('');

  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: getFarms });
  const { data: workers = [] } = useQuery({ queryKey: ['workers', selectedFarmId], queryFn: () => getFarmWorkers(selectedFarmId), enabled: !!selectedFarmId });

  const createMut = useMutation({ mutationFn: createFarm, onSuccess: () => { qc.invalidateQueries(['farms']); setShowCreateFarm(false); setFarmForm(EMPTY_FARM); } });
  const inviteMut = useMutation({ mutationFn: inviteWorker, onSuccess: (data) => { setInviteLink(data.invitationLink || ''); setInviteForm(EMPTY_INVITE); qc.invalidateQueries(['workers', selectedFarmId]); } });
  const removeMut = useMutation({ mutationFn: removeWorker, onSuccess: () => qc.invalidateQueries(['workers', selectedFarmId]) });

  const setF = (k, v) => setFarmForm(f => ({ ...f, [k]: v }));
  const setI = (k, v) => setInviteForm(f => ({ ...f, [k]: v }));
  const selectedFarm = farms.find(f => f.farmId === selectedFarmId);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#0B1F14', marginBottom: '4px' }}>Farm Management</h1>
          <p style={{ color: '#8C8677', fontSize: '14px' }}>Manage your farms, workers, and access control</p>
        </div>
        <button onClick={() => setShowCreateFarm(v => !v)} style={{ padding: '10px 20px', background: showCreateFarm ? '#F0EBE1' : '#0B1F14', color: showCreateFarm ? '#0B1F14' : 'white', border: showCreateFarm ? '1.5px solid #E0D9CE' : 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>
          {showCreateFarm ? 'Cancel' : '+ New Farm'}
        </button>
      </div>

      {showCreateFarm && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '20px' }}>Create New Farm</h3>
          <form onSubmit={e => { e.preventDefault(); createMut.mutate(farmForm); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div><label style={S.lbl}>Farm Name</label><input value={farmForm.farmName} onChange={e => setF('farmName', e.target.value)} required style={S.inp} /></div>
              <div>
                <label style={S.lbl}>Farm Type</label>
                <select value={farmForm.farmType} onChange={e => setF('farmType', e.target.value)} style={S.inp}>
                  <option>Livestock</option><option>Crops</option><option>Mixed</option>
                </select>
              </div>
              <div>
                <label style={S.lbl}>Province</label>
                <select value={farmForm.province} onChange={e => setF('province', e.target.value)} style={S.inp}>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={S.lbl}>GPS Coordinates</label><input value={farmForm.gpsCoordinates} onChange={e => setF('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" style={S.inp} /></div>
              <div><label style={S.lbl}>GLN Number</label><input value={farmForm.glnNumber} onChange={e => setF('glnNumber', e.target.value)} style={S.inp} /></div>
            </div>
            {createMut.isError && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>Failed to create farm.</p>}
            <button type="submit" disabled={createMut.isPending} style={S.btn('#177A3E')}>{createMut.isPending ? 'Creating…' : 'Create Farm'}</button>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {farms.length === 0 && (
          <div style={{ ...S.card, gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#B0A898' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>◈</p>
            <p style={{ fontSize: '14px' }}>No farms yet. Create one above.</p>
          </div>
        )}
        {farms.map(farm => {
          const isActive = activeFarmId === farm.farmId;
          const isSelected = selectedFarmId === farm.farmId;
          return (
            <div key={farm.farmId} onClick={() => setSelectedFarmId(farm.farmId)} style={{
              ...S.card, marginBottom: 0, cursor: 'pointer',
              borderLeft: `4px solid ${isSelected ? '#C9850B' : isActive ? '#177A3E' : '#E0D9CE'}`,
              outline: isSelected ? '2px solid rgba(201,133,11,0.2)' : 'none',
              transition: 'box-shadow 0.15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '16px', color: '#0B1F14' }}>{farm.farmName}</p>
                  <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#8C8677' }}>{farm.farmType} · {farm.province}</p>
                  {farm.glnNumber && <p style={{ margin: 0, fontSize: '11px', color: '#B0A898', fontFamily: "'JetBrains Mono', monospace" }}>GLN {farm.glnNumber}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); selectFarm(farm.farmId); }} style={{
                  background: isActive ? '#177A3E' : '#F0EBE1', color: isActive ? 'white' : '#6E6B60', border: 'none', padding: '5px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                }}>
                  {isActive ? '✓ Active' : 'Set Active'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedFarm && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '2px' }}>Workers — {selectedFarm.farmName}</h3>
              <p style={{ color: '#8C8677', fontSize: '13px' }}>{workers.length} team member{workers.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => { setShowInvite(v => !v); setInviteLink(''); }} style={{ padding: '8px 18px', background: showInvite ? '#F0EBE1' : '#0B1F14', color: showInvite ? '#0B1F14' : 'white', border: showInvite ? '1.5px solid #E0D9CE' : 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>
              {showInvite ? 'Cancel' : '+ Invite Worker'}
            </button>
          </div>

          {showInvite && (
            <div style={{ background: '#F8F5F0', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
              <form onSubmit={e => { e.preventDefault(); inviteMut.mutate({ farmId: selectedFarmId, ...inviteForm }); }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div><label style={S.lbl}>Email</label><input type="email" value={inviteForm.email} onChange={e => setI('email', e.target.value)} required style={S.inp} /></div>
                  <div>
                    <label style={S.lbl}>Role</label>
                    <select value={inviteForm.role} onChange={e => setI('role', e.target.value)} style={S.inp}>
                      <option>Worker</option><option>FarmManager</option><option>Vet</option>
                    </select>
                  </div>
                  <div><label style={S.lbl}>Job Title (optional)</label><input value={inviteForm.customTitle} onChange={e => setI('customTitle', e.target.value)} placeholder="e.g. Head Herdsman" style={S.inp} /></div>
                </div>
                <button type="submit" disabled={inviteMut.isPending} style={S.btn('#177A3E')}>{inviteMut.isPending ? 'Sending…' : 'Send Invitation'}</button>
              </form>
              {inviteLink && (
                <div style={{ marginTop: '16px', padding: '14px 18px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '700', color: '#15803D' }}>✓ Invitation created — share this link:</p>
                  <code style={{ fontSize: '12px', wordBreak: 'break-all', color: '#6E6B60', fontFamily: "'JetBrains Mono', monospace" }}>{inviteLink}</code>
                </div>
              )}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Name / Email','Role','Title','Status','Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {workers.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#B0A898', fontSize: '14px' }}>No workers on this farm yet.</td></tr>
              ) : workers.map(w => (
                <tr key={w.farmWorkerId}>
                  <td style={{ ...S.td, fontWeight: '700', color: '#0B1F14' }}>{w.fullName || w.email}</td>
                  <td style={S.td}><span style={{ background: '#F0EBE1', color: '#6E6B60', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{w.role}</span></td>
                  <td style={{ ...S.td, color: '#8C8677' }}>{w.customTitle || '—'}</td>
                  <td style={S.td}>
                    <span style={{ background: w.status === 'Active' ? '#F0FDF4' : '#F8F8F8', color: w.status === 'Active' ? '#15803D' : '#9CA3AF', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '600' }}>{w.status}</span>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => removeMut.mutate({ farmId: selectedFarmId, userId: w.userId })} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
