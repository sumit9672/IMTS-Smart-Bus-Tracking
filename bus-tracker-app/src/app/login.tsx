import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://imts-smart-bus-tracking.onrender.com";

export default function AuthScreen() {
  const router = useRouter();

  const [lang, setLang] = useState<"mr" | "en">("mr");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"passenger" | "admin">("passenger");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpInputRef = useRef<TextInput>(null);

  const t = {
    mr: {
      title: "IMTS स्मार्ट बस सेवा",
      sub: "इचलकरंजी महानगरपालिका स्मार्ट ट्रान्सपोर्ट पोर्टल",
      passengerTab: "👤 प्रवासी (User)",
      adminTab: "🔐 प्रशासक (Admin)",
      signIn: "Sign In (लॉगिन)",
      signUp: "Sign Up (नोंदणी)",
      adminPortal: "🔐 मुख्य प्रशासक व चालक नियंत्रण केंद्र",
      userSignInTitle: "👋 प्रवासी लॉगिन",
      userSignUpTitle: "📝 नवीन प्रवासी खाते नोंदणी",
      fullName: "पूर्ण नाव (मराठी किंवा English मध्ये)",
      namePlaceholder: "उदा. सुमित कोळी / Sumit Koli",
      mobile: "मोबाईल क्रमांक (पर्यायी)",
      mobilePlaceholder: "१० अंकी मोबाईल नंबर",
      adminEmail: "Admin Email ID",
      userEmail: "Gmail / Email पत्ता",
      password: "पासवर्ड",
      passPlaceholder: "किमान ६ अक्षरी पासवर्ड",
      adminBtn: "Admin डॅशबोर्ड उघडा ➔",
      loginBtn: "लॉगिन करा ➔",
      createBtn: "खाते तयार करा ✓",
      forgotOtp: "🔑 पासवर्ड आठवत नाही? Email OTP ने लॉगिन करा",
      getOtp: "Email वर OTP मिळवा ➔",
      enterOtp: "ईमेलवर आलेला ६-अंकी OTP",
      verifyBtn: "पडताळणी करून लॉगिन करा ✓",
      backToPass: "← परत पासवर्डने लॉगिन करा",
      reqTitle: "माहिती आवश्यक",
      reqMsg: "ईमेल आणि पासवर्ड दोन्ही आवश्यक आहेत.",
      signUpReqMsg: "पूर्ण नाव, ईमेल आणि पासवर्ड आवश्यक आहे.",
      passLenMsg: "पासवर्ड किमान ६ अक्षरांचा असावा.",
      loginFail: "लॉगिन अयशस्वी",
      regSuccess: "नोंदणी यशस्वी! 🎉",
      regMsg: "खाते तयार झाले आहे.",
      startBtn: "सुरू करा"
    },
    en: {
      title: "IMTS Smart Bus Service",
      sub: "Ichalkaranji Municipal Smart Transport Portal",
      passengerTab: "👤 Passenger (User)",
      adminTab: "🔐 Admin Control",
      signIn: "Sign In",
      signUp: "Sign Up",
      adminPortal: "🔐 Chief Admin & Driver Control Center",
      userSignInTitle: "👋 Passenger Sign In",
      userSignUpTitle: "📝 New Passenger Registration",
      fullName: "Full Name (English or Marathi)",
      namePlaceholder: "e.g. Sumit Koli / सुमित कोळी",
      mobile: "Mobile Number (Optional)",
      mobilePlaceholder: "10-digit mobile number",
      adminEmail: "Admin Email ID",
      userEmail: "Gmail / Email Address",
      password: "Password",
      passPlaceholder: "Minimum 6 characters",
      adminBtn: "Open Admin Dashboard ➔",
      loginBtn: "Sign In ➔",
      createBtn: "Create Account ✓",
      forgotOtp: "🔑 Forgot password? Login via Email OTP",
      getOtp: "Get OTP on Email ➔",
      enterOtp: "Enter 6-digit OTP sent to Email",
      verifyBtn: "Verify & Sign In ✓",
      backToPass: "← Back to Password Login",
      reqTitle: "Required Info",
      reqMsg: "Both Email and Password are required.",
      signUpReqMsg: "Full Name, Email, and Password are required.",
      passLenMsg: "Password must be at least 6 characters long.",
      loginFail: "Login Failed",
      regSuccess: "Registration Successful! 🎉",
      regMsg: "Your account has been created.",
      startBtn: "Continue"
    }
  }[lang];

  const handleSignIn = async () => {
    if (Platform.OS !== "web") Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || (!useOtpLogin && !cleanPass)) {
      Alert.alert(t.reqTitle, t.reqMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/signin`, {
        email: cleanEmail,
        password: cleanPass,
        role
      });

      if (res.data?.success) {
        const u = res.data.user;
        await AsyncStorage.setItem("userRole", u.role || role);
        await AsyncStorage.setItem("userName", u.name || (role === "admin" ? "Chief Admin" : "Passenger"));
        await AsyncStorage.setItem("userEmail", u.email || cleanEmail);
        await AsyncStorage.setItem("appLang", lang);

        if (role === "admin") router.replace("/admin");
        else router.replace("/");
      }
    } catch (err: any) {
      Alert.alert(t.loginFail, err.response?.data?.message || t.loginFail);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (Platform.OS !== "web") Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!name.trim() || !cleanEmail || !cleanPass) {
      Alert.alert(t.reqTitle, t.signUpReqMsg);
      return;
    }

    if (cleanPass.length < 6) {
      Alert.alert(t.reqTitle, t.passLenMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/signup`, {
        name: name.trim(),
        email: cleanEmail,
        phone: phone.trim(),
        password: cleanPass,
        role: "passenger"
      });

      if (res.data?.success) {
        Alert.alert(t.regSuccess, t.regMsg, [
          {
            text: t.startBtn,
            onPress: async () => {
              const u = res.data.user;
              await AsyncStorage.setItem("userRole", "passenger");
              await AsyncStorage.setItem("userName", u.name);
              await AsyncStorage.setItem("userEmail", u.email);
              await AsyncStorage.setItem("appLang", lang);
              router.replace("/");
            }
          }
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (Platform.OS !== "web") Keyboard.dismiss();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      Alert.alert(t.reqTitle, t.reqMsg);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/send-otp`, { email: cleanEmail });
      if (res.data?.success) {
        setOtpSent(true);
        setTimeout(() => otpInputRef.current?.focus(), 300);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/verify-login`, {
        email: cleanEmail,
        otp: cleanOtp,
        role,
        name: name.trim()
      });

      if (res.data?.success) {
        const u = res.data.user;
        await AsyncStorage.setItem("userRole", u.role || role);
        await AsyncStorage.setItem("userName", u.name || "Passenger");
        await AsyncStorage.setItem("userEmail", u.email || cleanEmail);
        await AsyncStorage.setItem("appLang", lang);

        if (role === "admin") router.replace("/admin");
        else router.replace("/");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.responsiveWrapper}>
        {/* Top Language Switcher */}
        <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
          <TouchableOpacity style={styles.langToggleBtn} onPress={() => setLang(lang === "mr" ? "en" : "mr")}>
            <Text style={styles.langToggleText}>{lang === "mr" ? "🌐 Switch to English" : "🇮🇳 मराठीत पहा"}</Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.brandBox}>
          <View style={styles.logoBadge}>
            <Text style={{ fontSize: 36 }}>🚍</Text>
          </View>
          <Text style={styles.brandTitle}>{t.title}</Text>
          <Text style={styles.brandSub}>{t.sub}</Text>
        </View>

        {/* Role Selector */}
        <View style={styles.rolePicker}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "passenger" && styles.activeRoleBtn]}
            onPress={() => {
              setRole("passenger");
              setAuthMode("signin");
              setUseOtpLogin(false);
            }}
          >
            <Text style={[styles.roleBtnText, role === "passenger" && styles.activeRoleBtnText]}>{t.passengerTab}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, role === "admin" && styles.activeRoleBtn]}
            onPress={() => {
              setRole("admin");
              setAuthMode("signin");
              setUseOtpLogin(false);
            }}
          >
            <Text style={[styles.roleBtnText, role === "admin" && styles.activeRoleBtnText]}>{t.adminTab}</Text>
          </TouchableOpacity>
        </View>

        {/* Main Card */}
        <View style={styles.authCard}>
          {role === "passenger" && (
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, authMode === "signin" && styles.activeTabBtn]}
                onPress={() => {
                  setAuthMode("signin");
                  setUseOtpLogin(false);
                }}
              >
                <Text style={[styles.tabText, authMode === "signin" && styles.activeTabText]}>{t.signIn}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, authMode === "signup" && styles.activeTabBtn]}
                onPress={() => {
                  setAuthMode("signup");
                  setUseOtpLogin(false);
                }}
              >
                <Text style={[styles.tabText, authMode === "signup" && styles.activeTabText]}>{t.signUp}</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.formTitle}>
            {role === "admin" ? t.adminPortal : authMode === "signin" ? t.userSignInTitle : t.userSignUpTitle}
          </Text>

          {authMode === "signup" && role === "passenger" && (
            <View>
              <Text style={styles.inputTitle}>{t.fullName}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.namePlaceholder}
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
                keyboardType="default"
              />

              <Text style={styles.inputTitle}>{t.mobile}</Text>
              <TextInput
                style={styles.field}
                placeholder={t.mobilePlaceholder}
                placeholderTextColor="#94a3b8"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          )}

          <Text style={styles.inputTitle}>{role === "admin" ? t.adminEmail : t.userEmail}</Text>
          <TextInput
            style={styles.field}
            placeholder={role === "admin" ? "admin@imts.gov.in" : "yourname@gmail.com"}
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {!useOtpLogin ? (
            <View>
              <Text style={styles.inputTitle}>{t.password}</Text>
              <TextInput
                style={styles.field}
                placeholder={role === "admin" ? "Admin@2026" : t.passPlaceholder}
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={authMode === "signin" ? handleSignIn : handleSignUp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {role === "admin" ? t.adminBtn : authMode === "signin" ? t.loginBtn : t.createBtn}
                  </Text>
                )}
              </TouchableOpacity>

              {role === "passenger" && authMode === "signin" && (
                <TouchableOpacity style={styles.switchLoginMode} onPress={() => setUseOtpLogin(true)}>
                  <Text style={styles.switchLoginModeText}>{t.forgotOtp}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              {!otpSent ? (
                <TouchableOpacity style={styles.submitBtn} onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t.getOtp}</Text>}
                </TouchableOpacity>
              ) : (
                <View>
                  <Text style={styles.inputTitle}>{t.enterOtp}</Text>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpInputField}
                    placeholder="• • • • • •"
                    placeholderTextColor="#cbd5e1"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <TouchableOpacity style={styles.submitBtn} onPress={handleVerifyOtp} disabled={loading} activeOpacity={0.85}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t.verifyBtn}</Text>}
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity style={styles.switchLoginMode} onPress={() => setUseOtpLogin(false)}>
                <Text style={styles.switchLoginModeText}>{t.backToPass}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      {Platform.OS === "web" ? (
        renderFormContent()
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          {renderFormContent()}
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f1f5f9" },
  scrollContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  responsiveWrapper: { width: "100%", maxWidth: 460 },
  langToggleBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1"
  },
  langToggleText: { fontSize: 12, fontWeight: "bold", color: "#0369a1" },
  brandBox: { alignItems: "center", marginBottom: 18 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 3
  },
  brandTitle: { fontSize: 23, fontWeight: "bold", color: "#0369a1", letterSpacing: 0.3 },
  brandSub: { fontSize: 12, color: "#64748b", marginTop: 4, textAlign: "center" },
  rolePicker: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  roleBtn: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 8 },
  activeRoleBtn: { backgroundColor: "#0284c7" },
  roleBtnText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  activeRoleBtnText: { color: "#ffffff", fontWeight: "bold" },
  authCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#f1f5f9",
    marginBottom: 16
  },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center" },
  activeTabBtn: { borderBottomWidth: 2.5, borderBottomColor: "#0284c7" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  activeTabText: { color: "#0284c7", fontWeight: "bold" },
  formTitle: { fontSize: 15, fontWeight: "bold", color: "#0f172a", textAlign: "center", marginBottom: 14 },
  inputTitle: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 6 },
  field: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.2,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 14
  },
  submitBtn: {
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6
  },
  submitBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },
  switchLoginMode: { marginTop: 14, alignItems: "center" },
  switchLoginModeText: { color: "#0284c7", fontWeight: "600", fontSize: 13 },
  otpInputField: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1.5,
    borderColor: "#22c55e",
    borderRadius: 10,
    paddingVertical: 12,
    fontSize: 22,
    color: "#15803d",
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "bold",
    marginBottom: 14
  }
});