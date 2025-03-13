// src/clients/screens/privacypolicy/PrivacyPolicy.jsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Surface,
  Divider,
  List,
  Button,
  Snackbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const PrivacyPolicy = () => {
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const sections = [
    {
      title: "Información que recopilamos",
      content: `Recopilamos la siguiente información personal:

• Información de contacto: nombre, dirección de correo electrónico, número de teléfono, dirección postal.
• Información de pago: datos de tarjetas de crédito/débito (almacenados de forma segura a través de nuestros procesadores de pago).
• Preferencias y configuraciones: selecciones de menú favoritas, preferencias dietéticas, historial de pedidos.
• Información de uso: cómo interactúas con nuestra aplicación, frecuencia de visitas, funciones utilizadas.
• Información del dispositivo: tipo de dispositivo, sistema operativo, dirección IP.

La información se recopila cuando:
• Te registras en la aplicación
• Realizas un pedido o reserva
• Actualizas tu perfil
• Interactúas con la aplicación
• Contactas con nuestro servicio de atención al cliente`
    },
    {
      title: "Cómo utilizamos tu información",
      content: `Utilizamos tu información personal para:

• Procesar y gestionar tus pedidos y reservas
• Personalizar tu experiencia en la aplicación
• Mejorar nuestros productos y servicios
• Comunicarnos contigo sobre tu cuenta y pedidos
• Enviarte información promocional (si has dado tu consentimiento)
• Detectar y prevenir fraudes
• Cumplir con nuestras obligaciones legales`
    },
    {
      title: "Compartir información",
      content: `Podemos compartir tu información con:

• Proveedores de servicios: procesadores de pago, servicios de entrega, servicios de análisis y marketing.
• Socios comerciales: podemos compartir información no identificable con socios para mejorar nuestros servicios.
• Requerimientos legales: cuando sea necesario por ley, proceso legal o para proteger nuestros derechos.

No vendemos tu información personal a terceros.`
    },
    {
      title: "Tus derechos",
      content: `Tienes los siguientes derechos sobre tus datos personales:

• Acceso: derecho a solicitar una copia de la información que tenemos sobre ti.
• Rectificación: derecho a corregir la información inexacta que tenemos sobre ti.
• Eliminación: derecho a solicitar que eliminemos tu información personal.
• Restricción: derecho a solicitar que limitemos el procesamiento de tu información.
• Portabilidad: derecho a solicitar la transferencia de tu información a otra organización.
• Objeción: derecho a oponerte al procesamiento de tus datos personales.

Para ejercer estos derechos, ponte en contacto con nosotros a través de privacy@restaurante.com.`
    },
    {
      title: "Seguridad de datos",
      content: `Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra el acceso no autorizado, el uso indebido, la alteración y la destrucción.

Estas medidas incluyen:
• Encriptación de datos sensibles
• Protocolos de seguridad de redes
• Acceso limitado a la información personal
• Monitoreo regular de amenazas de seguridad

A pesar de nuestros esfuerzos, ningún método de transmisión o almacenamiento electrónico es 100% seguro.`
    },
    {
      title: "Retención de datos",
      content: `Conservamos tu información personal solo durante el tiempo necesario para los fines para los que fue recopilada, incluido el cumplimiento de requisitos legales, contables o de informes.

Para determinar el período de retención apropiado, consideramos:
• La cantidad, naturaleza y sensibilidad de los datos
• El riesgo potencial de daño por uso o divulgación no autorizados
• Los fines para los que procesamos los datos
• Si podemos lograr esos fines a través de otros medios`
    },
    {
      title: "Cambios en la política de privacidad",
      content: `Podemos actualizar esta política de privacidad periódicamente para reflejar cambios en nuestras prácticas de información o por otros motivos operativos, legales o regulatorios.

Te notificaremos sobre cualquier cambio significativo a través de un aviso en nuestra aplicación o por correo electrónico.

Te recomendamos revisar periódicamente esta política para estar informado sobre cómo protegemos tu información.`
    },
    {
      title: "Contacto",
      content: `Si tienes preguntas o inquietudes sobre esta política de privacidad o el manejo de tus datos personales, ponte en contacto con nuestro Delegado de Protección de Datos:

• Email: privacy@restaurante.com
• Teléfono: +34 912 345 679
• Dirección: Calle Gran Vía 123, 28013 Madrid, España

Tienes derecho a presentar una queja ante la Agencia Española de Protección de Datos si no estás satisfecho con nuestra respuesta a tu solicitud.`
    },
  ];

  const lastUpdated = "15 de febrero de 2025";

  const PolicySection = ({ title, content, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <List.Accordion
        title={title}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        titleStyle={styles.sectionTitle}
        style={styles.sectionAccordion}
        id={`section-${index}`}
      >
        <View style={styles.sectionContent}>
          <Text style={styles.sectionText}>
            {content}
          </Text>
        </View>
      </List.Accordion>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Surface style={styles.headerSection}>
          <Text style={styles.headerTitle}>Política de Privacidad</Text>
          <Text style={styles.lastUpdated}>Última actualización: {lastUpdated}</Text>
        </Surface>

        <Surface style={styles.introSection}>
          <Text style={styles.introText}>
            En Restaurante, respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política de privacidad describe cómo recopilamos, utilizamos y compartimos tu información cuando utilizas nuestra aplicación.
          </Text>
        </Surface>

        <Surface style={styles.policySection}>
          <List.Section>
            {sections.map((section, index) => (
              <React.Fragment key={index}>
                <PolicySection
                  title={section.title}
                  content={section.content}
                  index={index}
                />
                {index < sections.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List.Section>
        </Surface>

        <Surface style={styles.consentSection}>
          <Text style={styles.consentTitle}>Tu consentimiento</Text>
          <Text style={styles.consentText}>
            Al utilizar nuestra aplicación, aceptas el procesamiento de tu información de acuerdo con esta política de privacidad.
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              setSnackbarVisible(true);
            }}
            style={styles.consentButton}
          >
            Acepto la política de privacidad
          </Button>
        </Surface>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        Preferencias de privacidad guardadas
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  lastUpdated: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  introSection: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
  },
  policySection: {
    margin: 16,
    borderRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  sectionAccordion: {
    backgroundColor: 'white',
    paddingVertical: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
  consentSection: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 30,
  },
  consentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  consentText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
    marginBottom: 16,
  },
  consentButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
  },
});

export default PrivacyPolicy;