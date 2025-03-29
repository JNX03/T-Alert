"use client"

import { useEffect, useState, useRef, useCallback } from "react"
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
} from "react-native"
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from "react-native-maps"
import * as Location from "expo-location"
import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { useDisasterContext } from "../context/DisasterContext"
import { usePreferences } from "../context/PreferencesContext"
import ActiveAlertsList from "../components/ActiveAlertsList"
import * as TaskManager from "expo-task-manager"
import * as BackgroundFetch from "expo-background-fetch"
import * as Notifications from "expo-notifications"
import { useTranslation } from "../context/TranslationContext"

const BACKGROUND_FETCH_TASK = "background-fetch-task"
const SCREEN_HEIGHT = Dimensions.get("window").height
const MIN_PANEL_HEIGHT = 100
const MID_PANEL_HEIGHT = SCREEN_HEIGHT * 0.35
const MAX_PANEL_HEIGHT = SCREEN_HEIGHT * 0.7

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("[Background Fetch] Task executed")
    const locationStr = await Location.getLastKnownPositionAsync()
    if (!locationStr) return BackgroundFetch.BackgroundFetchResult.NoData
    return BackgroundFetch.BackgroundFetchResult.NewData
  } catch (error) {
    console.log("[Background Fetch] Error:", error)
    return BackgroundFetch.BackgroundFetchResult.Failed
  }
})

export default function HomeScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const mapRef = useRef<MapView | null>(null)
  const navigation = useNavigation<any>()
  const { disasters, fetchDisasters, loading } = useDisasterContext()
  const { preferences } = usePreferences()
  const { t } = useTranslation()
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const appState = useRef(AppState.currentState)
  const [notificationPermission, setNotificationPermission] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<string | null>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const [panelState, setPanelState] = useState("mid") // "min", "mid", or "max"
  const [panelHeight, setPanelHeight] = useState(MID_PANEL_HEIGHT)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = Math.max(MIN_PANEL_HEIGHT, Math.min(MAX_PANEL_HEIGHT, panelHeight - gestureState.dy))
        setPanelHeight(newHeight)
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.vy > 0.5 || panelHeight < (MIN_PANEL_HEIGHT + MID_PANEL_HEIGHT) / 2) {
          setPanelHeight(MIN_PANEL_HEIGHT)
          setPanelState("min")
        } else if (gestureState.vy < -0.5 || panelHeight > (MID_PANEL_HEIGHT + MAX_PANEL_HEIGHT) / 2) {
          setPanelHeight(MAX_PANEL_HEIGHT)
          setPanelState("max")
        } else {
          setPanelHeight(MID_PANEL_HEIGHT)
          setPanelState("mid")
        }
      },
    }),
  ).current

  const checkPermissions = async () => {
    const notifStatus = (await Notifications.getPermissionsAsync()).status
    setNotificationPermission(notifStatus)

    const locStatus = (await Location.getForegroundPermissionsAsync()).status
    setLocationPermission(locStatus)
  }

  useEffect(() => {
    const registerBackgroundFetch = async () => {
      if (preferences.backgroundAlerts) {
        try {
          await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 15 * 60, // 15 minutes
            stopOnTerminate: false,
            startOnBoot: true,
          })
        //   console.log("Background fetch registered")
        } catch (err) {
        //   console.log("Background fetch registration failed:", err)
        }
      } else {
        try {
          await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK)
        //   console.log("Background fetch unregistered")
        } catch (err) {
        //   console.log("Background fetch unregistration failed:", err)
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

    ;(async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      setLocationPermission(status)

      if (status !== "granted") {
        setErrorMsg(t("location_permission_denied"))
        return
      }

      const location = await Location.getCurrentPositionAsync({})
      setLocation(location)

      const notifStatus = (await Notifications.getPermissionsAsync()).status
      setNotificationPermission(notifStatus)

      if (location) {
        fetchDisasters(location.coords.latitude, location.coords.longitude)
        setLastRefreshTime(new Date())
      }
    })()
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [t])

  useEffect(() => {
    if (preferences.autoRefresh && location) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }

      refreshTimerRef.current = setInterval(() => {
        refreshData()
      }, 60000) // 60 seconds
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
      }

      return () => {
      }
    }, [location]),
  )

  const refreshData = async () => {
    if (location && !isManualRefreshing) {
      setIsManualRefreshing(true)
      await fetchDisasters(location.coords.latitude, location.coords.longitude)
      setLastRefreshTime(new Date())
      setIsManualRefreshing(false)
    }
  }

  const onRefresh = useCallback(async () => {
    if (location) {
      setRefreshing(true)
      await fetchDisasters(location.coords.latitude, location.coords.longitude)
      setLastRefreshTime(new Date())
      setRefreshing(false)
    }
  }, [location, fetchDisasters])

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
    if (panelState === "max") {
      setPanelHeight(MID_PANEL_HEIGHT)
      setPanelState("mid")
    } else {
      setPanelHeight(MAX_PANEL_HEIGHT)
      setPanelState("max")
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

  const mapHeight = SCREEN_HEIGHT - panelHeight

  return (
    <View style={[styles.container, preferences.theme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      {errorMsg ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          {/* Permission indicators */}
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

          <Animated.View
            style={[
              styles.mapContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                height: mapHeight,
              },
            ]}
          >
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
              >
                {/* User location marker */}
                <Marker
                  coordinate={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  title={t("your_location")}
                  pinColor="#2196F3"
                />

                {/* Alert radius circle */}
                <Circle
                  center={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                  }}
                  radius={preferences.alertRadius * 1000} // Convert km to meters
                  strokeWidth={1}
                  strokeColor="rgba(33, 150, 243, 0.5)"
                  fillColor="rgba(33, 150, 243, 0.1)"
                />

                {/* Disaster markers */}
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
                      disaster.severity === "high" ? "#D32F2F" : disaster.severity === "medium" ? "#FF9800" : "#FFC107"
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={goToSettings}>
                <Ionicons name="settings-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={goToSafetyChecklist}>
                <Ionicons name="list-outline" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={goToEmergencyContacts}>
                <Ionicons name="call-outline" size={24} color="#333" />
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
                {preferences.autoRefresh ? ` • ${t("auto_refresh_on")}` : ""}
              </Text>
            </View>
          </Animated.View>

          {/* Draggable panel with improved stability */}
          <View
            style={[
              styles.panelContainer,
              preferences.theme === "dark" ? styles.darkPanelContainer : styles.lightPanelContainer,
              { height: panelHeight },
            ]}
          >
            {/* Drag handle */}
            <View {...panResponder.panHandlers} style={styles.dragHandle}>
              <View style={styles.dragIndicator} />
            </View>

            {/* Panel content */}
            <View style={styles.alertsContainer}>
              <ActiveAlertsList
                disasters={disasters}
                loading={loading}
                onAlertPress={(disaster) => navigation.navigate("AlertDetails", { disaster })}
                onRefresh={onRefresh}
                refreshing={refreshing}
              />
            </View>
          </View>
        </View>
      )}
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
  },
  iconButton: {
    backgroundColor: "white",
    borderRadius: 30,
    padding: 10,
    marginBottom: 10,
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refreshInfoText: {
    color: "#fff",
    fontSize: 12,
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
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
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
  alertsContainer: {
    flex: 1,
  },
  permissionContainer: {
    position: "absolute",
    top: 10,
    right: 70,
    zIndex: 10,
    flexDirection: "row",
  },
  permissionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 5,
  },
  permissionText: {
    fontSize: 10,
    marginLeft: 2,
    color: "#333",
  },
})


//Jnx03 :D