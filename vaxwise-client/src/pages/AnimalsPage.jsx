import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAllAnimals, createAnimal, updateAnimal, deleteAnimal, exportAnimalsCsv, updateAnimalWeight } from '../api/animalsApi';
import { recordTreatment } from '../api/healthApi';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';

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

const SICK_FORM_INIT = { symptoms: '', severity: 'Mild', notes: '' };

export default function AnimalsPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const isWorker = hasRole('FarmWorker');
  const isOwnerOrManager = hasRole('FarmOwner') || hasRole('FarmManager');
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [form, setForm] = useState({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0, purchaseDate: '', purchasePrice: 0 });
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

  const { data: animals = [], isLoading } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });

  const createMutation = useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['animals'] });
      setShowForm(false);
      setForm({ earTagNumber: '', rfidTag: '', animalTypeId: 1, breed: '', dateOfBirth: '', gender: 'M', currentWeightKg: 0, purchaseDate: '', purchasePrice: 0 });
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#8C8677', fontFamily: "'DM Sans', sans-serif" }}>Loading animals…</div>
  );

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Animal Registry</h1>
          <p style={{ color: '#8C8677', fontSize: '14px' }}>{animals.length} animal{animals.length !== 1 ? 's' : ''} registered</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={async () => { setExporting(true); try { await exportAnimalsCsv(); } finally { setExporting(false); } }}
            disabled={exporting}
            style={{ background: 'none', border: '1px solid #2D4A34', color: '#8C8677', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '600', cursor: exporting ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          {(hasRole('FarmOwner') || hasRole('FarmManager')) && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{ padding: '10px 22px', background: showForm ? 'transparent' : '#22C55E', color: showForm ? '#22C55E' : '#0B1F14', border: showForm ? '1.5px solid #22C55E' : 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
            >
              {showForm ? 'Cancel' : '+ Register Animal'}
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '20px' }}>Register New Animal</h3>
          <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
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
                    <td style={{ ...S.td, fontWeight: '700', color: '#22C55E', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                      {isOwnerOrManager ? (
                        <button onClick={() => navigate(`/animals/${animal.animalId}`)}
                          style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', fontWeight: '700', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', padding: 0, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                          {animal.earTagNumber}
                        </button>
                      ) : animal.earTagNumber}
                    </td>
                    <td style={S.td}>{animal.animalTypeName}</td>
                    <td style={S.td}>
                      {editingId === animal.animalId
                        ? <input value={editForm.breed} onChange={e => setEditForm(f => ({ ...f, breed: e.target.value }))} style={{ ...S.inp, padding: '5px 8px', fontSize: '13px' }} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                        : animal.breed}
                    </td>
                    <td style={S.td}>{animal.gender === 'M' ? 'Male' : 'Female'}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>
                      {editingId === animal.animalId
                        ? <input type="number" value={editForm.currentWeightKg} onChange={e => setEditForm(f => ({ ...f, currentWeightKg: parseFloat(e.target.value) }))} style={{ ...S.inp, padding: '5px 8px', fontSize: '13px', width: '80px' }} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                        : `${animal.currentWeightKg} kg`}
                    </td>
                    <td style={S.td}>
                      {editingId === animal.animalId ? (
                        <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={{ ...S.inp, padding: '5px 8px', fontSize: '12px' }} onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'}>
                          {Object.keys(STATUS).map(s => <option key={s} value={s} style={{ background: '#162219' }}>{s}</option>)}
                        </select>
                      ) : (
                        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{st.label}</span>
                      )}
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
                      {/* Owner/Manager: full edit */}
                      {isOwnerOrManager && (
                        editingId === animal.animalId ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => updateMutation.mutate({ id: animal.animalId, ...editForm })} disabled={updateMutation.isPending}
                              style={{ background: '#22C55E', color: '#0B1F14', border: 'none', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                            <button onClick={() => setEditingId(null)}
                              style={{ background: 'transparent', color: '#8C8677', border: '1px solid #2D4A34', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setEditingId(animal.animalId); setEditForm({ breed: animal.breed, currentWeightKg: animal.currentWeightKg, status: animal.status }); }}
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                            {hasRole('Admin') && (
                              <button onClick={() => deleteMutation.mutate(animal.animalId)}
                                style={{ background: '#450A0A', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
                            )}
                          </div>
                        )
                      )}

                      {/* Farm Worker: weight update + report sick */}
                      {isWorker && (
                        weightEditId === animal.animalId ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input type="number" value={weightValue} onChange={e => setWeightValue(e.target.value)}
                              style={{ ...S.inp, padding: '4px 8px', fontSize: '13px', width: '72px' }}
                              onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                            <button onClick={() => weightMutation.mutate({ id: animal.animalId, weightKg: parseFloat(weightValue) })} disabled={weightMutation.isPending}
                              style={{ background: '#22C55E', color: '#0B1F14', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>Save</button>
                            <button onClick={() => setWeightEditId(null)}
                              style={{ background: 'transparent', color: '#8C8677', border: '1px solid #2D4A34', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => { setWeightEditId(animal.animalId); setWeightValue(String(animal.currentWeightKg)); }}
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.2)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>⚖ Weight</button>
                            <button onClick={() => { setSickAnimal(animal); setSickForm(SICK_FORM_INIT); setSickError(''); }}
                              style={{ background: '#450A0A', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>🚨 Sick</button>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
          <div style={{ background: '#1A2B1F', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', border: '1px solid #1F3326' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#EF4444', marginBottom: '2px' }}>Report Sick Animal</h3>
                <p style={{ fontSize: '13px', color: '#8C8677' }}>{sickAnimal.earTagNumber} · {sickAnimal.animalTypeName}</p>
              </div>
              <button onClick={() => setSickAnimal(null)} style={{ background: 'none', border: 'none', color: '#8C8677', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            <label style={S.lbl}>Symptoms *</label>
            <textarea
              value={sickForm.symptoms}
              onChange={e => setSickForm(f => ({ ...f, symptoms: e.target.value }))}
              placeholder="Describe what you observed (e.g. limping, not eating, discharge)…"
              rows={4}
              style={{ ...S.inp, resize: 'vertical', marginBottom: '16px' }}
              onFocus={e => e.target.style.borderColor = '#EF4444'} onBlur={e => e.target.style.borderColor = '#2D4A34'}
            />

            <label style={S.lbl}>Severity</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {['Mild', 'Moderate', 'Severe', 'Critical'].map(sv => (
                <button key={sv} onClick={() => setSickForm(f => ({ ...f, severity: sv }))}
                  style={{ flex: 1, padding: '7px', borderRadius: '8px', border: '1.5px solid', borderColor: sickForm.severity === sv ? (sv === 'Critical' || sv === 'Severe' ? '#EF4444' : sv === 'Moderate' ? '#F59E0B' : '#22C55E') : '#2D4A34', background: sickForm.severity === sv ? 'rgba(239,68,68,0.1)' : '#162219', color: sickForm.severity === sv ? '#F0EDE8' : '#8C8677', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >{sv}</button>
              ))}
            </div>

            <label style={S.lbl}>Additional Notes</label>
            <textarea
              value={sickForm.notes}
              onChange={e => setSickForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any other observations…"
              rows={2}
              style={{ ...S.inp, resize: 'vertical', marginBottom: '20px' }}
              onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'}
            />

            {sickError && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '12px' }}>{sickError}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setSickAnimal(null)}
                style={{ flex: 1, background: 'transparent', border: '1px solid #2D4A34', color: '#8C8677', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={handleReportSick} disabled={sickSaving}
                style={{ flex: 2, background: '#EF4444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: sickSaving ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: sickSaving ? 0.7 : 1 }}>
                {sickSaving ? 'Submitting…' : '🚨 Submit Health Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
