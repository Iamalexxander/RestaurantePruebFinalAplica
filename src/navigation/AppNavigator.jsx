// src/navigation/AppNavigator.jsx
import React, { useContext, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { ActivityIndicator, View } from 'react-native';

import AdminNavigator from './AdminNavigator';
import ClientNavigator from './ClientNavigator';

import LoginScreen from '../admin/screens/loginscreen/AdminLoginScreen';
import UserLoginScreen from '../clients/screens/userloginscreen/UserLoginScreen';
import UserSignUpScreen from '../clients/screens/usersignupscreen/UserSignUpScreen';
import UserPasswordScreen from '../clients/screens/userpasswordscreen/UserPasswordScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  // Pantalla de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false
      }}
    >
      {!user ? (
        // No hay usuario autenticado - mostrar pantallas de login/registro
        <>
          <Stack.Screen
            name="UserLoginScreen"
            component={UserLoginScreen}
            options={{ title: 'Iniciar Sesión' }}
          />
          <Stack.Screen
            name="UserSignUpScreen"
            component={UserSignUpScreen}
            options={{ title: 'Registrarse' }}
          />
          <Stack.Screen
            name="UserPasswordScreen"
            component={UserPasswordScreen}
            options={{ title: 'Recuperar Contraseña' }}
          />
          <Stack.Screen
            name="AdminLoginScreen"
            component={LoginScreen}
            options={{ title: 'Admin Login' }}
          />
        </>
      ) : (
        // Usuario autenticado - mostrar la interfaz correspondiente según el rol
        user.role === 'admin' ? (
          // Navegación para administradores
          <Stack.Screen name="AdminRoot" component={AdminNavigator} />
        ) : (
          // Navegación para clientes/usuarios normales
          <Stack.Screen name="ClientRoot" component={ClientNavigator} />
        )
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;