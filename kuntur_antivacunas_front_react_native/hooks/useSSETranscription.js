import { useEffect, useState, useRef } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';

const SSE_URL = 'http://192.168.1.34:5000/stream'; // Cambia por tu IP o variable de entorno si lo prefieres

export function useSSETranscription(url = SSE_URL) {
  const [transcriptions, setTranscriptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const eventSourceRef = useRef(null);

  useEffect(() => {
    setConnectionStatus('connecting');
    let es;
    try {
      es = new EventSourcePolyfill(url, {
        // Puedes añadir headers aquí si necesitas auth
        // headers: { Authorization: "Bearer ..." },
        heartbeatTimeout: 60000, // Opcional, timeout
        withCredentials: false
      });
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        // console.log('✅ SSE conectado');
      };

      es.onerror = (e) => {
        setIsConnected(false);
        setConnectionStatus('error');
        // console.log('❌ Error SSE:', e);
      };

      es.onmessage = (event) => {
        if (!event.data) return;
        try {
          const data = JSON.parse(event.data);
          // Solo texto en vivo
          if (data.tipo === "transcripcion" || data.mensaje?.includes("Transcripción")) {
            if (data.texto) setTranscriptions(prev => [...prev, data.texto]);
          }
          // Alertas (opcional)
          if (data.tipo === "alerta" || data.mensaje?.startsWith('🚨')) {
            setAlerts(prev => [...prev, data]);
          }
        } catch (err) {
          // console.log("Error parsing SSE data:", err);
        }
      };
    } catch (err) {
      setIsConnected(false);
      setConnectionStatus('error');
      // console.log("No se pudo abrir SSE:", err);
    }

    // Cleanup
    return () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, [url]);

  const reconnect = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setConnectionStatus('reconnecting');
    setTimeout(() => {
      setConnectionStatus('connecting');
      // El useEffect volverá a correr automáticamente si cambias el URL
    }, 1000);
  };

  const clearTranscriptions = () => setTranscriptions([]);
  const clearAlerts = () => setAlerts([]);

  return { transcriptions, alerts, isConnected, connectionStatus, reconnect, clearTranscriptions, clearAlerts };
}
