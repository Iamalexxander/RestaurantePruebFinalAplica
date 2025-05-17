import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  TextInput,
  Switch,
  Divider,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const UserProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile, logout } = useContext(AuthContext);
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    user?.notificationsEnabled || true
  );
  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setLoading(true);
    
    try {
      const success = await updateUserProfile({
        name,
        email,
        phone,
        notificationsEnabled,
      });

      if (success) {
        Alert.alert('Éxito', 'Perfil actualizado correctamente');
        setEditing(false);
      } else {
        Alert.alert('Error', 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert('Error', 'Ocurrió un error al actualizar el perfil. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          onPress: () => {
            try {
              logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'UserLoginScreen' }],
              });
            } catch (error) {
              console.error("Error during logout:", error);
              Alert.alert('Error', 'No se pudo cerrar sesión correctamente');
            }
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFC107", "#FFC160"]}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          <Avatar.Text 
            size={100} 
            label={(user?.name || "U").substring(0, 2).toUpperCase()} 
            backgroundColor="#FF8E8E"
            color="black"
          />
        </View>
        
        <Text style={styles.userName}>{user?.name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'sin-email'}</Text>
        
        {!editing && (
          <Button 
            mode="contained" 
            onPress={() => setEditing(true)}
            style={styles.editButton}
          >
            Editar Perfil
          </Button>
        )}
      </LinearGradient>

      <ScrollView style={styles.content}>
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nombre Completo</Text>
            {editing ? (
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
                disabled={loading}
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.name || 'No especificado'}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
            {editing ? (
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={true} // Email no editable
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.email || 'No especificado'}</Text>
            )}
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Teléfono</Text>
            {editing ? (
              <TextInput
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
                disabled={loading}
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.phone || 'No especificado'}</Text>
            )}
          </View>
        </Surface>
        
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          
          <View style={styles.preferenceItem}>
            <Text>Recibir notificaciones</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              disabled={!editing || loading}
              color="#FFC107"
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('UserPasswordScreen')}
            disabled={loading}
          >
            <Text>Cambiar contraseña</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
        </Surface>
        
        <Surface style={styles.section}>
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('AddressList')}
            disabled={loading}
          >
            <Text>Mis direcciones</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
        
        </Surface>
        
        <Surface style={styles.section}>
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('Help')}
            disabled={loading}
          >
            <Text>Ayuda y soporte</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('AboutUs')}
            disabled={loading}
          >
            <Text>Sobre nosotros</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('PrivacyPolicy')}
            disabled={loading}
          >
            <Text>Política de privacidad</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
        </Surface>
        
        {editing ? (
          <View style={styles.editActions}>
            <Button 
              mode="outlined" 
              onPress={() => {
                setEditing(false);
                // Revertir a valores originales
                setName(user?.name || '');
                setPhone(user?.phone || '');
                setNotificationsEnabled(user?.notificationsEnabled || true);
              }}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveProfile}
              style={styles.saveButton}
              loading={loading}
              disabled={loading}
            >
              Guardar
            </Button>
          </View>
        ) : (
          <Button 
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#F44336"
            disabled={loading}
          >
            Cerrar Sesión
          </Button>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 15,
  },
  editButton: {
    backgroundColor: 'black',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 15,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 16,
  },
  input: {
    backgroundColor: 'white',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  divider: {
    marginVertical: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: '#FFC107',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FFC107',
  },
  logoutButton: {
    marginVertical: 20,
    borderColor: '#F44336',
  },
});

export default UserProfileScreen;