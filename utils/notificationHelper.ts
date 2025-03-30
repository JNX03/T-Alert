import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Configure notification categories/channels for Android
export const setupNotificationChannels = async () => {
  if (Platform.OS === "android") {
    // High priority channel for critical alerts
    await Notifications.setNotificationChannelAsync("critical-alerts", {
      name: "Critical Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF0000",
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    })

    // Medium priority channel for standard alerts
    await Notifications.setNotificationChannelAsync("standard-alerts", {
      name: "Standard Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      enableVibrate: true,
      showBadge: true,
    })

    // Low priority channel for informational alerts
    await Notifications.setNotificationChannelAsync("info-alerts", {
      name: "Informational Alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: "default",
      enableVibrate: false,
      showBadge: true,
    })

    // Background channel for persistent notifications
    await Notifications.setNotificationChannelAsync("background", {
      name: "Background Alerts",
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      enableVibrate: false,
      showBadge: false,
    })
  }
}

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    // Store permission status
    await AsyncStorage.setItem("notificationPermission", finalStatus)

    if (finalStatus !== "granted") {
      return false
    }

    // Set up notification channels for Android
    if (Platform.OS === "android") {
      await setupNotificationChannels()
    }

    return true
  }

  return false
}

// Send a notification with the appropriate channel based on severity
export const sendNotification = async (
  title: string,
  body: string,
  data: any,
  severity: "high" | "medium" | "low" = "medium"
) => {
  let channelId = "standard-alerts"

  if (Platform.OS === "android") {
    if (severity === "high") {
      channelId = "critical-alerts"
    } else if (severity === "low") {
      channelId = "info-alerts"
    }
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      ...(Platform.OS === "android" && { channelId }),
    },
    trigger: null,
  })
}

// Send a background notification
export const sendBackgroundNotification = async (title: string, body: string) => {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: "background" },
      ...(Platform.OS === "android" && { channelId: "background" }),
    },
    trigger: null,
  })
}

// Cancel all notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

// Handle notification response with navigation ref
export const handleNotificationResponse = (response: any, navigationRef: any) => {
  if (!navigationRef || !navigationRef.current) {
    console.log("Navigation ref is not available")
    return
  }

  const data = response.notification.request.content.data

  if (data.alertId) {
    navigationRef.current.navigate("AlertDetails", { disasterId: data.alertId })
  } else if (data.alertType) {
    navigationRef.current.navigate("Home")
  } else if (data.screen) {
    navigationRef.current.navigate(data.screen)
  }
}

