// src/admin/screens/loginscreen/AdminLoginScreen.jsx
import React, { useState, useContext, useEffect } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Surface, Divider } from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, introduce email y contraseña');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Autenticar con Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtener datos del usuario desde Firestore
      const userDocRef = doc(db, "usuarios", userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Verificar si es administrador
      if (userDoc.exists() && userDoc.data().rol === 'admin') {
        // Usuario es administrador
        const userData = userDoc.data();
        
        // Crear objeto de usuario completo
        const userInfo = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData.nombre || 'Administrador',
          phone: userData.telefono || '',
          role: 'admin',
          profileImage: userData.profileImage || null,
          createdAt: userData.createdAt,
          notificationsEnabled: userData.notificationsEnabled || true
        };
        
        // Guardar en AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(userInfo));
        
        // Actualizar contexto de autenticación
        setUser(userInfo);
        
        // Navegar al panel de administrador
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminRoot' }],
        });
        
      } else {
        // No es administrador
        setError('No tienes permisos de administrador');
        
        // Cerrar sesión
        await auth.signOut();
      }
      
    } catch (error) {
      console.error("Error de inicio de sesión:", error);
      
      let mensaje = "No se pudo iniciar sesión";
      switch (error.code) {
        case "auth/user-not-found":
          mensaje = "No existe una cuenta con este correo electrónico";
          break;
        case "auth/wrong-password":
          mensaje = "Contraseña incorrecta";
          break;
        case "auth/invalid-email":
          mensaje = "Formato de correo electrónico inválido";
          break;
        case "auth/too-many-requests":
          mensaje = "Demasiados intentos fallidos. Intenta más tarde";
          break;
        case "auth/invalid-credential":
          mensaje = "Credenciales incorrectas. Verifica tu correo y contraseña";
          break;
      }
      
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  // Para crear el usuario admin predefinido
  const createAdminUser = async () => {
    try {
      const adminEmail = 'yohelitoalex79@gmail.com';
      const adminPassword = 'Foxygameryt1';
      
      let existingAdminUser = null;
      
      try {
        // Intentar iniciar sesión para ver si el usuario existe
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        existingAdminUser = userCredential.user;
      } catch (loginError) {
        // Si el usuario no existe, crearlo
        if (loginError.code === 'auth/user-not-found') {
          console.log("Creando nuevo usuario administrador...");
          const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          existingAdminUser = userCredential.user;
        } else {
          // Otros errores, solo registrar
          console.error("Error verificando admin:", loginError.code);
          return;
        }
      }
      
      if (existingAdminUser) {
        // Verificar si ya tiene rol de admin
        const userDocRef = doc(db, "usuarios", existingAdminUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists() || userDoc.data().rol !== 'admin') {
          // Crear o actualizar documento con rol admin
          await setDoc(userDocRef, {
            nombre: "Administrador",
            email: adminEmail,
            telefono: "",
            rol: "admin",
            createdAt: new Date(),
            notificationsEnabled: true
          });
          console.log("Documento de administrador actualizado");
        }
        
        // Cerrar sesión para permitir que el usuario inicie manualmente
        try {
          await auth.signOut();
          console.log("Configuración de admin completada y sesión cerrada");
        } catch (signOutError) {
          console.error("Error al cerrar sesión:", signOutError);
        }
      }
    } catch (error) {
      console.error("Error en createAdminUser:", error);
    }
  };
  
  // Llamar a esta función solo una vez al cargar la pantalla
  useEffect(() => {
    createAdminUser();
  }, []);

  const navigateToUserLogin = () => {
    navigation.navigate('UserLoginScreen');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4B6CB7', '#182848']}
        style={styles.header}
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Title style={styles.appTitle}>Gestión de Restaurante</Title>
        <Text style={styles.subtitle}>Panel de Administración</Text>
      </LinearGradient>

      <Surface style={styles.formContainer}>
        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          style={styles.input}
          mode="outlined"
          autoCapitalize="none"
          keyboardType="email-address"
          disabled={loading}
        />

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError('');
          }}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          disabled={loading}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          mode="contained"
          onPress={handleLogin}
          style={styles.loginButton}
          loading={loading}
          disabled={loading}
        >
          Iniciar Sesión
        </Button>

        <Divider style={styles.divider} />

        <View style={styles.userSection}>
          <Text style={styles.userText}>¿Eres usuario?</Text>
          <Button
            mode="text"
            onPress={navigateToUserLogin}
            style={styles.userButton}
            color="#4B6CB7"
            disabled={loading}
          >
            Acceso para usuarios
          </Button>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  // Mantener los estilos actuales
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  formContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    elevation: 4,
  },
  input: {
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#4B6CB7',
    paddingVertical: 6,
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  userSection: {
    alignItems: 'center',
  },
  userText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  userButton: {
    marginTop: 5,
  }
});

export default AdminLoginScreen;