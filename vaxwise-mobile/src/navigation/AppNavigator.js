import { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AnimalsScreen from '../screens/AnimalsScreen';
import VaccinationsScreen from '../screens/VaccinationsScreen';
import HealthScreen from '../screens/HealthScreen';
import FarmsScreen from '../screens/FarmsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '🏠',
  Animals: '🐄',
  Vaccinations: '💉',
  Health: '🩺',
  Farms: '🌾',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0B1F14',
          borderTopColor: '#1F3326',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 64,
        },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#4A5568',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => (
          <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Animals" component={AnimalsScreen} />
      <Tab.Screen name="Vaccinations" component={VaccinationsScreen} />
      <Tab.Screen name="Health" component={HealthScreen} />
      <Tab.Screen name="Farms" component={FarmsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, ready } = useAuth();

  if (!ready) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
