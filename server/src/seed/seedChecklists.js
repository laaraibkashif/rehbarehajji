require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Checklist = require("../models/Checklist");

const defaultPreparationItems = [
  // ── Documents ──
  { label: "Valid passport (6+ months validity)", isChecked: false, group: "Documents" },
  { label: "Hajj/Umrah visa", isChecked: false, group: "Documents" },
  { label: "Copy of important documents (passport, visa, tickets)", isChecked: false, group: "Documents" },
  { label: "Travel insurance documents", isChecked: false, group: "Documents" },

  // ── Ihram & Clothing ──
  { label: "Ihram clothing (two white towels for men, loose modest clothing for women)", isChecked: false, group: "Ihram & Clothing" },
  { label: "Comfortable walking shoes / sandals", isChecked: false, group: "Ihram & Clothing" },

  // ── Health & Hygiene ──
  { label: "Medications (prescription + over-the-counter)", isChecked: false, group: "Health & Hygiene" },
  { label: "First-aid kit (band-aids, antiseptic, pain relievers)", isChecked: false, group: "Health & Hygiene" },
  { label: "Sunscreen and sun hat", isChecked: false, group: "Health & Hygiene" },
  { label: "Hand sanitizer and wet wipes", isChecked: false, group: "Health & Hygiene" },
  { label: "Personal toiletries (travel-size)", isChecked: false, group: "Health & Hygiene" },
  { label: "Identification bracelet (for seniors/children)", isChecked: false, group: "Health & Hygiene" },

  // ── Essentials ──
  { label: "Prayer mat (lightweight travel mat)", isChecked: false, group: "Essentials" },
  { label: "Quran / digital Quran app", isChecked: false, group: "Essentials" },
  { label: "Supplication book / dua cards", isChecked: false, group: "Essentials" },
  { label: "Cash (Saudi Riyals) and credit/debit cards", isChecked: false, group: "Essentials" },
  { label: "Phone charger / power bank", isChecked: false, group: "Essentials" },
  { label: "International adapter", isChecked: false, group: "Essentials" },
  { label: "Reusable water bottle", isChecked: false, group: "Essentials" },
  { label: "Umbrella (for sun protection)", isChecked: false, group: "Essentials" },
  { label: "Snacks (energy bars, dates)", isChecked: false, group: "Essentials" },
  { label: "Small backpack / crossbody bag", isChecked: false, group: "Essentials" },
];

const defaultRitualItems = [
  { label: "Ihram — Enter state of Ihram at Miqat", isChecked: false, group: "Beginning" },
  { label: "Tawaf — 7 circuits around Kaaba", isChecked: false, group: "Core Rites" },
  { label: "Maqam Ibrahim — Pray 2 rak'ahs behind Maqam Ibrahim", isChecked: false, group: "Core Rites" },
  { label: "Zamzam — Drink Zamzam water", isChecked: false, group: "Core Rites" },
  { label: "Sa'i — 7 rounds between Safa and Marwah", isChecked: false, group: "Core Rites" },
  { label: "Halq/Taqsir — Shave or trim hair", isChecked: false, group: "Completion" },
];

// This seed module exports default items used by the checklist controller.
// The controller seeds them per-user on first access, so no database seeding is needed.

module.exports = { defaultPreparationItems, defaultRitualItems };
