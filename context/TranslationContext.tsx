"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePreferences } from "./PreferencesContext"

export type Language = "en" | "th"

type TranslationContextType = {
  t: (key: string) => string
  changeLanguage: (lang: Language) => void
  currentLanguage: Language
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

const enTranslations = {
  app_name: "T-Alert/Jnx03",
  app_subtitle: "Thailand Disaster Alert System",
  active_alerts: "Active Alerts",
  your_location: "Your Location",
  getting_location: "Getting your location...",
  last_updated: "Last updated",
  auto_refresh_on: "Auto-refresh in",
  never: "Never",
  seconds_ago: "s ago",
  minutes_ago: "m ago",
  no_alerts: "No active alerts in your area",
  pull_to_refresh: "Pull down to refresh",
  location_permission_denied: "Permission to access location was denied",
  notif: "Notif",
  no_notif: "No Notif",
  loc: "Loc",
  no_loc: "No Loc",
  background_notification_title: "T-Alert Running in Background",
  background_notification_body: "The app will continue to monitor for disaster alerts",
  settings: "Settings",
  general: "General",
  theme: "Theme",
  dark_mode: "Dark Mode",
  toggle_theme: "Toggle between light and dark theme",
  follow_system: "Follow System Theme",
  use_system_theme: "Use your device's theme settings",
  notifications: "Notifications",
  enable_notifications: "Enable Notifications",
  receive_alerts: "Receive alerts about disasters in your area",
  location: "Location",
  location_settings: "Location Settings",
  thailand_only: "Thailand Only",
  show_thailand_only: "Only show alerts within Thailand",
  alert_radius: "Alert Radius",
  distance_from_location: "Distance from your location (50-1000 km)",
  current: "Current",
  update: "Update",
  language: "Language",
  select_language: "Select language",
  english: "English",
  thai: "ไทย",
  developer: "Developer",
  alert_types: "Alert Types",
  earthquake_alerts: "Earthquake Alerts",
  weather_alerts: "Weather Alerts",
  flood_alerts: "Flood Alerts",
  tsunami_alerts: "Tsunami Alerts",
  volcano_alerts: "Volcano Alerts",
  alert_preferences: "Alert Preferences",
  high_severity_only: "High Severity Only",
  high_severity_description: "Only receive alerts for high severity events",
  background_updates: "Background Updates",
  background_alerts: "Background Alerts",
  background_alerts_description: "Receive alerts even when app is closed",
  auto_refresh: "Auto Refresh",
  enable_auto_refresh: "Enable Auto Refresh",
  auto_refresh_description: "Automatically refresh alerts every minute",
  about: "About",
  version: "Version",
  data_sources: "Data Sources",
  test_alerts: "Test Alerts",
  test_alert_system: "Test Alert System",
  test_alert_description:
    "Use these options to test how alerts appear in the app and as notifications. Test alerts will be marked as tests and will appear at the top of your alerts list.",
  test_earthquake: "Test Earthquake Alert",
  test_flood: "Test Flood Alert",
  test_tsunami: "Test Tsunami Alert",
  test_volcano: "Test Volcano Alert",
  test_storm: "Test Storm Alert",
  test_info:
    "Test alerts are for demonstration purposes only and do not represent real emergency situations. They will be automatically removed when you restart the app.",
  location_error: "Unable to get your location. Using default location.",
  using_default_location: "Using default location (Bangkok).",
  map_error: "There was a problem loading the map. Please check your internet connection.",
  location_permission_error: "There was a problem with location permissions.",
}

const thTranslations = {
  app_name: "ที-อเลิร์ต/Jnx03",
  app_subtitle: "แอพแจ้งเตือนภัยพิบัติ",
  active_alerts: "การแจ้งเตือนที่ใช้งานอยู่",
  your_location: "ตำแหน่งของคุณ",
  getting_location: "กำลังรับตำแหน่งของคุณ...",
  last_updated: "อัปเดตล่าสุด",
  auto_refresh_on: "รีเฟรชอัตโนมัติใน",
  never: "ไม่เคย",
  seconds_ago: " วินาทีที่แล้ว",
  minutes_ago: " นาทีที่แล้ว",
  no_alerts: "ไม่มีการแจ้งเตือนที่ใช้งานอยู่ในพื้นที่ของคุณ",
  pull_to_refresh: "ดึงลงเพื่อรีเฟรช",
  location_permission_denied: "การเข้าถึงตำแหน่งถูกปฏิเสธ",
  notif: "แจ้งเตือน",
  no_notif: "ไม่มีแจ้งเตือน",
  loc: "ตำแหน่ง",
  no_loc: "ไม่มีตำแหน่ง",
  background_notification_title: "ที-อเลิร์ต กำลังทำงานในพื้นหลัง",
  background_notification_body: "แอพจะยังคงตรวจสอบการแจ้งเตือนภัยพิบัติ",
  settings: "การตั้งค่า",
  general: "ทั่วไป",
  theme: "ธีม",
  dark_mode: "โหมดมืด",
  toggle_theme: "สลับระหว่างธีมสว่างและมืด",
  follow_system: "ใช้ธีมตามระบบ",
  use_system_theme: "ใช้การตั้งค่าธีมของอุปกรณ์ของคุณ",
  notifications: "การแจ้งเตือน",
  enable_notifications: "เปิดใช้งานการแจ้งเตือน",
  receive_alerts: "รับการแจ้งเตือนเกี่ยวกับภัยพิบัติในพื้นที่ของคุณ",
  location: "ตำแหน่ง",
  location_settings: "การตั้งค่าตำแหน่ง",
  thailand_only: "เฉพาะประเทศไทย",
  show_thailand_only: "แสดงเฉพาะการแจ้งเตือนภายในประเทศไทย",
  alert_radius: "รัศมีการแจ้งเตือน",
  distance_from_location: "ระยะทางจากตำแหน่งของคุณ (50-1000 กม.)",
  current: "ปัจจุบัน",
  update: "อัปเดต",
  language: "ภาษา",
  select_language: "เลือกภาษา",
  english: "English",
  thai: "ไทย",
  developer: "ผู้พัฒนา",
  alert_types: "ประเภทการแจ้งเตือน",
  earthquake_alerts: "การแจ้งเตือนแผ่นดินไหว",
  weather_alerts: "การแจ้งเตือนสภาพอากาศ",
  flood_alerts: "การแจ้งเตือนน้ำท่วม",
  tsunami_alerts: "การแจ้งเตือนสึนามิ",
  volcano_alerts: "การแจ้งเตือนภูเขาไฟ",
  alert_preferences: "การตั้งค่าการแจ้งเตือน",
  high_severity_only: "เฉพาะความรุนแรงสูง",
  high_severity_description: "รับเฉพาะการแจ้งเตือนสำหรับเหตุการณ์ที่มีความรุนแรงสูง",
  background_updates: "การอัปเดตพื้นหลัง",
  background_alerts: "การแจ้งเตือนพื้นหลัง",
  background_alerts_description: "รับการแจ้งเตือนแม้เมื่อแอพถูกปิด",
  auto_refresh: "รีเฟรชอัตโนมัติ",
  enable_auto_refresh: "เปิดใช้งานรีเฟรชอัตโนมัติ",
  auto_refresh_description: "รีเฟรชการแจ้งเตือนโดยอัตโนมัติทุกนาที",
  about: "เกี่ยวกับ",
  version: "เวอร์ชัน",
  data_sources: "แหล่งข้อมูล",
  test_alerts: "ทดสอบการแจ้งเตือน",
  test_alert_system: "ระบบทดสอบการแจ้งเตือน",
  test_alert_description:
    "ใช้ตัวเลือกเหล่านี้เพื่อทดสอบวิธีการแสดงการแจ้งเตือนในแอพและเป็นการแจ้งเตือน การแจ้งเตือนทดสอบจะถูกทำเครื่องหมายเป็นการทดสอบและจะปรากฏที่ด้านบนของรายการการแจ้งเตือนของคุณ",
  test_earthquake: "ทดสอบการแจ้งเตือนแผ่นดินไหว",
  test_flood: "ทดสอบการแจ้งเตือนน้ำท่วม",
  test_tsunami: "ทดสอบการแจ้งเตือนสึนามิ",
  test_volcano: "ทดสอบการแจ้งเตือนภูเขาไฟ",
  test_storm: "ทดสอบการแจ้งเตือนพายุ",
  test_info:
    "การแจ้งเตือนทดสอบมีไว้เพื่อการสาธิตเท่านั้นและไม่ได้แสดงถึงสถานการณ์ฉุกเฉินจริง การแจ้งเตือนเหล่านี้จะถูกลบโดยอัตโนมัติเมื่อคุณรีสตาร์ทแอพ",

  location_error: "ไม่สามารถรับตำแหน่งของคุณได้ กำลังใช้ตำแหน่งเริ่มต้น",
  using_default_location: "กำลังใช้ตำแหน่งเริ่มต้น (กรุงเทพฯ)",
  map_error: "มีปัญหาในการโหลดแผนที่ โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ",
  location_permission_error: "มีปัญหาเกี่ยวกับสิทธิ์การเข้าถึงตำแหน่ง",
}

const translations = {
  en: enTranslations,
  th: thTranslations,
}

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, setPreference } = usePreferences()
  const [currentLanguage, setCurrentLanguage] = useState<Language>(preferences.language || "en")

  useEffect(() => {
    if (preferences.language) {
      setCurrentLanguage(preferences.language)
    }
  }, [preferences.language])

  const t = (key: string): string => {
    const translationSet = translations[currentLanguage]
    return translationSet[key] || key
  }

  const changeLanguage = (lang: Language) => {
    setCurrentLanguage(lang)
    setPreference("language", lang)
  }

  return (
    <TranslationContext.Provider value={{ t, changeLanguage, currentLanguage }}>{children}</TranslationContext.Provider>
  )
}

export const useTranslation = () => {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}

