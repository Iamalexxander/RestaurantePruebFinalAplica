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
  FAB, 
  Dialog, 
  Portal, 
  TextInput, 
  Text, 
  Card, 
  List, 
  RadioButton,
  ActivityIndicator, 
  SegmentedButtons,
  Chip,
  Surface,
  Divider,
  Avatar
} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withDelay,
  FadeIn
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const UBICACIONES = [
  {
    id: 'todas',
    name: 'Todas',
    icon: require('../../../assets/icons/all.png')
  },
  {
    id: 'interior',
    name: 'Interior',
    icon: require('../../../assets/icons/indoor.png')
  },
  {
    id: 'terraza',
    name: 'Terraza',
    icon: require('../../../assets/icons/outdoor.png')
  }
];

// Modelo de mesas
const MESAS_PRUEBA = [
  {
    id: '1',
    numero: 1,
    capacidad: 4,
    ubicacion: 'interior',
    disponible: true
  },
  {
    id: '2',
    numero: 2,
    capacidad: 2,
    ubicacion: 'interior',
    disponible: true
  },
  {
    id: '3',
    numero: 3,
    capacidad: 6,
    ubicacion: 'terraza',
    disponible: true
  }
];

const ReservasScreen = () => {
  // Contexto de base de datos (usando o no)
  const databaseContext = useContext(DatabaseContext) || {};
  
  // Estados locales
  const [mesas, setMesas] = useState(MESAS_PRUEBA);
  const [reservas, setReservas] = useState([]);
  const [mesasFiltradas, setMesasFiltradas] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [fecha, setFecha] = useState(new Date());
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ubicacion, setUbicacion] = useState('todas');
  const [activeTab, setActiveTab] = useState('mesas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 60 : 160),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  // Cargar datos de Firebase al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Filtrar mesas cuando cambia la ubicación
  useEffect(() => {
    buscarMesasDisponibles();
  }, [mesas, ubicacion]);

  // Función para cargar datos de Firebase
  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar mesas desde Firebase (si existe la colección)
      try {
        const mesasQuery = collection(db, 'mesas');
        const mesasSnapshot = await getDocs(mesasQuery);
        
        if (!mesasSnapshot.empty) {
          const mesasData = mesasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setMesas(mesasData);
        }
      } catch (error) {
        console.log('La colección "mesas" puede no existir aún:', error);
        // Usamos los datos de prueba si no hay colección
      }

      // Cargar reservas desde Firebase
      const reservasQuery = collection(db, 'reservas');
      const reservasSnapshot = await getDocs(reservasQuery);
      const reservasData = reservasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setReservas(reservasData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos correctamente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const showDialog = (mesa = null) => {
    if (mesa) {
      setSelectedMesa(mesa);
    }
    setVisible(true);
  };
  
  const hideDialog = () => {
    setVisible(false);
    setSelectedMesa(null);
    setCliente('');
    setTelefono('');
  };

  const buscarMesasDisponibles = () => {
    // Filtrar por ubicación y disponibilidad
    if (!Array.isArray(mesas)) {
      console.warn('mesas no es un array:', mesas);
      setMesasFiltradas([]);
      return;
    }
    
    const filtradas = mesas.filter(mesa => {
      const ubicacionFiltro = ubicacion === 'todas' || mesa.ubicacion === ubicacion;
      return mesa.disponible && ubicacionFiltro;
    });
    setMesasFiltradas(filtradas);
  };

  const confirmarReserva = async () => {
    if (!selectedMesa) {
      Alert.alert('Error', 'Por favor, selecciona una mesa');
      return;
    }
    if (!cliente || !telefono) {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }

    try {
      // Crear objeto de reserva con la estructura correcta
      const nuevaReserva = {
        mesaId: selectedMesa.id,
        numeroMesa: selectedMesa.numero,
        ubicacionMesa: selectedMesa.ubicacion,
        fecha: fecha.toISOString(),
        cliente,
        email: '', // Campo opcional
        telefono,
        comensales: selectedMesa.capacidad,
        estado: 'confirmada',
        notas: '',
        fechaCreacion: serverTimestamp()
      };

      // Guardar en Firebase
      const docRef = await addDoc(collection(db, 'reservas'), nuevaReserva);
      
      // Actualizar la mesa para marcarla como no disponible si es necesario
      // (esto depende de la lógica de negocio - podría ser que una mesa pueda tener
      // múltiples reservas en diferentes horarios)
      
      Alert.alert('Éxito', 'Reserva creada correctamente');
      hideDialog();
      loadData(); // Recargar datos para reflejar cambios
    } catch (error) {
      console.error('Error al crear reserva:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la reserva');
    }
  };

  const handleCancelarReserva = async (reservaId) => {
    Alert.alert(
      'Confirmar cancelación',
      '¿Estás seguro de que deseas cancelar esta reserva?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí', 
          onPress: async () => {
            try {
              // Actualizar el estado en Firebase
              const reservaRef = doc(db, 'reservas', reservaId);
              await updateDoc(reservaRef, {
                estado: 'cancelada'
              });
              
              Alert.alert('Éxito', 'Reserva cancelada correctamente');
              loadData(); // Recargar datos
            } catch (error) {
              console.error('Error al cancelar reserva:', error);
              Alert.alert('Error', 'Ocurrió un error al cancelar la reserva');
            }
          }
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const renderUbicacionItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => setUbicacion(item.id)}
      style={[
        styles.ubicacionItem,
        ubicacion === item.id && styles.ubicacionItemSelected
      ]}
    >
      <Surface style={styles.ubicacionIconContainer}>
        <Image source={item.icon} style={styles.ubicacionIcon} />
      </Surface>
      <Text style={[
        styles.ubicacionText,
        ubicacion === item.id && styles.ubicacionTextSelected
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderMesaItem = ({ item, index }) => {
    const mesaIcono = item.ubicacion === 'terraza' 
      ? require('../../../assets/icons/table_outdoor.png') 
      : require('../../../assets/icons/table_indoor.png');

    const mesaColor = item.ubicacion === 'terraza' ? '#4CAF50' : '#3F51B5';
    
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        style={styles.mesaItemContainer}
      >
        <Surface style={styles.mesaCard}>
          <TouchableOpacity 
            style={styles.mesaContent}
            onPress={() => {
              setSelectedMesa(item);
              showDialog();
            }}
          >
            <LinearGradient
              colors={[mesaColor, darkenColor(mesaColor, 30)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mesaIconBg}
            >
              <Image source={mesaIcono} style={styles.mesaIcono} />
              <Text style={styles.mesaNumero}>#{item.numero}</Text>
            </LinearGradient>
            
            <View style={styles.mesaInfo}>
              <Text style={styles.mesaTitle}>Mesa {item.numero}</Text>
              <View style={styles.mesaDetailRow}>
                <Text style={styles.mesaDetailLabel}>Ubicación:</Text>
                <Chip style={[styles.mesaChip, { backgroundColor: mesaColor }]}>
                  <Text style={styles.mesaChipText}>{item.ubicacion}</Text>
                </Chip>
              </View>
              <View style={styles.mesaDetailRow}>
                <Text style={styles.mesaDetailLabel}>Capacidad:</Text>
                <View style={styles.capacidadContainer}>
                  {Array(item.capacidad).fill().map((_, i) => (
                    <Avatar.Icon 
                      key={i} 
                      size={18} 
                      icon="account" 
                      color="white"
                      style={styles.personIcon}
                    />
                  ))}
                  <Text style={styles.capacidadText}>{item.capacidad} personas</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Surface>
      </Animated.View>
    );
  };

  const renderReservaItem = ({ item, index }) => {
    // Asegurar que fecha sea un objeto Date válido
    let fechaReserva;
    try {
      fechaReserva = new Date(item.fecha);
    } catch (e) {
      console.error("Error parsing date:", e);
      fechaReserva = new Date();
    }
    
    // Calcular si la reserva es hoy
    const hoy = new Date();
    const esHoy = fechaReserva.getDate() === hoy.getDate() && 
                  fechaReserva.getMonth() === hoy.getMonth() &&
                  fechaReserva.getFullYear() === hoy.getFullYear();
    
    const fechaLabel = esHoy ? 'HOY' : fechaReserva.toLocaleDateString();
    
    const mesaIcono = item.ubicacionMesa === 'terraza' 
      ? require('../../../assets/icons/table_outdoor.png') 
      : require('../../../assets/icons/table_indoor.png');
      
    const statusIcono = item.estado === 'confirmada' 
      ? require('../../../assets/icons/confirmed.png') 
      : item.estado === 'pendiente'
        ? require('../../../assets/icons/pending.png')
        : require('../../../assets/icons/empty.png');
      
    return (
      <Animated.View
        entering={FadeIn.delay(index * 100)}
        style={styles.reservaItemContainer}
      >
        <Surface style={styles.reservaCard}>
          <LinearGradient
            colors={['#FF6B6B', '#FF4757']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.reservaHeader}
          >
            <View style={styles.reservaHeaderLeft}>
              <Text style={styles.clienteNombre}>{item.cliente}</Text>
              <Text style={styles.clienteTelefono}>{item.telefono}</Text>
            </View>
            <View style={styles.reservaStatus}>
              <Image source={statusIcono} style={styles.statusIcon} />
              <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
            </View>
          </LinearGradient>
          
          <View style={styles.reservaBody}>
            <View style={styles.reservaInfo}>
              <View style={styles.reservaDetailItem}>
                <Text style={styles.reservaDetailLabel}>Mesa:</Text>
                <View style={styles.reservaMesaInfo}>
                  <Image source={mesaIcono} style={styles.miniMesaIcon} />
                  <Text style={styles.reservaDetailValue}>
                    #{item.numeroMesa || '?'} ({item.ubicacionMesa || '-'})
                  </Text>
                </View>
              </View>
              
              <View style={styles.reservaDetailItem}>
                <Text style={styles.reservaDetailLabel}>Fecha:</Text>
                <Text style={[
                  styles.reservaDetailValue, 
                  esHoy && styles.reservaHoy
                ]}>
                  {fechaLabel}
                </Text>
              </View>
              
              <View style={styles.reservaDetailItem}>
                <Text style={styles.reservaDetailLabel}>Hora:</Text>
                <Text style={styles.reservaDetailValue}>
                  {fechaReserva.toLocaleTimeString().substring(0, 5)}
                </Text>
              </View>

              {item.comensales && (
                <View style={styles.reservaDetailItem}>
                  <Text style={styles.reservaDetailLabel}>Personas:</Text>
                  <Text style={styles.reservaDetailValue}>
                    {item.comensales}
                  </Text>
                </View>
              )}

              {item.notas && (
                <View style={styles.reservaDetailItem}>
                  <Text style={styles.reservaDetailLabel}>Notas:</Text>
                  <Text style={[styles.reservaDetailValue, styles.notasText]}>
                    {item.notas}
                  </Text>
                </View>
              )}
            </View>
            
            {item.estado !== 'cancelada' && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelarReserva(item.id)}
              >
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </Surface>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground 
          source={require('../../../assets/images/reservations_header.jpg')} 
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
            style={styles.headerGradient}
          >
            <Text style={styles.headerTitle}>Reservas</Text>
            <Text style={styles.headerSubtitle}>Administra tus mesas y reservaciones</Text>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
      
      <View style={styles.segmentedContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { 
              value: 'mesas', 
              label: 'MESAS DISPONIBLES',
              style: activeTab === 'mesas' ? styles.activeSegment : {}
            },
            { 
              value: 'reservas', 
              label: 'RESERVAS ACTUALES',
              style: activeTab === 'reservas' ? styles.activeSegment : {}
            },
          ]}
          style={styles.segmentedButtons}
        />
      </View>
      
      {activeTab === 'mesas' && (
        <View style={styles.ubicacionesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={UBICACIONES}
            renderItem={renderUbicacionItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.ubicacionesList}
          />
        </View>
      )}
      
      {activeTab === 'mesas' ? (
        mesasFiltradas.length > 0 ? (
          <FlatList
            data={mesasFiltradas}
            renderItem={renderMesaItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onScroll={e => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Image 
              source={require('../../../assets/icons/empty_table.png')} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              No hay mesas disponibles con los filtros seleccionados
            </Text>
            <Button 
              mode="contained" 
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              Actualizar
            </Button>
          </View>
        )
      ) : (
        reservas.length > 0 ? (
          <FlatList
            data={reservas}
            renderItem={renderReservaItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onScroll={e => {
              scrollY.value = e.nativeEvent.contentOffset.y;
            }}
          />
        ) : (
          <View style={styles.emptyState}>
            <Image 
              source={require('../../../assets/icons/empty_calendar.png')} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>
              No hay reservas activas
            </Text>
            <Button 
              mode="contained" 
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              Actualizar
            </Button>
          </View>
        )
      )}

      {activeTab === 'mesas' && (
        <FAB
          style={styles.fab}
          icon="plus"
          color="white"
          onPress={() => showDialog()}
          disabled={mesasFiltradas.length === 0}
        />
      )}

      <Portal>
        <Dialog visible={visible} onDismiss={hideDialog} style={styles.dialog}>
          <LinearGradient
            colors={['#FF6B6B', '#FF4757']}
            style={styles.dialogHeader}
          >
            <Dialog.Title style={styles.dialogTitle}>Nueva Reserva</Dialog.Title>
          </LinearGradient>
          
          <Dialog.Content>
            {selectedMesa && (
              <View style={styles.selectedMesaContainer}>
                <Surface style={styles.selectedMesaCard}>
                  <LinearGradient
                    colors={[
                      selectedMesa.ubicacion === 'terraza' ? '#4CAF50' : '#3F51B5', 
                      selectedMesa.ubicacion === 'terraza' ? '#2E7D32' : '#303F9F'
                    ]}
                    style={styles.selectedMesaGradient}
                  >
                    <Image 
                      source={
                        selectedMesa.ubicacion === 'terraza' 
                          ? require('../../../assets/icons/table_outdoor.png') 
                          : require('../../../assets/icons/table_indoor.png')
                      } 
                      style={styles.selectedMesaIcon} 
                    />
                    <View>
                      <Text style={styles.selectedMesaText}>
                        Mesa {selectedMesa.numero}
                      </Text>
                      <Text style={styles.selectedMesaDetail}>
                        {selectedMesa.ubicacion} - {selectedMesa.capacidad} personas
                      </Text>
                    </View>
                  </LinearGradient>
                </Surface>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.datePickerButton}
              onPress={() => setOpenDatePicker(true)}
            >
              <LinearGradient
                colors={['#F5F5F5', '#E0E0E0']}
                style={styles.datePickerGradient}
              >
                <View style={styles.datePickerContent}>
                  <Image
                    source={require('../../../assets/icons/calendar.png')}
                    style={styles.calendarIcon}
                  />
                  <View>
                    <Text style={styles.datePickerLabel}>Fecha y hora:</Text>
                    <Text style={styles.datePickerValue}>{fecha.toLocaleString()}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <DatePicker
              modal
              open={openDatePicker}
              date={fecha}
              onConfirm={(date) => {
                setOpenDatePicker(false);
                setFecha(date);
              }}
              onCancel={() => {
                setOpenDatePicker(false);
              }}
              minimumDate={new Date()}
            />
            
            <TextInput
              label="Nombre del cliente"
              value={cliente}
              onChangeText={setCliente}
              style={styles.input}
              mode="outlined"
              outlineColor="#FF6B6B"
              activeOutlineColor="#FF4757"
              left={<TextInput.Icon icon="account" />}
            />
            
            <TextInput
              label="Teléfono"
              value={telefono}
              onChangeText={setTelefono}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
              outlineColor="#FF6B6B"
              activeOutlineColor="#FF4757"
              left={<TextInput.Icon icon="phone" />}
            />
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
              onPress={confirmarReserva}
              mode="contained"
              buttonColor="#FF6B6B"
              style={styles.dialogConfirmButton}
            >
              CONFIRMAR
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  segmentedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentedButtons: {
    backgroundColor: '#f0f0f0',
  },
  activeSegment: {
    backgroundColor: '#FF6B6B',
  },
  ubicacionesContainer: {
    marginTop: 15,
    marginBottom: 5,
  },
  ubicacionesList: {
    paddingHorizontal: 15,
  },
  ubicacionItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  ubicacionItemSelected: {
    transform: [{ scale: 1.1 }]
  },
  ubicacionIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'white',
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  ubicacionIcon: {
    width: 32,
    height: 32,
  },
  ubicacionText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  ubicacionTextSelected: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  list: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  mesaItemContainer: {
    marginBottom: 16,
  },
  mesaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  mesaContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 100,
  },
  mesaIconBg: {
    width: 100,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mesaIcono: {
    width: 48,
    height: 48,
    marginBottom: 5,
  },
  mesaNumero: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mesaInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  mesaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  mesaDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  mesaDetailLabel: {
    width: 75,
    fontSize: 14,
    color: '#666',
  },
  mesaChip: {
    height: 24,
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  mesaChipText: {
    color: 'white',
    fontSize: 12,
  },
  capacidadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personIcon: {
    backgroundColor: '#666',
    marginRight: 2,
  },
  capacidadText: {
    marginLeft: 4,
    fontSize: 14,
  },
  reservaItemContainer: {
    marginBottom: 16,
  },
  reservaCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
  },
  reservaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  reservaHeaderLeft: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  clienteTelefono: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  reservaStatus: {
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
  reservaBody: {
    padding: 16,
    backgroundColor: 'white',
  },
  reservaInfo: {
    marginBottom: 12,
  },
  reservaDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reservaDetailLabel: {
    width: 60,
    fontSize: 14,
    color: '#666',
  },
  reservaDetailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  reservaHoy: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  reservaMesaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMesaIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
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
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#FF6B6B',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B6B',
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
    backgroundColor: 'white',
  },
  dialogHeader: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dialogTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedMesaContainer: {
    marginVertical: 16,
  },
  selectedMesaCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  selectedMesaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  selectedMesaIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  selectedMesaText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedMesaDetail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  datePickerButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  datePickerGradient: {
    padding: 12,
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#666',
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  dialogActions: {
    padding: 16,
    justifyContent: 'space-between',
  },
  dialogCancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
  },
  dialogConfirmButton: {
    borderRadius: 4,
  },
  notasText: {
    fontStyle: 'italic',
    fontSize: 14,
    color: '#666',
  },
});

export default ReservasScreen;