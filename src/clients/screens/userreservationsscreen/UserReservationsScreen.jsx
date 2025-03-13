import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import {
  Text,
  Button,
  TextInput,
  Chip,
  Modal,
  Portal,
  Divider,
  ActivityIndicator,
  SegmentedButtons,
} from "react-native-paper";
import { DatabaseContext } from "../../../contexts/DatabaseContext";
import { AuthContext } from "../../../contexts/AuthContext";
import { Calendar } from "react-native-calendars";
import Animated, { FadeIn } from "react-native-reanimated";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../services/firebase";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const UserReservationsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const databaseContext = useContext(DatabaseContext) || {};

  // Estados locales
  const [activeTab, setActiveTab] = useState("upcoming");
  const [userReservations, setUserReservations] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [pastReservations, setPastReservations] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [guests, setGuests] = useState("2");
  const [notes, setNotes] = useState("");
  const [ubicacion, setUbicacion] = useState("interior"); // 'interior' o 'terraza'

  const [selectedDate, setSelectedDate] = useState("");
  const [markedDates, setMarkedDates] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Función optimizada para procesar reservas
  const processReservations = useCallback((reservas) => {
    try {
      if (!Array.isArray(reservas)) {
        console.error("Las reservas no son un array:", reservas);
        setUserReservations([]);
        setUpcomingReservations([]);
        setPastReservations([]);
        return;
      }

      const now = new Date();

      // Limpiar y normalizar fechas para evitar problemas
      const processedReservations = reservas.map((r) => {
        try {
          const fechaObj = r.fecha ? new Date(r.fecha) : null;
          return {
            ...r,
            fechaObj: fechaObj,
            formattedDate: fechaObj ? fechaObj.toISOString() : "",
            isValidDate: fechaObj instanceof Date && !isNaN(fechaObj),
          };
        } catch (e) {
          console.error("Error procesando fecha en reserva:", e, r);
          return {
            ...r,
            fechaObj: null,
            formattedDate: "",
            isValidDate: false,
          };
        }
      });

      // Filtrar y ordenar las reservas próximas
      const upcoming = processedReservations
        .filter(
          (r) => r.isValidDate && r.fechaObj >= now && r.estado !== "cancelada"
        )
        .sort((a, b) => a.fechaObj - b.fechaObj);

      // Filtrar y ordenar las reservas pasadas
      const past = processedReservations
        .filter(
          (r) => !r.isValidDate || r.fechaObj < now || r.estado === "cancelada"
        )
        .sort((a, b) =>
          b.isValidDate && a.isValidDate ? b.fechaObj - a.fechaObj : 0
        );

      setUserReservations(processedReservations);
      setUpcomingReservations(upcoming);
      setPastReservations(past);
    } catch (error) {
      console.error("Error processing reservations:", error);
      setError("Error al procesar las reservas");
      setUserReservations([]);
      setUpcomingReservations([]);
      setPastReservations([]);
    }
  }, []);

  // Función para cargar reservas del usuario
  const loadUserReservations = useCallback(async () => {
    if (!user || !user.id) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const reservasRef = collection(db, "reservas");
      const q = query(reservasRef, where("userId", "==", user.id));
      const querySnapshot = await getDocs(q);

      const reservas = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      processReservations(reservas);
    } catch (error) {
      console.error("Error cargando reservas:", error);
      setError("No se pudieron cargar tus reservas");
      Alert.alert(
        "Error",
        "No se pudieron cargar tus reservas. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, processReservations]);

  // Cargar reservas cada vez que el componente obtiene foco
  useFocusEffect(
    useCallback(() => {
      loadUserReservations();

      // Suscribirse a cambios en tiempo real para las reservas del usuario
      let unsubscribe = () => {};

      if (user && user.id) {
        const reservasRef = collection(db, "reservas");
        const q = query(reservasRef, where("userId", "==", user.id));

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const reservas = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            processReservations(reservas);
            setLoading(false);
          },
          (error) => {
            console.error("Error escuchando cambios en reservas:", error);
            setError("Error al obtener actualizaciones en tiempo real");
            setLoading(false);
          }
        );
      }

      return () => unsubscribe();
    }, [user, processReservations])
  );

  // Manejo de cambios en fecha y hora
  const onDateChange = useCallback((event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, []);

  const onTimeChange = useCallback((event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  }, []);

  // Función para enviar reserva optimizada
  const handleSubmitReservation = async () => {
    if (!guests || parseInt(guests) < 1) {
      Alert.alert("Error", "Por favor indica el número de comensales");
      return;
    }

    if (!selectedDate) {
      Alert.alert("Error", "Por favor selecciona una fecha");
      return;
    }

    try {
      // Validar datos antes de construir el objeto
      const numGuests = parseInt(guests);
      if (isNaN(numGuests) || numGuests < 1) {
        Alert.alert("Error", "Número de comensales inválido");
        return;
      }

      // Construir la fecha y hora completa
      const reservationDateTime = new Date(date);
      reservationDateTime.setHours(time.getHours());
      reservationDateTime.setMinutes(time.getMinutes());

      if (reservationDateTime < new Date()) {
        Alert.alert("Error", "No puedes hacer reservas en el pasado");
        return;
      }

      // Crear el objeto de reserva
      const newReservation = {
        userId: user.id,
        nombre: user.name || user.displayName || "",
        email: user.email || "",
        telefono: user.phone || "",
        fecha: reservationDateTime.toISOString(),
        personas: numGuests,
        ubicacionMesa: ubicacion,
        estado: "pendiente",
        notas: notes,
        fechaCreacion: serverTimestamp(),
        // Campos adicionales para conectar con pedidos
        tieneMenu: false,
        pedidoId: null,
        reservaPrecio: 5.0, // Precio base de reserva
      };

      // Guardar en Firebase
      const docRef = await addDoc(collection(db, "reservas"), newReservation);

      if (docRef.id) {
        Alert.alert(
          "Éxito",
          "Tu reserva ha sido registrada correctamente. ¿Deseas añadir tu menú ahora?",
          [
            {
              text: "Más tarde",
              style: "cancel",
              onPress: () => {
                setModalVisible(false);
                resetForm();
              },
            },
            {
              text: "Añadir menú",
              onPress: () => {
                setModalVisible(false);
                resetForm();
                // Navegar al menú pasando el ID de la reserva
                navigation.navigate("Menú", { reservationId: docRef.id });
              },
            },
          ]
        );
      } else {
        throw new Error("No se pudo crear la reserva");
      }
    } catch (error) {
      console.error("Error al crear reserva:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error al procesar tu reserva. Intenta de nuevo."
      );
    }
  };

  // Función para cancelar reserva
  const handleCancelReservation = useCallback(
    (reservationId) => {
      if (!reservationId) {
        Alert.alert("Error", "ID de reserva no válido");
        return;
      }

      Alert.alert(
        "Cancelar Reserva",
        "¿Estás seguro de que quieres cancelar esta reserva?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                // Actualizar directamente en Firebase
                const reservaRef = doc(db, "reservas", reservationId);
                await updateDoc(reservaRef, {
                  estado: "cancelada",
                  fechaCancelacion: serverTimestamp(),
                });

                // Si la reserva tiene un pedido asociado, cancelar el pedido también
                const reservation = userReservations.find(
                  (r) => r.id === reservationId
                );
                if (reservation && reservation.pedidoId) {
                  const pedidoRef = doc(db, "pedidos", reservation.pedidoId);
                  await updateDoc(pedidoRef, {
                    estado: "cancelado",
                    fechaCancelacion: serverTimestamp(),
                  });
                }

                setLoading(false);
                Alert.alert(
                  "Cancelación realizada",
                  "Tu reserva ha sido cancelada"
                );
              } catch (error) {
                setLoading(false);
                console.error("Error al cancelar reserva:", error);
                Alert.alert("Error", "No se pudo cancelar la reserva");
              }
            },
          },
        ]
      );
    },
    [userReservations]
  );

  // Navegar al menú con el ID de reserva
  const navigateToMenu = useCallback(
    (reservationId) => {
      navigation.navigate("Menú", { reservationId: reservationId });
    },
    [navigation]
  );

  // Resetear formulario de reserva
  const resetForm = useCallback(() => {
    setDate(new Date());
    setTime(new Date());
    setGuests("2");
    setNotes("");
    setSelectedDate("");
    setMarkedDates({});
    setUbicacion("interior");
  }, []);

  // Funciones de formato para fechas y horas
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Fecha no disponible";

      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Fecha no disponible";
    }
  }, []);

  const formatTime = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Hora no disponible";

      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      console.error("Error formatting time:", e);
      return "Hora no disponible";
    }
  }, []);

  // Manejar selección de día en el calendario
  const handleDayPress = useCallback((day) => {
    try {
      const selectedDay = day.dateString;

      const updatedMarkedDates = {
        [selectedDay]: { selected: true, selectedColor: "#FF6B6B" },
      };

      setMarkedDates(updatedMarkedDates);
      setSelectedDate(selectedDay);

      // Convertir la fecha seleccionada a objeto Date
      const parts = selectedDay.split("-");
      const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
      setDate(selectedDate);
    } catch (error) {
      console.error("Error selecting day:", error);
      Alert.alert("Error", "No se pudo seleccionar la fecha");
    }
  }, []);

  // Funciones para obtener colores y íconos basados en estado
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "confirmada":
        return "#4CAF50";
      case "pendiente":
        return "#FF9800";
      case "cancelada":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case "confirmada":
        return "check-circle-outline";
      case "pendiente":
        return "clock-outline";
      case "cancelada":
        return "close-circle-outline";
      default:
        return "information-outline";
    }
  }, []);

  // Manejar refresco de la lista
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUserReservations();
  }, [loadUserReservations]);

  // Renderizar ítem de reserva
  const renderReservationItem = useCallback(
    ({ item, index }) => {
      // Verificar que tenemos una fecha válida
      let fechaReserva;
      try {
        fechaReserva = new Date(item.fecha);
        if (isNaN(fechaReserva.getTime())) {
          fechaReserva = new Date(); // Valor predeterminado
        }
      } catch (e) {
        console.error("Error parsing date:", e, item.fecha);
        fechaReserva = new Date();
      }

      const isCancelable =
        item.estado !== "cancelada" &&
        fechaReserva > new Date() &&
        activeTab === "upcoming";

      return (
        <Animated.View
          entering={FadeIn.delay(index * 100).duration(300)}
          style={styles.reservationCard}
        >
          <LinearGradient
            colors={[
              "#FFFFFF",
              item.estado === "confirmada"
                ? "rgba(76, 175, 80, 0.1)"
                : item.estado === "pendiente"
                ? "rgba(255, 152, 0, 0.1)"
                : "rgba(244, 67, 54, 0.1)",
            ]}
            style={styles.reservationGradient}
          >
            <View style={styles.reservationHeader}>
              <View style={styles.reservationStatus}>
                <Icon
                  name={getStatusIcon(item.estado)}
                  size={24}
                  color={getStatusColor(item.estado)}
                  style={styles.statusIcon}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.estado) },
                  ]}
                >
                  {item.estado === "confirmada"
                    ? "Confirmada"
                    : item.estado === "pendiente"
                    ? "Pendiente"
                    : item.estado === "cancelada"
                    ? "Cancelada"
                    : item.estado || "Desconocido"}
                </Text>
              </View>
              <Chip style={styles.guestsChip} icon="account-group">
                {item.personas} {item.personas === 1 ? "persona" : "personas"}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.reservationDateTime}>
              <View style={styles.dateContainer}>
                <Icon
                  name="calendar"
                  size={20}
                  color="#666"
                  style={styles.icon}
                />
                <Text style={styles.dateText}>{formatDate(item.fecha)}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Icon
                  name="clock-outline"
                  size={20}
                  color="#666"
                  style={styles.icon}
                />
                <Text style={styles.timeText}>{formatTime(item.fecha)}</Text>
              </View>
            </View>

            <View style={styles.locationContainer}>
              <Icon
                name={
                  item.ubicacionMesa === "terraza" ? "umbrella-beach" : "home"
                }
                size={20}
                color="#666"
                style={styles.icon}
              />
              <Text style={styles.locationText}>
                {item.ubicacionMesa === "terraza" ? "Terraza" : "Interior"}
              </Text>
            </View>

            {/* Mostrar si tiene menú asociado */}
            <View style={styles.menuStatus}>
              <Icon
                name={
                  item.tieneMenu
                    ? "silverware-fork-knife"
                    : "silverware-variant"
                }
                size={20}
                color={item.tieneMenu ? "#4CAF50" : "#FF9800"}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.menuStatusText,
                  { color: item.tieneMenu ? "#4CAF50" : "#FF9800" },
                ]}
              >
                {item.tieneMenu ? "Menú seleccionado" : "Sin menú"}
              </Text>
            </View>

            {item.notas ? (
              <>
                <Divider style={styles.divider} />
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notas:</Text>
                  <Text style={styles.notesText}>{item.notas}</Text>
                </View>
              </>
            ) : null}

            {/* Botones de acción */}
            <View style={styles.actionButtons}>
              {isCancelable && (
                <TouchableOpacity
                  onPress={() => handleCancelReservation(item.id)}
                  style={styles.cancelButton}
                >
                  <Icon
                    name="close"
                    size={16}
                    color="#F44336"
                    style={styles.cancelIcon}
                  />
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              )}

              {/* Botón para añadir menú si no tiene uno ya */}
              {isCancelable && !item.tieneMenu && (
                <TouchableOpacity
                  onPress={() => navigateToMenu(item.id)}
                  style={styles.addMenuButton}
                >
                  <Icon
                    name="food-fork-drink"
                    size={16}
                    color="#4CAF50"
                    style={styles.menuIcon}
                  />
                  <Text style={styles.addMenuText}>Añadir Menú</Text>
                </TouchableOpacity>
              )}

              {/* Botón para ver detalles si ya tiene menú */}
              {item.tieneMenu && item.pedidoId && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("OrderDetails", {
                      orderId: item.pedidoId,
                    })
                  }
                  style={styles.viewOrderButton}
                >
                  <Icon
                    name="eye-outline"
                    size={16}
                    color="#2196F3"
                    style={styles.viewIcon}
                  />
                  <Text style={styles.viewOrderText}>Ver Orden</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      );
    },
    [
      activeTab,
      formatDate,
      formatTime,
      getStatusIcon,
      getStatusColor,
      handleCancelReservation,
      navigateToMenu,
      navigation,
    ]
  );

  // Extraer datos de la pestaña actual
  const currentTabData = useMemo(() => {
    return activeTab === "upcoming" ? upcomingReservations : pastReservations;
  }, [activeTab, upcomingReservations, pastReservations]);

  // Renderizar pantalla de carga
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando reservas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#FF6B6B", "#FF8E8E"]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mis Reservas</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.newReservationButton}
        >
          <Icon
            name="plus"
            size={20}
            color="#FF6B6B"
            style={styles.newReservationIcon}
          />
          <Text style={styles.newReservationText}>Nueva Reserva</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.content}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: "upcoming",
              label: "Próximas",
              icon: "calendar-clock",
            },
            {
              value: "past",
              label: "Pasadas",
              icon: "calendar-check",
            },
          ]}
          style={styles.segmentedButtons}
        />

        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle-outline" size={40} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              mode="contained"
              onPress={handleRefresh}
              style={styles.retryButton}
            >
              Intentar de nuevo
            </Button>
          </View>
        ) : currentTabData.length === 0 ? (
          <View style={styles.emptyState}>
            <Image
              source={require("../../../assets/icons/empty_calendar.png")}
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              {activeTab === "upcoming"
                ? "No tienes reservas próximas"
                : "No tienes reservas pasadas"}
            </Text>
            {activeTab === "upcoming" && (
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={styles.makeReservationButton}
              >
                <LinearGradient
                  colors={["#FF6B6B", "#FF8E8E"]}
                  style={styles.gradientButton}
                >
                  <Icon
                    name="calendar-plus"
                    size={18}
                    color="white"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.makeReservationText}>
                    Hacer una Reserva
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={currentTabData}
            renderItem={renderReservationItem}
            keyExtractor={(item) =>
              item.id ? item.id.toString() : Math.random().toString()
            }
            contentContainerStyle={styles.reservationsList}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            windowSize={7}
            removeClippedSubviews={true}
          />
        )}
      </View>

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Reserva</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            <Text style={styles.sectionTitle}>Selecciona una fecha</Text>
            <Calendar
              onDayPress={handleDayPress}
              markedDates={markedDates}
              minDate={new Date().toISOString().split("T")[0]}
              theme={{
                selectedDayBackgroundColor: "#FF6B6B",
                todayTextColor: "#FF6B6B",
                arrowColor: "#FF6B6B",
                dotColor: "#FF6B6B",
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14,
                "stylesheet.calendar.header": {
                  dayHeader: {
                    fontWeight: "600",
                    color: "#555",
                  },
                },
              }}
              style={styles.calendar}
            />

            {selectedDate ? (
              <View style={styles.timeSelection}>
                <Text style={styles.sectionTitle}>Selecciona la hora</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeInputText}>
                    {time.toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                  <Icon name="clock-outline" size={20} color="#666" />
                </TouchableOpacity>

                {showTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    is24Hour={true}
                    display="default"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        onTimeChange(selectedTime);
                      }
                    }}
                  />
                )}
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Ubicación preferida</Text>
            <View style={styles.ubicacionSelection}>
              <TouchableOpacity
                style={[
                  styles.ubicacionOption,
                  ubicacion === "interior" && styles.ubicacionOptionSelected,
                ]}
                onPress={() => setUbicacion("interior")}
              >
                <Image
                  source={require("../../../assets/icons/indoor.png")}
                  style={styles.ubicacionIcon}
                />
                <Text
                  style={[
                    styles.ubicacionText,
                    ubicacion === "interior" && styles.ubicacionTextSelected,
                  ]}
                >
                  Interior
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.ubicacionOption,
                  ubicacion === "terraza" && styles.ubicacionOptionSelected,
                ]}
                onPress={() => setUbicacion("terraza")}
              >
                <Image
                  source={require("../../../assets/icons/outdoor.png")}
                  style={styles.ubicacionIcon}
                />
                <Text
                  style={[
                    styles.ubicacionText,
                    ubicacion === "terraza" && styles.ubicacionTextSelected,
                  ]}
                >
                  Terraza
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Detalles de la reserva</Text>
            <TextInput
              label="Número de personas"
              value={guests}
              onChangeText={setGuests}
              keyboardType="number-pad"
              style={styles.input}
              mode="outlined"
              activeOutlineColor="#FF6B6B"
              left={<TextInput.Icon icon="account-group" color="#666" />}
            />

            <TextInput
              label="Notas especiales (opcional)"
              value={notes}
              onChangeText={setNotes}
              style={styles.input}
              mode="outlined"
              activeOutlineColor="#FF6B6B"
              multiline
              numberOfLines={3}
              placeholder="Ej: Preferencia de mesa, alergias, ocasión especial..."
              left={<TextInput.Icon icon="note-text-outline" color="#666" />}
            />

            <View style={styles.reservationInfo}>
              <Text style={styles.reservationInfoText}>
                La reserva de mesa tiene un cargo base de 5$, que será incluido
                en tu cuenta final.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setModalVisible(false)}
                style={styles.modalCancelButton}
                textColor="#666"
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmitReservation}
                style={styles.modalSubmitButton}
                disabled={!selectedDate}
              >
                Confirmar
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  header: {
    padding: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  newReservationButton: {
    marginTop: 15,
    backgroundColor: "white",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    elevation: 3,
  },
  newReservationIcon: {
    marginRight: 8,
  },
  newReservationText: {
    color: "#FF6B6B",
    fontWeight: "bold",
    fontSize: 15,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  segmentedButtons: {
    marginBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#666",
    textAlign: "center",
  },
  makeReservationButton: {
    borderRadius: 25,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  gradientButton: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  makeReservationText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 17,
  },
  reservationsList: {
    paddingBottom: 20,
  },
  reservationCard: {
    borderRadius: 16,
    marginBottom: 15,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  reservationGradient: {
    padding: 18,
  },
  reservationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reservationStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  guestsChip: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  divider: {
    marginVertical: 12,
    height: 0.8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  reservationDateTime: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  locationText: {
    fontSize: 15,
    color: "#444",
  },
  menuStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  menuStatusText: {
    fontSize: 15,
  },
  icon: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 15,
    color: "#444",
  },
  timeText: {
    fontSize: 15,
    color: "#444",
  },
  notesContainer: {
    marginTop: 5,
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 12,
    borderRadius: 8,
  },
  notesLabel: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "#555",
  },
  notesText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  actionButtons: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#F44336",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  cancelIcon: {
    marginRight: 8,
  },
  cancelText: {
    color: "#F44336",
    fontWeight: "bold",
  },
  addMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  menuIcon: {
    marginRight: 8,
  },
  addMenuText: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  viewOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
    borderRadius: 20,
    marginHorizontal: 5,
  },
  viewIcon: {
    marginRight: 8,
  },
  viewOrderText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 15,
    maxHeight: "90%",
    overflow: "hidden",
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FF6B6B",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScroll: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 12,
    color: "#444",
  },
  calendar: {
    borderRadius: 10,
    elevation: 2,
    marginBottom: 20,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timeSelection: {
    marginBottom: 20,
  },
  timeInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    backgroundColor: "#f9f9f9",
  },
  timeInputText: {
    fontSize: 16,
    color: "#333",
  },
  ubicacionSelection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  ubicacionOption: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  ubicacionOptionSelected: {
    borderColor: "#FF6B6B",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  ubicacionIcon: {
    width: 40,
    height: 40,
    marginBottom: 8,
  },
  ubicacionText: {
    fontSize: 16,
    color: "#666",
  },
  ubicacionTextSelected: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 15,
    backgroundColor: "white",
  },
  reservationInfo: {
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
  },
  reservationInfoText: {
    fontSize: 14,
    color: "#444",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  modalCancelButton: {
    flex: 1,
    marginRight: 10,
    borderColor: "#ddd",
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#FF6B6B",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#FF6B6B",
  },
});

export default UserReservationsScreen;
