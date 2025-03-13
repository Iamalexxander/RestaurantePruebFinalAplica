import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { CartProvider } from './src/contexts/CartContext'; // Add this import
import 'react-native-reanimated';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <PaperProvider>
          <AuthProvider>
            <DatabaseProvider>
              <CartProvider>  {/* Add this provider */}
                <AppNavigator />
              </CartProvider>
            </DatabaseProvider>
          </AuthProvider>
        </PaperProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;