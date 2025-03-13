// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db, storage } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay una sesión guardada al iniciar la app
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Si hay un usuario autenticado, obtener datos adicionales de Firestore
          const userDocRef = doc(db, "usuarios", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Crear objeto completo del usuario
            const userInfo = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.nombre,
              phone: userData.telefono,
              role: userData.rol || 'cliente',
              profileImage: userData.profileImage,
              createdAt: userData.createdAt,
              notificationsEnabled: userData.notificationsEnabled || true
            };
            
            // Guardar en estado y en AsyncStorage
            setUser(userInfo);
            await AsyncStorage.setItem('userData', JSON.stringify(userInfo));
          } else {
            // Si no existe el documento, crear uno básico
            const basicUserData = {
              nombre: firebaseUser.displayName || '',
              email: firebaseUser.email,
              telefono: '',
              rol: 'cliente',
              createdAt: new Date(),
            };
            
            await setDoc(doc(db, "usuarios", firebaseUser.uid), basicUserData);
            
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: basicUserData.nombre,
              role: 'cliente'
            });
          }
        } else {
          // No hay usuario autenticado
          setUser(null);
          await AsyncStorage.removeItem('userData');
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error);
      } finally {
        setLoading(false);
      }
    });

    // Restaurar desde AsyncStorage si hay datos guardados
    const restoreUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error al restaurar sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
    
    return () => unsubscribe();
  }, []);

 // Versión mejorada de la función updateUserProfile en AuthContext.jsx
const updateUserProfile = async (userData) => {
  try {
    if (!user?.id) {
      throw new Error("No hay usuario autenticado");
    }
    
    const userRef = doc(db, "usuarios", user.id);
    
    // Preparar objeto de actualización
    let updateData = {
      nombre: userData.name,
      telefono: userData.phone || '',
      notificationsEnabled: userData.notificationsEnabled
    };
    
    // Si hay una nueva imagen de perfil
    if (userData.profileImage && userData.profileImage !== user.profileImage) {
      try {
        // Solo continuar si la URI es válida y comienza con 'file:' o 'content:'
        if (userData.profileImage.startsWith('file:') || userData.profileImage.startsWith('content:')) {
          // Convertir URI a blob
          const response = await fetch(userData.profileImage);
          const blob = await response.blob();
          
          // Crear referencia con nombre único basado en timestamp
          const storageRef = ref(storage, `profile_images/${user.id}_${Date.now()}`);
          
          // Subir con metadata específico
          const metadata = {
            contentType: 'image/jpeg',
          };
          
          await uploadBytes(storageRef, blob, metadata);
          
          // Obtener URL de descarga
          const downloadURL = await getDownloadURL(storageRef);
          
          // Agregar URL al objeto de actualización
          updateData.profileImage = downloadURL;
          
          console.log("Imagen subida correctamente:", downloadURL);
        } else {
          console.warn("URI de imagen inválida:", userData.profileImage);
          // Si ya hay una imagen existente, mantenerla
          if (user.profileImage) {
            updateData.profileImage = user.profileImage;
          }
        }
      } catch (imageError) {
        console.error("Error procesando la imagen:", imageError);
        // Continuar con la actualización sin la imagen
      }
    }
    
    // Actualizar documento en Firestore
    await updateDoc(userRef, updateData);
    
    // Actualizar estado del contexto y AsyncStorage
    const updatedUser = {
      ...user,
      name: userData.name,
      phone: userData.phone,
      profileImage: updateData.profileImage || user.profileImage,
      notificationsEnabled: userData.notificationsEnabled
    };
    
    setUser(updatedUser);
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
    
    return true;
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    return false;
  }
};

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      throw error;
    }
  };

  // Función para cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error("No hay usuario autenticado");
      }
      
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Cambiar contraseña
      await updatePassword(currentUser, newPassword);
      
      return true;
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        setUser, 
        loading, 
        updateUserProfile, 
        logout,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};