"use client"
import { useState, useCallback } from "react"
import {
  StyleSheet,
  View,
  Text,
  Switch,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  Linking,
  Image,
  useColorScheme,
} from "react-native"
import * as Notifications from "expo-notifications"
import { usePreferences } from "../context/PreferencesContext"
import { useTranslation } from "../context/TranslationContext"
import { Ionicons } from "@expo/vector-icons"

export default function SettingsScreen() {
  const { preferences, setPreference, toggleTheme } = usePreferences()
  const { t, changeLanguage, currentLanguage } = useTranslation()
  const [radiusInput, setRadiusInput] = useState(preferences.alertRadius.toString())
  const [radiusChanged, setRadiusChanged] = useState(false)
  const [activeSection, setActiveSection] = useState("general")
  const systemColorScheme = useColorScheme()

  const [showSectionDropdown, setShowSectionDropdown] = useState(false)

  const sections = [
    { id: "general", icon: "settings-outline", label: "general" },
    { id: "notifications", icon: "notifications-outline", label: "notifications" },
    { id: "location", icon: "location-outline", label: "location" },
    { id: "developer", icon: "code-slash-outline", label: "developer" },
  ]

  const getSectionIcon = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    return section ? section.icon : "settings-outline"
  }

  const getSectionTitle = (sectionId) => {
    const section = sections.find((s) => s.id === sectionId)
    return section ? t(section.label) : t("general")
  }

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

  const toggleSetting = (key) => {
    setPreference(key, !preferences[key])
  }

  const handleRadiusChange = (text) => {
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

  const openLink = useCallback((url) => {
    Linking.openURL(url).catch((err) => console.error("Error opening URL:", err))
  }, [])

  const renderGeneralSettings = () => (
    <>
      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={styles.sectionTitle}>{t("theme")}</Text>
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
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("follow_system")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("use_system_theme")}
            </Text>
          </View>
          <Switch
            value={preferences.followSystemTheme}
            onValueChange={(value) => {
              setPreference("followSystemTheme", value)
              if (value) {
                setPreference("theme", systemColorScheme === "dark" ? "dark" : "light")
              }
            }}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.followSystemTheme ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={styles.sectionTitle}>{t("language")}</Text>
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
    </>
  )

  const renderNotificationSettings = () => (
    <>
      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={styles.sectionTitle}>{t("notifications")}</Text>
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
        <Text style={styles.sectionTitle}>{t("alert_types")}</Text>

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
        <Text style={styles.sectionTitle}>{t("alert_preferences")}</Text>
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
        <Text style={styles.sectionTitle}>{t("background_updates")}</Text>
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
    </>
  )

  const renderLocationSettings = () => (
    <>
      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={styles.sectionTitle}>{t("location_settings")}</Text>

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
        <Text style={styles.sectionTitle}>{t("auto_refresh")}</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {t("enable_auto_refresh")}
            </Text>
            <Text
              style={[
                styles.settingDescription,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              {t("auto_refresh_description")}
            </Text>
          </View>
          <Switch
            value={preferences.autoRefresh}
            onValueChange={() => toggleSetting("autoRefresh")}
            trackColor={{ false: "#767577", true: "#D32F2F" }}
            thumbColor={preferences.autoRefresh ? "#fff" : "#f4f3f4"}
          />
        </View>
      </View>
    </>
  )

  const renderDeveloperInfo = () => (
    <>
      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <View style={styles.developerHeader}>
          <Image
            source={{
              uri: "https://sjc.microlink.io/Zwwj20bax2dDEQ1LFy3oN4etkdD9IvVGht9xkW2gLrCpUMJ-D9p3ttxsZQxS1D96Bx0aaLY6ObG4e4j3zHDkBA.jpeg",
            }}
            style={styles.developerImage}
          />
          <View style={styles.developerInfo}>
            <Text style={[styles.developerName, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              Chawabhon Netisingha
            </Text>
            <Text
              style={[styles.developerTitle, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}
            >
              AI Developer & Software Engineer
            </Text>
            <Text
              style={[
                styles.developerUsername,
                preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext,
              ]}
            >
              @JNX03
            </Text>
          </View>
        </View>

        <View style={styles.socialLinks}>
          <TouchableOpacity
            style={[
              styles.socialButton,
              preferences.theme === "dark" ? styles.darkSocialButton : styles.lightSocialButton,
            ]}
            onPress={() => openLink("https://github.com/JNX03")}
          >
            <Ionicons name="logo-github" size={20} color={preferences.theme === "dark" ? "#fff" : "#333"} />
            <Text style={[styles.socialText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              GitHub
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              preferences.theme === "dark" ? styles.darkSocialButton : styles.lightSocialButton,
            ]}
            onPress={() => openLink("https://www.linkedin.com/in/chawabhon-netisingha/")}
          >
            <Ionicons name="logo-linkedin" size={20} color={preferences.theme === "dark" ? "#fff" : "#333"} />
            <Text style={[styles.socialText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              LinkedIn
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.socialButton,
              preferences.theme === "dark" ? styles.darkSocialButton : styles.lightSocialButton,
            ]}
            onPress={() => openLink("https://jnx03.xyz")}
          >
            <Ionicons name="globe-outline" size={20} color={preferences.theme === "dark" ? "#fff" : "#333"} />
            <Text style={[styles.socialText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              Website
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.developerBio}>
          <Text style={[styles.bioText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
            Passionate about leveraging AI and technology to create innovative solutions that make a positive impact on
            society.
          </Text>
        </View>
      </View>

      <View style={[styles.section, preferences.theme === "dark" ? styles.darkSection : styles.lightSection]}>
        <Text style={styles.sectionTitle}>{t("about")}</Text>
        <View style={styles.aboutContainer}>
          <Text style={[styles.appName, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
            {t("app_name")}
          </Text>
          <Text style={[styles.appVersion, preferences.theme === "dark" ? styles.darkSubtext : styles.lightSubtext]}>
            {t("version")} 1.1.0
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
          </View>
        </View>
      </View>
    </>
  )

  return (
    <View style={[styles.container, preferences.theme === "dark" ? styles.darkContainer : styles.lightContainer]}>
      <View style={[styles.sectionSelector, preferences.theme === "dark" ? styles.darkSectionSelector : {}]}>
        <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowSectionDropdown(!showSectionDropdown)}>
          <View style={styles.selectedSection}>
            <Ionicons
              name={getSectionIcon(activeSection)}
              size={20}
              color={preferences.theme === "dark" ? "#f0f0f0" : "#333"}
              style={styles.sectionIcon}
            />
            <Text style={[styles.sectionText, preferences.theme === "dark" ? styles.darkText : styles.lightText]}>
              {getSectionTitle(activeSection)}
            </Text>
          </View>
          <Ionicons
            name={showSectionDropdown ? "chevron-up" : "chevron-down"}
            size={20}
            color={preferences.theme === "dark" ? "#f0f0f0" : "#333"}
          />
        </TouchableOpacity>

        {showSectionDropdown && (
          <View style={[styles.dropdownMenu, preferences.theme === "dark" ? styles.darkDropdownMenu : {}]}>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.id}
                style={[
                  styles.dropdownItem,
                  activeSection === section.id ? styles.activeDropdownItem : {},
                  preferences.theme === "dark" ? styles.darkDropdownItem : {},
                ]}
                onPress={() => {
                  setActiveSection(section.id)
                  setShowSectionDropdown(false)
                }}
              >
                <Ionicons
                  name={section.icon}
                  size={20}
                  color={activeSection === section.id ? "#D32F2F" : preferences.theme === "dark" ? "#f0f0f0" : "#333"}
                  style={styles.dropdownIcon}
                />
                <Text
                  style={[
                    styles.dropdownText,
                    activeSection === section.id ? styles.activeDropdownText : {},
                    preferences.theme === "dark" ? styles.darkText : styles.lightText,
                  ]}
                >
                  {t(section.label)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView style={styles.scrollContainer}>
        {activeSection === "general" && renderGeneralSettings()}
        {activeSection === "notifications" && renderNotificationSettings()}
        {activeSection === "location" && renderLocationSettings()}
        {activeSection === "developer" && renderDeveloperInfo()}
      </ScrollView>
    </View>
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
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    marginBottom: 18,
    color: "#D32F2F",
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  settingInfo: {
    flex: 1,
    marginRight: 10,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
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
    flexWrap: "wrap",
  },
  radiusInput: {
    flex: 3,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginRight: 8,
    minWidth: 100,
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
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
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
    justifyContent: "space-between",
    marginVertical: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 5,
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
  developerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f8f8f8",
    padding: 12,
    borderRadius: 10,
    flexWrap: "wrap",
  },
  developerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 12,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  developerTitle: {
    fontSize: 14,
    marginBottom: 2,
  },
  developerUsername: {
    fontSize: 14,
    fontWeight: "500",
  },
  socialLinks: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 4,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  lightSocialButton: {
    backgroundColor: "#f5f5f5",
    borderColor: "#ddd",
  },
  darkSocialButton: {
    backgroundColor: "#2a2a2a",
    borderColor: "#444",
  },
  socialText: {
    marginLeft: 6,
    fontWeight: "500",
  },
  developerBio: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
  },
  sectionSelector: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    position: "relative",
    zIndex: 10,
  },
  darkSectionSelector: {
    backgroundColor: "#1e1e1e",
    borderBottomColor: "#333",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 20,
  },
  darkDropdownMenu: {
    backgroundColor: "#1e1e1e",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  darkDropdownItem: {
    borderBottomColor: "#333",
  },
  activeDropdownItem: {
    backgroundColor: "#f9f9f9",
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: "500",
  },
  activeDropdownText: {
    color: "#D32F2F",
    fontWeight: "600",
  },
})

