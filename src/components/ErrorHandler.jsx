// src/components/ErrorHandler.jsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Icon } from 'react-native-paper';

const ErrorHandler = ({ message, onRetry }) => {
  return (
    <View style={styles.container}>
      <Icon source="alert-circle" size={64} color="#d32f2f" />
      <Text style={styles.message}>{message || 'Se ha producido un error'}</Text>
      {onRetry && (
        <Button 
          mode="contained" 
          onPress={onRetry}
          style={styles.button}
        >
          Reintentar
        </Button>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  button: {
    marginTop: 16,
  },
});

export default ErrorHandler;