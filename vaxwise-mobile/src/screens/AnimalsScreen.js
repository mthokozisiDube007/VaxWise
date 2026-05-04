import { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Modal, ScrollView, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { getAllAnimals, createAnimal, updateAnimal, deleteAnimal } from '../api/animalsApi';

const SPECIES = ['Cattle', 'Sheep', 'Goat', 'Pig', 'Poultry', 'Horse', 'Other'];
const STATUSES = ['Active', 'UnderTreatment', 'Quarantined', 'Deceased'];
const STATUS_COLOR = { Active: '#22C55E', UnderTreatment: '#EF4444', Quarantined: '#F59E0B', Deceased: '#4A4A42' };

const EMPTY_FORM = { earTag: '', species: 'Cattle', breed: '', ageMonths: '', weightKg: '', status: 'Active', gpsCoordinates: '' };

export default function AnimalsScreen() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setAnimals(await getAllAnimals()); } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setModalVisible(true); };
  const openEdit = (a) => {
    setForm({ earTag: a.earTag, species: a.species, breed: a.breed || '', ageMonths: String(a.ageMonths || ''), weightKg: String(a.weightKg || ''), status: a.status, gpsCoordinates: a.gpsCoordinates || '' });
    setEditing(a.animalId);
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.earTag.trim()) { Alert.alert('Validation', 'Ear tag is required.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, ageMonths: parseInt(form.ageMonths) || 0, weightKg: parseFloat(form.weightKg) || 0 };
      if (editing) await updateAnimal({ id: editing, ...payload });
      else await createAnimal(payload);
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const confirmDelete = (a) => {
    Alert.alert('Delete Animal', `Remove ${a.earTag}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteAnimal(a.animalId); load(); } },
    ]);
  };

  const filtered = animals.filter(a =>
    a.earTag.toLowerCase().includes(search.toLowerCase()) ||
    a.species.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Animals</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <TextInput
        style={s.search}
        placeholder="Search by ear tag or species…"
        placeholderTextColor="#4A5568"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(a) => String(a.animalId)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        ListEmptyComponent={<Text style={s.empty}>No animals found.</Text>}
        renderItem={({ item: a }) => (
          <View style={s.card}>
            <View style={s.cardTop}>
              <View>
                <Text style={s.earTag}>{a.earTag}</Text>
                <Text style={s.species}>{a.species} · {a.breed || 'Unknown breed'}</Text>
              </View>
              <View style={[s.statusBadge, { borderColor: (STATUS_COLOR[a.status] || '#8C8677') + '44' }]}>
                <Text style={[s.statusText, { color: STATUS_COLOR[a.status] || '#8C8677' }]}>{a.status}</Text>
              </View>
            </View>
            <View style={s.cardMeta}>
              <Text style={s.meta}>{a.ageMonths ? `${a.ageMonths} mo` : '—'}</Text>
              <Text style={s.metaDot}>·</Text>
              <Text style={s.meta}>{a.weightKg ? `${a.weightKg} kg` : '—'}</Text>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity style={s.editBtn} onPress={() => openEdit(a)}>
                <Text style={s.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(a)}>
                <Text style={s.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editing ? 'Edit Animal' : 'Add Animal'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={s.label}>Ear Tag *</Text>
            <TextInput style={s.input} value={form.earTag} onChangeText={v => setForm(f => ({ ...f, earTag: v }))} placeholder="ZA-001" placeholderTextColor="#4A5568" />

            <Text style={s.label}>Species</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {SPECIES.map(sp => (
                <TouchableOpacity key={sp} onPress={() => setForm(f => ({ ...f, species: sp }))}
                  style={[s.chip, form.species === sp && s.chipActive]}>
                  <Text style={[s.chipText, form.species === sp && s.chipTextActive]}>{sp}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>Breed</Text>
            <TextInput style={s.input} value={form.breed} onChangeText={v => setForm(f => ({ ...f, breed: v }))} placeholder="Nguni" placeholderTextColor="#4A5568" />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Age (months)</Text>
                <TextInput style={s.input} value={form.ageMonths} onChangeText={v => setForm(f => ({ ...f, ageMonths: v }))} keyboardType="numeric" placeholder="24" placeholderTextColor="#4A5568" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Weight (kg)</Text>
                <TextInput style={s.input} value={form.weightKg} onChangeText={v => setForm(f => ({ ...f, weightKg: v }))} keyboardType="decimal-pad" placeholder="350" placeholderTextColor="#4A5568" />
              </View>
            </View>

            <Text style={s.label}>Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {STATUSES.map(st => (
                <TouchableOpacity key={st} onPress={() => setForm(f => ({ ...f, status: st }))}
                  style={[s.chip, form.status === st && s.chipActive]}>
                  <Text style={[s.chipText, form.status === st && s.chipTextActive]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={s.label}>GPS Coordinates</Text>
            <TextInput style={s.input} value={form.gpsCoordinates} onChangeText={v => setForm(f => ({ ...f, gpsCoordinates: v }))} placeholder="-26.1234, 28.5678" placeholderTextColor="#4A5568" />

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
              {saving ? <ActivityIndicator color="#0B1F14" /> : <Text style={s.saveBtnText}>{editing ? 'Save Changes' : 'Add Animal'}</Text>}
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
  search: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#1A2B1F', borderRadius: 10, padding: 12, color: '#F0EDE8', fontSize: 14, borderWidth: 1, borderColor: '#2D4A34' },
  empty: { textAlign: 'center', color: '#4A4A42', marginTop: 40, fontSize: 14 },
  card: { backgroundColor: '#1A2B1F', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1F3326' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  earTag: { fontSize: 17, fontWeight: '700', color: '#22C55E' },
  species: { fontSize: 13, color: '#8C8677', marginTop: 2 },
  statusBadge: { borderWidth: 1, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, backgroundColor: '#162219' },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  meta: { fontSize: 13, color: '#8C8677' },
  metaDot: { color: '#4A4A42', marginHorizontal: 6 },
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: { flex: 1, backgroundColor: '#162219', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#2D4A34' },
  editBtnText: { color: '#F0EDE8', fontWeight: '600', fontSize: 13 },
  deleteBtn: { flex: 1, backgroundColor: '#1A0A0A', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#7F1D1D' },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },
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
