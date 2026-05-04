import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoginStats, getAdminFarms, toggleFarmActive } from '../api/adminApi';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '12px 14px', fontSize: '13px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
};

const msColor = (ms) => ms <= 100 ? '#22C55E' : ms <= 300 ? '#F59E0B' : '#EF4444';
const msLabel = (ms) => ms <= 100 ? 'Fast' : ms <= 300 ? 'Acceptable' : 'Slow';
const scoreColor = (s) => s >= 75 ? '#22C55E' : s >= 50 ? '#F59E0B' : '#EF4444';

function StatCard({ label, value, sub, color, topBorder }) {
  return (
    <div style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${topBorder || color || '#22C55E'}` }}>
      <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>{label}</p>
      <p style={{ fontSize: '48px', fontWeight: '700', color: color || '#F0EDE8', lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{value}</p>
      {sub && <p style={{ fontSize: '12px', color: '#4A4A42', marginTop: '8px' }}>{sub}</p>}
    </div>
  );
}

function HourlyChart({ hours }) {
  if (!hours?.length) return null;
  const maxTotal = Math.max(...hours.map(h => h.total), 1);
  const now = new Date().getUTCHours();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '64px' }}>
        {hours.map(h => {
          const heightPct = Math.max((h.total / maxTotal) * 100, h.total > 0 ? 8 : 2);
          const isNow = h.hour === now;
          return (
            <div key={h.hour} title={`${h.hour}:00 — ${h.total} total (${h.successful} ok, ${h.failed} failed)`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'default' }}>
              <div style={{ width: '100%', height: `${heightPct}%`, background: h.failed > 0 ? '#EF4444' : isNow ? '#22C55E' : '#177A3E', borderRadius: '2px 2px 0 0', transition: 'height 0.6s ease', opacity: isNow ? 1 : 0.75 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {[0, 6, 12, 18, 23].map(h => (
          <span key={h} style={{ fontSize: '10px', color: '#4A4A42' }}>{h}:00</span>
        ))}
      </div>
    </div>
  );
}

function LoginMonitorTab() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['admin-login-stats'],
    queryFn: getLoginStats,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  if (isLoading) return <div style={{ padding: '40px', color: '#8C8677' }}>Loading login metrics…</div>;
  if (error) return <div style={{ padding: '40px', color: '#EF4444' }}>Failed to load admin data.</div>;

  const avgColor = msColor(stats.avgResponseTimeMs24h);

  return (
    <>
      <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Last 24 Hours</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Logins" value={stats.totalLogins24h} sub="authentication attempts" color="#F0EDE8" topBorder="#22C55E" />
        <StatCard label="Success Rate" value={`${stats.successRate24h}%`} sub={`${stats.successfulLogins24h} successful`}
          color={stats.successRate24h >= 90 ? '#22C55E' : stats.successRate24h >= 70 ? '#F59E0B' : '#EF4444'}
          topBorder={stats.successRate24h >= 90 ? '#22C55E' : stats.successRate24h >= 70 ? '#F59E0B' : '#EF4444'} />
        <StatCard label="Failed Attempts" value={stats.failedLogins24h} sub="invalid credentials"
          color={stats.failedLogins24h > 10 ? '#EF4444' : stats.failedLogins24h > 0 ? '#F59E0B' : '#22C55E'}
          topBorder={stats.failedLogins24h > 10 ? '#EF4444' : stats.failedLogins24h > 0 ? '#F59E0B' : '#22C55E'} />
        <StatCard label="Avg Response" value={`${stats.avgResponseTimeMs24h} ms`}
          sub={`${msLabel(stats.avgResponseTimeMs24h)} · peak ${stats.peakResponseTimeMs24h} ms`}
          color={avgColor} topBorder={avgColor} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#F0EDE8', marginBottom: '20px' }}>7-Day Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Total', value: stats.totalLogins7d },
              { label: 'Successful', value: stats.successfulLogins7d, color: '#22C55E' },
              { label: 'Failed', value: stats.failedLogins7d, color: stats.failedLogins7d > 0 ? '#EF4444' : '#22C55E' },
              { label: 'Unique Users', value: stats.uniqueUsers7d },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#162219', borderRadius: '8px', padding: '14px 16px', border: '1px solid #1F3326' }}>
                <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</p>
                <p style={{ fontSize: '28px', fontWeight: '700', fontFamily: "'Playfair Display', serif", color: color || '#F0EDE8' }}>{value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ flex: 1, height: '6px', background: '#1F3326', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${stats.successRate7d}%`, background: stats.successRate7d >= 90 ? '#22C55E' : '#F59E0B', borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#8C8677', whiteSpace: 'nowrap' }}>{stats.successRate7d}% success rate (7d)</span>
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#F0EDE8', marginBottom: '2px' }}>Hourly Activity</h3>
          <p style={{ fontSize: '12px', color: '#8C8677', marginBottom: '20px' }}>Last 24 hours · UTC · red = failures present</p>
          <HourlyChart hours={stats.hourlyBreakdown24h} />
          <div style={{ display: 'flex', gap: '16px', marginTop: '14px' }}>
            {[['#22C55E', 'Successful hour'], ['#EF4444', 'Failures detected'], ['#177A3E', 'Past hours']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
                <span style={{ fontSize: '11px', color: '#8C8677' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Recent Login Attempts</h3>
            <p style={{ fontSize: '12px', color: '#8C8677' }}>Last 100 attempts — newest first</p>
          </div>
          <span style={{ background: '#1A2B1F', color: '#8C8677', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: '1px solid #2D4A34' }}>
            {stats.recentLogs?.length ?? 0} entries
          </span>
        </div>
        {!stats.recentLogs?.length ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4A4A42' }}>
            <p style={{ fontSize: '14px' }}>No login attempts recorded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Time (UTC)', 'Email', 'Status', 'Role', 'Response', 'IP Address', 'User Agent'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log, i) => {
                  const color = msColor(log.responseTimeMs);
                  return (
                    <tr key={log.logId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677', whiteSpace: 'nowrap' }}>
                        {new Date(log.attemptedAt).toLocaleString('en-ZA', { timeZone: 'UTC', hour12: false })}
                      </td>
                      <td style={{ ...S.td, fontWeight: '600' }}>{log.email}</td>
                      <td style={S.td}>
                        {log.success
                          ? <span style={{ background: '#052E16', color: '#22C55E', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>Success</span>
                          : <span style={{ background: '#450A0A', color: '#EF4444', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }} title={log.failureReason ?? ''}>Failed</span>}
                      </td>
                      <td style={{ ...S.td, color: '#8C8677', fontSize: '12px' }}>{log.role || '—'}</td>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color }}>
                        {log.responseTimeMs} ms <span style={{ fontSize: '10px', marginLeft: '4px', color: '#4A4A42' }}>({msLabel(log.responseTimeMs)})</span>
                      </td>
                      <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{log.ipAddress}</td>
                      <td style={{ ...S.td, fontSize: '12px', color: '#4A4A42', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span title={log.userAgent}>{log.userAgent}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function FarmsTab() {
  const queryClient = useQueryClient();
  const [toggling, setToggling] = useState(null);

  const { data: farms, isLoading, error } = useQuery({
    queryKey: ['admin-farms'],
    queryFn: getAdminFarms,
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: toggleFarmActive,
    onMutate: (farmId) => setToggling(farmId),
    onSettled: () => {
      setToggling(null);
      queryClient.invalidateQueries({ queryKey: ['admin-farms'] });
    },
  });

  if (isLoading) return <div style={{ padding: '40px', color: '#8C8677' }}>Loading farms…</div>;
  if (error) return <div style={{ padding: '40px', color: '#EF4444' }}>Failed to load farms.</div>;

  const total = farms?.length ?? 0;
  const active = farms?.filter(f => f.isActive).length ?? 0;
  const inactive = total - active;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard label="Total Farms" value={total} sub="registered on platform" color="#F0EDE8" topBorder="#22C55E" />
        <StatCard label="Active" value={active} sub="currently operational" color="#22C55E" topBorder="#22C55E" />
        <StatCard label="Inactive" value={inactive} sub="deactivated by admin" color={inactive > 0 ? '#F59E0B' : '#8C8677'} topBorder={inactive > 0 ? '#F59E0B' : '#2D4A34'} />
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>All Farms</h3>
            <p style={{ fontSize: '12px', color: '#8C8677' }}>Click toggle to activate or deactivate a farm</p>
          </div>
          <span style={{ background: '#1A2B1F', color: '#8C8677', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: '1px solid #2D4A34' }}>
            {total} farms
          </span>
        </div>

        {!farms?.length ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4A4A42' }}>
            <p style={{ fontSize: '14px' }}>No farms registered yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Farm', 'Owner', 'Province', 'Type', 'Animals', 'Workers', 'Avg Compliance', 'Registered', 'Status', 'Action'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {farms.map((farm, i) => (
                  <tr key={farm.farmId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                    <td style={{ ...S.td, fontWeight: '600' }}>
                      {farm.farmName}
                      {farm.glnNumber && <div style={{ fontSize: '11px', color: '#4A4A42', marginTop: '2px' }}>GLN: {farm.glnNumber}</div>}
                    </td>
                    <td style={S.td}>
                      <div style={{ fontWeight: '600' }}>{farm.ownerName}</div>
                      <div style={{ fontSize: '11px', color: '#4A4A42' }}>{farm.ownerEmail}</div>
                    </td>
                    <td style={{ ...S.td, color: '#8C8677' }}>{farm.province}</td>
                    <td style={{ ...S.td, color: '#8C8677' }}>{farm.farmType}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>{farm.animalCount}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", textAlign: 'center' }}>{farm.workerCount}</td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#1F3326', borderRadius: '2px', overflow: 'hidden', minWidth: '60px' }}>
                          <div style={{ height: '100%', width: `${farm.averageComplianceScore}%`, background: scoreColor(farm.averageComplianceScore), borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: scoreColor(farm.averageComplianceScore), fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {farm.averageComplianceScore}%
                        </span>
                      </div>
                    </td>
                    <td style={{ ...S.td, fontSize: '12px', color: '#8C8677', whiteSpace: 'nowrap' }}>
                      {new Date(farm.createdAt).toLocaleDateString('en-ZA')}
                    </td>
                    <td style={S.td}>
                      <span style={{
                        background: farm.isActive ? '#052E16' : '#1C1008',
                        color: farm.isActive ? '#22C55E' : '#F59E0B',
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700'
                      }}>
                        {farm.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button
                        onClick={() => toggleMutation.mutate(farm.farmId)}
                        disabled={toggling === farm.farmId}
                        style={{
                          background: farm.isActive ? '#450A0A' : '#052E16',
                          color: farm.isActive ? '#EF4444' : '#22C55E',
                          border: `1px solid ${farm.isActive ? '#7F1D1D' : '#166534'}`,
                          borderRadius: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: '600',
                          cursor: toggling === farm.farmId ? 'wait' : 'pointer',
                          opacity: toggling === farm.farmId ? 0.6 : 1,
                          transition: 'opacity 0.2s',
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {toggling === farm.farmId ? '…' : farm.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('login');

  const tabs = [
    { id: 'login', label: 'Login Monitor' },
    { id: 'farms', label: 'Farm Management' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>
          Admin Panel
        </h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>Platform oversight and farm management</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', background: '#0B1F14', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '13px', fontWeight: '600',
              background: activeTab === tab.id ? '#22C55E' : 'transparent',
              color: activeTab === tab.id ? '#0B1F14' : '#8C8677',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'login' && <LoginMonitorTab />}
      {activeTab === 'farms' && <FarmsTab />}
    </div>
  );
}
