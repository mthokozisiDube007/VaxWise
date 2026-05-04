import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import api from '../api/axiosConfig';
import { getAllAnimals } from '../api/animalsApi';

const SEVERITIES = ['Mild', 'Moderate', 'Severe', 'Critical'];
const SEV_COLOR = { Mild: '#22C55E', Moderate: '#F59E0B', Severe: '#EF4444', Critical: '#EF4444' };
const EMPTY_FORM = { animalId: '', symptoms: '', severity: 'Mild', diagnosis: '', treatmentGiven: '', notes: '' };

export default function HealthScreen() {
  const [records, setRecords] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [r, a] = await Promise.all([
        api.get('/health').then(r => r.data),
        getAllAnimals(),
      ]);
      setRecords(r);
      setAnimals(a);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const save = async () => {
    if (!form.animalId || !form.symptoms.trim()) {
      Alert.alert('Validation', 'Select an animal and enter symptoms.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/health', { ...form, animalId: parseInt(form.animalId), recordDate: new Date().toISOString() });
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
        <View style={s.header}>
          <Text style={s.title}>Health Records</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={s.addBtnText}>+ Record</Text>
          </TouchableOpacity>
        </View>

        {records.length === 0 ? (
          <View style={s.emptyBox}>
            <Text style={{ color: '#22C55E', fontSize: 32, marginBottom: 8 }}>✓</Text>
            <Text style={{ color: '#4A4A42', fontSize: 15 }}>No health records yet</Text>
          </View>
        ) : records.map((r) => (
          <View key={r.healthRecordId || r.id} style={s.card}>
            <View style={s.cardTop}>
              <Text style={s.earTag}>{r.animalEarTag || `Animal #${r.animalId}`}</Text>
              <View style={[s.badge, { borderColor: (SEV_COLOR[r.severity] || '#8C8677') + '44' }]}>
                <Text style={[s.badgeText, { color: SEV_COLOR[r.severity] || '#8C8677' }]}>{r.severity}</Text>
              </View>
            </View>
            <Text style={s.symptoms}>{r.symptoms}</Text>
            {r.diagnosis ? <Text style={s.meta}>Dx: {r.diagnosis}</Text> : null}
            {r.treatmentGiven ? <Text style={s.meta}>Tx: {r.treatmentGiven}</Text> : null}
            <Text style={s.dateText}>{r.recordDate ? new Date(r.recordDate).toLocaleDateString('en-ZA') : ''}</Text>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Add Health Record</Text>
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

            <Text style={s.label}>Symptoms *</Text>
            <TextInput style={[s.input, { height: 80, textAlignVertical: 'top' }]} value={form.symptoms} onChangeText={v => setForm(f => ({ ...f, symptoms: v }))} placeholder="Describe symptoms…" placeholderTextColor="#4A5568" multiline />

            <Text style={s.label}>Severity</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {SEVERITIES.map(sv => (
                <TouchableOpacity key={sv} onPress={() => setForm(f => ({ ...f, severity: sv }))}
                  style={[s.chip, form.severity === sv && s.chipActive]}>
                  <Text style={[s.chipText, form.severity === sv && s.chipTextActive]}>{sv}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Diagnosis</Text>
            <TextInput style={s.input} value={form.diagnosis} onChangeText={v => setForm(f => ({ ...f, diagnosis: v }))} placeholder="FMD, Lumpy Skin…" placeholderTextColor="#4A5568" />

            <Text style={s.label}>Treatment Given</Text>
            <TextInput style={s.input} value={form.treatmentGiven} onChangeText={v => setForm(f => ({ ...f, treatmentGiven: v }))} placeholder="Ivermectin 5ml…" placeholderTextColor="#4A5568" />

            <Text style={s.label}>Notes</Text>
            <TextInput style={[s.input, { height: 70, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Additional notes…" placeholderTextColor="#4A5568" multiline />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#0B1F14" /> : <Text style={s.saveBtnText}>Save Record</Text>}
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
  card: { backgroundColor: '#1A2B1F', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1F3326' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  earTag: { fontSize: 16, fontWeight: '700', color: '#22C55E' },
  badge: { borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#162219' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  symptoms: { fontSize: 14, color: '#F0EDE8', marginBottom: 6 },
  meta: { fontSize: 12, color: '#8C8677', marginBottom: 2 },
  dateText: { fontSize: 11, color: '#4A4A42', marginTop: 6 },
  emptyBox: { alignItems: 'center', paddingVertical: 80 },
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
