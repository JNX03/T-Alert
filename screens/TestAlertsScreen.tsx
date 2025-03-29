"use client"

import { useState } from "react"
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useDisasterContext } from "../context/DisasterContext"
import { usePreferences } from "../context/PreferencesContext"

export default function TestAlertsScreen() {
  const { triggerTestAlert } = useDisasterContext()
  const { preferences } = usePreferences()
  const [loading, setLoading] = useState<string | null>(null)

  const handleTestAlert = async (type: string) => {
    setLoading(type)
    await triggerTestAlert(type)
    setLoading(null)
  }

  const testAlertTypes = [
    {
      id: "earthquake",
      title: "Test Earthquake Alert",
      description: "Send a test earthquake notification to your device",
      icon: "earth",
      color: "#D32F2F",
    },
    {
      id: "flood",
      title: "Test Flood Alert",
      description: "Send a test flood notification to your device",
      icon: "water",
      color: "#2196F3",
    },
    {
      id: "tsunami",
      title: "Test Tsunami Alert",
      description: "Send a test tsunami notification to your device",
      icon: "water",
      color: "#0D47A1",
    },
    {
      id: "volcano",
      title: "Test Volcano Alert",
      description: "Send a test volcanic eruption notification to your device",
      icon: "flame",
      color: "#BF360C",
    },
    {
      id: "storm",
      title: "Test Storm Alert",
      description: "Send a test severe storm notification to your device",
      icon: "thunderstorm",
      color: "#FF9800",
    },
  ]

  return (
    <ScrollView style={[styles.container, preferences.theme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.header, preferences.theme === "dark" ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.headerTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          Test Alert System
        </Text>
        <Text
          style={[styles.headerDescription, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}
        >
          Use these options to test how alerts appear in the app and as notifications. Test alerts will be marked as
          tests and will appear at the top of your alerts list.
        </Text>
      </View>

      <View style={styles.alertsContainer}>
        {testAlertTypes.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertButton,
              preferences.theme === "dark" ? styles.darkAlertButton : styles.lightAlertButton,
            ]}
            onPress={() => handleTestAlert(alert.id)}
            disabled={loading !== null}
          >
            <View style={[styles.iconContainer, { backgroundColor: alert.color }]}>
              <Ionicons name={alert.icon} size={24} color="white" />
            </View>
            <View style={styles.alertInfo}>
              <Text style={[styles.alertTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
                {alert.title}
              </Text>
              <Text
                style={[
                  styles.alertDescription,
                  preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
                ]}
              >
                {alert.description}
              </Text>
            </View>
            {loading === alert.id ? (
              <ActivityIndicator size="small" color="#D32F2F" />
            ) : (
              <Ionicons
                name="notifications-outline"
                size={20}
                color={preferences.theme === "dark" ? "#aaa" : "#757575"}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.infoBox, preferences.theme === "dark" ? styles.darkInfoBox : styles.lightInfoBox]}>
        <Ionicons name="information-circle" size={24} color="#2196F3" style={styles.infoIcon} />
        <Text style={[styles.infoText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          Test alerts are for demonstration purposes only and do not represent real emergency situations. They will be
          automatically removed when you restart the app. Don't use it for plank other people na .-.
        </Text>
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    borderBottomWidth: 1,
  },
  lightHeader: {
    backgroundColor: "#fff",
    borderBottomColor: "#e0e0e0",
  },
  darkHeader: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#333",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  lightText: {
    color: "#333",
  },
  darkText: {
    color: "#f0f0f0",
  },
  headerDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  lightSubtext: {
    color: "#757575",
  },
  darkSubtext: {
    color: "#aaaaaa",
  },
  alertsContainer: {
    padding: 15,
  },
  alertButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  lightAlertButton: {
    backgroundColor: "#fff",
  },
  darkAlertButton: {
    backgroundColor: "#1e1e1e",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  lightInfoBox: {
    backgroundColor: "#E3F2FD",
  },
  darkInfoBox: {
    backgroundColor: "#0d2c4d",
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
})

