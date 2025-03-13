// PedidosScreen.jsx corregido:

import React, { useState, useContext, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Alert, 
  ScrollView, 
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  RefreshControl
} from 'react-native';
import { 
  Title, 
  Button, 
  FAB, 
  Dialog, 
  Portal, 
  TextInput,
  Text, 
  Card, 
  Chip, 
  ActivityIndicator,
  Searchbar, 
  List, 
  IconButton, 
  Divider,
  SegmentedButtons, 
  Menu,
  Surface,
  Avatar,
  Badge
} from 'react-native-paper';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import { AuthContext } from '../../../contexts/AuthContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  FadeIn,
  SlideInRight
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, orderBy, where, onSnapshot, doc, updateDoc, Timestamp, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const ESTADOS_PEDIDOS = [
  {
    id: 'pendiente',
    name: 'Pendientes',
    icon: require('../../../assets/icons/pending.png'),
    color: '#FFA000'
  },
  {
    id: 'preparando',
    name: 'Preparando',
    icon: require('../../../assets/icons/cooking.png'),
    color: '#1976D2'
  },
  {
    id: 'listo',
    name: 'Listos',
    icon: require('../../../assets/icons/ready.png'),
    color: '#43A047'
  },
  {
    id: 'pagado',
    name: 'Pagados',
    icon: require('../../../assets/icons/paid.png'),
    color: '#9E9E9E'
  },
  {
    id: 'todos',
    name: 'Todos',
    icon: require('../../../assets/icons/all.png'),
    color: '#5D4037'
  }
];

