"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import * as Notifications from "expo-notifications"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { usePreferences } from "./PreferencesContext"
import { isPointWithinRadius, isPointInThailand } from "../utils/locationUtils"
import { Alert } from "react-native"

export type Disaster = {
  id: string
  title: string
  description: string
  type: string
  severity: "low" | "medium" | "high"
  latitude: number
  longitude: number
  location: string
  timestamp: number
  source: string
  sourceUrl?: string
  recommendations?: string
  magnitude?: number
  depth?: number
  isRead?: boolean
  isTest?: boolean
}

type DisasterContextType = {
  disasters: Disaster[]
  loading: boolean
  fetchDisasters: (latitude: number, longitude: number) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  notificationHistory: Disaster[]
  clearNotificationHistory: () => Promise<void>
  triggerTestAlert: (type: string) => Promise<void>
}

const DisasterContext = createContext<DisasterContextType | undefined>(undefined)

export const useDisasterContext = () => {
  const context = useContext(DisasterContext)
  if (context === undefined) {
    throw new Error("useDisasterContext must be used within a DisasterProvider")
  }
  return context
}

export const DisasterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [notificationHistory, setNotificationHistory] = useState<Disaster[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const { preferences } = usePreferences()

  useEffect(() => {
    const loadNotificationHistory = async () => {
      try {
        const history = await AsyncStorage.getItem("notificationHistory")
        if (history) {
          setNotificationHistory(JSON.parse(history))
        }
      } catch (error) {
        console.error("Error loading notification history:", error)
      }
    }

    loadNotificationHistory()
  }, [])

  const markAsRead = async (id: string) => {
    const updatedDisasters = disasters.map((disaster) =>
      disaster.id === id ? { ...disaster, isRead: true } : disaster,
    )
    setDisasters(updatedDisasters)
  }

  const clearNotificationHistory = async () => {
    try {
      await AsyncStorage.setItem("notificationHistory", JSON.stringify([]))
      setNotificationHistory([])
    } catch (error) {
      console.error("Error clearing notification history:", error)
    }
  }

  const triggerTestAlert = async (type: string) => {
    const testAlertTypes = {
      earthquake: {
        title: "TEST: M6.5 Earthquake",
        description: "This is a test earthquake alert. No actual earthquake has occurred.",
        type: "earthquake",
        severity: "high",
        recommendations: "This is a test alert. In a real earthquake: Drop, Cover, and Hold On.",
        magnitude: 6.5,
        depth: 10,
        source: "Test Alert System",
      },
      flood: {
        title: "TEST: Flood Warning",
        description: "This is a test flood alert. No actual flooding has occurred.",
        type: "flood",
        severity: "medium",
        recommendations: "This is a test alert. In a real flood: Move to higher ground immediately.",
        source: "Test Alert System",
      },
      tsunami: {
        title: "TEST: Tsunami Warning",
        description: "This is a test tsunami alert. No actual tsunami has occurred.",
        type: "tsunami",
        severity: "high",
        recommendations: "This is a test alert. In a real tsunami: Evacuate to higher ground immediately.",
        source: "Test Alert System",
      },
      volcano: {
        title: "TEST: Volcanic Eruption",
        description: "This is a test volcanic eruption alert. No actual eruption has occurred.",
        type: "volcano",
        severity: "high",
        recommendations: "This is a test alert. In a real eruption: Follow evacuation orders immediately.",
        source: "Test Alert System",
      },
      storm: {
        title: "TEST: Severe Storm",
        description: "This is a test severe storm alert. No actual storm is approaching.",
        type: "storm",
        severity: "medium",
        recommendations: "This is a test alert. In a real storm: Stay indoors and away from windows.",
        source: "Test Alert System",
      },
    }

    const alertInfo = testAlertTypes[type] || testAlertTypes.earthquake

    const testAlert: Disaster = {
      id: `test-${type}-${Date.now()}`,
      title: alertInfo.title,
      description: alertInfo.description,
      type: alertInfo.type,
      severity: alertInfo.severity as "low" | "medium" | "high",
      latitude: 13.7563, // Default to Bangkok if no location
      longitude: 100.5018,
      location: "Your Current Location (Test)",
      timestamp: Date.now(),
      source: alertInfo.source,
      recommendations: alertInfo.recommendations,
      magnitude: alertInfo.magnitude,
      depth: alertInfo.depth,
      isRead: false,
      isTest: true,
    }

    setDisasters([testAlert, ...disasters])

    const updatedHistory = [testAlert, ...notificationHistory]
    setNotificationHistory(updatedHistory)
    await AsyncStorage.setItem("notificationHistory", JSON.stringify(updatedHistory))

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🧪 ${testAlert.title}`,
          body: testAlert.description,
          data: { alertId: testAlert.id },
          sound: true,
        },
        trigger: null,
      })

      Alert.alert("Test Alert Sent", `A test ${type} alert notification has been sent to your device.`, [
        { text: "OK" },
      ])
    } catch (error) {
      console.error("Error sending notification:", error)
      Alert.alert(
        "Notification Error",
        "There was a problem sending the test notification. Please check your notification permissions.",
        [{ text: "OK" }],
      )
    }

    return
  }

  const fetchEarthquakes = async (latitude: number, longitude: number, radius = preferences.alertRadius) => {
    try {
      const endTime = new Date().toISOString()
      const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const minMagnitude = 2.5

      const response = await fetch(
        `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startTime}&endtime=${endTime}&latitude=${latitude}&longitude=${longitude}&maxradiuskm=${radius}&minmagnitude=${minMagnitude}`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch earthquake data")
      }

      const data = await response.json()

      let earthquakes = data.features.map((feature) => {
        const { properties, geometry } = feature
        const coordinates = geometry.coordinates

        let severity: "low" | "medium" | "high" = "low"
        if (properties.mag >= 6.0) {
          severity = "high"
        } else if (properties.mag >= 4.5) {
          severity = "medium"
        }

        return {
          id: feature.id,
          title: `M${properties.mag.toFixed(1)} Earthquake`,
          description: properties.place ? `Earthquake detected near ${properties.place}` : "Earthquake detected",
          type: "earthquake",
          severity,
          latitude: coordinates[1],
          longitude: coordinates[0],
          location: properties.place || "Unknown location",
          timestamp: properties.time,
          source: "USGS Earthquake Information Center",
          sourceUrl: properties.url,
          recommendations: "If indoors, drop, cover, and hold on. If outdoors, stay away from buildings.",
          magnitude: properties.mag,
          depth: coordinates[2],
          isRead: false,
        } as Disaster
      })

      if (preferences.thailandOnly) {
        earthquakes = earthquakes.filter((earthquake) => isPointInThailand(earthquake.latitude, earthquake.longitude))
      }

      return earthquakes
    } catch (error) {
      console.error("Error fetching earthquake data:", error)
      return []
    }
  }

  const fetchWeatherAlerts = async (latitude: number, longitude: number) => {
    try {
      let targetLat = latitude
      let targetLon = longitude

      if (preferences.thailandOnly && !isPointInThailand(latitude, longitude)) {
        targetLat = 13.7563
        targetLon = 100.5018
      }

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLon}&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=Asia/Bangkok`,
      )

      if (!response.ok) {
        throw new Error("Failed to fetch weather data")
      }

      const data = await response.json()
      const weatherCode = data.current_weather.weathercode
      const alerts: Disaster[] = []

      if ([95, 96, 99].includes(weatherCode)) {
        alerts.push({
          id: `weather-thunderstorm-${Date.now()}`,
          title: "Severe Thunderstorm",
          description: "Thunderstorm with possible heavy rain and lightning in your area.",
          type: "storm",
          severity: "medium",
          latitude: targetLat,
          longitude: targetLon,
          location: `Near ${data.timezone.split("/")[1].replace("_", " ")}`,
          timestamp: Date.now(),
          source: "Open-Meteo Weather Service",
          sourceUrl: "https://open-meteo.com/",
          recommendations: "Stay indoors and away from windows. Avoid using electrical appliances.",
          isRead: false,
        })
      } else if ([71, 73, 75, 77].includes(weatherCode)) {
        alerts.push({
          id: `weather-snow-${Date.now()}`,
          title: "Heavy Snow",
          description: "Heavy snowfall expected in your area.",
          type: "storm",
          severity: "medium",
          latitude: targetLat,
          longitude: targetLon,
          location: `Near ${data.timezone.split("/")[1].replace("_", " ")}`,
          timestamp: Date.now(),
          source: "Open-Meteo Weather Service",
          sourceUrl: "https://open-meteo.com/",
          recommendations: "Avoid unnecessary travel. Keep warm and check on vulnerable neighbors.",
          isRead: false,
        })
      } else if (weatherCode >= 80 && weatherCode <= 82) {
        alerts.push({
          id: `weather-rain-${Date.now()}`,
          title: "Heavy Rain",
          description: "Heavy rainfall that may cause localized flooding.",
          type: "flood",
          severity: "low",
          latitude: targetLat,
          longitude: targetLon,
          location: `Near ${data.timezone.split("/")[1].replace("_", " ")}`,
          timestamp: Date.now(),
          source: "Open-Meteo Weather Service",
          sourceUrl: "https://open-meteo.com/",
          recommendations: "Be cautious when driving and avoid flood-prone areas.",
          isRead: false,
        })
      }

      return alerts
    } catch (error) {
      console.error("Error fetching weather data:", error)
      return []
    }
  }

  const fetchPDCDisasterAlerts = async (latitude: number, longitude: number, radius = preferences.alertRadius) => {
    try {
      const now = Date.now()
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

      const mockPDCAlerts = [
        {
          id: `pdc-typhoon-${now - 1800000}`,
          title: "Typhoon Warning",
          description: "Typhoon approaching with strong winds and heavy rainfall expected.",
          type: "storm",
          severity: "high",
          latitude: 14.5995, // Philippines
          longitude: 120.9842,
          location: "Manila, Philippines",
          timestamp: now - 1800000, // 30 minutes ago
          source: "Pacific Disaster Center",
          sourceUrl: "https://www.pdc.org/",
          recommendations: "Secure loose objects, prepare emergency supplies, and follow evacuation orders if issued.",
          isRead: false,
        },
        {
          id: `pdc-volcano-${now - 3600000}`,
          title: "Volcanic Activity",
          description: "Increased volcanic activity detected with potential for eruption.",
          type: "volcano",
          severity: "medium",
          latitude: -8.2675, // Indonesia
          longitude: 115.3755,
          location: "Mount Agung, Bali, Indonesia",
          timestamp: now - 3600000, // 1 hour ago
          source: "Pacific Disaster Center",
          sourceUrl: "https://www.pdc.org/",
          recommendations: "Monitor official announcements and be prepared to evacuate if necessary.",
          isRead: false,
        },
        {
          id: `pdc-earthquake-${now - 7200000}`,
          title: "M5.8 Earthquake",
          description: "Moderate earthquake detected with potential for aftershocks.",
          type: "earthquake",
          severity: "medium",
          latitude: 35.6762, // Japan
          longitude: 139.6503,
          location: "Tokyo, Japan",
          timestamp: now - 7200000, // 2 hours ago
          source: "Pacific Disaster Center",
          sourceUrl: "https://www.pdc.org/",
          recommendations: "Be alert for aftershocks and check structures for damage.",
          magnitude: 5.8,
          depth: 10,
          isRead: false,
        },
        {
          id: `pdc-flood-${oneMonthAgo + 5 * 24 * 60 * 60 * 1000}`,
          title: "Major Flooding",
          description: "Severe flooding affecting multiple regions with displacement of populations.",
          type: "flood",
          severity: "high",
          latitude: 23.8103, // China
          longitude: 90.4125,
          location: "Yangtze River Basin, China",
          timestamp: oneMonthAgo + 5 * 24 * 60 * 60 * 1000, // 25 days ago
          source: "Pacific Disaster Center",
          sourceUrl: "https://www.pdc.org/",
          recommendations: "Follow evacuation orders and avoid flooded areas.",
          isRead: false,
        },
        {
          id: `pdc-cyclone-${oneMonthAgo + 15 * 24 * 60 * 60 * 1000}`,
          title: "Cyclone Warning",
          description: "Tropical cyclone approaching with destructive winds and storm surge.",
          type: "storm",
          severity: "high",
          latitude: 17.385, // India
          longitude: 78.4867,
          location: "Bay of Bengal, India",
          timestamp: oneMonthAgo + 15 * 24 * 60 * 60 * 1000, // 15 days ago
          source: "Pacific Disaster Center",
          sourceUrl: "https://www.pdc.org/",
          recommendations: "Evacuate coastal areas and seek shelter in sturdy buildings.",
          isRead: false,
        },
      ]

      if (preferences.thailandOnly) {
        return [] 
      }

      return mockPDCAlerts.filter((alert) =>
        isPointWithinRadius(latitude, longitude, alert.latitude, alert.longitude, radius),
      )
    } catch (error) {
      console.error("Error fetching PDC disaster data:", error)
      return []
    }
  }

  const fetchReliefWebAlerts = async (latitude: number, longitude: number) => {
    try {
      const now = Date.now()
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

      const mockReliefWebAlerts = [
        {
          id: `reliefweb-flood-${now - 86400000}`,
          title: "Severe Flooding",
          description: "Widespread flooding affecting multiple regions with displacement of populations.",
          type: "flood",
          severity: "high",
          latitude: 19.076, // Vietnam
          longitude: 105.3312,
          location: "Central Vietnam",
          timestamp: now - 86400000, // 1 day ago
          source: "ReliefWeb",
          sourceUrl: "https://reliefweb.int/",
          recommendations: "Seek higher ground and follow evacuation instructions from local authorities.",
          isRead: false,
        },
        {
          id: `reliefweb-drought-${now - 172800000}`,
          title: "Drought Warning",
          description: "Prolonged drought conditions affecting agricultural production and water supplies.",
          type: "drought",
          severity: "medium",
          latitude: 15.87, // Cambodia
          longitude: 104.78,
          location: "Northeast Cambodia",
          timestamp: now - 172800000, // 2 days ago
          source: "ReliefWeb",
          sourceUrl: "https://reliefweb.int/",
          recommendations: "Conserve water and follow guidance from local authorities.",
          isRead: false,
        },
        {
          id: `reliefweb-landslide-${oneMonthAgo + 10 * 24 * 60 * 60 * 1000}`,
          title: "Landslide Emergency",
          description: "Multiple landslides triggered by heavy rainfall have blocked roads and damaged homes.",
          type: "landslide",
          severity: "high",
          latitude: 27.7172, // Nepal
          longitude: 85.324,
          location: "Central Nepal",
          timestamp: oneMonthAgo + 10 * 24 * 60 * 60 * 1000, // 20 days ago
          source: "ReliefWeb",
          sourceUrl: "https://reliefweb.int/",
          recommendations: "Avoid hillside areas and follow evacuation orders.",
          isRead: false,
        },
        {
          id: `reliefweb-wildfire-${oneMonthAgo + 20 * 24 * 60 * 60 * 1000}`,
          title: "Wildfire Alert",
          description: "Large wildfire spreading rapidly due to dry conditions and strong winds.",
          type: "wildfire",
          severity: "medium",
          latitude: -33.8688, // Australia
          longitude: 151.2093,
          location: "New South Wales, Australia",
          timestamp: oneMonthAgo + 20 * 24 * 60 * 60 * 1000, // 10 days ago
          source: "ReliefWeb",
          sourceUrl: "https://reliefweb.int/",
          recommendations: "Follow evacuation orders and stay informed through local emergency services.",
          isRead: false,
        },
      ]

      if (preferences.thailandOnly) {
        return [] 
      }

      return mockReliefWebAlerts
    } catch (error) {
      console.error("Error fetching ReliefWeb data:", error)
      return []
    }
  }

  const fetchThailandDisasterAlerts = async (latitude: number, longitude: number) => {
    try {
      const now = Date.now()
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000

      const mockThailandAlerts = [
        {
          id: `th-flood-${now - 3600000}`,
          title: "Flood Warning",
          description: "Heavy monsoon rains have caused flooding in central Thailand.",
          type: "flood",
          severity: "medium",
          latitude: 13.7563, // Bangkok
          longitude: 100.5018,
          location: "Central Thailand",
          timestamp: now - 3600000, // 1 hour ago
          source: "Thai Meteorological Department",
          sourceUrl: "https://www.tmd.go.th/",
          recommendations: "Avoid flood-prone areas. Follow evacuation orders if issued.",
          isRead: false,
        },
        {
          id: `th-landslide-${now - 7200000}`,
          title: "Landslide Risk",
          description: "Heavy rainfall has increased the risk of landslides in northern Thailand.",
          type: "landslide",
          severity: "high",
          latitude: 18.7883, // Chiang Mai
          longitude: 98.9853,
          location: "Northern Thailand",
          timestamp: now - 7200000, // 2 hours ago
          source: "Department of Disaster Prevention and Mitigation",
          sourceUrl: "https://www.disaster.go.th/",
          recommendations: "Avoid hillside areas. Be prepared to evacuate if necessary.",
          isRead: false,
        },
        {
          id: `th-storm-${oneMonthAgo + 7 * 24 * 60 * 60 * 1000}`,
          title: "Severe Storm",
          description: "Tropical storm bringing heavy rainfall and strong winds to southern provinces.",
          type: "storm",
          severity: "medium",
          latitude: 7.8804, // Phuket
          longitude: 98.3923,
          location: "Southern Thailand",
          timestamp: oneMonthAgo + 7 * 24 * 60 * 60 * 1000, // 23 days ago
          source: "Thai Meteorological Department",
          sourceUrl: "https://www.tmd.go.th/",
          recommendations: "Secure loose objects and stay indoors during peak storm conditions.",
          isRead: false,
        },
        {
          id: `th-drought-${oneMonthAgo + 25 * 24 * 60 * 60 * 1000}`,
          title: "Drought Alert",
          description: "Water shortage affecting agricultural areas in northeastern Thailand.",
          type: "drought",
          severity: "low",
          latitude: 16.4331, // Khon Kaen
          longitude: 102.8236,
          location: "Northeastern Thailand",
          timestamp: oneMonthAgo + 25 * 24 * 60 * 60 * 1000, // 5 days ago
          source: "Department of Disaster Prevention and Mitigation",
          sourceUrl: "https://www.disaster.go.th/",
          recommendations: "Conserve water and follow local water usage restrictions.",
          isRead: false,
        },
      ]

      return mockThailandAlerts.filter((alert) =>
        isPointWithinRadius(latitude, longitude, alert.latitude, alert.longitude, preferences.alertRadius),
      )
    } catch (error) {
      console.error("Error fetching Thailand disaster data:", error)
      return []
    }
  }

  const fetchDisasters = async (latitude: number, longitude: number) => {
    const now = Date.now()
    if (now - lastFetchTime < 5 * 60 * 1000 && disasters.length > 0) {
      return
    }

    setLoading(true)

    try {
      const [earthquakes, weatherAlerts, thailandAlerts, pdcAlerts, reliefWebAlerts] = await Promise.all([
        preferences.earthquakeAlerts ? fetchEarthquakes(latitude, longitude) : [],
        preferences.weatherAlerts ? fetchWeatherAlerts(latitude, longitude) : [],
        fetchThailandDisasterAlerts(latitude, longitude),
        fetchPDCDisasterAlerts(latitude, longitude),
        fetchReliefWebAlerts(latitude, longitude),
      ])
      let allDisasters = [...earthquakes, ...weatherAlerts, ...thailandAlerts, ...pdcAlerts, ...reliefWebAlerts]
      if (preferences.highSeverityOnly) {
        allDisasters = allDisasters.filter((disaster) => disaster.severity === "high")
      }
      allDisasters.sort((a, b) => b.timestamp - a.timestamp)
      const testAlerts = disasters.filter((d) => d.isTest)
      const nonTestDisasters = allDisasters.filter((d) => !d.isTest)
      allDisasters = [...testAlerts, ...nonTestDisasters]

      setDisasters(allDisasters)
      setLastFetchTime(now)

      if (preferences.notificationsEnabled) {
        const storedAlertIds = (await AsyncStorage.getItem("notifiedAlertIds")) || "[]"
        const notifiedIds = JSON.parse(storedAlertIds)

        const newHighSeverityAlerts = allDisasters.filter(
          (alert) => alert.severity === "high" && !notifiedIds.includes(alert.id) && !alert.isTest,
        )

        if (newHighSeverityAlerts.length > 0) {
          const updatedHistory = [...notificationHistory, ...newHighSeverityAlerts]
          setNotificationHistory(updatedHistory)
          await AsyncStorage.setItem("notificationHistory", JSON.stringify(updatedHistory))
        }

        for (const alert of newHighSeverityAlerts) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `🚨 ${alert.title}`,
              body: alert.description,
              data: { alertId: alert.id },
              sound: true,
            },
            trigger: null,
          })

          notifiedIds.push(alert.id)
        }

        await AsyncStorage.setItem("notifiedAlertIds", JSON.stringify(notifiedIds))
      }
    } catch (error) {
      console.error("Error fetching disaster data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DisasterContext.Provider
      value={{
        disasters,
        loading,
        fetchDisasters,
        markAsRead,
        notificationHistory,
        clearNotificationHistory,
        triggerTestAlert,
      }}
    >
      {children}
    </DisasterContext.Provider>
  )
}

