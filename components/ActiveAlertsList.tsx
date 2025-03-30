"use client"

import { useEffect, useState, useCallback, memo } from "react"
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Animated, RefreshControl } from "react-native"
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

const AlertItem = memo(({ item, onAlertPress, preferences, renderAlertIcon, formatTimeAgo }) => {
  const [fadeAnim] = useState(new Animated.Value(0))

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()
  }, [])

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[
          styles.alertItem,
          item.isRead ? styles.readAlert : null,
          item.isTest ? styles.testAlert : null,
          preferences.theme === "dark" ? styles.darkAlertItem : styles.lightAlertItem,
        ]}
        onPress={() => onAlertPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.alertIconContainer}>{renderAlertIcon(item.type)}</View>
        <View style={styles.alertContent}>
          <Text style={[styles.alertTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
            {item.isTest && <Text style={styles.testBadge}>TEST </Text>}
            {item.title}
          </Text>
          <Text
            style={[styles.alertLocation, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}
            numberOfLines={1}
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
})

export default function ActiveAlertsList({
  disasters,
  loading,
  onAlertPress,
  onRefresh,
  refreshing,
}: ActiveAlertsListProps) {
  const { preferences } = usePreferences()

  const renderAlertIcon = useCallback((type) => {
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
  }, [])

  const formatTimeAgo = useCallback((timestamp) => {
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
  }, [])

  const renderItem = useCallback(
    ({ item }) => (
      <AlertItem
        item={item}
        onAlertPress={onAlertPress}
        preferences={preferences}
        renderAlertIcon={renderAlertIcon}
        formatTimeAgo={formatTimeAgo}
      />
    ),
    [onAlertPress, preferences, renderAlertIcon, formatTimeAgo],
  )

  const getItemLayout = useCallback(
    (_, index) => ({
      length: 80,
      offset: 80 * index,
      index,
    }),
    [],
  )

  const keyExtractor = useCallback((item) => item.id, [])

  const EmptyComponent = useCallback(
    () => (
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
    ),
    [preferences.theme],
  )

  return (
    <View style={styles.container}>
      {disasters.length === 0 ? (
        <EmptyComponent />
      ) : (
        <FlatList
          data={disasters}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#D32F2F"]}
              tintColor={preferences.theme === "dark" ? "#f0f0f0" : "#D32F2F"}
            />
          }
          getItemLayout={getItemLayout}
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 10,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginBottom: 10,
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
    marginBottom: 4,
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
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
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
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
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

