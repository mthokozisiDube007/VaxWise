import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, Modal, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { getFarms, createFarm, getFarmWorkers, inviteWorker, removeWorker } from '../api/farmsApi';
import { useAuth } from '../context/AuthContext';

const EMPTY_FARM = { name: '', location: '', province: '', registrationNumber: '' };
const EMPTY_INVITE = { email: '', role: 'Worker' };

export default function FarmsScreen() {
  const { activeFarmId, selectFarm } = useAuth();
  const [farms, setFarms] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmModal, setFarmModal] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [farmForm, setFarmForm] = useState(EMPTY_FARM);
  const [inviteForm, setInviteForm] = useState(EMPTY_INVITE);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const f = await getFarms();
      setFarms(f);
      if (activeFarmId) {
        const w = await getFarmWorkers(activeFarmId).catch(() => []);
        setWorkers(w);
      }
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [activeFarmId]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const saveFarm = async () => {
    if (!farmForm.name.trim()) { Alert.alert('Validation', 'Farm name is required.'); return; }
    setSaving(true);
    try {
      await createFarm(farmForm);
      setFarmModal(false);
      setFarmForm(EMPTY_FARM);
      load();
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const sendInvite = async () => {
    if (!inviteForm.email.trim() || !activeFarmId) { Alert.alert('Validation', 'Enter an email and select a farm.'); return; }
    setSaving(true);
    try {
      await inviteWorker({ farmId: activeFarmId, ...inviteForm });
      setInviteModal(false);
      setInviteForm(EMPTY_INVITE);
      Alert.alert('Sent', 'Invitation sent successfully.');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Invite failed.');
    } finally { setSaving(false); }
  };

  const confirmRemove = (w) => {
    Alert.alert('Remove Worker', `Remove ${w.userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeWorker({ farmId: activeFarmId, userId: w.userId }); load(); } },
    ]);
  };

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator color="#22C55E" style={{ marginTop: 60 }} /></SafeAreaView>;

  const activeFarm = farms.find(f => f.farmId === activeFarmId);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}>
        <View style={s.header}>
          <Text style={s.title}>Farms</Text>
          <TouchableOpacity style={s.addBtn} onPress={() => setFarmModal(true)}>
            <Text style={s.addBtnText}>+ Farm</Text>
          </TouchableOpacity>
        </View>

        {/* Farm list */}
        {farms.map(f => (
          <TouchableOpacity key={f.farmId} style={[s.card, f.farmId === activeFarmId && s.cardActive]} onPress={() => selectFarm(f.farmId)}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.farmName}>{f.name}</Text>
                <Text style={s.farmMeta}>{f.location} · {f.province}</Text>
              </View>
              {f.farmId === activeFarmId && (
                <View style={s.activeBadge}><Text style={s.activeBadgeText}>Active</Text></View>
              )}
            </View>
            {f.registrationNumber ? <Text style={s.regNo}>Reg: {f.registrationNumber}</Text> : null}
          </TouchableOpacity>
        ))}

        {farms.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={{ color: '#4A4A42', fontSize: 14 }}>No farms yet. Create one above.</Text>
          </View>
        )}

        {/* Workers section */}
        {activeFarm && (
          <View>
            <View style={[s.header, { paddingTop: 8 }]}>
              <Text style={s.sectionTitle}>Workers — {activeFarm.name}</Text>
              <TouchableOpacity style={s.inviteBtn} onPress={() => setInviteModal(true)}>
                <Text style={s.inviteBtnText}>+ Invite</Text>
              </TouchableOpacity>
            </View>
            {workers.map(w => (
              <View key={w.userId} style={s.workerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.workerName}>{w.userName}</Text>
                  <Text style={s.workerEmail}>{w.email}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={s.roleBadge}><Text style={s.roleText}>{w.role}</Text></View>
                  <TouchableOpacity onPress={() => confirmRemove(w)}>
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {workers.length === 0 && (
              <Text style={{ color: '#4A4A42', fontSize: 13, paddingHorizontal: 20, paddingBottom: 16 }}>No workers yet.</Text>
            )}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Create Farm Modal */}
      <Modal visible={farmModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Create Farm</Text>
            <TouchableOpacity onPress={() => setFarmModal(false)}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {[['Farm Name *', 'name', 'Green Pastures Farm'], ['Location', 'location', 'Limpopo'], ['Province', 'province', 'Limpopo'], ['Reg. Number', 'registrationNumber', 'LP-2026-001']].map(([label, key, ph]) => (
              <View key={key}>
                <Text style={s.label}>{label}</Text>
                <TextInput style={s.input} value={farmForm[key]} onChangeText={v => setFarmForm(f => ({ ...f, [key]: v }))} placeholder={ph} placeholderTextColor="#4A5568" />
              </View>
            ))}
            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={saveFarm} disabled={saving}>
              {saving ? <ActivityIndicator color="#0B1F14" /> : <Text style={s.saveBtnText}>Create Farm</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Invite Worker Modal */}
      <Modal visible={inviteModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modal}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Invite Worker</Text>
            <TouchableOpacity onPress={() => setInviteModal(false)}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={s.label}>Email *</Text>
            <TextInput style={s.input} value={inviteForm.email} onChangeText={v => setInviteForm(f => ({ ...f, email: v }))} placeholder="worker@farm.co.za" placeholderTextColor="#4A5568" keyboardType="email-address" autoCapitalize="none" />

            <Text style={s.label}>Role</Text>
            {['Worker', 'Veterinarian', 'Manager'].map(r => (
              <TouchableOpacity key={r} onPress={() => setInviteForm(f => ({ ...f, role: r }))}
                style={[s.roleOption, inviteForm.role === r && s.roleOptionActive]}>
                <Text style={[s.roleOptionText, inviteForm.role === r && { color: '#0B1F14' }]}>{r}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.6 }, { marginTop: 20 }]} onPress={sendInvite} disabled={saving}>
              {saving ? <ActivityIndicator color="#0B1F14" /> : <Text style={s.saveBtnText}>Send Invitation</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F14' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#F0EDE8' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#F0EDE8' },
  addBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16 },
  addBtnText: { color: '#0B1F14', fontWeight: '700', fontSize: 14 },
  inviteBtn: { backgroundColor: '#1A2B1F', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#2D4A34' },
  inviteBtnText: { color: '#22C55E', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#1A2B1F', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1F3326' },
  cardActive: { borderColor: '#22C55E' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  farmName: { fontSize: 17, fontWeight: '700', color: '#F0EDE8' },
  farmMeta: { fontSize: 13, color: '#8C8677', marginTop: 2 },
  regNo: { fontSize: 12, color: '#4A4A42', marginTop: 6 },
  activeBadge: { backgroundColor: '#052E16', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, borderWidth: 1, borderColor: '#22C55E44' },
  activeBadgeText: { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  workerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1F3326' },
  workerName: { fontSize: 15, fontWeight: '600', color: '#F0EDE8' },
  workerEmail: { fontSize: 12, color: '#8C8677', marginTop: 2 },
  roleBadge: { backgroundColor: '#162219', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, borderWidth: 1, borderColor: '#2D4A34' },
  roleText: { fontSize: 11, color: '#8C8677', fontWeight: '600' },
  modal: { flex: 1, backgroundColor: '#0B1F14' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1F3326' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#F0EDE8' },
  closeBtn: { fontSize: 20, color: '#8C8677', padding: 4 },
  label: { fontSize: 12, fontWeight: '600', color: '#8C8677', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1A2B1F', borderWidth: 1, borderColor: '#2D4A34', borderRadius: 10, padding: 14, color: '#F0EDE8', fontSize: 15, marginBottom: 16 },
  roleOption: { borderWidth: 1, borderColor: '#2D4A34', borderRadius: 10, padding: 14, marginBottom: 10, backgroundColor: '#1A2B1F' },
  roleOptionActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  roleOptionText: { color: '#F0EDE8', fontWeight: '600', fontSize: 15 },
  saveBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 30 },
  saveBtnText: { color: '#0B1F14', fontWeight: '700', fontSize: 16 },
});
