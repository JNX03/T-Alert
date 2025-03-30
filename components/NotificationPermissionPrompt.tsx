"use client"

import { useState, useEffect } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Modal } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Notifications from "expo-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { requestNotificationPermissions } from "../utils/notificationHelper"

type NotificationPermissionPromptProps = {
  theme: "light" | "dark"
}

const NotificationPermissionPrompt = ({ theme }: NotificationPermissionPromptProps) => {
  const [visible, setVisible] = useState(false)
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null)
  const [hasPrompted, setHasPrompted] = useState(false)

  useEffect(() => {
    checkPermissionStatus()
  }, [])

  const checkPermissionStatus = async () => {
    try {
      const hasPromptedBefore = await AsyncStorage.getItem("notificationPrompted")

      if (hasPromptedBefore === "true") {
        setHasPrompted(true)
      }

      const { status } = await Notifications.getPermissionsAsync()
      setPermissionStatus(status)

      if (status !== "granted" && hasPromptedBefore !== "true") {
        setVisible(true)
      }
    } catch (error) {
      console.error("Error checking notification permission:", error)
    }
  }

  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermissions()
      setPermissionStatus(granted ? "granted" : "denied")
      setVisible(false)

      await AsyncStorage.setItem("notificationPrompted", "true")
      setHasPrompted(true)
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  const handleDismiss = async () => {
    setVisible(false)
    await AsyncStorage.setItem("notificationPrompted", "true")
    setHasPrompted(true)
  }

  if (permissionStatus === "granted" || (hasPrompted && !visible)) {
    return null
  }

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={handleDismiss}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, theme === "dark" ? styles.darkModalContent : styles.lightModalContent]}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={40} color="#D32F2F" />
          </View>

          <Text style={[styles.title, theme === "dark" ? styles.darkText : styles.lightText]}>
            Stay Informed About Disasters
          </Text>

          <Text style={[styles.description, theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
            Enable notifications to receive critical alerts about disasters in your area. These alerts could save lives
            during emergencies.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleDismiss}>
              <Text style={styles.secondaryButtonText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleRequestPermission}>
              <Text style={styles.primaryButtonText}>Enable Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lightModalContent: {
    backgroundColor: "#fff",
  },
  darkModalContent: {
    backgroundColor: "#1e1e1e",
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(211, 47, 47, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  lightText: {
    color: "#212121",
  },
  darkText: {
    color: "#f0f0f0",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  lightSubtext: {
    color: "#616161",
  },
  darkSubtext: {
    color: "#aaaaaa",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#D32F2F",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#757575",
    fontSize: 16,
  },
})

export default NotificationPermissionPrompt

