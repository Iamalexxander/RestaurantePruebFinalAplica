// src/navigation/ClientNavigator.jsx
import React, { useMemo } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Importar pantallas de clientes principales
import UserHomeScreen from '../clients/screens/userhomescreen/UserHomeScreen';
import UserMenuScreen from '../clients/screens/usermenuscreen/UserMenuScreen';
import UserOrdersScreen from '../clients/screens/userodersscreen/UserOrdersScreen';
import UserProfileScreen from '../clients/screens/userprofilescreen/UserProfileScreen';
import UserReservationsScreen from '../clients/screens/userreservationsscreen/UserReservationsScreen';
import UserPagosScreen from '../clients/screens/userpagosscreen/UserPagosScreen';
import CartScreen from '../clients/screens/cartscreen/CartScreen';

// Importar pantallas relacionadas con el perfil
import UserPasswordScreen from '../clients/screens/userpasswordscreen/UserPasswordScreen';
import AddressList from '../clients/screens/addresslist/AddressList';
import Help from '../clients/screens/help/Help';
import AboutUs from '../clients/screens/aboutus/AboutUs';
import PrivacyPolicy from '../clients/screens/privacypolicy/PrivacyPolicy';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Componentes memoizados para mejorar rendimiento
const HeaderLogo = React.memo(() => (
  <Image
    source={require("../assets/ISTPET.png")}
    style={styles.headerLogo}
    fadeDuration={0}
  />
));

// Mapeamos iconos para evitar condicionales repetidos
const ICON_MAPPING = {
  'Inicio': ['home', 'home-outline'],
  'Menú': ['restaurant', 'restaurant-outline'],
  'Carrito': ['basket', 'basket-outline'],
  'Pedidos': ['cart', 'cart-outline'],
  'Reservas': ['calendar', 'calendar-outline'],
  'Pagos': ['wallet', 'card-outline'],
  'Perfil': ['person', 'person-outline']
};

// Crear un componente de título de cabecera memoizado
const HeaderTitle = React.memo(({ iconName, title }) => (
  <View style={styles.headerTitleContainer}>
    <Ionicons name={iconName} size={22} color="#000" style={styles.headerIcon} />
    <Text style={styles.headerText}>{title}</Text>
  </View>
));

// Navegador de perfil (incluye todas las pantallas relacionadas con el perfil)
const ProfileStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="UserProfile"
      screenOptions={{
        headerRight: () => <HeaderLogo />,
        headerTitleAlign: 'left',
        headerLeftContainerStyle: { paddingLeft: 10 },
        headerRightContainerStyle: { paddingRight: 10 },
        headerStyle: {
          backgroundColor: '#FFF',
        },
        headerTintColor: '#000',
      }}
    >
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="person" title="Mi Perfil" />,
        }}
      />
      <Stack.Screen 
        name="UserPasswordScreen" 
        component={UserPasswordScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="key" title="Cambiar Contraseña" />,
        }}
      />
      <Stack.Screen 
        name="AddressList" 
        component={AddressList} 
        options={{
          headerTitle: () => <HeaderTitle iconName="location" title="Mis Direcciones" />,
        }}
      />
      <Stack.Screen 
        name="Help" 
        component={Help} 
        options={{
          headerTitle: () => <HeaderTitle iconName="help-circle" title="Ayuda y Soporte" />,
        }}
      />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUs} 
        options={{
          headerTitle: () => <HeaderTitle iconName="information-circle" title="Sobre Nosotros" />,
        }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicy} 
        options={{
          headerTitle: () => <HeaderTitle iconName="document-text" title="Política de Privacidad" />,
        }}
      />
    </Stack.Navigator>
  );
};

const ClientNavigator = () => {
  const screenOptions = ({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      const iconName = ICON_MAPPING[route.name]?.[focused ? 0 : 1] || 'help-outline';
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    headerRight: () => <HeaderLogo />,
    headerTitleAlign: 'left',
    headerLeftContainerStyle: { paddingLeft: 10 },
    headerRightContainerStyle: { paddingRight: 10 },
    // Optimizaciones adicionales
    tabBarActiveTintColor: '#FF6B6B',
    tabBarInactiveTintColor: 'gray',
    tabBarHideOnKeyboard: true,
    lazy: true,
    headerShown: route.name !== 'Perfil' // Ocultar el header para el perfil (usa el de Stack)
  });

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen 
        name="Inicio" 
        component={UserHomeScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="home" title="Inicio" />,
        }}
      />
      <Tab.Screen 
        name="Menú" 
        component={UserMenuScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="restaurant" title="Menú" />,
        }}
      />
      <Tab.Screen 
        name="Carrito" 
        component={CartScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="basket" title="Carrito" />,
        }}
      />
      <Tab.Screen 
        name="Pedidos" 
        component={UserOrdersScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="cart" title="Pedidos" />,
        }}
      />
      <Tab.Screen 
        name="Reservas" 
        component={UserReservationsScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="calendar" title="Reservas" />,
        }}
      />
      <Tab.Screen 
        name="Pagos" 
        component={UserPagosScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="wallet" title="Pagos" />,
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={ProfileStack} 
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  headerLogo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default ClientNavigator;