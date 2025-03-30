"use client"

import { useEffect, useState, useRef } from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as SplashScreen from "expo-splash-screen"
import * as Notifications from "expo-notifications"
import { View, Text, Platform } from "react-native"
import * as TaskManager from "expo-task-manager"
import * as BackgroundFetch from "expo-background-fetch"
import HomeScreen from "./screens/HomeScreen"
import AlertDetailsScreen from "./screens/AlertDetailsScreen"
import SettingsScreen from "./screens/SettingsScreen"
import SafetyChecklistScreen from "./screens/SafetyChecklistScreen"
import EmergencyContactsScreen from "./screens/EmergencyContactsScreen"
import NotificationHistoryScreen from "./screens/NotificationHistoryScreen"
import SplashScreenComponent from "./screens/SplashScreenComponent"
import TestAlertsScreen from "./screens/TestAlertsScreen"
import { DisasterProvider } from "./context/DisasterContext"
import { PreferencesProvider } from "./context/PreferencesContext"
import { TranslationProvider } from "./context/TranslationContext"
import { setupNotificationChannels, requestNotificationPermissions } from "./utils/notificationHelper"

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

const BACKGROUND_FETCH_TASK = "background-fetch-task"

if (!TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK)) {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      console.log("[Background Fetch] Task executed")
      return BackgroundFetch.BackgroundFetchResult.NewData
    } catch (error) {
      console.log("[Background Fetch] Error:", error)
      return BackgroundFetch.BackgroundFetchResult.Failed
    }
  })
}

type RootStackParamList = {
  Splash: undefined
  Home: undefined
  AlertDetails: { disaster: any }
  Settings: undefined
  SafetyChecklist: undefined
  EmergencyContacts: undefined
  NotificationHistory: undefined
  TestAlerts: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

declare var ErrorUtils: any

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const navigationRef = useRef(null)
  useEffect(() => {
    try {
      setupNotificationChannels()
      requestNotificationPermissions().catch((err) => console.log("Notification permission error:", err))
      const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          const data = response.notification.request.content.data

          if (data && navigationRef.current) {
            if (data.alertId) {
              navigationRef.current.navigate("AlertDetails", { disasterId: data.alertId })
            } else if (data.alertType) {
              navigationRef.current.navigate("Home")
            } else if (data.screen) {
              navigationRef.current.navigate(data.screen)
            }
          }
        } catch (error) {
          console.log("Error handling notification response:", error)
        }
      })

      // Clean up
      return () => {
        Notifications.removeNotificationSubscription(responseListener)
      }
    } catch (error) {
      console.log("Error setting up notifications:", error)
    }
  }, [])

  useEffect(() => {
    const errorHandler = (error) => {
      console.log("Global error caught:", error)
      return true 
    }

    if (typeof ErrorUtils !== "undefined") {
      const originalGlobalHandler = ErrorUtils.getGlobalHandler()
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error)
        originalGlobalHandler(error, isFatal)
      })
    }
  }, [])

  useEffect(() => {
    const registerBackgroundFetch = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 15 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true,
        })
        console.log("Background fetch registered")
      } catch (err) {
        console.log("Background fetch registration failed:", err)
      }
    }

    const hideSplash = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await SplashScreen.hideAsync()
      setAppReady(true)

      if (Platform.OS !== "web") {
        registerBackgroundFetch()
      }
    }

    hideSplash()
  }, [])

  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <TranslationProvider>
          <DisasterProvider>
            <NavigationContainer
              ref={navigationRef}
              theme={DefaultTheme}
              onReady={() => {
                console.log("Navigation container is ready")
              }}
            >
              <StatusBar style="light" />
              <Stack.Navigator initialRouteName="Splash">
                <Stack.Screen name="Splash" component={SplashScreenComponent} options={{ headerShown: false }} />
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{
                    headerTitle: () => (
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>T-Alert</Text>
                        <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginLeft: 4 }}>/Jnx03</Text>
                      </View>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                      elevation: 0, 
                      shadowOpacity: 0, 
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="AlertDetails"
                  component={AlertDetailsScreen}
                  options={{
                    headerTitle: () => (
                      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Alert Details</Text>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="Settings"
                  component={SettingsScreen}
                  options={{
                    headerTitle: () => (
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Settings</Text>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="SafetyChecklist"
                  component={SafetyChecklistScreen}
                  options={{
                    headerTitle: () => (
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Safety Checklists</Text>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="EmergencyContacts"
                  component={EmergencyContactsScreen}
                  options={{
                    headerTitle: () => (
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Emergency Contacts</Text>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="NotificationHistory"
                  component={NotificationHistoryScreen}
                  options={{
                    headerTitle: () => (
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Alert History</Text>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
                <Stack.Screen
                  name="TestAlerts"
                  component={TestAlertsScreen}
                  options={{
                    headerTitle: () => (
                      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Test Alerts</Text>
                    ),
                    headerTitleAlign: "center",
                    headerStyle: {
                      backgroundColor: "#D32F2F",
                    },
                    headerTintColor: "#fff",
                    headerShadowVisible: false,
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </DisasterProvider>
        </TranslationProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  )
}

