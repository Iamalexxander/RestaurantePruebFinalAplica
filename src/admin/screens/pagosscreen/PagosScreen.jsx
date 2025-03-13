// src/screens/PagosScreen.jsx
import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
  ImageBackground
} from 'react-native';
import { 
  Title, 
  Button, 
  Dialog, 
  Portal, 
  Text, 
  Card, 
  Chip, 
  ActivityIndicator,
  RadioButton, 
  TextInput,
  FAB,
  Surface,
  Divider
} from 'react-native-paper';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  FadeIn
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const { width } = Dimensions.get('window');

const PagosScreen = () => {
  const { 
    pedidos,
    loading
  } = useContext(DatabaseContext);
  
  const [allPagos, setAllPagos] = useState([]);
  const [loadingPagos, setLoadingPagos] = useState(false);

  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 60 : 160),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  // Efecto para cargar pagos directamente desde Firestore
  useEffect(() => {
    const loadPagosFromFirestore = async () => {
      setLoadingPagos(true);
      try {
        const pagosQuery = query(
          collection(db, 'pagos'), 
          orderBy('fecha', 'desc')
        );
        
        const pagosSnapshot = await getDocs(pagosQuery);
        let pagosData = [];
        
        // Obtener todos los pagos
        for (const doc of pagosSnapshot.docs) {
          const pagoData = {
            id: doc.id,
            ...doc.data()
          };
          
          // Si hay pedidoId, obtener datos adicionales del pedido
          if (pagoData.pedidoId && pedidos) {
            const pedido = pedidos.find(p => p.id === pagoData.pedidoId);
            if (pedido) {
              pagoData.fechaCreacion = pedido.fechaCreacion;
              pagoData.mesaId = pedido.mesaId;
              pagoData.items = pedido.items;
            }
          }
          
          pagosData.push(pagoData);
        }
        
        setAllPagos(pagosData);
      } catch (error) {
        console.error("Error al cargar pagos: ", error);
        Alert.alert("Error", "No se pudieron cargar los pagos");
      } finally {
        setLoadingPagos(false);
      }
    };
    
    loadPagosFromFirestore();
  }, [pedidos]);

  const renderPagoItem = ({ item, index }) => {
    // Verificar que todos los objetos necesarios existan para evitar errores
    // Fechas del pago
    const fechaPago = item.fecha ? new Date(item.fecha.seconds * 1000) : (
      item.fechaPago ? new Date(item.fechaPago.seconds * 1000) : new Date()
    );
    
    // Determinar método de pago
    const metodo = item.metodoPago || item.metodo || 'N/A';
    
    // Función para obtener el color del fondo según el método de pago
    const getBackgroundColor = () => {
      if (metodo === 'efectivo') return '#4CAF50';
      if (metodo === 'tarjeta') return '#3F51B5';
      return '#FF9800';
    };
    
    // Función para obtener el icono según el método de pago
    const getStatusIcon = () => {
      if (metodo === 'efectivo') return require('../../../assets/icons/cash.png');
      if (metodo === 'tarjeta') return require('../../../assets/icons/card.png');
      return require('../../../assets/icons/mobile.png');
    };
    
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        style={styles.cardContainer}
      >
        <Surface style={styles.card}>
          <LinearGradient
            colors={[getBackgroundColor(), darkenColor(getBackgroundColor(), 30)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeader}
          >
            <View style={styles.cardHeaderContent}>
              <Text style={styles.cardTitle}>
                Pago #{item.pedidoId ? item.pedidoId.slice(-4) : item.id.slice(-4)}
              </Text>
              <View style={styles.chipContainer}>
                <Image source={getStatusIcon()} style={styles.statusIcon} />
                <Text style={styles.statusText}>
                  {metodo.toUpperCase()}
                </Text>
              </View>
            </View>
          </LinearGradient>
          
          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Referencia</Text>
                <Text style={styles.infoValue}>{item.referencia ? item.referencia.slice(-6) : 'N/A'}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>
                  {fechaPago.toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Hora</Text>
                <Text style={styles.infoValue}>
                  {fechaPago.toLocaleTimeString().substring(0, 5)}
                </Text>
              </View>
            </View>
            
            {(item.propina > 0 || parseFloat(item.propina || 0) > 0) && (
              <View style={styles.propinaContainer}>
                <Text style={styles.propinaLabel}>Propina</Text>
                <Text style={styles.propinaValue}>
                  {typeof item.propina === 'number' 
                    ? item.propina.toFixed(2) 
                    : parseFloat(item.propina || 0).toFixed(2)} $
                </Text>
              </View>
            )}
            
            {item.metodoPagoDetalle && (
              <View style={styles.detalleContainer}>
                <Text style={styles.detalleLabel}>Detalle</Text>
                <Text style={styles.detalleValue}>{item.metodoPagoDetalle}</Text>
              </View>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {(typeof item.monto === 'number' 
                  ? item.monto 
                  : (typeof item.total === 'number' 
                    ? item.total 
                    : parseFloat(item.monto || item.total || 0))).toFixed(2)} $
              </Text>
            </View>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  // Si está cargando
  if (loading || loadingPagos) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando historial de pagos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground 
          source={require('../../../assets/images/payment_header.jpg')} 
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Historial de Pagos</Text>
            <Text style={styles.headerSubtitle}>Registro de transacciones</Text>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
      
      {allPagos.length > 0 ? (
        <FlatList
          data={allPagos}
          renderItem={renderPagoItem}
          keyExtractor={item => `pago-${item.id}`}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={e => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        />
      ) : (
        <View style={styles.emptyState}>
          <Image 
            source={require('../../../assets/icons/empty.png')} 
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>
            No hay historial de pagos disponible
          </Text>
        </View>
      )}
    </View>
  );
};

// Función auxiliar para oscurecer colores
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
  list: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    overflow: 'hidden',
    borderRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  cardHeader: {
    padding: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3
  },
  chipContainer: {
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
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  cardBody: {
    padding: 16,
    backgroundColor: 'white',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  propinaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  propinaLabel: {
    fontSize: 14,
    color: '#666',
  },
  propinaValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  detalleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detalleLabel: {
    fontSize: 14,
    color: '#666',
  },
  detalleValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 10,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  }
});

export default PagosScreen;