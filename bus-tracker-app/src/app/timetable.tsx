import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const TIMETABLE = [
  { time: "06:30 AM", route: "इचलकरंजी ➔ कुरुंदवाड", type: "नियमित" },
  { time: "07:15 AM", route: "इचलकरंजी ➔ कोल्हापूर", type: "जलद" },
  { time: "08:00 AM", route: "इचलकरंजी ➔ कुरुंदवाड", type: "नियमित" },
  { time: "09:30 AM", route: "इचलकरंजी ➔ सांगली", type: "नियमित" },
  { time: "11:00 AM", route: "इचलकरंजी ➔ कुरुंदवाड", type: "नियमित" },
  { time: "01:30 PM", route: "इचलकरंजी ➔ कोल्हापूर", type: "जलद" },
  { time: "04:00 PM", route: "इचलकरंजी ➔ कुरुंदवाड", type: "नियमित" },
  { time: "06:30 PM", route: "इचलकरंजी ➔ कुरुंदवाड", type: "रात्र सेवा" }
];

export default function TimetableScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← मागे</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🕒 बस वेळापत्रक (Timetable)</Text>
      </View>

      <FlatList
        data={TIMETABLE}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.routeText}>{item.route}</Text>
              <Text style={styles.typeText}>{item.type}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: "#0284c7", borderRadius: 8, marginRight: 12 },
  backBtnText: { color: "#fff", fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 10, elevation: 2 },
  timeBadge: { backgroundColor: "#0284c7", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  timeText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  routeText: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  typeText: { fontSize: 12, color: "#64748b", marginTop: 2 }
});