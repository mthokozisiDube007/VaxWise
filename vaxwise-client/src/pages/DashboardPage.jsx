import { useQuery } from '@tanstack/react-query';
import { getAllAnimals } from '../api/animalsApi';
import { getUpcomingVaccinations } from '../api/vaccinationsApi';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'Farmer';

  const { data: animals = [] } = useQuery({
    queryKey: ['animals'],
    queryFn: getAllAnimals
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ['upcoming'],
    queryFn: getUpcomingVaccinations
  });

  const activeAnimals = animals.filter(a => a.status === 'Active').length;
  const underTreatment = animals.filter(a => a.status === 'UnderTreatment').length;
  const avgCompliance = animals.length > 0
    ? Math.round(animals.reduce((sum, a) => sum + a.complianceScore, 0) / animals.length)
    : 0;

  const cards = [
    { label: 'Total Animals', value: animals.length, color: '#1A5276' },
    { label: 'Active', value: activeAnimals, color: '#1E8449' },
    { label: 'Under Treatment', value: underTreatment, color: '#E74C3C' },
    { label: 'Avg Compliance', value: `${avgCompliance}%`, color: '#D4AC0D' },
  ];

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '8px' }}>
        Welcome back, {userName}
      </h1>
      <p style={{ color: '#666', marginBottom: '32px' }}>
        VaxWise Biosecurity Dashboard
      </p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {cards.map(({ label, value, color }) => (
          <div key={label} style={{
            background: 'white', padding: '24px', borderRadius: '12px',
            borderLeft: `4px solid ${color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{label}</p>
            <p style={{ margin: '8px 0 0', fontSize: '32px', fontWeight: 'bold', color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Vaccinations */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 16px', color: '#1A5276', fontSize: '16px' }}>
          💉 Upcoming Vaccinations (Next 7 Days)
        </h2>
        {upcoming.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px' }}>No vaccinations due in the next 7 days.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#EAF2FB' }}>
                {['Animal', 'Vaccine', 'Due Date', 'GPS'].map(h => (
                  <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#1A5276' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {upcoming.map((v) => (
                <tr key={v.eventId} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{v.animalEarTag}</td>
                  <td style={{ padding: '10px' }}>{v.vaccineName}</td>
                  <td style={{ padding: '10px' }}>{new Date(v.nextDueDate).toLocaleDateString()}</td>
                  <td style={{ padding: '10px' }}>{v.gpsCoordinates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}