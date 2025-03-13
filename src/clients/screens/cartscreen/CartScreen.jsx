import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
  ImageBackground,
} from "react-native";
import {
  Text,
  Surface,
  Button,
  Divider,
  FAB,
  ActivityIndicator,
  IconButton,
  Portal,
  Modal,
  TextInput,
  Banner,
  Chip,
} from "react-native-paper";
import { CartContext } from "../../../contexts/CartContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { DatabaseContext } from "../../../contexts/DatabaseContext";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../services/firebase";

const { width } = Dimensions.get("window");

// Importamos las mismas imágenes que en UserMenuScreen
const AVAILABLE_IMAGES = {
  food1: require("../../../assets/images/food1.jpg"),
  food2: require("../../../assets/images/food2.jpg"),
  food3: require("../../../assets/images/food3.jpg"),
  food4: require("../../../assets/images/food4.jpg"),
  food5: require("../../../assets/images/food5.jpg"),
  food6: require("../../../assets/images/food6.jpg"),
  paella: require("../../../assets/images/paella.jpg"),
  tortilla: require("../../../assets/images/tortilla.jpg"),
  pulpo: require("../../../assets/images/pulpo.jpg"),
  sangria: require("../../../assets/images/sangria.jpg"),
  crema_catalana: require("../../../assets/images/crema_catalana.jpg"),
};

