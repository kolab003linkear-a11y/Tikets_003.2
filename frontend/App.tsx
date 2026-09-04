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

// ============================================================
// PANTALLAS
// ============================================================

import AuthScreen from './src/screens/AuthScreen';
import AdminHubScreen from './src/screens/AdminHubScreen';
import StadiumScreen from './src/screens/StadiumScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import ParkingScreen from './src/screens/ParkingScreen';
import BusScreen from './src/screens/BusScreen';

import CinemaScreen from './src/screens/CinemaScreen';
import TheaterScreen from './src/screens/TheaterScreen';
import ConcertScreen from './src/screens/ConcertScreen';

import HomeScreen from './src/screens/HomeScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import SeatSelectionScreen from './src/screens/SeatSelectionScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import TicketScreen from './src/screens/TicketScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// ============================================================
// AUTH + TEMA
// ============================================================

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { colors, typography } from './src/theme';

// ============================================================
// NAVEGADORES
// ============================================================

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// PANTALLA DE EVENTOS
// ============================================================

function EventsScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.eventsContainer}>

      {/* ======================================================
          ENCABEZADO
          ====================================================== */}

      <View style={styles.eventsHeader}>

        <Ionicons
          name="calendar-outline"
          size={42}
          color={colors.primary}
        />

        <Text style={styles.eventsTitle}>
          Eventos
        </Text>

        <Text style={styles.eventsSubtitle}>
          Elige el tipo de evento que deseas disfrutar
        </Text>

      </View>

      {/* ======================================================
          CONCIERTOS
          ====================================================== */}

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

          <Ionicons
            name="musical-notes-outline"
            size={32}
            color={colors.primary}
          />

        </View>

        <View style={styles.eventTextContainer}>

          <Text style={styles.eventButtonTitle}>
            Conciertos
          </Text>

          <Text style={styles.eventButtonSubtitle}>
            Música, artistas y espectáculos en vivo
          </Text>

        </View>

        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.textSecondary}
        />

      </Pressable>

      {/* ======================================================
          TEATRO
          ====================================================== */}

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

          <Ionicons
            name="easel-outline"
            size={32}
            color={colors.primary}
          />

        </View>

        <View style={styles.eventTextContainer}>

          <Text style={styles.eventButtonTitle}>
            Teatro
          </Text>

          <Text style={styles.eventButtonSubtitle}>
            Obras, presentaciones y espectáculos
          </Text>

        </View>

        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.textSecondary}
        />

      </Pressable>

      {/* ======================================================
          CINE
          ====================================================== */}

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

          <Ionicons
            name="film-outline"
            size={32}
            color={colors.primary}
          />

        </View>

        <View style={styles.eventTextContainer}>

          <Text style={styles.eventButtonTitle}>
            Cine
          </Text>

          <Text style={styles.eventButtonSubtitle}>
            Películas, horarios y funciones
          </Text>

        </View>

        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.textSecondary}
        />

      </Pressable>

    </View>
  );
}

