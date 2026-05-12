import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboardApi';
import { getUpcomingVaccinations } from '../api/vaccinationsApi';
import { downloadDalrrdReport } from '../api/reportsApi';
import { useAuth } from '../context/AuthContext';
import { useMobile } from '../hooks/useMobile';
import { Download, Calendar } from 'lucide-react';

const riskColor = (level) => {
  if (level === 'Critical' || level === 'High') return 'text-red-400';
  if (level === 'Medium') return 'text-amber-400';
  return 'text-teal-400';
};

const riskBorderColor = (level) => {
  if (level === 'Critical' || level === 'High') return 'border-red-500/30';
  if (level === 'Medium') return 'border-amber-500/30';
  return 'border-teal-500/30';
};

const riskBarColor = (level) => {
  if (level === 'Critical' || level === 'High') return 'bg-red-500';
  if (level === 'Medium') return 'bg-amber-500';
  return 'bg-teal-500';
};

const coverageBarColor = (rate) => rate >= 80 ? 'bg-teal-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500';
const coverageTextColor = (rate) => rate >= 80 ? 'text-teal-400' : rate >= 60 ? 'text-amber-400' : 'text-red-400';

export default function DashboardPage() {
  const { user } = useAuth();
  const isMobile = useMobile();
  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'Farmer';

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const { data: dash = {}, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ['upcoming'],
    queryFn: getUpcomingVaccinations,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const handleDownloadReport = async () => {
    setReportLoading(true); setReportError('');
    try { await downloadDalrrdReport(); }
    catch { setReportError('Report generation failed. Ensure a notifiable outbreak is active.'); }
    finally { setReportLoading(false); }
  };

  if (isLoading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 bg-slate-800 rounded-lg w-48" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-xl border border-slate-700" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-xl border border-slate-700" />)}
      </div>
    </div>
  );

  const avgCompliance = dash.averageComplianceScore ?? 0;
  const coverageRate = dash.vaccinationCoverageRate ?? 0;
  const riskLvl = dash.farmRiskLevel || 'Low';
  const riskScore = dash.farmRiskScore ?? 0;

  const statsRow1 = [
    { label: 'Total Animals', value: dash.totalAnimals ?? 0, sub: 'registered livestock', colorClass: 'text-slate-50' },
    { label: 'Active', value: dash.activeAnimals ?? 0, sub: 'in good health', colorClass: 'text-teal-400' },
    { label: 'Under Treatment', value: dash.animalsUnderTreatment ?? 0, sub: 'receiving care', colorClass: (dash.animalsUnderTreatment ?? 0) > 0 ? 'text-red-400' : 'text-teal-400' },
    { label: 'Quarantined', value: dash.quarantinedAnimals ?? 0, sub: 'isolated animals', colorClass: (dash.quarantinedAnimals ?? 0) > 0 ? 'text-red-400' : 'text-teal-400' },
  ];

  const statsRow2 = [
    { label: 'Avg Compliance', value: `${avgCompliance}%`, sub: 'vaccination score', colorClass: avgCompliance >= 80 ? 'text-teal-400' : avgCompliance >= 60 ? 'text-amber-400' : 'text-red-400' },
    { label: 'Overdue Vaccines', value: dash.overdueVaccinationsCount ?? 0, sub: 'need attention', colorClass: (dash.overdueVaccinationsCount ?? 0) > 0 ? 'text-red-400' : 'text-teal-400' },
    { label: 'Never Vaccinated', value: dash.neverVaccinatedCount ?? 0, sub: 'no vaccination record', colorClass: (dash.neverVaccinatedCount ?? 0) > 0 ? 'text-amber-400' : 'text-teal-400' },
    { label: 'Under Withdrawal', value: dash.animalsUnderWithdrawal ?? 0, sub: 'clearance pending', colorClass: (dash.animalsUnderWithdrawal ?? 0) > 0 ? 'text-amber-400' : 'text-teal-400' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-50 mb-1">
          Welcome back, {userName.split(' ')[0]}
        </h1>
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm text-slate-500">
            {isMobile
              ? new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
              : `VaxWise Dashboard · ${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          </span>
          <span className="inline-flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 rounded-full px-2.5 py-0.5 text-[11px] text-teal-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" style={{ animation: 'pulse 2s infinite' }} />
            LIVE · {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
          </span>
        </div>
      </div>

      {/* Notifiable disease banner */}
      {dash.notifiableDiseaseDetected && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl mb-5 flex overflow-hidden">
          <div className="w-1.5 bg-red-500 shrink-0" />
          <div className="p-4 flex-1">
            <p className="font-semibold text-red-400 mb-1">
              DALRRD Notifiable Disease Detected: {dash.notifiableDiseaseName}
            </p>
            <p className="text-sm text-slate-300 mb-3">
              Mandatory reporting deadline:{' '}
              <strong>{dash.dalrrdReportDeadline ? new Date(dash.dalrrdReportDeadline).toLocaleString('en-ZA') : 'N/A'}</strong>
              {' '}— Contact DALRRD immediately.
            </p>
            {reportError && <p className="text-xs text-red-300 mb-2">{reportError}</p>}
            <button onClick={handleDownloadReport} disabled={reportLoading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg text-xs font-semibold transition-colors">
              <Download size={13} /> {reportLoading ? 'Generating PDF…' : 'Download DALRRD Report'}
            </button>
          </div>
        </div>
      )}

      {/* Outbreak banner (non-notifiable) */}
      {dash.activeOutbreakDetected && !dash.notifiableDiseaseDetected && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl mb-5 flex overflow-hidden">
          <div className="w-1.5 bg-amber-500 shrink-0" />
          <div className="p-4">
            <p className="font-semibold text-amber-400 mb-1">Active Outbreak Detected</p>
            <p className="text-sm text-slate-300">Multiple animals showing the same symptoms within 48 hours. Check the Health page.</p>
          </div>
        </div>
      )}

      {/* Stats row 1 */}
      <div className={`grid gap-3 mb-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {statsRow1.map(({ label, value, sub, colorClass }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
            <p className={`text-4xl font-bold leading-none mb-1.5 ${colorClass}`}>{value}</p>
            <p className="text-xs text-slate-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Stats row 2 */}
      <div className={`grid gap-3 mb-5 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {statsRow2.map(({ label, value, sub, colorClass }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
            <p className={`text-4xl font-bold leading-none mb-1.5 ${colorClass}`}>{value}</p>
            <p className="text-xs text-slate-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Risk + Coverage */}
      <div className={`grid gap-4 mb-5 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Risk */}
        <div className={`bg-slate-800 border rounded-xl p-5 ${riskBorderColor(riskLvl)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-50 mb-0.5">Farm Biosecurity Risk</h3>
              <p className="text-xs text-slate-500">Computed from vaccination, treatment &amp; outbreak data</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${riskColor(riskLvl)} ${riskBorderColor(riskLvl)} bg-slate-900`}>
              {riskLvl}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-5xl font-bold leading-none ${riskColor(riskLvl)}`}>{riskScore}</span>
            <span className="text-sm text-slate-500">/100</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${riskBarColor(riskLvl)}`} style={{ width: `${riskScore}%` }} />
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-50 mb-0.5">Vaccination Coverage</h3>
              <p className="text-xs text-slate-500">Animals vaccinated at least once in last 12 months</p>
            </div>
            <span className={`text-2xl font-bold ${coverageTextColor(coverageRate)}`}>{coverageRate}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-all duration-700 ${coverageBarColor(coverageRate)}`} style={{ width: `${coverageRate}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Total Events</p>
              <p className="text-2xl font-bold text-slate-50">{dash.totalVaccinationEvents ?? 0}</p>
            </div>
            <div className="bg-slate-900 rounded-lg p-3 border border-slate-700">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">Certificates</p>
              <p className="text-2xl font-bold text-slate-50">{dash.totalCertificatesIssued ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming vaccinations */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-teal-400" />
            <div>
              <h2 className="text-sm font-semibold text-slate-50">Upcoming Vaccinations</h2>
              <p className="text-xs text-slate-500">Due within the next 7 days</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${upcoming.length > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' : 'bg-teal-500/10 text-teal-400 border border-teal-500/25'}`}>
            {upcoming.length} due
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl text-teal-400 mb-2">✓</p>
            <p className="text-sm text-slate-500">No vaccinations due this week</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Animal', 'Vaccine', 'Due Date', 'GPS Location'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wide bg-slate-900/50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {upcoming.map(v => (
                  <tr key={v.eventId} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                    <td className="px-4 py-3 text-sm font-semibold text-teal-400">{v.animalEarTag}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{v.vaccineName}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${new Date(v.nextDueDate) <= new Date() ? 'text-red-400' : 'text-slate-300'}`}>
                      {new Date(v.nextDueDate).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">{v.gpsCoordinates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
