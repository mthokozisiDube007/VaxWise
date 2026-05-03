import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAnimals, createAnimal, deleteAnimal } from '../api/animalsApi';
import { useAuth } from '../context/AuthContext';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  inp: { width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid #2D4A34', fontSize: '14px', boxSizing: 'border-box', background: '#162219', color: '#F0EDE8', fontFamily: "'DM Sans', sans-serif", outline: 'none', transition: 'border-color 0.15s' },
  lbl: { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
};

const STATUS = {
  Active: { bg: '#052E16', color: '#22C55E', label: 'Active' },
  UnderTreatment: { bg: '#450A0A', color: '#EF4444', label: 'Treatment' },
  Quarantined: { bg: '#431407', color: '#F59E0B', label: 'Quarantine' },
  Sold: { bg: '#1A2B1F', color: '#8C8677', label: 'Sold' },
  Deceased: { bg: '#1A2B1F', color: '#4A4A42', label: 'Deceased' },
};

export default function AnimalsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0, purchaseDate: '', purchasePrice: 0 });

  const { data: animals = [], isLoading } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });

  const createMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setShowForm(false);
      setForm({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0, purchaseDate: '', purchasePrice: 0 });
    },
  });

  const deleteMutation = useMutation({ mutationFn: deleteAnimal, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['animals'] }) });

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8C8677', fontFamily: "'DM Sans', sans-serif" }}>Loading animals…</div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Animal Registry</h1>
          <p style={{ color: '#8C8677', fontSize: '14px' }}>{animals.length} animal{animals.length !== 1 ? 's' : ''} registered</p>
        </div>
        {(hasRole('FarmOwner') || hasRole('FarmManager')) && (
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ padding: '10px 22px', background: showForm ? 'transparent' : '#22C55E', color: showForm ? '#22C55E' : '#0B1F14', border: showForm ? '1.5px solid #22C55E' : 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
          >
            {showForm ? 'Cancel' : '+ Register Animal'}
          </button>
        )}
      </div>

      {showForm && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '20px' }}>Register New Animal</h3>
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
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    required
                    style={{ ...S.inp, colorScheme: type === 'date' ? 'dark' : undefined }}
                    onFocus={e => e.target.style.borderColor = '#22C55E'}
                    onBlur={e => e.target.style.borderColor = '#2D4A34'}
                  />
                </div>
              ))}
              <div>
                <label style={S.lbl}>Animal Type</label>
                <select
                  value={form.animalTypeId}
                  onChange={e => setForm({ ...form, animalTypeId: parseInt(e.target.value) })}
                  style={S.inp}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                >
                  {[['Cattle',1],['Sheep',2],['Goat',3],['Pig',4],['Chicken',5]].map(([n,v]) => (
                    <option key={v} value={v} style={{ background: '#162219' }}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Gender</label>
                <select
                  value={form.gender}
                  onChange={e => setForm({ ...form, gender: e.target.value })}
                  style={S.inp}
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                >
                  <option value="M" style={{ background: '#162219' }}>Male</option>
                  <option value="F" style={{ background: '#162219' }}>Female</option>
                </select>
              </div>
            </div>
            {createMutation.isError && (
              <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>Failed to register animal. Please check all fields.</p>
            )}
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{ background: '#22C55E', color: '#0B1F14', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: createMutation.isPending ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: createMutation.isPending ? 0.7 : 1 }}
            >
              {createMutation.isPending ? 'Registering…' : 'Register Animal'}
            </button>
          </form>
        </div>
      )}

      <div style={S.card}>
        {animals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#4A4A42' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px', color: '#8C8677' }}>◈</p>
            <p style={{ fontSize: '15px', fontWeight: '500', color: '#8C8677', marginBottom: '6px' }}>No animals registered yet</p>
            <p style={{ fontSize: '13px' }}>Click "Register Animal" to add your first livestock record.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Ear Tag', 'Type', 'Breed', 'Gender', 'Weight', 'Status', 'Compliance', 'Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{animals.map((animal, i) => {
                const st = STATUS[animal.status] || { bg: '#1A2B1F', color: '#8C8677', label: animal.status };
                const score = animal.complianceScore ?? 0;
                const scoreColor = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
                return (
                  <tr key={animal.animalId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={{ ...S.td, fontWeight: '700', color: '#22C55E', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{animal.earTagNumber}</td>
                    <td style={S.td}>{animal.animalTypeName}</td>
                    <td style={S.td}>{animal.breed}</td>
                    <td style={S.td}>{animal.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{animal.currentWeightKg} kg</td>
                    <td style={S.td}>
                      <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{st.label}</span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: '#1F3326', borderRadius: '3px', maxWidth: '72px', overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: scoreColor, fontFamily: "'JetBrains Mono', monospace", fontWeight: '600' }}>{score}%</span>
                      </div>
                    </td>
                    <td style={S.td}>
                      {hasRole('Admin') && (
                        <button
                          onClick={() => deleteMutation.mutate(animal.animalId)}
                          style={{ background: '#450A0A', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
                        >
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
