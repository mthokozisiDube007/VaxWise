import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAnimals, createAnimal, deleteAnimal } from '../api/animalsApi';
import { useAuth } from '../context/AuthContext';

export default function AnimalsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    earTagNumber: '', rfidTag: '', animalTypeId: 1,
    breed: '', dateOfBirth: '', gender: 'M',
    currentWeightKg: 0, purchaseDate: '', purchasePrice: 0
  });

  const { data: animals = [], isLoading } = useQuery({
    queryKey: ['animals'],
    queryFn: getAllAnimals
  });

  const createMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries(['animals']);
      setShowForm(false);
      setForm({
        earTagNumber: '', rfidTag: '', animalTypeId: 1,
        breed: '', dateOfBirth: '', gender: 'M',
        currentWeightKg: 0, purchaseDate: '', purchasePrice: 0
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnimal,
    onSuccess: () => queryClient.invalidateQueries(['animals'])
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const statusColor = {
    Active: '#1E8449',
    UnderTreatment: '#E74C3C',
    Quarantined: '#D4AC0D',
    Sold: '#666',
    Deceased: '#999'
  };

  if (isLoading) return <p>Loading animals...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ color: '#1A5276', margin: 0 }}>🐄 Animal Registry</h1>
        {(hasRole('FarmOwner') || hasRole('FarmManager')) && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: '#1A5276', color: 'white', border: 'none',
            padding: '10px 20px', borderRadius: '6px', cursor: 'pointer'
          }}>
            {showForm ? 'Cancel' : '+ Register Animal'}
          </button>
        )}
      </div>

      {/* Registration Form */}
      {showForm && (
        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#1A5276', marginTop: 0 }}>Register New Animal</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Animal Type</label>
                <select value={form.animalTypeId} onChange={(e) => setForm({ ...form, animalTypeId: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value={1}>Cattle</option>
                  <option value={2}>Sheep</option>
                  <option value={3}>Goat</option>
                  <option value={4}>Pig</option>
                  <option value={5}>Chicken</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={createMutation.isPending} style={{
              marginTop: '16px', background: '#1E8449', color: 'white',
              border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer'
            }}>
              {createMutation.isPending ? 'Registering...' : 'Register Animal'}
            </button>
          </form>
        </div>
      )}

      {/* Animals Table */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#EAF2FB' }}>
              {['Ear Tag', 'Type', 'Breed', 'Gender', 'Weight', 'Status', 'Compliance', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#1A5276' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => (
              <tr key={animal.animalId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{animal.earTagNumber}</td>
                <td style={{ padding: '10px' }}>{animal.animalTypeName}</td>
                <td style={{ padding: '10px' }}>{animal.breed}</td>
                <td style={{ padding: '10px' }}>{animal.gender === 'M' ? 'Male' : 'Female'}</td>
                <td style={{ padding: '10px' }}>{animal.currentWeightKg} kg</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    background: statusColor[animal.status] + '20',
                    color: statusColor[animal.status],
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold'
                  }}>
                    {animal.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '60px', height: '6px', background: '#eee', borderRadius: '3px' }}>
                      <div style={{ width: `${animal.complianceScore}%`, height: '100%', background: '#1E8449', borderRadius: '3px' }} />
                    </div>
                    <span style={{ fontSize: '12px' }}>{animal.complianceScore}%</span>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>
                  {hasRole('Admin') && (
                    <button onClick={() => deleteMutation.mutate(animal.animalId)} style={{
                      background: '#E74C3C', color: 'white', border: 'none',
                      padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                    }}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {animals.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            No animals registered yet. Click Register Animal to add your first animal.
          </p>
        )}
      </div>
    </div>
  );
}