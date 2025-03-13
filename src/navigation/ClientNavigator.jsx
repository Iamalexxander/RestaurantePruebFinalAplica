// src/navigation/ClientNavigator.jsx
import React from 'react';
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

// Navegador de perfil (incluye todas las pantallas relacionadas con el perfil)
const ProfileStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="UserProfile"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FF6B6B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
        options={{ title: 'Mi Perfil' }}
      />
      <Stack.Screen 
        name="UserPasswordScreen" 
        component={UserPasswordScreen} 
        options={{ title: 'Cambiar Contraseña' }}
      />
      <Stack.Screen 
        name="AddressList" 
        component={AddressList} 
        options={{ title: 'Mis Direcciones' }}
      />
      <Stack.Screen 
        name="Help" 
        component={Help} 
        options={{ title: 'Ayuda y Soporte' }}
      />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUs} 
        options={{ title: 'Sobre Nosotros' }}
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicy} 
        options={{ title: 'Política de Privacidad' }}
      />
    </Stack.Navigator>
  );
};

const ClientNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Inicio"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Menú') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Reservas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Pagos') {
            iconName = focused ? 'wallet' : 'card-outline'; 
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Carrito') {
            iconName = focused ? 'basket' : 'basket-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: 'gray',
        headerShown: route.name !== 'Perfil', // Ocultar el header para el perfil (usa el de Stack)
      })}
    >
      <Tab.Screen name="Inicio" component={UserHomeScreen} />
      <Tab.Screen name="Menú" component={UserMenuScreen} />
      <Tab.Screen name="Carrito" component={CartScreen} />
      <Tab.Screen name="Pedidos" component={UserOrdersScreen} />
      <Tab.Screen name="Reservas" component={UserReservationsScreen} />
      <Tab.Screen name="Pagos" component={UserPagosScreen} />
      <Tab.Screen name="Perfil" component={ProfileStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

export default ClientNavigator;