const CartScreen = ({ navigation, route }) => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotal } =
    useContext(CartContext);
  const { user } = useContext(AuthContext);
  const { loading } = useContext(DatabaseContext);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoCodeData, setPromoCodeData] = useState(null);
  const [reservationDetails, setReservationDetails] = useState(null);
  const [showReservationBanner, setShowReservationBanner] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoCodeError, setPromoCodeError] = useState("");

  // Animated header
  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 120 : 180),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  // Detectar si llegamos desde una pantalla con reserva
  useEffect(() => {
    if (route.params?.reservationDetails) {
      setReservationDetails(route.params.reservationDetails);
      setShowReservationBanner(true);
    } else if (route.params?.reservationId) {
      loadReservationDetails(route.params.reservationId);
    }
  }, [route.params]);

  // Recalcular el descuento si el carrito cambia
  useEffect(() => {
    if (promoApplied && promoCodeData) {
      calculateDiscountAmount();
    }
  }, [cartItems]);

  // Cargar detalles de reserva si solo tenemos el ID
  const loadReservationDetails = async (reservationId) => {
    if (!reservationId) return;

    try {
      const reservationRef = doc(db, "reservas", reservationId);
      const reservationSnap = await getDoc(reservationRef);

      if (reservationSnap.exists()) {
        const reservationData = {
          id: reservationSnap.id,
          ...reservationSnap.data(),
        };
        setReservationDetails(reservationData);
        setShowReservationBanner(true);
      }
    } catch (error) {
      console.error("Error al cargar detalles de reserva:", error);
    }
  };

  // Calcular la cantidad de descuento según el tipo de promoción
  const calculateDiscountAmount = () => {
    if (!promoCodeData) return 0;

    const subtotal = getTotal();
    let discountValue = 0;

    if (promoCodeData.tipo === "porcentaje") {
      discountValue = subtotal * (promoCodeData.descuento / 100);
    } else if (promoCodeData.tipo === "monto") {
      discountValue = Math.min(subtotal, promoCodeData.descuento); // El descuento no puede ser mayor que el subtotal
    }

    setDiscountAmount(discountValue);
    return discountValue;
  };

  // Obtener imagen desde el ID de imagen
  const getImageSource = (imageId) => {
    if (typeof imageId === "string" && AVAILABLE_IMAGES[imageId]) {
      return AVAILABLE_IMAGES[imageId];
    } else if (typeof imageId === "object") {
      // Si es un objeto de imagen (compatibilidad con versiones anteriores)
      return imageId;
    }
    return require("../../../assets/default-image.png");
  };

  // Verificar si el carrito está vacío
  const isCartEmpty = cartItems.length === 0;

  // Actualizar la cantidad de un producto
  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      Alert.alert(
        "Eliminar producto",
        "¿Estás seguro de que quieres eliminar este producto?",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Eliminar",
            onPress: () => removeFromCart(id),
          },
        ]
      );
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  // Verificar si un producto está aplicable para la promoción
  const isProductApplicableForPromo = (item) => {
    if (!promoCodeData || !promoCodeData.aplicaA) return true;

    // Si no hay restricciones, aplica a todo
    if (promoCodeData.aplicaA.length === 0) return true;

    // Verificar si aplica a la categoría del producto
    return (
      promoCodeData.aplicaA.includes(item.categoria) ||
      promoCodeData.aplicaA.includes(item.id)
    );
  };

  // Aplicar código promocional
  const applyPromoCode = async () => {
    // Resetear estados previos
    setPromoCodeError("");

    if (!promoCode.trim()) {
      setPromoCodeError("Por favor, ingresa un código promocional");
      return;
    }

    // Poner el código en mayúsculas para comparar
    const codeTrimmed = promoCode.trim().toUpperCase();

    try {
      // Buscar el código en las promociones
      const promocionesRef = collection(db, "promociones");
      const q = query(
        promocionesRef,
        where("codigo", "==", codeTrimmed),
        where("activa", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setPromoCodeError(
          "El código promocional ingresado no es válido o ha expirado"
        );
        return;
      }

      // Obtener la primera promoción que coincida
      const promoDoc = querySnapshot.docs[0];
      const promoData = { id: promoDoc.id, ...promoDoc.data() };

      // Verificar si ha alcanzado el máximo de usos
      if (
        promoData.usoMaximo &&
        promoData.usosActuales >= promoData.usoMaximo
      ) {
        setPromoCodeError(
          "Este código promocional ha alcanzado su límite de usos"
        );
        return;
      }

      // Verificar fechas de validez si existen
      if (promoData.fechaFin) {
        const fechaFin = new Date(promoData.fechaFin);
        const now = new Date();
        if (fechaFin < now) {
          setPromoCodeError("Este código promocional ha caducado");
          return;
        }
      }

      // Guardar los datos de la promoción
      setPromoCodeData(promoData);

      // Aplicar descuento según el tipo
      setDiscount(promoData.tipo === "porcentaje" ? promoData.descuento : 0);
      setPromoApplied(true);

      // Calcular el monto de descuento
      const discountValue = await calculateDiscountAmount();

      // Mostrar mensaje de éxito
      const message =
        promoData.tipo === "porcentaje"
          ? `Se ha aplicado un ${promoData.descuento}% de descuento a tu pedido`
          : `Se ha aplicado un descuento de ${promoData.descuento}$ a tu pedido`;

      Alert.alert("¡Promoción aplicada!", message);
    } catch (error) {
      console.error("Error al aplicar código promocional:", error);
      setPromoCodeError(
        "No se pudo validar el código promocional. Inténtalo de nuevo."
      );
    }
  };

  const updatePromoCodeUsage = async (promoId) => {
    if (!promoId) return;

    try {
      const promoRef = doc(db, "promociones", promoId);
      const promoDoc = await getDoc(promoRef);

      if (promoDoc.exists()) {
        const currentUses = promoDoc.data().usosActuales || 0;
        await updateDoc(promoRef, {
          usosActuales: currentUses + 1,
        });
      }
    } catch (error) {
      console.error("Error al actualizar usos de promoción:", error);
    }
  };

  const removePromoCode = () => {
    Alert.alert(
      "Eliminar promoción",
      "¿Estás seguro de que quieres eliminar el código promocional aplicado?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: () => {
            setPromoApplied(false);
            setPromoCodeData(null);
            setDiscount(0);
            setDiscountAmount(0);
            setPromoCode("");
          },
        },
      ]
    );
  };

  // Calcular el total con descuento
  const getTotalWithDiscount = () => {
    const subtotal = getTotal();
    if (promoApplied && promoCodeData) {
      if (promoCodeData.tipo === "porcentaje") {
        return subtotal - (subtotal * promoCodeData.descuento) / 100;
      } else if (promoCodeData.tipo === "monto") {
        return Math.max(0, subtotal - promoCodeData.descuento);
      }
    }
    return subtotal;
  };

  // Calcular el total final incluyendo cargo de reserva
  const getFinalTotal = () => {
    const discountedTotal = getTotalWithDiscount();
    const reservationFee = reservationDetails ? 5.0 : 0; // Cargo base de reserva
    return discountedTotal + reservationFee;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha no disponible";
    }
  };

  // Realizar pedido
  const handleSubmitOrder = async () => {
    if (isCartEmpty) {
      Alert.alert(
        "Error",
        "No puedes realizar un pedido con el carrito vacío."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar los items del pedido
      const orderItems = cartItems.map((item) => ({
        menuId: item.id,
        cantidad: item.cantidad,
        precio: item.precio,
        nombre: item.nombre,
        subtotal: item.precio * item.cantidad,
      }));

      // Calcular total con descuento y cargo de reserva
      const discountedTotal = getTotalWithDiscount();
      const reservationFee = reservationDetails ? 5.0 : 0;
      const finalTotal = discountedTotal + reservationFee;

      // Crear objeto de pedido
      const newOrder = {
        usuarioId: user.id,
        items: orderItems,
        estado: "pendiente",
        fechaPedido: serverTimestamp(),
        total: finalTotal,
        metodoPago: paymentMethod,
        notas: notes,
      };

      // Si hay descuento promocional, incluir datos de promoción
      if (promoApplied && promoCodeData) {
        newOrder.promocion = {
          id: promoCodeData.id,
          codigo: promoCodeData.codigo,
          tipo: promoCodeData.tipo,
          descuento: promoCodeData.descuento,
          montoDescuento:
            promoCodeData.tipo === "porcentaje"
              ? getTotal() * (promoCodeData.descuento / 100)
              : Math.min(getTotal(), promoCodeData.descuento),
        };
      }

      // Si hay reserva, añadir información de la reserva
      if (reservationDetails) {
        newOrder.reservaId = reservationDetails.id;
        newOrder.reservaFecha = reservationDetails.fecha;
        newOrder.reservaMesa = reservationDetails.ubicacion || "interior";
        newOrder.reservaPersonas =
          reservationDetails.comensales || reservationDetails.personas || 1;
        newOrder.cargoReserva = reservationFee;
      }

      // Guardar pedido en Firebase
      const orderRef = await addDoc(collection(db, "pedidos"), newOrder);

      // Actualizar el uso del código promocional
      if (promoApplied && promoCodeData?.id) {
        await updatePromoCodeUsage(promoCodeData.id);
      }

      // Si hay reserva, actualizar la reserva con el ID del pedido
      if (reservationDetails) {
        await updateDoc(doc(db, "reservas", reservationDetails.id), {
          tieneMenu: true,
          pedidoId: orderRef.id,
          estado: "pendiente_confirmacion",
        });
      }

      // Crear un pago pendiente asociado
      await addDoc(collection(db, "pagos"), {
        pedidoId: orderRef.id,
        usuarioId: user.id,
        monto: finalTotal,
        estado: "pendiente",
        metodo: paymentMethod,
        fecha: serverTimestamp(),
      });

      // Limpiar el carrito
      clearCart();

      // Mostrar confirmación y navegar según el método de pago
      setShowCheckoutModal(false);

      if (paymentMethod === "tarjeta") {
        // Si es pago con tarjeta, navegar a la pantalla de pago
        navigation.navigate("Pagos", {
          orderId: orderRef.id,
          orderData: {
            id: orderRef.id,
            ...newOrder,
          },
        });
      } else {
        // Si es pago en efectivo, ir a la pantalla de pedidos
        navigation.navigate("Pedidos", {
          newOrderId: orderRef.id,
          showConfirmation: true,
        });
      }
    } catch (error) {
      console.error("Error al crear pedido:", error);
      Alert.alert(
        "Error",
        "No se pudo procesar tu pedido. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar cancelación del carrito
  const handleClearCart = () => {
    Alert.alert(
      "Vaciar carrito",
      "¿Estás seguro de que quieres vaciar el carrito?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Vaciar",
          onPress: () => clearCart(),
        },
      ]
    );
  };

  // Renderizar cada item del carrito
  const renderCartItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 50)}
      exiting={FadeOut}
      style={styles.cartItem}
    >
      <LinearGradient
        colors={["#ffffff", "#f9f9f9"]}
        style={styles.cartItemGradient}
      >
        <Image source={getImageSource(item.imagen)} style={styles.itemImage} />

        <View style={styles.itemDetails}>
          <Text style={styles.itemName}>{item.nombre}</Text>
          <Text style={styles.itemPrice}>{item.precio.toFixed(2)} $</Text>
          <View style={styles.itemTags}>
            <Chip mode="outlined" style={styles.itemTag}>
              {item.categoria || "Menú"}
            </Chip>

            {/* Mostrar si aplica promoción */}
            {promoApplied &&
              promoCodeData &&
              isProductApplicableForPromo(item) && (
                <Chip
                  mode="flat"
                  style={styles.promoTag}
                  textStyle={{ color: "white" }}
                >
                  Con descuento
                </Chip>
              )}
          </View>
        </View>

        <View style={styles.itemControls}>
          <View style={styles.quantityContainer}>
            <IconButton
              icon="minus"
              size={18}
              mode="contained"
              containerColor="#FF6B6B"
              iconColor="white"
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.cantidad - 1)}
            />

            <Text style={styles.quantityText}>{item.cantidad}</Text>

            <IconButton
              icon="plus"
              size={18}
              mode="contained"
              containerColor="#FF6B6B"
              iconColor="white"
              style={styles.quantityButton}
              onPress={() => handleUpdateQuantity(item.id, item.cantidad + 1)}
            />
          </View>

          <Text style={styles.itemSubtotal}>
            {(item.precio * item.cantidad).toFixed(2)} $
          </Text>

          <IconButton
            icon="delete-outline"
            size={22}
            iconColor="#FF6B6B"
            style={styles.deleteButton}
            onPress={() => removeFromCart(item.id)}
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const handleScroll = (event) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando carrito...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Banner de reserva */}
      {showReservationBanner && reservationDetails && (
        <Banner
          visible={showReservationBanner}
          actions={[
            {
              label: "Cerrar",
              onPress: () => setShowReservationBanner(false),
            },
          ]}
          icon={({ size }) => (
            <Image
              source={require("../../../assets/icons/calendar_colored.png")}
              style={{ width: size, height: size }}
            />
          )}
          style={styles.reservationBanner}
        >
          Pedido para tu reserva del {formatDate(reservationDetails.fecha)} -
          {reservationDetails.comensales || reservationDetails.personas}
          {(reservationDetails.comensales || reservationDetails.personas) === 1
            ? " persona"
            : " personas"}{" "}
          - Mesa en{" "}
          {reservationDetails.ubicacion === "terraza" ? "terraza" : "interior"}
        </Banner>
      )}

      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground
          source={require("../../../assets/images/food3.jpg")}
          style={styles.headerImage}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.3)"]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Tu Carrito</Text>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Icon name="cart-outline" size={20} color="white" />
                  <Text style={styles.statText}>
                    {isCartEmpty
                      ? "Vacío"
                      : `${cartItems.length} ${
                          cartItems.length === 1 ? "producto" : "productos"
                        }`}
                  </Text>
                </View>

                {!isCartEmpty && (
                  <View style={styles.statItem}>
                    <Icon name="cash" size={20} color="white" />
                    <Text style={styles.statText}>
                      {getTotal().toFixed(2)} $
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>

      {isCartEmpty ? (
        <View style={styles.emptyCartContainer}>
          <Animated.View
            entering={FadeIn.delay(300)}
            style={styles.emptyCartAnimation}
          >
            <Image
              source={require("../../../assets/icons/empty_cart.png")}
              style={styles.emptyCartImage}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(500)}>
            <Text style={styles.emptyCartText}>Tu carrito está vacío</Text>
            <Text style={styles.emptyCartSubtext}>
              Añade productos de nuestro menú para realizar un pedido
            </Text>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(700)}>
            <Button
              mode="contained"
              onPress={() => navigation.navigate("Menú")}
              style={styles.browseButton}
              labelStyle={styles.browseButtonLabel}
              icon="food-fork-drink"
            >
              Ver Menú
            </Button>
          </Animated.View>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />

          <Surface style={styles.cartSummary} elevation={10}>
            <LinearGradient
              colors={["#ffffff", "#f8f9fa"]}
              style={styles.cartSummaryGradient}
            >
              <View style={styles.promoContainer}>
                {promoApplied ? (
                  <View style={styles.appliedPromoContainer}>
                    <Surface style={styles.appliedPromoCard} elevation={2}>
                      <View style={styles.appliedPromoInfo}>
                        <Icon
                          name="ticket-percent"
                          size={24}
                          color="#4CAF50"
                          style={styles.promoIcon}
                        />
                        <View style={styles.appliedPromoTextContainer}>
                          <Text style={styles.appliedPromoCode}>
                            {promoCodeData?.codigo}
                          </Text>
                          <Text style={styles.appliedPromoValue}>
                            {promoCodeData?.tipo === "porcentaje"
                              ? `${promoCodeData?.descuento}% de descuento`
                              : `${promoCodeData?.descuento}$ de descuento`}
                          </Text>
                        </View>
                      </View>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={removePromoCode}
                        style={styles.removePromoButton}
                      />
                    </Surface>
                  </View>
                ) : (
                  <View style={styles.promoInputContainer}>
                    <TextInput
                      label="Código promocional"
                      value={promoCode}
                      onChangeText={(text) => {
                        setPromoCode(text);
                        setPromoCodeError("");
                      }}
                      style={styles.promoInput}
                      mode="outlined"
                      outlineColor="#ddd"
                      activeOutlineColor="#FF6B6B"
                      autoCapitalize="characters"
                      error={!!promoCodeError}
                      right={
                        <TextInput.Icon
                          icon="tag-outline"
                          onPress={applyPromoCode}
                          disabled={!promoCode.trim()}
                          color="#FF6B6B"
                        />
                      }
                    />
                    {promoCodeError ? (
                      <Text style={styles.promoErrorText}>
                        {promoCodeError}
                      </Text>
                    ) : null}

                    {/* Agregar botón de validación */}
                    <Button
                      mode="outlined"
                      onPress={applyPromoCode}
                      disabled={!promoCode.trim()}
                      style={styles.validatePromoButton}
                      labelStyle={styles.validatePromoButtonLabel}
                      icon="ticket-percent"
                    >
                      Validar código
                    </Button>
                  </View>
                )}
              </View>

              <Divider style={styles.divider} />

              <View style={styles.summaryContent}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal:</Text>
                  <Text style={styles.summaryValue}>
                    {getTotal().toFixed(2)} $
                  </Text>
                </View>

                {promoApplied && promoCodeData && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Descuento (
                      {promoCodeData.tipo === "porcentaje"
                        ? `${promoCodeData.descuento}%`
                        : `${promoCodeData.descuento}$`}
                      ):
                    </Text>
                    <Text style={styles.discountValue}>
                      -
                      {promoCodeData.tipo === "porcentaje"
                        ? (
                            (getTotal() * promoCodeData.descuento) /
                            100
                          ).toFixed(2)
                        : Math.min(getTotal(), promoCodeData.descuento).toFixed(
                            2
                          )}{" "}
                      $
                    </Text>
                  </View>
                )}

                {reservationDetails && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Cargo de reserva:</Text>
                    <Text style={styles.summaryValue}>5.00 $</Text>
                  </View>
                )}

                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>TOTAL:</Text>
                  <Text style={styles.totalValue}>
                    {getFinalTotal().toFixed(2)} $
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <Button
                  mode="outlined"
                  onPress={handleClearCart}
                  style={styles.clearButton}
                  labelStyle={styles.clearButtonLabel}
                  icon="trash-can-outline"
                >
                  Vaciar
                </Button>

                <Button
                  mode="contained"
                  onPress={() => setShowCheckoutModal(true)}
                  style={styles.checkoutButton}
                  labelStyle={styles.checkoutButtonLabel}
                  icon="check-circle-outline"
                >
                  Finalizar Pedido
                </Button>
              </View>
            </LinearGradient>
          </Surface>
        </>
      )}

      <Portal>
        <Modal
          visible={showCheckoutModal}
          onDismiss={() => setShowCheckoutModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <LinearGradient
            colors={["#FF6B6B", "#FF8A65"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>Finalizar Pedido</Text>
            <IconButton
              icon="close"
              size={24}
              iconColor="white"
              onPress={() => setShowCheckoutModal(false)}
            />
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSectionHeader}>
              <Icon name="food" size={22} color="#FF6B6B" />
              <Text style={styles.modalSectionTitle}>Resumen de tu pedido</Text>
            </View>

            {reservationDetails && (
              <View style={styles.modalReservationInfo}>
                <Icon
                  name="calendar-check"
                  size={24}
                  color="#FF6B6B"
                  style={{ marginRight: 10 }}
                />
                <View>
                  <Text style={styles.modalReservationTitle}>
                    Reserva para{" "}
                    {reservationDetails.comensales ||
                      reservationDetails.personas}
                    {(reservationDetails.comensales ||
                      reservationDetails.personas) === 1
                      ? " persona"
                      : " personas"}
                  </Text>
                  <Text style={styles.modalReservationDetails}>
                    {formatDate(reservationDetails.fecha)} - Mesa en{" "}
                    {reservationDetails.ubicacion === "terraza"
                      ? "terraza"
                      : "interior"}
                  </Text>
                </View>
              </View>
            )}

            {/* Promoción aplicada en el modal */}
            {promoApplied && promoCodeData && (
              <View style={styles.modalPromoBanner}>
                <Icon
                  name="ticket-percent"
                  size={24}
                  color="#4CAF50"
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalPromoTitle}>
                    Promoción aplicada: {promoCodeData.codigo}
                  </Text>
                  <Text style={styles.modalPromoDetails}>
                    {promoCodeData.tipo === "porcentaje"
                      ? `${promoCodeData.descuento}% de descuento en tu pedido`
                      : `${promoCodeData.descuento}$ de descuento en tu pedido`}
                  </Text>
                </View>
              </View>
            )}

            <Surface style={styles.modalItemsContainer} elevation={1}>
              {cartItems.map((item, index) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.delay(index * 50)}
                  style={[
                    styles.modalItem,
                    index === cartItems.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={styles.modalItemQty}>{item.cantidad}x</Text>
                  <Text style={styles.modalItemName}>{item.nombre}</Text>
                  <Text style={styles.modalItemPrice}>
                    {(item.precio * item.cantidad).toFixed(2)} $
                  </Text>
                </Animated.View>
              ))}
            </Surface>

            <Surface style={styles.modalSummary} elevation={1}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Subtotal:</Text>
                <Text style={styles.modalSummaryValue}>
                  {getTotal().toFixed(2)} $
                </Text>
              </View>

              {promoApplied && promoCodeData && (
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>
                    Descuento (
                    {promoCodeData.tipo === "porcentaje"
                      ? `${promoCodeData.descuento}%`
                      : `${promoCodeData.descuento}$`}
                    ):
                  </Text>
                  <Text style={styles.modalDiscountValue}>
                    -
                    {promoCodeData.tipo === "porcentaje"
                      ? ((getTotal() * promoCodeData.descuento) / 100).toFixed(
                          2
                        )
                      : Math.min(getTotal(), promoCodeData.descuento).toFixed(
                          2
                        )}{" "}
                    $
                  </Text>
                </View>
              )}

              {reservationDetails && (
                <View style={styles.modalSummaryRow}>
                  <Text style={styles.modalSummaryLabel}>
                    Cargo de reserva:
                  </Text>
                  <Text style={styles.modalSummaryValue}>5.00 $</Text>
                </View>
              )}

              <View style={[styles.modalSummaryRow, styles.modalTotalRow]}>
                <Text style={styles.modalTotalLabel}>TOTAL A PAGAR:</Text>
                <Text style={styles.modalTotalValue}>
                  {getFinalTotal().toFixed(2)} $
                </Text>
              </View>
            </Surface>

            <View style={styles.modalSectionHeader}>
              <Icon name="credit-card-outline" size={22} color="#FF6B6B" />
              <Text style={styles.modalSectionTitle}>Método de pago</Text>
            </View>

            <View style={styles.paymentMethods}>
              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  paymentMethod === "efectivo" && styles.selectedPaymentMethod,
                ]}
                onPress={() => setPaymentMethod("efectivo")}
              >
                <Icon
                  name="cash"
                  size={28}
                  color={paymentMethod === "efectivo" ? "#FF6B6B" : "#666"}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === "efectivo" &&
                      styles.selectedPaymentMethodText,
                  ]}
                >
                  Efectivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  paymentMethod === "tarjeta" && styles.selectedPaymentMethod,
                ]}
                onPress={() => setPaymentMethod("tarjeta")}
              >
                <Icon
                  name="credit-card"
                  size={28}
                  color={paymentMethod === "tarjeta" ? "#FF6B6B" : "#666"}
                />
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === "tarjeta" &&
                      styles.selectedPaymentMethodText,
                  ]}
                >
                  Tarjeta
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSectionHeader}>
              <Icon name="text-box-outline" size={22} color="#FF6B6B" />
              <Text style={styles.modalSectionTitle}>Notas adicionales</Text>
            </View>

            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              placeholder="Instrucciones especiales, alergias, etc."
              value={notes}
              onChangeText={setNotes}
              style={styles.notesInput}
              outlineColor="#ddd"
              activeOutlineColor="#FF6B6B"
            />

            <View style={styles.modalFootnote}>
              <Icon
                name="information-outline"
                size={16}
                color="#666"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.modalFootnoteText}>
                Al finalizar el pedido, podrás revisar el estado desde la
                sección de Pedidos.
              </Text>
            </View>
          </ScrollView>

          <Surface style={styles.modalActions} elevation={8}>
            <Button
              mode="outlined"
              onPress={() => setShowCheckoutModal(false)}
              style={styles.modalCancelButton}
              labelStyle={styles.modalCancelButtonLabel}
              disabled={isSubmitting}
              icon="close"
            >
              Cancelar
            </Button>

            <Button
              mode="contained"
              onPress={handleSubmitOrder}
              style={styles.modalConfirmButton}
              labelStyle={styles.modalConfirmButtonLabel}
              loading={isSubmitting}
              disabled={isSubmitting}
              icon={isSubmitting ? null : "check"}
            >
              Confirmar
            </Button>
          </Surface>
        </Modal>
      </Portal>

      <FAB
        icon="food-fork-drink"
        label="Ver menú"
        onPress={() => navigation.navigate("Menú")}
        style={styles.fab}
        color="white"
        visible={!isCartEmpty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  reservationBanner: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFCC80",
    borderWidth: 1,
    marginBottom: 0,
    elevation: 2,
  },
  header: {
    overflow: "hidden",
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
    width: "100%",
    height: "100%",
  },
  headerGradient: {
    width: "100%",
    height: "100%",
    padding: 20,
    paddingTop: 50,
    justifyContent: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  headerStats: {
    flexDirection: "row",
    justifyContent: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  statText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 5,
    fontSize: 14,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyCartAnimation: {
    marginBottom: 20,
  },
  emptyCartImage: {
    width: 150,
    height: 150,
    opacity: 0.8,
  },
  emptyCartText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    maxWidth: 280,
  },
  browseButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 30,
    paddingVertical: 8,
    borderRadius: 30,
    elevation: 3,
  },
  browseButtonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cartList: {
    padding: 15,
    paddingBottom: 220, // Espacio para el resumen de carrito
  },
  cartItem: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cartItemGradient: {
    padding: 15,
    borderRadius: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    marginRight: 15,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  itemPrice: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  itemTags: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  itemTag: {
    marginRight: 5,
    height: 24,
    backgroundColor: "transparent",
  },
  promoTag: {
    marginRight: 5,
    height: 24,
    backgroundColor: "#4CAF50",
  },
  itemControls: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: "100%",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingVertical: 5,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  quantityButton: {
    marginHorizontal: 0,
    width: 30,
    height: 30,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    width: 25,
    textAlign: "center",
  },
  itemSubtotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF6B6B",
    marginVertical: 8,
  },
  deleteButton: {
    margin: 0,
    alignSelf: "flex-end",
  },
  cartSummary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
  },
  cartSummaryGradient: {
    padding: 20,
  },
  promoContainer: {
    marginBottom: 15,
  },
  promoInputContainer: {
    marginBottom: 5,
  },
  promoInput: {
    backgroundColor: "white",
    height: 50,
  },
  promoErrorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 2,
    marginLeft: 8,
  },
  appliedPromoContainer: {
    marginBottom: 10,
  },
  appliedPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  appliedPromoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  promoIcon: {
    marginRight: 10,
  },
  appliedPromoTextContainer: {
    flex: 1,
  },
  appliedPromoCode: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  appliedPromoValue: {
    fontSize: 14,
    color: "#4CAF50",
  },
  removePromoButton: {
    margin: 0,
  },
  discountBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
    elevation: 2,
  },
  discountText: {
    color: "white",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    marginVertical: 15,
  },
  summaryContent: {
    backgroundColor: "#f5f5f5",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  discountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    flex: 1,
    marginRight: 10,
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  clearButtonLabel: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  checkoutButton: {
    flex: 2,
    backgroundColor: "#FF6B6B",
    elevation: 3,
  },
  checkoutButtonLabel: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 220,
    backgroundColor: "#4CAF50",
    elevation: 5,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    width: "92%",
    alignSelf: "center",
    maxHeight: "85%",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  modalTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContent: {
    padding: 20,
    maxHeight: "70%",
  },
  modalSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 5,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  modalReservationInfo: {
    flexDirection: "row",
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
    elevation: 2,
  },
  modalReservationTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  modalReservationDetails: {
    color: "#666",
    fontSize: 14,
    marginTop: 3,
  },
  modalPromoBanner: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
    elevation: 2,
  },
  modalPromoTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
  },
  modalPromoDetails: {
    color: "#4CAF50",
    fontSize: 14,
    marginTop: 3,
  },
  modalItemsContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalItemQty: {
    fontSize: 16,
    fontWeight: "bold",
    width: 35,
    color: "#FF6B6B",
  },
  modalItemName: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalSummary: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  modalSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalSummaryLabel: {
    fontSize: 16,
    color: "#666",
  },
  modalSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  modalDiscountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  modalTotalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginBottom: 0,
  },
  modalTotalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalTotalValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  paymentMethods: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  paymentMethod: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f7f7",
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    elevation: 1,
  },
  selectedPaymentMethod: {
    backgroundColor: "#FFF1F1",
    borderColor: "#FF6B6B",
    elevation: 2,
  },
  paymentMethodText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  selectedPaymentMethodText: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  notesInput: {
    backgroundColor: "white",
    marginBottom: 20,
    borderRadius: 12,
  },
  modalFootnote: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  modalFootnoteText: {
    color: "#666",
    fontSize: 13,
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  modalCancelButtonLabel: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  modalConfirmButton: {
    flex: 2,
    backgroundColor: "#4CAF50",
    elevation: 3,
  },
  modalConfirmButtonLabel: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  validatePromoButton: {
    marginTop: 10,
    borderColor: "#4CAF50",
    borderWidth: 1.5,
  },
  validatePromoButtonLabel: {
    color: "#4CAF50",
    fontSize: 14,
  },
});

export default CartScreen;
