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
  ScrollView,
} from "react-native";
import {
  Button,
  FAB,
  Dialog,
  Portal,
  TextInput,
  Text,
  Chip,
  ActivityIndicator,
  Menu,
  Surface,
  RadioButton,
  Snackbar,
} from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from "react-native-reanimated";
import { DatabaseContext } from "../../../contexts/DatabaseContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const CATEGORIAS = [
  {
    id: "entrantes",
    name: "Entrantes",
    icon: require("../../../assets/icons/category1.png"),
  },
  {
    id: "principales",
    name: "Principales",
    icon: require("../../../assets/icons/category2.png"),
  },
  {
    id: "postres",
    name: "Postres",
    icon: require("../../../assets/icons/category3.png"),
  },
  {
    id: "bebidas",
    name: "Bebidas",
    icon: require("../../../assets/icons/category4.png"),
  },
];

// Imágenes disponibles para los platos
const AVAILABLE_IMAGES = [
  {
    id: "food1",
    source: require("../../../assets/images/food1.jpg"),
    name: "Ensalada",
  },
  {
    id: "food2",
    source: require("../../../assets/images/food2.jpg"),
    name: "Hamburguesa",
  },
  {
    id: "food3",
    source: require("../../../assets/images/food3.jpg"),
    name: "Pasta",
  },
  {
    id: "food4",
    source: require("../../../assets/images/food4.jpg"),
    name: "Postre",
  },
  {
    id: "food5",
    source: require("../../../assets/images/food5.jpg"),
    name: "Bebida",
  },
  {
    id: "food6",
    source: require("../../../assets/images/food6.jpg"),
    name: "Paella",
  },
  {
    id: "paella",
    source: require("../../../assets/images/paella.jpg"),
    name: "Paella Especial",
  },
  {
    id: "tortilla",
    source: require("../../../assets/images/tortilla.jpg"),
    name: "Tortilla",
  },
  {
    id: "pulpo",
    source: require("../../../assets/images/pulpo.jpg"),
    name: "Pulpo",
  },
  {
    id: "sangria",
    source: require("../../../assets/images/sangria.jpg"),
    name: "Sangría",
  },
  {
    id: "crema_catalana",
    source: require("../../../assets/images/crema_catalana.jpg"),
    name: "Crema Catalana",
  },
];

