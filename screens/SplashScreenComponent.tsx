"use client"

import { useEffect } from "react"
import { StyleSheet, View, Text, Animated } from "react-native"
import { useNavigation } from "@react-navigation/native"

export default function SplashScreenComponent() {
  const navigation = useNavigation<any>()
  const fadeAnim = new Animated.Value(0)
  const scaleAnim = new Animated.Value(0.9)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start()

    const timer = setTimeout(() => {
      navigation.replace("Home")
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>🚨</Text>
        </View>
        <Text style={styles.title}>T-Alert/Jnx03</Text>
        <Text style={styles.subtitle}>แอพแจ้งเตือนภัยพิบัติ</Text>
        <Text style={styles.englishSubtitle}>Thailand Disaster Alert System</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 22,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 5,
    fontWeight: "500",
  },
  englishSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
})

