"use client"

import { useEffect, useState, useRef } from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as SplashScreen from "expo-splash-screen"
import * as Notifications from "expo-notifications"
import { View, Text, Platform, LogBox, Alert, AppState, TouchableOpacity } from "react-native"
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
// Import the notification helper
import { setupNotificationChannels, requestNotificationPermissions } from "./utils/notificationHelper"
// Add error boundary to the App component
import ErrorBoundary from "react-native-error-boundary"
import { __DEV__ } from "./config"

// Ignore specific harmless warnings
LogBox.ignoreLogs([
  "ViewPropTypes will be removed",
  "ColorPropType will be removed",
  "[react-native-gesture-handler]",
  "Sending `onAnimatedValueUpdate`",
])

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync()

// Set up notification handler with better configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
})

// Define background task name
const BACKGROUND_FETCH_TASK = "background-fetch-task"

// Register background task if not already registered
if (!TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK)) {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      // Fetch data in the background
      console.log("[Background Fetch] Task executed")

      // Your background fetch logic here
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

// Global error handler
const errorHandler = (error: Error, isFatal: boolean) => {
  if (isFatal) {
    Alert.alert(
      "Unexpected Error Occurred",
      `
      Error: ${error.message}
      
      We need to restart the app.
      `,
      [
        {
          text: "Restart",
          onPress: () => {
            // Here you might want to restart the app if possible
            console.log("App needs to restart due to fatal error")
          },
        },
      ],
    )
  } else {
    console.log("Non-fatal error occurred:", error)
  }
}

// Set up the global error handler for production
if (!__DEV__) {
  // Use the standard React Native error handler
  const ErrorUtils = require("react-native").ErrorUtils
  ErrorUtils.setGlobalHandler(errorHandler)
}

export default function App() {
  const [appReady, setAppReady] = useState(false)
  const navigationRef = useRef<any>(null)
  const appState = useRef(AppState.currentState)

  // Set up notification channels and request permissions
  useEffect(() => {
    setupNotificationChannels()
    requestNotificationPermissions()

    // Set up notification response handler
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data

      // Handle notification tap based on data
      if (data.alertId && navigationRef.current) {
        // Navigate to alert details
        navigationRef.current.navigate("AlertDetails", { disasterId: data.alertId })
      } else if (data.alertType && navigationRef.current) {
        // Handle group notifications
        navigationRef.current.navigate("Home")
      } else if (data.screen && navigationRef.current) {
        // Navigate to specific screen
        navigationRef.current.navigate(data.screen)
      }
    })

    // App state change listener to detect when app comes to foreground
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("App has come to the foreground!")
        // You could refresh data here if needed
      }
      appState.current = nextAppState
    })

    // Clean up
    return () => {
      Notifications.removeNotificationSubscription(responseListener)
      subscription.remove()
    }
  }, [])

  useEffect(() => {
    // Register background fetch
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

    // Hide splash screen after a delay
    const hideSplash = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000))
        await SplashScreen.hideAsync()
        setAppReady(true)

        // Register background tasks after app is ready
        if (Platform.OS !== "web") {
          registerBackgroundFetch()
        }
      } catch (error) {
        console.log("Error hiding splash screen:", error)
        // Still set app as ready even if there's an error
        setAppReady(true)
      }
    }

    hideSplash()
  }, [])

  // Add this function inside the App component
  const handleError = (error: Error, stackTrace: string) => {
    console.log("Global error handler:", error, stackTrace)
    // You could log this to a service like Sentry or Firebase Crashlytics
  }

  if (!appReady) {
    return null // Still loading
  }

  // Modify the return statement to include the ErrorBoundary
  return (
    <SafeAreaProvider>
      <ErrorBoundary
        onError={handleError}
        FallbackComponent={({ error }: { error: Error }) => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Something went wrong</Text>
            <Text style={{ textAlign: "center", marginBottom: 20 }}>
              The app encountered an unexpected error. Please restart the app.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: "#D32F2F", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
              onPress={() => {
                // In a real app, you might want to use RN Restart or similar
                console.log("Attempting to recover from error")
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold" }}>Restart App</Text>
            </TouchableOpacity>
          </View>
        )}
      >
        <PreferencesProvider>
          <TranslationProvider>
            <DisasterProvider>
              <NavigationContainer
                ref={navigationRef}
                theme={DefaultTheme}
                onReady={() => {
                  console.log("Navigation container is ready")
                }}
                fallback={<Text>Loading...</Text>}
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
                        shadowOpacity: 0, // Remove shadow on iOS
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
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}

