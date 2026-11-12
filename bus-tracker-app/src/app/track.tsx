import React, { useState, useEffect, useRef, useMemo } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { io } from "socket.io-client";

const SOCKET_URL = "http://10.25.53.195:5000";

let WebView: any = null;
if (Platform.OS !== "web") {
  WebView = require("react-native-webview").WebView;
}

// Kolhapur to Kurundwad/Sangli route ke sabhi exact road stops coordinates
const CITIES_COORDS: Record<string, { lat: number; lng: number; nameMr: string }> = {
  kolhapur: { lat: 16.7050, lng: 74.2433, nameMr: "कोल्हापूर" },
  shiroli: { lat: 16.7460, lng: 74.3120, nameMr: "शिरोली" },
  shirolifata: { lat: 16.7460, lng: 74.3120, nameMr: "शिरोली फाटा" },
  tilwani: { lat: 16.7280, lng: 74.3980, nameMr: "तिळवणी" },
  hatkanangle: { lat: 16.7450, lng: 74.4440, nameMr: "हातकणंगले" },
  ichalkaranji: { lat: 16.6913, lng: 74.4608, nameMr: "इचलकरंजी" },
  kabnoor: { lat: 16.7110, lng: 74.4750, nameMr: "कबनूर" },
  shirdhon: { lat: 16.7050, lng: 74.5200, nameMr: "शिरढोण" },
  jaysingpur: { lat: 16.7820, lng: 74.5570, nameMr: "जयसिंगपूर" },
  shirol: { lat: 16.7210, lng: 74.5950, nameMr: "शिरोळ" },
  narsingpur: { lat: 16.7020, lng: 74.6180, nameMr: "नृसिंहवाडी" },
  wadi: { lat: 16.7020, lng: 74.6180, nameMr: "नृसिंहवाडी" },
  kurundwad: { lat: 16.6850, lng: 74.6390, nameMr: "कुरुंदवाड" },
  akiwat: { lat: 16.6620, lng: 74.6650, nameMr: "आकिवाट" },
  sangli: { lat: 16.8524, lng: 74.5815, nameMr: "सांगली" }
};

const getCoordinates = (cityName: string, fallback: { lat: number; lng: number }) => {
  if (!cityName) return fallback;
  const clean = cityName.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, "");
  for (const key of Object.keys(CITIES_COORDS)) {
    const item = CITIES_COORDS[key];
    const keyClean = key.replace(/[^a-z0-9]/g, "");
    if (clean.includes(keyClean) || clean.includes(item.nameMr)) {
      return item;
    }
  }
  return fallback;
};

