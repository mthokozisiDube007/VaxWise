import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { recordIncome, recordExpense, getProfitLoss, getTransactions } from '../api/financialApi';
import { getAllAnimals } from '../api/animalsApi';

const S = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  input: { width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' },
  label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 'bold', color: '#333' },
  btn: (color) => ({ background: color, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }),
  tab: (active) => ({ padding: '10px 20px', border: 'none', borderBottom: active ? '3px solid #1A5276' : '3px solid transparent', background: 'none', cursor: 'pointer', fontWeight: active ? 'bold' : 'normal', color: active ? '#1A5276' : '#666', fontSize: '14px' }),
  th: { padding: '10px', textAlign: 'left', color: '#1A5276', fontSize: '13px' },
  td: { padding: '10px', fontSize: '14px', borderBottom: '1px solid #f0f0f0' },
};

const now = new Date();
const EXPENSE_CATS = ['Feed', 'Medication', 'VetFee', 'Equipment', 'Labour', 'Transport', 'Other'];

export default function FinancialPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [incomeForm, setIncomeForm] = useState({ animalId: '', amount: '', buyerName: '', saleDate: now.toISOString().split('T')[0], notes: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Feed', description: '', amount: '', expenseDate: now.toISOString().split('T')[0], animalId: '', notes: '' });

  const { data: animals = [] } = useQuery({ queryKey: ['animals'], queryFn: getAllAnimals });
  const { data: pnl } = useQuery({ queryKey: ['pnl', month, year], queryFn: () => getProfitLoss({ month, year }) });
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });

  const incomeMut = useMutation({
    mutationFn: recordIncome,
    onSuccess: () => { qc.invalidateQueries(['pnl', month, year]); qc.invalidateQueries(['transactions']); qc.invalidateQueries(['animals']); setIncomeForm({ animalId: '', amount: '', buyerName: '', saleDate: now.toISOString().split('T')[0], notes: '' }); },
  });
  const expenseMut = useMutation({
    mutationFn: recordExpense,
    onSuccess: () => { qc.invalidateQueries(['pnl', month, year]); qc.invalidateQueries(['transactions']); setExpenseForm({ category: 'Feed', description: '', amount: '', expenseDate: now.toISOString().split('T')[0], animalId: '', notes: '' }); },
  });

  const setI = (k, v) => setIncomeForm(f => ({ ...f, [k]: v }));
  const setE = (k, v) => setExpenseForm(f => ({ ...f, [k]: v }));

  const maxBar = pnl ? Math.max(pnl.totalIncome, pnl.totalExpenses, 1) : 1;

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>💰 Financial Management</h1>

      <div style={{ borderBottom: '1px solid #eee', marginBottom: '24px', display: 'flex', gap: '4px' }}>
        {[
          { key: 'overview', label: '📊 Overview' },
          ...(hasRole('FarmOwner') ? [{ key: 'income', label: '+ Record Income' }] : []),
          ...(hasRole('FarmOwner') || hasRole('FarmManager') ? [{ key: 'expense', label: '+ Record Expense' }] : []),
        ].map(t => <button key={t.key} style={S.tab(tab === t.key)} onClick={() => setTab(t.key)}>{t.label}</button>)}
      </div>

      {tab === 'overview' && (
        <>
          {/* Month selector */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '90px' }} />
          </div>

          {pnl && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Income', value: pnl.totalIncome, color: '#1E8449' },
                  { label: 'Total Expenses', value: pnl.totalExpenses, color: '#E74C3C' },
                  { label: 'Net Profit', value: pnl.netProfit, color: pnl.isProfitable ? '#1E8449' : '#E74C3C' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ ...S.card, marginBottom: 0, borderLeft: `4px solid ${color}` }}>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#666' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', color }}>R{value?.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>

              {/* Simple bar chart */}
              <div style={{ ...S.card }}>
                <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Income vs Expenses — {MONTHS[month - 1]} {year}</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '24px', height: '120px' }}>
                  {[
                    { label: 'Income', value: pnl.totalIncome, color: '#1E8449' },
                    { label: 'Expenses', value: pnl.totalExpenses, color: '#E74C3C' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color }}>R{value?.toFixed(0)}</span>
                      <div style={{ width: '60px', height: `${Math.round((value / maxBar) * 100)}px`, background: color, borderRadius: '4px 4px 0 0', minHeight: '4px' }} />
                      <span style={{ fontSize: '12px', color: '#666' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Transactions */}
          <div style={S.card}>
            <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>All Transactions</h3>
            {transactions.length === 0 ? <p style={{ color: '#666' }}>No transactions yet.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#EAF2FB' }}>
                  {['Date', 'Type', 'Category', 'Description', 'Animal', 'Amount'].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr></thead>
                <tbody>{transactions.map(t => (
                  <tr key={t.financialId}>
                    <td style={S.td}>{new Date(t.transactionDate).toLocaleDateString()}</td>
                    <td style={S.td}><span style={{ fontSize: '11px', fontWeight: 'bold', color: t.transactionType === 'Income' ? '#1E8449' : '#E74C3C' }}>{t.transactionType}</span></td>
                    <td style={S.td}>{t.category}</td>
                    <td style={S.td}>{t.description}</td>
                    <td style={S.td}>{t.animalEarTag || '—'}</td>
                    <td style={S.td}><strong style={{ color: t.transactionType === 'Income' ? '#1E8449' : '#E74C3C' }}>R{t.amount?.toFixed(2)}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'income' && hasRole('FarmOwner') && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Record Animal Sale</h3>
          <form onSubmit={e => { e.preventDefault(); incomeMut.mutate({ ...incomeForm, animalId: parseInt(incomeForm.animalId), amount: parseFloat(incomeForm.amount) }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Animal (to be sold)</label>
                <select value={incomeForm.animalId} onChange={e => setI('animalId', e.target.value)} required style={S.input}>
                  <option value="">— Select animal —</option>
                  {animals.filter(a => a.status === 'Active').map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber} ({a.breed})</option>)}
                </select>
              </div>
              <div><label style={S.label}>Sale Amount (R)</label><input type="number" step="0.01" value={incomeForm.amount} onChange={e => setI('amount', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Buyer Name</label><input value={incomeForm.buyerName} onChange={e => setI('buyerName', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Sale Date</label><input type="date" value={incomeForm.saleDate} onChange={e => setI('saleDate', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Notes</label><input value={incomeForm.notes} onChange={e => setI('notes', e.target.value)} style={S.input} /></div>
            </div>
            {incomeMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to record income.</p>}
            <button type="submit" disabled={incomeMut.isPending} style={S.btn('#1E8449')}>
              {incomeMut.isPending ? 'Recording...' : 'Record Sale'}
            </button>
          </form>
        </div>
      )}

      {tab === 'expense' && (hasRole('FarmOwner') || hasRole('FarmManager')) && (
        <div style={S.card}>
          <h3 style={{ margin: '0 0 20px', color: '#1A5276' }}>Record Expense</h3>
          <form onSubmit={e => { e.preventDefault(); expenseMut.mutate({ ...expenseForm, amount: parseFloat(expenseForm.amount), animalId: expenseForm.animalId ? parseInt(expenseForm.animalId) : null }); }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={S.label}>Category</label>
                <select value={expenseForm.category} onChange={e => setE('category', e.target.value)} style={S.input}>
                  {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Description</label><input value={expenseForm.description} onChange={e => setE('description', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Amount (R)</label><input type="number" step="0.01" value={expenseForm.amount} onChange={e => setE('amount', e.target.value)} required style={S.input} /></div>
              <div><label style={S.label}>Date</label><input type="date" value={expenseForm.expenseDate} onChange={e => setE('expenseDate', e.target.value)} required style={S.input} /></div>
              <div>
                <label style={S.label}>Linked Animal (optional)</label>
                <select value={expenseForm.animalId} onChange={e => setE('animalId', e.target.value)} style={S.input}>
                  <option value="">— None —</option>
                  {animals.map(a => <option key={a.animalId} value={a.animalId}>{a.earTagNumber}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Notes</label><input value={expenseForm.notes} onChange={e => setE('notes', e.target.value)} style={S.input} /></div>
            </div>
            {expenseMut.isError && <p style={{ color: '#E74C3C', fontSize: '13px' }}>Failed to record expense.</p>}
            <button type="submit" disabled={expenseMut.isPending} style={S.btn('#E74C3C')}>
              {expenseMut.isPending ? 'Recording...' : 'Record Expense'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
