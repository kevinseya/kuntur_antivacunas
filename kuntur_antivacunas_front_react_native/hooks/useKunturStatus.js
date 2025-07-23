// hooks/useKunturStatus.js
import { useState, useEffect } from 'react';
import { useStreaming } from './useStreaming';
import { useUserRegistration } from './useUserRegistration';
import { useCamera } from './useCamera';

export const useKunturStatus = (initialStatus = 'off') => {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener los datos del contexto de cámara
  const { cameraIp, latitud, longitud, nombreLocal } = useCamera();
  if (!cameraIp) {
    throw new Error('useKunturStatus: no hay cameraIp en el contexto');
  }

  // Hook de streaming, pasamos la IP
  const {
    startAllStreams,
    stopAllStreams,
    // otros métodos si los necesitas...
  } = useStreaming(cameraIp);

  const { user, loading: userLoading } = useUserRegistration();

  // Traer estado inicial de Kuntur (puedes conectar con tu API real si tienes)
  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 500));
      setStatus('off'); // o lo que venga de tu API si ya hay backend para esto
      globalThis.__KUNTUR_ACTIVO__ = false;
    } catch {
      setError('Error al obtener el estado de Kuntur');
    } finally {
      setLoading(false);
    }
  };

  // Activar Kuntur: activa video y audio (manda POST para audio)
  const activateKuntur = async () => {
    setLoading(true);
    setError(null);
    try {
      globalThis.__KUNTUR_ACTIVO__ = true; // Flag global, sirve para efecto automático
      await startAllStreams();
      setStatus('on');
    } catch (e) {
      setError('Error al activar Kuntur');
      globalThis.__KUNTUR_ACTIVO__ = false;
    } finally {
      setLoading(false);
    }
  };

  // Desactivar Kuntur: detiene video y audio
  const deactivateKuntur = async () => {
    setLoading(true);
    setError(null);
    try {
      globalThis.__KUNTUR_ACTIVO__ = false; // Flag global, sirve para efecto automático
      await stopAllStreams();
      setStatus('off');
    } catch {
      setError('Error al desactivar Kuntur');
    } finally {
      setLoading(false);
    }
  };

  const toggleKuntur = () => {
    return status === 'off' ? activateKuntur() : deactivateKuntur();
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, []);

  return {
    status,
    loading,
    error,
    activateKuntur,
    deactivateKuntur,
    toggleKuntur,
    refetchStatus: fetchStatus,
    hasUser: !!user,
    userLoading,
  };
};
