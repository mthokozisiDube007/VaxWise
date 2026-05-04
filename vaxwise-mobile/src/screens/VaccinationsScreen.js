import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Modal, ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { getUpcomingVaccinations, captureVaccination, getHerdImmunity } from '../api/vaccinationsApi';
import { getAllAnimals } from '../api/animalsApi';

const EMPTY_FORM = { animalId: '', vaccineName: '', doseMl: '', batchNumber: '', veterinarianName: '', notes: '' };

export default function VaccinationsScreen() {
  const [upcoming, setUpcoming] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [herd, setHerd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [u, a, h] = await Promise.all([
        getUpcomingVaccinations(),
        getAllAnimals(),
        getHerdImmunity().catch(() => null),
      ]);
      setUpcoming(u);
      setAnimals(a);
      setHerd(h);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const save = async () => {
    if (!form.animalId || !form.vaccineName.trim()) {
      Alert.alert('Validation', 'Select an animal and enter vaccine name.');
      return;
    }
    setSaving(true);
    try {
      await captureVaccination({
        ...form,
        animalId: parseInt(form.animalId),
        doseMl: parseFloat(form.doseMl) || 0,
        vaccinationDate: new Date().toISOString(),
      });
      setModalVisible(false);
      setForm(EMPTY_FORM);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Vaccinations</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={s.addBtnText}>+ Capture</Text>
          </TouchableOpacity>
        </View>

        {/* Herd immunity */}
        {herd && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Herd Immunity</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={s.miniCard}>
                <Text style={s.miniLabel}>Estimated</Text>
                <Text style={[s.miniValue, { color: herd.estimatedImmunityPercent >= 70 ? '#22C55E' : '#F59E0B' }]}>
                  {herd.estimatedImmunityPercent?.toFixed(1)}%
                </Text>
              </View>
              <View style={s.miniCard}>
                <Text style={s.miniLabel}>Status</Text>
                <Text style={[s.miniValue, { color: herd.herdImmunityAchieved ? '#22C55E' : '#EF4444', fontSize: 14 }]}>
                  {herd.herdImmunityAchieved ? 'Achieved' : 'Not Achieved'}
                </Text>
              </View>
              <View style={s.miniCard}>
                <Text style={s.miniLabel}>Protected</Text>
                <Text style={[s.miniValue, { color: '#F0EDE8' }]}>{herd.vaccinatedCount}/{herd.totalAnimals}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Upcoming */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardTitle}>Upcoming (7 days)</Text>
            <View style={[s.badge, { borderColor: upcoming.length > 0 ? '#F59E0B44' : '#22C55E44' }]}>
              <Text style={{ color: upcoming.length > 0 ? '#F59E0B' : '#22C55E', fontSize: 12, fontWeight: '700' }}>
                {upcoming.length} due
              </Text>
            </View>
          </View>
          {upcoming.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ color: '#22C55E', fontSize: 24, marginBottom: 4 }}>✓</Text>
              <Text style={{ color: '#4A4A42', fontSize: 14 }}>All up to date</Text>
            </View>
          ) : upcoming.map((v) => (
            <View key={v.eventId} style={s.upcomingRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 14 }}>{v.animalEarTag}</Text>
                <Text style={{ color: '#8C8677', fontSize: 12, marginTop: 2 }}>{v.vaccineName}</Text>
              </View>
              <Text style={{ color: new Date(v.nextDueDate) <= new Date() ? '#EF4444' : '#F0EDE8', fontSize: 13, fontWeight: '600' }}>
                {new Date(v.nextDueDate).toLocaleDateString('en-ZA')}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Capture Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Capture Vaccination</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={s.label}>Animal *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {animals.map(a => (
                <TouchableOpacity key={a.animalId}
                  onPress={() => setForm(f => ({ ...f, animalId: String(a.animalId) }))}
                  style={[s.chip, form.animalId === String(a.animalId) && s.chipActive]}>
                  <Text style={[s.chipText, form.animalId === String(a.animalId) && s.chipTextActive]}>{a.earTag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Vaccine Name *</Text>
            <TextInput style={s.input} value={form.vaccineName} onChangeText={v => setForm(f => ({ ...f, vaccineName: v }))} placeholder="Lumpy Skin Vaccine" placeholderTextColor="#4A5568" />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Dose (ml)</Text>
                <TextInput style={s.input} value={form.doseMl} onChangeText={v => setForm(f => ({ ...f, doseMl: v }))} keyboardType="decimal-pad" placeholder="5" placeholderTextColor="#4A5568" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Batch No.</Text>
                <TextInput style={s.input} value={form.batchNumber} onChangeText={v => setForm(f => ({ ...f, batchNumber: v }))} placeholder="BCH-001" placeholderTextColor="#4A5568" />
              </View>
            </View>

            <Text style={s.label}>Veterinarian</Text>
            <TextInput style={s.input} value={form.veterinarianName} onChangeText={v => setForm(f => ({ ...f, veterinarianName: v }))} placeholder="Dr. Mokoena" placeholderTextColor="#4A5568" />

            <Text style={s.label}>Notes</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Optional notes…" placeholderTextColor="#4A5568" multiline />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#0B1F14" /> : <Text style={s.saveBtnText}>Save Vaccination</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F14' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#F0EDE8' },
  addBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#0B1F14', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#1A2B1F', borderRadius: 14, padding: 18, marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1F3326' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#F0EDE8' },
  badge: { borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#162219' },
  miniCard: { flex: 1, backgroundColor: '#162219', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#1F3326' },
  miniLabel: { fontSize: 10, color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  miniValue: { fontSize: 20, fontWeight: '700', color: '#F0EDE8' },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1F3326', marginTop: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  modal: { flex: 1, backgroundColor: '#0B1F14' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1F3326' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#F0EDE8' },
  closeBtn: { fontSize: 20, color: '#8C8677', padding: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#8C8677', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1A2B1F', borderWidth: 1, borderColor: '#2D4A34', borderRadius: 10, padding: 14, color: '#F0EDE8', fontSize: 15, marginBottom: 16 },
  chip: { borderWidth: 1, borderColor: '#2D4A34', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, marginRight: 8, backgroundColor: '#1A2B1F' },
  chipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  chipText: { color: '#8C8677', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#0B1F14' },
  saveBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 30 },
  saveBtnText: { color: '#0B1F14', fontWeight: '700', fontSize: 16 },
});
