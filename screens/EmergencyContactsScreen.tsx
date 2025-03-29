"use client"

import { useState, useEffect } from "react"
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"

const defaultContacts = [
  {
    id: "1",
    name: "National Emergency Hotline",
    phone: "191",
    category: "emergency",
    isDefault: true,
  },
  {
    id: "2",
    name: "Tourist Police",
    phone: "1155",
    category: "emergency",
    isDefault: true,
  },
  {
    id: "3",
    name: "Ambulance and Rescue",
    phone: "1554",
    category: "medical",
    isDefault: true,
  },
  {
    id: "4",
    name: "Fire Brigade",
    phone: "199",
    category: "emergency",
    isDefault: true,
  },
  {
    id: "5",
    name: "Department of Disaster Prevention and Mitigation",
    phone: "1784",
    category: "disaster",
    isDefault: true,
  },
  {
    id: "6",
    name: "Thai Meteorological Department",
    phone: "1182",
    category: "disaster",
    isDefault: true,
  },
]

type Contact = {
  id: string
  name: string
  phone: string
  category: "emergency" | "medical" | "disaster" | "personal"
  isDefault?: boolean
}

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>(defaultContacts)
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(defaultContacts)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [modalVisible, setModalVisible] = useState(false)
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: "",
    phone: "",
    category: "personal",
  })

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const storedContacts = await AsyncStorage.getItem("emergencyContacts")
        if (storedContacts) {
          const parsedContacts = JSON.parse(storedContacts)
          const mergedContacts = [...defaultContacts, ...parsedContacts.filter((c) => !c.isDefault)]
          setContacts(mergedContacts)
          setFilteredContacts(mergedContacts)
        }
      } catch (error) {
        console.error("Error loading contacts:", error)
      }
    }

    loadContacts()
  }, [])

  useEffect(() => {
    const saveContacts = async () => {
      try {
        const contactsToSave = contacts.filter((c) => !c.isDefault)
        await AsyncStorage.setItem("emergencyContacts", JSON.stringify(contactsToSave))
      } catch (error) {
        console.error("Error saving contacts:", error)
      }
    }

    if (contacts !== defaultContacts) {
      saveContacts()
    }
  }, [contacts])

  useEffect(() => {
    let filtered = contacts

    if (searchQuery) {
      filtered = filtered.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || contact.phone.includes(searchQuery),
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((contact) => contact.category === selectedCategory)
    }

    setFilteredContacts(filtered)
  }, [searchQuery, selectedCategory, contacts])

  const handleCall = (phone) => {
    Linking.openURL(`tel:${phone}`)
  }

  const handleAddContact = () => {
    if (!newContact.name || !newContact.phone) {
      Alert.alert("Error", "Please enter both name and phone number")
      return
    }

    const contact: Contact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      category: newContact.category as "emergency" | "medical" | "disaster" | "personal",
    }

    setContacts([...contacts, contact])
    setModalVisible(false)
    setNewContact({ name: "", phone: "", category: "personal" })
  }

  const handleDeleteContact = (id) => {
    const contactToDelete = contacts.find((c) => c.id === id)
    if (contactToDelete?.isDefault) {
      Alert.alert("Cannot Delete", "Default emergency contacts cannot be deleted", [{ text: "OK" }])
      return
    }

    Alert.alert("Delete Contact", "Are you sure you want to delete this contact?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedContacts = contacts.filter((contact) => contact.id !== id)
          setContacts(updatedContacts)
        },
      },
    ])
  }

  const renderContactItem = ({ item }) => (
    <View style={styles.contactItem}>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category.charAt(0).toUpperCase() + item.category.slice(1)}</Text>
        </View>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => handleCall(item.phone)}>
          <Ionicons name="call" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteContact(item.id)}
        >
          <Ionicons name="trash" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === "all" ? styles.activeCategoryButton : {}]}
          onPress={() => setSelectedCategory("all")}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === "all" ? styles.activeCategoryText : {}]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === "emergency" ? styles.activeCategoryButton : {}]}
          onPress={() => setSelectedCategory("emergency")}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === "emergency" ? styles.activeCategoryText : {}]}>
            Emergency
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === "medical" ? styles.activeCategoryButton : {}]}
          onPress={() => setSelectedCategory("medical")}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === "medical" ? styles.activeCategoryText : {}]}>
            Medical
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === "disaster" ? styles.activeCategoryButton : {}]}
          onPress={() => setSelectedCategory("disaster")}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === "disaster" ? styles.activeCategoryText : {}]}>
            Disaster
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === "personal" ? styles.activeCategoryButton : {}]}
          onPress={() => setSelectedCategory("personal")}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === "personal" ? styles.activeCategoryText : {}]}>
            Personal
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contactsList}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Emergency Contact</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Contact Name"
              value={newContact.name}
              onChangeText={(text) => setNewContact({ ...newContact, name: text })}
            />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={newContact.phone}
              onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categorySelector}>
              <TouchableOpacity
                style={[
                  styles.categorySelectorButton,
                  newContact.category === "personal" ? styles.selectedCategory : {},
                ]}
                onPress={() => setNewContact({ ...newContact, category: "personal" })}
              >
                <Text style={styles.categorySelectorText}>Personal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categorySelectorButton,
                  newContact.category === "emergency" ? styles.selectedCategory : {},
                ]}
                onPress={() => setNewContact({ ...newContact, category: "emergency" })}
              >
                <Text style={styles.categorySelectorText}>Emergency</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categorySelectorButton,
                  newContact.category === "medical" ? styles.selectedCategory : {},
                ]}
                onPress={() => setNewContact({ ...newContact, category: "medical" })}
              >
                <Text style={styles.categorySelectorText}>Medical</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.categorySelectorButton,
                  newContact.category === "disaster" ? styles.selectedCategory : {},
                ]}
                onPress={() => setNewContact({ ...newContact, category: "disaster" })}
              >
                <Text style={styles.categorySelectorText}>Disaster</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleAddContact}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryScroll: {
    maxHeight: 60,
    paddingHorizontal: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeCategoryButton: {
    backgroundColor: "#D32F2F",
  },
  categoryButtonText: {
    color: "#333",
  },
  activeCategoryText: {
    color: "white",
    fontWeight: "bold",
  },
  contactsList: {
    padding: 15,
  },
  contactItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  contactPhone: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 5,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#555",
  },
  contactActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  callButton: {
    backgroundColor: "#4CAF50",
  },
  deleteButton: {
    backgroundColor: "#F44336",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D32F2F",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 5,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  categorySelectorButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategory: {
    backgroundColor: "#D32F2F",
  },
  categorySelectorText: {
    fontSize: 14,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#9e9e9e",
  },
  saveButton: {
    backgroundColor: "#D32F2F",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
})

