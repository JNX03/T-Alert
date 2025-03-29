"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
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
  alertRadius: number // in km
  language: Language
  theme: "light" | "dark"
  backgroundAlerts: boolean
  autoRefresh: boolean
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
  alertRadius: 1000,
  language: "en",
  theme: "light",
  backgroundAlerts: true,
  autoRefresh: true,
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

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedPrefs = await AsyncStorage.getItem("userPreferences")
        if (storedPrefs) {
          setPreferences({ ...defaultPreferences, ...JSON.parse(storedPrefs) })
        }
      } catch (error) {
        console.error("Error loading preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

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
  }

  return (
    <PreferencesContext.Provider value={{ preferences, setPreference, isLoading, toggleTheme }}>
      {children}
    </PreferencesContext.Provider>
  )
}

