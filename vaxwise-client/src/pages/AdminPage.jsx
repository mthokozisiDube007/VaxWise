import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLoginStats, getAdminFarms, toggleFarmActive } from '../api/adminApi';

const th = 'px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50';
const td = 'px-4 py-3 text-sm text-slate-300 border-b border-slate-700/50';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

const msColor = (ms) => ms <= 100 ? 'text-teal-400' : ms <= 300 ? 'text-amber-400' : 'text-red-400';
const msColorHex = (ms) => ms <= 100 ? '#22C55E' : ms <= 300 ? '#F59E0B' : '#EF4444';
const msLabel = (ms) => ms <= 100 ? 'Fast' : ms <= 300 ? 'Acceptable' : 'Slow';
const scoreColor = (s) => s >= 75 ? '#22C55E' : s >= 50 ? '#F59E0B' : '#EF4444';
const scoreColorClass = (s) => s >= 75 ? 'text-teal-400' : s >= 50 ? 'text-amber-400' : 'text-red-400';

const topBorderStyle = (color) => ({ borderTop: `3px solid ${color || '#22C55E'}` });

function StatCard({ label, value, sub, color, topBorder }) {
  return (
    <div
      className="bg-slate-800 border border-slate-700 rounded-xl p-5"
      style={topBorderStyle(topBorder || color || '#22C55E')}
    >
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-3.5">{label}</p>
      <p className="text-5xl font-bold leading-none" style={{ color: color || undefined }} >{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-2">{sub}</p>}
    </div>
  );
}

function HourlyChart({ hours }) {
  if (!hours?.length) return null;
  const maxTotal = Math.max(...hours.map(h => h.total), 1);
  const now = new Date().getUTCHours();
  return (
    <div>
      <div className="flex items-end gap-[3px] h-16">
        {hours.map(h => {
          const heightPct = Math.max((h.total / maxTotal) * 100, h.total > 0 ? 8 : 2);
          const isNow = h.hour === now;
          const bg = h.failed > 0 ? '#EF4444' : isNow ? '#22C55E' : '#177A3E';
          return (
            <div
              key={h.hour}
              title={`${h.hour}:00 — ${h.total} total (${h.successful} ok, ${h.failed} failed)`}
              className="flex-1 flex flex-col items-center gap-0.5 cursor-default"
            >
              <div
                className="w-full rounded-t-sm transition-[height] duration-[600ms] ease-in-out"
                style={{
                  height: `${heightPct}%`,
                  background: bg,
                  opacity: isNow ? 1 : 0.75,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5">
        {[0, 6, 12, 18, 23].map(h => (
          <span key={h} className="text-[10px] text-slate-600">{h}:00</span>
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

  if (isLoading) return <div className="p-10 text-slate-400">Loading login metrics…</div>;
  if (error) return <div className="p-10 text-red-400">Failed to load admin data.</div>;

  const avgColorHex = msColorHex(stats.avgResponseTimeMs24h);
  const successRateColorHex = stats.successRate24h >= 90 ? '#22C55E' : stats.successRate24h >= 70 ? '#F59E0B' : '#EF4444';
  const failedColorHex = stats.failedLogins24h > 10 ? '#EF4444' : stats.failedLogins24h > 0 ? '#F59E0B' : '#22C55E';

  return (
    <>
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-[0.8px] mb-3">Last 24 Hours</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Logins" value={stats.totalLogins24h} sub="authentication attempts" color="#F0EDE8" topBorder="#22C55E" />
        <StatCard
          label="Success Rate"
          value={`${stats.successRate24h}%`}
          sub={`${stats.successfulLogins24h} successful`}
          color={successRateColorHex}
          topBorder={successRateColorHex}
        />
        <StatCard
          label="Failed Attempts"
          value={stats.failedLogins24h}
          sub="invalid credentials"
          color={failedColorHex}
          topBorder={failedColorHex}
        />
        <StatCard
          label="Avg Response"
          value={`${stats.avgResponseTimeMs24h} ms`}
          sub={`${msLabel(stats.avgResponseTimeMs24h)} · peak ${stats.peakResponseTimeMs24h} ms`}
          color={avgColorHex}
          topBorder={avgColorHex}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={card}>
          <h3 className="text-lg text-slate-50 mb-5">7-Day Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Total', value: stats.totalLogins7d },
              { label: 'Successful', value: stats.successfulLogins7d, color: '#22C55E' },
              { label: 'Failed', value: stats.failedLogins7d, color: stats.failedLogins7d > 0 ? '#EF4444' : '#22C55E' },
              { label: 'Unique Users', value: stats.uniqueUsers7d },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-800 rounded-lg p-3.5 border border-slate-700">
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide mb-2">{label}</p>
                <p className="text-3xl font-bold" style={{ color: color || undefined }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-[800ms] cubic-bezier-[0.4,0,0.2,1]"
                style={{
                  width: `${stats.successRate7d}%`,
                  background: stats.successRate7d >= 90 ? '#22C55E' : '#F59E0B',
                }}
              />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{stats.successRate7d}% success rate (7d)</span>
          </div>
        </div>

        <div className={card}>
          <h3 className="text-lg text-slate-50 mb-0.5">Hourly Activity</h3>
          <p className="text-xs text-slate-400 mb-5">Last 24 hours · UTC · red = failures present</p>
          <HourlyChart hours={stats.hourlyBreakdown24h} />
          <div className="flex gap-4 mt-3.5">
            {[['#22C55E', 'Successful hour'], ['#EF4444', 'Failures detected'], ['#177A3E', 'Past hours']].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[11px] text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={card}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl text-slate-50 mb-0.5">Recent Login Attempts</h3>
            <p className="text-xs text-slate-400">Last 100 attempts — newest first</p>
          </div>
          <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
            {stats.recentLogs?.length ?? 0} entries
          </span>
        </div>
        {!stats.recentLogs?.length ? (
          <div className="text-center py-10 text-slate-600">
            <p className="text-sm">No login attempts recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>{['Time (UTC)', 'Email', 'Status', 'Role', 'Response', 'IP Address', 'User Agent'].map(h => <th key={h} className={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log, i) => {
                  const msClass = msColor(log.responseTimeMs);
                  return (
                    <tr key={log.logId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                      <td className={`${td} font-mono text-xs text-slate-400 whitespace-nowrap`}>
                        {new Date(log.attemptedAt).toLocaleString('en-ZA', { timeZone: 'UTC', hour12: false })}
                      </td>
                      <td className={`${td} font-semibold`}>{log.email}</td>
                      <td className={td}>
                        {log.success
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/25">Success</span>
                          : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/25" title={log.failureReason ?? ''}>Failed</span>}
                      </td>
                      <td className={`${td} text-slate-400 text-xs`}>{log.role || '—'}</td>
                      <td className={`${td} font-mono text-xs ${msClass}`}>
                        {log.responseTimeMs} ms <span className="text-[10px] ml-1 text-slate-600">({msLabel(log.responseTimeMs)})</span>
                      </td>
                      <td className={`${td} font-mono text-xs text-slate-400`}>{log.ipAddress}</td>
                      <td className={`${td} text-xs text-slate-600 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}>
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

  if (isLoading) return <div className="p-10 text-slate-400">Loading farms…</div>;
  if (error) return <div className="p-10 text-red-400">Failed to load farms.</div>;

  const total = farms?.length ?? 0;
  const active = farms?.filter(f => f.isActive).length ?? 0;
  const inactive = total - active;

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Farms" value={total} sub="registered on platform" color="#F0EDE8" topBorder="#22C55E" />
        <StatCard label="Active" value={active} sub="currently operational" color="#22C55E" topBorder="#22C55E" />
        <StatCard
          label="Inactive"
          value={inactive}
          sub="deactivated by admin"
          color={inactive > 0 ? '#F59E0B' : '#8C8677'}
          topBorder={inactive > 0 ? '#F59E0B' : '#2D4A34'}
        />
      </div>

      <div className={card}>
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-xl text-slate-50 mb-0.5">All Farms</h3>
            <p className="text-xs text-slate-400">Click toggle to activate or deactivate a farm</p>
          </div>
          <span className="bg-slate-800 text-slate-400 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
            {total} farms
          </span>
        </div>

        {!farms?.length ? (
          <div className="text-center py-10 text-slate-600">
            <p className="text-sm">No farms registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Farm', 'Owner', 'Province', 'Type', 'Animals', 'Workers', 'Avg Compliance', 'Registered', 'Status', 'Action'].map(h => (
                    <th key={h} className={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {farms.map((farm, i) => (
                  <tr key={farm.farmId} className={i % 2 === 0 ? 'bg-slate-800' : 'bg-slate-800/60'}>
                    <td className={`${td} font-semibold`}>
                      {farm.farmName}
                      {farm.glnNumber && <div className="text-[11px] text-slate-600 mt-0.5">GLN: {farm.glnNumber}</div>}
                    </td>
                    <td className={td}>
                      <div className="font-semibold">{farm.ownerName}</div>
                      <div className="text-[11px] text-slate-600">{farm.ownerEmail}</div>
                    </td>
                    <td className={`${td} text-slate-400`}>{farm.province}</td>
                    <td className={`${td} text-slate-400`}>{farm.farmType}</td>
                    <td className={`${td} font-mono text-center`}>{farm.animalCount}</td>
                    <td className={`${td} font-mono text-center`}>{farm.workerCount}</td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-slate-700 rounded-sm overflow-hidden min-w-[60px]">
                          <div
                            className="h-full rounded-sm"
                            style={{ width: `${farm.averageComplianceScore}%`, background: scoreColor(farm.averageComplianceScore) }}
                          />
                        </div>
                        <span className={`text-xs font-semibold whitespace-nowrap ${scoreColorClass(farm.averageComplianceScore)}`}>
                          {farm.averageComplianceScore}%
                        </span>
                      </div>
                    </td>
                    <td className={`${td} text-xs text-slate-400 whitespace-nowrap`}>
                      {new Date(farm.createdAt).toLocaleDateString('en-ZA')}
                    </td>
                    <td className={td}>
                      {farm.isActive
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/25">Active</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">Inactive</span>}
                    </td>
                    <td className={td}>
                      <button
                        onClick={() => toggleMutation.mutate(farm.farmId)}
                        disabled={toggling === farm.farmId}
                        className={[
                          'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-opacity duration-200',
                          farm.isActive
                            ? 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/20'
                            : 'bg-teal-500/10 text-teal-400 border-teal-500/25 hover:bg-teal-500/20',
                          toggling === farm.farmId ? 'opacity-60 cursor-wait' : 'cursor-pointer',
                        ].join(' ')}
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
    <div className="text-slate-50">
      <div className="mb-7">
        <h1 className="text-4xl font-bold text-slate-50 mb-1">Admin Panel</h1>
        <p className="text-slate-400 text-sm">Platform oversight and farm management</p>
      </div>

      <div className="flex gap-1 mb-7 bg-slate-900 rounded-[10px] p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? 'px-4 py-2 rounded-lg text-sm font-semibold bg-teal-500 text-slate-900'
                : 'px-4 py-2 rounded-lg text-sm font-semibold text-slate-500 hover:text-slate-300'
            }
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
