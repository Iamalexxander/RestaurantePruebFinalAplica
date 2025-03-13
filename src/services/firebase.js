// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED, getDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBVLIrCCTraYEp-VG3d9wQMy7SYoPhzznw",
  authDomain: "proyectomovilrestaurante.firebaseapp.com",
  projectId: "proyectomovilrestaurante",
  storageBucket: "proyectomovilrestaurante.appspot.com", // Corregido el dominio incorrecto
  messagingSenderId: "710634737238",
  appId: "1:710634737238:web:719a2f240f53f959ef75f7"
};

const app = initializeApp(firebaseConfig);

// Inicializa Firestore con cache ilimitado para mejor rendimiento en móviles
const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED,
});

const auth = getAuth(app);
const storage = getStorage(app);

// Habilitar persistencia offline solo si el entorno lo permite
const enableOfflinePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence enabled');
  } catch (error) {
    console.warn('Error enabling offline persistence:', error.message);
  }
};

if (typeof window !== 'undefined' && 'indexedDB' in window) {
  enableOfflinePersistence();
}

export { db, auth, storage, getDoc, doc };