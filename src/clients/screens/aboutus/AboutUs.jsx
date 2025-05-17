// src/clients/screens/aboutus/AboutUs.jsx
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  Platform,
} from 'react-native';
import {
  Text,
  Surface,
  Button,
  Divider,
  Card,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const AboutUs = () => {
  const openMap = () => {
      // Coordenadas corregidas del Quicentro Sur en Quito, Ecuador
      const latitude = -0.2859762;
      const longitude = -78.5431995583668;
      const label = 'Quicentro Sur, Quito, Ecuador';
      const url = Platform.select({
        ios: `maps:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
      });
      Linking.openURL(url);
  };

  const openSocialMedia = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <Image
        source={require('../../../assets/restaurant-header.jpg')}
        style={styles.headerImage}
        defaultSource={require('../../../assets/restaurant-header-placeholder.jpg')}
      />
      
      <Surface style={styles.section}>
        <Text style={styles.title}>Nuestra Historia</Text>
        <Text style={styles.paragraph}>
          Fundado en 2010, nuestro restaurante nació con la visión de ofrecer una experiencia gastronómica única que combine lo mejor de la cocina tradicional con toques innovadores.
        </Text>
        <Text style={styles.paragraph}>
          Lo que comenzó como un pequeño negocio familiar se ha convertido en uno de los destinos culinarios más reconocidos de la ciudad, manteniendo siempre la esencia y los valores que nos caracterizan: calidad, creatividad y pasión por la gastronomía.
        </Text>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.title}>Nuestra Filosofía</Text>
        <View style={styles.philosophyItem}>
          <View style={styles.philosophyIcon}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
          </View>
          <View style={styles.philosophyContent}>
            <Text style={styles.philosophyTitle}>Ingredientes Frescos</Text>
            <Text style={styles.philosophyText}>
              Seleccionamos cuidadosamente ingredientes locales y de temporada para garantizar la máxima frescura y sabor en cada plato.
            </Text>
          </View>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.philosophyItem}>
          <View style={styles.philosophyIcon}>
            <Ionicons name="create" size={24} color="#FFC107" />
          </View>
          <View style={styles.philosophyContent}>
            <Text style={styles.philosophyTitle}>Creatividad Culinaria</Text>
            <Text style={styles.philosophyText}>
              Nuestro equipo de chefs explora constantemente nuevas técnicas y combinaciones de sabores para ofrecerte experiencias gastronómicas memorables.
            </Text>
          </View>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.philosophyItem}>
          <View style={styles.philosophyIcon}>
            <Ionicons name="people" size={24} color="#2196F3" />
          </View>
          <View style={styles.philosophyContent}>
            <Text style={styles.philosophyTitle}>Atención Personalizada</Text>
            <Text style={styles.philosophyText}>
              Nos esforzamos por crear un ambiente acogedor donde cada cliente se sienta especial, con un servicio atento y personalizado.
            </Text>
          </View>
        </View>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.title}>Nuestro Equipo</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.teamScrollView}
        >
          {[
            {
              name: 'Carlos Ramírez',
              position: 'Chef Ejecutivo',
              image: require('../../../assets/chef1.jpg'),
            },
            {
              name: 'Javier Rodríguez',
              position: 'Chef de Pastelería',
              image: require('../../../assets/chef3.jpg'),
            },
            {
              name: 'María González',
              position: 'Sommelier',
              image: require('../../../assets/chef2.jpg'),
            },
          ].map((member, index) => (
            <Card key={index} style={styles.teamCard}>
              <Card.Cover
                source={member.image}
                style={styles.teamImage}
                defaultSource={require('../../../assets/profile-placeholder.jpg')}
              />
              <Card.Content style={styles.teamCardContent}>
                <Text style={styles.teamName}>{member.name}</Text>
                <Text style={styles.teamPosition}>{member.position}</Text>
              </Card.Content>
            </Card>
          ))}
        </ScrollView>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.title}>Ven a Visitarnos</Text>
        <View style={styles.mapContainer}>
          <Image
            source={require('../../../assets/quicentro-map.jpg')}
            style={styles.mapImage}
            resizeMode="cover"
          />
          <Button
            mode="contained"
            icon="map-marker"
            onPress={openMap}
            style={styles.mapButton}
            labelStyle={{ color: 'black' }}
          >
            Ver Ubicación
          </Button>
        </View>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Dirección:</Text>
          <Text style={styles.addressText}>Quicentro Sur, Av. Morán Valverde y Quitumbe Ñan, Quito</Text>
        </View>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Horario:</Text>
          <Text style={styles.addressText}>Lun - Jue: 13:00 - 16:00, 20:00 - 23:30</Text>
          <Text style={styles.addressText}>Vie - Sáb: 13:00 - 16:00, 20:00 - 00:30</Text>
          <Text style={styles.addressText}>Dom: 13:00 - 16:00</Text>
        </View>
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Teléfono:</Text>
          <Text style={styles.addressText}>+593 2 398 7600</Text>
        </View>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.title}>Síguenos</Text>
        <View style={styles.socialContainer}>
          <Button
            icon={() => <Ionicons name="logo-instagram" size={24} color="white" />}
            mode="contained"
            style={[styles.socialButton, { backgroundColor: '#E1306C' }]}
            onPress={() => openSocialMedia('https://instagram.com')}
          >
            Instagram
          </Button>
          <Button
            icon={() => <Ionicons name="logo-facebook" size={24} color="white" />}
            mode="contained"
            style={[styles.socialButton, { backgroundColor: '#3b5998' }]}
            onPress={() => openSocialMedia('https://facebook.com')}
          >
            Facebook
          </Button>
          <Button
            icon={() => <Ionicons name="logo-twitter" size={24} color="white" />}
            mode="contained"
            style={[styles.socialButton, { backgroundColor: '#1DA1F2' }]}
            onPress={() => openSocialMedia('https://twitter.com')}
          >
            Twitter
          </Button>
        </View>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
    marginBottom: 12,
  },
  philosophyItem: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  philosophyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  philosophyContent: {
    flex: 1,
  },
  philosophyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  philosophyText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  divider: {
    marginVertical: 10,
  },
  teamScrollView: {
    marginVertical: 10,
  },
  teamCard: {
    width: 180,
    marginRight: 16,
    elevation: 3,
  },
  teamImage: {
    height: 150,
  },
  teamCardContent: {
    padding: 10,
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  teamPosition: {
    fontSize: 12,
    color: '#666',
  },
  mapContainer: {
    marginBottom: 16,
  },
  mapImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  mapButton: {
    backgroundColor: '#FFC107',
  },
  addressContainer: {
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  socialButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default AboutUs;