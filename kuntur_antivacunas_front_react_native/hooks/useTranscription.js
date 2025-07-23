import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { API_BASE_URL } from '../constant/Config';

export function useTranscription({ latitud, longitud, nombre_local, ip_camara }) {
  const [transcriptions, setTranscriptions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('🚀 Iniciando useTranscription con:', { latitud, longitud, nombre_local, ip_camara });
    console.log('🔗 API_BASE_URL:', API_BASE_URL);

    // Validar que tengamos todos los datos necesarios
    if (!latitud || !longitud || !nombre_local || !ip_camara) {
      console.warn('⚠️ Faltan datos para iniciar transcripción:', { latitud, longitud, nombre_local, ip_camara });
      return;
    }

    // 1) Inicia la captura
    const startCapture = async () => {
      try {
        console.log('📤 Iniciando captura de audio...');
        console.log('🎯 URL de captura:', `${API_BASE_URL}/audio/start-capture`);
        
        const response = await fetch(`${API_BASE_URL}/audio/start-capture`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ 
            latitud, 
            longitud, 
            nombre_local, 
            ip_camara 
          })
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Captura iniciada exitosamente:', data);
        
        // Iniciar conexión WebSocket solo después de iniciar la captura
        initWebSocket();
        
      } catch (error) {
        console.error('❌ Error iniciando captura:', error);
        setConnectionStatus('error');
      }
    };

    // 2) Función para inicializar WebSocket
    const initWebSocket = () => {
      console.log('🔌 Iniciando conexión WebSocket...');
      console.log('🎯 WebSocket URL:', API_BASE_URL);
      setConnectionStatus('connecting');

      // Limpiar conexión anterior si existe
      if (socketRef.current) {
        console.log('🧹 Limpiando conexión WebSocket anterior');
        socketRef.current.disconnect();
      }

      // Crear nueva conexión con configuración optimizada
      socketRef.current = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        // Configuración específica para React Native
        jsonp: false,
        forceBase64: false
      });

      // Event handlers con más logging
      socketRef.current.on('connect', () => {
        console.log('🔌 Socket conectado exitosamente');
        console.log('🆔 Socket ID:', socketRef.current.id);
        setIsConnected(true);
        setConnectionStatus('connected');
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('📤 Socket desconectado:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      socketRef.current.on('connection_response', (data) => {
        console.log('📥 Respuesta de conexión:', data);
      });

      socketRef.current.on('new_transcription', (data) => {
        console.log('📝 Nueva transcripción recibida:', data);
        console.log('📝 Tipo de data:', typeof data);
        console.log('📝 Keys de data:', Object.keys(data || {}));
        
        if (data && data.text) {
          const newText = data.text.trim();
          console.log('📝 Texto procesado:', newText);
          if (newText) {
            setTranscriptions(prev => {
              const newTranscriptions = [...prev, newText];
              console.log('📋 Total transcripciones:', newTranscriptions.length);
              return newTranscriptions;
            });
          }
        } else {
          console.warn('⚠️ Datos de transcripción inválidos:', data);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error type:', error.type);
        setConnectionStatus('error');
      });

      socketRef.current.on('error', (error) => {
        console.error('❌ Error WebSocket:', error);
        setConnectionStatus('error');
      });

      socketRef.current.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconectado después de', attemptNumber, 'intentos');
        setConnectionStatus('connected');
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 Intento de reconexión #', attemptNumber);
        setConnectionStatus('reconnecting');
      });

      socketRef.current.on('reconnect_error', (error) => {
        console.error('❌ Error de reconexión:', error);
        setConnectionStatus('reconnecting');
      });

      socketRef.current.on('reconnect_failed', () => {
        console.error('❌ Falló la reconexión');
        setConnectionStatus('failed');
      });

      // Evento para debugging - escuchar todos los eventos
      socketRef.current.onAny((event, ...args) => {
        console.log('🎧 Evento recibido:', event, args);
      });
    };

    // Iniciar el proceso
    startCapture();

    // 3) Cleanup al desmontar
    return () => {
      console.log('🧹 Limpiando recursos...');
      
      // Detener captura
      fetch(`${API_BASE_URL}/audio/stop-capture`, { 
        method: 'POST' 
      })
      .then(() => console.log('🛑 Captura detenida'))
      .catch(error => console.warn('⚠️ Error deteniendo captura:', error));

      // Desconectar WebSocket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [latitud, longitud, nombre_local, ip_camara]);

  // Función para reconectar manualmente
  const reconnect = () => {
    console.log('🔄 Reconectando manualmente...');
    if (socketRef.current) {
      socketRef.current.connect();
    }
  };

  // Función para limpiar transcripciones
  const clearTranscriptions = () => {
    setTranscriptions([]);
  };

  return { 
    transcriptions, 
    isConnected,
    connectionStatus,
    reconnect,
    clearTranscriptions
  };
}