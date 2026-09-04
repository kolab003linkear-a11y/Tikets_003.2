import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';

import {
  NavigationContainer,
  useNavigation,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import { Ionicons } from '@expo/vector-icons';

import AuthScreen from './src/screens/AuthScreen';
import AdminHubScreen from './src/screens/AdminHubScreen';
import StadiumScreen from './src/screens/StadiumScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import ParkingScreen from './src/screens/ParkingScreen';
import BusScreen from './src/screens/BusScreen';
import AdminParkingScreen from './src/screens/AdminParkingScreen';

import CinemaScreen from './src/screens/CinemaScreen';
import TheaterScreen from './src/screens/TheaterScreen';
import ConcertScreen from './src/screens/ConcertScreen';

import HomeScreen from './src/screens/HomeScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import SeatSelectionScreen from './src/screens/SeatSelectionScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import TicketScreen from './src/screens/TicketScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { colors, typography } from './src/theme';
import { ModuleProvider, useModules } from './src/modules/ModuleContext';
import { installWebAlertShim } from './src/utils/alertShim';

installWebAlertShim();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function EventsScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.eventsContainer}>
      <View style={styles.eventsHeader}>
        <Ionicons name="calendar-outline" size={42} color={colors.primary} />
        <Text style={styles.eventsTitle}>Eventos</Text>
        <Text style={styles.eventsSubtitle}>
          Elige el tipo de evento que deseas disfrutar
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.eventButton,
          pressed && styles.eventButtonPressed,
        ]}
        onPress={() => navigation.navigate('Conciertos')}
        accessibilityRole="button"
        accessibilityLabel="Abrir Conciertos"
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name="musical-notes-outline" size={32} color={colors.primary} />
        </View>
        <View style={styles.eventTextContainer}>
          <Text style={styles.eventButtonTitle}>Conciertos</Text>
          <Text style={styles.eventButtonSubtitle}>
            Música, artistas y espectáculos en vivo
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.eventButton,
          pressed && styles.eventButtonPressed,
        ]}
        onPress={() => navigation.navigate('Teatro')}
        accessibilityRole="button"
        accessibilityLabel="Abrir Teatro"
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name="easel-outline" size={32} color={colors.primary} />
        </View>
        <View style={styles.eventTextContainer}>
          <Text style={styles.eventButtonTitle}>Teatro</Text>
          <Text style={styles.eventButtonSubtitle}>
            Obras, presentaciones y espectáculos
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.eventButton,
          pressed && styles.eventButtonPressed,
        ]}
        onPress={() => navigation.navigate('Cine')}
        accessibilityRole="button"
        accessibilityLabel="Abrir Cine"
      >
        <View style={styles.eventIconContainer}>
          <Ionicons name="film-outline" size={32} color={colors.primary} />
        </View>
        <View style={styles.eventTextContainer}>
          <Text style={styles.eventButtonTitle}>Cine</Text>
          <Text style={styles.eventButtonSubtitle}>
            Películas, horarios y funciones
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Se produjo un error en la app.</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function HomeTabs() {
  const { user } = useAuth();
  const { isEnabled } = useModules();
  const canUseAdmin = user?.role === 'ADMIN' || user?.role === 'SCANNER';

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarAccessibilityLabel: `Pestaña ${route.name}`,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          const iconMap = {
            Inicio: 'home-outline',
            Estadios: 'football-outline',
            Parqueaderos: 'car-outline',
            Eventos: 'calendar-outline',
            'Mis Tickets': 'ticket-outline',
            Admin: 'grid-outline',
          } as const;

          return (
            <Ionicons
              name={iconMap[route.name as keyof typeof iconMap] ?? 'apps-outline'}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      {isEnabled('catalog') && <Tab.Screen name="Inicio" component={HomeScreen} />}
      {isEnabled('stadiums') && <Tab.Screen name="Estadios" component={StadiumScreen} />}
      {isEnabled('parking') && <Tab.Screen name="Parqueaderos" component={ParkingScreen} />}
      {isEnabled('events') && <Tab.Screen name="Eventos" component={EventsScreen} />}
      <Tab.Screen name="Mis Tickets" component={MyTicketsScreen} />
      {canUseAdmin && <Tab.Screen name="Admin" component={AdminHubScreen} />}
    </Tab.Navigator>
  );
}

function AppContent() {
  const { restoring } = useAuth();

  if (restoring) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <>
          <Stack.Navigator
            initialRouteName="HomeTabs"
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen name="Auth" component={AuthScreen} />
            <Stack.Screen name="Cine" component={CinemaScreen} />
            <Stack.Screen name="Teatro" component={TheaterScreen} />
            <Stack.Screen name="Conciertos" component={ConcertScreen} />
            <Stack.Screen name="EstadiosModulo" component={StadiumScreen} />
            <Stack.Screen name="ParqueaderosModulo" component={ParkingScreen} />
            <Stack.Screen name="Bus" component={BusScreen} />
            <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="Ticket" component={TicketScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AdminParking" component={AdminParkingScreen} />
            <Stack.Screen name="Assistant" component={AssistantScreen} />
          </Stack.Navigator>
          <HomeShortcut />
        </>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

function HomeShortcut() {
  const navigation = useNavigation<any>();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ir al inicio"
      style={({ pressed }) => [styles.homeShortcut, pressed && styles.homeShortcutPressed]}
      onPress={() => navigation.navigate('HomeTabs', { screen: 'Inicio' })}
    >
      <Ionicons name="home" size={20} color={colors.text} />
      <Text style={styles.homeShortcutText}>Inicio</Text>
    </Pressable>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ModuleProvider>
        <AppContent />
      </ModuleProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  eventsContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 55,
  },
  eventsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  eventsTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 12,
  },
  eventsSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  eventButton: {
    width: '100%',
    minHeight: 88,
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  eventButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(14,165,233,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventButtonTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  eventButtonSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  homeShortcut: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    minHeight: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  homeShortcutPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  homeShortcutText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: '700',
  },
});
