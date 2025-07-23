// app/(tabs)/streaming.jsx
import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constant/Colors';
import Header from '../../components/Header';
import VideoStreamComponent from '../../components/VideoStreamComponent';
import AudioStreamComponent from '../../components/AudioStreamComponent';
import { MapPinIcon } from 'react-native-heroicons/solid';
import { FontFamily, FontSize } from '../../constant/Typography';
import { useStreaming } from '../../hooks/useStreaming';
import { useCamera } from '../../hooks/useCamera';

export default function StreamingScreen() {
  const { cameraIp } = useCamera();
  if (!cameraIp) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se ha registrado ninguna IP de cámara. Registra primero tu local.
        </Text>
      </View>
    );
  }

  const cameraIpUrl = cameraIp;
  const {
    isVideoStreaming,
    videoLoading,
    videoError,
    videoQuality,
    streamUrl,
    connectionStatus,
    startVideoStream,
    stopVideoStream,
    changeVideoQuality,
    clearVideoError,
    reconnectStream,       // <-- lo necesitas para el botón de reconexión
    isAudioStreaming,
    audioLoading,
    audioError,
    audioLevel,
    clearAudioError,
  } = useStreaming(cameraIpUrl);

  const handleVideoStart = () => {
    Alert.alert(
      'Iniciar Stream',
      `¿Deseas conectar con la cámara en ${cameraIpUrl}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Conectar', onPress: startVideoStream }
      ]
    );
  };

  const handleVideoStop = () => {
    Alert.alert(
      'Detener Stream',
      '¿Deseas desconectar la cámara IP?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desconectar', onPress: stopVideoStream }
      ]
    );
  };

  const handleQualityChange = (quality) => {
    if (isVideoStreaming) {
      Alert.alert(
        'Cambiar Calidad',
        `¿Deseas cambiar la calidad a ${quality}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cambiar', onPress: () => changeVideoQuality(quality) }
        ]
      );
    } else {
      changeVideoQuality(quality);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.secondary[500], Colors.primary[500]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.background}
    >
      <View style={styles.container}>
        <Header />
        <View style={styles.content}>
          <View style={styles.location}>
            <Text style={styles.locationText}>
              📡 Cámara IP: {cameraIpUrl}
            </Text>
          </View>

          <VideoStreamComponent
            isStreaming={isVideoStreaming}
            loading={videoLoading}
            error={videoError}
            quality={videoQuality}

            /** ← Estos son los nuevos props obligatorios **/
            streamUrl={streamUrl}
            connectionStatus={connectionStatus}
            onReconnect={reconnectStream}

            onStart={handleVideoStart}
            onStop={handleVideoStop}
            onQualityChange={handleQualityChange}
            onClearError={clearVideoError}

            cameraIpUrl={cameraIpUrl}
          />

          <AudioStreamComponent
            isStreaming={isAudioStreaming}
            loading={audioLoading}
            error={audioError}
            audioLevel={audioLevel}
            onClearError={clearAudioError}
          />

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Estado de Conexión</Text>
            <Text style={styles.infoText}>🎥 Calidad: {videoQuality}</Text>
            <Text style={styles.infoText}>
              🔗 Video: {isVideoStreaming ? 'Conectado' : 'Desconectado'}
            </Text>
            <Text style={styles.infoText}>
              🔊 Audio: {isAudioStreaming ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, marginTop: 64, marginHorizontal: 16 },
  content: { marginTop: 40, flex: 1, paddingTop: 20, gap: 20, width: '100%' },
  location: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  locationText: {
    color: Colors.neutro,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  infoTitle: {
    color: Colors.neutro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.medium,
    marginBottom: 8,
  },
  infoText: {
    color: Colors.neutro,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
    marginBottom: 4,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: Colors.danger[500],
    fontFamily: FontFamily.medium,
    fontSize: FontSize.medium,
    textAlign: 'center',
  },
});
