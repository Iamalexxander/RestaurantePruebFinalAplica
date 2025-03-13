import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  query,
  getDocs,
  where,
  orderBy,
  collection
} from "firebase/firestore";
import { db } from "../services/firebase";

export const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  const [platos, setPlatos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const platosRef = collection(db, "menu");

    const unsubscribe = onSnapshot(
      platosRef,
      (snapshot) => {
        const platosData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlatos(platosData);
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando platos:", error);
        setLoading(false);
      }
    );

    loadCategorias();
    loadReservas();
    loadPedidos();
    fetchPromociones(); // Cambio importante: Cargar promociones al inicio

    return () => unsubscribe();
  }, []);

  const loadCategorias = async () => {
    try {
      const storedCategorias = await AsyncStorage.getItem("categorias");
      if (storedCategorias) setCategorias(JSON.parse(storedCategorias));
    } catch (error) {
      console.error("Error loading categorias:", error);
    }
  };

  const loadReservas = async () => {
    try {
      const storedReservas = await AsyncStorage.getItem("reservas");
      if (storedReservas) setReservas(JSON.parse(storedReservas));
    } catch (error) {
      console.error("Error loading reservas:", error);
    }
  };

  const loadPedidos = async () => {
    try {
      const storedPedidos = await AsyncStorage.getItem("pedidos");
      if (storedPedidos) setPedidos(JSON.parse(storedPedidos));
    } catch (error) {
      console.error("Error loading pedidos:", error);
    }
  };

  const addPlato = async (platoData) => {
    try {
      const platoRef = collection(db, 'menu');
      const newPlato = await addDoc(platoRef, platoData);
      return { id: newPlato.id, ...platoData };
    } catch (error) {
      console.error("Error adding plato: ", error);
      throw error;
    }
  };

  const updatePlato = async (platoId, platoData) => {
    try {
      const platoRef = doc(db, 'menu', platoId);
      await updateDoc(platoRef, platoData);
      return { id: platoId, ...platoData };
    } catch (error) {
      console.error("Error updating plato: ", error);
      throw error;
    }
  };

  const deletePlato = async (platoId) => {
    try {
      const platoRef = doc(db, 'menu', platoId);
      await deleteDoc(platoRef);
      return true;
    } catch (error) {
      console.error("Error deleting plato: ", error);
      throw error;
    }
  };

  // Método fetchPromociones - Obtiene todas las promociones de Firebase
  const fetchPromociones = async () => {
    try {
      setLoading(true);
      const promocionesRef = collection(db, "promociones");
      const snapshot = await getDocs(promocionesRef);
      const promocionesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPromociones(promocionesData);
      // Guardar en AsyncStorage
      await AsyncStorage.setItem(
        "promociones",
        JSON.stringify(promocionesData)
      );
      setLoading(false);
    } catch (error) {
      console.error("Error fetching promociones:", error);
      setLoading(false);
    }
  };

  // Método addPromocion
  const addPromocion = async (promocionData) => {
    try {
      const promocionesRef = collection(db, "promociones");
      await addDoc(promocionesRef, {
        ...promocionData,
        activa: true,
        fechaCreacion: serverTimestamp(),
        usosActuales: 0,
        usoMaximo: promocionData.usoMaximo || 100,
      });

      // Actualizar el estado local
      await fetchPromociones();
      return true;
    } catch (error) {
      console.error("Error al añadir promoción:", error);
      throw error;
    }
  };

  // Método togglePromocion
  const togglePromocion = async (id) => {
    try {
      const promocionRef = doc(db, "promociones", id);
      const promocionDoc = await getDoc(promocionRef);

      if (promocionDoc.exists()) {
        const currentState = promocionDoc.data().activa;
        await updateDoc(promocionRef, {
          activa: !currentState,
        });

        // Actualizar el estado local
        await fetchPromociones();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error al cambiar estado de promoción:", error);
      throw error;
    }
  };

  // Método deletePromocion
  const deletePromocion = async (id) => {
    try {
      const promocionRef = doc(db, "promociones", id);
      await deleteDoc(promocionRef);
      
      // Actualizar el estado local
      await fetchPromociones();
      return true;
    } catch (error) {
      console.error("Error al eliminar promoción:", error);
      throw error;
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        platos,
        categorias,
        reservas,
        pedidos,
        promociones,
        loading,
        addPlato,
        updatePlato,
        deletePlato,
        addPromocion,
        togglePromocion,
        deletePromocion,
        fetchPromociones,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
