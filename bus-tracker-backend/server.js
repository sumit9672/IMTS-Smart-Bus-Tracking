const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "DELETE"] }
});

// बफरिंग टाइमआऊट एरर कायमचा बंद करण्यासाठी
mongoose.set("bufferCommands", false);

const MONGO_URI = "mongodb+srv://sumitkoli9672_db_user:SumitKoli9672@cluster0.obh2s1p.mongodb.net/busTracking?retryWrites=true&w=majority";

// ================= SCHEMAS =================
const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true, unique: true },
    driverName: { type: String, default: "नियुक्त चालक" },
    driverPhone: { type: String, default: "" },
    route: {
      from: { type: String, default: "इचलकरंजी" },
      to: { type: String, default: "कुरुंदवाड" }
    },
    via: { type: [String], default: ["शिरढोण", "शिरोळ", "नृसिंहवाडी"] },
    status: { type: String, default: "running" },
    crowdLevel: { type: String, default: "low" },
    currentLocation: {
      latitude: { type: Number, default: 16.6913 },
      longitude: { type: Number, default: 74.4608 },
      speed: { type: Number, default: 35 }
    },
    emergencyAlert: {
      active: { type: Boolean, default: false },
      message: { type: String, default: "" }
    }
  },
  { timestamps: true }
);

const Bus = mongoose.models.Bus || mongoose.model("Bus", busSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true },
  role: { type: String, enum: ["passenger", "admin"], default: "passenger" },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

// MongoDB Connect
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  })
  .then(() => console.log(">>> ✅ MongoDB Connected Successfully! <<<"))
  .catch((err) => console.log(">>> ❌ MongoDB Connection Error:", err.message));

const ADMIN_PASSWORD = "Admin@2026";

// ================= APIS =================

// 1. सर्व बसेसची यादी
app.get("/api/buses", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true, data: [] });
    }
    const buses = await Bus.find({}).sort({ updatedAt: -1 }).lean();
    return res.json({ success: true, data: buses });
  } catch (err) {
    return res.json({ success: true, data: [] });
  }
});

// 2. नवीन बस जोडणे (Admin)
app.post("/api/admin/buses", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "डेटाबेस कनेक्ट नाही. इंटरनेट किंवा MongoDB IP तपासा." });
    }

    const { busNumber, from, to, via, driverName } = req.body;
    const cleanNo = String(busNumber || "").trim().toUpperCase();

    if (!cleanNo) {
      return res.status(400).json({ success: false, message: "बस क्रमांक आवश्यक आहे." });
    }

    let viaArray = [];
    if (Array.isArray(via)) {
      viaArray = via.map((v) => String(v).trim()).filter(Boolean);
    } else if (typeof via === "string") {
      viaArray = via.split(",").map((v) => v.trim()).filter(Boolean);
    }

    const newBus = await Bus.findOneAndUpdate(
      { busNumber: cleanNo },
      {
        busNumber: cleanNo,
        driverName: driverName || "नियुक्त चालक",
        route: { from: from || "इचलकरंजी", to: to || "कुरुंदवाड" },
        via: viaArray,
        status: "running"
      },
      { upsert: true, new: true }
    );

    io.emit("bus_info_updated");
    return res.json({ success: true, data: newBus });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. बस कायमची काढणे (Admin Delete)
app.post("/api/admin/buses/delete", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: "डेटाबेस कनेक्ट नाही." });
    }

    const { busNumber, busId } = req.body;
    let deletedBus = null;

    if (busId && mongoose.Types.ObjectId.isValid(busId)) {
      deletedBus = await Bus.findByIdAndDelete(busId);
    }

    if (!deletedBus && busNumber) {
      const cleanPattern = String(busNumber).trim().replace(/\s+/g, "\\s*");
      deletedBus = await Bus.findOneAndDelete({
        busNumber: { $regex: new RegExp(`^${cleanPattern}$`, "i") }
      });
    }

    if (!deletedBus) {
      return res.status(404).json({ success: false, message: "बस सापडली नाही." });
    }

    io.emit("bus_info_updated");
    return res.json({ success: true, message: "बस यशस्वीरीत्या हटवली गेली!" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. चालक कॉकपिट: गर्दी स्थिती व वेग अपडेट करणे
app.post("/api/driver/update-status", async (req, res) => {
  try {
    const { busNumber, status, crowdLevel, speed } = req.body;
    const updateFields = { status, crowdLevel };
    if (speed !== undefined) {
      updateFields["currentLocation.speed"] = Number(speed);
    }

    const updated = await Bus.findOneAndUpdate(
      { busNumber: { $regex: new RegExp(`^${String(busNumber).trim()}$`, "i") } },
      { $set: updateFields },
      { new: true }
    );
    io.emit("bus_info_updated");
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. चालक कॉकपिट: SOS अलर्ट सुरू/बंद करणे
app.post("/api/driver/sos-alert", async (req, res) => {
  try {
    const { busNumber, reason, active = true } = req.body;
    const updated = await Bus.findOneAndUpdate(
      { busNumber: { $regex: new RegExp(`^${String(busNumber).trim()}$`, "i") } },
      { emergencyAlert: { active, message: active ? (reason || "तातडीची मदत आवश्यक!") : "" } },
      { new: true }
    );
    io.emit("bus_info_updated");
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. Auth (Sign In / Sign Up)
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "").trim();

    if (!cleanEmail || !cleanPass || !name) {
      return res.status(400).json({ success: false, message: "सर्व माहिती आवश्यक आहे." });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "हा ईमेल आधीच वापरला आहे." });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      phone: String(phone || "").trim(),
      password: cleanPass,
      role: "passenger"
    });

    return res.json({ success: true, user: newUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPass = String(password || "").trim();

    if (role === "admin") {
      if (cleanPass === ADMIN_PASSWORD) {
        return res.json({ success: true, user: { name: "Chief Controller", email: cleanEmail, role: "admin" } });
      }
      return res.status(401).json({ success: false, message: "चुकीचा Admin पासवर्ड!" });
    }

    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ success: false, message: "खाते सापडले नाही. कृपया नोंदणी करा." });
    if (user.password !== cleanPass) return res.status(400).json({ success: false, message: "चुकीचा पासवर्ड टाकला आहे!" });

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`>>> IMTS Backend Server Live on Port ${PORT} <<<`);
});