import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDashboard } from '../api/dashboardApi';
import { getUpcomingVaccinations } from '../api/vaccinationsApi';

const riskColor = (level) => {
  if (level === 'Critical' || level === 'High') return '#EF4444';
  if (level === 'Medium') return '#F59E0B';
  return '#22C55E';
};

function StatCard({ label, value, color, sub }) {
  return (
    <View style={[s.statCard, { borderTopColor: color }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'Farmer';
  const [dash, setDash] = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [d, u] = await Promise.all([getDashboard(), getUpcomingVaccinations()]);
      setDash(d);
      setUpcoming(u);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return (
    <SafeAreaView style={s.safe}>
      <ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  const avgCompliance = dash.averageComplianceScore ?? 0;
  const coverageRate = dash.vaccinationCoverageRate ?? 0;
  const riskLvl = dash.farmRiskLevel || 'Low';
  const riskScore = dash.farmRiskScore ?? 0;
  const complianceColor = avgCompliance >= 80 ? '#22C55E' : avgCompliance >= 60 ? '#F59E0B' : '#EF4444';
  const coverageColor = coverageRate >= 80 ? '#22C55E' : coverageRate >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.welcome}>Welcome, {userName.split(' ')[0]}</Text>
            <Text style={s.date}>{new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
          </View>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <Text style={s.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Notifiable disease banner */}
        {dash.notifiableDiseaseDetected && (
          <View style={s.alertBanner}>
            <View style={[s.alertBar, { backgroundColor: '#EF4444' }]} />
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={[s.alertTitle, { color: '#EF4444' }]}>
                DALRRD Alert: {dash.notifiableDiseaseName}
              </Text>
              <Text style={s.alertBody}>
                Report deadline: {dash.dalrrdReportDeadline
                  ? new Date(dash.dalrrdReportDeadline).toLocaleDateString('en-ZA')
                  : 'N/A'}
              </Text>
            </View>
          </View>
        )}

        {/* Outbreak banner */}
        {dash.activeOutbreakDetected && !dash.notifiableDiseaseDetected && (
          <View style={s.alertBanner}>
            <View style={[s.alertBar, { backgroundColor: '#F59E0B' }]} />
            <View style={{ flex: 1, padding: 14 }}>
              <Text style={[s.alertTitle, { color: '#F59E0B' }]}>Active Outbreak Detected</Text>
              <Text style={s.alertBody}>Multiple animals with same symptoms. Check Health tab.</Text>
            </View>
          </View>
        )}

        {/* Stats row 1 */}
        <View style={s.statsGrid}>
          <StatCard label="Total Animals" value={dash.totalAnimals ?? 0} color="#F0EDE8" sub="registered" />
          <StatCard label="Active" value={dash.activeAnimals ?? 0} color="#22C55E" sub="healthy" />
          <StatCard label="Treatment" value={dash.animalsUnderTreatment ?? 0} color="#EF4444" sub="receiving care" />
          <StatCard label="Quarantined" value={dash.quarantinedAnimals ?? 0} color="#EF4444" sub="isolated" />
        </View>

        {/* Stats row 2 */}
        <View style={s.statsGrid}>
          <StatCard label="Compliance" value={`${avgCompliance}%`} color={complianceColor} sub="avg score" />
          <StatCard label="Overdue" value={dash.overdueVaccinationsCount ?? 0} color={(dash.overdueVaccinationsCount ?? 0) > 0 ? '#EF4444' : '#22C55E'} sub="vaccines" />
          <StatCard label="Unvaccinated" value={dash.neverVaccinatedCount ?? 0} color={(dash.neverVaccinatedCount ?? 0) > 0 ? '#F59E0B' : '#22C55E'} sub="no record" />
          <StatCard label="Withdrawal" value={dash.animalsUnderWithdrawal ?? 0} color={(dash.animalsUnderWithdrawal ?? 0) > 0 ? '#F59E0B' : '#22C55E'} sub="pending" />
        </View>

        {/* Risk + Coverage */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Biosecurity Risk</Text>
            <View style={[s.badge, { borderColor: riskColor(riskLvl) + '44' }]}>
              <Text style={[s.badgeText, { color: riskColor(riskLvl) }]}>{riskLvl}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginVertical: 8 }}>
            <Text style={[s.bigNum, { color: riskColor(riskLvl) }]}>{riskScore}</Text>
            <Text style={s.unit}> / 100</Text>
          </View>
          <View style={s.bar}>
            <View style={[s.barFill, { width: `${riskScore}%`, backgroundColor: riskColor(riskLvl) }]} />
          </View>
        </View>

        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Vaccination Coverage</Text>
            <Text style={[s.bigNum, { color: coverageColor, fontSize: 28 }]}>{coverageRate}%</Text>
          </View>
          <View style={s.bar}>
            <View style={[s.barFill, { width: `${coverageRate}%`, backgroundColor: coverageColor }]} />
          </View>
          <View style={[s.statsGrid, { marginTop: 12 }]}>
            <View style={s.miniCard}>
              <Text style={s.statLabel}>Events</Text>
              <Text style={[s.statValue, { color: '#F0EDE8', fontSize: 22 }]}>{dash.totalVaccinationEvents ?? 0}</Text>
            </View>
            <View style={s.miniCard}>
              <Text style={s.statLabel}>Certificates</Text>
              <Text style={[s.statValue, { color: '#F0EDE8', fontSize: 22 }]}>{dash.totalCertificatesIssued ?? 0}</Text>
            </View>
          </View>
        </View>

        {/* Upcoming vaccinations */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Upcoming Vaccinations</Text>
            <View style={[s.badge, { borderColor: upcoming.length > 0 ? '#F59E0B44' : '#22C55E44' }]}>
              <Text style={{ color: upcoming.length > 0 ? '#F59E0B' : '#22C55E', fontSize: 12, fontWeight: '700' }}>
                {upcoming.length} due
              </Text>
            </View>
          </View>
          {upcoming.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ color: '#22C55E', fontSize: 24, marginBottom: 4 }}>✓</Text>
              <Text style={{ color: '#4A4A42', fontSize: 14 }}>No vaccinations due this week</Text>
            </View>
          ) : upcoming.map((v) => (
            <View key={v.eventId} style={s.upcomingRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14 }}>{v.animalEarTag}</Text>
                <Text style={{ color: '#8C8677', fontSize: 12, marginTop: 2 }}>{v.vaccineName}</Text>
              </View>
              <Text style={{
                color: new Date(v.nextDueDate) <= new Date() ? '#EF4444' : '#F0EDE8',
                fontSize: 13, fontWeight: '600',
              }}>
                {new Date(v.nextDueDate).toLocaleDateString('en-ZA')}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F14' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingBottom: 12,
  },
  welcome: { fontSize: 22, fontWeight: '700', color: '#F0EDE8' },
  date: { fontSize: 12, color: '#8C8677', marginTop: 2 },
  logoutBtn: { backgroundColor: '#1A2B1F', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2D4A34' },
  logoutText: { color: '#8C8677', fontSize: 13, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row', backgroundColor: '#1A0A0A', borderWidth: 1,
    borderColor: '#7F1D1D', borderRadius: 12, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden',
  },
  alertBar: { width: 5 },
  alertTitle: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  alertBody: { color: '#F0EDE8', fontSize: 12, opacity: 0.85 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginBottom: 4 },
  statCard: {
    width: '47%', backgroundColor: '#1A2B1F', borderRadius: 12, padding: 14,
    margin: '1.5%', borderTopWidth: 3, borderColor: '#1F3326', borderWidth: 1,
  },
  statLabel: { fontSize: 10, color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  statValue: { fontSize: 32, fontWeight: '700', lineHeight: 36 },
  statSub: { fontSize: 11, color: '#4A4A42', marginTop: 4 },
  card: {
    backgroundColor: '#1A2B1F', borderRadius: 14, padding: 18,
    marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1F3326',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0EDE8' },
  bigNum: { fontSize: 44, fontWeight: '700', color: '#F0EDE8' },
  unit: { fontSize: 14, color: '#8C8677' },
  badge: {
    borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10,
    backgroundColor: '#162219',
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  bar: { height: 6, backgroundColor: '#1F3326', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  miniCard: {
    width: '47%', backgroundColor: '#162219', borderRadius: 8, padding: 12,
    margin: '1.5%', borderWidth: 1, borderColor: '#1F3326',
  },
  upcomingRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#1F3326',
  },
  emptyBox: { alignItems: 'center', paddingVertical: 30 },
});
