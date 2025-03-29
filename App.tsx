"use client"

import { useEffect, useState } from "react"
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { StatusBar } from "expo-status-bar"
import { SafeAreaProvider } from "react-native-safe-area-context"
import * as SplashScreen from "expo-splash-screen"
import * as Notifications from "expo-notifications"
import { View, Text, AppState, Platform } from "react-native"
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
import { PreferencesProvider, usePreferences } from "./context/PreferencesContext"
import { TranslationProvider } from "./context/TranslationContext"

SplashScreen.preventAutoHideAsync()
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})
const BACKGROUND_FETCH_TASK = "background-fetch-task"

if (!TaskManager.isTaskDefined(BACKGROUND_FETCH_TASK)) {
  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      // console.log("[Background Fetch] Task executed")

      return BackgroundFetch.BackgroundFetchResult.NewData
    } catch (error) {
      // console.log("[Background Fetch] Error:", error)
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
function CustomHeader({ title, theme }) {
  return (
    <View
      style={{
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D32F2F",
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          color: "#fff",
          fontSize: 20,
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {title}
      </Text>
    </View>
  )
}

function AppNavigator() {
  const { preferences } = usePreferences()
  const theme = preferences.theme === "dark" ? DarkTheme : DefaultTheme
  const appState = useState(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        // console.log("App has come to the foreground")
      } else if (nextAppState.match(/inactive|background/)) {
        // console.log("App has gone to the background")
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Stack.Navigator initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreenComponent} options={{ headerShown: false }} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: () => <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>T-Alert/Jnx03</Text>,
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: "#D32F2F",
            },
            headerTintColor: "#fff",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="AlertDetails"
          component={AlertDetailsScreen}
          options={{
            headerTitle: () => <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Alert Details</Text>,
            headerTitleAlign: "center",
            headerStyle: {
              backgroundColor: "#D32F2F",
            },
            headerTintColor: "#fff",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerTitle: () => <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Settings</Text>,
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
            headerTitle: () => <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Alert History</Text>,
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
            headerTitle: () => <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Test Alerts</Text>,
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
  )
}

export default function App() {
  const [appReady, setAppReady] = useState(false)

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
            <AppNavigator />
          </DisasterProvider>
        </TranslationProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  )
}