const MenuScreen = () => {
  const {
    platos = [],
    addPlato,
    updatePlato,
    deletePlato,
    loading,
  } = useContext(DatabaseContext);
  const [visible, setVisible] = useState(false);
  const [imageSelectionVisible, setImageSelectionVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPlato, setCurrentPlato] = useState(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [categoriaMenuVisible, setCategoriaMenuVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [nombreError, setNombreError] = useState("");
  const [descripcionError, setDescripcionError] = useState("");
  const [precioError, setPrecioError] = useState("");
  const [categoriaError, setCategoriaError] = useState("");
  const [imageError, setImageError] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 60 : 180),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  const validateFields = () => {
    let isValid = true;

    // Validar nombre (solo letras, espacios y números)
    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio");
      isValid = false;
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s0-9]+$/.test(nombre)) {
      setNombreError(
        "El nombre solo puede contener letras, espacios y números"
      );
      isValid = false;
    } else {
      setNombreError("");
    }

    // Validar descripción
    if (!descripcion.trim()) {
      setDescripcionError("La descripción es obligatoria");
      isValid = false;
    } else {
      setDescripcionError("");
    }

    // Validar precio (solo números y un punto decimal)
    if (!precio.trim()) {
      setPrecioError("El precio es obligatorio");
      isValid = false;
    } else if (!/^\d+(\.\d{1,2})?$/.test(precio)) {
      setPrecioError("Formato inválido. Ej: 10.50");
      isValid = false;
    } else if (parseFloat(precio) <= 0) {
      setPrecioError("El precio debe ser mayor a 0");
      isValid = false;
    } else {
      setPrecioError("");
    }

    // Validar categoría
    if (!categoria) {
      setCategoriaError("Debes seleccionar una categoría");
      isValid = false;
    } else {
      setCategoriaError("");
    }

    // Validar imagen
    if (!selectedImage) {
      setImageError("Debes seleccionar una imagen");
      isValid = false;
    } else {
      setImageError("");
    }

    return isValid;
  };

  const showDialog = () => {
    setVisible(true);
    setEditMode(false);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoria("");
    setDisponible(true);
    setSelectedImage(null);
    setNombreError("");
    setDescripcionError("");
    setPrecioError("");
    setCategoriaError("");
    setImageError("");
  };

  const hideDialog = () => {
    setVisible(false);
    setEditMode(false);
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategoria("");
    setDisponible(true);
    setCurrentPlato(null);
    setSelectedImage(null);
    setNombreError("");
    setDescripcionError("");
    setPrecioError("");
    setCategoriaError("");
    setImageError("");
  };

  const showImageSelection = () => {
    setImageSelectionVisible(true);
  };

  const hideImageSelection = () => {
    setImageSelectionVisible(false);
  };

  const handleSave = async () => {
    if (!validateFields()) {
      return;
    }

    // Preparar la imagen para almacenarla en Firebase
    // En un caso real, aquí habría que subir la imagen a Firebase Storage
    // y obtener una URL, pero como ejemplo usamos la referencia local

    const platoData = {
      nombre,
      descripcion,
      precio: parseFloat(precio),
      categoria,
      imagen: selectedImage.id,
      disponible: disponible,
      destacado: false,
      descuento: 0,
      createdAt: new Date().toISOString(),
      actualizadoAt: new Date().toISOString(),
    };

    try {
      if (editMode && currentPlato) {
        // Asegurarse de que currentPlato.id existe y es válido
        if (!currentPlato.id) {
          throw new Error("ID de plato no válido");
        }

        // Usar updateDoc con una referencia correcta al documento
        const platoRef = doc(db, "menu", currentPlato.id);

        // Verificar si el documento existe antes de actualizarlo
        const platoDoc = await getDoc(platoRef);
        if (!platoDoc.exists()) {
          throw new Error(`El plato con ID ${currentPlato.id} no existe`);
        }

        await updateDoc(platoRef, {
          ...platoData,
          actualizadoAt: new Date().toISOString(),
        });

        setSnackbarMessage("Plato actualizado correctamente");
      } else {
        // Usar addDoc para nuevos documentos
        const collectionRef = collection(db, "menu");
        const newDocRef = await addDoc(collectionRef, {
          ...platoData,
        });

        setSnackbarMessage("Plato añadido correctamente");
      }

      setSnackbarVisible(true);
      hideDialog();
    } catch (error) {
      console.error("Error guardando plato:", error);
      Alert.alert(
        "Error",
        "Hubo un problema al guardar el plato: " + error.message
      );
    }
  };

  const handleEditPlato = (plato) => {
    setCurrentPlato(plato);
    setNombre(plato.nombre);
    setDescripcion(plato.descripcion);
    setPrecio(plato.precio.toString());
    setCategoria(plato.categoria);
    setDisponible(plato.disponible !== false);

    // Buscar la imagen correspondiente en AVAILABLE_IMAGES
    const platoImage = AVAILABLE_IMAGES.find(
      (img) =>
        img.id === plato.imagen ||
        (typeof plato.imagen === "object" && plato.imagen.id === img.id)
    );

    setSelectedImage(platoImage || AVAILABLE_IMAGES[0]);
    setEditMode(true);
    setVisible(true);
  };

  const handleDeletePlato = async (platoId) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar este plato? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              // Usar deleteDoc con una referencia correcta al documento
              const platoRef = doc(db, 'menu', platoId);
              
              // Verificar si el documento existe antes de eliminarlo
              const platoDoc = await getDoc(platoRef);
              if (!platoDoc.exists()) {
                throw new Error(`El plato con ID ${platoId} no existe`);
              }
              
              await deleteDoc(platoRef);
              hideDialog();
              setSnackbarMessage('Plato eliminado correctamente');
              setSnackbarVisible(true);
            } catch (error) {
              console.error("Error eliminando plato:", error);
              Alert.alert('Error', 'No se pudo eliminar el plato: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleToggleDisponible = async (plato) => {
    try {
      // Usar updateDoc con una referencia correcta al documento
      const platoRef = doc(db, 'menu', plato.id);
      
      // Verificar si el documento existe antes de actualizarlo
      const platoDoc = await getDoc(platoRef);
      if (!platoDoc.exists()) {
        throw new Error(`El plato con ID ${plato.id} no existe`);
      }
      
      await updateDoc(platoRef, {
        disponible: !plato.disponible,
        actualizadoAt: new Date().toISOString()
      });
      
      setSnackbarMessage(`Plato ${plato.disponible ? 'desactivado' : 'activado'} correctamente`);
      setSnackbarVisible(true);
    } catch (error) {
      console.error("Error cambiando estado:", error);
      Alert.alert('Error', 'No se pudo cambiar el estado del plato: ' + error.message);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(item.id)}
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.categoryItemSelected,
      ]}
    >
      <Surface style={styles.categoryIconContainer}>
        <Image source={item.icon} style={styles.categoryIcon} />
      </Surface>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderFoodItem = ({ item, index }) => {
    // Encontrar la imagen correspondiente
    const imageSource =
      AVAILABLE_IMAGES.find((img) => img.id === item.imagen)?.source ||
      (typeof item.imagen === "object"
        ? item.imagen
        : require("../../../assets/default-image.png"));

    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        style={styles.foodItemContainer}
      >
        <TouchableOpacity onPress={() => handleEditPlato(item)}>
          <Image
            source={imageSource}
            style={styles.foodImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.foodItemGradient}
          >
            <Text style={styles.foodTitle}>{item.nombre}</Text>
            <Text style={styles.foodDescription} numberOfLines={2}>
              {item.descripcion}
            </Text>
            <View style={styles.foodItemFooter}>
              <Chip
                mode="outlined"
                style={styles.categoryChip}
                textStyle={styles.categoryChipText}
              >
                {item.categoria}
              </Chip>
              <Text style={styles.foodPrice}>{item.precio.toFixed(2)} $</Text>
            </View>

            <View style={styles.foodActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  item.disponible ? styles.disableButton : styles.enableButton,
                ]}
                onPress={() => handleToggleDisponible(item)}
              >
                <Text style={styles.actionButtonText}>
                  {item.disponible ? "Desactivar" : "Activar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteActionButton}
                onPress={() => handleDeletePlato(item.id)}
              >
                <Text style={styles.deleteActionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>

            {item.disponible ? (
              <Chip
                mode="outlined"
                style={styles.availableChip}
                textStyle={styles.availableChipText}
                icon="check-circle"
              >
                Disponible
              </Chip>
            ) : (
              <Chip
                mode="outlined"
                style={styles.unavailableChip}
                textStyle={styles.unavailableChipText}
                icon="close-circle"
              >
                No disponible
              </Chip>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={require("../../../assets/icons/empty_menu.png")}
        style={styles.emptyStateImage}
      />
      <Text style={styles.emptyStateTitle}>No hay platos en el menú</Text>
      <Text style={styles.emptyStateSubtitle}>
        Comienza añadiendo tu primer plato
      </Text>
      <Button
        mode="contained"
        style={styles.emptyStateButton}
        onPress={showDialog}
      >
        Añadir primer plato
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando menú...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground
          source={require("../../../assets/images/food1.jpg")}
          style={styles.headerImage}
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "rgba(0,0,0,0.4)"]}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Nuestro Menú</Text>
            <Text style={styles.headerSubtitle}>
              {platos.length === 0
                ? "Comienza a crear tu menú"
                : `${platos.length} platos disponibles`}
            </Text>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            {
              id: "todas",
              name: "Todas",
              icon: require("../../../assets/icons/all.png"),
            },
            ...CATEGORIAS,
          ]}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {platos.length > 0 ? (
        <FlatList
          data={platos.filter(
            (plato) =>
              selectedCategory === "todas" ||
              plato.categoria === selectedCategory
          )}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.foodList}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.noCategoryItems}>
              <Image
                source={require("../../../assets/icons/empty.png")}
                style={styles.noCategoryItemsImage}
              />
              <Text style={styles.noCategoryItemsText}>
                No hay platos en esta categoría
              </Text>
            </View>
          )}
        />
      ) : (
        renderEmptyState()
      )}

      <FAB style={styles.fab} icon="plus" color="white" onPress={showDialog} />

      {/* Dialog para añadir o editar plato */}
      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <Dialog.Title>
            {editMode ? "Editar Plato" : "Nuevo Plato"}
          </Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={styles.dialogScrollContent}>
              <TextInput
                label="Nombre del plato *"
                value={nombre}
                onChangeText={setNombre}
                style={styles.input}
                mode="outlined"
                error={!!nombreError}
              />
              {nombreError ? (
                <Text style={styles.errorText}>{nombreError}</Text>
              ) : null}

              <TextInput
                label="Descripción *"
                value={descripcion}
                onChangeText={setDescripcion}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
                error={!!descripcionError}
              />
              {descripcionError ? (
                <Text style={styles.errorText}>{descripcionError}</Text>
              ) : null}

              <TextInput
                label="Precio ($) *"
                value={precio}
                onChangeText={setPrecio}
                style={styles.input}
                mode="outlined"
                keyboardType="decimal-pad"
                error={!!precioError}
              />
              {precioError ? (
                <Text style={styles.errorText}>{precioError}</Text>
              ) : null}

              <Menu
                visible={categoriaMenuVisible}
                onDismiss={() => setCategoriaMenuVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setCategoriaMenuVisible(true)}
                    style={[
                      styles.dropdownButton,
                      categoriaError && styles.inputError,
                    ]}
                    icon="chevron-down"
                  >
                    {categoria
                      ? CATEGORIAS.find((cat) => cat.id === categoria)?.name ||
                        categoria
                      : "Seleccionar categoría *"}
                  </Button>
                }
              >
                {CATEGORIAS.map((cat) => (
                  <Menu.Item
                    key={cat.id}
                    title={cat.name}
                    onPress={() => {
                      setCategoria(cat.id);
                      setCategoriaError("");
                      setCategoriaMenuVisible(false);
                    }}
                  />
                ))}
              </Menu>
              {categoriaError ? (
                <Text style={styles.errorText}>{categoriaError}</Text>
              ) : null}

              <Button
                mode="outlined"
                onPress={showImageSelection}
                style={[styles.imageButton, imageError && styles.inputError]}
                icon={selectedImage ? "check" : "image"}
              >
                {selectedImage
                  ? `Imagen: ${selectedImage.name}`
                  : "Seleccionar imagen *"}
              </Button>
              {imageError ? (
                <Text style={styles.errorText}>{imageError}</Text>
              ) : null}

              {selectedImage && (
                <Image
                  source={selectedImage.source}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.disponibleContainer}>
                <Text style={styles.disponibleLabel}>Disponible</Text>
                <RadioButton.Group
                  onValueChange={(value) => setDisponible(value === "true")}
                  value={disponible ? "true" : "false"}
                >
                  <View style={styles.radioButtonRow}>
                    <RadioButton.Item
                      label="Sí"
                      value="true"
                      position="leading"
                      labelStyle={styles.radioLabel}
                      color="#FF6B6B"
                    />
                    <RadioButton.Item
                      label="No"
                      value="false"
                      position="leading"
                      labelStyle={styles.radioLabel}
                      color="#FF6B6B"
                    />
                  </View>
                </RadioButton.Group>
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancelar</Button>
            <Button onPress={handleSave} mode="contained">
              {editMode ? "Actualizar" : "Añadir"}
            </Button>
            {editMode && (
              <Button
                onPress={() => {
                  if (currentPlato) {
                    handleDeletePlato(currentPlato.id);
                  }
                }}
                textColor="red"
              >
                Eliminar
              </Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Dialog para selección de imágenes */}
      <Portal>
        <Dialog
          visible={imageSelectionVisible}
          onDismiss={hideImageSelection}
          style={styles.imageDialog}
        >
          <Dialog.Title>Seleccionar imagen</Dialog.Title>
          <Dialog.ScrollArea>
            <FlatList
              data={AVAILABLE_IMAGES}
              numColumns={2}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.imageSelectionContainer}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.imageSelectionItem,
                    selectedImage?.id === item.id && styles.selectedImageItem,
                  ]}
                  onPress={() => {
                    setSelectedImage(item);
                    setImageError("");
                    hideImageSelection();
                  }}
                >
                  <Image
                    source={item.source}
                    style={styles.imageSelectionImage}
                  />
                  <Text style={styles.imageSelectionText}>{item.name}</Text>
                  {selectedImage?.id === item.id && (
                    <View style={styles.selectedImageIndicator}>
                      <Text style={styles.selectedImageIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={hideImageSelection}>Cancelar</Button>
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
    backgroundColor: "#FF6B6B",
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
  categoriesContainer: {
    marginVertical: 15,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 20,
  },
  categoryItemSelected: {
    transform: [{ scale: 1.1 }],
  },
  categoryIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "white",
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  categoryIcon: {
    width: 32,
    height: 32,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#FF6B6B",
    fontWeight: "bold",
  },
  foodList: {
    paddingBottom: 80,
    paddingHorizontal: 15,
  },
  foodItemContainer: {
    marginBottom: 20,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  foodImage: {
    width: "100%",
    height: 220,
  },
  foodItemGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 18,
  },
  foodTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  foodDescription: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  foodItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  foodActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  disableButton: {
    backgroundColor: "#F44336",
  },
  enableButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  deleteActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#333",
  },
  deleteActionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  categoryChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
  },
  categoryChipText: {
    color: "white",
  },
  availableChip: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(76, 175, 80, 0.8)",
    borderColor: "rgba(76, 175, 80, 0.5)",
  },
  availableChipText: {
    color: "white",
  },
  unavailableChip: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(244, 67, 54, 0.8)",
    borderColor: "rgba(244, 67, 54, 0.5)",
  },
  unavailableChipText: {
    color: "white",
  },
  foodPrice: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#FF6B6B",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  dialog: {
    maxHeight: "80%",
  },
  dialogScrollContent: {
    paddingVertical: 10,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "red",
    borderWidth: 1,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  dropdownButton: {
    marginVertical: 8,
    width: "100%",
  },
  imageButton: {
    marginVertical: 8,
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
    marginVertical: 8,
  },
  disponibleContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  disponibleLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  radioButtonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioLabel: {
    fontSize: 14,
  },
  imageDialog: {
    maxHeight: "90%",
  },
  imageSelectionContainer: {
    padding: 10,
  },
  imageSelectionItem: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedImageItem: {
    borderWidth: 3,
    borderColor: "#FF6B6B",
  },
  imageSelectionImage: {
    width: "100%",
    height: 100,
    resizeMode: "cover",
  },
  imageSelectionText: {
    padding: 8,
    textAlign: "center",
    fontSize: 12,
  },
  selectedImageIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedImageIndicatorText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  emptyStateButton: {
    backgroundColor: "#FF6B6B",
  },
  noCategoryItems: {
    padding: 30,
    alignItems: "center",
  },
  noCategoryItemsImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  noCategoryItemsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  snackbar: {
    backgroundColor: "#333",
  },
});

export default MenuScreen;
