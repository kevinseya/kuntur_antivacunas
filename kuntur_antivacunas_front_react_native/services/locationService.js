// services/locationService.js
import * as Location from 'expo-location';

export const locationService = {
    // Obtener ubicación actual del usuario
    async getCurrentLocation() {
        try {
            // Solicitar permisos de ubicación
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                throw new Error('Permiso de ubicación denegado');
            }
            
            // Obtener ubicación actual
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy,
            };
        } catch (error) {
            console.error('Error al obtener ubicación:', error);
            throw new Error('No se pudo obtener la ubicación actual');
        }
    },

    // Geocodificación reversa mejorada - convertir coordenadas a dirección
    async reverseGeocode(latitude, longitude) {
        try {
            const results = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });
            
            if (results.length > 0) {
                const address = results[0];
                const formattedAddress = this.formatAddress(address);
                
                // Verificar que la dirección formateada sea válida
                if (formattedAddress && formattedAddress !== 'Dirección no disponible') {
                    return formattedAddress;
                }
            }
            
            // Si no se puede obtener dirección, devolver formato consistente
            return `Ubicación aproximada: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        } catch (error) {
            console.error('Error en geocodificación reversa:', error);
            // Devolver ubicación aproximada en lugar de solo coordenadas
            return `Ubicación aproximada: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }
    },

    // Geocodificación - convertir dirección a coordenadas
    async geocode(address) {
        try {
            const results = await Location.geocodeAsync(address);
            
            if (results.length > 0) {
                return {
                    latitude: results[0].latitude,
                    longitude: results[0].longitude,
                };
            }
            throw new Error('No se encontraron coordenadas para la dirección');
        } catch (error) {
            console.error('Error en geocodificación:', error);
            throw new Error('Error al buscar la dirección');
        }
    },

    // Formatear dirección mejorado desde el resultado de geocodificación
    formatAddress(addressObject) {
        if (!addressObject) return 'Dirección no disponible';
        
        const parts = [];
        
        // Construcción jerárquica de la dirección
        if (addressObject.streetNumber) {
            parts.push(addressObject.streetNumber);
        }
        
        if (addressObject.street) {
            parts.push(addressObject.street);
        }
        
        if (addressObject.district) {
            parts.push(addressObject.district);
        }
        
        if (addressObject.subregion) {
            parts.push(addressObject.subregion);
        }
        
        if (addressObject.city) {
            parts.push(addressObject.city);
        }
        
        if (addressObject.region) {
            parts.push(addressObject.region);
        }
        
        if (addressObject.country) {
            parts.push(addressObject.country);
        }
        
        // Filtrar partes vacías y unir
        const filteredParts = parts.filter(part => part && part.trim());
        
        if (filteredParts.length === 0) {
            return 'Dirección no disponible';
        }
        
        return filteredParts.join(', ');
    },

    // Obtener ubicación completa (coordenadas + dirección)
    async getCompleteLocation() {
        try {
            const coordinates = await this.getCurrentLocation();
            const address = await this.reverseGeocode(coordinates.latitude, coordinates.longitude);
            
            return {
                ...coordinates,
                address: address,
                formattedLocation: address // Para mantener compatibilidad
            };
        } catch (error) {
            console.error('Error obteniendo ubicación completa:', error);
            throw error;
        }
    },

    // Validar si un string es solo coordenadas
    isCoordinateString(locationString) {
        const coordinatePattern = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
        return coordinatePattern.test(locationString);
    },

    // Convertir coordenadas string a objeto
    parseCoordinateString(coordinateString) {
        try {
            const [lat, lng] = coordinateString.split(',').map(coord => parseFloat(coord.trim()));
            return { latitude: lat, longitude: lng };
        } catch (error) {
            console.error('Error parseando coordenadas:', error);
            return null;
        }
    },

    // Procesar ubicación mixta (puede ser dirección o coordenadas)
    async processLocation(locationString) {
        if (!locationString) return null;
        
        // Si es un string de coordenadas, convertir a dirección
        if (this.isCoordinateString(locationString)) {
            const coords = this.parseCoordinateString(locationString);
            if (coords) {
                const address = await this.reverseGeocode(coords.latitude, coords.longitude);
                return {
                    ...coords,
                    address: address,
                    wasCoordinateString: true
                };
            }
        }
        
        // Si ya es una dirección, intentar obtener coordenadas
        try {
            const coords = await this.geocode(locationString);
            return {
                ...coords,
                address: locationString,
                wasCoordinateString: false
            };
        } catch (error) {
            // Si no se pueden obtener coordenadas, devolver solo la dirección
            return {
                latitude: null,
                longitude: null,
                address: locationString,
                wasCoordinateString: false
            };
        }
    },

    // Calcular distancia entre dos puntos
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        
        return distance; // Distancia en km
    },

    // Convertir grados a radianes
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    },

    // Validar coordenadas
    validateCoordinates(latitude, longitude) {
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return false;
        }
        
        if (latitude < -90 || latitude > 90) {
            return false;
        }
        
        if (longitude < -180 || longitude > 180) {
            return false;
        }
        
        return true;
    },

    // Obtener región del mapa para las coordenadas
    getMapRegion(latitude, longitude, latitudeDelta = 0.01, longitudeDelta = 0.01) {
        return {
            latitude,
            longitude,
            latitudeDelta,
            longitudeDelta,
        };
    },
};