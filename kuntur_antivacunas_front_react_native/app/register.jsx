// app/register.jsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import UserRegistrationForm from '../components/UserRegistrationForm';

export default function RegisterScreen() {
  const router = useRouter();

  const handleRegistrationComplete = () => {
    // Reemplaza la ruta a (tabs) una vez que el form invoque esta callback
    router.replace('/(tabs)');
  };

  return (
    <UserRegistrationForm onRegistrationComplete={handleRegistrationComplete} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
