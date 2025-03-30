import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const setupNotificationChannels = async () => {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("critical-alerts", {
      name: "Critical Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF0000",
      sound: true,
      enableVibrate: true,
      showBadge: true,
    })

    await Notifications.setNotificationChannelAsync("standard-alerts", {
      name: "Standard Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: true,
      enableVibrate: true,
      showBadge: true,
    })

    await Notifications.setNotificationChannelAsync("info-alerts", {
      name: "Informational Alerts",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: true,
      enableVibrate: false,
      showBadge: true,
    })

    await Notifications.setNotificationChannelAsync("background", {
      name: "Background Alerts",
      importance: Notifications.AndroidImportance.LOW,
      sound: false,
      enableVibrate: false,
      showBadge: false,
    })
  }
}

export const requestNotificationPermissions = async () => {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus

      if (existingStatus !== "granted") {
        try {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        } catch (error) {
          console.log("Error requesting notification permissions:", error)
          return false
        }
      }

      try {
        await AsyncStorage.setItem("notificationPermission", finalStatus)
      } catch (error) {
        console.log("Error storing notification permission status:", error)
      }

      if (finalStatus !== "granted") {
        return false
      }

      if (Platform.OS === "android") {
        try {
          await setupNotificationChannels()
        } catch (error) {
          console.log("Error setting up notification channels:", error)
        }
      }

      return true
    }
  } catch (error) {
    console.log("Error in requestNotificationPermissions:", error)
  }

  return false
}

export const sendNotification = async (title, body, data, severity = "medium") => {
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

export const sendBackgroundNotification = async (title, body) => {
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

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

export const handleNotificationResponse = (response, navigationRef) => {
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

