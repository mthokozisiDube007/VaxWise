import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../api/authApi';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password.'); return; }
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(email.trim(), password);
      await login(data.token);
    } catch (e) {
      setError(e.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo area */}
          <View style={s.logoBox}>
            <View style={s.logoCircle}>
              <Text style={s.logoText}>V</Text>
            </View>
            <Text style={s.brand}>VaxWise</Text>
            <Text style={s.tagline}>Livestock Biosecurity Platform</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.sub}>Sign in to your account</Text>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="farmer@example.com"
              placeholderTextColor="#4A5568"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#4A5568"
              secureTextEntry
            />

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color="#0B1F14" />
                : <Text style={s.btnText}>Sign In</Text>}
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>© 2026 VaxWise · DALRRD Compliant</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B1F14' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoBox: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#22C55E', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoText: { fontSize: 28, fontWeight: '800', color: '#0B1F14' },
  brand: { fontSize: 28, fontWeight: '700', color: '#F0EDE8', marginBottom: 4 },
  tagline: { fontSize: 13, color: '#8C8677' },
  card: {
    backgroundColor: '#1A2B1F', borderRadius: 16, padding: 24,
    borderWidth: 1, borderColor: '#1F3326', marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#F0EDE8', marginBottom: 4 },
  sub: { fontSize: 13, color: '#8C8677', marginBottom: 24 },
  error: {
    backgroundColor: '#1A0A0A', borderWidth: 1, borderColor: '#7F1D1D',
    borderRadius: 8, padding: 12, color: '#FCA5A5', fontSize: 13, marginBottom: 16,
  },
  label: { fontSize: 12, fontWeight: '600', color: '#8C8677', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#0B1F14', borderWidth: 1, borderColor: '#2D4A34',
    borderRadius: 10, padding: 14, color: '#F0EDE8', fontSize: 15, marginBottom: 16,
  },
  btn: {
    backgroundColor: '#22C55E', borderRadius: 10, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#0B1F14', fontWeight: '700', fontSize: 16 },
  footer: { textAlign: 'center', color: '#4A4A42', fontSize: 12 },
});
