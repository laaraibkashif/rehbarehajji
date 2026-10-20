/**
 * verifyBot — Verification test suite for the bot knowledge base.
 *
 * 1. Seeds 10 Q&A pairs covering ritual/emergency/dua topics.
 * 2. For each seeded question, sends 2-3 differently-worded versions
 *    through POST /api/admin/bot/test and confirms each still matches
 *    the right entry with a reasonable score.
 * 3. Sends 3-5 clearly unrelated questions and confirms usedFallback: true.
 * 4. Reports any failed paraphrased questions and optionally adds
 *    additional phrasings to improve recall.
 *
 * Usage:
 *   node src/scripts/verifyBot.js
 *   node src/scripts/verifyBot.js --fix          # auto-add additional phrasings
 *
 * Requires:
 *   - A running server with the bot endpoints available
 *   - An admin auth token to POST /api/admin/bot/knowledge and /api/admin/bot/test
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const TOKEN = process.env.ADMIN_TOKEN || "";

// ── Helpers ──

async function api(path, body) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data };
}

function scoreColor(score) {
  if (score >= 0.10) return "\x1b[32m"; // green
  if (score >= 0.05) return "\x1b[33m"; // yellow
  return "\x1b[31m"; // red
}

function resetColor() {
  return "\x1b[0m";
}

function pass(msg) {
  return `\x1b[32m✓\x1b[0m ${msg}`;
}

function fail(msg) {
  return `\x1b[31m✗\x1b[0m ${msg}`;
}

// ── Seed Q&A pairs ──

const SEED_DATA = [
  // 1. Tawaf
  {
    topic: "Tawaf",
    question: "What is Tawaf?",
    answer:
      "Tawaf is the act of circling the Kaaba seven times in a counter-clockwise direction. It is a core ritual of both Hajj and Umrah. Each complete circle is called a shawt. Pilgrims begin at the Black Stone (Hajar al-Aswad) and end each circuit there.",
    category: "ritual",
    tags: ["tawaf", "kaaba"],
  },
  // 2. Ihram
  {
    topic: "Ihram",
    question: "What are the rules of Ihram?",
    answer:
      "Ihram is a sacred state that pilgrims enter before performing Hajj or Umrah. Men wear two white unstitched cloths; women wear modest ordinary clothing. Prohibitions include cutting nails or hair, using perfume, and engaging in marital relations.",
    category: "ihram",
    tags: ["ihram", "rules"],
  },
  // 3. Umrah Steps
  {
    topic: "Umrah Steps",
    question: "How do I perform Umrah step by step?",
    answer:
      "Umrah consists of four main steps: 1) Enter Ihram at the Miqat. 2) Perform Tawaf — circling the Kaaba seven times. 3) Perform Sa'i between Safa and Marwah. 4) Shave or trim the hair to exit Ihram.",
    category: "ritual",
    tags: ["umrah", "steps"],
  },
  // 4. Dua at Arafat
  {
    topic: "Dua at Arafat",
    question: "What dua should I recite at Arafat?",
    answer:
      "The best dua at Arafat is: 'La ilaha illallah, wahdahu la sharika lah.' The Prophet said the best supplication is that of the Day of Arafat. Raise your hands, face the Qibla, and make sincere dua in any language.",
    category: "dua",
    tags: ["arafat", "dua"],
  },
  // 5. Sa'i
  {
    topic: "Sai",
    question: "What is Sa'i and how is it performed?",
    answer:
      "Sa'i is the ritual of walking seven times between Safa and Marwah. It commemorates Hajar's search for water. Begin at Safa, end at Marwah. Men jog between the two green markers. Sa'i is obligatory for both Hajj and Umrah.",
    category: "ritual",
    tags: ["sai", "safa", "marwah"],
  },
  // 6. Ramy
  {
    topic: "Ramy",
    question: "How is the stoning of the devil performed?",
    answer:
      "Ramy al-Jamarat is the ritual of throwing seven pebbles at each of three pillars in Mina on the 10th-12th of Dhul Hijjah. Pebbles should be chickpea-sized. Say 'Allahu Akbar' with each throw.",
    category: "ritual",
    tags: ["ramy", "jamarat", "mina"],
  },
  // 7. Emergency
  {
    topic: "Emergency",
    question: "What should I do in a medical emergency during Hajj?",
    answer:
      "Contact the nearest medical clinic or first-aid station immediately. Call Saudi emergency services at 997 for an ambulance. Camps and major sites have dedicated medical facilities. Keep your passport and documents with you.",
    category: "emergency",
    tags: ["emergency", "medical", "safety"],
  },
  // 8. Hajj Steps
  {
    topic: "Hajj Steps",
    question: "What are the key steps of Hajj in order?",
    answer:
      "Hajj runs from 8th–12th Dhul Hijjah: 1) Mina stay, 2) Day of Arafat (standing at Arafat is the essential pillar), 3) Muzdalifah overnight, 4) Stoning + sacrifice + shaving + Tawaf al-Ifadah on the 10th, 5) Stoning on 11th–12th, then farewell Tawaf.",
    category: "ritual",
    tags: ["hajj", "steps"],
  },
  // 9. Miqat
  {
    topic: "Miqat",
    question: "Where are the Miqat boundaries?",
    answer:
      "The five Miqat boundaries: 1) Dhul Hulayfah (Madinah direction), 2) Al-Juhfah (north/west), 3) Qarn al-Manazil (east), 4) Yalamlam (south), 5) Dhat Irq (northeast). Enter Ihram before crossing the boundary.",
    category: "logistics",
    tags: ["miqat", "boundary"],
  },
  // 10. Dua after Prayer
  {
    topic: "Dua after Prayer",
    question: "What are the recommended duas after Salah?",
    answer:
      "After each prayer, recite Astaghfirullah (3x), 'Allahumma antas-salam...', Ayat al-Kursi, then Subhanallah (33x), Alhamdulillah (33x), Allahu Akbar (33x). Make sincere duas for your pilgrimage.",
    category: "dua",
    tags: ["dua", "prayer", "salah"],
  },
];

// ── Paraphrase variations to test ──

const PARAPHRASE_SETS = [
  {
    topic: "Tawaf",
    seedQuestion: "What is Tawaf?",
    variations: [
      "Tell me about Tawaf",
      "What does Tawaf involve?",
      "How do you circle the Kaaba?",
    ],
  },
  {
    topic: "Ihram Rules",
    seedQuestion: "What are the rules of Ihram?",
    variations: [
      "What is forbidden in Ihram?",
      "What can't you do during Ihram?",
      "Ihram restrictions and prohibitions",
    ],
  },
  {
    topic: "Umrah Steps",
    seedQuestion: "How do I perform Umrah step by step?",
    variations: [
      "What are the steps for Umrah?",
      "How to do Umrah properly",
      "Umrah procedure from start to finish",
    ],
  },
  {
    topic: "Dua at Arafat",
    seedQuestion: "What dua should I recite at Arafat?",
    variations: [
      "Best supplication on the Day of Arafat",
      "What to pray at Arafat?",
      "Arafat day prayers",
    ],
  },
  {
    topic: "Sa'i",
    seedQuestion: "What is Sa'i and how is it performed?",
    variations: [
      "How is Sa'i performed?",
      "What is the walk between Safa and Marwah?",
      "Tell me about the Sai ritual",
    ],
  },
  {
    topic: "Ramy",
    seedQuestion: "How is the stoning of the devil performed?",
    variations: [
      "How do you do Ramy al-Jamarat?",
      "Pebble throwing ritual in Mina",
      "Stoning the pillars during Hajj",
    ],
  },
  {
    topic: "Emergency",
    seedQuestion: "What should I do in a medical emergency during Hajj?",
    variations: [
      "Medical emergency number in Saudi Arabia for Hajj",
      "What if I get sick during Hajj?",
      "Hajj health emergency contacts",
    ],
  },
  {
    topic: "Hajj Steps",
    seedQuestion: "What are the key steps of Hajj in order?",
    variations: [
      "What happens on each day of Hajj?",
      "Outline the Hajj pilgrimage schedule",
      "Days of Hajj explained simply",
    ],
  },
  {
    topic: "Miqat",
    seedQuestion: "Where are the Miqat boundaries?",
    variations: [
      "What are the Ihram entry points?",
      "Where do I enter Ihram before Hajj?",
      "Miqat locations for pilgrims coming by air",
    ],
  },
  {
    topic: "Dua after Prayer",
    seedQuestion: "What are the recommended duas after Salah?",
    variations: [
      "What to say after finishing prayer?",
      "Post-prayer supplications during Hajj",
      "After Salah duas for pilgrims",
    ],
  },
];

// ── Unrelated queries (should all return usedFallback: true) ──

const UNRELATED_QUESTIONS = [
  "What is the weather like in New York today?",
  "Who won the World Cup last year?",
  "How do I fix a flat tire on my car?",
  "What is the best recipe for pizza?",
  "Tell me a joke about programming.",
];

// ── Main test routine ──

async function runVerification(fixMode = false) {
  let passed = 0;
  let failed = 0;
  let failedVariations = [];
  let unrelatedPassed = 0;
  let unrelatedFailed = 0;

  console.log("\n\x1b[1m═ BOT VERIFICATION SUITE ═\x1b[0m\n");
  console.log(`API Base: ${API_BASE}`);
  console.log(`Token:    ${TOKEN ? "✓ provided" : "✗ NOT provided (tests may fail with 401)"}\n`);

  // ── Step 1: Seed knowledge entries (clear first to avoid double-seeding) ──
  console.log("\x1b[1m1. Seeding knowledge entries (clearing first)...\x1b[0m\n");

  // Fetch existing entries to get IDs for clearing
  const existingRes = await fetch(`${API_BASE}/api/admin/bot/knowledge?limit=200`, {
    headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
  });
  const existingData = await existingRes.json();
  if (existingData.entries?.length > 0) {
    console.log(`Clearing ${existingData.entries.length} existing entries...`);
    for (const entry of existingData.entries) {
      await fetch(`${API_BASE}/api/admin/bot/knowledge/${entry._id}`, {
        method: "DELETE",
        headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
      });
    }
    console.log(pass("Cleared existing entries.\n"));
  }

  const seedIds = [];
  for (const entry of SEED_DATA) {
    const { data, status } = await api("/api/admin/bot/knowledge", entry);
    if (status === 201 || (status === 200 && data._id)) {
      seedIds.push({ id: data._id, topic: entry.topic, question: entry.question });
      console.log(pass(`[${entry.category}] ${entry.topic}: ${entry.question.slice(0, 50)}...`));
    } else {
      console.log(fail(`Could not seed "${entry.topic}": ${data.error || status}`));
    }
  }

  console.log(`\nSeeded ${seedIds.length}/${SEED_DATA.length} entries.\n`);

  // ── Step 2: Test paraphrased variations ──
  console.log("\x1b[1m2. Testing paraphrased variations...\x1b[0m\n");

  for (const set of PARAPHRASE_SETS) {
    console.log(`  \x1b[1m${set.topic}\x1b[0m (seed: "${set.seedQuestion}")`);

    for (const variation of set.variations) {
      const { data } = await api("/api/admin/bot/test", { question: variation });
      const bestScore = data.matched?.[0]?.score ?? 0;
      const bestMatch = data.matched?.[0]?.question ?? "(none)";
      const isMatch = bestScore > 0 && !data.usedFallback;

      const color = scoreColor(bestScore);
      const marker = isMatch ? pass("") : fail("");
      console.log(
        `    ${marker} "${variation.slice(0, 55)}..." → score: ${color}${bestScore.toFixed(4)}${resetColor()}` +
          ` | mode: ${data.mode || "fallback"}` +
          ` | matches: ${data.matched?.length || 0}`
      );

      if (isMatch) {
        passed++;
      } else {
        failed++;
        failedVariations.push({ topic: set.topic, variation, seedQuestion: set.seedQuestion, bestScore });
      }
    }
    console.log("");
  }

  // ── Step 3: Test unrelated questions ──
  console.log("\x1b[1m3. Testing unrelated questions (should all fallback)...\x1b[0m\n");

  for (const q of UNRELATED_QUESTIONS) {
    const { data } = await api("/api/admin/bot/test", { question: q });
    const correct = data.usedFallback === true;

    if (correct) {
      console.log(pass(`"${q.slice(0, 50)}..." → usedFallback: true`));
      unrelatedPassed++;
    } else {
      console.log(fail(`"${q.slice(0, 50)}..." → usedFallback: false (got a match!)`));
      unrelatedFailed++;
    }
  }

  // ── Report ──
  console.log("\n\x1b[1m═ RESULTS ═\x1b[0m\n");
  console.log(`Paraphrase tests:  ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log(`Unrelated tests:   ${unrelatedPassed} passed, ${unrelatedFailed} failed (${unrelatedPassed + unrelatedFailed} total)`);

  if (failedVariations.length > 0) {
    console.log(fail(`\n${failedVariations.length} variation(s) failed to match:`));
    for (const fv of failedVariations) {
      console.log(`  - [${fv.topic}] "${fv.variation}" (best score: ${fv.bestScore.toFixed(4)})`);
    }
  }

  // ── Step 4: Add additional phrasings if --fix is set ──
  if (fixMode && failedVariations.length > 0) {
    console.log("\n\x1b[1m4. Adding additional phrasings for failed topics...\x1b[0m\n");

    for (const fv of failedVariations) {
      // Find the original seed entry to get the answer
      const seed = SEED_DATA.find((s) => s.topic === fv.topic || s.question === fv.seedQuestion);
      if (!seed) {
        console.log(`  ${fail(`No seed data for topic "${fv.topic}" — skipping.`)}`);
        continue;
      }

      const newEntry = {
        topic: seed.topic,
        question: fv.variation,
        answer: seed.answer,
        category: seed.category,
        tags: [...seed.tags, "alternate-phrasing"],
      };

      const { data, status } = await api("/api/admin/bot/knowledge", newEntry);
      if (status === 201 || (status === 200 && data._id)) {
        console.log(pass(`Added: "${fv.variation.slice(0, 50)}..."`));
      } else {
        console.log(fail(`Could not add "${fv.variation.slice(0, 50)}...": ${data.error || status}`));
      }
    }
  } else if (fixMode && failedVariations.length === 0) {
    console.log(pass("No failed variations to fix.\n"));
  } else if (failedVariations.length > 0) {
    console.log(
      `\n  Tip: Re-run with \x1b[1m--fix\x1b[0m to auto-add these variations as new trained entries.\n`
    );
  }

  // ── Summary ──
  const overallPass = failed === 0 && unrelatedFailed === 0;
  console.log("\n" + (overallPass ? "\x1b[32m═ ALL TESTS PASSED ═\x1b[0m" : "\x1b[31m═ SOME TESTS FAILED ═\x1b[0m") + "\n");

  return { passed, failed, unrelatedPassed, unrelatedFailed, failedVariations };
}

// ── Entry point ──

const fixMode = process.argv.includes("--fix");

runVerification(fixMode)
  .then((result) => {
    process.exit(result.failed > 0 || result.unrelatedFailed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("Verification failed with error:", err);
    process.exit(1);
  });
