import React, { createContext, useContext, useState } from 'react';

const CameraContext = createContext();

export const CameraProvider = ({ children }) => {
  const [cameraIp,    setCameraIp]    = useState(null);
  const [latitud,     setLatitud]     = useState(null);
  const [longitud,    setLongitud]    = useState(null);
  const [nombreLocal, setNombreLocal] = useState(null);

  return (
    <CameraContext.Provider value={{
      cameraIp,    setCameraIp,
      latitud,     setLatitud,
      longitud,    setLongitud,
      nombreLocal, setNombreLocal
    }}>
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error('useCamera debe usarse dentro de <CameraProvider>');
  return ctx;
};