const PedidosScreen = () => {
  const { 
    platos,
    loading: loadingContext, 
    promociones,
  } = useContext(DatabaseContext);
  
  const { user } = useContext(AuthContext);
  
  // Estado para pedidos y filtros
  const [pedidos, setPedidos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState('pendiente');
  const [notas, setNotas] = useState('');
  
  // Estado para promociones
  const [promoMenuVisible, setPromoMenuVisible] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  
  // Estado para animaciones y notificaciones
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  // Referencia para el botón de promoción
  const [promoButtonPositions, setPromoButtonPositions] = useState({});

  // Animación para el encabezado
  const scrollY = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 60 : 160),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  // Cargar datos desde Firebase
  useEffect(() => {
    setLoading(true);
    
    // Cargar mesas
    const loadMesas = async () => {
      try {
        const mesasRef = collection(db, 'mesas');
        const mesasSnap = await getDocs(mesasRef);
        const mesasData = mesasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMesas(mesasData);
      } catch (error) {
        console.error("Error cargando mesas:", error);
      }
    };
    
    // Cargar clientes
    const loadClientes = async () => {
      try {
        const clientesRef = collection(db, 'usuarios');
        const clientesQuery = query(clientesRef, where("rol", "==", "cliente"));
        const clientesSnap = await getDocs(clientesQuery);
        const clientesData = clientesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClientes(clientesData);
      } catch (error) {
        console.error("Error cargando clientes:", error);
      }
    };
    
    // Suscripción en tiempo real a los pedidos
    const pedidosRef = collection(db, 'pedidos');
    const pedidosQuery = query(pedidosRef, orderBy('fechaPedido', 'desc'));
    
    const unsubscribe = onSnapshot(pedidosQuery, (snapshot) => {
      let newPedidosCount = 0;
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const pedidoData = change.doc.data();
          const now = new Date();
          const pedidoDate = pedidoData.fechaPedido?.toDate();
          
          // Si el pedido se creó en los últimos 30 segundos, considerarlo nuevo
          if (pedidoDate && (now - pedidoDate) / 1000 < 30) {
            newPedidosCount++;
          }
        }
      });
      
      if (newPedidosCount > 0) {
        setNewOrderCount(prev => prev + newPedidosCount);
        setNotificationMessage(`¡${newPedidosCount} ${newPedidosCount === 1 ? 'nuevo pedido' : 'nuevos pedidos'} recibido${newPedidosCount === 1 ? '' : 's'}!`);
        setShowNotification(true);
        
        // Ocultar notificación después de 5 segundos
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }
      
      // CORRECCIÓN: Crear una nueva variable en lugar de reasignar pedidosData
      const pedidosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          fechaPedido: data.fechaPedido?.toDate().toISOString() || new Date().toISOString(),
          fechaEntrega: data.fechaEntrega?.toDate().toISOString() || null,
        };
      });
      
      setPedidos(pedidosData);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Error en tiempo real de pedidos:", error);
      setLoading(false);
      setRefreshing(false);
    });
    
    loadMesas();
    loadClientes();
    
    return () => unsubscribe();
  }, []);

  // Función para refrescar datos
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setNewOrderCount(0);
  }, []);

  // Obtener categorías únicas de los platos
  const categorias = ['todas', ...new Set(platos.map(plato => plato.categoria))];

  // Filtrar pedidos según la pestaña actual
  const filteredPedidos = pedidos.filter(pedido => {
    if (currentTab === 'todos') return true;
    return pedido.estado === currentTab;
  });

  // Filtrar platos por categoría y búsqueda
  const filteredPlatos = platos.filter(plato => {
    const matchesSearch = plato.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          plato.categoria.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = categoriaSeleccionada === 'todas' || plato.categoria === categoriaSeleccionada;
    return matchesSearch && matchesCategoria && plato.disponible;
  });

  const showDialog = () => {
    setVisible(true);
    setSelectedMesa(null);
    setSelectedCliente(null);
    setSelectedItems([]);
    setCategoriaSeleccionada('todas');
    setNotas('');
  };

  const hideDialog = () => {
    setVisible(false);
  };

  const addItemToPedido = (plato) => {
    const existingItem = selectedItems.find(item => item.id === plato.id);
    
    if (existingItem) {
      setSelectedItems(
        selectedItems.map(item => 
          item.id === plato.id 
            ? { ...item, cantidad: item.cantidad + 1 } 
            : item
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems, 
        { 
          id: plato.id, 
          nombre: plato.nombre, 
          precio: plato.precio,
          categoria: plato.categoria,
          cantidad: 1 
        }
      ]);
    }
    
    setSearchVisible(false);
    setSearchQuery('');
  };

  const removeItemFromPedido = (platoId) => {
    const existingItem = selectedItems.find(item => item.id === platoId);
    
    if (existingItem && existingItem.cantidad > 1) {
      setSelectedItems(
        selectedItems.map(item => 
          item.id === platoId 
            ? { ...item, cantidad: item.cantidad - 1 } 
            : item
        )
      );
    } else {
      setSelectedItems(selectedItems.filter(item => item.id !== platoId));
    }
  };

  const calcularTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  };

  const handleCrearPedido = async () => {
    if (!selectedMesa && !selectedCliente) {
      Alert.alert('Error', 'Por favor, selecciona una mesa o un cliente');
      return;
    }

    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Añade al menos un plato al pedido');
      return;
    }

    try {
      setLoading(true);
      
      const nuevoPedido = {
        estado: 'pendiente',
        items: selectedItems.map(item => ({
          menuId: item.id,
          nombre: item.nombre,
          precio: item.precio,
          cantidad: item.cantidad,
          subtotal: item.precio * item.cantidad
        })),
        total: calcularTotal(),
        fechaPedido: serverTimestamp(),
        mesaId: selectedMesa?.id || null,
        usuarioId: selectedCliente?.id || null,
        nombreCliente: selectedCliente?.nombre || "Cliente en local",
        metodoPago: "pendiente",
        notas: notas.trim() || null,
        creadoPor: user?.id || "admin"
      };

      const pedidosRef = collection(db, 'pedidos');
      await addDoc(pedidosRef, nuevoPedido);
      
      Alert.alert('Éxito', 'Pedido creado correctamente');
      hideDialog();
      setLoading(false);
    } catch (error) {
      console.error("Error al crear pedido:", error);
      Alert.alert('Error', 'No se pudo crear el pedido');
      setLoading(false);
    }
  };

  const handleUpdateEstado = async (pedidoId, nuevoEstado) => {
    try {
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      
      let updateData = {
        estado: nuevoEstado,
      };
      
      // Si el estado es "listo", actualizar la fecha de entrega
      if (nuevoEstado === 'listo') {
        updateData.fechaEntrega = serverTimestamp();
      }
      
      await updateDoc(pedidoRef, updateData);
      return true;
    } catch (error) {
      console.error("Error actualizando estado:", error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pedido');
      return false;
    }
  };

  const handleAplicarPromocion = async (pedidoId, promocionId) => {
    try {
      // Encontrar la promoción seleccionada
      const promocion = promociones.find(p => p.id === promocionId);
      if (!promocion) return;
      
      // Encontrar el pedido actual
      const pedido = pedidos.find(p => p.id === pedidoId);
      if (!pedido) return;
      
      // Calcular descuento
      let descuento = 0;
      
      if (promocion.tipo === 'porcentaje') {
        descuento = pedido.total * (promocion.descuento / 100);
      } else if (promocion.tipo === 'fijo') {
        descuento = promocion.descuento;
      } else if (promocion.tipo === 'categoria') {
        // Aplicar descuento solo a items de la categoría especificada
        pedido.items.forEach(item => {
          const platoInfo = platos.find(p => p.id === item.menuId);
          if (platoInfo && promocion.aplicaA.includes(platoInfo.categoria)) {
            descuento += item.subtotal * (promocion.descuento / 100);
          }
        });
      }
      
      // Redondear descuento a 2 decimales
      descuento = Math.min(descuento, pedido.total);
      descuento = Math.round(descuento * 100) / 100;
      
      // Actualizar el pedido con el descuento
      const pedidoRef = doc(db, 'pedidos', pedidoId);
      await updateDoc(pedidoRef, {
        descuento: descuento,
        totalConDescuento: pedido.total - descuento,
        promocionAplicada: {
          id: promocion.id,
          nombre: promocion.titulo,
          descuento: promocion.descuento,
          tipo: promocion.tipo
        }
      });
      
      Alert.alert('Éxito', `Promoción "${promocion.titulo}" aplicada. Descuento: ${descuento.toFixed(2)}$`);
      return true;
    } catch (error) {
      console.error("Error aplicando promoción:", error);
      Alert.alert('Error', 'No se pudo aplicar la promoción');
      return false;
    }
  };

  const getTotalConDescuento = (pedido) => {
    const subtotal = pedido.total || 0;
    const descuento = pedido.descuento || 0;
    return subtotal - descuento;
  };

  // Función para oscurecer colores
  const darkenColor = (color, amount) => {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  const renderEstadoItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setCurrentTab(item.id)}
      style={[
        styles.estadoItem,
        currentTab === item.id && styles.estadoItemSelected
      ]}
    >
      <Surface style={[
        styles.estadoIconContainer,
        { backgroundColor: currentTab === item.id ? item.color : '#f5f5f5' }
      ]}>
        <Image source={item.icon} style={styles.estadoIcon} />
        {item.id === 'pendiente' && newOrderCount > 0 && (
          <Badge
            visible={true}
            size={22}
            style={styles.notificationBadge}
          >
            {newOrderCount}
          </Badge>
        )}
      </Surface>
      <Text style={[
        styles.estadoText,
        currentTab === item.id && { color: item.color, fontWeight: 'bold' }
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderCategoriaItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setCategoriaSeleccionada(item)}
      style={[
        styles.categoriaItem,
        categoriaSeleccionada === item && styles.categoriaItemSelected
      ]}
    >
      <Text style={[
        styles.categoriaText,
        categoriaSeleccionada === item && styles.categoriaTextSelected
      ]}>
        {item === 'todas' ? 'Todas' : item}
      </Text>
    </TouchableOpacity>
  );

  const renderPedidoItem = ({ item, index }) => {
    const cliente = item.nombreCliente || "Cliente local";
    const mesa = mesas.find(m => m.id === item.mesaId);
    const mesaInfo = mesa ? `Mesa ${mesa.numero} (${mesa.ubicacion})` : "Sin mesa asignada";
    const fechaPedido = new Date(item.fechaPedido);
    
    // Color según el estado
    const estado = ESTADOS_PEDIDOS.find(e => e.id === item.estado) || ESTADOS_PEDIDOS[0];
    const statusColor = estado ? estado.color : '#000000';
    const darkStatusColor = darkenColor(statusColor, 30);
    
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100).duration(300)}
        style={styles.pedidoItemContainer}
      >
        <Surface style={styles.pedidoCard}>
          <LinearGradient
            colors={[statusColor, darkStatusColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pedidoHeader}
          >
            <View style={styles.pedidoHeaderLeft}>
              <Text style={styles.pedidoNumero}>Pedido #{item.id.slice(-4)}</Text>
              <Text style={styles.pedidoCliente}>{cliente}</Text>
              <Text style={styles.pedidoMesa}>{mesaInfo}</Text>
            </View>
            <View style={styles.pedidoStatus}>
              <Image 
                source={estado?.icon || ESTADOS_PEDIDOS[0].icon} 
                style={styles.statusIcon} 
              />
              <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
            </View>
          </LinearGradient>
          
          <View style={styles.pedidoContent}>
            <View style={styles.pedidoInfo}>
              <View style={styles.pedidoFecha}>
                <Image source={require('../../../assets/icons/calendar.png')} style={styles.infoIcon} />
                <Text style={styles.fechaText}>
                  {fechaPedido.toLocaleDateString()} {fechaPedido.toLocaleTimeString().substring(0, 5)}
                </Text>
              </View>
              
              {item.notas && (
                <View style={styles.notasContainer}>
                  <Text style={styles.notasLabel}>Notas:</Text>
                  <Text style={styles.notasText}>{item.notas}</Text>
                </View>
              )}
              
              <Divider style={styles.divider} />
              
              <Text style={styles.itemsTitle}>Items:</Text>
              {item.items.map((itemPedido, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Avatar.Text 
                      size={24} 
                      label={itemPedido.cantidad.toString()} 
                      color="white"
                      style={[styles.cantidadBadge, { backgroundColor: statusColor }]}
                    />
                    <Text style={styles.itemNombre}>{itemPedido.nombre}</Text>
                  </View>
                  <Text style={styles.itemPrecio}>{(itemPedido.subtotal).toFixed(2)} $</Text>
                </View>
              ))}
              
              {item.descuento > 0 && (
                <View style={styles.descuentoRow}>
                  <View style={styles.descuentoInfo}>
                    <Image 
                      source={require('../../../assets/icons/discount.png')} 
                      style={[styles.descuentoIcon, {tintColor: '#4CAF50'}]} 
                    />
                    <Text style={styles.descuentoText}>
                      {item.promocionAplicada?.nombre || "Descuento aplicado"}
                    </Text>
                  </View>
                  <Text style={styles.descuentoValor}>-{item.descuento.toFixed(2)} $</Text>
                </View>
              )}
              
              <View style={styles.totalRow}>
                <Text style={styles.totalText}>TOTAL:</Text>
                <Text style={styles.totalValue}>
                  {(item.descuento > 0 ? getTotalConDescuento(item) : item.total).toFixed(2)} $
                </Text>
              </View>
            </View>
            
            <View style={styles.pedidoActions}>
              {item.estado === 'pendiente' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#1976D2' }]}
                  onPress={() => handleUpdateEstado(item.id, 'preparando')}
                >
                  <Image source={require('../../../assets/icons/cooking.png')} style={styles.actionIcon} />
                  <Text style={styles.actionText}>PREPARAR</Text>
                </TouchableOpacity>
              )}
              
              {item.estado === 'preparando' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#43A047' }]}
                  onPress={() => handleUpdateEstado(item.id, 'listo')}
                >
                  <Image source={require('../../../assets/icons/ready.png')} style={styles.actionIcon} />
                  <Text style={styles.actionText}>LISTO</Text>
                </TouchableOpacity>
              )}
              
              {item.estado === 'listo' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#9E9E9E' }]}
                  onPress={() => handleUpdateEstado(item.id, 'pagado')}
                >
                  <Image source={require('../../../assets/icons/paid.png')} style={styles.actionIcon} />
                  <Text style={styles.actionText}>PAGADO</Text>
                </TouchableOpacity>
              )}
              
              {(item.estado === 'pendiente' || item.estado === 'preparando') && !item.descuento && (
                <View>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => {
                      setSelectedPedidoId(item.id);
                      setPromoMenuVisible(true);
                    }}
                    onLayout={(event) => {
                      // Guardar la posición del botón para usar como referencia para el menú
                      const layout = event.nativeEvent.layout;
                      setPromoButtonPositions({
                        ...promoButtonPositions,
                        [item.id]: { x: layout.x, y: layout.y }
                      });
                    }}
                  >
                    <Image source={require('../../../assets/icons/discount.png')} style={styles.actionIcon} />
                    <Text style={styles.actionText}>PROMOCIÓN</Text>
                  </TouchableOpacity>
                  
                  <Menu
                    visible={promoMenuVisible && selectedPedidoId === item.id}
                    onDismiss={() => setPromoMenuVisible(false)}
                    anchor={<View />} // Un elemento vacío como anchor
                    style={styles.promoMenuContainer}
                  >
                    {promociones
                      .filter(promo => promo.activo)
                      .map(promo => (
                        <Menu.Item 
                          key={promo.id}
                          title={promo.titulo} 
                          description={`${promo.tipo === 'porcentaje' ? promo.descuento + '%' : promo.descuento + '$'}`}
                          leadingIcon="tag"
                          onPress={() => {
                            setPromoMenuVisible(false);
                            handleAplicarPromocion(item.id, promo.id);
                          }} 
                        />
                      ))}
                    {promociones.filter(promo => promo.activo).length === 0 && (
                      <Menu.Item title="No hay promociones activas" disabled />
                    )}
                  </Menu>
                </View>
              )}
            </View>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  const renderPlatoItem = ({ item }) => (
    <Surface style={styles.platoCard}>
      <View style={styles.platoContent}>
        <View style={styles.platoInfo}>
          <Text style={styles.platoNombre}>{item.nombre}</Text>
          <Chip style={styles.platoCategoria}>{item.categoria}</Chip>
          <Text style={styles.platoPrecio}>{item.precio.toFixed(2)} $</Text>
        </View>
        <TouchableOpacity
          style={styles.addPlatoButton}
          onPress={() => addItemToPedido(item)}
        >
          <IconButton
            icon="plus"
            size={24}
            iconColor="white"
            style={styles.addButtonIcon}
          />
        </TouchableOpacity>
      </View>
    </Surface>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showNotification && (
        <Animated.View 
          entering={SlideInRight.duration(300)}
          style={styles.notification}
        >
          <View style={styles.notificationContent}>
            <Image 
              source={require('../../../assets/icons/confirmed.png')} 
              style={styles.notificationIcon} 
            />
            <Text style={styles.notificationText}>{notificationMessage}</Text>
          </View>
        </Animated.View>
      )}
    
      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground 
          source={require('../../../assets/images/orders_header.jpg')} 
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Pedidos</Text>
            <Text style={styles.headerSubtitle}>Gestiona los pedidos de tu restaurante</Text>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
      
      <View style={styles.estadosContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ESTADOS_PEDIDOS}
          renderItem={renderEstadoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.estadosList}
        />
      </View>
      
      {filteredPedidos.length > 0 ? (
        <FlatList
          data={filteredPedidos}
          renderItem={renderPedidoItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B6B']}
            />
          }
          onScroll={e => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyStateContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B6B']}
            />
          }
        >
          <View style={styles.emptyState}>
            <Image 
              source={require('../../../assets/icons/empty_orders.png')} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              No hay pedidos en este estado
            </Text>
            <Button 
              mode="contained" 
              onPress={showDialog}
              buttonColor="#FF6B6B"
              style={styles.createOrderButton}
            >
              CREAR PEDIDO
            </Button>
          </View>
        </ScrollView>
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        color="white"
        onPress={showDialog}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <LinearGradient
            colors={['#FF6B6B', '#FF4757']}
            style={styles.dialogHeader}
          >
            <Dialog.Title style={styles.dialogTitle}>Nuevo Pedido</Dialog.Title>
          </LinearGradient>
          
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              <View style={styles.dialogSection}>
                <Text style={styles.sectionTitle}>Selecciona una mesa (opcional):</Text>
                {mesas.length > 0 ? (
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={mesas}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedMesa(item);
                          setSelectedCliente(null); // Limpiar cliente seleccionado
                        }}
                        style={[
                          styles.mesaItem,
                          selectedMesa?.id === item.id && styles.mesaItemSelected
                        ]}
                      >
                        <LinearGradient
                          colors={selectedMesa?.id === item.id 
                            ? ['#3F51B5', '#303F9F'] 
                            : ['#FAFAFA', '#E0E0E0']}
                          style={styles.mesaGradient}
                        >
                          <Image 
                            source={
                              item.ubicacion === 'terraza' 
                                ? require('../../../assets/icons/table_outdoor.png') 
                                : require('../../../assets/icons/table_indoor.png')
                            } 
                            style={[
                              styles.mesaIcon,
                              selectedMesa?.id === item.id && { tintColor: 'white' }
                            ]} 
                          />
                          <Text style={[
                            styles.mesaNumero,
                            selectedMesa?.id === item.id && { color: 'white' }
                          ]}>
                            Mesa {item.numero}
                          </Text>
                          <Text style={[
                            styles.mesaUbicacion,
                            selectedMesa?.id === item.id && { color: 'rgba(255,255,255,0.7)' }
                          ]}>
                            {item.ubicacion}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.mesasList}
                  />
                ) : (
                  <Text style={styles.noDataText}>No hay mesas disponibles</Text>
                )}
              </View>
              
              <View style={styles.dialogSection}>
                <Text style={styles.sectionTitle}>O selecciona un cliente (opcional):</Text>
                {clientes.length > 0 ? (
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={clientes}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedCliente(item);
                          setSelectedMesa(null); // Limpiar mesa seleccionada
                        }}
                        style={[
                          styles.clienteItem,
                          selectedCliente?.id === item.id && styles.clienteItemSelected
                        ]}
                      >
                        <LinearGradient
                          colors={selectedCliente?.id === item.id 
                            ? ['#FF6B6B', '#FF4757'] 
                            : ['#FAFAFA', '#E0E0E0']}
                          style={styles.clienteGradient}
                        >
                          <Avatar.Text 
                            size={40} 
                            label={item.nombre?.substring(0, 2).toUpperCase() || "CL"} 
                            backgroundColor={selectedCliente?.id === item.id ? '#FF3D00' : '#BDBDBD'}
                            color="white"
                          />
                          <Text style={[
                            styles.clienteNombre,
                            selectedCliente?.id === item.id && { color: 'white' }
                          ]}>
                            {item.nombre}
                          </Text>
                          {item.telefono && (
                            <Text style={[
                              styles.clienteTelefono,
                              selectedCliente?.id === item.id && { color: 'rgba(255,255,255,0.7)' }
                            ]}>
                              {item.telefono}
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.clientesList}
                  />
                ) : (
                  <Text style={styles.noDataText}>No hay clientes registrados</Text>
                )}
              </View>
              
              <View style={styles.dialogSection}>
                <Text style={styles.sectionTitle}>Añadir platos:</Text>
                
                <Searchbar
                  placeholder="Buscar platos"
                  onChangeText={setSearchQuery}
                  value={searchQuery}
                  style={styles.searchbar}
                  icon="magnify"
                  iconColor="#FF6B6B"
                />
                
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={categorias}
                  renderItem={renderCategoriaItem}
                  keyExtractor={item => item}
                  contentContainerStyle={styles.categoriasList}
                />
                
                <View style={styles.platosGrid}>
                  {filteredPlatos.length > 0 ? (
                    <FlatList
                      data={filteredPlatos}
                      renderItem={renderPlatoItem}
                      keyExtractor={item => item.id}
                      numColumns={2}
                      columnWrapperStyle={styles.platosRow}
                      contentContainerStyle={styles.platosContainer}
                    />
                  ) : (
                    <Text style={styles.noPlatosText}>
                      No hay platos que coincidan con la búsqueda
                    </Text>
                  )}
                </View>
              </View>
              
              {selectedItems.length > 0 && (
                <View style={styles.dialogSection}>
                  <Text style={styles.sectionTitle}>Platos seleccionados:</Text>
                  <Surface style={styles.selectedItemsContainer}>
                    {selectedItems.map((item, index) => (
                      <View key={item.id} style={styles.selectedItemRow}>
                        <View style={styles.selectedItemInfo}>
                          <Text style={styles.selectedItemNombre}>{item.nombre}</Text>
                          <Text style={styles.selectedItemPrecio}>
                            {item.precio.toFixed(2)} $ x {item.cantidad}
                          </Text>
                        </View>
                        <View style={styles.selectedItemControls}>
                          <TouchableOpacity
                            style={styles.itemControlButton}
                            onPress={() => removeItemFromPedido(item.id)}
                          >
                            <IconButton icon="minus" size={20} iconColor="white" />
                          </TouchableOpacity>
                          
                          <Text style={styles.itemCantidad}>{item.cantidad}</Text>
                          
                          <TouchableOpacity
                            style={styles.itemControlButton}
                            onPress={() => addItemToPedido(platos.find(p => p.id === item.id))}
                          >
                            <IconButton icon="plus" size={20} iconColor="white" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    
                    <LinearGradient
                      colors={['#F5F5F5', '#E0E0E0']}
                      style={styles.totalContainer}
                    >
                      <Text style={styles.totalLabel}>TOTAL PEDIDO:</Text>
                      <Text style={styles.totalAmount}>{calcularTotal().toFixed(2)} $</Text>
                    </LinearGradient>
                  </Surface>
                </View>
              )}
              
              <View style={styles.dialogSection}>
                <Text style={styles.sectionTitle}>Notas adicionales:</Text>
                <TextInput
                  mode="outlined"
                  label="Notas del pedido"
                  value={notas}
                  onChangeText={setNotas}
                  multiline
                  numberOfLines={3}
                  style={styles.notasInput}
                  outlineColor="#ddd"
                  activeOutlineColor="#FF6B6B"
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={hideDialog}
              textColor="#666"
              style={styles.dialogCancelButton}
            >
              CANCELAR
            </Button>
            <Button 
              onPress={handleCrearPedido}
              mode="contained"
              buttonColor="#FF6B6B"
              style={styles.dialogConfirmButton}
              disabled={(!selectedMesa && !selectedCliente) || selectedItems.length === 0}
            >
              CREAR PEDIDO
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    overflow: 'hidden',
    zIndex: 1,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  notification: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: 10,
    padding: 10,
    zIndex: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: 'white',
  },
  notificationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  estadosContainer: {
    paddingVertical: 15,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  estadosList: {
    paddingHorizontal: 15,
  },
  estadoItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  estadoItemSelected: {
    transform: [{ scale: 1.1 }]
  },
  estadoIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  estadoIcon: {
    width: 32,
    height: 32,
    tintColor: 'white',
  },
  estadoText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
  },
  list: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  pedidoItemContainer: {
    marginBottom: 16,
  },
  pedidoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  pedidoHeaderLeft: {
    flex: 1,
  },
  pedidoNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  pedidoCliente: {
    fontSize: 15,
    color: 'white',
    marginTop: 3,
  },
  pedidoMesa: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  pedidoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: 'white',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  pedidoContent: {
    padding: 16,
    backgroundColor: 'white',
  },
  pedidoInfo: {
    marginBottom: 12,
  },
  pedidoFecha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: '#666',
  },
  fechaText: {
    fontSize: 14,
    color: '#666',
  },
  notasContainer: {
    backgroundColor: '#FFF9C4',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  notasLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#E65100',
  },
  notasText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  divider: {
    marginBottom: 10,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cantidadBadge: {
    marginRight: 10,
  },
  itemNombre: {
    fontSize: 14,
    flex: 1,
  },
  itemPrecio: {
    fontSize: 14,
    fontWeight: '500',
  },
  descuentoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  descuentoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  descuentoIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  descuentoText: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  descuentoValor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  pedidoActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
  },
  actionIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: 'white',
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  promoMenuContainer: {
    elevation: 8,
  },
  emptyStateContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createOrderButton: {
    borderRadius: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B6B',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  // Dialog styles
  dialog: {
    borderRadius: 16,
    backgroundColor: 'white',
    width: '95%',
    alignSelf: 'center',
  },
  dialogHeader: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dialogTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dialogScrollArea: {
    maxHeight: 500,
  },
  dialogSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 15,
  },
  mesasList: {
    paddingVertical: 8,
  },
  mesaItem: {
    marginRight: 12,
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  mesaItemSelected: {
    elevation: 8,
  },
  mesaGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  mesaIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  mesaNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mesaUbicacion: {
    fontSize: 14,
    color: '#666',
  },
  clientesList: {
    paddingVertical: 8,
  },
  clienteItem: {
    marginRight: 12,
    width: 130,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  clienteItemSelected: {
    elevation: 8,
  },
  clienteGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  clienteNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  clienteTelefono: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  searchbar: {
    marginBottom: 15,
    backgroundColor: 'white',
    elevation: 2,
    borderRadius: 8,
  },
  categoriasList: {
    paddingVertical: 8,
  },
  categoriaItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  categoriaItemSelected: {
    backgroundColor: '#FF6B6B',
  },
  categoriaText: {
    color: '#666',
  },
  categoriaTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  platosGrid: {
    marginTop: 10,
  },
  platosRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  platosContainer: {
    paddingBottom: 10,
  },
  platoCard: {
    width: (width - 80) / 2,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  platoContent: {
    padding: 12,
  },
  platoInfo: {
    marginBottom: 8,
  },
  platoNombre: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  platoCategoria: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
  },
  platoPrecio: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  addPlatoButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  addButtonIcon: {
    backgroundColor: '#FF6B6B',
  },
  noPlatosText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
    fontStyle: 'italic',
  },
  selectedItemsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  selectedItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItemInfo: {
    flex: 1,
  },
  selectedItemNombre: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedItemPrecio: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectedItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemControlButton: {
    height: 30,
    width: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCantidad: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  notasInput: {
    backgroundColor: 'white',
  },
  dialogActions: {
    padding: 16,
    justifyContent: 'space-between',
  },
  dialogCancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  dialogConfirmButton: {
    borderRadius: 4,
  },
});

export default PedidosScreen;