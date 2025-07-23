import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Colors from '../../constant/Colors';
import { FontFamily, FontSize } from '../../constant/Typography';
import Header from '../../components/Header';
import { MapPinIcon, ShieldExclamationIcon, ShieldCheckIcon, PowerIcon } from "react-native-heroicons/solid";
import { useKunturStatus } from '../../hooks/useKunturStatus';
import { useUserRegistration } from '../../hooks/useUserRegistration';
import { useCamera } from '../../hooks/useCamera';

export default function ControlScreen() {
    const router = useRouter();
    const primaryColor = Colors.primary[500];
    const secondaryColor = Colors.secondary[500];
    const { status, loading, error, activateKuntur, deactivateKuntur } = useKunturStatus();
    const { user, loading: userLoading, isUserRegistered } = useUserRegistration();
    const { cameraIp, latitud, longitud, nombreLocal, ubicacion } = useCamera();

    const [alertaLoading, setAlertaLoading] = useState(false);
    const [alertaMensaje, setAlertaMensaje] = useState('');
    const [showPopup, setShowPopup] = useState(false);
    const popupAnim = new Animated.Value(0);

    useEffect(() => {
        if (!userLoading && !isUserRegistered()) {
            router.push('/register');
        }
    }, [userLoading, isUserRegistered, router]);

    // Animar popup
    useEffect(() => {
        if (alertaMensaje) {
            setShowPopup(true);
            Animated.timing(popupAnim, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }).start();
            setTimeout(() => {
                Animated.timing(popupAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }).start(() => {
                    setShowPopup(false);
                    setAlertaMensaje('');
                });
            }, 2200);
        }
        // eslint-disable-next-line
    }, [alertaMensaje]);

    const getStatusColors = () => {
        if (status === 'on') {
            return {
                icon: Colors.success[900],
                background: Colors.success[200],
                border: Colors.success[900]
            };
        }
        return {
            icon: Colors.danger[900],
            background: Colors.danger[200],
            border: Colors.danger[900]
        };
    };

    const statusColors = getStatusColors();

    const getStatusInfo = () => {
        if (loading) {
            return {
                text: 'Conectando...',
                icon: null,
                buttonText: 'Cargando...'
            };
        }
        if (status === 'on') {
            return {
                text: 'Kuntur Activado',
                icon: <ShieldCheckIcon size={120} color={statusColors.icon} />,
                buttonText: 'Desactivar Kuntur'
            };
        }
        return {
            text: 'Kuntur Apagado',
            icon: <ShieldExclamationIcon size={120} color={statusColors.icon} />,
            buttonText: 'Activar Kuntur'
        };
    };

    const statusInfo = getStatusInfo();

    const handleButtonPress = async () => {
        if (loading) return;
        if (!isUserRegistered()) {
            router.push('/register');
            return;
        }
        try {
            if (status === 'on') {
                await deactivateKuntur();
            } else {
                await activateKuntur();
            }
        } catch (error) {
            console.error('Error in handleButtonPress:', error);
        }
    };

    // Botón alerta manual discreto (FAB)
    const activarAlertaManual = async () => {
        setAlertaMensaje('');
        setAlertaLoading(true);
        try {
            const body = {
                usuario_id: user?._id || user?.usuario_id,
                nombre_local: nombreLocal || user?.nombre_local,
                ip_camara: cameraIp || user?.ip_camara,
                ubicacion: ubicacion || user?.ubicacion,
                latitud: latitud || user?.latitud,
                longitud: longitud || user?.longitud
            };
            const res = await fetch('http://192.168.1.34:5000/alerta_manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (data.status === 'ok') {
                setAlertaMensaje('🚨 Alerta simulada enviada');
            } else {
                setAlertaMensaje('No se pudo activar la alerta.');
            }
        } catch (err) {
            setAlertaMensaje('Error activando alerta manual');
        }
        setAlertaLoading(false);
    };

    // Mostrar loading mientras se verifica el usuario
    if (userLoading) {
        return (
            <LinearGradient
                colors={[secondaryColor, primaryColor]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.background}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.neutro} />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            </LinearGradient>
        );
    }

    if (!isUserRegistered()) {
        return null;
    }

    return (
        <LinearGradient
            colors={[secondaryColor, primaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.background}
        >
            <View style={styles.container}>
                <Header />

                <View style={styles.content}>
                    <View style={styles.location}>
                        <MapPinIcon size={16} color={Colors.neutro} />
                        <Text style={styles.locationText}>
                            {ubicacion || user?.ubicacion || 'Ubicación no disponible'}
                        </Text>
                    </View>

                    <View style={styles.notificationsContainer}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.control}>
                        <View style={styles.controlContent}>
                            <View style={[styles.iconContainer, {
                                backgroundColor: statusColors.background,
                                borderColor: statusColors.border
                            }]}>
                                {loading ? (
                                    <ActivityIndicator size="large" color={statusColors.icon} />
                                ) : (
                                    statusInfo.icon
                                )}
                            </View>
                            <Text style={[styles.statusText, { color: statusColors.icon }]}>
                                {statusInfo.text}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.button, {
                                backgroundColor: statusColors.background,
                                borderColor: statusColors.border
                            }]}
                            onPress={handleButtonPress}
                            disabled={loading}
                        >
                            <PowerIcon size={16} color={statusColors.icon} />
                            <Text style={[styles.buttonText, { color: statusColors.icon }]}>
                                {statusInfo.buttonText}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAB ALERTA */}
                <TouchableOpacity
                    style={styles.fabButton}
                    onPress={activarAlertaManual}
                    disabled={alertaLoading}
                    activeOpacity={0.7}
                >
                    {alertaLoading
                        ? <ActivityIndicator color={Colors.neutro} />
                        : <ShieldExclamationIcon size={32} color={Colors.neutro} />
                    }
                </TouchableOpacity>

                {/* POPUP ALERTA */}
                {showPopup && (
                    <Animated.View style={[
                        styles.popupAlerta,
                        {
                            opacity: popupAnim,
                            transform: [{ translateY: popupAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-30, 20]
                            }) }]
                        }
                    ]}>
                        <Text style={styles.popupAlertaText}>{alertaMensaje}</Text>
                    </Animated.View>
                )}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { flex: 1, marginTop: 64, marginHorizontal: 16, justifyContent: 'flex-start' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { color: Colors.neutro, fontFamily: FontFamily.regular, fontSize: FontSize.body },
    content: { marginTop: 52, justifyContent: 'center', alignItems: 'center', width: '100%', flex: 1 },
    location: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10, width: '100%', paddingHorizontal: 20 },
    locationText: { color: Colors.neutro, fontFamily: FontFamily.regular, fontSize: FontSize.small, textAlign: 'center', flex: 1 },
    notificationsContainer: { width: '100%', gap: 8, marginBottom: 10 },
    control: { alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0, 0, 0, 0.25)', width: '100%', flex: 1, maxHeight: '75%', borderRadius: 16, paddingTop: 40, paddingBottom: 30 },
    controlContent: { alignItems: 'center', gap: 20, flex: 1, justifyContent: 'center' },
    iconContainer: { justifyContent: 'center', alignItems: 'center', width: 175, height: 175, borderRadius: 1000, borderWidth: 2 },
    statusText: { textAlign: 'center', width: '80%', fontFamily: FontFamily.regular, fontSize: FontSize.body },
    buttonText: { fontFamily: FontFamily.regular, fontSize: FontSize.body },
    button: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 32, borderWidth: 2 },
    errorContainer: { backgroundColor: Colors.danger[200], padding: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.danger[900], marginHorizontal: 20, width: '90%', alignSelf: 'center' },
    errorText: { color: Colors.danger[900], fontFamily: FontFamily.regular, fontSize: FontSize.small, textAlign: 'center' },
    fabButton: {
        position: 'absolute',
        right: 24, // Cambia a "left: 24" para esquina izquierda
        bottom: 34,
        backgroundColor: Colors.danger[600],
        width: 60, height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 8,
        zIndex: 100,
    },
    popupAlerta: {
        position: 'absolute',
        top: 30,
        left: 40,
        right: 40,
        backgroundColor: Colors.danger[900],
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 5,
        elevation: 20,
    },
    popupAlertaText: {
        color: Colors.neutro,
        fontFamily: FontFamily.bold,
        fontSize: FontSize.small + 1,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
});
