import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
  Modal,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "http://10.25.53.195:5000";

interface BusItem {
  _id: string;
  busNumber: string;
  driverName?: string;
  route: {
    from: string;
    to: string;
  };
  via: any;
  status: "running" | "delayed" | "breakdown";
  crowdLevel: "low" | "medium" | "high";
  currentLocation?: {
    latitude: number;
    longitude: number;
    speed: number;
  };
  emergencyAlert?: {
    active: boolean;
    message: string;
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const isMounted = useRef(true);
  const hasRedirected = useRef(false);

  const [lang, setLang] = useState<"mr" | "en">("mr");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  const [buses, setBuses] = useState<BusItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedVillage, setSelectedVillage] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "available" | "running">("all");

  const [timelineBus, setTimelineBus] = useState<BusItem | null>(null);

  const t = {
    mr: {
      greeting: "नमस्कार",
      adminRole: "मुख्य प्रशासक",
      userRole: "स्मार्ट प्रवासी",
      logout: "लॉगआउट ⎋",
      logoutConfirmTitle: "लॉगआउट",
      logoutConfirmMsg: "ॲपमधून बाहेर पडायचे आहे का?",
      cancel: "रद्द करा",
      exit: "बाहेर पडा",
      adminBanner: "🔐 प्रशासन व चालक नियंत्रण केंद्रात जा ➔",
      searchPlaceholder: "कोणताही थांबा किंवा गाव शोधा (मराठी / English)...",
      quickStopsLabel: "मध्यवर्ती थांबे (Quick Stop Filters):",
      allTab: "सर्व",
      availTab: "🟢 जागा उपलब्ध",
      runTab: "⚡ थेट चालू",
      loadingText: "माहिती शोधत आहे...",
      emptyTitle: "या थांब्यासाठी बस सापडली नाही",
      emptySub: "वर दिलेला 'सर्व थांबे' पर्याय निवडून पहा.",
      driver: "सारथी",
      crowdLow: "🟢 जागा उपलब्ध",
      crowdHigh: "🔴 पूर्ण गर्दी",
      crowdMed: "🟡 मध्यम",
      fromLabel: "📍 येथून येणारी:",
      toLabel: "➔ दिशेने जाणारी:",
      viaLabel: "मधले थांबे:",
      nonStop: "थेट नॉन-स्टॉप",
      etaLabel: "🕒 थांब्यावर येण्याची वेळ:",
      speedLabel: "⚡ वेग",
      trackBtn: "थांबे व वेळ ➔",
      modalTitle: "🚏 लाईव्ह थांबा ट्रॅकर",
      closeBtn: "बंद करा ✓",
      departed: "सुटली (Departed)",
      passed: "क्रॉस केले (Passed)",
      liveNow: "आता येथे आहे (Live Now)",
      inMins: "मिनिटात",
      alertPrefix: "⚠️ अलर्ट:"
    },
    en: {
      greeting: "Hello",
      adminRole: "Chief Administrator",
      userRole: "Smart Commuter",
      logout: "Logout ⎋",
      logoutConfirmTitle: "Logout",
      logoutConfirmMsg: "Are you sure you want to log out?",
      cancel: "Cancel",
      exit: "Logout",
      adminBanner: "🔐 Open Admin & Driver Control Center ➔",
      searchPlaceholder: "Search any stop or village (English / मराठी)...",
      quickStopsLabel: "Quick Stop Filters:",
      allTab: "All",
      availTab: "🟢 Seats Available",
      runTab: "⚡ Live Running",
      loadingText: "Searching live buses...",
      emptyTitle: "No buses found for this stop",
      emptySub: "Try selecting 'All Stops' above.",
      driver: "Driver",
      crowdLow: "🟢 Seats Available",
      crowdHigh: "🔴 Crowded",
      crowdMed: "🟡 Moderate",
      fromLabel: "📍 Arriving From:",
      toLabel: "➔ Heading Towards:",
      viaLabel: "Via Stops:",
      nonStop: "Direct Non-Stop",
      etaLabel: "🕒 Expected Arrival:",
      speedLabel: "⚡ Speed",
      trackBtn: "Stops & Time ➔",
      modalTitle: "🚏 Live Stop Tracker",
      closeBtn: "Close ✓",
      departed: "Departed",
      passed: "Passed",
      liveNow: "Live Here Now",
      inMins: "mins away",
      alertPrefix: "⚠️ Alert:"
    }
  }[lang];

