"use client"

import React from "react"
import { StyleSheet, TouchableOpacity, Text, Animated, Easing } from "react-native"
import { Ionicons } from "@expo/vector-icons"

type EmergencyButtonProps = {
  onPress: () => void
  label: string
  icon: any // Change from string to any
  color?: string
  size?: "small" | "medium" | "large"
  theme: "light" | "dark"
}

const EmergencyButton = ({ onPress, label, icon, color = "#D32F2F", size = "medium", theme }: EmergencyButtonProps) => {
  // Create animated value for pulse effect
  const pulseAnim = React.useRef(new Animated.Value(1)).current

  // Start pulse animation on mount
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  // Determine button size
  const buttonSize = {
    small: { width: 100, height: 40, iconSize: 16, fontSize: 12 },
    medium: { width: 140, height: 50, iconSize: 20, fontSize: 14 },
    large: { width: 180, height: 60, iconSize: 24, fontSize: 16 },
  }[size]

  return (
    <Animated.View
      style={[
        styles.buttonWrapper,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: color,
            width: buttonSize.width,
            height: buttonSize.height,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Ionicons name={icon} size={buttonSize.iconSize} color="white" />
        <Text style={[styles.label, { fontSize: buttonSize.fontSize }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  buttonWrapper: {
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 25,
    margin: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    paddingHorizontal: 16,
  },
  label: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
})

export default EmergencyButton

