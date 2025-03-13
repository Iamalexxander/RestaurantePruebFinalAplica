import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Alert
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  ActivityIndicator,
  Divider,
  Button,
  Avatar,
  Badge,
  IconButton,
  Portal,
  Modal
} from 'react-native-paper';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import { AuthContext } from '../../../contexts/AuthContext';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { collection, query, orderBy, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const OrderStatusChip = ({ status }) => {
  let color, backgroundColor, label, icon;
  
  switch (status) {
    case 'pendiente':
      color = '#FF9800';
      backgroundColor = 'rgba(255, 152, 0, 0.1)';
      label = 'Pendiente';
      icon = require('../../../assets/icons/pending.png');
      break;
    case 'preparando':
      color = '#2196F3';
      backgroundColor = 'rgba(33, 150, 243, 0.1)';
      label = 'Preparando';
      icon = require('../../../assets/icons/cooking.png');
      break;
    case 'listo':
      color = '#4CAF50';
      backgroundColor = 'rgba(76, 175, 80, 0.1)';
      label = 'Listo para recoger';
      icon = require('../../../assets/icons/ready.png');
      break;
    case 'pagado':
      color = '#9E9E9E';
      backgroundColor = 'rgba(158, 158, 158, 0.1)';
      label = 'Completado';
      icon = require('../../../assets/icons/paid.png');
      break;
    case 'cancelado':
      color = '#F44336';
      backgroundColor = 'rgba(244, 67, 54, 0.1)';
      label = 'Cancelado';
      icon = null;
      break;
    default:
      color = '#9E9E9E';
      backgroundColor = 'rgba(158, 158, 158, 0.1)';
      label = status || 'Desconocido';
      icon = null;
  }
  
  return (
    <Chip 
      style={{ backgroundColor }} 
      textStyle={{ color, fontWeight: 'bold' }}
      icon={() => icon ? (
        <Image source={icon} style={{ width: 16, height: 16, tintColor: color }} />
      ) : null}
    >
      {label}
    </Chip>
  );
};

const PaymentMethodIcon = ({ method }) => {
  let icon;
  
  switch (method) {
    case 'efectivo':
      icon = require('../../../assets/icons/cash.png');
      break;
    case 'tarjeta':
      icon = require('../../../assets/icons/card.png');
      break;
    case 'movil':
      icon = require('../../../assets/icons/mobile.png');
      break;
    default:
      icon = require('../../../assets/icons/cash.png');
  }
  
  return (
    <Image source={icon} style={styles.paymentIcon} />
  );
};

const UserOrdersScreen = () => {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const { platos } = useContext(DatabaseContext);
  
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState({});

  useEffect(() => {
    if (!user) return;
    
    // Consulta de pedidos en tiempo real
    const pedidosRef = collection(db, 'pedidos');
    const userPedidosQuery = query(
      pedidosRef, 
      where("usuarioId", "==", user.id),
      orderBy("fechaPedido", "desc")
    );
    
    const unsubscribe = onSnapshot(userPedidosQuery, (snapshot) => {
      const pedidosData = [];
      const notifications = {...orderNotifications};
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === "modified") {
          const updatedData = change.doc.data();
          const prevData = userOrders.find(order => order.id === change.doc.id);
          
          // Si cambió el estado, crear notificación
          if (prevData && prevData.estado !== updatedData.estado) {
            notifications[change.doc.id] = {
              newStatus: updatedData.estado,
              seen: false,
              timestamp: new Date().getTime()
            };
          }
        }
      });
      
      if (Object.keys(notifications).length > 0) {
        setOrderNotifications(notifications);
      }
      
      const pedidos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaPedido: doc.data().fechaPedido?.toDate().toISOString() || new Date().toISOString(),
        fechaEntrega: doc.data().fechaEntrega?.toDate()?.toISOString() || null,
      }));
      
      setUserOrders(pedidos);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.error("Error obteniendo pedidos:", error);
      setLoading(false);
      setRefreshing(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const markNotificationAsSeen = (orderId) => {
    if (orderNotifications[orderId]) {
      const updatedNotifications = {...orderNotifications};
      updatedNotifications[orderId].seen = true;
      setOrderNotifications(updatedNotifications);
    }
  };

  const handlePayOrder = async (orderId) => {
    try {
      // Aquí se integraría con el sistema de pagos real
      // Por ahora, simplemente actualizamos el estado a "pagado"
      const orderRef = doc(db, 'pedidos', orderId);
      
      // Verificar estado actual
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        Alert.alert('Error', 'No se encontró el pedido');
        return;
      }
      
      const orderData = orderSnap.data();
      
      // Solo se puede pagar si está en estado "listo"
      if (orderData.estado !== 'listo') {
        Alert.alert(
          'No se puede pagar', 
          'Solo puedes pagar los pedidos que estén listos para recoger'
        );
        return;
      }
      
      // Mostrar opciones de pago
      Alert.alert(
        'Método de pago',
        '¿Cómo deseas pagar este pedido?',
        [
          {
            text: 'Efectivo (al recoger)',
            onPress: async () => {
              await updateDoc(orderRef, {
                metodoPago: 'efectivo',
                estado: 'pagado'
              });
              Alert.alert('Éxito', 'Pedido marcado como pagado en efectivo. Recógelo en el restaurante.');
            }
          },
          {
            text: 'Tarjeta',
            onPress: () => navigation.navigate('Pagos', { orderId, amount: currentOrder.total })
          },
          {
            text: 'Cancelar',
            style: 'cancel',
          }
        ]
      );
    } catch (error) {
      console.error("Error al pagar:", error);
      Alert.alert('Error', 'No se pudo procesar el pago');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const orderRef = doc(db, 'pedidos', orderId);
      
      // Verificar estado actual
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        Alert.alert('Error', 'No se encontró el pedido');
        return;
      }
      
      const orderData = orderSnap.data();
      
      // Solo se puede cancelar si está en estado "pendiente"
      if (orderData.estado !== 'pendiente') {
        Alert.alert(
          'No se puede cancelar', 
          'Solo puedes cancelar pedidos que estén en estado pendiente'
        );
        return;
      }
      
      Alert.alert(
        'Cancelar pedido',
        '¿Estás seguro de que deseas cancelar este pedido?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Sí, cancelar',
            onPress: async () => {
              await updateDoc(orderRef, {
                estado: 'cancelado'
              });
              Alert.alert('Éxito', 'Pedido cancelado correctamente');
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al cancelar:", error);
      Alert.alert('Error', 'No se pudo cancelar el pedido');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha no disponible";
    }
  };

  const getFilteredOrders = () => {
    if (statusFilter === 'all') return userOrders;
    return userOrders.filter(order => order.estado === statusFilter);
  };

  const renderOrderItem = ({ item, index }) => {
    const hasNotification = orderNotifications[item.id] && !orderNotifications[item.id].seen;
    
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100).duration(300)}
        style={styles.orderCard}
      >
        <TouchableOpacity 
          onPress={() => {
            setCurrentOrder(item);
            setOrderDetailVisible(true);
            markNotificationAsSeen(item.id);
          }}
          style={styles.orderCardContent}
        >
          {hasNotification && (
            <Badge
              visible={true}
              size={10}
              style={styles.notificationDot}
            />
          )}
          
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderId}>Pedido #{item.id ? item.id.slice(-4) : 'N/A'}</Text>
              <Text style={styles.orderDate}>{formatDate(item.fechaPedido)}</Text>
            </View>
            <OrderStatusChip status={item.estado} />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.orderItems}>
            <Text style={styles.itemsTitle}>Artículos:</Text>
            {item.items && item.items.slice(0, 2).map((orderItem, idx) => (
              <View key={idx} style={styles.orderItem}>
                <Text style={styles.itemQuantity}>{orderItem.cantidad}x</Text>
                <Text style={styles.itemName} numberOfLines={1}>
                  {orderItem.nombre}
                </Text>
                <Text style={styles.itemPrice}>
                  {(orderItem.subtotal).toFixed(2)} $
                </Text>
              </View>
            ))}
            
            {item.items && item.items.length > 2 && (
              <Text style={styles.moreItems}>
                +{item.items.length - 2} más
              </Text>
            )}
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>
              Total: {(item.descuento > 0 ? item.totalConDescuento : item.total).toFixed(2)} $
            </Text>
            
            {item.descuento > 0 && (
              <View style={styles.discountBadge}>
                <Image source={require('../../../assets/icons/discount.png')} style={styles.discountIcon} />
                <Text style={styles.discountText}>-{item.descuento.toFixed(2)}$</Text>
              </View>
            )}
            
            <Text style={styles.viewDetails}>Ver detalles</Text>
          </View>
          
          {item.estado === 'listo' && (
            <View style={styles.actionButtonsContainer}>
              <Button 
                mode="contained"
                buttonColor="#4CAF50"
                style={styles.payButton}
                labelStyle={styles.buttonLabel}
                icon="cash-multiple"
                onPress={() => handlePayOrder(item.id)}
              >
                Pagar ahora
              </Button>
            </View>
          )}
          
          {item.estado === 'pendiente' && (
            <View style={styles.actionButtonsContainer}>
              <Button 
                mode="outlined"
                textColor="#F44336"
                style={styles.cancelButton}
                labelStyle={styles.buttonLabel}
                icon="close-circle-outline"
                onPress={() => handleCancelOrder(item.id)}
              >
                Cancelar pedido
              </Button>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderOrderDetail = () => {
    if (!currentOrder) return null;
    
    const statusInfo = {
      pendiente: {
        title: 'Pedido en espera',
        message: 'Tu pedido está en espera de ser preparado.',
        animation: null
      },
      preparando: {
        title: 'Preparando tu pedido',
        message: 'Nuestro equipo está preparando tu pedido en este momento.',
        animation: null
      },
      listo: {
        title: '¡Tu pedido está listo!',
        message: 'Ya puedes pasar a recoger tu pedido al restaurante.',
        animation: null
      },
      pagado: {
        title: 'Pedido completado',
        message: 'Gracias por tu pedido, ¡esperamos que lo hayas disfrutado!',
        animation: null
      },
      cancelado: {
        title: 'Pedido cancelado',
        message: 'Este pedido ha sido cancelado.',
        animation: null
      }
    };
    
    const currentStatus = statusInfo[currentOrder.estado] || statusInfo.pendiente;
    
    return (
      <Portal>
        <Modal
          visible={orderDetailVisible}
          onDismiss={() => setOrderDetailVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.orderDetailHeader}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.orderDetailHeaderGradient}
              >
                <Text style={styles.orderDetailTitle}>{currentStatus.title}</Text>
                <Text style={styles.orderDetailSubtitle}>Pedido #{currentOrder.id.slice(-4)}</Text>
                
                {currentStatus.animation && (
                  <View style={styles.animationContainer}>
                    <LottieView
                      source={currentStatus.animation}
                      autoPlay
                      loop
                      style={styles.animation}
                    />
                  </View>
                )}
              </LinearGradient>
            </View>
            
            <View style={styles.orderDetailContent}>
              <Text style={styles.statusMessage}>{currentStatus.message}</Text>
              
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Detalles del pedido:</Text>
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Fecha:</Text>
                  <Text style={styles.orderDetailValue}>{formatDate(currentOrder.fechaPedido)}</Text>
                </View>
                
                {currentOrder.fechaEntrega && (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Listo el:</Text>
                    <Text style={styles.orderDetailValue}>{formatDate(currentOrder.fechaEntrega)}</Text>
                  </View>
                )}
                
                <View style={styles.orderDetailRow}>
                  <Text style={styles.orderDetailLabel}>Estado:</Text>
                  <OrderStatusChip status={currentOrder.estado} />
                </View>
                
                {currentOrder.metodoPago && currentOrder.metodoPago !== 'pendiente' && (
                  <View style={styles.orderDetailRow}>
                    <Text style={styles.orderDetailLabel}>Método de pago:</Text>
                    <View style={styles.paymentMethodContainer}>
                      <PaymentMethodIcon method={currentOrder.metodoPago} />
                      <Text style={styles.paymentMethodText}>
                        {currentOrder.metodoPago === 'efectivo' ? 'Efectivo' : 
                         currentOrder.metodoPago === 'tarjeta' ? 'Tarjeta' : 
                         currentOrder.metodoPago === 'movil' ? 'Pago móvil' : 'Desconocido'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              
              {currentOrder.notas && (
                <View style={styles.orderDetailSection}>
                  <Text style={styles.sectionTitle}>Notas:</Text>
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>{currentOrder.notas}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.orderDetailSection}>
                <Text style={styles.sectionTitle}>Artículos:</Text>
                <Surface style={styles.itemsDetailContainer}>
                  {currentOrder.items.map((item, index) => (
                    <View key={index} style={styles.itemDetailRow}>
                      <View style={styles.itemDetailInfo}>
                        <Text style={styles.itemDetailQuantity}>{item.cantidad}x</Text>
                        <Text style={styles.itemDetailName}>{item.nombre}</Text>
                      </View>
                      <Text style={styles.itemDetailPrice}>{item.subtotal.toFixed(2)} $</Text>
                    </View>
                  ))}
                  
                  <Divider style={styles.divider} />
                  
                  <View style={styles.subtotalRow}>
                    <Text style={styles.subtotalLabel}>Subtotal:</Text>
                    <Text style={styles.subtotalValue}>{currentOrder.total.toFixed(2)} $</Text>
                  </View>
                  
                  {currentOrder.descuento > 0 && (
                    <View style={styles.discountDetailRow}>
                      <View style={styles.discountDetailInfo}>
                        <Image source={require('../../../assets/icons/discount.png')} style={styles.discountDetailIcon} />
                        <Text style={styles.discountDetailText}>
                          {currentOrder.promocionAplicada?.nombre || "Descuento"}
                        </Text>
                      </View>
                      <Text style={styles.discountDetailValue}>-{currentOrder.descuento.toFixed(2)} $</Text>
                    </View>
                  )}
                  
                  <View style={styles.totalDetailRow}>
                    <Text style={styles.totalDetailLabel}>TOTAL:</Text>
                    <Text style={styles.totalDetailValue}>
                      {(currentOrder.descuento > 0 ? currentOrder.totalConDescuento : currentOrder.total).toFixed(2)} $
                    </Text>
                  </View>
                </Surface>
              </View>
              
              {currentOrder.estado === 'listo' && (
                <Button
                  mode="contained"
                  buttonColor="#4CAF50"
                  style={styles.detailPayButton}
                  icon="cash-multiple"
                  onPress={() => {
                    setOrderDetailVisible(false);
                    handlePayOrder(currentOrder.id);
                  }}
                >
                  PAGAR AHORA
                </Button>
              )}
              
              {currentOrder.estado === 'pendiente' && (
                <Button
                  mode="outlined"
                  textColor="#F44336"
                  style={styles.detailCancelButton}
                  icon="close-circle-outline"
                  onPress={() => {
                    setOrderDetailVisible(false);
                    handleCancelOrder(currentOrder.id);
                  }}
                >
                  CANCELAR PEDIDO
                </Button>
              )}
            </View>
          </ScrollView>
          
          <IconButton
            icon="close"
            size={24}
            style={styles.closeButton}
            onPress={() => setOrderDetailVisible(false)}
          />
        </Modal>
      </Portal>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  const statusOptions = [
    { id: 'all', label: 'Todos' },
    { id: 'pendiente', label: 'Pendientes' },
    { id: 'preparando', label: 'Preparando' },
    { id: 'listo', label: 'Listos' },
    { id: 'pagado', label: 'Completados' }
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <Text style={styles.headerSubtitle}>
          Historial de tus pedidos y estado actual
        </Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {statusOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterOption,
                statusFilter === option.id && styles.filterOptionSelected
              ]}
              onPress={() => setStatusFilter(option.id)}
            >
              <Text style={[
                styles.filterOptionText,
                statusFilter === option.id && styles.filterOptionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {getFilteredOrders().length > 0 ? (
        <FlatList
          data={getFilteredOrders()}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id ? item.id.toString() : Math.random().toString()}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#FF6B6B']}
            />
          }
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
              {statusFilter === 'all' 
                ? 'No tienes pedidos realizados' 
                : `No tienes pedidos ${statusFilter === 'pendiente' ? 'pendientes' : 
                  statusFilter === 'preparando' ? 'en preparación' : 
                  statusFilter === 'listo' ? 'listos para recoger' : 'completados'}`}
            </Text>
            <TouchableOpacity 
              style={styles.orderNowButton}
              onPress={() => navigation.navigate('Menú')}
            >
              <Text style={styles.orderNowText}>Hacer un pedido</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      
      {renderOrderDetail()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterOptionSelected: {
    backgroundColor: '#FF6B6B',
  },
  filterOptionText: {
    color: '#666',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  ordersList: {
    padding: 15,
    paddingBottom: 40,
  },
  orderCard: {
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 3,
  },
  orderCardContent: {
    padding: 15,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#4CAF50',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 10,
  },
  orderItems: {
    marginVertical: 5,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
    width: 30,
  },
  itemName: {
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  discountIcon: {
    width: 14,
    height: 14,
    marginRight: 4,
    tintColor: '#4CAF50',
  },
  discountText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12,
  },
  viewDetails: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  payButton: {
    borderRadius: 8,
    flex: 1,
  },
  cancelButton: {
    borderRadius: 8,
    borderColor: '#F44336',
    flex: 1,
  },
  buttonLabel: {
    fontSize: 14,
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
    width: 80,
    height: 80,
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#666',
    textAlign: 'center',
  },
  orderNowButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
  },
  orderNowText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // Modal styles
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  orderDetailHeader: {
    width: '100%',
  },
  orderDetailHeaderGradient: {
    padding: 20,
    alignItems: 'center',
  },
  orderDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  orderDetailSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
  },
  animationContainer: {
    height: 150,
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
  },
  animation: {
    height: 150,
  },
  orderDetailContent: {
    padding: 20,
  },
  statusMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  orderDetailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderDetailLabel: {
    fontSize: 15,
    color: '#555',
  },
  orderDetailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#FFF9C4',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  paymentMethodText: {
    fontSize: 15,
    color: '#333',
  },
  itemsDetailContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    padding: 15,
  },
  itemDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemDetailQuantity: {
    fontSize: 15,
    fontWeight: 'bold',
    width: 30,
  },
  itemDetailName: {
    fontSize: 15,
    flex: 1,
  },
  itemDetailPrice: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  subtotalLabel: {
    fontSize: 15,
    color: '#555',
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  discountDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  discountDetailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountDetailIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#4CAF50',
  },
  discountDetailText: {
    fontSize: 14,
    color: '#4CAF50',
    fontStyle: 'italic',
  },
  discountDetailValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  totalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalDetailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  detailPayButton: {
    marginTop: 10,
    borderRadius: 8,
  },
  detailCancelButton: {
    marginTop: 10,
    borderRadius: 8,
    borderColor: '#F44336',
  },
  closeButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});

export default UserOrdersScreen;