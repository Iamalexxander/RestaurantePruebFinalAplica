import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Alert
} from 'react-native';
import {
  Text,
  Surface,
  Chip,
  Searchbar,
  FAB,
  ActivityIndicator,
  Badge,
  Banner,
  Button,
  Modal,
  Portal,
  ProgressBar,
} from 'react-native-paper';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { CartContext } from '../../../contexts/CartContext';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring, SlideInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

// Importar las mismas imágenes disponibles que en MenuScreen (Admin)
const AVAILABLE_IMAGES = {
  'food1': require('../../../assets/images/food1.jpg'),
  'food2': require('../../../assets/images/food2.jpg'),
  'food3': require('../../../assets/images/food3.jpg'),
  'food4': require('../../../assets/images/food4.jpg'),
  'food5': require('../../../assets/images/food5.jpg'),
  'food6': require('../../../assets/images/food6.jpg'),
  'paella': require('../../../assets/images/paella.jpg'),
  'tortilla': require('../../../assets/images/tortilla.jpg'),
  'pulpo': require('../../../assets/images/pulpo.jpg'),
  'sangria': require('../../../assets/images/sangria.jpg'),
  'crema_catalana': require('../../../assets/images/crema_catalana.jpg'),
};

const CATEGORIES = [
  {
    id: 'entrantes',
    name: 'Entrantes',
    icon: require('../../../assets/icons/category1_colored.png')
  },
  {
    id: 'principales',
    name: 'Principales',
    icon: require('../../../assets/icons/category2_colored.png')
  },
  {
    id: 'postres',
    name: 'Postres',
    icon: require('../../../assets/icons/category3_colored.png')
  },
  {
    id: 'bebidas',
    name: 'Bebidas',
    icon: require('../../../assets/icons/category4_colored.png')
  }
];

