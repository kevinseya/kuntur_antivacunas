// hooks/useStreaming.js
import { useState } from 'react';
import { useCamera } from './useCamera'; // Para acceder a latitud, longitud, nombreLocal

export const useStreaming = (cameraIpUrl) => {
  if (!cameraIpUrl) {
    throw new Error('useStreaming: debes pasar cameraIpUrl al hook');
  }

  // Datos de ubicación/local (usados para el body del POST audio)
  const { latitud, longitud, nombreLocal } = useCamera();

  // ----------- ESTADOS VIDEO ----------- 
  const [isVideoStreaming, setIsVideoStreaming] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [videoQuality, setVideoQuality] = useState('HD');
  const [streamUrl, setStreamUrl] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // ----------- ESTADOS AUDIO ----------- 
  const [isAudioStreaming, setIsAudioStreaming] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // ----------- VIDEO FUNCIONES ----------- 
  const testIPWebcamConnection = async () => {
    setConnectionStatus('testing');
    const endpoints = ['/videofeed', '/video', '/shot.jpg', '/status.json'];
    for (const ep of endpoints) {
      try {
        const res = await fetch(`${cameraIpUrl}${ep}`, { method: 'HEAD' });
        if (res.ok) {
          setConnectionStatus('connected');
          return { success: true };
        }
      } catch {}
    }
    setConnectionStatus('failed');
    return { success: false };
  };

  const getStreamUrl = () => {
    const t = Date.now();
    const map = {
      HD: `/videofeed?${t}`,
      SD: `/videofeed?${t}`,
      LOW: `/videofeed?${t}`,
      STREAM: `/video?${t}`,
      SNAPSHOT: `/shot.jpg?rnd=${t}`,
    };
    return `${cameraIpUrl}${map[videoQuality] || map.HD}`;
  };

  const startVideoStream = async () => {
    setVideoLoading(true);
    setVideoError(null);
    try {
      const { success } = await testIPWebcamConnection();
      if (!success) {
        throw new Error(`No se pudo conectar a ${cameraIpUrl}`);
      }
      const url = getStreamUrl();
      setStreamUrl(url);
      await new Promise(r => setTimeout(r, 500));
      setIsVideoStreaming(true);
      setConnectionStatus('streaming');
    } catch (err) {
      setVideoError(err.message);
      setConnectionStatus('failed');
    } finally {
      setVideoLoading(false);
    }
  };

  const stopVideoStream = () => {
    setIsVideoStreaming(false);
    setStreamUrl('');
    setConnectionStatus('disconnected');
  };

  const changeVideoQuality = (quality) => {
    setVideoQuality(quality);
    if (isVideoStreaming) {
      setStreamUrl(getStreamUrl());
    }
  };

  // ----------- AUDIO FUNCIONES ----------- 
  const AUDIO_POST_URL = 'http://192.168.100.29:5001/audio/start-capture';
  const AUDIO_STOP_URL = 'http://192.168.100.29:5001/audio/stop-capture'; // <-- Nuevo endpoint para detener

  const VIDEO_POST_URL = 'http://192.168.100.29:5002/start_detection'; // <-- Nuevo endpoint para iniciar video
  const VIDEO_STOP_URL = 'http://192.168.100.29:5002/stop_detection'; // <-- Nuevo endpoint para detener video

  const startAudioStream = async () => {
    setAudioLoading(true);
    setAudioError(null);
    try {
      const body = {
        latitud,
        longitud,
        nombre_local: nombreLocal,
        ip_camara: `${cameraIpUrl}/audio.wav`,
      };

      const resp = await fetch(AUDIO_POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error('Error al activar audio: ' + errorText);
      }

      setIsAudioStreaming(true);
      const iv = setInterval(() => setAudioLevel(Math.random() * 100), 200);
      return () => clearInterval(iv);

    } catch (err) {
      setAudioError(err.message);
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudioStream = async () => {
    setAudioLoading(true);
    setAudioError(null);
    try {
      const body = {
        latitud,
        longitud,
        nombre_local: nombreLocal,
        ip_camara: `${cameraIpUrl}/audio.wav`,
      };
      const resp = await fetch(AUDIO_STOP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error('Error al detener audio: ' + errorText);
      }

      setIsAudioStreaming(false);
      setAudioLevel(0);
    } catch (err) {
      setAudioError(err.message);
    } finally {
      setAudioLoading(false);
    }
  };

  // ----------- VIDEO FUNCIONES ----------- 
  const startVideoDetection = async () => {
    setVideoLoading(true);
    setVideoError(null);
    try {
      const body = {
        latitud,
        longitud,
        nombre_local: nombreLocal,
        ip_camara: `${cameraIpUrl}/video_feed`,
      };

      const resp = await fetch(VIDEO_POST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error('Error al iniciar video: ' + errorText);
      }

      setIsVideoStreaming(true);
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setVideoLoading(false);
    }
  };

  const stopVideoDetection = async () => {
    setVideoLoading(true);
    setVideoError(null);
    try {
      const body = {
        latitud,
        longitud,
        nombre_local: nombreLocal,
        ip_camara: `${cameraIpUrl}/video_feed`,
      };
      const resp = await fetch(VIDEO_STOP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error('Error al detener video: ' + errorText);
      }

      setIsVideoStreaming(false);
    } catch (err) {
      setVideoError(err.message);
    } finally {
      setVideoLoading(false);
    }
  };

  // ----------- UTILIDADES ----------- 
  const reconnectStream = () => {
    stopVideoStream();
    setTimeout(startVideoStream, 1000);
  };

  // ----------- MÉTODOS GLOBALES PARA KUNTUR ----------- 
  const startAllStreams = async () => {
    await startVideoDetection();
    await startAudioStream();
  };

  const stopAllStreams = async () => {
    stopVideoDetection();
    await stopAudioStream();
  };

  // ----------- EXPORT ----------- 
  return {
    // Video
    isVideoStreaming,
    videoLoading,
    videoError,
    videoQuality,
    streamUrl,
    connectionStatus,
    startVideoStream,
    stopVideoStream,
    changeVideoQuality,
    clearVideoError: () => setVideoError(null),
    reconnectStream,

    // Audio
    isAudioStreaming,
    audioLoading,
    audioError,
    audioLevel,
    startAudioStream,
    stopAudioStream,
    clearAudioError: () => setAudioError(null),

    // Global
    startAllStreams,
    stopAllStreams,
  };
};