  const quickStops = [
    { labelMr: "सर्व थांबे", labelEn: "All Stops", value: "" },
    { labelMr: "📍 सांगली", labelEn: "📍 Sangli", value: "sangli" },
    { labelMr: "📍 उदगाव", labelEn: "📍 Udgav", value: "udgav" },
    { labelMr: "📍 शिरढोण", labelEn: "📍 Shirdhon", value: "शिरढोण" },
    { labelMr: "📍 शिरोळ", labelEn: "📍 Shirol", value: "शिरोळ" },
    { labelMr: "📍 नृसिंहवाडी", labelEn: "📍 Nrusinhawadi", value: "नृसिंहवाडी" },
    { labelMr: "📍 कुरुंदवाड", labelEn: "📍 Kurundwad", value: "कुरुंदवाड" },
    { labelMr: "📍 इचलकरंजी", labelEn: "📍 Ichalkaranji", value: "इचलकरंजी" }
  ];

  const fetchBusesOnly = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/buses`, { timeout: 6000 });
      if (isMounted.current && res.data?.data) {
        setBuses(res.data.data);
      }
    } catch (e: any) {
      console.log("Fetch Buses Error:", e.message);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let intervalId: any;

    const initScreen = async () => {
      try {
        const role = await AsyncStorage.getItem("userRole");
        const name = await AsyncStorage.getItem("userName");
        const savedLang = await AsyncStorage.getItem("appLang");

        if (!role) {
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            router.replace("/login");
          }
          return;
        }

        if (isMounted.current) {
          if (savedLang === "en" || savedLang === "mr") setLang(savedLang);
          setUserRole(role);
          setUserName(name || "User");
          setAuthChecked(true);
        }

        await fetchBusesOnly();
        intervalId = setInterval(fetchBusesOnly, 10000);
      } catch (err) {
        console.log("Init Error:", err);
      }
    };

    initScreen();

    return () => {
      isMounted.current = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const toggleLanguage = async () => {
    const nextLang = lang === "mr" ? "en" : "mr";
    setLang(nextLang);
    await AsyncStorage.setItem("appLang", nextLang);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBusesOnly();
  };

  const handleLogout = () => {
    Alert.alert(t.logoutConfirmTitle, t.logoutConfirmMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.exit,
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login");
        }
      }
    ]);
  };

  // Both English and Marathi Deep Search
  const filteredBuses = useMemo(() => {
    const textQuery = searchQuery.trim().toLowerCase();
    const activeFilter = selectedVillage.trim().toLowerCase();

    return buses.filter((bus) => {
      const dump = JSON.stringify(bus).toLowerCase();

      // Cross-language matching helper
      const checkMatch = (term: string) => {
        if (!term) return true;
        if (dump.includes(term)) return true;
        if (term === "sangli" && dump.includes("सांगली")) return true;
        if (term === "udgav" && dump.includes("उदगाव")) return true;
        if (term === "शिरढोण" && dump.includes("shirdhon")) return true;
        if (term === "शिरोळ" && dump.includes("shirol")) return true;
        if (term === "नृसिंहवाडी" && (dump.includes("wadi") || dump.includes("nrusinha"))) return true;
        if (term === "कुरुंदवाड" && dump.includes("kurundwad")) return true;
        if (term === "इचलकरंजी" && dump.includes("ichal")) return true;
        return false;
      };

      if (activeFilter && !checkMatch(activeFilter)) return false;
      if (textQuery && !checkMatch(textQuery)) return false;

      if (filterType === "available") return bus.crowdLevel === "low";
      if (filterType === "running") return bus.status === "running";
      return true;
    });
  }, [buses, searchQuery, selectedVillage, filterType]);

  const getDynamicTimelineStops = (bus: BusItem | null) => {
    if (!bus) return [];

    const startStop = bus.route?.from || (lang === "mr" ? "सुरुवात स्थानक" : "Origin Stand");
    const endStop = bus.route?.to || (lang === "mr" ? "शेवटचे स्थानक" : "Destination Stand");

    let intermediateStops: string[] = [];
    if (Array.isArray(bus.via)) {
      intermediateStops = bus.via.filter((s: string) => typeof s === "string" && s.trim().length > 0);
    } else if (typeof bus.via === "string" && bus.via.trim().length > 0) {
      intermediateStops = bus.via.split(",").map((s: string) => s.trim());
    }

    const cleanIntermediates = Array.from(new Set(intermediateStops)).filter(
      (s) => s.toLowerCase() !== startStop.toLowerCase() && s.toLowerCase() !== endStop.toLowerCase()
    );

    const allStops = [startStop, ...cleanIntermediates, endStop];
    const total = allStops.length;
    const currentLiveIndex = total > 2 ? 1 : 0;

    return allStops.map((stopName, index) => {
      let timeEstimate = "";
      let isPassed = false;
      let isCurrent = false;

      if (index === 0) {
        timeEstimate = t.departed;
        isPassed = true;
      } else if (index < currentLiveIndex) {
        timeEstimate = t.passed;
        isPassed = true;
      } else if (index === currentLiveIndex) {
        timeEstimate = t.liveNow;
        isCurrent = true;
      } else {
        const minutesRemaining = (index - currentLiveIndex) * 12;
        timeEstimate = `${minutesRemaining} ${t.inMins}`;
      }

      return { id: index + 1, name: stopName, time: timeEstimate, isPassed, isCurrent };
    });
  };

  const getArrivalTime = () => {
    const q = (searchQuery + " " + selectedVillage).toLowerCase();
    if (q.includes("उदगाव") || q.includes("udgav")) return lang === "mr" ? "८ मिनिटात (उदगाव बायपास)" : "In 8 mins (Udgav Bypass)";
    if (q.includes("सांगली") || q.includes("sangli")) return lang === "mr" ? "आताच सुटत आहे (सांगली स्थानक)" : "Departing Now (Sangli Stand)";
    if (q.includes("शिरोळ") || q.includes("shirol")) return lang === "mr" ? "१० मिनिटात (शिरोळ थांबा)" : "In 10 mins (Shirol Stop)";
    if (q.includes("शिरढोण") || q.includes("shirdhon")) return lang === "mr" ? "५ मिनिटात (शिरढोण नाका)" : "In 5 mins (Shirdhon Naka)";
    if (q.includes("नृसिंहवाडी") || q.includes("wadi")) return lang === "mr" ? "१५ मिनिटात (नृसिंहवाडी फाटा)" : "In 15 mins (Nrusinhawadi Phata)";
    if (q.includes("कुरुंदवाड") || q.includes("kurundwad")) return lang === "mr" ? "२२ मिनिटात (कुरुंदवाड स्थानक)" : "In 22 mins (Kurundwad Stand)";
    if (q.includes("इचलकरंजी") || q.includes("ichal")) return lang === "mr" ? "१० ते १५ मिनिटात" : "In 10-15 mins";
    return lang === "mr" ? "अंदाजे १० ते १२ मिनिटात" : "Approx. 10-12 mins";
  };

  if (!authChecked) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#0284c7" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f9ff" />

      <View style={styles.maxWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 20 }}>{userRole === "admin" ? "🔐" : "👤"}</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>{t.greeting}, {userName} ✨</Text>
              <Text style={styles.roleSub}>{userRole === "admin" ? t.adminRole : t.userRole}</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnText}>{lang === "mr" ? "English 🌐" : "मराठी 🇮🇳"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>{t.logout}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Admin Shortcut Banner */}
        {userRole === "admin" && (
          <TouchableOpacity style={styles.adminShortcutBanner} onPress={() => router.push("/admin")}>
            <Text style={styles.adminShortcutText}>{t.adminBanner}</Text>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardType="default"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
              <Text style={{ color: "#94a3b8", fontWeight: "bold" }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stop Chips */}
        <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
          <Text style={styles.quickHaltTitle}>{t.quickStopsLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickStopsRow}>
            {quickStops.map((stop, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickStopChip, selectedVillage === stop.value && styles.activeQuickStopChip]}
                onPress={() => setSelectedVillage(stop.value)}
              >
                <Text style={[styles.quickStopText, selectedVillage === stop.value && styles.activeQuickStopText]}>
                  {lang === "mr" ? stop.labelMr : stop.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.chip, filterType === "all" && styles.activeChip]} onPress={() => setFilterType("all")}>
            <Text style={[styles.chipText, filterType === "all" && styles.activeChipText]}>
              {t.allTab} ({filteredBuses.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, filterType === "available" && styles.activeChip]} onPress={() => setFilterType("available")}>
            <Text style={[styles.chipText, filterType === "available" && styles.activeChipText]}>{t.availTab}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, filterType === "running" && styles.activeChip]} onPress={() => setFilterType("running")}>
            <Text style={[styles.chipText, filterType === "running" && styles.activeChipText]}>{t.runTab}</Text>
          </TouchableOpacity>
        </View>

        {/* Bus List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={{ marginTop: 8, color: "#64748b" }}>{t.loadingText}</Text>
          </View>
        ) : (
          <FlatList
            data={filteredBuses}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0284c7"]} />}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 44 }}>🚌</Text>
                <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
                <Text style={styles.emptySub}>{t.emptySub}</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isLow = item.crowdLevel === "low";
              const isHigh = item.crowdLevel === "high";

              let viaDisplay = t.nonStop;
              if (Array.isArray(item.via) && item.via.length > 0) {
                viaDisplay = item.via.filter((s) => typeof s === "string").join(" • ");
              } else if (typeof item.via === "string" && item.via.trim().length > 0) {
                viaDisplay = item.via;
              }

              return (
                <View style={styles.card}>
                  {item.emergencyAlert?.active && (
                    <View style={styles.sosAlertBanner}>
                      <Text style={styles.sosAlertText}>{t.alertPrefix} {item.emergencyAlert.message}</Text>
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <View>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Text style={styles.busNo}>{item.busNumber}</Text>
                        <View style={styles.pulsingDot} />
                      </View>
                      <Text style={styles.driverText}>{t.driver}: {item.driverName || "IMTS"}</Text>
                    </View>

                    <View style={[styles.crowdTag, isLow ? styles.bgGreen : isHigh ? styles.bgRed : styles.bgYellow]}>
                      <Text style={[styles.crowdTagText, isLow ? styles.txtGreen : isHigh ? styles.txtRed : styles.txtYellow]}>
                        {isLow ? t.crowdLow : isHigh ? t.crowdHigh : t.crowdMed}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.directionBox}>
                    <View style={styles.directionRow}>
                      <Text style={styles.directionTag}>{t.fromLabel}</Text>
                      <Text style={styles.directionStation}>{item.route?.from}</Text>
                    </View>
                    <View style={styles.directionRow}>
                      <Text style={styles.directionTag}>{t.toLabel}</Text>
                      <Text style={styles.directionStation}>{item.route?.to}</Text>
                    </View>
                  </View>

                  <View style={styles.viaHaltBadge}>
                    <Text style={styles.viaHaltLabel}>{t.viaLabel} </Text>
                    <Text style={styles.viaHaltValues} numberOfLines={1}>{viaDisplay}</Text>
                  </View>

                  <View style={styles.arrivalNotice}>
                    <Text style={styles.arrivalTitle}>{t.etaLabel}</Text>
                    <Text style={styles.arrivalTime}>{getArrivalTime()}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <Text style={styles.speedText}>{t.speedLabel}: {item.currentLocation?.speed || 38} km/h</Text>
                    <TouchableOpacity style={styles.timelinePrimaryBtn} onPress={() => setTimelineBus(item)}>
                      <Text style={styles.timelinePrimaryText}>{t.trackBtn}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* DYNAMIC ROUTE TIMELINE MODAL */}
      <Modal visible={!!timelineBus} animationType="slide" transparent={true}>
        <View style={styles.modalBackdrop}>
          <View style={styles.timelineModal}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{t.modalTitle}</Text>
                <Text style={styles.modalSub} numberOfLines={1}>
                  {timelineBus?.busNumber} • {timelineBus?.route?.from} ➔ {timelineBus?.route?.to}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setTimelineBus(null)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <View style={styles.timelineContainer}>
                {getDynamicTimelineStops(timelineBus).map((s, idx, arr) => {
                  const isLast = idx === arr.length - 1;
                  return (
                    <View key={s.id} style={styles.timelineItem}>
                      <View style={styles.trackColumn}>
                        {s.isCurrent ? (
                          <View style={styles.currentBusCircle}><Text style={{ fontSize: 13 }}>🚍</Text></View>
                        ) : s.isPassed ? (
                          <View style={styles.passedCircle}><Text style={styles.tickText}>✓</Text></View>
                        ) : (
                          <View style={styles.upcomingCircle} />
                        )}
                        {!isLast && <View style={[styles.verticalLine, s.isPassed ? styles.lineGreen : styles.lineGray]} />}
                      </View>

                      <View style={styles.stopInfoBox}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={[styles.stopName, s.isCurrent && styles.stopNameCurrent]}>{s.name}</Text>
                          {s.isCurrent && <View style={styles.liveTag}><Text style={styles.liveTagText}>LIVE</Text></View>}
                        </View>
                        <Text style={[styles.etaText, s.isCurrent && { color: "#0284c7", fontWeight: "bold" }, s.isPassed && { color: "#16a34a" }]}>
                          🕒 {s.time}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.doneBtn} onPress={() => setTimelineBus(null)}>
              <Text style={styles.doneBtnText}>{t.closeBtn}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f9ff" },
  maxWrapper: { flex: 1, width: "100%", maxWidth: 720, alignSelf: "center", backgroundColor: "#f0f9ff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e0f2fe" },
  userInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e0f2fe", justifyContent: "center", alignItems: "center" },
  greetingText: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  roleSub: { fontSize: 11, color: "#64748b" },
  langBtn: { backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#bfdbfe" },
  langBtnText: { fontSize: 11, fontWeight: "bold", color: "#1d4ed8" },
  logoutBtn: { backgroundColor: "#fee2e2", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  logoutBtnText: { color: "#ef4444", fontWeight: "bold", fontSize: 11 },
  adminShortcutBanner: { backgroundColor: "#0284c7", marginHorizontal: 16, marginTop: 10, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  adminShortcutText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", marginHorizontal: 16, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.4, borderColor: "#38bdf8" },
  searchInput: { flex: 1, fontSize: 13, color: "#0f172a" },
  quickHaltTitle: { fontSize: 11, fontWeight: "bold", color: "#475569", marginBottom: 6 },
  quickStopsRow: { flexDirection: "row", gap: 6 },
  quickStopChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#cbd5e1" },
  activeQuickStopChip: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  quickStopText: { fontSize: 11, fontWeight: "600", color: "#334155" },
  activeQuickStopText: { color: "#ffffff", fontWeight: "bold" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, marginTop: 10, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#ffffff", borderWidth: 1, borderColor: "#e2e8f0" },
  activeChip: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  chipText: { fontSize: 11, fontWeight: "600", color: "#64748b" },
  activeChipText: { color: "#ffffff", fontWeight: "bold" },
  card: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, marginBottom: 14, elevation: 3, borderWidth: 1, borderColor: "#e0f2fe" },
  sosAlertBanner: { backgroundColor: "#fee2e2", padding: 8, borderRadius: 8, marginBottom: 10 },
  sosAlertText: { color: "#b91c1c", fontWeight: "bold", fontSize: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  busNo: { fontSize: 16, fontWeight: "bold", color: "#0369a1" },
  pulsingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10b981" },
  driverText: { fontSize: 12, color: "#64748b", marginTop: 2 },
  crowdTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  crowdTagText: { fontSize: 10, fontWeight: "bold" },
  bgGreen: { backgroundColor: "#dcfce7" },
  txtGreen: { color: "#15803d" },
  bgYellow: { backgroundColor: "#fef9c3" },
  txtYellow: { color: "#a16207" },
  bgRed: { backgroundColor: "#fee2e2" },
  txtRed: { color: "#b91c1c" },
  directionBox: { backgroundColor: "#f8fafc", borderRadius: 10, padding: 10, marginBottom: 8 },
  directionRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 2 },
  directionTag: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  directionStation: { fontSize: 13, fontWeight: "bold", color: "#1e293b" },
  viaHaltBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 8 },
  viaHaltLabel: { fontSize: 11, fontWeight: "bold", color: "#475569" },
  viaHaltValues: { fontSize: 11, color: "#0369a1", flex: 1 },
  arrivalNotice: { backgroundColor: "#ecfdf5", padding: 10, borderRadius: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, borderWidth: 1, borderColor: "#a7f3d0" },
  arrivalTitle: { fontSize: 12, color: "#065f46", fontWeight: "700" },
  arrivalTime: { fontSize: 12, color: "#047857", fontWeight: "bold" },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 10 },
  speedText: { fontSize: 12, fontWeight: "bold", color: "#0f172a" },
  timelinePrimaryBtn: { backgroundColor: "#0284c7", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  timelinePrimaryText: { fontSize: 12, fontWeight: "bold", color: "#ffffff" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingTop: 50 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: "#334155", marginTop: 10 },
  emptySub: { fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 4, paddingHorizontal: 20 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.7)", justifyContent: "center", alignItems: "center", padding: 16 },
  timelineModal: { backgroundColor: "#ffffff", width: "100%", maxWidth: 420, borderRadius: 20, padding: 18, elevation: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 15, fontWeight: "bold", color: "#0f172a" },
  modalSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  modalCloseBtn: { backgroundColor: "#f1f5f9", width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center" },
  modalCloseText: { fontSize: 14, fontWeight: "bold", color: "#64748b" },
  timelineContainer: { paddingLeft: 6, paddingVertical: 8 },
  timelineItem: { flexDirection: "row", minHeight: 64 },
  trackColumn: { alignItems: "center", width: 34 },
  currentBusCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#e0f2fe", borderWidth: 2, borderColor: "#0284c7", justifyContent: "center", alignItems: "center", zIndex: 2 },
  passedCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", zIndex: 2 },
  tickText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
  upcomingCircle: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#ffffff", borderWidth: 3, borderColor: "#cbd5e1", zIndex: 2, marginTop: 4 },
  verticalLine: { width: 3, flex: 1, marginVertical: -2 },
  lineGreen: { backgroundColor: "#16a34a" },
  lineGray: { backgroundColor: "#e2e8f0" },
  stopInfoBox: { flex: 1, marginLeft: 12, paddingBottom: 16 },
  stopName: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  stopNameCurrent: { fontSize: 14, fontWeight: "bold", color: "#0284c7" },
  liveTag: { backgroundColor: "#ef4444", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  liveTagText: { color: "#ffffff", fontSize: 9, fontWeight: "bold" },
  etaText: { fontSize: 11, color: "#64748b", marginTop: 2 },
  doneBtn: { backgroundColor: "#0284c7", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 12 },
  doneBtnText: { color: "#ffffff", fontWeight: "bold", fontSize: 13 }
});