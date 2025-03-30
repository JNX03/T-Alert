import { memo } from "react"
import { StyleSheet, View, Text, TouchableOpacity, Animated } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import type { Disaster } from "../context/DisasterContext"

type AlertCardProps = {
  disaster: Disaster
  onPress: (disaster: Disaster) => void
  animValue?: Animated.Value
  theme: "light" | "dark"
}

const getAlertIcon = (type: string) => {
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

const formatTimeAgo = (timestamp: number) => {
  const now = new Date()
  const alertTime = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - alertTime.getTime()) / 1000)

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

const AlertCard = memo(({ disaster, onPress, animValue, theme }: AlertCardProps) => {
  const CardContent = () => (
    <TouchableOpacity
      style={[
        styles.alertItem,
        disaster.isRead ? styles.readAlert : null,
        disaster.isTest ? styles.testAlert : null,
        theme === "dark" ? styles.darkAlertItem : styles.lightAlertItem,
      ]}
      onPress={() => onPress(disaster)}
      accessibilityLabel={`${disaster.title} alert, severity ${disaster.severity}, location ${disaster.location}`}
      accessibilityRole="button"
    >
      <View style={styles.alertIconContainer}>{getAlertIcon(disaster.type)}</View>
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, theme === "dark" ? styles.darkText : styles.lightText]}>
          {disaster.isTest && <Text style={styles.testBadge}>TEST </Text>}
          {disaster.title}
        </Text>
        <Text
          style={[styles.alertLocation, theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}
          numberOfLines={1}
        >
          {disaster.location}
        </Text>
      </View>
      <View style={styles.alertMeta}>
        <View
          style={[
            styles.severityIndicator,
            disaster.severity === "high"
              ? styles.highSeverity
              : disaster.severity === "medium"
                ? styles.mediumSeverity
                : styles.lowSeverity,
          ]}
        />
        <Text style={[styles.alertTime, theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
          {formatTimeAgo(disaster.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (animValue) {
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
        <CardContent />
      </Animated.View>
    )
  }

  return <CardContent />
})

const styles = StyleSheet.create({
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    fontWeight: "600",
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
})

export default AlertCard

