"use client"

import { useState } from "react"
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native"
import { Ionicons } from "@expo/vector-icons"

// Add this type at the top of the file
type IconName = any; // This is a workaround for the Ionicons name type issue

// Safety checklist data
const safetyChecklists = [
  {
    id: "earthquake",
    title: "Earthquake Safety",
    icon: "earth" as IconName,
    color: "#D32F2F",
    items: [
      { id: "eq1", text: "Drop, Cover, and Hold On", checked: false },
      { id: "eq2", text: "Stay away from windows and exterior walls", checked: false },
      { id: "eq3", text: "If outdoors, move to an open area away from buildings", checked: false },
      { id: "eq4", text: "If in a vehicle, pull over and stop", checked: false },
      { id: "eq5", text: "After shaking stops, check for injuries and damage", checked: false },
      { id: "eq6", text: "Be prepared for aftershocks", checked: false },
      { id: "eq7", text: "Listen to emergency radio for instructions", checked: false },
    ],
  },
  {
    id: "flood",
    title: "Flood Safety",
    icon: "water" as IconName,
    color: "#2196F3",
    items: [
      { id: "fl1", text: "Move to higher ground immediately", checked: false },
      { id: "fl2", text: "Do not walk, swim, or drive through flood waters", checked: false },
      { id: "fl3", text: "Stay off bridges over fast-moving water", checked: false },
      { id: "fl4", text: "Evacuate if told to do so", checked: false },
      { id: "fl5", text: "Disconnect utilities if instructed by authorities", checked: false },
      { id: "fl6", text: "Return home only when authorities say it is safe", checked: false },
    ],
  },
  {
    id: "storm",
    title: "Severe Storm Safety",
    icon: "thunderstorm" as IconName,
    color: "#FF9800",
    items: [
      { id: "st1", text: "Stay indoors and away from windows", checked: false },
      { id: "st2", text: "Unplug electronic equipment", checked: false },
      { id: "st3", text: "Avoid using landline phones and plumbing", checked: false },
      { id: "st4", text: "If outdoors, seek shelter in a sturdy building", checked: false },
      { id: "st5", text: "If driving, pull over safely away from trees", checked: false },
      { id: "st6", text: "After the storm, watch for fallen power lines", checked: false },
    ],
  },
  {
    id: "tsunami",
    title: "Tsunami Safety",
    icon: "water" as IconName,
    color: "#0D47A1",
    items: [
      { id: "ts1", text: "Move inland to higher ground immediately", checked: false },
      { id: "ts2", text: "Follow evacuation routes", checked: false },
      { id: "ts3", text: "If you cannot escape, go to an upper floor of a sturdy building", checked: false },
      { id: "ts4", text: "Stay away from the coast until officials say it is safe", checked: false },
      { id: "ts5", text: "Be alert for multiple waves", checked: false },
    ],
  },
  {
    id: "emergency",
    title: "Emergency Kit",
    icon: "medkit" as IconName,
    color: "#4CAF50",
    items: [
      { id: "em1", text: "Water (3-day supply)", checked: false },
      { id: "em2", text: "Non-perishable food (3-day supply)", checked: false },
      { id: "em3", text: "Battery-powered radio", checked: false },
      { id: "em4", text: "Flashlight and extra batteries", checked: false },
      { id: "em5", text: "First aid kit", checked: false },
      { id: "em6", text: "Whistle to signal for help", checked: false },
      { id: "em7", text: "Dust mask", checked: false },
      { id: "em8", text: "Plastic sheeting and duct tape", checked: false },
      { id: "em9", text: "Moist towelettes, garbage bags, and plastic ties", checked: false },
      { id: "em10", text: "Wrench or pliers to turn off utilities", checked: false },
      { id: "em11", text: "Manual can opener", checked: false },
      { id: "em12", text: "Local maps", checked: false },
      { id: "em13", text: "Cell phone with chargers and backup battery", checked: false },
    ],
  },
]

export default function SafetyChecklistScreen() {
  const [selectedChecklist, setSelectedChecklist] = useState(safetyChecklists[0])
  const [checklists, setChecklists] = useState(safetyChecklists)

  const toggleChecklistItem = (itemId) => {
    const updatedChecklists = checklists.map((checklist) => {
      if (checklist.id === selectedChecklist.id) {
        const updatedItems = checklist.items.map((item) =>
          item.id === itemId ? { ...item, checked: !item.checked } : item,
        )
        return { ...checklist, items: updatedItems }
      }
      return checklist
    })

    setChecklists(updatedChecklists)
    setSelectedChecklist(updatedChecklists.find((c) => c.id === selectedChecklist.id))
  }

  const renderChecklistItem = ({ item }) => (
    <TouchableOpacity style={styles.checklistItem} onPress={() => toggleChecklistItem(item.id)}>
      <View style={[styles.checkbox, item.checked ? styles.checked : {}]}>
        {item.checked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <Text style={[styles.checklistItemText, item.checked ? styles.checkedText : {}]}>{item.text}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {checklists.map((checklist) => (
          <TouchableOpacity
            key={checklist.id}
            style={[
              styles.categoryButton,
              selectedChecklist.id === checklist.id ? { backgroundColor: checklist.color } : {},
            ]}
            onPress={() => setSelectedChecklist(checklist)}
          >
            <Ionicons
              name={checklist.icon}
              size={24}
              color={selectedChecklist.id === checklist.id ? "white" : checklist.color}
            />
            <Text
              style={[
                styles.categoryText,
                selectedChecklist.id === checklist.id ? { color: "white" } : { color: "#333" },
              ]}
            >
              {checklist.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.checklistContainer}>
        <View style={styles.checklistHeader}>
          <Ionicons name={selectedChecklist.icon} size={28} color={selectedChecklist.color} />
          <Text style={styles.checklistTitle}>{selectedChecklist.title}</Text>
        </View>

        <FlatList
          data={selectedChecklist.items}
          renderItem={renderChecklistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.checklistItems}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  categoryScroll: {
    maxHeight: 80,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 5,
    marginVertical: 10,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  categoryText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  checklistContainer: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  checklistHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checklistTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  checklistItems: {
    padding: 10,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#757575",
    marginRight: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  checked: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  checklistItemText: {
    fontSize: 16,
    color: "#333",
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: "#9e9e9e",
  },
})

