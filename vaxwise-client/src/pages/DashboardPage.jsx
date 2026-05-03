import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboardApi';
import { getUpcomingVaccinations } from '../api/vaccinationsApi';
import { downloadDalrrdReport } from '../api/reportsApi';
import { useAuth } from '../context/AuthContext';

const S = {
  card: { background: 'white', borderRadius: '14px', padding: '28px', boxShadow: '0 1px 4px rgba(11,31,20,0.05), 0 4px 16px rgba(11,31,20,0.05)', marginBottom: '24px' },
  th: { padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#F8F5F0', borderBottom: '1px solid #EDE8DF' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #F0EBE2', color: '#1A1A18' },
};

const riskColor = (level) => {
  if (level === 'Critical') return '#7F1D1D';
  if (level === 'High') return '#DC2626';
  if (level === 'Medium') return '#C9850B';
  return '#177A3E';
};

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'Farmer';

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  const { data: dash = {}, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
  const { data: upcoming = [] } = useQuery({ queryKey: ['upcoming'], queryFn: getUpcomingVaccinations });

  const handleDownloadReport = async () => {
    setReportLoading(true);
    setReportError('');
    try {
      await downloadDalrrdReport();
    } catch {
      setReportError('Report generation failed. Ensure a notifiable outbreak is active.');
    } finally {
      setReportLoading(false);
    }
  };

  if (isLoading) return (
    <div style={{ padding: '40px', color: '#8C8677', fontFamily: "'DM Sans', sans-serif" }}>Loading dashboard…</div>
  );

  const avgCompliance = dash.averageComplianceScore ?? 0;
  const coverageRate = dash.vaccinationCoverageRate ?? 0;
  const riskLvl = dash.farmRiskLevel || 'Low';
  const riskScore = dash.farmRiskScore ?? 0;

  const statsRow1 = [
    { label: 'Total Animals', value: dash.totalAnimals ?? 0, color: '#0B1F14', icon: '◈', sub: 'registered livestock' },
    { label: 'Active', value: dash.activeAnimals ?? 0, color: '#177A3E', icon: '●', sub: 'in good health' },
    { label: 'Under Treatment', value: dash.animalsUnderTreatment ?? 0, color: '#DC2626', icon: '●', sub: 'receiving care' },
    { label: 'Quarantined', value: dash.quarantinedAnimals ?? 0, color: '#7F1D1D', icon: '◉', sub: 'isolated animals' },
  ];

  const statsRow2 = [
    {
      label: 'Avg Compliance', value: `${avgCompliance}%`,
      color: avgCompliance >= 80 ? '#177A3E' : avgCompliance >= 60 ? '#C9850B' : '#DC2626',
      icon: '◎', sub: 'vaccination score',
    },
    {
      label: 'Overdue Vaccines', value: dash.overdueVaccinationsCount ?? 0,
      color: (dash.overdueVaccinationsCount ?? 0) > 0 ? '#DC2626' : '#177A3E',
      icon: '⚠', sub: 'need attention',
    },
    {
      label: 'Never Vaccinated', value: dash.neverVaccinatedCount ?? 0,
      color: (dash.neverVaccinatedCount ?? 0) > 0 ? '#C9850B' : '#177A3E',
      icon: '○', sub: 'no vaccination record',
    },
    {
      label: 'Under Withdrawal', value: dash.animalsUnderWithdrawal ?? 0,
      color: (dash.animalsUnderWithdrawal ?? 0) > 0 ? '#C9850B' : '#177A3E',
      icon: '⬡', sub: 'clearance pending',
    },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: '700', color: '#0B1F14', marginBottom: '4px' }}>
          Welcome back, {userName}
        </h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>
          VaxWise Biosecurity Dashboard · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Notifiable disease banner */}
      {dash.notifiableDiseaseDetected && (
        <div style={{ background: '#7F1D1D', color: 'white', borderRadius: '12px', padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span style={{ fontSize: '22px', marginTop: '1px' }}>⚠</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>
              DALRRD Notifiable Disease Detected: {dash.notifiableDiseaseName}
            </p>
            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
              Mandatory reporting deadline:{' '}
              <strong>
                {dash.dalrrdReportDeadline
                  ? new Date(dash.dalrrdReportDeadline).toLocaleString('en-ZA')
                  : 'N/A'}
              </strong>{' '}
              — Contact DALRRD immediately.
            </p>
            {reportError && <p style={{ fontSize: '12px', color: '#FCA5A5', marginBottom: '8px' }}>{reportError}</p>}
            <button
              onClick={handleDownloadReport}
              disabled={reportLoading}
              style={{ background: 'white', color: '#7F1D1D', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: reportLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: reportLoading ? 0.7 : 1 }}
            >
              {reportLoading ? 'Generating PDF…' : '⬇ Download DALRRD Report'}
            </button>
          </div>
        </div>
      )}

      {/* Outbreak banner (non-notifiable) */}
      {dash.activeOutbreakDetected && !dash.notifiableDiseaseDetected && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <span style={{ fontSize: '22px' }}>🚨</span>
          <div>
            <p style={{ fontWeight: '700', fontSize: '15px', color: '#B91C1C', marginBottom: '4px' }}>Active Outbreak Detected</p>
            <p style={{ fontSize: '13px', color: '#7F1D1D' }}>
              Multiple animals showing the same symptoms within 48 hours. Check the Health page for details.
            </p>
          </div>
        </div>
      )}

      {/* Stats row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {statsRow1.map(({ label, value, color, icon, sub }) => (
          <div key={label} style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#8C8677', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</p>
                <p style={{ fontSize: '34px', fontWeight: '700', color, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{value}</p>
                <p style={{ fontSize: '12px', color: '#B0A898', marginTop: '6px' }}>{sub}</p>
              </div>
              <span style={{ fontSize: '20px', color, opacity: 0.3 }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stats row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statsRow2.map(({ label, value, color, icon, sub }) => (
          <div key={label} style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#8C8677', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>{label}</p>
                <p style={{ fontSize: '34px', fontWeight: '700', color, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{value}</p>
                <p style={{ fontSize: '12px', color: '#B0A898', marginTop: '6px' }}>{sub}</p>
              </div>
              <span style={{ fontSize: '20px', color, opacity: 0.3 }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Risk score + Coverage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Biosecurity Risk Score */}
        <div style={{ ...S.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#0B1F14', marginBottom: '2px' }}>Farm Biosecurity Risk</h3>
              <p style={{ fontSize: '12px', color: '#8C8677' }}>Computed from vaccination, treatment & outbreak data</p>
            </div>
            <span style={{
              background: riskLvl === 'Low' ? '#F0FDF4' : riskLvl === 'Medium' ? '#FFFBEB' : '#FEF2F2',
              color: riskColor(riskLvl),
              fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px',
              border: `1px solid ${riskColor(riskLvl)}33`,
            }}>
              {riskLvl}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '40px', fontWeight: '700', fontFamily: "'Playfair Display', serif", color: riskColor(riskLvl) }}>{riskScore}</span>
            <span style={{ fontSize: '14px', color: '#8C8677' }}>/100</span>
          </div>
          <div style={{ height: '8px', background: '#F0EBE2', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${riskScore}%`, background: riskColor(riskLvl), borderRadius: '4px', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Vaccination Coverage */}
        <div style={{ ...S.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#0B1F14', marginBottom: '2px' }}>Vaccination Coverage</h3>
              <p style={{ fontSize: '12px', color: '#8C8677' }}>Animals vaccinated at least once in last 12 months</p>
            </div>
            <span style={{ fontSize: '22px', fontWeight: '700', fontFamily: "'Playfair Display', serif", color: coverageRate >= 80 ? '#177A3E' : coverageRate >= 60 ? '#C9850B' : '#DC2626' }}>
              {coverageRate}%
            </span>
          </div>
          <div style={{ height: '8px', background: '#F0EBE2', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
            <div style={{ height: '100%', width: `${coverageRate}%`, background: coverageRate >= 80 ? '#177A3E' : coverageRate >= 60 ? '#C9850B' : '#DC2626', borderRadius: '4px', transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#F8F5F0', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ fontSize: '11px', color: '#8C8677', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Total Events</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#0B1F14', fontFamily: "'Playfair Display', serif" }}>{dash.totalVaccinationEvents ?? 0}</p>
            </div>
            <div style={{ background: '#F8F5F0', borderRadius: '8px', padding: '10px 14px' }}>
              <p style={{ fontSize: '11px', color: '#8C8677', marginBottom: '4px', fontWeight: '600', textTransform: 'uppercase' }}>Certificates</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: '#0B1F14', fontFamily: "'Playfair Display', serif" }}>{dash.totalCertificatesIssued ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming vaccinations */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#0B1F14', marginBottom: '2px' }}>Upcoming Vaccinations</h2>
            <p style={{ fontSize: '13px', color: '#8C8677' }}>Due within the next 7 days</p>
          </div>
          <span style={{ background: upcoming.length > 0 ? '#FEF3C7' : '#F0FDF4', color: upcoming.length > 0 ? '#B45309' : '#15803D', fontSize: '12px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
            {upcoming.length} due
          </span>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#B0A898' }}>
            <p style={{ fontSize: '28px', marginBottom: '8px' }}>✓</p>
            <p style={{ fontSize: '14px' }}>No vaccinations due this week</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Animal', 'Vaccine', 'Due Date', 'GPS Location'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{upcoming.map(v => (
                <tr key={v.eventId}>
                  <td style={S.td}><strong style={{ color: '#0B1F14' }}>{v.animalEarTag}</strong></td>
                  <td style={S.td}>{v.vaccineName}</td>
                  <td style={{ ...S.td, color: new Date(v.nextDueDate) <= new Date() ? '#DC2626' : '#1A1A18', fontWeight: new Date(v.nextDueDate) <= new Date() ? '600' : '400' }}>
                    {new Date(v.nextDueDate).toLocaleDateString('en-ZA')}
                  </td>
                  <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#8C8677' }}>{v.gpsCoordinates}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