// ============================================================
// ERROR BOUNDARY
// ============================================================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {

  state = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return {
      hasError: true,
    };
  }

  render() {

    if (this.state.hasError) {

      return (
        <View style={styles.errorContainer}>

          <Text style={styles.errorText}>
            Se produjo un error en la app.
          </Text>

        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================
// HOME TABS
// ============================================================

function HomeTabs() {

  const { user } = useAuth();

  const canUseAdmin =
    user?.role === 'ADMIN' ||
    user?.role === 'SCANNER';

  return (

    <Tab.Navigator
      screenOptions={({ route }: any) => ({

        headerShown: false,

        tabBarAccessibilityLabel:
          `Pestaña ${route.name}`,

        tabBarActiveTintColor:
          colors.primary,

        tabBarInactiveTintColor:
          colors.textSecondary,

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

        tabBarIcon: ({
          color,
          size,
        }: {
          color: string;
          size: number;
        }) => {

          const iconMap = {

            Cartelera:
              'film-outline',

            Estadios:
              'football-outline',

            Parqueaderos:
              'car-outline',

            Buses:
              'bus-outline',

            Eventos:
              'calendar-outline',

            'Mis Tickets':
              'ticket-outline',

            Admin:
              'grid-outline',

          } as const;

          return (
            <Ionicons
              name={
                iconMap[
                  route.name as keyof typeof iconMap
                ] ?? 'apps-outline'
              }
              size={size}
              color={color}
            />
          );
        },

      })}
    >

      {/* ====================================================
          CARTELERA
          ==================================================== */}

      <Tab.Screen
        name="Cartelera"
        component={HomeScreen}
      />

      {/* ====================================================
          ESTADIOS
          ==================================================== */}

      <Tab.Screen
        name="Estadios"
        component={StadiumScreen}
      />

      {/* ====================================================
          PARQUEADEROS
          ==================================================== */}

      <Tab.Screen
        name="Parqueaderos"
        component={ParkingScreen}
      />

      {/* ====================================================
          BUSES
          ==================================================== */}

      <Tab.Screen
        name="Buses"
        component={BusScreen}
      />

      {/* ====================================================
          EVENTOS
          ==================================================== */}

      <Tab.Screen
        name="Eventos"
        component={EventsScreen}
      />

      {/* ====================================================
          MIS TICKETS
          ==================================================== */}

      <Tab.Screen
        name="Mis Tickets"
        component={MyTicketsScreen}
      />

      {/* ====================================================
          ADMIN
          ==================================================== */}

      {canUseAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminHubScreen}
        />
      )}

    </Tab.Navigator>
  );
}

// ============================================================
// CONTENIDO PRINCIPAL
// ============================================================

function AppContent() {

  const {
    restoring,
  } = useAuth();

  // ==========================================================
  // RESTAURANDO SESIÓN
  // ==========================================================

  if (restoring) {

    return (
      <View style={styles.placeholder}>

        <Text style={styles.placeholderText}>
          Cargando sesión...
        </Text>

      </View>
    );
  }

  // ==========================================================
  // NAVEGACIÓN PRINCIPAL
  // ==========================================================

  return (

    <ErrorBoundary>

      <NavigationContainer>

        <Stack.Navigator
          initialRouteName="HomeTabs"
          screenOptions={{
            headerShown: false,
          }}
        >

          {/* =================================================
              HOME
              ================================================= */}

          <Stack.Screen
            name="HomeTabs"
            component={HomeTabs}
          />

          {/* =================================================
              CINE
              ================================================= */}

          <Stack.Screen
            name="Cine"
            component={CinemaScreen}
          />

          {/* =================================================
              TEATRO
              ================================================= */}

          <Stack.Screen
            name="Teatro"
            component={TheaterScreen}
          />

          {/* =================================================
              CONCIERTOS
              ================================================= */}

          <Stack.Screen
            name="Conciertos"
            component={ConcertScreen}
          />

          {/* =================================================
              SELECCIÓN DE ASIENTOS / ENTRADAS
              ================================================= */}

          <Stack.Screen
            name="SeatSelection"
            component={SeatSelectionScreen}
          />

          {/* =================================================
              PAGO
              ================================================= */}

          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
          />

          {/* =================================================
              TICKET
              ================================================= */}

          <Stack.Screen
            name="Ticket"
            component={TicketScreen}
          />

          {/* =================================================
              PERFIL
              ================================================= */}

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
          />

          {/* =================================================
              ASISTENTE
              ================================================= */}

          <Stack.Screen
            name="Assistant"
            component={AssistantScreen}
          />

        </Stack.Navigator>

      </NavigationContainer>

    </ErrorBoundary>
  );
}

// ============================================================
// APP
// ============================================================

export default function App() {

  return (

    <AuthProvider>

      <AppContent />

    </AuthProvider>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  // ==========================================================
  // EVENTOS
  // ==========================================================

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

  // ==========================================================
  // BOTONES DE EVENTOS
  // ==========================================================

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
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  eventIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,

    backgroundColor:
      'rgba(14,165,233,0.12)',

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

  // ==========================================================
  // ERROR
  // ==========================================================

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

  // ==========================================================
  // CARGANDO
  // ==========================================================

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
