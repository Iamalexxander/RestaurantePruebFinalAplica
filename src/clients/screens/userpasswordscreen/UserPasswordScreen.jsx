// src/clients/screens/userpasswordscreen/UserPasswordScreen.jsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { TextInput, Button, Text, Title, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../../services/firebase';

const UserPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecoverPassword = async () => {
    // Validaciones
    if (!email) {
      setError('El email es obligatorio');
      return;
    }

    // Validar formato de email con una expresión regular simple
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Configuración del correo de recuperación (opcional)
      const actionCodeSettings = {
        url: "https://proyectomovilrestaurante.firebaseapp.com/__/auth/action",
        handleCodeInApp: true,
      };

      // Enviar correo de recuperación con Firebase
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      
      // Marcar como exitoso
      setSent(true);
      Alert.alert(
        "Email enviado",
        "Se ha enviado un correo con instrucciones para restablecer tu contraseña",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error);
      
      let mensaje = "No se pudo enviar el correo de recuperación";
      switch (error.code) {
        case "auth/user-not-found":
          mensaje = "No existe una cuenta con este correo electrónico";
          break;
        case "auth/invalid-email":
          mensaje = "Formato de correo electrónico inválido";
          break;
        case "auth/too-many-requests":
          mensaje = "Demasiados intentos. Intenta más tarde";
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
        <Title style={styles.headerTitle}>Recuperar Contraseña</Title>
        <Text style={styles.headerSubtitle}>Te enviaremos instrucciones a tu email</Text>
      </LinearGradient>

      <Surface style={styles.formContainer}>
        {!sent ? (
          <>
            <Text style={styles.instructionText}>
              Ingresa el email asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
            </Text>

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

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              mode="contained"
              onPress={handleRecoverPassword}
              style={styles.recoverButton}
              loading={loading}
              disabled={loading}
            >
              Enviar instrucciones
            </Button>
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>
              Hemos enviado instrucciones a {email}. 
              Por favor revisa tu bandeja de entrada y sigue las instrucciones.
            </Text>
            
            <Button
              mode="outlined"
              onPress={() => setSent(false)}
              style={styles.resetButton}
            >
              Enviar nuevamente
            </Button>
          </View>
        )}

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>¿Recordaste tu contraseña?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserLoginScreen')} disabled={loading}>
            <Text style={styles.link}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>¿No tienes una cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserSignUpScreen')} disabled={loading}>
            <Text style={styles.link}>Registrarse</Text>
          </TouchableOpacity>
        </View>
      </Surface>
    </ScrollView>
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
  instructionText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  recoverButton: {
    marginTop: 10,
    backgroundColor: '#FFC107',
    paddingVertical: 6,
  },
  resetButton: {
    marginTop: 15,
    borderColor: '#FFC107',
    borderWidth: 1,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    marginRight: 5,
  },
  link: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successText: {
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    color: '#444',
  },
});

export default UserPasswordScreen;