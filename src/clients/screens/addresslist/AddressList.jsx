// src/clients/screens/addresslist/AddressList.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  FAB,
  Modal,
  Portal,
  TextInput,
  Divider,
} from 'react-native-paper';
import { AuthContext } from '../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const AddressList = () => {
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [addressName, setAddressName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [details, setDetails] = useState('');

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      // Simulación de carga de datos
      setTimeout(() => {
        const mockAddresses = [
          {
            id: '1',
            name: 'Casa',
            street: 'Calle Principal',
            number: '123',
            city: 'Ciudad Ejemplo',
            postalCode: '28001',
            details: 'Piso 2, Puerta B',
            isDefault: true,
          },
          {
            id: '2',
            name: 'Trabajo',
            street: 'Avenida Comercial',
            number: '456',
            city: 'Ciudad Ejemplo',
            postalCode: '28002',
            details: 'Edificio Corporativo, 5ª planta',
            isDefault: false,
          },
        ];
        setAddresses(mockAddresses);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      Alert.alert('Error', 'No se pudieron cargar tus direcciones');
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAddresses();
  };

  const setAsDefault = (id) => {
    setAddresses(
      addresses.map((address) => ({
        ...address,
        isDefault: address.id === id,
      }))
    );
    Alert.alert('Éxito', 'Dirección establecida como predeterminada');
  };

  const deleteAddress = (id) => {
    Alert.alert(
      'Eliminar dirección',
      '¿Estás seguro de que quieres eliminar esta dirección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          onPress: () => {
            setAddresses(addresses.filter((address) => address.id !== id));
            Alert.alert('Éxito', 'Dirección eliminada correctamente');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const openAddModal = () => {
    setCurrentAddress(null);
    setAddressName('');
    setStreet('');
    setNumber('');
    setCity('');
    setPostalCode('');
    setDetails('');
    setModalVisible(true);
  };

  const openEditModal = (address) => {
    setCurrentAddress(address);
    setAddressName(address.name);
    setStreet(address.street);
    setNumber(address.number);
    setCity(address.city);
    setPostalCode(address.postalCode);
    setDetails(address.details || '');
    setModalVisible(true);
  };

  const saveAddress = () => {
    // Validar campos
    if (!addressName.trim() || !street.trim() || !number.trim() || !city.trim() || !postalCode.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    const newAddress = {
      id: currentAddress ? currentAddress.id : Date.now().toString(),
      name: addressName,
      street,
      number,
      city,
      postalCode,
      details,
      isDefault: currentAddress ? currentAddress.isDefault : addresses.length === 0,
    };

    if (currentAddress) {
      // Editar dirección existente
      setAddresses(
        addresses.map((address) =>
          address.id === currentAddress.id ? newAddress : address
        )
      );
      Alert.alert('Éxito', 'Dirección actualizada correctamente');
    } else {
      // Añadir nueva dirección
      setAddresses([...addresses, newAddress]);
      Alert.alert('Éxito', 'Dirección añadida correctamente');
    }

    setModalVisible(false);
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.nameContainer}>
            <Ionicons
              name={item.name.toLowerCase() === 'casa' ? 'home' : 'briefcase'}
              size={20}
              color="#FFC107"
              style={styles.icon}
            />
            <Text style={styles.addressName}>{item.name}</Text>
          </View>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Predeterminada</Text>
            </View>
          )}
        </View>

        <Divider style={styles.divider} />

        <View style={styles.addressDetails}>
          <Text style={styles.addressText}>
            {item.street}, {item.number}
          </Text>
          <Text style={styles.addressText}>
            {item.city}, {item.postalCode}
          </Text>
          {item.details && <Text style={styles.detailsText}>{item.details}</Text>}
        </View>

        <View style={styles.cardActions}>
          {!item.isDefault && (
            <Button
              mode="text"
              onPress={() => setAsDefault(item.id)}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Establecer como predeterminada
            </Button>
          )}
          <View style={styles.iconButtons}>
            <IconButton
              icon="pencil"
              size={20}
              color="#555"
              onPress={() => openEditModal(item)}
              style={styles.iconButton}
            />
            <IconButton
              icon="delete"
              size={20}
              color="#F44336"
              onPress={() => deleteAddress(item.id)}
              style={styles.iconButton}
              disabled={addresses.length === 1 && item.isDefault}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>No tienes direcciones guardadas</Text>
      <Text style={styles.emptySubText}>
        Añade direcciones para facilitar tus pedidos y entregas
      </Text>
      <Button
        mode="contained"
        onPress={openAddModal}
        style={styles.addButton}
        icon="plus"
      >
        Añadir Dirección
      </Button>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC107" />
        <Text style={styles.loadingText}>Cargando tus direcciones...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={addresses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyList}
      />

      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>
            {currentAddress ? 'Editar Dirección' : 'Añadir Dirección'}
          </Text>

          <TextInput
            label="Nombre de la dirección *"
            value={addressName}
            onChangeText={setAddressName}
            style={styles.input}
            mode="outlined"
            placeholder="Casa, Trabajo, etc."
          />

          <TextInput
            label="Calle *"
            value={street}
            onChangeText={setStreet}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Número *"
            value={number}
            onChangeText={setNumber}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <TextInput
            label="Ciudad *"
            value={city}
            onChangeText={setCity}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Código Postal *"
            value={postalCode}
            onChangeText={setPostalCode}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <TextInput
            label="Detalles adicionales"
            value={details}
            onChangeText={setDetails}
            style={styles.input}
            mode="outlined"
            placeholder="Piso, puerta, etc."
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={saveAddress}
              style={[styles.modalButton, { backgroundColor: '#FFC107' }]}
            >
              Guardar
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        color="white"
        onPress={openAddModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  addressName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  defaultBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#43A047',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 10,
  },
  addressDetails: {
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  actionButton: {
    marginRight: 10,
  },
  actionButtonLabel: {
    fontSize: 12,
    color: '#FFC107',
  },
  iconButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    margin: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFC107',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#FFC107',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default AddressList;