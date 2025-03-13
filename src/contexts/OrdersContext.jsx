// src/contexts/OrdersContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { AuthContext } from './AuthContext';

export const OrdersContext = createContext();

export const OrdersProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar los pedidos del usuario actual o todos los pedidos si es admin
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    let ordersQuery;
    if (user.role === 'admin') {
      ordersQuery = query(collection(db, "pedidos"));
    } else {
      ordersQuery = query(collection(db, "pedidos"), where("userId", "==", user.id));
    }

    const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
      const ordersData = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to orders: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Agregar un nuevo pedido
  const addOrder = async (orderData) => {
    try {
      if (!user) throw new Error("Usuario no autenticado");

      const newOrder = {
        ...orderData,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        status: 'pending', // pendiente, preparando, listo
        paymentStatus: 'unpaid', // pagado, no pagado
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "pedidos"), newOrder);
      
      return { success: true, orderId: docRef.id };
    } catch (error) {
      console.error("Error adding order: ", error);
      return { success: false, error: error.message };
    }
  };

  // Actualizar estado de un pedido
  const updateOrderStatus = async (orderId, status) => {
    try {
      await updateDoc(doc(db, "pedidos", orderId), {
        status: status,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error("Error updating order status: ", error);
      return false;
    }
  };

  // Actualizar estado de pago de un pedido
  const updatePaymentStatus = async (orderId, paymentStatus) => {
    try {
      await updateDoc(doc(db, "pedidos", orderId), {
        paymentStatus: paymentStatus,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error("Error updating payment status: ", error);
      return false;
    }
  };

  // Eliminar un pedido
  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "pedidos", orderId));
      return true;
    } catch (error) {
      console.error("Error deleting order: ", error);
      return false;
    }
  };

  return (
    <OrdersContext.Provider
      value={{
        orders,
        loading,
        addOrder,
        updateOrderStatus,
        updatePaymentStatus,
        deleteOrder
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
};