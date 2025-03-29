import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useDisasterContext } from "../context/DisasterContext"
import { useNavigation } from "@react-navigation/native"

export default function NotificationHistoryScreen() {
  const { notificationHistory, clearNotificationHistory } = useDisasterContext()
  const navigation = useNavigation<any>()

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

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
      default:
        return <Ionicons name="warning" size={24} color="#FFC107" />
    }
  }

  const handleClearHistory = () => {
    Alert.alert("Clear History", "Are you sure you want to clear all notification history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: clearNotificationHistory,
      },
    ])
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.alertItem} onPress={() => navigation.navigate("AlertDetails", { disaster: item })}>
      <View style={styles.alertIconContainer}>{renderAlertIcon(item.type)}</View>
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertLocation}>{item.location}</Text>
        <Text style={styles.alertTime}>{formatDate(item.timestamp)}</Text>
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
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alert History</Text>
        {notificationHistory.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory}>
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {notificationHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={50} color="#9e9e9e" />
          <Text style={styles.emptyText}>No alert history</Text>
          <Text style={styles.emptySubtext}>When you receive alerts, they will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={notificationHistory}
          renderItem={renderItem}
          keyExtractor={(item, index) => `history-${index}`}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  clearButton: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    padding: 15,
  },
  alertItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
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
    color: "#757575",
    marginBottom: 3,
  },
  alertTime: {
    fontSize: 12,
    color: "#9e9e9e",
  },
  alertMeta: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontSize: 18,
    color: "#757575",
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9e9e9e",
    marginTop: 5,
    textAlign: "center",
  },
})

