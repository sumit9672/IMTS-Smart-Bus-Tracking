import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

const FARES: Record<string, number> = {
  "इचलकरंजी-कबनूर": 10,
  "इचलकरंजी-शिरढोण": 15,
  "इचलकरंजी-शिरोळ": 25,
  "इचलकरंजी-नृसिंहवाडी": 30,
  "इचलकरंजी-कुरुंदवाड": 35,
  "इचलकरंजी-हातकणंगले": 20,
  "इचलकरंजी-कोल्हापूर": 45,
  "इचलकरंजी-जयसिंगपूर": 25,
  "इचलकरंजी-सांगली": 40
};

export default function FareScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← मागे</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎫 तिकीट दर पत्रक (Fare List)</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {Object.entries(FARES).map(([route, price], idx) => (
          <View key={idx} style={styles.fareRow}>
            <Text style={styles.routeText}>{route}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>₹ {price}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: { padding: 8, backgroundColor: "#0284c7", borderRadius: 8, marginRight: 12 },
  backBtnText: { color: "#fff", fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },
  fareRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 10, elevation: 2 },
  routeText: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  badge: { backgroundColor: "#e0f2fe", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { fontSize: 16, fontWeight: "bold", color: "#0369a1" }
});