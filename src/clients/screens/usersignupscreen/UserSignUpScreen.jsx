// src/clients/screens/usersignupscreen/UserSignUpScreen.jsx
import React, { useState, useContext } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Surface } from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';

const UserSignUpScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleSignUp = async () => {
    // Validaciones
    if (!name || !email || !password || !confirmPassword) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar formato de email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Actualizar el perfil con el nombre
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Crear documento del usuario en Firestore
      const userData = {
        nombre: name,
        email: email,
        telefono: phone || '',
        rol: "cliente",
        createdAt: new Date(),
        notificationsEnabled: true
      };

      await setDoc(doc(db, "usuarios", userCredential.user.uid), userData);
      
      // Preparar objeto para el contexto
      const userInfo = {
        id: userCredential.user.uid,
        email: email,
        name: name,
        phone: phone || '',
        role: 'cliente',
        notificationsEnabled: true
      };
      
      // Actualizar contexto de autenticación para mantener la sesión
      setUser(userInfo);
      
      // Mostrar mensaje de éxito
      Alert.alert(
        "Registro exitoso",
        "Tu cuenta ha sido creada correctamente",
        [{ text: "OK", onPress: () => navigation.navigate('ClientRoot') }]
      );
      
    } catch (error) {
      console.error("Error de registro:", error);
      
      let mensaje = "No se pudo crear la cuenta";
      switch (error.code) {
        case "auth/email-already-in-use":
          mensaje = "Este correo electrónico ya está registrado";
          break;
        case "auth/invalid-email":
          mensaje = "Formato de correo electrónico inválido";
          break;
        case "auth/weak-password":
          mensaje = "La contraseña es muy débil";
          break;
      }
      
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#FFC107', '#FF8E8E']}
        style={styles.header}
      >
        <Title style={styles.headerTitle}>Crear Cuenta</Title>
        <Text style={styles.headerSubtitle}>Únete para disfrutar de nuestros servicios</Text>
      </LinearGradient>

      <Surface style={styles.formContainer}>
        <TextInput
          label="Nombre completo"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError('');
          }}
          style={styles.input}
          mode="outlined"
          disabled={loading}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
          disabled={loading}
        />

        <TextInput
          label="Teléfono (opcional)"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          mode="outlined"
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

        <TextInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
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
          onPress={handleSignUp}
          style={styles.signupButton}
          loading={loading}
          disabled={loading}
        >
          Registrarse
        </Button>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserLoginScreen')} disabled={loading}>
            <Text style={styles.loginLink}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Perdiste la contraseña?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserPasswordScreen')} disabled={loading}>
            <Text style={styles.loginLink}>Recuperar Contraseña</Text>
          </TouchableOpacity>
        </View>

      </Surface>
    </ScrollView>
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
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
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
  signupButton: {
    marginTop: 10,
    backgroundColor: '#FFC107',
    paddingVertical: 6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    marginRight: 5,
  },
  loginLink: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
});

export default UserSignUpScreen;