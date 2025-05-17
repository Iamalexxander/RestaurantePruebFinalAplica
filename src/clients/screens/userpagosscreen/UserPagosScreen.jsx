import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ImageBackground,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  TextInput,
  Chip
} from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const { width } = Dimensions.get('window');

const UserPagosScreen = ({ navigation, route }) => {
  const { user } = useContext(AuthContext);
  const { actualizarEstadoPedido } = useContext(DatabaseContext);
  
  // Estados para datos de tarjeta
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentComplete, setIsPaymentComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Datos del pedido
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(180);
  
  // Optimizado: Función memoizada para cargar datos del pedido
  const fetchOrderData = useCallback(async (orderId) => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      const orderRef = doc(db, 'pedidos', orderId);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        // Normalizamos los datos para asegurar consistencia
        const data = orderSnap.data();
        setOrderData({ 
          id: orderSnap.id, 
          ...data,
          // Asegurar que los valores numéricos son números
          total: typeof data.total === 'number' ? data.total : parseFloat(data.total || 0),
          propina: typeof data.propina === 'number' ? data.propina : parseFloat(data.propina || 0),
          items: Array.isArray(data.items) ? data.items.map(item => ({
            ...item,
            cantidad: typeof item.cantidad === 'number' ? item.cantidad : parseInt(item.cantidad || 1),
            subtotal: typeof item.subtotal === 'number' ? item.subtotal : parseFloat(item.subtotal || 0)
          })) : []
        });
      } else {
        Alert.alert(
          "Error", 
          "El pedido no existe en la base de datos",
          [{ text: "Volver", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error("Error al cargar datos del pedido:", error);
      Alert.alert("Error", "No se pudo cargar la información del pedido");
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  // Efecto para cargar los datos del pedido desde la ruta
  useEffect(() => {
    if (route.params?.orderData) {
      setOrderData(route.params.orderData);
      setLoading(false);
    } else if (route.params?.orderId) {
      fetchOrderData(route.params.orderId);
    } else {
      setLoading(false);
      Alert.alert(
        "Error", 
        "No se pudo cargar la información del pedido para realizar el pago",
        [{ text: "Volver", onPress: () => navigation.goBack() }]
      );
    }
  }, [route.params, fetchOrderData]);
  
  // Función para validar datos de tarjeta
  const validateCardData = () => {
    // Validación básica: asegurarse de que todos los campos estén completos
    // y que el número de tarjeta tenga 16 dígitos (sin contar espacios)
    
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    
    if (cleanCardNumber.length !== 16 || !/^\d+$/.test(cleanCardNumber)) {
      setErrorMessage('El número de tarjeta debe tener 16 dígitos');
      return false;
    }
    
    if (!cardName.trim()) {
      setErrorMessage('Por favor, ingresa el nombre del titular');
      return false;
    }
    
    // Validar formato MM/YY
    if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setErrorMessage('La fecha de expiración debe tener formato MM/YY');
      return false;
    }
    
    // Validar CVC (3 o 4 dígitos)
    if (!cardCvc.trim() || !/^\d{3,4}$/.test(cardCvc)) {
      setErrorMessage('El código de seguridad debe tener 3 o 4 dígitos');
      return false;
    }
    
    return true;
  };
  
  // Función optimizada para procesar el pago
const handleProcessPayment = async () => {
  if (!validateCardData()) {
    return;
  }
  
  if (!orderData) {
    setErrorMessage('No hay información del pedido para procesar');
    return;
  }
  
  // Comenzar procesamiento
  setIsProcessing(true);
  setErrorMessage('');
  
  try {
    // Simulación de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Verificar que el usuario esté disponible y usar id de forma consistente
    const userId = user?.uid || user?.id;
    if (!userId) {
      throw new Error("No se puede identificar al usuario para el pago");
    }
    
    // Crear registro de pago en Firebase - estructura compatible con el componente admin
    const paymentData = {
      pedidoId: orderData.id,
      usuarioId: userId, // Usar variable verificada
      monto: orderData.total,
      propina: parseFloat(orderData.propina || 0),
      estado: 'completado',
      metodo: 'tarjeta', // Usar el mismo formato que en admin
      metodoPago: 'tarjeta', // Para compatibilidad con admin
      metodoPagoDetalle: `Tarjeta terminada en ${cardNumber.slice(-4)}`,
      referencia: `PAY-${Date.now().toString().slice(-8)}`,
      ultimosDigitos: cardNumber.slice(-4),
      fecha: serverTimestamp(),
      fechaPago: serverTimestamp()
    };
    
    // Guardar el pago en la colección de pagos
    const paymentRef = await addDoc(collection(db, 'pagos'), paymentData);
    
    // Actualizar el estado del pedido
    await updateDoc(doc(db, 'pedidos', orderData.id), {
      estado: 'pagado',
      pagoId: paymentRef.id,
      metodoPago: 'tarjeta', // Añadir esta información al pedido
      fechaPago: serverTimestamp(),
      // Añadir más datos para compatibilidad entre admin/client
      ultimosDigitosTarjeta: cardNumber.slice(-4),
      nombreTitular: cardName,
      total: orderData.total
    });
    
    // Si hay una reserva asociada, actualizar su estado
    if (orderData.reservaId) {
      await updateDoc(doc(db, 'reservas', orderData.reservaId), {
        estadoPago: 'completado',
        estado: 'confirmada'
      });
    }
    
    // Mostrar animación de éxito
    setIsPaymentComplete(true);
    
    // Esperar un momento y redirigir
    setTimeout(() => {
      navigation.navigate('Pedidos', {
        paidOrderId: orderData.id,
        showConfirmation: true,
        resetScreen: true, 
        timestamp: Date.now() 
      });
    }, 1500);
    
    
  } catch (error) {
    console.error("Error al procesar pago:", error);
    setErrorMessage('Ocurrió un error al procesar el pago. Inténtelo nuevamente.');
    setIsProcessing(false);
  }
};
  
  // Renderizar sección de pago con tarjeta - VERSIÓN OPTIMIZADA
  const renderCreditCardPayment = () => (
    <View style={styles.paymentSection}>
      <Text style={styles.sectionTitle}>Datos de la tarjeta</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Número de tarjeta</Text>
        <TextInput
          mode="outlined"
          value={cardNumber}
          onChangeText={(text) => {
            // Permitir solo números y formatear cada 4 dígitos
            const formatted = text.replace(/\s/g, '')
              .replace(/\D/g, '')
              .replace(/(.{4})/g, '$1 ')
              .trim();
            setCardNumber(formatted);
            if (errorMessage) setErrorMessage('');
          }}
          placeholder="1234 5678 9012 3456"
          keyboardType="number-pad"
          maxLength={19}
          style={styles.input}
          outlineColor="#ddd"
          activeOutlineColor="#FFC107"
          // Propiedades reducidas
          dense
        />
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.inputLabel}>Nombre del titular</Text>
        <TextInput
          mode="outlined"
          value={cardName}
          onChangeText={(text) => {
            setCardName(text);
            if (errorMessage) setErrorMessage('');
          }}
          placeholder="NOMBRE APELLIDO"
          style={styles.input}
          outlineColor="#ddd"
          activeOutlineColor="#FFC107"
          autoCapitalize="characters"
          // Propiedades reducidas
          dense
        />
      </View>
      
      <View style={styles.formRow}>
        <View style={[styles.formGroup, styles.formRowItem]}>
          <Text style={styles.inputLabel}>Fecha de expiración</Text>
          <TextInput
            mode="outlined"
            value={cardExpiry}
            onChangeText={(text) => {
              // Formatear como MM/YY
              const cleaned = text.replace(/\D/g, '');
              let formatted = cleaned;
              if (cleaned.length > 2) {
                formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
              }
              setCardExpiry(formatted);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="MM/YY"
            keyboardType="number-pad"
            maxLength={5}
            style={styles.input}
            outlineColor="#ddd"
            activeOutlineColor="#FFC107"
            // Propiedades reducidas
            dense
          />
        </View>
        
        <View style={[styles.formGroup, styles.formRowItem]}>
          <Text style={styles.inputLabel}>Código de seguridad</Text>
          <TextInput
            mode="outlined"
            value={cardCvc}
            onChangeText={(text) => {
              setCardCvc(text.replace(/\D/g, ''));
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="CVC"
            keyboardType="number-pad"
            maxLength={4}
            style={styles.input}
            outlineColor="#ddd"
            activeOutlineColor="#FFC107"
            secureTextEntry={true}
            // Propiedades reducidas
            dense
          />
        </View>
      </View>
    </View>
  );
  
  // Si está cargando o no hay datos del pedido
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Cargando información de pago...</Text>
      </View>
    );
  }
  
  // Si el pago está completado, mostrar confirmación
  if (isPaymentComplete) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="check-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>¡Pago completado!</Text>
        <Text style={styles.successMessage}>
          Tu pedido ha sido pagado correctamente.
          Redirigiendo a la pantalla de pedidos...
        </Text>
      </View>
    );
  }

  // Validación adicional por si orderData llega null a pesar de las comprobaciones
  if (!orderData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="alert-circle-outline" size={60} color="#FFC107" />
        <Text style={styles.errorTitle}>No se pudo cargar el pedido</Text>
        <Text style={styles.errorMessage}>No se encontró la información del pedido para realizar el pago.</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        >
          Volver
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={[styles.header, { height: headerHeight }]}>
        <ImageBackground 
          source={require('../../../assets/images/payment_bg.jpg')} 
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Realizar Pago</Text>
              <Text style={styles.headerSubtitle}>
                Pedido #{orderData?.id?.slice(-6) || 'N/A'}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          // Simplificado para mejorar rendimiento - sin animaciones complejas
          const offset = e.nativeEvent.contentOffset.y;
          if (offset > 50 && headerHeight !== 100) {
            setHeaderHeight(100);
          } else if (offset <= 50 && headerHeight !== 180) {
            setHeaderHeight(180);
          }
        }}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={true}
      >
        <Surface style={styles.orderSummary} elevation={3}>
          <View style={styles.orderTitleRow}>
            <Icon name="file-document-outline" size={22} color="#FFC107" />
            <Text style={styles.orderTitle}>Resumen del pedido</Text>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.orderItems}>
            {orderData.items && orderData.items.map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.orderItemQtyContainer}>
                  <Text style={styles.orderItemQty}>{item.cantidad}x</Text>
                </View>
                <View style={styles.orderItemDetails}>
                  <Text style={styles.orderItemName}>{item.nombre}</Text>
                  {item.subtotal && (
                    <Text style={styles.orderItemPrice}>{item.subtotal.toFixed(2)} $</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
          
          {orderData.descuentoAplicado > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountLabel}>Descuento ({orderData.descuentoAplicado}%)</Text>
              <Text style={styles.discountValue}>
                -{((orderData.total / (1 - orderData.descuentoAplicado/100)) - orderData.total).toFixed(2)} $
              </Text>
            </View>
          )}
          
          {orderData.cargoReserva > 0 && (
            <View style={styles.chargeRow}>
              <Text style={styles.chargeLabel}>Cargo de reserva</Text>
              <Text style={styles.chargeValue}>{orderData.cargoReserva.toFixed(2)} $</Text>
            </View>
          )}
          
          <Divider style={styles.totalDivider} />
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.totalValue}>{orderData.total.toFixed(2)} $</Text>
          </View>
        </Surface>
        
        <Surface style={styles.paymentMethodContainer} elevation={3}>
          <View style={styles.sectionTitleRow}>
            <Icon name="credit-card-outline" size={22} color="#FFC107" />
            <Text style={styles.sectionTitle}>Datos de pago</Text>
          </View>
          
          {renderCreditCardPayment()}
          
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color="#F44336" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
        </Surface>
        
        <View style={styles.securityNote}>
          <Icon name="shield-check" size={20} color="#4CAF50" style={styles.securityIcon} />
          <Text style={styles.securityText}>
            Todos los pagos son procesados de forma segura. No almacenamos tus datos de tarjeta.
          </Text>
        </View>
      </ScrollView>
      
      <Surface style={styles.footer} elevation={8}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
          labelStyle={styles.cancelButtonLabel}
          icon="arrow-left"
        >
          Volver
        </Button>
        
        <Button
          mode="contained"
          onPress={handleProcessPayment}
          style={styles.payButton}
          labelStyle={styles.payButtonLabel}
          loading={isProcessing}
          disabled={isProcessing}
          icon={isProcessing ? null : "check-circle"}
        >
          {isProcessing ? 'Procesando...' : `Pagar ${orderData.total.toFixed(2)} $`}
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 15,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 10,
    backgroundColor: '#FFC107',
  },
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    width: '100%',
    height: '100%',
    padding: 20,
    paddingTop: 50,
    justifyContent: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para el botón de pago
  },
  orderSummary: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  orderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  divider: {
    marginVertical: 12,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  orderItemQtyContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  orderItemQty: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555',
  },
  orderItemDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  discountLabel: {
    fontSize: 16,
    color: '#4CAF50',
  },
  discountValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  chargeLabel: {
    fontSize: 16,
    color: '#666',
  },
  chargeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalDivider: {
    marginVertical: 12,
    height: 1.5,
    backgroundColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFC107',
  },
  paymentMethodContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  paymentSection: {
    marginTop: 10,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  formRowItem: {
    width: '48%',
  },
  inputLabel: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    height: 50, // Altura optimizada
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  securityIcon: {
    marginRight: 10,
  },
  securityText: {
    color: '#4CAF50',
    fontSize: 14,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    marginRight: 12,
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  cancelButtonLabel: {
    color: '#FFC107',
    fontWeight: 'bold',
  },
  payButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
  },
  payButtonLabel: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 20,
    marginBottom: 10,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default UserPagosScreen;