const UserMenuScreen = ({ navigation, route }) => {
  const { platos, loading, updatePlato } = useContext(DatabaseContext);
  const { addToCart, cartItems, clearCart, updateCartItemQuantity } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [addedToCartMessage, setAddedToCartMessage] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [showReservationBanner, setShowReservationBanner] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stockErrorMessage, setStockErrorMessage] = useState('');

  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 60 : 180),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  // Actualizar searchQuery cuando cambie route.params?.searchQuery
  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
  }, [route.params?.searchQuery]);

  // Cargar detalles de la reserva si se proporciona
  useEffect(() => {
    if (route.params?.reservationId) {
      loadReservationDetails(route.params.reservationId);
      setShowReservationBanner(true);
    }
  }, [route.params?.reservationId]);

  // Cargar los detalles de la reserva
  const loadReservationDetails = async (reservationId) => {
    try {
      const reservationRef = doc(db, 'reservas', reservationId);
      const reservationSnap = await getDoc(reservationRef);

      if (reservationSnap.exists()) {
        setReservationDetails({
          id: reservationSnap.id,
          ...reservationSnap.data()
        });
      } else {
        console.error("La reserva no existe");
        Alert.alert("Error", "No se encontró la reserva especificada");
      }
    } catch (error) {
      console.error("Error cargando reserva:", error);
      Alert.alert("Error", "No se pudo cargar la información de la reserva");
    }
  };

  // Limpiar mensaje de "añadido al carrito" después de 2 segundos
  useEffect(() => {
    if (addedToCartMessage) {
      const timer = setTimeout(() => {
        setAddedToCartMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [addedToCartMessage]);

  // Obtener la cantidad total de items en el carrito
  const getTotalCartItems = () => {
    return cartItems ? cartItems.reduce((total, item) => total + item.cantidad, 0) : 0;
  };

  // Calcular el total del carrito
  const getCartTotal = () => {
    return cartItems ? cartItems.reduce((total, item) => total + (item.precio * item.cantidad), 0) : 0;
  };

  // Calcular el total final incluyendo el cargo de reserva
  const getFinalTotal = () => {
    const cartTotal = getCartTotal();
    const reservationFee = reservationDetails ? 5.00 : 0; // Cargo base de reserva
    return cartTotal + reservationFee;
  };

  // Filtrar platos por categoría y búsqueda
  const filteredPlatos = platos.filter(plato => {
    // Solo mostrar platos disponibles y con stock > 0
    if (!plato.disponible || (plato.stock !== undefined && plato.stock <= 0)) return false;

    const matchesSearch = plato.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plato.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategoria = selectedCategory === 'todas' || plato.categoria === selectedCategory;
    return matchesSearch && matchesCategoria;
  });

  // Obtener imagen desde el ID de imagen
  const getImageSource = (imageId) => {
    if (typeof imageId === 'string' && AVAILABLE_IMAGES[imageId]) {
      return AVAILABLE_IMAGES[imageId];
    } else if (typeof imageId === 'object') {
      // Si es un objeto de imagen (compatibilidad con versiones anteriores)
      return imageId;
    }
    return require('../../../assets/default-image.png');
  };

  // Modificar la función handleAddToCart para tener en cuenta el stock
  const handleAddToCart = async (dish) => {
    try {
      setStockErrorMessage('');
      
      // Obtener cantidad actual en el carrito (si existe)
      const currentCartItem = cartItems.find(item => item.id === dish.id);
      const currentQuantity = currentCartItem ? currentCartItem.cantidad : 0;
      
      // Verificar si hay suficiente stock
      if (dish.stock !== undefined && currentQuantity >= dish.stock) {
        setStockErrorMessage(`No hay suficiente stock de ${dish.nombre}. Disponibles: ${dish.stock}`);
        return;
      }
      
      // Añadir al carrito
      addToCart(dish);
      setAddedToCartMessage(dish.nombre);
      
    } catch (error) {
      console.error("Error al añadir al carrito:", error);
      Alert.alert("Error", "No se pudo añadir el plato al carrito");
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

  // Verificar stock disponible para todos los elementos del carrito
  const validateCartStock = () => {
    for (const cartItem of cartItems) {
      const menuItem = platos.find(p => p.id === cartItem.id);
      if (menuItem && menuItem.stock !== undefined && cartItem.cantidad > menuItem.stock) {
        return {
          valid: false,
          message: `No hay suficiente stock de ${cartItem.nombre}. Disponibles: ${menuItem.stock}`
        };
      }
    }
    return { valid: true };
  };

  // Función modificada para confirmar el pedido
  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Error", "Tu carrito está vacío. Añade algún plato antes de continuar.");
      return;
    }

    // Verificar stock para todos los items
    const stockValidation = validateCartStock();
    if (!stockValidation.valid) {
      Alert.alert("Stock insuficiente", stockValidation.message);
      return;
    }

    try {
      // En lugar de crear el pedido aquí, simplemente redirigimos al usuario a la pantalla de carrito
      // con información sobre la reserva como parámetro
      navigation.navigate('Carrito', {
        reservationId: reservationDetails ? reservationDetails.id : null,
        reservationDetails: reservationDetails
      });

      // Cerramos el modal de confirmación
      setShowConfirmModal(false);
    } catch (error) {
      console.error("Error al navegar:", error);
      Alert.alert("Error", "No se pudo procesar tu solicitud. Intenta nuevamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item.id)}
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected
      ]}
    >
      <Surface style={[
        styles.categoryIconContainer,
        selectedCategory === item.id && styles.categoryIconContainerSelected
      ]}>
        <Image source={item.icon} style={styles.categoryIcon} />
      </Surface>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.categoryTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderDishItem = ({ item, index }) => {
    // Calcular si el plato está en oferta
    const isDiscounted = item.descuento && item.descuento > 0;
    const finalPrice = isDiscounted
      ? item.precio - (item.precio * item.descuento / 100)
      : item.precio;

    // Verificar si el plato está en el carrito
    const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
    const isInCart = !!cartItem;
    const currentCartQuantity = cartItem ? cartItem.cantidad : 0;

    // Calcular el porcentaje de stock disponible (para la barra de progreso)
    const maxStock = item.stock || 10;
    const stockPercentage = Math.min(1, Math.max(0, (maxStock - currentCartQuantity) / maxStock));
    
    // Determinar el color de la barra de stock según el porcentaje
    let stockBarColor = '#4CAF50'; // Verde por defecto
    if (stockPercentage <= 0.2) {
      stockBarColor = '#F44336'; // Rojo si hay poco stock
    } else if (stockPercentage <= 0.5) {
      stockBarColor = '#FFC107'; // Amarillo si hay medio stock
    }

    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        style={styles.dishCard}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('DishDetail', { dish: item })}
        >
          <Image
            source={getImageSource(item.imagen)}
            style={styles.dishImage}
          />
          {item.destacado && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Destacado</Text>
            </View>
          )}

          {isDiscounted && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{`-${item.descuento}%`}</Text>
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.dishGradient}
          >
            <Text style={styles.dishName}>{item.nombre}</Text>
            <Text numberOfLines={2} style={styles.dishDescription}>
              {item.descripcion}
            </Text>

            <View style={styles.stockIndicatorContainer}>
              <Text style={styles.stockIndicatorText}>
                Disponibles: {item.stock !== undefined ? item.stock - currentCartQuantity : 'Sin límite'}
              </Text>
              <ProgressBar 
                progress={stockPercentage} 
                color={stockBarColor} 
                style={styles.stockProgressBar} 
              />
            </View>

            <View style={styles.dishFooter}>
              <Chip mode="outlined" style={styles.categoryChip} textStyle={styles.categoryChipText}>
                {CATEGORIES.find(cat => cat.id === item.categoria)?.name || item.categoria}
              </Chip>

              <View style={styles.priceContainer}>
                {isDiscounted && (
                  <Text style={styles.originalPrice}>{item.precio.toFixed(2)} $</Text>
                )}
                <Text style={styles.dishPrice}>{finalPrice.toFixed(2)} $</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                isInCart && styles.addButtonActive
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={item.stock !== undefined && currentCartQuantity >= item.stock}
            >
              <Image
                source={isInCart
                  ? require('../../../assets/icons/cart_colored.png')
                  : require('../../../assets/icons/add_cart_colored.png')}
                style={styles.addButtonIcon}
              />
              {isInCart && (
                <Badge
                  size={22}
                  style={styles.itemCountBadge}
                  visible={true}
                >
                  {currentCartQuantity}
                </Badge>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleScroll = (event) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner de stock error */}
      {stockErrorMessage && (
        <Banner
          visible={!!stockErrorMessage}
          actions={[
            {
              label: 'Entendido',
              onPress: () => setStockErrorMessage(''),
            }
          ]}
          icon={({ size }) => (
            <Icon name="alert-circle" size={size} color="#F44336" />
          )}
          style={styles.stockErrorBanner}
        >
          {stockErrorMessage}
        </Banner>
      )}

      {/* Banner de reserva */}
      {showReservationBanner && reservationDetails && (
        <Banner
          visible={showReservationBanner}
          actions={[
            {
              label: 'Cerrar',
              onPress: () => setShowReservationBanner(false),
            }
          ]}
          icon={({ size }) => (
            <Image
              source={require('../../../assets/icons/calendar_colored.png')}
              style={{ width: size, height: size }}
            />
          )}
          style={styles.reservationBanner}
        >
          Seleccionando menú para tu reserva del {formatDate(reservationDetails.fecha)} -
          {reservationDetails.personas} {reservationDetails.personas === 1 ? 'persona' : 'personas'} -
          Mesa en {reservationDetails.ubicacionMesa === 'terraza' ? 'terraza' : 'interior'}
        </Banner>
      )}

      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground
          source={require('../../../assets/images/food2.jpg')}
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Nuestro Menú</Text>
            <Searchbar
              placeholder="Buscar platos..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              icon="magnify"
              iconColor="#FFC107"
            />
          </LinearGradient>
        </ImageBackground>
      </Animated.View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: 'todas', name: 'Todas', icon: require('../../../assets/icons/all_colored.png') },
            ...CATEGORIES
          ]}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {filteredPlatos.length > 0 ? (
        <FlatList
          data={filteredPlatos}
          renderItem={renderDishItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.dishesList}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      ) : (
        <View style={styles.emptyState}>
          <Image
            source={require('../../../assets/icons/empty_colored.png')}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>
            No se encontraron platos que coincidan con tu búsqueda
          </Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setSearchQuery('');
              setSelectedCategory('todas');
            }}
          >
            <Text style={styles.resetButtonText}>Mostrar todos los platos</Text>
          </TouchableOpacity>
        </View>
      )}

      {addedToCartMessage && (
        <Animated.View
          style={styles.addedToCartContainer}
          entering={SlideInRight}
        >
          <Text style={styles.addedToCartText}>
            ¡{addedToCartMessage} añadido al carrito!
          </Text>
        </Animated.View>
      )}

      {getTotalCartItems() > 0 && (
        <FAB
          style={styles.fab}
          icon="cart-check"
          label={reservationDetails ? "Confirmar pedido" : "Ver carrito"}
          onPress={() => {
            if (reservationDetails) {
              setShowConfirmModal(true);
            } else {
              navigation.navigate('Carrito');
            }
          }}
          color="white"
          // Mostrar cantidad de productos en FAB
          badge={getTotalCartItems() > 0 ? getTotalCartItems().toString() : undefined}
        />
      )}

      {/* Modal de confirmación de pedido */}
      <Portal>
        <Modal
          visible={showConfirmModal}
          onDismiss={() => setShowConfirmModal(false)}
          contentContainerStyle={styles.confirmModalContainer}
        >
          <View style={styles.confirmModalHeader}>
            <Text style={styles.confirmModalTitle}>Confirmar Pedido</Text>
            <TouchableOpacity
              onPress={() => setShowConfirmModal(false)}
              style={styles.confirmModalCloseButton}
            >
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmModalSubtitle}>Resumen de tu pedido</Text>

            <View style={styles.confirmModalReservation}>
              <Icon name="calendar-clock" size={24} color="#FFC107" style={styles.confirmModalIcon} />
              <View style={styles.confirmModalReservationDetails}>
                <Text style={styles.confirmModalReservationTitle}>Reserva para {reservationDetails?.personas} personas</Text>
                <Text style={styles.confirmModalReservationDate}>{formatDate(reservationDetails?.fecha)}</Text>
                <Text style={styles.confirmModalReservationLocation}>
                  Mesa en {reservationDetails?.ubicacionMesa === 'terraza' ? 'terraza' : 'interior'}
                </Text>
              </View>
            </View>

            <Text style={styles.confirmModalItemsTitle}>Artículos seleccionados:</Text>
            <FlatList
              data={cartItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const menuItem = platos.find(p => p.id === item.id);
                const stockAvailable = menuItem && menuItem.stock !== undefined ? menuItem.stock : "Sin límite";
                
                return (
                  <View style={styles.confirmModalItem}>
                    <Text style={styles.confirmModalItemQty}>{item.cantidad}x</Text>
                    <View style={styles.confirmModalItemDetails}>
                      <Text style={styles.confirmModalItemName}>{item.nombre}</Text>
                      <Text style={styles.confirmModalItemStock}>
                        Stock: {stockAvailable !== "Sin límite" ? `${stockAvailable}/${menuItem.stock}` : stockAvailable}
                      </Text>
                    </View>
                    <Text style={styles.confirmModalItemPrice}>
                      {(item.precio * item.cantidad).toFixed(2)} $
                    </Text>
                  </View>
                );
              }}
              style={styles.confirmModalItems}
            />

            <View style={styles.confirmModalSummary}>
              <View style={styles.confirmModalSummaryRow}>
                <Text style={styles.confirmModalSummaryLabel}>Subtotal menú:</Text>
                <Text style={styles.confirmModalSummaryValue}>{getCartTotal().toFixed(2)} $</Text>
              </View>

              <View style={styles.confirmModalSummaryRow}>
                <Text style={styles.confirmModalSummaryLabel}>Cargo de reserva:</Text>
                <Text style={styles.confirmModalSummaryValue}>5.00 $</Text>
              </View>

              <View style={[styles.confirmModalSummaryRow, styles.confirmModalTotal]}>
                <Text style={styles.confirmModalTotalLabel}>TOTAL:</Text>
                <Text style={styles.confirmModalTotalValue}>{getFinalTotal().toFixed(2)} $</Text>
              </View>
            </View>

            <View style={styles.confirmModalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowConfirmModal(false)}
                style={styles.confirmModalCancelButton}
                disabled={isProcessing}
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                onPress={handleConfirmOrder}
                style={styles.confirmModalConfirmButton}
                loading={isProcessing}
                disabled={isProcessing}
              >
                Confirmar Pedido
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
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
  },
  reservationBanner: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFCC80',
    borderWidth: 1,
  },
  stockErrorBanner: {
    backgroundColor: '#FFEBEE',
    borderColor: '#FFCDD2',
    borderWidth: 1,
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  logoContainer: {
    position: "absolute",
    top: 10,
    left: 20,
    zIndex: 10,
  },
  logoImage: {
    width: 80,
    height: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  searchBar: {
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    backgroundColor: 'white',
  },
  categoriesContainer: {
    marginTop: 15,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryItemSelected: {
    transform: [{ scale: 1.1 }]
  },
  categoryIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  categoryIconContainerSelected: {
    backgroundColor: '#FFF8E1',
    borderWidth: 2,
    borderColor: '#FFC107', // Amarillo para usuario
  },
  categoryIcon: {
    width: 32,
    height: 32,
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#FFC107', // Amarillo para usuario
    fontWeight: 'bold',
  },
  dishesList: {
    padding: 15,
    paddingBottom: 80,
  },
  dishCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dishImage: {
    width: '100%',
    height: 220,
  },
  featuredBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FFC107', // Amarillo para usuario
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  featuredText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#E91E63',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dishGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  dishName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  dishDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  stockIndicatorContainer: {
    marginTop: 10,
    marginBottom: 5,
  },
  stockIndicatorText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  stockProgressBar: {
    height: 5,
    borderRadius: 3,
  },
  dishFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  categoryChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
  },
  categoryChipText: {
    color: 'white',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'line-through',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  dishPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5
  },
  addButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFC107', // Amarillo para usuario
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  addButtonActive: {
    backgroundColor: '#4CAF50',
  },
  addButtonIcon: {
    width: 24,
    height: 24,
  },
  itemCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF9800',
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#FFC107', // Amarillo para usuario
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFC107', // Amarillo para usuario
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  addedToCartContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 10,
    borderRadius: 8,
    elevation: 5,
  },
  addedToCartText: {
    color: 'white',
    fontWeight: 'bold',
  },
  confirmModalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  confirmModalHeader: {
    backgroundColor: '#FFC107', // Amarillo para usuario
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmModalTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  confirmModalCloseButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    padding: 20,
  },
  confirmModalSubtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  confirmModalReservation: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107', // Amarillo para usuario
  },
  confirmModalIcon: {
    marginRight: 10,
  },
  confirmModalReservationDetails: {
    flex: 1,
  },
  confirmModalReservationTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  resetButtonText: {
    color: "black"
  },
  confirmModalReservationDate: {
    color: '#666',
  },
  confirmModalReservationLocation: {
    color: '#666',
  },
  confirmModalItemsTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmModalItems: {
    maxHeight: 200,
    marginBottom: 15,
  },
  confirmModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  confirmModalItemQty: {
    fontWeight: 'bold',
    width: 30,
  },
  confirmModalItemDetails: {
    flex: 1,
  },
  confirmModalItemName: {
    fontWeight: '500',
  },
  confirmModalItemStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  confirmModalItemPrice: {
    fontWeight: 'bold',
    width: 70,
    textAlign: 'right',
  },
  confirmModalSummary: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  confirmModalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  confirmModalSummaryLabel: {
    color: '#666',
  },
  confirmModalSummaryValue: {
    fontWeight: 'bold',
  },
  confirmModalTotal: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  confirmModalTotalLabel: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmModalTotalValue: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#FFC107', // Amarillo para usuario
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmModalCancelButton: {
    flex: 1,
    marginRight: 10,
  },
  confirmModalConfirmButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
  },
});

export default UserMenuScreen;