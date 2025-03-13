// src/navigation/AdminNavigator.jsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Importar pantallas de admin
import MenuScreen from '../admin/screens/menuscreen/MenuScreen';
import PedidosScreen from '../admin/screens/pedidosscreen/PedidosScreen';
import ReservasScreen from '../admin/screens/reservas/ReservasScreen';
import PagosScreen from '../admin/screens/pagosscreen/PagosScreen';
import PromocionesScreen from '../admin/screens/promociones/PromocionesScreen';
import AdminProfileScreen from '../admin/screens/profilescreen/AdminProfileScreen';

const Tab = createBottomTabNavigator();

const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'Menu') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Reservas') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Confirmación') {
            iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
          } else if (route.name === 'Pagos') {
            iconName = focused ? 'cash' : 'cash-outline';
          } else if (route.name === 'Promociones') {
            iconName = focused ? 'pricetag' : 'pricetag-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Menu" component={MenuScreen} />
      <Tab.Screen name="Pedidos" component={PedidosScreen} />
      <Tab.Screen name="Reservas" component={ReservasScreen} />
      <Tab.Screen name="Pagos" component={PagosScreen} />
      <Tab.Screen name="Promociones" component={PromocionesScreen} />
      <Tab.Screen name="Perfil" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;