import React, { useContext, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  FlatList,
  Dimensions,
  ImageBackground
} from 'react-native';
import { 
  Text, 
  Surface, 
  Title, 
  Button, 
  Card, 
  Chip, 
  Searchbar
} from 'react-native-paper';
import { DatabaseContext } from '../../../contexts/DatabaseContext';
import { AuthContext } from '../../../contexts/AuthContext';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const UserHomeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { platos, promociones } = useContext(DatabaseContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animated header
  const scrollY = useSharedValue(0);
  
  const headerStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(scrollY.value > 50 ? 120 : 200),
      opacity: withSpring(scrollY.value > 50 ? 0.8 : 1),
    };
  });

  // Promociones activas
  const activePromotions = promociones?.filter(promo => promo?.activa) || [];

  // Platos destacados (por ejemplo, los 5 primeros)
  const featuredDishes = platos?.slice(0, 5) || [];

  const renderPromoItem = ({ item, index }) => (
    <Animated.View
      entering={FadeIn.delay(index * 100)}
      style={styles.promoCard}
    >
      <LinearGradient
        colors={item.tipo === 'porcentaje' ? ['#FF8A65', '#FF5722'] : ['#4FC3F7', '#03A9F4']}
        style={styles.promoGradient}
      >
        <View style={styles.promoContent}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>{item.nombre}</Text>
            <Text style={styles.promoDescription}>{item.descripcion}</Text>
            
            {/* Añadido: Mostrar código promocional */}
            {item.codigo && (
              <View style={styles.promoCodeContainer}>
                <Text style={styles.promoCodeLabel}>Código:</Text>
                <Surface style={styles.promoCodeBadge}>
                  <Text style={styles.promoCode}>{item.codigo}</Text>
                </Surface>
              </View>
            )}
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {item.descuento}{item.tipo === 'porcentaje' ? '%' : '$'} 
              {'\n'}
              OFF
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderFeaturedDish = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.featuredDishCard}
      onPress={() => navigation.navigate('DishDetail', { dish: item })}
    >
      <Image 
        source={typeof item.imagen === 'string' ? { uri: item.imagen } : item.imagen}
        style={styles.dishImage}
        defaultSource={require('../../../assets/images/food-placeholder.jpg')}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.dishGradient}
      >
        <Text style={styles.dishName}>{item.nombre}</Text>
        <Text style={styles.dishPrice}>{item.precio?.toFixed(2) || '0.00'} $</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleScroll = (event) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <ImageBackground 
          source={require('../../../assets/images/food3.jpg')} 
          style={styles.headerImage}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
            style={styles.headerGradient}
          >
            <View style={styles.userInfo}>
              <View style={styles.welcome}>
                <Text style={styles.greeting}>¡Hola, {user?.name || 'Usuario'}!</Text>
                <Text style={styles.welcomeText}>¿Qué te apetece hoy?</Text>
              </View>
            </View>
            
            <Searchbar
              placeholder="Buscar en el menú..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              onSubmitEditing={() => navigation.navigate('Menú', { searchQuery })}
            />
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
      
      <ScrollView 
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Menú')}
          >
            <View style={[styles.actionBackground, { backgroundColor: '#F8F9FA' }]}>
              <Image 
                source={require('../../../assets/icons/menu_colored.png')} 
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, { color: '#4CAF50' }]}>Menú</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reservas')}
          >
            <View style={[styles.actionBackground, { backgroundColor: '#F8F9FA' }]}>
              <Image 
                source={require('../../../assets/icons/calendar_colored.png')} 
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, { color: '#3F51B5' }]}>Reservar</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Carrito')}
          >
            <View style={[styles.actionBackground, { backgroundColor: '#F8F9FA' }]}>
              <Image 
                source={require('../../../assets/icons/cart_colored.png')} 
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, { color: '#FF9800' }]}>Carrito</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Pedidos')}
          >
            <View style={[styles.actionBackground, { backgroundColor: '#F8F9FA' }]}>
              <Image 
                source={require('../../../assets/icons/orders_colored.png')} 
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, { color: '#9C27B0' }]}>Pedidos</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {activePromotions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Promociones Especiales</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Promotions')}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={activePromotions}
              renderItem={renderPromoItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.promoList}
            />
          </View>
        )}
        
        <Surface style={styles.infoCard}>
          <ImageBackground 
            source={require('../../../assets/images/food4.jpg')}
            style={styles.infoCardBg}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.4)']}
              style={styles.infoCardGradient}
            >
              <View style={styles.infoCardContent}>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>¿Necesitas ayuda?</Text>
                  <Text style={styles.infoDescription}>
                    Si tienes alguna pregunta o necesitas asistencia, nuestro equipo está disponible para ayudarte.
                  </Text>
                </View>
                <Button 
                  mode="contained" 
                  style={styles.contactButton}
                  onPress={() => navigation.navigate('Contact')}
                >
                  Contacto
                </Button>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Surface>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  promoCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  promoCodeLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginRight: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  promoCodeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  promoCode: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
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
    padding: 20,
    paddingTop: 50,
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  welcome: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  searchBar: {
    borderRadius: 12,
    elevation: 4,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 15,
    marginTop: 10,
  },
  actionButton: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    backgroundColor: '#F8F9FA',
  },
  actionBackground: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 110,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    marginBottom: 10,
  },
  actionText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 15,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  promoList: {
    paddingRight: 15,
  },
  promoCard: {
    width: width * 0.85,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  promoGradient: {
    padding: 20,
    height: 140,
  },
  promoContent: {
    flexDirection: 'row',
    height: '100%',
  },
  promoTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  promoDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  discountBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  featuredList: {
    paddingRight: 15,
  },
  featuredDishCard: {
    width: 200,
    height: 220,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  dishImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dishGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    justifyContent: 'flex-end',
  },
  dishName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  dishPrice: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  infoCard: {
    margin: 15,
    marginTop: 5,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    height: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  infoCardBg: {
    width: '100%',
    height: '100%',
  },
  infoCardGradient: {
    width: '100%',
    height: '100%',
    padding: 20,
    justifyContent: 'center',
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  infoDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 5
  },
  contactButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
});

export default UserHomeScreen;