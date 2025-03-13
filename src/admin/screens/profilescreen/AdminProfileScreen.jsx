// src/admin/screens/profilescreen/AdminProfileScreen.jsx
import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  TextInput,
  Divider,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';

const AdminProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile, logout } = useContext(AuthContext);
  
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    const success = await updateUserProfile({
      name,
      email,
      phone,
      profileImage,
    });

    if (success) {
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setEditing(false);
    } else {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', onPress: logout, style: 'destructive' },
      ]
    );
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tu galería');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2C3E50', '#4CA1AF']}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Avatar.Text 
              size={100} 
              label={(name || 'A').substring(0, 2).toUpperCase()} 
              backgroundColor="#4CA1AF"
              color="white"
            />
          )}
          
          {editing && (
            <TouchableOpacity 
              style={styles.editImageButton}
              onPress={pickImage}
            >
              <IconButton
                icon="camera"
                size={20}
                iconColor="white"
                style={{ margin: 0 }}
              />
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={styles.userName}>{user?.name || user?.username || 'Administrador'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'admin@restaurante.com'}</Text>
        <Text style={styles.roleText}>Administrador</Text>
        
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
            <Text style={styles.fieldLabel}>Nombre</Text>
            {editing ? (
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.name || user?.username || 'Administrador'}</Text>
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
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.email || 'admin@restaurante.com'}</Text>
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
              />
            ) : (
              <Text style={styles.fieldValue}>{user?.phone || 'No especificado'}</Text>
            )}
          </View>
        </Surface>
        
        <Surface style={styles.section}>
          <Text style={styles.sectionTitle}>Opciones de Administrador</Text>
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('Menu')}
          >
            <Text>Gestionar Menú</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('Promociones')}
          >
            <Text>Gestionar Promociones</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('Pedidos')}
          >
            <Text>Ver Pedidos Pendientes</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
        </Surface>
        
        <Surface style={styles.section}>
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text>Cambiar contraseña</Text>
            <IconButton icon="chevron-right" size={24} />
          </TouchableOpacity>
          
          <Divider style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.preferenceItem}
            onPress={() => Alert.alert('Información', 'Versión de la aplicación: 1.0.0')}
          >
            <Text>Acerca de la aplicación</Text>
            <IconButton icon="information-outline" size={24} />
          </TouchableOpacity>
        </Surface>
        
        {editing ? (
          <View style={styles.editActions}>
            <Button 
              mode="outlined" 
              onPress={() => setEditing(false)}
              style={styles.cancelButton}
            >
              Cancelar
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveProfile}
              style={styles.saveButton}
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
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CA1AF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
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
    marginBottom: 5,
  },
  roleText: {
    fontSize: 14,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 3,
    borderRadius: 15,
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
    borderColor: '#4CA1AF',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CA1AF',
  },
  logoutButton: {
    marginVertical: 20,
    borderColor: '#F44336',
  },
});

export default AdminProfileScreen;