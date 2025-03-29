"use client"
import { StyleSheet, View, Text, Switch, ScrollView, Alert, TextInput, TouchableOpacity } from "react-native"
import * as Notifications from "expo-notifications"
import { usePreferences } from "../context/PreferencesContext"
import { useState } from "react"
import { useTranslation } from "../context/TranslationContext"

export default function SettingsScreen() {
  const { preferences, setPreference, toggleTheme } = usePreferences()
  const { t, changeLanguage, currentLanguage } = useTranslation()
  const [radiusInput, setRadiusInput] = useState(preferences.alertRadius.toString())
  const [radiusChanged, setRadiusChanged] = useState(false)

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync()
    return status === "granted"
  }

  const toggleNotifications = async () => {
    const isEnabled = await checkNotificationPermissions()

    if (!isEnabled) {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(t("permission_required"), t("notification_permission_message"), [{ text: "OK" }])
        return
      }
    }

    setPreference("notificationsEnabled", !preferences.notificationsEnabled)
  }

  const toggleSetting = (key: keyof typeof preferences) => {
    setPreference(key, !preferences[key])
  }

  const handleRadiusChange = (text: string) => {
    setRadiusInput(text)
    setRadiusChanged(true)
  }

  const updateRadius = () => {
    const numValue = Number.parseInt(radiusInput, 10)
    if (!isNaN(numValue) && numValue >= 50 && numValue <= 1000) {
      setPreference("alertRadius", numValue)
      Alert.alert(t("radius_updated"), `${t("alert_radius_set")} ${numValue} km.`, [{ text: "OK" }])
      setRadiusChanged(false)
    } else {
      Alert.alert(t("invalid_radius"), t("enter_valid_radius"), [{ text: "OK" }])
      setRadiusInput(preferences.alertRadius.toString())
      setRadiusChanged(false)
    }
  }

  return (
    <ScrollView style={[styles.container, preferences.theme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("theme")}
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("dark_mode")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("toggle_theme")}
            </Text>
          </View>
          <Switch
            value={preferences.theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.theme === "dark" ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("language")}
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("select_language")}
            </Text>
          </View>
        </View>
        <View style={styles.languageContainer}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              currentLanguage === "en" ? styles.activeLanguageButton : {},
              preferences.theme === "dark" ? styles.darkLanguageButton : styles.lightLanguageButton,
            ]}
            onPress={() => changeLanguage("en")}
          >
            <Text
              style={[
                styles.languageText,
                currentLanguage === "en" ? styles.activeLanguageText : {},
                preferences.theme === "dark" ? styles.darkText : styles.lightText,
              ]}
            >
              {t("english")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              currentLanguage === "th" ? styles.activeLanguageButton : {},
              preferences.theme === "dark" ? styles.darkLanguageButton : styles.lightLanguageButton,
            ]}
            onPress={() => changeLanguage("th")}
          >
            <Text
              style={[
                styles.languageText,
                currentLanguage === "th" ? styles.activeLanguageText : {},
                preferences.theme === "dark" ? styles.darkText : styles.lightText,
              ]}
            >
              {t("thai")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("notifications")}
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("enable_notifications")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("receive_alerts")}
            </Text>
          </View>
          <Switch
            value={preferences.notificationsEnabled}
            onValueChange={toggleNotifications}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.notificationsEnabled ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("location_settings")}
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("thailand_only")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("show_thailand_only")}
            </Text>
          </View>
          <Switch
            value={preferences.thailandOnly}
            onValueChange={() => toggleSetting("thailandOnly")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.thailandOnly ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("alert_radius")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("distance_from_location")}
            </Text>
          </View>
        </View>

        <View style={styles.sliderContainer}>
          <View style={styles.radiusInputContainer}>
            <TextInput
              style={[styles.radiusInput, preferences.theme === "dark" ? styles.darkInput : styles.lightInput]}
              value={radiusInput}
              onChangeText={handleRadiusChange}
              keyboardType="numeric"
              placeholder={t("enter_radius")}
              placeholderTextColor={preferences.theme === "dark" ? "#aaa" : "#777"}
            />
            <TouchableOpacity
              style={[styles.updateButton, radiusChanged ? styles.updateButtonActive : styles.updateButtonInactive]}
              onPress={updateRadius}
              disabled={!radiusChanged}
            >
              <Text style={styles.updateButtonText}>{t("update")}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              {t("current")}: {preferences.alertRadius} km
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("alert_types")}
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("earthquake_alerts")}
            </Text>
          </View>
          <Switch
            value={preferences.earthquakeAlerts}
            onValueChange={() => toggleSetting("earthquakeAlerts")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.earthquakeAlerts ? "#fff" : "#f4f3f4"}
            disabled={!preferences.notificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("weather_alerts")}
            </Text>
          </View>
          <Switch
            value={preferences.weatherAlerts}
            onValueChange={() => toggleSetting("weatherAlerts")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.weatherAlerts ? "#fff" : "#f4f3f4"}
            disabled={!preferences.notificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("flood_alerts")}
            </Text>
          </View>
          <Switch
            value={preferences.floodAlerts}
            onValueChange={() => toggleSetting("floodAlerts")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.floodAlerts ? "#fff" : "#f4f3f4"}
            disabled={!preferences.notificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("tsunami_alerts")}
            </Text>
          </View>
          <Switch
            value={preferences.tsunamiAlerts}
            onValueChange={() => toggleSetting("tsunamiAlerts")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.tsunamiAlerts ? "#fff" : "#f4f3f4"}
            disabled={!preferences.notificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("volcano_alerts")}
            </Text>
          </View>
          <Switch
            value={preferences.volcanoAlerts}
            onValueChange={() => toggleSetting("volcanoAlerts")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.volcanoAlerts ? "#fff" : "#f4f3f4"}
            disabled={!preferences.notificationsEnabled}
          />
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("alert_preferences")}
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("high_severity_only")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("high_severity_description")}
            </Text>
          </View>
          <Switch
            value={preferences.highSeverityOnly}
            onValueChange={() => toggleSetting("highSeverityOnly")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.highSeverityOnly ? "#fff" : "#f4f3f4"}
            disabled={!preferences.notificationsEnabled}
          />
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("background_updates")}
        </Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("background_alerts")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("background_alerts_description")}
            </Text>
          </View>
          <Switch
            value={preferences.backgroundAlerts}
            onValueChange={() => toggleSetting("backgroundAlerts")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.backgroundAlerts ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={[styles.sectionTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
          {t("about")}
        </Text>
        <View style={styles.aboutContainer}>
          <Text style={[styles.appName, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
            {t("app_name")}
          </Text>
          <Text style={[styles.appVersion, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
            {t("version")} 1.0.0
          </Text>
          <Text style={[styles.appDescription, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
            {t("app_subtitle")}
          </Text>
          <View style={styles.dataSourcesContainer}>
            <Text style={[styles.dataSourcesTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("data_sources")}:
            </Text>
            <Text style={[styles.dataSource, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              • USGS Earthquake API
            </Text>
            <Text style={[styles.dataSource, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              • Open-Meteo Weather API
            </Text>
            <Text style={[styles.dataSource, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              • Thai Meteorological Department
            </Text>
            <Text style={[styles.dataSource, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              • Department of Disaster Prevention and Mitigation
            </Text>
            <Text style={[styles.dataSource, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              • Pacific Disaster Center (PDC)
            </Text>
            <Text style={[styles.dataSource, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
              • ReliefWeb
            </Text>
          </View>
        </View>
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
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginHorizontal: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  lightSection: {
    backgroundColor: "#fff",
    shadowColor: "#000",
  },
  darkSection: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#000",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
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
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
  },
  sliderContainer: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  radiusInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radiusInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginRight: 10,
  },
  lightInput: {
    borderColor: "#D32F2F",
    backgroundColor: "#fff",
    color: "#333",
  },
  darkInput: {
    borderColor: "#ff6b6b",
    backgroundColor: "#2a2a2a",
    color: "#f0f0f0",
  },
  updateButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  updateButtonActive: {
    backgroundColor: "#D32F2F",
  },
  updateButtonInactive: {
    backgroundColor: "#9e9e9e",
  },
  updateButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "center",
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  aboutContainer: {
    paddingVertical: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 15,
  },
  appDescription: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
  },
  dataSourcesContainer: {
    marginTop: 10,
  },
  dataSourcesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  dataSource: {
    fontSize: 14,
    marginBottom: 5,
  },
  languageContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 15,
  },
  languageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    alignItems: "center",
  },
  lightLanguageButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
  },
  darkLanguageButton: {
    backgroundColor: "#2a2a2a",
    borderColor: "#444",
  },
  activeLanguageButton: {
    borderColor: "#D32F2F",
    backgroundColor: "#D32F2F",
  },
  languageText: {
    fontSize: 16,
    fontWeight: "500",
  },
  activeLanguageText: {
    color: "#fff",
  },
})

