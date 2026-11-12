import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import axios from "axios";

const BASE_URL = "http://10.25.53.195:5000";

export default function DriverDashboard() {
  const router = useRouter();
  const [busNumber] = useState("MH-09-EM-2303");
  const [crowd, setCrowd] = useState<"low" | "medium" | "high">("medium");
  const [tripActive, setTripActive] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. Live Crowd Indicator Update
  const updateCrowd = async (level: "low" | "medium" | "high") => {
    setCrowd(level);
    try {
      await axios.post(`${BASE_URL}/api/driver/update-status`, {
        busNumber,
        status: "running",
        crowdLevel: level
      });
      Alert.alert("अपडेट", "प्रवाशांना बसमधील गर्दीची माहिती पाठवली आहे.");
    } catch {
      Alert.alert("त्रुटी", "गर्दी अपडेट करता आली नाही.");
    }
  };

  // 2. SOS Emergency Dispatch
  const sendSOS = () => {
    Alert.alert("🚨 आपत्कालीन इशारा (SOS)", "तुम्हाला कंट्रोल रूमला तातडीचा मदतीचा संदेश पाठवायचा आहे का?", [
      { text: "रद्द करा", style: "cancel" },
      {
        text: "मदत पाठवा (SOS)",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await axios.post(`${BASE_URL}/api/driver/sos-alert`, {
              busNumber,
              reason: "ब्रेकडाउन / तातडीची मदत आवश्यक"
            });
            Alert.alert("अलर्ट जारी!", "कंट्रोल रूम आणि प्रशासनाला तुमचा संदेश पाठवला आहे.");
          } catch {
            Alert.alert("त्रुटी", "SOS संदेश पाठवता आला नाही.");
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍✈️ ड्रायव्हर कॉकपिट</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/")}>
          <Text style={styles.backBtnText}>होम ⎋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.busNoBadge}>नियुक्त बस: {busNumber}</Text>
        <Text style={styles.routeText}>मार्ग: इचलकरंजी ➔ कुरुंदवाड</Text>

        <TouchableOpacity
          style={[styles.tripBtn, tripActive && { backgroundColor: "#ef4444" }]}
          onPress={() => setTripActive(!tripActive)}
        >
          <Text style={styles.tripBtnText}>
            {tripActive ? "🛑 ट्रिप समाप्त करा (Stop GPS)" : "▶ ट्रिप सुरू करा (Broadcast Live GPS)"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Advance Feature: Live Crowd Control */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>👥 बसमधील गर्दी दर्शक (Live Crowd Update)</Text>
        <View style={styles.crowdRow}>
          <TouchableOpacity
            style={[styles.crowdBtn, { backgroundColor: "#dcfce7" }, crowd === "low" && styles.activeCrowd]}
            onPress={() => updateCrowd("low")}
          >
            <Text style={{ color: "#16a34a", fontWeight: "bold" }}>🟢 जागा उपलब्ध</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.crowdBtn, { backgroundColor: "#fef9c3" }, crowd === "medium" && styles.activeCrowd]}
            onPress={() => updateCrowd("medium")}
          >
            <Text style={{ color: "#ca8a04", fontWeight: "bold" }}>🟡 उभे राहणे</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.crowdBtn, { backgroundColor: "#fee2e2" }, crowd === "high" && styles.activeCrowd]}
            onPress={() => updateCrowd("high")}
          >
            <Text style={{ color: "#dc2626", fontWeight: "bold" }}>🔴 पूर्ण गर्दी</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Advance Feature: Emergency SOS Button */}
      <View style={[styles.card, { borderColor: "#fecaca" }]}>
        <Text style={styles.sectionTitle}>⚠️ आपत्कालीन नियंत्रण (Emergency Control)</Text>
        <TouchableOpacity style={styles.sosBtn} onPress={sendSOS} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sosBtnText}>🚨 SOS / ब्रेकडाउन अलर्ट पाठवा</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#0f172a" },
  backBtn: { backgroundColor: "#e2e8f0", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  backBtnText: { color: "#334155", fontWeight: "bold" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16, elevation: 3, borderWidth: 1, borderColor: "#e2e8f0" },
  busNoBadge: { fontSize: 18, fontWeight: "bold", color: "#0284c7" },
  routeText: { fontSize: 14, color: "#64748b", marginVertical: 6 },
  tripBtn: { backgroundColor: "#10b981", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  tripBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#1e293b", marginBottom: 12 },
  crowdRow: { flexDirection: "row", gap: 8 },
  crowdBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, borderWidth: 1.5, borderColor: "transparent" },
  activeCrowd: { borderColor: "#0f172a" },
  sosBtn: { backgroundColor: "#ef4444", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  sosBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 }
});