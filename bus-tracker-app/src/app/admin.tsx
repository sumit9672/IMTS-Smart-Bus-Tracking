import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "http://10.25.53.195:5000";

export default function AdminScreen() {
  const router = useRouter();

  const [lang, setLang] = useState<"mr" | "en">("mr");
  const [activeMode, setActiveMode] = useState<"admin" | "driver">("admin");
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Driver Cockpit State
  const [selectedBusNumber, setSelectedBusNumber] = useState("");
  const [tripActive, setTripActive] = useState(false);

  // Add Bus Form State
  const [busNumber, setBusNumber] = useState("");
  const [from, setFrom] = useState("इचलकरंजी / Ichalkaranji");
  const [to, setTo] = useState("कुरुंदवाड / Kurundwad");
  const [via, setVia] = useState("शिरढोण (Shirdhon), शिरोळ (Shirol), नृसिंहवाडी (Nrusinhawadi)");
  const [driverName, setDriverName] = useState("");

  const t = {
    mr: {
      adminHeader: "🔐 प्रशासन नियंत्रण कक्ष",
      driverHeader: "👨‍✈️ चालक नियंत्रण केंद्र",
      subHeader: "IMTS Smart Transport Management",
      passengerScreen: "प्रवासी स्क्रीन ➔",
      adminTab: "🏢 प्रशासन (Admin)",
      driverTab: "👨‍✈️ चालक (Driver)",
      addFormTitle: "➕ नवीन बस व मार्ग नोंदणी",
      busNoLabel: "बस क्रमांक (Bus Number)",
      busNoPlaceholder: "उदा. MH-09-EM-2303",
      fromLabel: "सुरुवात ठिकाण (Origin - मराठी / English)",
      fromPlaceholder: "उदा. सांगली / Sangli",
      toLabel: "गंतव्य ठिकाण (Destination - मराठी / English)",
      toPlaceholder: "उदा. इचलकरंजी / Ichalkaranji",
      viaLabel: "मधले थांबे (मराठी व English नावे स्वल्पविरामाने)",
      viaPlaceholder: "उदा. उदगाव (Udgav), शिरढोण (Shirdhon)",
      driverLabel: "सारथी / चालकाचे नाव (मराठी / English)",
      driverPlaceholder: "उदा. संजय पाटील / Sanjay Patil",
      saveBusBtn: "बस सिस्टिममध्ये जोडा ✓",
      activeBusesTitle: "सध्या कार्यरत बसेस",
      refreshBtn: "🔄 रिफ्रेश",
      driverPrefix: "चालक",
      controlBtn: "नियंत्रण ➔",
      deleteBtn: "हटवा ✕",
      goToDriverBtn: "👨‍✈️ चालक नियंत्रण विभागात जा ➔",
      selectBusTitle: "🎯 नियंत्रण करण्यासाठी बस निवडा:",
      routePrefix: "मार्ग",
      stopTrip: "🛑 GPS ट्रिप थांबवा (Stop Trip)",
      startTrip: "▶ लाईव्ह GPS ट्रिप सुरू करा (Start Trip)",
      crowdTitle: "👥 बसमधील गर्दी स्थिती अपडेट करा:",
      crowdLow: "🟢 जागा उपलब्ध",
      crowdMed: "🟡 उभे राहणे",
      crowdHigh: "🔴 पूर्ण गर्दी",
      sosTitle: "🚨 आपत्कालीन नियंत्रण (Emergency SOS):",
      sosBtn: "SOS अलर्ट जारी करा",
      clearSos: "बंद करा",
      backToAdminBtn: "← 🏢 प्रशासन (बस व्यवस्थापन) विभागात परत जा"
    },
    en: {
      adminHeader: "🔐 Admin Control Center",
      driverHeader: "👨‍✈️ Driver Cockpit Control",
      subHeader: "IMTS Smart Transport Management",
      passengerScreen: "Passenger View ➔",
      adminTab: "🏢 Admin Panel",
      driverTab: "👨‍✈️ Driver Controls",
      addFormTitle: "➕ Register New Bus & Route",
      busNoLabel: "Bus Number",
      busNoPlaceholder: "e.g. MH-09-EM-2303",
      fromLabel: "Origin Station (English / मराठी)",
      fromPlaceholder: "e.g. Sangli / सांगली",
      toLabel: "Destination Station (English / मराठी)",
      toPlaceholder: "e.g. Ichalkaranji / इचलकरंजी",
      viaLabel: "Intermediate Stops (English & मराठी comma separated)",
      viaPlaceholder: "e.g. Udgav (उदगाव), Shirdhon (शिरढोण)",
      driverLabel: "Driver Name (English / मराठी)",
      driverPlaceholder: "e.g. Sanjay Patil / संजय पाटील",
      saveBusBtn: "Save Bus to System ✓",
      activeBusesTitle: "Active Buses in Fleet",
      refreshBtn: "🔄 Refresh",
      driverPrefix: "Driver",
      controlBtn: "Control ➔",
      deleteBtn: "Delete ✕",
      goToDriverBtn: "👨‍✈️ Go to Driver Control Section ➔",
      selectBusTitle: "🎯 Select Bus to Control:",
      routePrefix: "Route",
      stopTrip: "🛑 Stop GPS Trip",
      startTrip: "▶ Start Live GPS Trip",
      crowdTitle: "👥 Update Live Bus Crowd Status:",
      crowdLow: "🟢 Seats Available",
      crowdMed: "🟡 Standing",
      crowdHigh: "🔴 Full Crowd",
      sosTitle: "🚨 Emergency SOS Control:",
      sosBtn: "Broadcast SOS Alert",
      clearSos: "Clear",
      backToAdminBtn: "← 🏢 Back to Admin Management"
    }
  }[lang];

  const loadBuses = async () => {
    try {
      const savedLang = await AsyncStorage.getItem("appLang");
      if (savedLang === "en" || savedLang === "mr") setLang(savedLang);

      const res = await axios.get(`${BASE_URL}/api/buses`, { timeout: 6000 });
      if (res.data?.data) {
        setBuses(res.data.data);
        if (res.data.data.length > 0 && !selectedBusNumber) {
          setSelectedBusNumber(res.data.data[0].busNumber);
        }
      }
    } catch (e: any) {
      console.log("Load Buses Error:", e.message);
    }
  };

  useEffect(() => {
    loadBuses();
  }, []);

  const toggleLanguage = async () => {
    const nextLang = lang === "mr" ? "en" : "mr";
    setLang(nextLang);
    await AsyncStorage.setItem("appLang", nextLang);
  };

  const currentSelectedBusObj = buses.find((b) => b.busNumber === selectedBusNumber);

  const updateCrowdStatus = async (level: "low" | "medium" | "high") => {
    if (!selectedBusNumber) return;
    try {
      await axios.post(`${BASE_URL}/api/driver/update-status`, {
        busNumber: selectedBusNumber,
        status: "running",
        crowdLevel: level
      });
      Alert.alert("✓", `${selectedBusNumber} updated!`);
      loadBuses();
    } catch {
      Alert.alert("Error", "Update failed.");
    }
  };

  const toggleSOSAlert = (activate: boolean) => {
    if (!selectedBusNumber) return;

    if (!activate) {
      axios
        .post(`${BASE_URL}/api/driver/sos-alert`, { busNumber: selectedBusNumber, active: false })
        .then(() => {
          Alert.alert("✓", "SOS Cleared.");
          loadBuses();
        });
      return;
    }

    Alert.alert("🚨 SOS", `Send emergency alert for ${selectedBusNumber}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send",
        style: "destructive",
        onPress: async () => {
          try {
            await axios.post(`${BASE_URL}/api/driver/sos-alert`, {
              busNumber: selectedBusNumber,
              reason: lang === "mr" ? "तांत्रिक बिघाड / तातडीची मदत आवश्यक" : "Technical Breakdown / Urgent Help Needed",
              active: true
            });
            Alert.alert("✓", "Alert Broadcasted!");
            loadBuses();
          } catch {
            Alert.alert("Error", "SOS failed.");
          }
        }
      }
    ]);
  };

  const addBus = async () => {
    if (!busNumber.trim()) {
      Alert.alert("Required", "Please enter Bus Number.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/admin/buses`, {
        busNumber: busNumber.trim().toUpperCase(),
        from: from.trim(),
        to: to.trim(),
        via: via.split(",").map((s) => s.trim()).filter(Boolean),
        driverName: driverName.trim() || "IMTS Driver"
      });

      if (res.data?.success) {
        Alert.alert("✓", `Bus ${busNumber.toUpperCase()} saved!`);
        setBusNumber("");
        setDriverName("");
        loadBuses();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to add bus.");
    } finally {
      setLoading(false);
    }
  };

  const deleteBus = (item: any) => {
    const targetNumber = item?.busNumber || "Bus";
    const targetId = item?._id;

    Alert.alert("Delete Bus", `Remove ${targetNumber} permanently?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await axios.post(`${BASE_URL}/api/admin/buses/delete`, {
              busNumber: targetNumber,
              busId: targetId
            });

            if (res.data?.success) {
              Alert.alert("✓", "Bus deleted!");
              loadBuses();
            }
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Delete failed.");
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeMode === "admin" ? t.adminHeader : t.driverHeader}
          </Text>
          <Text style={styles.headerSub}>{t.subHeader}</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6 }}>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{lang === "mr" ? "EN 🌐" : "मराठी 🇮🇳"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace("/")}>
            <Text style={styles.homeBtnText}>{t.passengerScreen}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Switcher Buttons */}
      <View style={styles.switcherContainer}>
        <TouchableOpacity
          style={[styles.switchBtn, activeMode === "admin" && styles.activeSwitchBtn]}
          onPress={() => setActiveMode("admin")}
        >
          <Text style={[styles.switchBtnText, activeMode === "admin" && styles.activeSwitchBtnText]}>{t.adminTab}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchBtn, activeMode === "driver" && styles.activeSwitchBtn]}
          onPress={() => setActiveMode("driver")}
        >
          <Text style={[styles.switchBtnText, activeMode === "driver" && styles.activeSwitchBtnText]}>{t.driverTab}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {activeMode === "admin" ? (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.addFormTitle}</Text>

              <Text style={styles.inputLabel}>{t.busNoLabel}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.busNoPlaceholder}
                placeholderTextColor="#94a3b8"
                value={busNumber}
                onChangeText={setBusNumber}
                autoCapitalize="characters"
              />

              <Text style={styles.inputLabel}>{t.fromLabel}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.fromPlaceholder}
                placeholderTextColor="#94a3b8"
                value={from}
                onChangeText={setFrom}
                keyboardType="default"
              />

              <Text style={styles.inputLabel}>{t.toLabel}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.toPlaceholder}
                placeholderTextColor="#94a3b8"
                value={to}
                onChangeText={setTo}
                keyboardType="default"
              />

              <Text style={styles.inputLabel}>{t.viaLabel}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.viaPlaceholder}
                placeholderTextColor="#94a3b8"
                value={via}
                onChangeText={setVia}
                keyboardType="default"
              />

              <Text style={styles.inputLabel}>{t.driverLabel}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.driverPlaceholder}
                placeholderTextColor="#94a3b8"
                value={driverName}
                onChangeText={setDriverName}
                keyboardType="default"
              />

              <TouchableOpacity style={styles.primaryActionBtn} onPress={addBus} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryActionText}>{t.saveBusBtn}</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.listTitle}>{t.activeBusesTitle} ({buses.length})</Text>
              <TouchableOpacity onPress={loadBuses}>
                <Text style={styles.refreshText}>{t.refreshBtn}</Text>
              </TouchableOpacity>
            </View>

            {buses.map((item: any) => (
              <View key={item._id} style={styles.busRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.busRowNumber}>{item.busNumber}</Text>
                  <Text style={styles.busRowRoute}>{item.route?.from} ➔ {item.route?.to}</Text>
                  <Text style={styles.busRowDriver}>{t.driverPrefix}: {item.driverName || "IMTS"}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TouchableOpacity
                    style={styles.quickDriverBtn}
                    onPress={() => {
                      setSelectedBusNumber(item.busNumber);
                      setActiveMode("driver");
                    }}
                  >
                    <Text style={styles.quickDriverBtnText}>{t.controlBtn}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteBus(item)}>
                    <Text style={styles.deleteBtnText}>{t.deleteBtn}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.navJumpBtn} onPress={() => setActiveMode("driver")}>
              <Text style={styles.navJumpText}>{t.goToDriverBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.selectBusTitle}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                {buses.map((b: any) => (
                  <TouchableOpacity
                    key={b._id}
                    style={[styles.busSelectPill, selectedBusNumber === b.busNumber && styles.activeBusSelectPill]}
                    onPress={() => setSelectedBusNumber(b.busNumber)}
                  >
                    <Text
                      style={[
                        styles.busSelectPillText,
                        selectedBusNumber === b.busNumber && { color: "#ffffff", fontWeight: "bold" }
                      ]}
                    >
                      {b.busNumber}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {currentSelectedBusObj && (
                <View style={styles.selectedInfoBox}>
                  <Text style={styles.selectedBusTitle}>{currentSelectedBusObj.busNumber}</Text>
                  <Text style={styles.selectedRouteSub}>
                    {t.routePrefix}: {currentSelectedBusObj.route?.from} ➔ {currentSelectedBusObj.route?.to}
                  </Text>
                  <Text style={styles.selectedDriverSub}>{t.driverPrefix}: {currentSelectedBusObj.driverName}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.tripBtn, tripActive && { backgroundColor: "#ef4444" }]}
                onPress={() => setTripActive(!tripActive)}
              >
                <Text style={styles.tripBtnText}>{tripActive ? t.stopTrip : t.startTrip}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.crowdTitle}</Text>
              <View style={styles.crowdRow}>
                <TouchableOpacity
                  style={[styles.crowdBtn, { backgroundColor: "#dcfce7", borderColor: "#86efac" }]}
                  onPress={() => updateCrowdStatus("low")}
                >
                  <Text style={{ color: "#15803d", fontWeight: "bold", fontSize: 12 }}>{t.crowdLow}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.crowdBtn, { backgroundColor: "#fef9c3", borderColor: "#fde047" }]}
                  onPress={() => updateCrowdStatus("medium")}
                >
                  <Text style={{ color: "#a16207", fontWeight: "bold", fontSize: 12 }}>{t.crowdMed}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.crowdBtn, { backgroundColor: "#fee2e2", borderColor: "#fca5a5" }]}
                  onPress={() => updateCrowdStatus("high")}
                >
                  <Text style={{ color: "#b91c1c", fontWeight: "bold", fontSize: 12 }}>{t.crowdHigh}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={[styles.card, { borderColor: "#fecaca" }]}>
              <Text style={[styles.cardTitle, { color: "#dc2626" }]}>{t.sosTitle}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity style={[styles.sosBtn, { flex: 1 }]} onPress={() => toggleSOSAlert(true)}>
                  <Text style={styles.sosBtnText}>{t.sosBtn}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearSosBtn} onPress={() => toggleSOSAlert(false)}>
                  <Text style={styles.clearSosText}>{t.clearSos}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.navJumpBtn} onPress={() => setActiveMode("admin")}>
              <Text style={styles.navJumpText}>{t.backToAdminBtn}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f1f5f9" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  headerTitle: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  headerSub: { fontSize: 11, color: "#64748b" },
  langBtn: { backgroundColor: "#eff6ff", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: "#bfdbfe" },
  langBtnText: { color: "#1d4ed8", fontWeight: "bold", fontSize: 11 },
  homeBtn: { backgroundColor: "#e0f2fe", paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8 },
  homeBtnText: { color: "#0369a1", fontWeight: "bold", fontSize: 11 },
  switcherContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0"
  },
  switchBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  activeSwitchBtn: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  switchBtnText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  activeSwitchBtnText: { color: "#ffffff", fontWeight: "bold" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2
  },
  cardTitle: { fontSize: 14, fontWeight: "bold", color: "#0284c7", marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#475569", marginBottom: 4 },
  field: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0f172a",
    marginBottom: 12
  },
  primaryActionBtn: { backgroundColor: "#0284c7", paddingVertical: 13, borderRadius: 10, alignItems: "center", marginTop: 4 },
  primaryActionText: { color: "#ffffff", fontWeight: "bold", fontSize: 14 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  listTitle: { fontSize: 14, fontWeight: "bold", color: "#334155" },
  refreshText: { fontSize: 12, color: "#0284c7", fontWeight: "bold" },
  busRow: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  busRowNumber: { fontSize: 14, fontWeight: "bold", color: "#0f172a" },
  busRowRoute: { fontSize: 12, color: "#64748b", marginTop: 2 },
  busRowDriver: { fontSize: 11, color: "#0284c7", marginTop: 2 },
  quickDriverBtn: { backgroundColor: "#e0f2fe", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  quickDriverBtnText: { color: "#0369a1", fontWeight: "bold", fontSize: 11 },
  deleteBtn: { backgroundColor: "#fee2e2", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  deleteBtnText: { color: "#dc2626", fontWeight: "bold", fontSize: 11 },
  busSelectPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  activeBusSelectPill: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  busSelectPillText: { fontSize: 12, color: "#334155" },
  selectedInfoBox: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  selectedBusTitle: { fontSize: 16, fontWeight: "bold", color: "#0369a1" },
  selectedRouteSub: { fontSize: 13, color: "#1e293b", marginTop: 2 },
  selectedDriverSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  tripBtn: { backgroundColor: "#10b981", paddingVertical: 13, borderRadius: 10, alignItems: "center" },
  tripBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 },
  crowdRow: { flexDirection: "row", gap: 8 },
  crowdBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 8, borderWidth: 1 },
  sosBtn: { backgroundColor: "#ef4444", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  sosBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 },
  clearSosBtn: { backgroundColor: "#f1f5f9", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, justifyContent: "center" },
  clearSosText: { color: "#475569", fontWeight: "bold", fontSize: 12 },
  navJumpBtn: {
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#0284c7"
  },
  navJumpText: { color: "#0284c7", fontWeight: "bold", fontSize: 13 }
});