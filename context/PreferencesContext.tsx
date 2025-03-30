"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useColorScheme } from "react-native"
import type { Language } from "./TranslationContext"

type PreferencesType = {
  notificationsEnabled: boolean
  earthquakeAlerts: boolean
  weatherAlerts: boolean
  floodAlerts: boolean
  tsunamiAlerts: boolean
  volcanoAlerts: boolean
  highSeverityOnly: boolean
  thailandOnly: boolean
  alertRadius: number
  language: Language
  theme: "light" | "dark"
  backgroundAlerts: boolean
  autoRefresh: boolean
  followSystemTheme: boolean
}

type PreferencesContextType = {
  preferences: PreferencesType
  setPreference: (key: keyof PreferencesType, value: any) => Promise<void>
  isLoading: boolean
  toggleTheme: () => Promise<void>
}

const defaultPreferences: PreferencesType = {
  notificationsEnabled: true,
  earthquakeAlerts: true,
  weatherAlerts: true,
  floodAlerts: true,
  tsunamiAlerts: true,
  volcanoAlerts: true,
  highSeverityOnly: false,
  thailandOnly: false,
  alertRadius: 300,
  language: "en",
  theme: "light",
  backgroundAlerts: true,
  autoRefresh: true,
  followSystemTheme: true,
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined)

export const usePreferences = () => {
  const context = useContext(PreferencesContext)
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider")
  }
  return context
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<PreferencesType>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)
  const systemColorScheme = useColorScheme()

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedPrefs = await AsyncStorage.getItem("userPreferences")
        if (storedPrefs) {
          const parsedPrefs = { ...defaultPreferences, ...JSON.parse(storedPrefs) }
          setPreferences(parsedPrefs)

          if (parsedPrefs.followSystemTheme && systemColorScheme) {
            setPreferences((prev) => ({
              ...prev,
              theme: systemColorScheme === "dark" ? "dark" : "light",
            }))
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [systemColorScheme])

  useEffect(() => {
    if (preferences.followSystemTheme && systemColorScheme) {
      setPreference("theme", systemColorScheme === "dark" ? "dark" : "light")
    }
  }, [systemColorScheme, preferences.followSystemTheme])

  const setPreference = async (key: keyof PreferencesType, value: any) => {
    try {
      const updatedPreferences = { ...preferences, [key]: value }
      setPreferences(updatedPreferences)
      await AsyncStorage.setItem("userPreferences", JSON.stringify(updatedPreferences))
    } catch (error) {
      console.error("Error saving preference:", error)
    }
  }

  const toggleTheme = async () => {
    const newTheme = preferences.theme === "light" ? "dark" : "light"
    await setPreference("theme", newTheme)

    if (preferences.followSystemTheme) {
      await setPreference("followSystemTheme", false)
    }
  }

  return (
    <PreferencesContext.Provider value={{ preferences, setPreference, isLoading, toggleTheme }}>
      {children}
    </PreferencesContext.Provider>
  )
}