export default function TrackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const busId = (params.busId as string) || "";
  const busNumber = (params.busNumber as string) || "MH-09-IMTS-2026";
  const routeFrom = (params.routeFrom as string) || "कोल्हापूर";
  const routeTo = (params.routeTo as string) || "कुरुंदवाड";
  const rawVia = (params.viaStops as string) || "";

  const parsedViaList: string[] = useMemo(() => {
    if (!rawVia) return [];
    try {
      const parsed = JSON.parse(rawVia);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return rawVia.split(",").map((s) => s.trim()).filter(Boolean);
  }, [rawVia]);

  const webViewRef = useRef<any>(null);

  const startPoint = useMemo(() => {
    return getCoordinates(routeFrom, { lat: 16.7050, lng: 74.2433 });
  }, [routeFrom]);

  const endPoint = useMemo(() => {
    return getCoordinates(routeTo, { lat: 16.6850, lng: 74.6390 });
  }, [routeTo]);

  // Stops ko road ke flow me sequence karna (West to East longitude sorting)
  const orderedStops = useMemo(() => {
    const viaResolved = parsedViaList.map((stopName, idx) => {
      const fallbackLat = startPoint.lat + ((endPoint.lat - startPoint.lat) * (idx + 1)) / (parsedViaList.length + 1);
      const fallbackLng = startPoint.lng + ((endPoint.lng - startPoint.lng) * (idx + 1)) / (parsedViaList.length + 1);
      const coord = getCoordinates(stopName, { lat: fallbackLat, lng: fallbackLng });
      return {
        name: stopName,
        lat: coord.lat,
        lng: coord.lng,
        isTerminal: false,
        color: "#16a34a"
      };
    });

    // West se East ke order me sort taaki seedha rasta bane
    const isWestToEast = startPoint.lng < endPoint.lng;
    const sortedVia = [...viaResolved].sort((a, b) => {
      return isWestToEast ? a.lng - b.lng : b.lng - a.lng;
    });

    return [
      { name: `सुरुवात: ${routeFrom}`, lat: startPoint.lat, lng: startPoint.lng, isTerminal: true, color: "#0284c7" },
      ...sortedVia,
      { name: `गंतव्य: ${routeTo}`, lat: endPoint.lat, lng: endPoint.lng, isTerminal: true, color: "#ea580c" }
    ];
  }, [parsedViaList, startPoint, endPoint, routeFrom, routeTo]);

  const [location, setLocation] = useState({
    latitude: startPoint.lat,
    longitude: startPoint.lng,
    speed: 38
  });

  const [eta, setEta] = useState("१५ मिनिटे");

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socket.on("connect", () => {
      socket.emit("join_bus_room", busId);
    });

    socket.on("bus_location_changed", (data: any) => {
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      const spd = Number(data.speed) || 35;

      setLocation({ latitude: lat, longitude: lng, speed: spd });

      const updateScript = `
        if (window.updateBusMarker) {
          window.updateBusMarker(${lat}, ${lng}, "${busNumber}", ${spd});
        }
        true;
      `;

      if (Platform.OS !== "web" && webViewRef.current) {
        webViewRef.current.injectJavaScript(updateScript);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [busId, busNumber]);

  const mapHtml = useMemo(() => {
    const waypointsParam = orderedStops.map((s) => `${s.lng},${s.lat}`).join(";");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${startPoint.lat}, ${startPoint.lng}], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19
            }).addTo(map);

            var stopsData = ${JSON.stringify(orderedStops)};

            stopsData.forEach(function(stop) {
              L.circleMarker([stop.lat, stop.lng], {
                radius: stop.isTerminal ? 8 : 6,
                fillColor: stop.color,
                color: "#ffffff",
                weight: 2,
                fillOpacity: 1
              }).bindPopup("<b>" + stop.name + "</b>").addTo(map);
            });

            var busIcon = L.icon({
              iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
              iconSize: [38, 38],
              iconAnchor: [19, 19],
              popupAnchor: [0, -18]
            });

            var marker = L.marker([${startPoint.lat}, ${startPoint.lng}], { icon: busIcon }).addTo(map);
            marker.bindPopup("<b>${busNumber}</b>").openPopup();

            var routeUrl = "https://router.project-osrm.org/route/v1/driving/${waypointsParam}?overview=full&geometries=geojson";

            fetch(routeUrl)
              .then(function(res) { return res.json(); })
              .then(function(data) {
                if (data.routes && data.routes.length > 0) {
                  var roadCoords = data.routes[0].geometry.coordinates.map(function(c) {
                    return [c[1], c[0]];
                  });

                  var polyline = L.polyline(roadCoords, {
                    color: '#0284c7',
                    weight: 6,
                    opacity: 0.9
                  }).addTo(map);

                  map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

                  var pathIndex = 0;
                  var stepSize = Math.max(1, Math.floor(roadCoords.length / 90));

                  setInterval(function() {
                    pathIndex = (pathIndex + stepSize) % roadCoords.length;
                    var pt = roadCoords[pathIndex];
                    marker.setLatLng(pt);

                    var currentSpeed = Math.floor(Math.random() * 10) + 35;
                    marker.getPopup().setContent("<b>${busNumber}</b><br>वेग: " + currentSpeed + " km/h");
                  }, 1200);

                } else {
                  var fallbackCoords = stopsData.map(function(s) { return [s.lat, s.lng]; });
                  var directLine = L.polyline(fallbackCoords, { color: '#0284c7', weight: 4 }).addTo(map);
                  map.fitBounds(directLine.getBounds(), { padding: [40, 40] });
                }
              })
              .catch(function(e) {
                console.log("OSRM Error: ", e);
              });

            window.updateBusMarker = function(lat, lng, name, spd) {
              marker.setLatLng([lat, lng]);
              marker.getPopup().setContent("<b>" + name + "</b><br>वेग: " + spd + " km/h");
            };
          </script>
        </body>
      </html>
    `;
  }, [orderedStops, startPoint, busNumber]);

  const displayViaText = useMemo(() => {
    if (parsedViaList.length === 0) return "थेट मार्ग";
    return parsedViaList.join(" ➔ ");
  }, [parsedViaList]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← मागे</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{busNumber}</Text>
          <Text style={styles.headerSubTitle} numberOfLines={1}>
            मार्ग: {routeFrom} ➔ {routeTo}
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <iframe
            id="web-map-frame"
            srcDoc={mapHtml}
            style={{ width: "100%", height: "100%", border: "none" }}
          />
        ) : (
          <WebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            style={styles.map}
          />
        )}
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>मार्गावरील थांबे (Via Stops)</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {displayViaText}
            </Text>
          </View>
          <View style={styles.alignRight}>
            <Text style={styles.cardLabel}>अंदाजित वेळ (ETA)</Text>
            <Text style={styles.etaHighlight}>{eta}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusRow}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>● मार्गावरून थेट ट्रॅकिंग</Text>
          </View>
          <Text style={styles.speedText}>चालू वेग: {location.speed} km/h</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingTop: 45,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#0284c7",
    flexDirection: "row",
    alignItems: "center"
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#ffffff33",
    borderRadius: 8,
    marginRight: 14
  },
  backBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "bold" },
  headerSubTitle: { color: "#e0f2fe", fontSize: 12 },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  bottomCard: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 16,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardLabel: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  cardValue: { fontSize: 14, fontWeight: "bold", color: "#0f172a" },
  alignRight: { alignItems: "flex-end", minWidth: 100 },
  etaHighlight: { fontSize: 15, fontWeight: "bold", color: "#ea580c" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusBadge: { backgroundColor: "#dcfce7", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusBadgeText: { color: "#15803d", fontSize: 12, fontWeight: "bold" },
  speedText: { fontSize: 14, fontWeight: "bold", color: "#0284c7" }
});