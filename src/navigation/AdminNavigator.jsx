import React, { useMemo } from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
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
  'Menu': ['restaurant', 'restaurant-outline'],
  'Pedidos': ['list', 'list-outline'],
  'Reservas': ['calendar', 'calendar-outline'],
  'Confirmación': ['checkmark-circle', 'checkmark-circle-outline'],
  'Pagos': ['cash', 'cash-outline'],
  'Promociones': ['pricetag', 'pricetag-outline'],
  'Perfil': ['person', 'person-outline']
};

// Crear un componente de título de cabecera memoizado
const HeaderTitle = React.memo(({ iconName, title }) => (
  <View style={styles.headerTitleContainer}>
    <Ionicons name={iconName} size={22} color="#000" style={styles.headerIcon} />
    <Text style={styles.headerText}>{title}</Text>
  </View>
));

const AdminNavigator = () => {
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
    tabBarActiveTintColor: '#157efb',
    tabBarInactiveTintColor: 'gray',
    tabBarHideOnKeyboard: true,
    lazy: true
  });

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen 
        name="Menu" 
        component={MenuScreen} 
        options={{
          headerTitle: () => <HeaderTitle iconName="restaurant" title="Menú" />,
        }}
      />
      <Tab.Screen 
        name="Pedidos" 
        component={PedidosScreen}
        options={{
          headerTitle: () => <HeaderTitle iconName="list" title="Pedidos" />,
        }}
      />
      <Tab.Screen 
        name="Reservas" 
        component={ReservasScreen}
        options={{
          headerTitle: () => <HeaderTitle iconName="calendar" title="Reservas" />,
        }}
      />
      <Tab.Screen 
        name="Pagos" 
        component={PagosScreen}
        options={{
          headerTitle: () => <HeaderTitle iconName="cash" title="Pagos" />,
        }}
      />
      <Tab.Screen 
        name="Promociones" 
        component={PromocionesScreen}
        options={{
          headerTitle: () => <HeaderTitle iconName="pricetag" title="Promociones" />,
        }}
      />
      <Tab.Screen 
        name="Perfil" 
        component={AdminProfileScreen}
        options={{
          headerTitle: () => <HeaderTitle iconName="person" title="Perfil" />,
        }}
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

export default AdminNavigator;