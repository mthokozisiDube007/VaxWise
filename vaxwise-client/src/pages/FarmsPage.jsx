import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms, createFarm, getFarmWorkers, inviteWorker, removeWorker, updateWorker } from '../api/farmsApi';

const S = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#333' },
  btn: (color) => ({ background: color, color: 'white', border: 'none', padding: '9px 18px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }),
  th: { padding: '10px', textAlign: 'left', color: '#1A5276', fontSize: '13px' },
  td: { padding: '10px', fontSize: '14px', borderBottom: '1px solid #f0f0f0' },
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
  const { data: workers = [] } = useQuery({
    queryKey: ['workers', selectedFarmId],
    queryFn: () => getFarmWorkers(selectedFarmId),
    enabled: !!selectedFarmId,
  });

  const createMut = useMutation({
    mutationFn: createFarm,
    onSuccess: () => { qc.invalidateQueries(['farms']); setShowCreateFarm(false); setFarmForm(EMPTY_FARM); },
  });

  const inviteMut = useMutation({
    mutationFn: inviteWorker,
    onSuccess: (data) => { setInviteLink(data.invitationLink || ''); setInviteForm(EMPTY_INVITE); qc.invalidateQueries(['workers', selectedFarmId]); },
  });

  const removeMut = useMutation({
    mutationFn: removeWorker,
    onSuccess: () => qc.invalidateQueries(['workers', selectedFarmId]),
  });

  const setF = (k, v) => setFarmForm(f => ({ ...f, [k]: v }));
  const setI = (k, v) => setInviteForm(f => ({ ...f, [k]: v }));
  const selectedFarm = farms.find(f => f.farmId === selectedFarmId);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1A5276', margin: 0 }}>🏡 Farm Management</h1>
        <button onClick={() => setShowCreateFarm(v => !v)} style={S.btn('#1A5276')}>
          {showCreateFarm ? 'Cancel' : '+ New Farm'}
        </button>
      </div>

      {showCreateFarm && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Create New Farm</h3>
          <form onSubmit={e => { e.preventDefault(); createMut.mutate(farmForm); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div><label style={S.label}>Farm Name</label><input value={farmForm.farmName} onChange={e => setF('farmName', e.target.value)} required style={S.input} /></div>
              <div>
                <label style={S.label}>Farm Type</label>
                <select value={farmForm.farmType} onChange={e => setF('farmType', e.target.value)} style={S.input}>
                  <option>Livestock</option><option>Crops</option><option>Mixed</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Province</label>
                <select value={farmForm.province} onChange={e => setF('province', e.target.value)} style={S.input}>
                  {PROVINCES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div><label style={S.label}>GPS Coordinates</label><input value={farmForm.gpsCoordinates} onChange={e => setF('gpsCoordinates', e.target.value)} placeholder="-26.2023,28.0293" style={S.input} /></div>
              <div><label style={S.label}>GLN Number</label><input value={farmForm.glnNumber} onChange={e => setF('glnNumber', e.target.value)} style={S.input} /></div>
            </div>
            {createMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to create farm.</p>}
            <button type="submit" disabled={createMut.isPending} style={S.btn('#1E8449')}>
              {createMut.isPending ? 'Creating...' : 'Create Farm'}
            </button>
          </form>
        </div>
      )}

      {/* Farm list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {farms.map(farm => (
          <div key={farm.farmId} onClick={() => setSelectedFarmId(farm.farmId)} style={{
            ...S.card, marginBottom: 0, cursor: 'pointer',
            borderLeft: `4px solid ${selectedFarmId === farm.farmId ? '#1A5276' : activeFarmId === farm.farmId ? '#1E8449' : '#ddd'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1A5276' }}>{farm.farmName}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{farm.farmType} · {farm.province}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); selectFarm(farm.farmId); }} style={{
                ...S.btn(activeFarmId === farm.farmId ? '#1E8449' : '#888'), fontSize: '11px', padding: '4px 10px'
              }}>
                {activeFarmId === farm.farmId ? '✓ Active' : 'Set Active'}
              </button>
            </div>
          </div>
        ))}
        {farms.length === 0 && <p style={{ color: '#888', gridColumn: '1/-1' }}>No farms yet. Create one above.</p>}
      </div>

      {/* Workers panel */}
      {selectedFarm && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: '#1A5276' }}>Workers — {selectedFarm.farmName}</h3>
            <button onClick={() => { setShowInvite(v => !v); setInviteLink(''); }} style={S.btn('#1A5276')}>
              {showInvite ? 'Cancel' : '+ Invite Worker'}
            </button>
          </div>

          {showInvite && (
            <div style={{ background: '#F8F9FA', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
              <form onSubmit={e => { e.preventDefault(); inviteMut.mutate({ farmId: selectedFarmId, ...inviteForm }); }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
                  <div><label style={S.label}>Email</label><input type="email" value={inviteForm.email} onChange={e => setI('email', e.target.value)} required style={S.input} /></div>
                  <div>
                    <label style={S.label}>Role</label>
                    <select value={inviteForm.role} onChange={e => setI('role', e.target.value)} style={S.input}>
                      <option>Worker</option><option>FarmManager</option><option>Vet</option>
                    </select>
                  </div>
                  <div><label style={S.label}>Job Title (optional)</label><input value={inviteForm.customTitle} onChange={e => setI('customTitle', e.target.value)} placeholder="e.g. Head Herdsman" style={S.input} /></div>
                </div>
                <button type="submit" disabled={inviteMut.isPending} style={S.btn('#1E8449')}>
                  {inviteMut.isPending ? 'Sending...' : 'Send Invitation'}
                </button>
              </form>
              {inviteLink && (
                <div style={{ marginTop: '12px', padding: '10px', background: '#EAFAF1', border: '1px solid #1E8449', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 'bold', color: '#1E8449' }}>✅ Invitation created — share this link:</p>
                  <code style={{ fontSize: '12px', wordBreak: 'break-all', color: '#555' }}>{inviteLink}</code>
                </div>
              )}
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#EAF2FB' }}>
              {['Name / Email', 'Role', 'Title', 'Status', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.farmWorkerId}>
                  <td style={S.td}>{w.fullName || w.email}</td>
                  <td style={S.td}><span style={{ fontSize: '11px', background: '#EAF2FB', padding: '2px 6px', borderRadius: '4px' }}>{w.role}</span></td>
                  <td style={S.td}>{w.customTitle || '—'}</td>
                  <td style={S.td}><span style={{ fontSize: '11px', color: w.status === 'Active' ? '#1E8449' : '#888' }}>● {w.status}</span></td>
                  <td style={S.td}>
                    <button onClick={() => removeMut.mutate({ farmId: selectedFarmId, userId: w.userId })} style={{ ...S.btn('#E74C3C'), fontSize: '11px', padding: '4px 10px' }}>Remove</button>
                  </td>
                </tr>
              ))}
              {workers.length === 0 && <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>No workers on this farm yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
