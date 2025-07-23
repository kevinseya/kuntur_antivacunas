// app/(tabs)/resumen.jsx
import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constant/Colors';
import Header from '../../components/Header';
import VideoStreamComponent from '../../components/VideoStreamComponent';
import { WifiIcon } from 'react-native-heroicons/solid';
import { FontFamily, FontSize } from '../../constant/Typography';
import { useStreaming } from '../../hooks/useStreaming';
import { useCamera } from '../../hooks/useCamera';
import { useSSETranscription } from '../../hooks/useSSETranscription';

export default function ResumenScreen() {
  const { cameraIp, latitud, longitud, nombreLocal } = useCamera();

  if (!cameraIp) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se ha registrado ninguna IP de cámara. Registra tu local primero.
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
    reconnectStream,
  } = useStreaming(cameraIpUrl);

  // Hook de transcripción por SSE
  const {
    transcriptions = [],
    isConnected = false,
    connectionStatus: sseStatus = 'disconnected',
    reconnect,
    clearTranscriptions
  } = useSSETranscription();

  // Efecto para prender/apagar la cámara automáticamente según Kuntur
  useEffect(() => {
    if (globalThis.__KUNTUR_ACTIVO__) {
      if (!isVideoStreaming && !videoLoading) {
        startVideoStream();
      }
    } else {
      if (isVideoStreaming && !videoLoading) {
        stopVideoStream();
      }
    }
    // eslint-disable-next-line
  }, [globalThis.__KUNTUR_ACTIVO__, isVideoStreaming, videoLoading]);

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

  const getConnectionStatusColor = () => {
    if (!sseStatus) {
      return Colors?.gray?.[500] || '#6b7280';
    }
    switch (sseStatus) {
      case 'connected': 
        return Colors?.success?.[500] || '#22c55e';
      case 'connecting': 
      case 'reconnecting': 
        return Colors?.warning?.[500] || '#f59e0b';
      case 'error':
      case 'failed': 
        return Colors?.danger?.[500] || '#ef4444';
      default: 
        return Colors?.gray?.[500] || '#6b7280';
    }
  };

  const getConnectionStatusText = () => {
    if (!sseStatus) {
      return 'Inicializando...';
    }
    switch (sseStatus) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando...';
      case 'reconnecting': return 'Reconectando...';
      case 'error': return 'Error';
      case 'failed': return 'Falló';
      default: return 'Desconectado';
    }
  };

  const handleReconnect = () => {
    if (typeof reconnect === 'function') {
      reconnect();
    }
  };

  const handleClearTranscriptions = () => {
    if (typeof clearTranscriptions === 'function') {
      clearTranscriptions();
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
          {/* Solo la IP de la cámara, sin icono de lugar */}
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
            streamUrl={streamUrl}
            connectionStatus={connectionStatus}
            onReconnect={reconnectStream}
            onStart={handleVideoStart}
            onStop={handleVideoStop}
            onQualityChange={handleQualityChange}
            onClearError={clearVideoError}
            cameraIpUrl={cameraIpUrl}
          />

          <View style={styles.transcriptionHeader}>
            <Text style={styles.text}>Transcripción</Text>
            <View style={styles.connectionStatus}>
              <WifiIcon 
                color={getConnectionStatusColor()} 
                size={16} 
              />
              <Text style={[styles.connectionStatusText, { color: getConnectionStatusColor() }]}>
                {getConnectionStatusText()}
              </Text>
              {!isConnected && (
                <TouchableOpacity 
                  onPress={handleReconnect}
                  style={styles.reconnectButton}
                >
                  <Text style={styles.reconnectButtonText}>Reconectar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.transcriptionContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {transcriptions && transcriptions.length > 0 ? (
                <>
                  {transcriptions.map((t, i) => (
                    <Text key={i} style={styles.textTranscription}>
                      {`${i + 1}. ${t || ''}`}
                    </Text>
                  ))}
                  <TouchableOpacity 
                    onPress={handleClearTranscriptions}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>Limpiar transcripciones</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.waitingContainer}>
                  <Text style={styles.textTranscription}>
                    Esperando transcripción...
                  </Text>
                  <Text style={styles.debugText}>
                    Estado: {getConnectionStatusText()}
                  </Text>
                  <Text style={styles.debugText}>
                    Cámara: {cameraIpUrl || 'No disponible'}
                  </Text>
                  <Text style={styles.debugText}>
                    Local: {nombreLocal || 'No disponible'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { 
    flex: 1, 
    marginTop: 64, 
    marginHorizontal: 16,
    marginBottom: 80,
  },
  content: { 
    marginTop: 40, 
    flex: 1, 
    paddingTop: 20, 
    paddingBottom: 100,
    gap: 20, 
    width: '100%' 
  },
  location: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    justifyContent: 'center' 
  },
  locationText: {
    color: Colors.neutro,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
  },
  transcriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    borderLeftColor: Colors.neutro,
    paddingLeft: 16,
    borderLeftWidth: 4,
    color: Colors.neutro,
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connectionStatusText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.small,
  },
  reconnectButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reconnectButtonText: {
    color: Colors.neutro,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.small,
  },
  transcriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    maxHeight: '35%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  textTranscription: {
    color: Colors.neutro,
    fontFamily: FontFamily.light,
    fontSize: FontSize.small,
    lineHeight: 20,
    marginBottom: 8,
  },
  waitingContainer: {
    alignItems: 'center',
    gap: 8,
  },
  debugText: {
    color: Colors.neutro,
    fontFamily: FontFamily.light,
    fontSize: FontSize.small * 0.9,
    opacity: 0.7,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: Colors.danger[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 16,
  },
  clearButtonText: {
    color: Colors.neutro,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.small,
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
