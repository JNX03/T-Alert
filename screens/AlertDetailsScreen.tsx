import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import type { RouteProp } from "@react-navigation/native"
import type { Disaster } from "../context/DisasterContext"

type AlertDetailsScreenProps = {
  route: RouteProp<{ params: { disaster: Disaster } }, "params">
}

export default function AlertDetailsScreen({ route }: AlertDetailsScreenProps) {
  const { disaster } = route.params

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  const openSourceLink = async () => {
    if (disaster.sourceUrl) {
      await Linking.openURL(disaster.sourceUrl)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.severityBadge,
            disaster.severity === "high"
              ? styles.highSeverity
              : disaster.severity === "medium"
                ? styles.mediumSeverity
                : styles.lowSeverity,
          ]}
        >
          <Text style={styles.severityText}>{disaster.severity.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{disaster.title}</Text>
        <Text style={styles.timestamp}>{formatDate(disaster.timestamp)}</Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: disaster.latitude,
            longitude: disaster.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          scrollEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: disaster.latitude,
              longitude: disaster.longitude,
            }}
            title={disaster.title}
            pinColor={disaster.severity === "high" ? "#e53935" : disaster.severity === "medium" ? "#FB8C00" : "#FFD600"}
          />
        </MapView>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{disaster.description}</Text>

        {disaster.recommendations && (
          <>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text style={styles.description}>{disaster.recommendations}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{disaster.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{disaster.location}</Text>
        </View>
        {disaster.magnitude && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Magnitude:</Text>
            <Text style={styles.detailValue}>{disaster.magnitude}</Text>
          </View>
        )}
        {disaster.depth && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Depth:</Text>
            <Text style={styles.detailValue}>{disaster.depth} km</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Source</Text>
        <View style={styles.sourceContainer}>
          <Text style={styles.sourceText}>{disaster.source}</Text>
          {disaster.sourceUrl && (
            <TouchableOpacity style={styles.sourceButton} onPress={openSourceLink}>
              <Text style={styles.sourceButtonText}>View Source</Text>
              <Ionicons name="open-outline" size={16} color="#2196F3" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 14,
    color: "#757575",
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 10,
  },
  highSeverity: {
    backgroundColor: "#e53935",
  },
  mediumSeverity: {
    backgroundColor: "#FB8C00",
  },
  lowSeverity: {
    backgroundColor: "#FFD600",
  },
  severityText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  mapContainer: {
    height: 200,
    width: "100%",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  detailsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: "bold",
    width: 100,
  },
  detailValue: {
    fontSize: 16,
    flex: 1,
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
  },
  sourceText: {
    fontSize: 16,
    color: "#555",
  },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceButtonText: {
    color: "#2196F3",
    marginRight: 5,
  },
})

