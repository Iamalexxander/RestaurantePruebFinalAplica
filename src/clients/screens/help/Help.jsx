// src/clients/screens/help/Help.jsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  List,
  Surface,
  Button,
  Divider,
  TextInput,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const FAQItem = ({ question, answer }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <List.Accordion
      title={question}
      expanded={expanded}
      onPress={() => setExpanded(!expanded)}
      titleStyle={styles.faqQuestion}
      style={styles.faqAccordion}
    >
      <View style={styles.faqAnswerContainer}>
        <Text style={styles.faqAnswer}>{answer}</Text>
      </View>
    </List.Accordion>
  );
};

const Help = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const faqs = [
    {
      question: '¿Cómo puedo hacer un pedido?',
      answer: 'Para hacer un pedido, navega a la sección de menú, selecciona los platos que deseas y añádelos al carrito. Una vez completes tu selección, dirígete al carrito para revisar tu pedido y proceder con el pago.',
    },
    {
      question: '¿Cuáles son los métodos de pago disponibles?',
      answer: 'Aceptamos pagos con tarjetas de crédito/débito (Visa, MasterCard, American Express), pago en efectivo al momento de la entrega, y transferencias bancarias. Puedes gestionar tus métodos de pago en la sección "Métodos de pago" de tu perfil.',
    },
    {
      question: '¿Cómo puedo hacer una reserva?',
      answer: 'Para hacer una reserva, ve a la sección "Reservas" en la aplicación. Selecciona la fecha, hora y número de comensales, y completa el proceso de reserva. Recibirás una confirmación por correo electrónico y podrás ver el estado de tu reserva en la aplicación.',
    },
    {
      question: '¿Cuál es el tiempo estimado de entrega?',
      answer: 'El tiempo estimado de entrega varía según tu ubicación, pero generalmente oscila entre 30 y 45 minutos. En la confirmación de tu pedido podrás ver un tiempo estimado más preciso.',
    },
    {
      question: '¿Puedo cancelar mi pedido?',
      answer: 'Puedes cancelar tu pedido dentro de los primeros 5 minutos después de realizarlo. Para hacerlo, ve a la sección "Pedidos", selecciona el pedido que deseas cancelar y sigue las instrucciones de cancelación.',
    },
  ];

  const contactMethods = [
    {
      icon: 'call',
      title: 'Teléfono',
      subtitle: '+34 912 345 678',
      action: () => Linking.openURL('tel:+34912345678'),
    },
    {
      icon: 'mail',
      title: 'Email',
      subtitle: 'soporte@restaurante.com',
      action: () => Linking.openURL('mailto:soporte@restaurante.com'),
    },
    {
      icon: 'logo-whatsapp',
      title: 'WhatsApp',
      subtitle: '+34 612 345 678',
      action: () => Linking.openURL('https://wa.me/34612345678'),
    },
  ];

  const handleSubmitForm = () => {
    // Validar campos
    if (!name.trim() || !email.trim() || !message.trim()) {
      setSnackbarMessage('Por favor completa todos los campos');
      setSnackbarVisible(true);
      return;
    }

    // Validar formato de email con una expresión regular simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setSnackbarMessage('Por favor ingresa un email válido');
      setSnackbarVisible(true);
      return;
    }

    // Simulación de envío exitoso
    setTimeout(() => {
      setName('');
      setEmail('');
      setMessage('');
      setSnackbarMessage('Mensaje enviado con éxito. Nos pondremos en contacto contigo pronto.');
      setSnackbarVisible(true);
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.headerSection}>
        <Text style={styles.headerTitle}>¿Cómo podemos ayudarte?</Text>
        <Text style={styles.headerSubtitle}>
          Consulta nuestras preguntas frecuentes o contáctanos directamente
        </Text>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>Preguntas frecuentes</Text>
        <List.Section>
          {faqs.map((faq, index) => (
            <React.Fragment key={index}>
              <FAQItem question={faq.question} answer={faq.answer} />
              {index < faqs.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List.Section>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>Contáctanos</Text>
        
        <View style={styles.contactMethodsContainer}>
          {contactMethods.map((method, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.contactMethod}
              onPress={method.action}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={method.icon} size={24} color="#FF6B6B" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>{method.title}</Text>
                <Text style={styles.contactSubtitle}>{method.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Surface>

      <Surface style={styles.section}>
        <Text style={styles.sectionTitle}>Horario de atención</Text>
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleDay}>Lunes - Viernes</Text>
          <Text style={styles.scheduleHours}>9:00 - 20:00</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleDay}>Sábados</Text>
          <Text style={styles.scheduleHours}>10:00 - 18:00</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleDay}>Domingos</Text>
          <Text style={styles.scheduleHours}>11:00 - 16:00</Text>
        </View>
      </Surface>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerSection: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FF6B6B',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqAccordion: {
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  faqQuestion: {
    fontWeight: 'bold',
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  contactMethodsContainer: {
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactSubtitle: {
    color: '#555',
    fontSize: 14,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  textarea: {
    marginBottom: 16,
    backgroundColor: 'white',
    height: 120,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    marginTop: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleHours: {
    fontSize: 16,
    color: '#FF6B6B',
  },
  divider: {
    backgroundColor: '#e0e0e0',
  },
});

export default Help;