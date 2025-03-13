// src/clients/screens/userloginscreen/UserLoginScreen.jsx
import React, { useState, useContext } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { TextInput, Button, Text, Title, Surface, Divider } from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserLoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, introduce tu email y contraseña');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Validar formato de email básico
      if (!email.includes('@') || !email.includes('.')) {
        setError('El formato del correo electrónico no es válido');
        setLoading(false);
        return;
      }
      
      // Autenticar con Firebase
      console.log("Intentando autenticar con:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Autenticación exitosa:", userCredential.user.uid);
      
      // Obtener datos del usuario desde Firestore
      const userDoc = await getDoc(doc(db, "usuarios", userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Preparar objeto del usuario con todos los datos
        const userInfo = {
          id: userCredential.user.uid,
          email: userCredential.user.email,
          name: userData.nombre || '',
          phone: userData.telefono || '',
          role: userData.rol || 'cliente',
          profileImage: userData.profileImage || null,
          notificationsEnabled: userData.notificationsEnabled || true,
          createdAt: userData.createdAt
        };
        
        // Guardar en AsyncStorage y contexto
        await AsyncStorage.setItem('userData', JSON.stringify(userInfo));
        setUser(userInfo);
        
        // Mostrar mensaje y navegar
        Alert.alert('¡Bienvenido!', 'Has iniciado sesión correctamente', [
          {
            text: 'OK',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'ClientRoot' }],
              });
            }
          }
        ]);
      } else {
        throw new Error("No se encontraron datos de usuario");
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

  const handleSignUp = () => {
    navigation.navigate('UserSignUpScreen');
  };

  const handlePassword = () => {
    navigation.navigate('UserPasswordScreen');
  };

  const navigateToAdminLogin = () => {
    navigation.navigate('AdminLoginScreen');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={styles.header}
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Title style={styles.appTitle}>Restaurante App</Title>
        <Text style={styles.subtitle}>Explora nuestro menú y realiza pedidos</Text>
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
          keyboardType="email-address"
          autoCapitalize="none"
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

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>¿No tienes una cuenta?</Text>
          <TouchableOpacity onPress={handleSignUp} disabled={loading}>
            <Text style={styles.signupLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.signupContainer}>
          <Text style={styles.loginText}>¿Perdiste la contraseña?</Text>
          <TouchableOpacity onPress={handlePassword} disabled={loading}>
            <Text style={styles.signupLink}>  Recuperar Contraseña</Text>
          </TouchableOpacity>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.adminSection}>
          <Text style={styles.adminText}>¿Eres administrador?</Text>
          <Button
            mode="text"
            onPress={navigateToAdminLogin}
            style={styles.adminButton}
            color="#555"
            disabled={loading}
          >
            Acceso para administradores
          </Button>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signupText: {
    marginRight: 5,
  },
  signupLink: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 20,
    height: 1,
  },
  adminSection: {
    alignItems: 'center',
  },
  adminText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  adminButton: {
    marginTop: 5,
  },
  loginText: {
    marginRight: 5,
  }
});

export default UserLoginScreen;