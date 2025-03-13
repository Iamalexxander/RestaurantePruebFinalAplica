import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  IconButton,
  Divider,
  Chip,
  Snackbar,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CartContext } from '../../../contexts/CartContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const DishDetailScreen = ({ route, navigation }) => {
  const { dish } = route.params || {};
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);
  const [quantity, setQuantity] = useState(1);
  const [snackVisible, setSnackVisible] = useState(false);

  if (!dish) {
    return (
      <View style={[styles.container, styles.centered]}>
      <Text style={styles.errorText}>No se pudo cargar la información del plato</Text>
      <Button 
        mode="contained" 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        Volver
      </Button>
    </View>
    );
  }

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(dish, quantity);
    setSnackVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.imageContainer}>
          <Image
            source={dish.imagen ? { uri: dish.imagen } : require('../../../assets/default-image.png')}
            style={styles.dishImage}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Surface style={styles.detailsContainer}>
          <View style={styles.header}>
            <Text style={styles.dishName}>{dish.nombre}</Text>
            <Chip style={styles.categoryChip}>{dish.categoria}</Chip>
          </View>

          <Text style={styles.price}>{dish.precio.toFixed(2)} $</Text>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{dish.descripcion}</Text>

          <Divider style={styles.divider} />

          <Text style={styles.sectionTitle}>Cantidad</Text>
          <View style={styles.quantitySelector}>
            <IconButton
              icon="minus"
              size={20}
              style={styles.quantityButton}
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            />
            <Text style={styles.quantityText}>{quantity}</Text>
            <IconButton
              icon="plus"
              size={20}
              style={styles.quantityButton}
              onPress={increaseQuantity}
            />
          </View>

          <Text style={styles.totalText}>
            Total: {(dish.precio * quantity).toFixed(2)} $
          </Text>
        </Surface>
      </ScrollView>

      <Surface style={styles.bottomBar}>
        <Button
          mode="outlined"
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          Ver Carrito
        </Button>
        <Button
          mode="contained"
          style={styles.addButton}
          onPress={handleAddToCart}
        >
          Añadir al Carrito
        </Button>
      </Surface>

      <Snackbar
        visible={snackVisible}
        onDismiss={() => setSnackVisible(false)}
        duration={2000}
        action={{
          label: 'Ver',
          onPress: () => navigation.navigate('Cart'),
        }}
      >
        Añadido al carrito correctamente
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageContainer: {
    position: 'relative',
  },
  dishImage: {
    width: '100%',
    height: 250,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 1,
  },
  detailsContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dishName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  categoryChip: {
    backgroundColor: '#f1f1f1',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginTop: 10,
  },
  divider: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  description: {
    fontSize: 16,
    marginTop: 5,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    marginHorizontal: 10,
  },
  quantityText: {
    fontSize: 18,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  cartButton: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    flex: 1,
  },
});

export default DishDetailScreen;
