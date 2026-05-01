import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFeedStock, updateFeedStock, recordFeed, getFeedAlerts, getFeedRecords } from '../api/feedApi';

const S = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#333' },
  btn: (color) => ({ background: color, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }),
  tab: (active) => ({ padding: '10px 20px', border: 'none', borderBottom: active ? '3px solid #1A5276' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', color: active ? '#1A5276' : '#666', fontSize: '14px' }),
  th: { padding: '10px', textAlign: 'left', color: '#1A5276', fontSize: '13px' },
  td: { padding: '10px', fontSize: '14px', borderBottom: '1px solid #f0f0f0' },
};

const ANIMAL_TYPES = [{ id: 1, name: 'Cattle' }, { id: 2, name: 'Sheep' }, { id: 3, name: 'Goat' }, { id: 4, name: 'Pig' }, { id: 5, name: 'Chicken' }];
const EMPTY_STOCK = { feedType: '', quantityKg: '', costPerKg: '', lowStockThresholdKg: '50' };
const EMPTY_FEED = { animalTypeId: 1, feedType: '', quantityKg: '', costPerKg: '', feedDate: new Date().toISOString().split('T')[0], notes: '' };

export default function FeedingPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('stock');
  const [stockForm, setStockForm] = useState(EMPTY_STOCK);
  const [feedForm, setFeedForm] = useState(EMPTY_FEED);
  const [historyTypeId, setHistoryTypeId] = useState(1);

  const { data: stock = [] } = useQuery({ queryKey: ['feed-stock'], queryFn: getFeedStock });
  const { data: alerts = [] } = useQuery({ queryKey: ['feed-alerts'], queryFn: getFeedAlerts });
  const { data: records = [] } = useQuery({ queryKey: ['feed-records', historyTypeId], queryFn: () => getFeedRecords(historyTypeId) });

  const stockMut = useMutation({
    mutationFn: updateFeedStock,
    onSuccess: () => { qc.invalidateQueries(['feed-stock']); qc.invalidateQueries(['feed-alerts']); setStockForm(EMPTY_STOCK); },
  });

  const feedMut = useMutation({
    mutationFn: recordFeed,
    onSuccess: () => { qc.invalidateQueries(['feed-stock']); qc.invalidateQueries(['feed-records', historyTypeId]); setFeedForm(EMPTY_FEED); },
  });

  const setS = (k, v) => setStockForm(f => ({ ...f, [k]: v }));
  const setFf = (k, v) => setFeedForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>🌾 Feeding Management</h1>

      {alerts.length > 0 && (
        <div style={{ background: '#FEF9E7', border: '1px solid #D4AC0D', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span>⚠️</span>
          <strong style={{ color: '#B7950B' }}>{alerts.length} low stock alert{alerts.length > 1 ? 's' : ''}:</strong>
          <span style={{ fontSize: '13px', color: '#555' }}>{alerts.map(a => a.feedType).join(', ')}</span>
        </div>
      )}

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'stock', label: '📦 Stock Levels' },
          { key: 'record', label: '+ Record Feeding' },
          { key: 'history', label: '📋 Feed Records' },
          ...(hasRole('FarmOwner') || hasRole('FarmManager') ? [{ key: 'add', label: '+ Add Stock' }] : []),
        ].map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'stock' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Current Stock Levels</h3>
          {stock.length === 0 ? <p style={{ color: '#666' }}>No stock records yet.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Feed Type', 'Current Stock', 'Threshold', 'Cost/kg', 'Status', 'Last Updated'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{stock.map(s => (
                <tr key={s.feedStockId}>
                  <td style={S.td}><strong>{s.feedType}</strong></td>
                  <td style={S.td}>{s.currentStockKg} kg</td>
                  <td style={S.td}>{s.lowStockThresholdKg} kg</td>
                  <td style={S.td}>R{s.costPerKg}/kg</td>
                  <td style={S.td}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: s.isLowStock ? '#C0392B' : '#1E8449' }}>
                      {s.isLowStock ? '⚠️ Low' : '✅ OK'}
                    </span>
                  </td>
                  <td style={S.td}>{new Date(s.lastUpdated).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'add' && (hasRole('FarmOwner') || hasRole('FarmManager')) && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Add / Replenish Stock</h3>
          <form onSubmit={e => { e.preventDefault(); stockMut.mutate({ ...stockForm, quantityKg: parseFloat(stockForm.quantityKg), costPerKg: parseFloat(stockForm.costPerKg), lowStockThresholdKg: parseFloat(stockForm.lowStockThresholdKg) }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div><label style={S.label}>Feed Type</label><input value={stockForm.feedType} onChange={e => setS('feedType', e.target.value)} placeholder="e.g. Maize, Lucerne" required style={S.input} /></div>
              <div><label style={S.label}>Quantity (kg)</label><input type="number" value={stockForm.quantityKg} onChange={e => setS('quantityKg', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Cost per kg (R)</label><input type="number" step="0.01" value={stockForm.costPerKg} onChange={e => setS('costPerKg', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Low Stock Threshold (kg)</label><input type="number" value={stockForm.lowStockThresholdKg} onChange={e => setS('lowStockThresholdKg', e.target.value)} required style={S.input} /></div>
            </div>
            <button type="submit" disabled={stockMut.isPending} style={S.btn('#1E8449')}>
              {stockMut.isPending ? 'Saving...' : 'Update Stock'}
            </button>
          </form>
        </div>
      )}

      {tab === 'record' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Record Feed Consumption</h3>
          <form onSubmit={e => { e.preventDefault(); feedMut.mutate({ ...feedForm, animalTypeId: parseInt(feedForm.animalTypeId), quantityKg: parseFloat(feedForm.quantityKg), costPerKg: parseFloat(feedForm.costPerKg) }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Animal Type</label>
                <select value={feedForm.animalTypeId} onChange={e => setFf('animalTypeId', e.target.value)} style={S.input}>
                  {ANIMAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Feed Type</label><input value={feedForm.feedType} onChange={e => setFf('feedType', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Quantity (kg)</label><input type="number" value={feedForm.quantityKg} onChange={e => setFf('quantityKg', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Cost per kg (R)</label><input type="number" step="0.01" value={feedForm.costPerKg} onChange={e => setFf('costPerKg', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Date</label><input type="date" value={feedForm.feedDate} onChange={e => setFf('feedDate', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Notes</label><input value={feedForm.notes} onChange={e => setFf('notes', e.target.value)} style={S.input} /></div>
            </div>
            <button type="submit" disabled={feedMut.isPending} style={S.btn('#1A5276')}>
              {feedMut.isPending ? 'Recording...' : 'Record Feeding'}
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Feed Records</h3>
          <div style={{ marginBottom: '16px', maxWidth: '200px' }}>
            <label style={S.label}>Animal Type</label>
            <select value={historyTypeId} onChange={e => setHistoryTypeId(parseInt(e.target.value))} style={S.input}>
              {ANIMAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {records.length === 0 ? <p style={{ color: '#666' }}>No records found.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#EAF2FB' }}>
                {['Animal Type', 'Feed Type', 'Quantity', 'Cost/kg', 'Total Cost', 'Date'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{records.map(r => (
                <tr key={r.feedRecordId}>
                  <td style={S.td}>{r.animalTypeName}</td>
                  <td style={S.td}>{r.feedType}</td>
                  <td style={S.td}>{r.quantityKg} kg</td>
                  <td style={S.td}>R{r.costPerKg}</td>
                  <td style={S.td}><strong>R{r.totalCost?.toFixed(2)}</strong></td>
                  <td style={S.td}>{new Date(r.feedDate).toLocaleDateString()}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
