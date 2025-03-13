// CartContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);  
  const [loading, setLoading] = useState(true);

  // Cargar carrito del almacenamiento local
  useEffect(() => {
    const loadCart = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('userCart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } catch (error) {
        console.log('Error loading cart from storage:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, []);

  // Guardar carrito en el almacenamiento local cuando cambie
  useEffect(() => {
    if (!loading) {
      const saveCart = async () => {
        try {
          await AsyncStorage.setItem('userCart', JSON.stringify(cartItems));
        } catch (error) {
          console.log('Error saving cart to storage:', error);
        }
      };
      saveCart();
    }
  }, [cartItems, loading]);

  // Añadir un plato al carrito
  const addToCart = (plato, cantidad = 1) => {
    setCartItems((currentCart) => {
      const itemIndex = currentCart.findIndex((item) => item.id === plato.id);
      if (itemIndex >= 0) {
        const newCart = [...currentCart];
        newCart[itemIndex].cantidad += cantidad;
        return newCart;
      } else {
        return [...currentCart, { ...plato, cantidad }];
      }
    });
  };

  // Eliminar un plato del carrito
  const removeFromCart = (platoId) => {
    setCartItems((currentCart) => currentCart.filter((item) => item.id !== platoId));
  };

  // Actualizar la cantidad de un plato en el carrito
  const updateQuantity = (platoId, cantidad) => {
    if (cantidad <= 0) {
      removeFromCart(platoId);
      return;
    }
    setCartItems((currentCart) =>
      currentCart.map((item) =>
        item.id === platoId ? { ...item, cantidad } : item
      )
    );
  };

  // Limpiar el carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcular el total del carrito
  const getTotal = () => {
    return cartItems.reduce((total, item) => total + item.precio * item.cantidad, 0);
  };

  // Obtener el número de ítems en el carrito
  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.cantidad, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
