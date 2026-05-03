import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboardApi';
import { getUpcomingVaccinations } from '../api/vaccinationsApi';
import { downloadDalrrdReport } from '../api/reportsApi';
import { useAuth } from '../context/AuthContext';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#0B1F14', borderBottom: '1px solid #2D4A34' },
  td: { padding: '13px 14px', fontSize: '14px', borderBottom: '1px solid #1F3326', color: '#F0EDE8' },
};

const riskColor = (level) => {
  if (level === 'Critical') return '#EF4444';
  if (level === 'High') return '#EF4444';
  if (level === 'Medium') return '#F59E0B';
  return '#22C55E';
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

  const complianceColor = avgCompliance >= 80 ? '#22C55E' : avgCompliance >= 60 ? '#F59E0B' : '#EF4444';
  const coverageColor = coverageRate >= 80 ? '#22C55E' : coverageRate >= 60 ? '#F59E0B' : '#EF4444';

  const statsRow1 = [
    { label: 'Total Animals', value: dash.totalAnimals ?? 0, color: '#F0EDE8', sub: 'registered livestock' },
    { label: 'Active', value: dash.activeAnimals ?? 0, color: '#22C55E', sub: 'in good health' },
    { label: 'Under Treatment', value: dash.animalsUnderTreatment ?? 0, color: '#EF4444', sub: 'receiving care' },
    { label: 'Quarantined', value: dash.quarantinedAnimals ?? 0, color: '#EF4444', sub: 'isolated animals' },
  ];

  const statsRow2 = [
    { label: 'Avg Compliance', value: `${avgCompliance}%`, color: complianceColor, sub: 'vaccination score' },
    { label: 'Overdue Vaccines', value: dash.overdueVaccinationsCount ?? 0, color: (dash.overdueVaccinationsCount ?? 0) > 0 ? '#EF4444' : '#22C55E', sub: 'need attention' },
    { label: 'Never Vaccinated', value: dash.neverVaccinatedCount ?? 0, color: (dash.neverVaccinatedCount ?? 0) > 0 ? '#F59E0B' : '#22C55E', sub: 'no vaccination record' },
    { label: 'Under Withdrawal', value: dash.animalsUnderWithdrawal ?? 0, color: (dash.animalsUnderWithdrawal ?? 0) > 0 ? '#F59E0B' : '#22C55E', sub: 'clearance pending' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>
          Welcome back, {userName}
        </h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>
          VaxWise Biosecurity Dashboard · {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Notifiable disease banner */}
      {dash.notifiableDiseaseDetected && (
        <div style={{ background: '#1A0A0A', border: '1px solid #7F1D1D', borderRadius: '12px', marginBottom: '20px', display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: '6px', background: '#EF4444', flexShrink: 0 }} />
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <p style={{ fontWeight: '700', fontSize: '15px', color: '#EF4444', marginBottom: '4px' }}>
              DALRRD Notifiable Disease Detected: {dash.notifiableDiseaseName}
            </p>
            <p style={{ fontSize: '13px', color: '#F0EDE8', opacity: 0.85, marginBottom: '12px' }}>
              Mandatory reporting deadline:{' '}
              <strong>{dash.dalrrdReportDeadline ? new Date(dash.dalrrdReportDeadline).toLocaleString('en-ZA') : 'N/A'}</strong>
              {' '}— Contact DALRRD immediately.
            </p>
            {reportError && <p style={{ fontSize: '12px', color: '#FCA5A5', marginBottom: '8px' }}>{reportError}</p>}
            <button
              onClick={handleDownloadReport}
              disabled={reportLoading}
              style={{ background: '#EF4444', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', cursor: reportLoading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: reportLoading ? 0.7 : 1 }}
            >
              {reportLoading ? 'Generating PDF…' : '⬇ Download DALRRD Report'}
            </button>
          </div>
        </div>
      )}

      {/* Outbreak banner (non-notifiable) */}
      {dash.activeOutbreakDetected && !dash.notifiableDiseaseDetected && (
        <div style={{ background: '#1A0A0A', border: '1px solid #7F1D1D', borderRadius: '12px', marginBottom: '20px', display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: '6px', background: '#F59E0B', flexShrink: 0 }} />
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontWeight: '700', fontSize: '15px', color: '#F59E0B', marginBottom: '4px' }}>Active Outbreak Detected</p>
            <p style={{ fontSize: '13px', color: '#F0EDE8', opacity: 0.8 }}>
              Multiple animals showing the same symptoms within 48 hours. Check the Health page for details.
            </p>
          </div>
        </div>
      )}

      {/* Stats row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {statsRow1.map(({ label, value, color, sub }) => (
          <div key={label} style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${color}` }}>
            <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>{label}</p>
            <p style={{ fontSize: '48px', fontWeight: '700', color, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{value}</p>
            <p style={{ fontSize: '12px', color: '#4A4A42', marginTop: '8px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Stats row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statsRow2.map(({ label, value, color, sub }) => (
          <div key={label} style={{ ...S.card, marginBottom: 0, borderTop: `3px solid ${color}` }}>
            <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '14px' }}>{label}</p>
            <p style={{ fontSize: '48px', fontWeight: '700', color, lineHeight: 1, fontFamily: "'Playfair Display', serif" }}>{value}</p>
            <p style={{ fontSize: '12px', color: '#4A4A42', marginTop: '8px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Risk score + Coverage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Biosecurity Risk */}
        <div style={{ ...S.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#F0EDE8', marginBottom: '2px' }}>Farm Biosecurity Risk</h3>
              <p style={{ fontSize: '12px', color: '#8C8677' }}>Computed from vaccination, treatment & outbreak data</p>
            </div>
            <span style={{ background: '#162219', color: riskColor(riskLvl), fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${riskColor(riskLvl)}44` }}>
              {riskLvl}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '56px', fontWeight: '700', fontFamily: "'Playfair Display', serif", color: riskColor(riskLvl), lineHeight: 1 }}>{riskScore}</span>
            <span style={{ fontSize: '14px', color: '#8C8677' }}>/100</span>
          </div>
          <div style={{ height: '6px', background: '#1F3326', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${riskScore}%`, background: riskColor(riskLvl), borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
        </div>

        {/* Vaccination Coverage */}
        <div style={{ ...S.card, marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: '#F0EDE8', marginBottom: '2px' }}>Vaccination Coverage</h3>
              <p style={{ fontSize: '12px', color: '#8C8677' }}>Animals vaccinated at least once in last 12 months</p>
            </div>
            <span style={{ fontSize: '28px', fontWeight: '700', fontFamily: "'Playfair Display', serif", color: coverageColor }}>
              {coverageRate}%
            </span>
          </div>
          <div style={{ height: '6px', background: '#1F3326', borderRadius: '3px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ height: '100%', width: `${coverageRate}%`, background: coverageColor, borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#162219', borderRadius: '8px', padding: '12px 16px', border: '1px solid #1F3326' }}>
              <p style={{ fontSize: '11px', color: '#8C8677', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Events</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#F0EDE8', fontFamily: "'Playfair Display', serif" }}>{dash.totalVaccinationEvents ?? 0}</p>
            </div>
            <div style={{ background: '#162219', borderRadius: '8px', padding: '12px 16px', border: '1px solid #1F3326' }}>
              <p style={{ fontSize: '11px', color: '#8C8677', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Certificates</p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#F0EDE8', fontFamily: "'Playfair Display', serif" }}>{dash.totalCertificatesIssued ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming vaccinations */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', color: '#F0EDE8', marginBottom: '2px' }}>Upcoming Vaccinations</h2>
            <p style={{ fontSize: '13px', color: '#8C8677' }}>Due within the next 7 days</p>
          </div>
          <span style={{ background: (upcoming.length > 0) ? '#431407' : '#052E16', color: (upcoming.length > 0) ? '#F59E0B' : '#22C55E', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' }}>
            {upcoming.length} due
          </span>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#4A4A42' }}>
            <p style={{ fontSize: '28px', marginBottom: '8px', color: '#22C55E' }}>✓</p>
            <p style={{ fontSize: '14px' }}>No vaccinations due this week</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Animal', 'Vaccine', 'Due Date', 'GPS Location'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr></thead>
              <tbody>{upcoming.map((v, i) => (
                <tr key={v.eventId} style={{ background: i % 2 === 0 ? '#1A2B1F' : '#162219' }}>
                  <td style={S.td}><strong style={{ color: '#22C55E' }}>{v.animalEarTag}</strong></td>
                  <td style={S.td}>{v.vaccineName}</td>
                  <td style={{ ...S.td, color: new Date(v.nextDueDate) <= new Date() ? '#EF4444' : '#F0EDE8', fontWeight: new Date(v.nextDueDate) <= new Date() ? '600' : '400' }}>
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
