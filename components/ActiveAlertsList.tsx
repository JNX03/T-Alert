"use client"

import { useEffect, useState } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Disaster } from "../context/DisasterContext"
import { usePreferences } from "../context/PreferencesContext"

type ActiveAlertsListProps = {
  disasters: Disaster[]
  loading: boolean
  onAlertPress: (disaster: Disaster) => void
  onRefresh: () => void
  refreshing: boolean
}

export default function ActiveAlertsList({
  disasters,
  loading,
  onAlertPress,
  onRefresh,
  refreshing,
}: ActiveAlertsListProps) {
  const { preferences } = usePreferences()
  const [animations, setAnimations] = useState<Animated.Value[]>([])

  useEffect(() => {
    const newAnimations = disasters.map(() => new Animated.Value(0))
    setAnimations(newAnimations)
    const animationSequence = newAnimations.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true,
      })
    })

    Animated.stagger(50, animationSequence).start()
  }, [disasters])

  const renderAlertIcon = (type) => {
    switch (type.toLowerCase()) {
      case "earthquake":
        return <Ionicons name="earth" size={24} color="#D32F2F" />
      case "flood":
        return <Ionicons name="water" size={24} color="#2196F3" />
      case "storm":
      case "hurricane":
      case "typhoon":
        return <Ionicons name="thunderstorm" size={24} color="#FF9800" />
      case "tsunami":
        return <Ionicons name="water" size={24} color="#0D47A1" />
      case "volcano":
        return <Ionicons name="flame" size={24} color="#BF360C" />
      case "wildfire":
        return <Ionicons name="flame" size={24} color="#FF5722" />
      case "landslide":
        return <Ionicons name="trending-down" size={24} color="#795548" />
      case "drought":
        return <Ionicons name="sunny" size={24} color="#FFC107" />
      default:
        return <Ionicons name="warning" size={24} color="#FFC107" />
    }
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const alertTime = new Date(timestamp)
    const diffInSeconds = Math.floor((now - alertTime) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds}s ago`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`
    } else {
      return `${Math.floor(diffInSeconds / 86400)}d ago`
    }
  }

  const renderItem = ({ item, index }) => {
    const animValue = animations[index]
    if (!animValue) {
      return (
        <TouchableOpacity
          style={[
            styles.alertItem,
            item.isRead ? styles.readAlert : null,
            item.isTest ? styles.testAlert : null,
            preferences.theme === "dark" ? styles.darkAlertItem : styles.lightAlertItem,
          ]}
          onPress={() => onAlertPress(item)}
        >
          <View style={styles.alertIconContainer}>{renderAlertIcon(item.type)}</View>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {item.isTest && <Text style={styles.testBadge}>TEST </Text>}
              {item.title}
            </Text>
            <Text
              style={[styles.alertLocation, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}
            >
              {item.location}
            </Text>
          </View>
          <View style={styles.alertMeta}>
            <View
              style={[
                styles.severityIndicator,
                item.severity === "high"
                  ? styles.highSeverity
                  : item.severity === "medium"
                    ? styles.mediumSeverity
                    : styles.lowSeverity,
              ]}
            />
            <Text style={[styles.alertTime, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    return (
      <Animated.View
        style={{
          opacity: animValue,
          transform: [
            {
              translateY: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[
            styles.alertItem,
            item.isRead ? styles.readAlert : null,
            item.isTest ? styles.testAlert : null,
            preferences.theme === "dark" ? styles.darkAlertItem : styles.lightAlertItem,
          ]}
          onPress={() => onAlertPress(item)}
        >
          <View style={styles.alertIconContainer}>{renderAlertIcon(item.type)}</View>
          <View style={styles.alertContent}>
            <Text style={[styles.alertTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {item.isTest && <Text style={styles.testBadge}>TEST </Text>}
              {item.title}
            </Text>
            <Text
              style={[styles.alertLocation, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}
            >
              {item.location}
            </Text>
          </View>
          <View style={styles.alertMeta}>
            <View
              style={[
                styles.severityIndicator,
                item.severity === "high"
                  ? styles.highSeverity
                  : item.severity === "medium"
                    ? styles.mediumSeverity
                    : styles.lowSeverity,
              ]}
            />
            <Text style={[styles.alertTime, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              {formatTimeAgo(item.timestamp)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, preferences.theme === "dark" ? styles.darkHeader : styles.lightHeader]}>
        <Text style={[styles.title, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          Active Alerts
        </Text>
        {loading && <ActivityIndicator size="small" color="#D32F2F" />}
      </View>

      {disasters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="checkmark-circle-outline"
            size={50}
            color={preferences.theme === "dark" ? "#4CAF50" : "#4CAF50"}
          />
          <Text style={[styles.emptyText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
            No active alerts in your area
          </Text>
          <Text style={[styles.emptySubtext, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
            Pull down to refresh
          </Text>
        </View>
      ) : (
        <FlatList
          data={disasters}
          renderItem={renderItem}
          keyExtractor={(item, index) => `alert-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#D32F2F"]}
              tintColor={preferences.theme === "dark" ? "#f0f0f0" : "#D32F2F"}
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  lightHeader: {
    borderBottomColor: "#f0f0f0",
  },
  darkHeader: {
    borderBottomColor: "#333",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  lightText: {
    color: "#333",
  },
  darkText: {
    color: "#f0f0f0",
  },
  lightSubtext: {
    color: "#757575",
  },
  darkSubtext: {
    color: "#aaaaaa",
  },
  listContent: {
    padding: 10,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderRadius: 8,
  },
  lightAlertItem: {
    backgroundColor: "#fff",
    borderBottomColor: "#f0f0f0",
  },
  darkAlertItem: {
    backgroundColor: "#2a2a2a",
    borderBottomColor: "#333",
  },
  readAlert: {
    opacity: 0.8,
  },
  testAlert: {
    borderLeftWidth: 4,
    borderLeftColor: "#9C27B0",
  },
  testBadge: {
    color: "#9C27B0",
    fontWeight: "bold",
  },
  alertIconContainer: {
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 3,
  },
  alertLocation: {
    fontSize: 14,
  },
  alertMeta: {
    alignItems: "flex-end",
  },
  alertTime: {
    fontSize: 12,
    marginTop: 4,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 5,
  },
  highSeverity: {
    backgroundColor: "#D32F2F",
  },
  mediumSeverity: {
    backgroundColor: "#FF9800",
  },
  lowSeverity: {
    backgroundColor: "#FFC107",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
})

