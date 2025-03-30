"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  PanResponder,
  ActivityIndicator,
  AppState,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from "react-native-maps"
import Geolocation from "@react-native-community/geolocation"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { useDisasterContext } from "../context/DisasterContext"
import { usePreferences } from "../context/PreferencesContext"
import ActiveAlertsList from "../components/ActiveAlertsList"
import * as TaskManager from "expo-task-manager"
import * as BackgroundFetch from "expo-background-fetch"
import * as Notifications from "expo-notifications"
import { useTranslation } from "../context/TranslationContext"
import NotificationPermissionPrompt from "../components/NotificationPermissionPrompt"

const BACKGROUND_FETCH_TASK = "background-fetch-task"
const SCREEN_HEIGHT = Dimensions.get("window").height

const MIN_PANEL_HEIGHT = 100
const MID_PANEL_HEIGHT = SCREEN_HEIGHT * 0.4
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.7

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[Background Fetch] Task executed")
    // Replace this:
    // const locationStr = await Location.getLastKnownPositionAsync()

    // With this:
    const locationStr = await new Promise((resolve) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => resolve(null),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
      )
    })
    if (!locationStr) return BackgroundFetch.BackgroundFetchResult.NoData
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (error) {
    console.log("[Background Fetch] Error:", error)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export default function HomeScreen() {
  const [location, setLocation] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const mapRef = useRef(null)
  const navigation = useNavigation()
  const {
    disasters,
    loading,
    fetchDisasters: fetchDisastersContext,
    setDisasters,
    setLastRefetchTime,
    lastFetchTime,
  } = useDisasterContext()
  const { preferences } = usePreferences()
  const { t } = useTranslation()
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState(null)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const [nextRefreshIn, setNextRefreshIn] = useState(60)
  const refreshTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const appState = useRef(AppState.currentState)
  const [notificationPermission, setNotificationPermission] = useState(null)
  const [locationPermission, setLocationPermission] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const panelHeightAnim = useRef(new Animated.Value(MID_PANEL_HEIGHT)).current

  const animatePanelTo = useCallback(
    (height, duration = 300) => {
      Animated.timing(panelHeightAnim, {
        toValue: height,
        duration,
        useNativeDriver: false,
      }).start()
    },
    [panelHeightAnim],
  )

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          const newHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, MID_PANEL_HEIGHT - gestureState.dy))
          panelHeightAnim.setValue(newHeight)
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.vy > 0.5 || panelHeightAnim._value < (MIN_PANEL_HEIGHT + MID_PANEL_HEIGHT) / 2) {
            animatePanelTo(MIN_PANEL_HEIGHT)
          } else if (gestureState.vy < -0.5 || panelHeightAnim._value > (MID_PANEL_HEIGHT + MAX_PANEL_HEIGHT) / 2) {
            animatePanelTo(MAX_PANEL_HEIGHT)
          } else {
            animatePanelTo(MID_PANEL_HEIGHT)
          }
        },
      }),
    [animatePanelTo],
  )

  const checkPermissions = async () => {
    try {
      const notifStatus = (await Notifications.getPermissionsAsync()).status
      setNotificationPermission(notifStatus)

      // Replace this:
      // const locStatus = (await Location.getForegroundPermissionsAsync()).status

      // With this:
      const requestLocationPermission = async () => {
        return new Promise((resolve) => {
          if (Platform.OS === "ios") {
            Geolocation.requestAuthorization("whenInUse", (status) => {
              resolve(status === "granted" ? "granted" : "denied")
            })
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
              title: "Location Permission",
              message: "This app needs access to your location to show relevant disaster alerts.",
              buttonNeutral: "Ask Me Later",
              buttonNegative: "Cancel",
              buttonPositive: "OK",
            })
              .then((status) => {
                resolve(status === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied")
              })
              .catch(() => resolve("denied"))
          }
        })
      }
      const locStatus = await requestLocationPermission()
      setLocationPermission(locStatus)
    } catch (error) {
      console.log("Error checking permissions:", error)
    }
  }

  useEffect(() => {
    const registerBackgroundFetch = async () => {
      if (preferences.backgroundAlerts) {
        try {
          await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 15 * 60,
            stopOnTerminate: false,
            startOnBoot: true,
          })
        } catch (err) {
          console.log("Background fetch registration failed:", err)
        }
      } else {
        try {
          await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK)
        } catch (err) {
          console.log("Background fetch unregistration failed:", err)
        }
      }
    }

    registerBackgroundFetch()
  }, [preferences.backgroundAlerts])

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        refreshData()
        checkPermissions()
        startCountdownTimer()
      } else if (appState.current === "active" && nextAppState.match(/inactive|background/)) {
        if (preferences.backgroundAlerts) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: t("background_notification_title"),
              body: t("background_notification_body"),
              data: { type: "background" },
            },
            trigger: null,
          })
        }
      }
      appState.current = nextAppState
    })

    return () => {
      subscription.remove()
    }
  }, [location, preferences.backgroundAlerts, t])

  const checkLocationServices = async () => {
    try {
      if (Platform.OS === "android") {
        return new Promise((resolve) => {
          Geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000, maximumAge: 10000 },
          )
        })
      } else {
        return new Promise((resolve) => {
          Geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 },
          )
        })
      }
    } catch (error) {
      console.log("Error checking location services:", error)
      return false
    }
  }

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    const getLocationAndFetchData = async () => {
      try {
        const locationServicesEnabled = await checkLocationServices()
        if (!locationServicesEnabled) {
          console.log("Location services are disabled")
          setErrorMsg(t("location_services_disabled"))

          const defaultLocation = {
            coords: {
              latitude: 13.7563,
              longitude: 100.5018,
              accuracy: 0,
              altitude: 0,
              altitudeAccuracy: 0,
              heading: 0,
              speed: 0,
            },
            timestamp: Date.now(),
          }

          setLocation(defaultLocation)
          fetchDisasters(defaultLocation.coords.latitude, defaultLocation.coords.longitude)
          setLastRefreshTime(new Date())
          startCountdownTimer()
          return
        }

        const getLocationAndFetchData = async () => {
          try {
            const defaultLocation = {
              coords: {
                latitude: 13.7563,
                longitude: 100.5018,
                accuracy: 0,
                altitude: 0,
                altitudeAccuracy: 0,
                heading: 0,
                speed: 0,
              },
              timestamp: Date.now(),
            }

            const requestLocationPermission = async () => {
              return new Promise((resolve) => {
                if (Platform.OS === "ios") {
                  Geolocation.requestAuthorization("whenInUse", (status) => {
                    resolve(status === "granted" ? "granted" : "denied")
                  })
                } else {
                  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
                    title: "Location Permission",
                    message: "This app needs access to your location to show relevant disaster alerts.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK",
                  })
                    .then((status) => {
                      resolve(status === PermissionsAndroid.RESULTS.GRANTED ? "granted" : "denied")
                    })
                    .catch(() => resolve("denied"))
                }
              })
            }
            const status = await requestLocationPermission()
            setLocationPermission(status)

            if (status !== "granted") {
              console.log("Location permission denied")
              setErrorMsg(t("location_permission_denied"))

              setLocation(defaultLocation)
              fetchDisasters(defaultLocation.coords.latitude, defaultLocation.coords.longitude)
              setLastRefreshTime(new Date())
              startCountdownTimer()
              return
            }

            Geolocation.setRNConfiguration({
              skipPermissionRequests: false,
              authorizationLevel: "whenInUse",
              enableBackgroundLocationUpdates: false,
            })

            try {
              const locationPromise = new Promise((resolve, reject) => {
                Geolocation.getCurrentPosition(
                  (position) => resolve(position),
                  (error) => {
                    console.log("Error in getCurrentPosition:", error)
                    reject(error)
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                    forceRequestLocation: true,
                  },
                )
              }).catch((error) => {
                console.log("Error in getCurrentPosition:", error)
                return null
              })

              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 10000))

              const location = await Promise.race([locationPromise, timeoutPromise])

              if (location) {
                console.log("Location obtained:", location)
                setLocation(location)
                fetchDisasters(location.coords.latitude, location.coords.longitude)
              } else {
                console.log("Location request timed out or failed, using default location")
                setLocation(defaultLocation)
                fetchDisasters(defaultLocation.coords.latitude, defaultLocation.coords.longitude)
                setErrorMsg(t("using_default_location"))
              }

              const notifStatus = await Notifications.getPermissionsAsync().catch(() => ({ status: "denied" }))
              setNotificationPermission(notifStatus.status)

              setLastRefreshTime(new Date())
              startCountdownTimer()
            } catch (error) {
              console.log("Error getting current location:", error)

              setLocation(defaultLocation)
              fetchDisasters(defaultLocation.coords.latitude, defaultLocation.coords.longitude)
              setLastRefreshTime(new Date())
              startCountdownTimer()
              setErrorMsg(t("using_default_location"))
            }
          } catch (error) {
            console.log("Error in getLocationAndFetchData:", error)

            const defaultLocation = {
              coords: {
                latitude: 13.7563,
                longitude: 100.5018,
                accuracy: 0,
                altitude: 0,
                altitudeAccuracy: 0,
                heading: 0,
                speed: 0,
              },
              timestamp: Date.now(),
            }

            setLocation(defaultLocation)
            fetchDisasters(defaultLocation.coords.latitude, defaultLocation.coords.longitude)
            setLastRefreshTime(new Date())
            startCountdownTimer()
            setErrorMsg(t("location_error"))
          }
        }
      } catch (error) {
        // Error handling...
      }
    }

    getLocationAndFetchData()

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current)
      }
    }
  }, [t])

  const startCountdownTimer = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
    }

    setNextRefreshIn(60)

    countdownTimerRef.current = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          if (preferences.autoRefresh && location) {
            refreshData()
          }
          return 60
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    if (preferences.autoRefresh && location) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }

      refreshTimerRef.current = setInterval(() => {
        refreshData()
      }, 60000)
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [preferences.autoRefresh, location])

  useFocusEffect(
    useCallback(() => {
      if (location) {
        refreshData()
        checkPermissions()
        startCountdownTimer()
      }

      return () => {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
        }
      }
    }, [location]),
  )

  const refreshData = async () => {
    if (location && !isManualRefreshing) {
      setIsManualRefreshing(true)
      try {
        await fetchDisasters(location.coords.latitude, location.coords.longitude)
        setLastRefreshTime(new Date())
        startCountdownTimer()
      } catch (error) {
        console.log("Error refreshing data:", error)
      } finally {
        setIsManualRefreshing(false)
      }
    }
  }

  const onRefresh = useCallback(async () => {
    if (location) {
      setRefreshing(true)
      try {
        await fetchDisasters(location.coords.latitude, location.coords.longitude)
        setLastRefreshTime(new Date())
        startCountdownTimer()
      } catch (error) {
        console.log("Error refreshing data:", error)
      } finally {
        setRefreshing(false)
      }
    }
  }, [location])

  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return t("never")

    const now = new Date()
    const diffMs = now.getTime() - lastRefreshTime.getTime()
    const diffSec = Math.floor(diffMs / 1000)

    if (diffSec < 60) {
      return `${diffSec}${t("seconds_ago")}`
    } else if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)}${t("minutes_ago")}`
    } else {
      return lastRefreshTime.toLocaleTimeString()
    }
  }

  const togglePanel = () => {
    if (panelHeightAnim._value > MID_PANEL_HEIGHT - 10) {
      animatePanelTo(MIN_PANEL_HEIGHT)
    } else {
      animatePanelTo(MAX_PANEL_HEIGHT)
    }
  }

  const goToSettings = () => {
    navigation.navigate("Settings")
  }

  const goToSafetyChecklist = () => {
    navigation.navigate("SafetyChecklist")
  }

  const goToEmergencyContacts = () => {
    navigation.navigate("EmergencyContacts")
  }

  const goToNotificationHistory = () => {
    navigation.navigate("NotificationHistory")
  }

  const goToTestAlerts = () => {
    navigation.navigate("TestAlerts")
  }

  const mapHeight = useMemo(() => {
    return Animated.subtract(SCREEN_HEIGHT, panelHeightAnim)
  }, [panelHeightAnim])

  const fetchDisasters = async (latitude: number, longitude: number) => {
    const now = Date.now()
    if (now - lastFetchTime < 5 * 60 * 1000 && disasters.length > 0 && !isLoading) {
      return
    }

    setIsLoading(true)

    try {
      if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
        console.log("Invalid coordinates, using default location")
        latitude = 13.7563
        longitude = 100.5018
      }

      await fetchDisastersContext(latitude, longitude)
      setLastRefreshTime(new Date())
    } catch (error) {
      console.error("Error fetching disaster data:", error)
      if (disasters.length === 0) {
        const defaultAlerts = getDefaultAlerts()
        setDisasters(defaultAlerts)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getDefaultAlerts = () => {
    const now = Date.now()
    return [
      {
        id: `default-earthquake-${now}`,
        title: "M5.2 Earthquake",
        description: "Moderate earthquake detected in central Thailand.",
        type: "earthquake",
        severity: "medium",
        latitude: 13.7563,
        longitude: 100.5018,
        location: "Central Thailand",
        timestamp: now - 3600000,
        source: "Default Alert",
        recommendations: "Be alert for aftershocks and check structures for damage.",
        magnitude: 5.2,
        depth: 10,
        isRead: false,
      },
      {
        id: `default-flood-${now}`,
        title: "Flood Warning",
        description: "Heavy rainfall causing flooding in northern Thailand.",
        type: "flood",
        severity: "high",
        latitude: 18.7883,
        longitude: 98.9853,
        location: "Northern Thailand",
        timestamp: now - 7200000,
        source: "Default Alert",
        recommendations: "Move to higher ground and follow evacuation instructions.",
        isRead: false,
      },
    ]
  }

  return (
    <View style={[styles.container, preferences.theme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <View style={styles.permissionContainer}>
            <View style={styles.permissionIndicator}>
              <Ionicons
                name="notifications"
                size={16}
                color={notificationPermission === "granted" ? "#4CAF50" : "#F44336"}
              />
              <Text style={styles.permissionText}>
                {notificationPermission === "granted" ? t("notif") : t("no_notif")}
              </Text>
            </View>
            <View style={styles.permissionIndicator}>
              <Ionicons name="location" size={16} color={locationPermission === "granted" ? "#4CAF50" : "#F44336"} />
              <Text style={styles.permissionText}>{locationPermission === "granted" ? t("loc") : t("no_loc")}</Text>
            </View>
          </View>

          <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}>
              {location ? (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  onError={(error) => {
                    console.log("Map error:", error)
                    setErrorMsg(t("map_error"))
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title={t("your_location")}
                    pinColor="#2196F3"
                  />

                  <Circle
                    center={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    radius={preferences.alertRadius * 1000}
                    strokeWidth={1}
                    strokeColor="rgba(33, 150, 243, 0.5)"
                    fillColor="rgba(33, 150, 243, 0.1)"
                  />

                  {disasters.map((disaster, index) => (
                    <Marker
                      key={index}
                      coordinate={{
                        latitude: disaster.latitude,
                        longitude: disaster.longitude,
                      }}
                      title={disaster.title}
                      description={disaster.description}
                      pinColor={
                        disaster.severity === "high"
                          ? "#D32F2F"
                          : disaster.severity === "medium"
                            ? "#FF9800"
                            : "#FFC107"
                      }
                      onPress={() => navigation.navigate("AlertDetails", { disaster })}
                    />
                  ))}
                </MapView>
              ) : (
                <View style={styles.loadingContainer}>
                  <Text style={preferences.theme === "dark" ? styles.darkText : styles.lightText}>
                    {t("getting_location")}
                  </Text>
                </View>
              )}
            </Animated.View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={goToSettings}>
                <Ionicons name="settings-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={goToNotificationHistory}>
                <Ionicons name="notifications-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={goToTestAlerts}>
                <Ionicons name="flask-outline" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.refreshButton} onPress={refreshData} disabled={isManualRefreshing}>
              {isManualRefreshing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="refresh" size={24} color="#fff" />
              )}
            </TouchableOpacity>

            <View style={styles.refreshInfoContainer}>
              <Text style={styles.refreshInfoText}>
                {t("last_updated")}: {formatLastRefreshTime()}
                {preferences.autoRefresh ? ` • ${t("auto_refresh_on")} ${nextRefreshIn}s` : ""}
              </Text>
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.panelContainer,
              preferences.theme === "dark" ? styles.darkPanelContainer : styles.lightPanelContainer,
              { height: panelHeightAnim },
            ]}
          >
            <TouchableOpacity style={styles.dragHandle} onPress={togglePanel} activeOpacity={0.7}>
              <View style={styles.dragIndicator} />
            </TouchableOpacity>

            <View {...panResponder.panHandlers} style={styles.panelHeader}>
              <Text style={[styles.panelTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
                {t("active_alerts")}
              </Text>
              {isLoading && <ActivityIndicator size="small" color="#D32F2F" />}
            </View>

            <View style={styles.alertsContainer}>
              <ActiveAlertsList
                disasters={disasters}
                loading={isLoading}
                onAlertPress={(disaster) => navigation.navigate("AlertDetails", { disaster })}
                onRefresh={onRefresh}
                refreshing={refreshing}
              />
            </View>
          </Animated.View>
        </View>
      )}
      <NotificationPermissionPrompt theme={preferences.theme} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: "#f5f5f5",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  mapContainer: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lightText: {
    color: "#333",
  },
  darkText: {
    color: "#f0f0f0",
  },
  buttonContainer: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "column",
    gap: 8,
  },
  iconButton: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  refreshButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#D32F2F",
    borderRadius: 30,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  refreshInfoContainer: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshInfoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
  },
  panelContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    overflow: "hidden",
  },
  lightPanelContainer: {
    backgroundColor: "#fff",
  },
  darkPanelContainer: {
    backgroundColor: "#1e1e1e",
  },
  dragHandle: {
    height: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ccc",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  alertsContainer: {
    flex: 1,
  },
  permissionContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 10,
    flexDirection: "row",
    gap: 6,
  },
  permissionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  permissionText: {
    fontSize: 10,
    marginLeft: 2,
    color: "#333",
    fontWeight: "500",
  },
})

