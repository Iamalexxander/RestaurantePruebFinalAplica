import React, { useState, useContext, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Clipboard,
} from "react-native";
import {
  Title,
  Button,
  FAB,
  Dialog,
  Portal,
  TextInput,
  Text,
  Card,
  Switch,
  ActivityIndicator,
  Chip,
  Surface,
  Divider,
  Avatar,
  HelperText,
  Snackbar,
} from "react-native-paper";
import { DatabaseContext } from "../../../contexts/DatabaseContext";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  FadeIn,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { db } from "../../../services/firebase";

const { width } = Dimensions.get("window");

const PromocionesScreen = () => {
  const {
    promociones,
    addPromocion,
    togglePromocion,
    deletePromocion,
    loading,
  } = useContext(DatabaseContext);

  const [visible, setVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [descuento, setDescuento] = useState("");
  const [tipoPromo, setTipoPromo] = useState("porcentaje");
  const [codigo, setCodigo] = useState("");
  const [filtroActivas, setFiltroActivas] = useState("todas");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 60 : 160),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  const showDialog = () => {
    setVisible(true);
    setNombre("");
    setDescripcion("");
    setDescuento("");
    setTipoPromo("porcentaje");
    // Generar código automáticamente
    generatePromoCode();
  };

  const hideDialog = () => {
    setVisible(false);
  };

  const generatePromoCode = () => {
    // Generar un código promocional aleatorio (ejemplo: PROMO1234)
    const randomString = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    const newCode = `PROMO${randomString}`;
    setCodigo(newCode);
  };

  const getPromocionesFiltered = () => {
    if (filtroActivas === "todas") return promociones;
    return promociones.filter((promo) =>
      filtroActivas === "activas" ? promo.activa : !promo.activa
    );
  };

  const handleSavePromocion = async () => {
    // Validaciones
    if (!nombre || !descripcion || !descuento || !codigo) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    const descuentoNum = parseFloat(descuento);
    if (
      isNaN(descuentoNum) ||
      descuentoNum <= 0 ||
      (tipoPromo === "porcentaje" && descuentoNum > 100)
    ) {
      Alert.alert(
        "Error",
        tipoPromo === "porcentaje"
          ? "El descuento debe ser un número entre 1 y 100"
          : "El descuento debe ser un número mayor que 0"
      );
      return;
    }

    // Verificar si el código ya existe
    const codigoExistente = promociones.find(
      (promo) =>
        promo.codigo && promo.codigo.toLowerCase() === codigo.toLowerCase()
    );

    if (codigoExistente) {
      Alert.alert(
        "Error",
        "El código promocional ya existe. Por favor, genera uno nuevo."
      );
      return;
    }

    const nuevaPromocion = {
      nombre,
      descripcion,
      descuento: descuentoNum,
      tipo: tipoPromo,
      codigo: codigo.toUpperCase(),
      activa: true,
      usoMaximo: 100, // Valor por defecto
      usosActuales: 0,
      fechaCreacion: new Date().toISOString(),
    };

    try {
      await addPromocion(nuevaPromocion);
      Alert.alert("Éxito", "Promoción creada correctamente");
      hideDialog();
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la promoción: " + error.message);
    }
  };

  const handleTogglePromocion = async (id) => {
    Alert.alert(
      "Cambiar estado",
      "¿Estás seguro de que deseas cambiar el estado de esta promoción?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              await togglePromocion(id);
              setSnackbarMessage("Estado de promoción actualizado");
              setSnackbarVisible(true);
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo cambiar el estado de la promoción: " + error.message
              );
            }
          },
        },
      ]
    );
  };

  const handleDeletePromocion = async (id) => {
    Alert.alert(
      "Eliminar promoción",
      "¿Estás seguro de que deseas eliminar esta promoción? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePromocion(id);
              setSnackbarMessage("Promoción eliminada correctamente");
              setSnackbarVisible(true);
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo eliminar la promoción: " + error.message
              );
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = (code) => {
    Clipboard.setString(code);
    setSnackbarMessage(`Código ${code} copiado al portapapeles`);
    setSnackbarVisible(true);
  };

  const renderFilterChip = (label, value) => (
    <TouchableOpacity
      onPress={() => setFiltroActivas(value)}
      style={[
        styles.filterChip,
        filtroActivas === value && styles.filterChipSelected,
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          filtroActivas === value && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderPromocionItem = ({ item, index }) => {
    // Calcular el gradiente basado en el tipo de promoción
    const colors =
      item.tipo === "porcentaje"
        ? ["#7B1FA2", "#4A148C"] // Morado para porcentajes
        : ["#0288D1", "#01579B"]; // Azul para montos fijos

    // Iconos basados en estado
    const statusIcon = item.activa
      ? require("../../../assets/icons/confirmed.png")
      : require("../../../assets/icons/pending.png");

    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        style={styles.promoItemContainer}
      >
        <Surface style={styles.promoCard}>
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoHeader}
          >
            <View style={styles.promoHeaderLeft}>
              <Text style={styles.promoNombre}>{item.nombre}</Text>
              <Text style={styles.promoFecha}>
                Creada:{" "}
                {new Date(
                  item.fechaCreacion || Date.now()
                ).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.promoStatus}>
              <Image source={statusIcon} style={styles.statusIcon} />
              <Text style={styles.statusText}>
                {item.activa ? "ACTIVA" : "INACTIVA"}
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.promoBody}>
            <View style={styles.promoDescContainer}>
              <Text style={styles.promoDescripcion}>{item.descripcion}</Text>

              {item.codigo && (
                <TouchableOpacity
                  style={styles.codeContainer}
                  onPress={() => copyToClipboard(item.codigo)}
                >
                  <Text style={styles.codeLabel}>CÓDIGO:</Text>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{item.codigo}</Text>
                    <Avatar.Icon
                      size={20}
                      icon="content-copy"
                      style={styles.copyIcon}
                      color="#7B1FA2"
                    />
                  </View>
                </TouchableOpacity>
              )}

              {item.usosActuales !== undefined && (
                <Text style={styles.usageText}>
                  Usos: {item.usosActuales || 0} /{" "}
                  {item.usoMaximo || "ilimitado"}
                </Text>
              )}
            </View>

            <Divider style={styles.promoDivider} />

            <View style={styles.promoFooter}>
              <View style={styles.promoDescuentoContainer}>
                <Surface style={styles.promoDescuentoBadge}>
                  <Text style={styles.promoDescuentoTexto}>
                    {item.descuento}
                    {item.tipo === "porcentaje" ? "%" : "$"} OFF
                  </Text>
                </Surface>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    item.activa
                      ? styles.toggleButtonActive
                      : styles.toggleButtonInactive,
                  ]}
                  onPress={() => handleTogglePromocion(item.id)}
                >
                  <Text style={styles.toggleButtonText}>
                    {item.activa ? "DESACTIVAR" : "ACTIVAR"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePromocion(item.id)}
                >
                  <Text style={styles.deleteButtonText}>ELIMINAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Surface>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#7B1FA2" />
        <Text style={styles.loadingText}>Cargando promociones...</Text>
      </View>
    );
  }

  const promocionesFiltered = getPromocionesFiltered();

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground
          source={require("../../../assets/images/promotions_header.jpg")}
          style={styles.headerImage}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Promociones</Text>
            <Text style={styles.headerSubtitle}>
              Gestiona tus ofertas y descuentos
            </Text>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>

      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Mostrar:</Text>
          <View style={styles.filterChipsContainer}>
            {renderFilterChip("Todas", "todas")}
            {renderFilterChip("Activas", "activas")}
            {renderFilterChip("Inactivas", "inactivas")}
          </View>
        </View>
      </View>

      {promocionesFiltered.length > 0 ? (
        <FlatList
          data={promocionesFiltered}
          renderItem={renderPromocionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
        />
      ) : (
        <View style={styles.emptyState}>
          <Image
            source={require("../../../assets/icons/empty_promotions.png")}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>
            No hay promociones{" "}
            {filtroActivas !== "todas"
              ? filtroActivas === "activas"
                ? "activas"
                : "inactivas"
              : ""}
          </Text>
          <Button
            mode="contained"
            style={styles.emptyButton}
            icon="plus"
            onPress={showDialog}
          >
            Crear promoción
          </Button>
        </View>
      )}

      <FAB style={styles.fab} icon="plus" color="white" onPress={showDialog} />

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <LinearGradient
            colors={["#7B1FA2", "#4A148C"]}
            style={styles.dialogHeader}
          >
            <Dialog.Title style={styles.dialogTitle}>
              Nueva Promoción
            </Dialog.Title>
          </LinearGradient>

          <Dialog.Content>
            <Surface style={styles.tipoPromoContainer}>
              <TouchableOpacity
                style={[
                  styles.tipoPromoOption,
                  tipoPromo === "porcentaje" && styles.tipoPromoSelected,
                ]}
                onPress={() => setTipoPromo("porcentaje")}
              >
                <Avatar.Icon
                  size={40}
                  icon="percent"
                  color={tipoPromo === "porcentaje" ? "white" : "#7B1FA2"}
                  style={[
                    styles.tipoPromoIcon,
                    tipoPromo === "porcentaje" && styles.tipoPromoIconSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.tipoPromoText,
                    tipoPromo === "porcentaje" && styles.tipoPromoTextSelected,
                  ]}
                >
                  Porcentaje
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tipoPromoOption,
                  tipoPromo === "monto" && styles.tipoPromoSelected,
                ]}
                onPress={() => setTipoPromo("monto")}
              >
                <Avatar.Icon
                  size={40}
                  icon="currency-eur"
                  color={tipoPromo === "monto" ? "white" : "#7B1FA2"}
                  style={[
                    styles.tipoPromoIcon,
                    tipoPromo === "monto" && styles.tipoPromoIconSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.tipoPromoText,
                    tipoPromo === "monto" && styles.tipoPromoTextSelected,
                  ]}
                >
                  Monto Fijo
                </Text>
              </TouchableOpacity>
            </Surface>

            <TextInput
              label="Nombre de la promoción"
              value={nombre}
              onChangeText={setNombre}
              style={styles.input}
              mode="outlined"
              outlineColor="#7B1FA2"
              activeOutlineColor="#4A148C"
              left={<TextInput.Icon icon="tag" />}
            />

            <TextInput
              label="Descripción"
              value={descripcion}
              onChangeText={setDescripcion}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              outlineColor="#7B1FA2"
              activeOutlineColor="#4A148C"
              left={<TextInput.Icon icon="information" />}
            />

            <TextInput
              label={`Descuento (${tipoPromo === "porcentaje" ? "%" : "$"})`}
              value={descuento}
              onChangeText={setDescuento}
              style={styles.input}
              mode="outlined"
              keyboardType="decimal-pad"
              outlineColor="#7B1FA2"
              activeOutlineColor="#4A148C"
              left={
                <TextInput.Icon
                  icon={tipoPromo === "porcentaje" ? "percent" : "currency-eur"}
                />
              }
            />

            <View style={styles.codeInputContainer}>
              <TextInput
                label="Código promocional"
                value={codigo}
                onChangeText={setCodigo}
                style={styles.codeInput}
                mode="outlined"
                autoCapitalize="characters"
                outlineColor="#7B1FA2"
                activeOutlineColor="#4A148C"
                left={<TextInput.Icon icon="ticket-percent" />}
              />
              <Button
                mode="contained"
                onPress={generatePromoCode}
                style={styles.generateButton}
              >
                Generar
              </Button>
            </View>
            <HelperText type="info">
              El código será utilizado por los clientes al realizar sus pedidos
            </HelperText>
          </Dialog.Content>

          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={hideDialog}
              textColor="#666"
              style={styles.dialogCancelButton}
            >
              CANCELAR
            </Button>
            <Button
              onPress={handleSavePromocion}
              mode="contained"
              buttonColor="#7B1FA2"
              style={styles.dialogConfirmButton}
            >
              CREAR
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
  header: {
    overflow: "hidden",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    marginTop: 5,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  filtersContainer: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 10,
    color: "#666",
  },
  filterChipsContainer: {
    flexDirection: "row",
  },
  filterChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipSelected: {
    backgroundColor: "#7B1FA2",
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
  },
  filterChipTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  list: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  promoItemContainer: {
    marginBottom: 16,
  },
  promoCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  promoHeaderLeft: {
    flex: 1,
  },
  promoNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  promoFecha: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  promoStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
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
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  promoBody: {
    padding: 16,
    backgroundColor: "white",
  },
  promoDescContainer: {
    marginBottom: 12,
  },
  promoDescripcion: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    marginBottom: 10,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 5,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginRight: 10,
  },
  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  codeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7B1FA2",
    marginRight: 8,
    letterSpacing: 1,
  },
  copyIcon: {
    backgroundColor: "transparent",
  },
  usageText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  promoDivider: {
    marginVertical: 12,
    backgroundColor: "#e0e0e0",
    height: 1,
  },
  promoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoDescuentoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoDescuentoBadge: {
    backgroundColor: "#7B1FA2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
  },
  promoDescuentoTexto: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  toggleButtonActive: {
    backgroundColor: "#F44336",
  },
  toggleButtonInactive: {
    backgroundColor: "#4CAF50",
  },
  toggleButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
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
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: "#7B1FA2",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#7B1FA2",
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
    backgroundColor: "white",
  },
  dialogHeader: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dialogTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  tipoPromoContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  tipoPromoOption: {
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    width: "45%",
  },
  tipoPromoSelected: {
    backgroundColor: "#7B1FA2",
  },
  tipoPromoIcon: {
    backgroundColor: "#f0f0f0",
    marginBottom: 4,
  },
  tipoPromoIconSelected: {
    backgroundColor: "#6A1B9A",
  },
  tipoPromoText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tipoPromoTextSelected: {
    color: "white",
    fontWeight: "bold",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "white",
  },
  codeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  codeInput: {
    flex: 1,
    backgroundColor: "white",
    marginRight: 8,
  },
  generateButton: {
    backgroundColor: "#7B1FA2",
  },
  dialogActions: {
    padding: 16,
    justifyContent: "space-between",
  },
  dialogCancelButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  dialogConfirmButton: {
    borderRadius: 4,
  },
  snackbar: {
    backgroundColor: "#333",
  },
});

export default PromocionesScreen;