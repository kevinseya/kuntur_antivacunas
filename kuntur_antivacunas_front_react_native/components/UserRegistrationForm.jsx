// components/UserRegistrationForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  BuildingStorefrontIcon,
  VideoCameraIcon,
  MapPinIcon,
  CheckCircleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon
} from 'react-native-heroicons/solid';
import { useRouter } from 'expo-router';
import Colors from '../constant/Colors';
import { FontFamily, FontSize } from '../constant/Typography';
import { useUserRegistration } from '../hooks/useUserRegistration';
import { useCamera } from '../hooks/useCamera';

export default function UserRegistrationForm({ onRegistrationComplete }) {
  const router = useRouter();
  const { registerUser, registrationLoading, error, clearError } = useUserRegistration();
  const { setCameraIp, setLatitud, setLongitud, setNombreLocal } = useCamera();

  const [formData, setFormData] = useState({
    nombre_local: '',
    ip_camara: '',
    ubicacion: '',
    latitud: null,
    longitud: null,
    password: ''
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: -0.1807,
    longitude: -78.4678,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      clearError();
    }
  }, [error]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getAddressFromCoordinates = async (lat, lon) => {
    try {
      setIsLoadingLocation(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.display_name || 'Dirección no encontrada';
    } catch {
      return 'Error obteniendo dirección';
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const setLocation = async (latitude, longitude) => {
    setSelectedLocation({ latitude, longitude });
    setMapRegion({
      ...mapRegion,
      latitude,
      longitude,
    });
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 500);
    setFormData(prev => ({
      ...prev,
      latitud: latitude,
      longitud: longitude,
      ubicacion: 'Obteniendo dirección...'
    }));
    const address = await getAddressFromCoordinates(latitude, longitude);
    setLocationName(address);
    setFormData(prev => ({ ...prev, ubicacion: address }));
  };

  const handleMapPress = ({ nativeEvent }) => {
    const { latitude, longitude } = nativeEvent.coordinate;
    setLocation(latitude, longitude);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos permiso de ubicación para esto.');
        return;
      }
      setIsLoadingLocation(true);
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await setLocation(coords.latitude, coords.longitude);
    } catch (e) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const validateForm = () => {
    if (!formData.nombre_local.trim()) {
      Alert.alert('Error', 'El nombre del local es requerido');
      return false;
    }
    if (!formData.ip_camara.trim()) {
      Alert.alert('Error', 'La IP de la cámara es requerida');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!formData.latitud || !formData.longitud) {
      Alert.alert('Error', 'Selecciona una ubicación en el mapa');
      return false;
    }
    if (
      formData.ubicacion === 'Obteniendo dirección...' ||
      formData.ubicacion === 'Error obteniendo dirección'
    ) {
      Alert.alert('Error', 'Espera a que se obtenga la dirección o selecciona otra ubicación');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const result = await registerUser(formData);
    if (result.success) {
      setCameraIp(formData.ip_camara);
      setLatitud(formData.latitud);
      setLongitud(formData.longitud);
      setNombreLocal(formData.nombre_local);
      Alert.alert('Éxito', 'Local registrado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            if (onRegistrationComplete) {
              onRegistrationComplete();
            } else {
              router.replace('/(tabs)');
            }
          }
        }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.secondary[500], Colors.primary[500]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.background}
      >
        {/* Header */}
        <View style={styles.customHeader}>
          <View style={styles.headerPlaceholder} />
          <Text style={styles.headerTitle}>Registro de Local</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            {/* --- Información del Local --- */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Información del Local</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre del local</Text>
                <View style={styles.inputContainer}>
                  <BuildingStorefrontIcon size={20} color={Colors.neutro} />
                  <TextInput
                    style={styles.input}
                    placeholder="Ingresa el nombre del local"
                    placeholderTextColor={Colors.neutro}
                    value={formData.nombre_local}
                    onChangeText={t => handleInputChange('nombre_local', t)}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>IP de la cámara</Text>
                <View style={styles.inputContainer}>
                  <VideoCameraIcon size={20} color={Colors.neutro} />
                  <TextInput
                    style={[styles.input, styles.urlInput]}
                    placeholder="http://192.168.1.1:8080"
                    placeholderTextColor={Colors.neutro}
                    value={formData.ip_camara}
                    onChangeText={t => handleInputChange('ip_camara', t)}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputContainer}>
                  <LockClosedIcon size={20} color={Colors.neutro} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor={Colors.neutro}
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={t => handleInputChange('password', t)}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeButton}>
                    {showPassword
                      ? <EyeSlashIcon size={20} color={Colors.neutro} />
                      : <EyeIcon size={20} color={Colors.neutro} />
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* --- Ubicación --- */}
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Ubicación</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Usar mi ubicación o toca en el mapa</Text>
                <TouchableOpacity
                  style={styles.myLocationBtn}
                  onPress={handleUseCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  {isLoadingLocation
                    ? <ActivityIndicator color={Colors.neutro} />
                    : (
                      <>
                        <MapPinIcon size={16} color={Colors.neutro} />
                        <Text style={styles.myLocationText}>Mi ubicación</Text>
                      </>
                    )
                  }
                </TouchableOpacity>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  region={mapRegion}
                  onPress={handleMapPress}
                  showsUserLocation
                  showsMyLocationButton={false}
                >
                  {selectedLocation && (
                    <Marker
                      coordinate={selectedLocation}
                      title="Ubicación"
                      description={locationName}
                    />
                  )}
                </MapView>
                <Text style={styles.addressLabel}>{formData.ubicacion}</Text>
              </View>
            </View>

            {/* --- Botón Registrar --- */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                (registrationLoading || isLoadingLocation) && styles.disabledButton
              ]}
              onPress={handleSubmit}
              disabled={registrationLoading || isLoadingLocation}
            >
              {registrationLoading
                ? <ActivityIndicator color={Colors.primary[500]} />
                : (
                  <>
                    <CheckCircleIcon size={20} color={Colors.primary[500]} />
                    <Text style={styles.buttonText}>Registrar Local</Text>
                  </>
                )
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1 },
  customHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 15, marginTop: 40, borderBottomWidth: 1, borderBottomColor: Colors.primary[200]
  },
  headerPlaceholder: { width: 40 },
  headerTitle: { fontSize: FontSize.large, fontFamily: FontFamily.bold, color: Colors.neutro },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 20, gap: 20 },
  formCard: {
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5
  },
  cardTitle: { fontSize: FontSize.body + 2, fontFamily: FontFamily.bold, color: Colors.neutro, marginBottom: 16, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: FontSize.small, fontFamily: FontFamily.medium, color: Colors.neutro, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderWidth: 1, borderColor: Colors.neutro
  },
  input: { flex: 1, fontSize: FontSize.xs, fontFamily: FontFamily.regular, color: Colors.neutro },
  urlInput: { fontFamily: FontFamily.medium },
  eyeButton: { padding: 4 },
  myLocationBtn: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
    padding: 8, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8, alignSelf: 'flex-start'
  },
  myLocationText: { color: Colors.neutro, fontFamily: FontFamily.medium, marginLeft: 4 },
  map: { height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
  addressLabel: {
    fontSize: FontSize.small, fontFamily: FontFamily.regular,
    color: Colors.neutro, backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 8
  },
  registerButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.neutro, height: 40, borderRadius: 16, gap: 8,
    shadowColor: Colors.neutro, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { fontSize: FontSize.body, fontFamily: FontFamily.medium, color: Colors.primary[500], letterSpacing: 0.5 },
});
