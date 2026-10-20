require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const EmergencyContact = require("../models/EmergencyContact");

const contacts = [
  // ── Medical ──
  {
    name: "Makkah Medical Center (Al-Noor Specialist Hospital)",
    category: "medical",
    phoneNumber: "+966125453000",
    region: "Makkah",
  },
  {
    name: "King Abdulaziz Hospital Makkah",
    category: "medical",
    phoneNumber: "+966125568000",
    region: "Makkah",
  },
  {
    name: "Hira General Hospital",
    category: "medical",
    phoneNumber: "+966125261515",
    region: "Makkah",
  },
  {
    name: "Mina Emergency Clinic",
    category: "medical",
    phoneNumber: "+966125202020",
    region: "Mina",
  },
  {
    name: "Arafat Field Hospital",
    category: "medical",
    phoneNumber: "+966125303030",
    region: "Arafat",
  },
  {
    name: "Muzdalifah Emergency Post",
    category: "medical",
    phoneNumber: "+966125404040",
    region: "Muzdalifah",
  },
  {
    name: "Madinah Maternity & Children's Hospital",
    category: "medical",
    phoneNumber: "+966148478888",
    region: "Madinah",
  },
  {
    name: "Ohud Hospital Madinah",
    category: "medical",
    phoneNumber: "+966148232000",
    region: "Madinah",
  },

  // ── Helplines ──
  {
    name: "Saudi Red Crescent (Emergency Ambulance)",
    category: "helpline",
    phoneNumber: "997",
    region: "Saudi Arabia (nationwide)",
  },
  {
    name: "Saudi Police Emergency",
    category: "helpline",
    phoneNumber: "999",
    region: "Saudi Arabia (nationwide)",
  },
  {
    name: "Saudi Civil Defense (Fire / Rescue)",
    category: "helpline",
    phoneNumber: "998",
    region: "Saudi Arabia (nationwide)",
  },
  {
    name: "Highway Security / Traffic Police",
    category: "helpline",
    phoneNumber: "993",
    region: "Saudi Arabia (nationwide)",
  },
  {
    name: "Hajj & Umrah Ministry Hotline",
    category: "helpline",
    phoneNumber: "+966920002897",
    region: "Saudi Arabia (nationwide)",
  },
  {
    name: "Lost Pilgrims Assistance (Tawaf Centers)",
    category: "helpline",
    phoneNumber: "1966",
    region: "Makkah & Madinah",
  },

  // ── Embassies (placeholders) ──
  {
    name: "US Consulate – Jeddah",
    category: "embassy",
    phoneNumber: "+966122208888",
    region: "Jeddah",
  },
  {
    name: "UK Embassy – Riyadh",
    category: "embassy",
    phoneNumber: "+966114892300",
    region: "Riyadh",
  },
  {
    name: "Canadian Embassy – Riyadh",
    category: "embassy",
    phoneNumber: "+966114322000",
    region: "Riyadh",
  },
  {
    name: "Australian Embassy – Riyadh",
    category: "embassy",
    phoneNumber: "+966114359400",
    region: "Riyadh",
  },
  {
    name: "Indian Embassy – Riyadh",
    category: "embassy",
    phoneNumber: "+966114887700",
    region: "Riyadh",
  },
  {
    name: "Pakistan Embassy – Riyadh",
    category: "embassy",
    phoneNumber: "+966114887977",
    region: "Riyadh",
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await EmergencyContact.deleteMany({});
    console.log("Cleared existing EmergencyContact collection");

    await EmergencyContact.insertMany(contacts);
    console.log(`Inserted ${contacts.length} emergency contacts`);

    const count = await EmergencyContact.countDocuments();
    console.log(`Collection now has ${count} documents`);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
}

seed();
