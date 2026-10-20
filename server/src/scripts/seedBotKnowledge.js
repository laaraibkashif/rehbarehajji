/**
 * seedBotKnowledge — Seeds the KnowledgeEntry collection with 10 Q&A pairs
 * covering core ritual, emergency, and dua topics for the bot verification suite.
 *
 * Usage:
 *   node src/scripts/seedBotKnowledge.js
 *
 * Requires a running MongoDB instance (reads MONGO_URI from env or defaults).
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const KnowledgeEntry = require("../models/KnowledgeEntry");

const SEED_DATA = [
  {
    topic: "Tawaf",
    question: "What is Tawaf?",
    answer:
      "Tawaf is the act of circling the Kaaba seven times in a counter-clockwise direction. It is a core ritual of both Hajj and Umrah. Each complete circle is called a shawt. Pilgrims begin at the Black Stone (Hajar al-Aswad) and end each circuit there. The first three circuits are performed at a faster pace (ramal) for men, while the remaining four are at a normal pace.",
    category: "ritual",
    tags: ["tawaf", "kaaba", "circumambulation"],
  },
  {
    topic: "Ihram",
    question: "What are the rules of Ihram?",
    answer:
      "Ihram is a sacred state that pilgrims enter before performing Hajj or Umrah. While in Ihram, men wear two white, unstitched cloths (izar and rida); women wear modest ordinary clothing. Prohibitions include: cutting nails or hair, using perfume, hunting, engaging in marital relations, and wearing stitched garments (for men). Before entering Ihram, pilgrims perform ghusl (ritual bath), pray two rakats, and make the intention (niyyah) at the Miqat boundary.",
    category: "ihram",
    tags: ["ihram", "rules", "restrictions", "miqat"],
  },
  {
    topic: "Umrah Steps",
    question: "How do I perform Umrah step by step?",
    answer:
      "Umrah consists of four main steps: 1) Enter the state of Ihram at the Miqat with ghusl, two rakats, and intention. 2) Perform Tawaf — circling the Kaaba seven times counter-clockwise, starting at the Black Stone. 3) Perform Sa'i — walking seven times between the hills of Safa and Marwah. 4) Shave or trim the hair (Halq for men, Taqsir for women), which exits you from Ihram. Umrah can be performed at any time of the year except during the five days of Hajj (8th–12th Dhul Hijjah).",
    category: "ritual",
    tags: ["umrah", "steps", "procedure"],
  },
  {
    topic: "Dua at Arafat",
    question: "What dua should I recite at Arafat?",
    answer:
      "The best dua at Arafat is: 'La ilaha illallah, wahdahu la sharika lah, lahul mulku wa lahul hamd, wa huwa ala kulli shay'in qadeer.' (There is no god but Allah alone, with no partner; to Him belongs all dominion and praise, and He has power over all things). The Prophet Muhammad (peace be upon him) said the best supplication is that of the Day of Arafat. Raise your hands, face the Qibla, and make sincere dua for yourself, your family, and the entire Ummah. There is no specific required wording — pour your heart out in any language.",
    category: "dua",
    tags: ["arafat", "dua", "supplication"],
  },
  {
    topic: "Sa'i",
    question: "What is Sa'i and how is it performed?",
    answer:
      "Sa'i is the ritual of walking seven times between the hills of Safa and Marwah, located inside the Masjid al-Haram in Makkah. It commemorates Hajar's (peace be upon her) search for water for her son Ismail. Pilgrims begin at Safa, walk toward Marwah, and return — that counts as one circuit. The total is seven circuits, ending at Marwah. Men are encouraged to jog between the two green markers (the area known as the 'valley'). Sa'i is obligatory (wajib) for both Hajj and Umrah.",
    category: "ritual",
    tags: ["sai", "safa", "marwah"],
  },
  {
    topic: "Ramy al-Jamarat",
    question: "How is the stoning of the devil (Ramy) performed?",
    answer:
      "Ramy al-Jamarat is the ritual of throwing pebbles at three pillars in Mina. It takes place on the 10th, 11th, 12th, and optionally 13th of Dhul Hijjah. Pilgrims throw seven pebbles at each pillar (first Jamarah (al-Sughra), middle Jamarah (al-Wusta), and great Jamarah (al-Aqaba)). Pebbles should be small, about the size of a chickpea. On the 10th, only the great Jamarah is stoned. Each pebble is thrown with the takbir 'Allahu Akbar.' The ritual symbolizes rejecting the whispers of Shaytan, following the example of Prophet Ibrahim.",
    category: "ritual",
    tags: ["ramy", "jamarat", "stoning", "mina"],
  },
  {
    topic: "Emergency",
    question: "What should I do in a medical emergency during Hajj?",
    answer:
      "If you face a medical emergency during Hajj, immediately contact the nearest medical clinic or first-aid station. Every camp and major site (Mina, Arafat, Muzdalifah, and the Haram) has dedicated medical facilities. Call Saudi emergency services at 997 for an ambulance. Your Hajj group organizer should have emergency contact numbers. Keep your passport, Hajj ID, and any medical documents with you at all times. In Makkah, major hospitals include King Abdulaziz Hospital and Al Noor Specialist Hospital.",
    category: "emergency",
    tags: ["emergency", "medical", "hospital", "safety"],
  },
  {
    topic: "Hajj Steps",
    question: "What are the key steps of Hajj in order?",
    answer:
      "Hajj occurs from the 8th to the 12th of Dhul Hijjah. Key steps in order: 1) 8th Dhul Hijjah (Tarwiyah Day) — Enter Ihram and proceed to Mina. 2) 9th Dhul Hijjah (Day of Arafat) — Stand at Arafat from noon to sunset (Wuquf); this is the most essential pillar of Hajj. 3) After sunset — Move to Muzdalifah, spend the night, and collect pebbles. 4) 10th Dhul Hijjah (Eid al-Adha) — Stone the great Jamarah, sacrifice an animal (Qurbani/Hadi), shave or trim hair, perform Tawaf al-Ifadah. 5) 11th–12th — Continue stoning the three Jamarat in Mina. 6) Perform Tawaf al-Wida (farewell Tawaf) before leaving Makkah.",
    category: "ritual",
    tags: ["hajj", "steps", "schedule", "dhul hijjah"],
  },
  {
    topic: "Miqat",
    question: "Where are the Miqat boundaries for Ihram?",
    answer:
      "The Miqat are the designated boundaries where pilgrims must enter the state of Ihram before proceeding to Makkah. There are five main Miqat: 1) Dhul Hulayfah (Abyar Ali) — for pilgrims coming from Madinah direction, about 450 km from Makkah. 2) Al-Juhfah (near Rabigh) — for those coming from the north/west (Egypt, Syria, and the Levant). 3) Qarn al-Manazil (al-Sayl al-Kabir) — for those from Najd and the east. 4) Yalamlam — for those coming from Yemen and the south. 5) Dhat Irq — for those from Iraq and the northeast. Pilgrims traveling by air should enter Ihram before crossing the Miqat line marked on the aircraft route.",
    category: "logistics",
    tags: ["miqat", "ihram", "boundary", "location"],
  },
  {
    topic: "Dua after Prayer",
    question: "What are the recommended duas after Salah?",
    answer:
      "After each obligatory prayer (Salah), it is sunnah to recite: 'Astaghfirullah' (three times), 'Allahumma antas-salam wa minkas-salam, tabarakta ya dhal-jalali wal-ikram.' Then recite Ayat al-Kursi, Subhanallah (33 times), Alhamdulillah (33 times), Allahu Akbar (33 times), and complete with 'La ilaha illallah wahdahu la sharika lah...' While performing Hajj and Umrah, you can also make sincere duas in your own language after Salah, asking Allah for forgiveness, health, and acceptance of your pilgrimage.",
    category: "dua",
    tags: ["dua", "salah", "prayer", "after-prayer"],
  },
];

async function seed() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/rehbar-e-hajji";
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}`);

  // Remove existing entries to get a clean slate
  const deleted = await KnowledgeEntry.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing entries`);

  const created = await KnowledgeEntry.insertMany(SEED_DATA);
  console.log(`Seeded ${created.length} knowledge entries`);

  console.log("\nSeeded topics:");
  SEED_DATA.forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.category}] ${d.topic}: ${d.question}`);
  });

  await mongoose.disconnect();
  console.log("\nDone. Disconnected.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
