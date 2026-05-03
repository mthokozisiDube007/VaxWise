import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAnimals, createAnimal, deleteAnimal } from '../api/animalsApi';
import { useAuth } from '../context/AuthContext';

const S = {
  card: { background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(11,31,20,0.05), 0 4px 16px rgba(11,31,20,0.05)', marginBottom: '24px' },
  inp: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #E0D9CE', fontSize: '14px', boxSizing: 'border-box', background: '#FDFCF8', color: '#1A1A18', fontFamily: "'DM Sans', sans-serif" },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#F8F5F0', borderBottom: '1px solid #EDE8DF' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #F0EBE2', color: '#1A1A18' },
};

const STATUS = {
  Active: { bg: '#F0FDF4', color: '#15803D', label: 'Active' },
  UnderTreatment: { bg: '#FEF2F2', color: '#DC2626', label: 'Treatment' },
  Quarantined: { bg: '#FFFBEB', color: '#B45309', label: 'Quarantine' },
  Sold: { bg: '#F1F5F9', color: '#475569', label: 'Sold' },
  Deceased: { bg: '#F8F8F8', color: '#9CA3AF', label: 'Deceased' },
};

export default function AnimalsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0, purchaseDate: '', purchasePrice: 0 });

  const { data: animals = [], isLoading } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });

  const createMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => { queryClient.invalidateQueries(['animals']); setShowForm(false); setForm({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0, purchaseDate: '', purchasePrice: 0 }); },
  });

  const deleteMutation = useMutation({ mutationFn: deleteAnimal, onSuccess: () => queryClient.invalidateQueries(['animals']) });

  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8C8677' }}>Loading animals…</div>;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#0B1F14', marginBottom: '4px' }}>Animal Registry</h1>
          <p style={{ color: '#8C8677', fontSize: '14px' }}>{animals.length} animal{animals.length !== 1 ? 's' : ''} registered</p>
        </div>
        {(hasRole('FarmOwner') || hasRole('FarmManager')) && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: showForm ? '#F0EBE1' : '#0B1F14', color: showForm ? '#0B1F14' : 'white', border: showForm ? '1.5px solid #E0D9CE' : 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
            {showForm ? 'Cancel' : '+ Register Animal'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '20px' }}>Register New Animal</h3>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Ear Tag Number', key: 'earTagNumber', type: 'text' },
                { label: 'RFID Tag', key: 'rfidTag', type: 'text' },
                { label: 'Breed', key: 'breed', type: 'text' },
                { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
                { label: 'Purchase Date', key: 'purchaseDate', type: 'date' },
                { label: 'Purchase Price (R)', key: 'purchasePrice', type: 'number' },
                { label: 'Weight (kg)', key: 'currentWeightKg', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={S.lbl}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required style={S.inp} />
                </div>
              ))}
              <div>
                <label style={S.lbl}>Animal Type</label>
                <select value={form.animalTypeId} onChange={e => setForm({ ...form, animalTypeId: parseInt(e.target.value) })} style={S.inp}>
                  {[['Cattle',1],['Sheep',2],['Goat',3],['Pig',4],['Chicken',5]].map(([n,v]) => <option key={v} value={v}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} style={S.inp}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
            </div>
            {createMutation.isError && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '12px' }}>Failed to register animal. Please check all fields.</p>}
            <button type="submit" disabled={createMutation.isPending} style={{ padding: '10px 24px', background: '#177A3E', color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              {createMutation.isPending ? 'Registering…' : 'Register Animal'}
            </button>
          </form>
        </div>
      )}

      <div style={S.card}>
        {animals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#B0A898' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>◈</p>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#6E6B60', marginBottom: '6px' }}>No animals registered yet</p>
            <p style={{ fontSize: '13px' }}>Click "Register Animal" to add your first livestock record.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Ear Tag', 'Type', 'Breed', 'Gender', 'Weight', 'Status', 'Compliance', 'Actions'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{animals.map(animal => {
                const st = STATUS[animal.status] || { bg: '#F1F5F9', color: '#64748B', label: animal.status };
                return (
                  <tr key={animal.animalId}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#0B1F14', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{animal.earTagNumber}</td>
                    <td style={S.td}>{animal.animalTypeName}</td>
                    <td style={S.td}>{animal.breed}</td>
                    <td style={S.td}>{animal.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{animal.currentWeightKg} kg</td>
                    <td style={S.td}>
                      <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>{st.label}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#F0EBE2', borderRadius: '3px', maxWidth: '72px' }}>
                          <div style={{ width: `${animal.complianceScore}%`, height: '100%', background: animal.complianceScore >= 80 ? '#177A3E' : animal.complianceScore >= 60 ? '#C9850B' : '#DC2626', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#8C8677', fontFamily: "'JetBrains Mono', monospace" }}>{animal.complianceScore}%</span>
                      </div>
                    </td>
                    <td style={S.td}>
                      {hasRole('Admin') && (
                        <button onClick={() => deleteMutation.mutate(animal.animalId)} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
