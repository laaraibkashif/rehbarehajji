require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const RitualStep = require("../models/RitualStep");

const ritualData = {
  hajj: [
    {
      order: 1,
      name: "Ihram",
      description:
        "Enter the state of Ihram at the Miqat (designated boundary). Perform Ghusl (ritual bath), wear Ihram garments, and make the intention (Niyyah) for Hajj. Recite the Talbiyah: 'Labbayk Allahumma Labbayk...'",
      location: "Miqat (boundary point depending on direction of arrival)",
      mediaUrls: {
        image: "/media/hajj/ihram.jpg",
        video: "/media/hajj/ihram.mp4",
        audioDua: "/media/dua/talbiyah.mp3",
      },
      commonErrors: [
        "Crossing the Miqat without entering Ihram",
        "Wearing stitched clothing by men after Ihram",
        "Applying perfume after Ihram",
      ],
    },
    {
      order: 2,
      name: "Tawaf al-Qudum",
      description:
        "Perform the arrival circumambulation around the Kaaba. Walk seven complete circuits counter-clockwise, starting from the Black Stone (Hajar al-Aswad). Men perform Idtiba (uncovering right shoulder) and Raml (brisk walking) in the first three circuits.",
      location: "Masjid al-Haram, Makkah",
      mediaUrls: {
        image: "/media/hajj/tawaf-qudum.jpg",
        video: "/media/hajj/tawaf.mp4",
        audioDua: "/media/dua/tawaf.mp3",
      },
      commonErrors: [
        "Touching the Black Stone when it causes crowding",
        "Performing Tawaf inside the Hijr Ismail area",
        "Facing the wrong direction while making du'a",
      ],
    },
    {
      order: 3,
      name: "Sa'i",
      description:
        "Walk seven times between the hills of Safa and Marwah, following the path of Hagar. Begin at Safa and end at Marwah. Recite the prescribed supplications and increase in remembrance of Allah.",
      location: "Masjid al-Haram, Makkah (Safa–Marwah corridor)",
      mediaUrls: {
        image: "/media/hajj/sai.jpg",
        video: "/media/hajj/sai.mp4",
        audioDua: "/media/dua/sai.mp3",
      },
      commonErrors: [
        "Walking too fast in areas where jogging is prescribed for men",
        "Losing count of the seven circuits",
        "Not making du'a on Safa and Marwah",
      ],
    },
    {
      order: 4,
      name: "Wuquf at Arafat",
      description:
        "The most essential pillar of Hajj. Spend the 9th of Dhul Hijjah standing in supplication and prayer on the plains of Arafat from noon until sunset. Listen to the Khutbah (sermon) and combine Dhuhr and Asr prayers.",
      location: "Plain of Arafat (about 20 km east of Makkah)",
      mediaUrls: {
        image: "/media/hajj/arafat.jpg",
        video: "/media/hajj/arafat.mp4",
        audioDua: "/media/dua/arafat.mp3",
      },
      commonErrors: [
        "Leaving Arafat before sunset",
        "Staying outside the boundaries of Arafat",
        "Not combining prayers properly",
      ],
    },
    {
      order: 5,
      name: "Muzdalifah Night Stay",
      description:
        "After sunset on the 9th, proceed to Muzdalifah and combine Maghrib and Isha prayers. Spend the night under the open sky, gather pebbles (49 or 70) for Jamarat, and engage in dhikr and supplication.",
      location: "Muzdalifah (between Arafat and Mina)",
      mediaUrls: {
        image: "/media/hajj/muzdalifah.jpg",
        video: "/media/hajj/muzdalifah.mp4",
        audioDua: "/media/dua/muzdalifah.mp3",
      },
      commonErrors: [
        "Not spending the entire night in Muzdalifah",
        "Not praying Maghrib and Isha together",
        "Gathering excessively large pebbles",
      ],
    },
    {
      order: 6,
      name: "Jamarat Stoning (Rami)",
      description:
        "On the 10th of Dhul Hijjah, stone the large Jamarat (Jamrat al-Aqaba) with seven pebbles. On the following 2-3 days (Tashreeq), stone all three Jamarat in sequence: the small, middle, and large, each with seven pebbles.",
      location: "Mina (Jamarat Bridge area)",
      mediaUrls: {
        image: "/media/hajj/jamarat.jpg",
        video: "/media/hajj/jamarat.mp4",
        audioDua: "/media/dua/jamarat.mp3",
      },
      commonErrors: [
        "Stoning before Fajr on the first day",
        "Not facing the Qibla when stoning",
        "Hitting people instead of the pillars",
      ],
    },
    {
      order: 7,
      name: "Qurbani (Sacrifice)",
      description:
        "On the 10th of Dhul Hijjah, offer an animal sacrifice (sheep, goat, cow, or camel) following the Sunnah of Prophet Ibrahim. The meat should be distributed in three portions: for yourself, for family, and for the needy.",
      location: "Mina (designated slaughter areas)",
      mediaUrls: {
        image: "/media/hajj/qurbani.jpg",
        video: "/media/hajj/qurbani.mp4",
        audioDua: "/media/dua/qurbani.mp3",
      },
      commonErrors: [
        "Delaying the sacrifice beyond the days of Tashreeq",
        "Sacrificing an animal that does not meet the age/health requirements",
        "Not saying 'Bismillah, Allahu Akbar' at the time of slaughter",
      ],
    },
    {
      order: 8,
      name: "Halq or Taqsir (Shaving/Trimming)",
      description:
        "Men shave their heads completely (Halq) or shorten their hair (Taqsir). Women cut a fingertip-length from their hair. This partially releases you from Ihram restrictions, except marital relations.",
      location: "Mina",
      mediaUrls: {
        image: "/media/hajj/halq.jpg",
        video: "/media/hajj/halq.mp4",
        audioDua: "/media/dua/halq.mp3",
      },
      commonErrors: [
        "Shaving before stoning the Jamarat",
        "Women shaving their heads (only shortening is required)",
        "Not trimming at least a fingertip length",
      ],
    },
    {
      order: 9,
      name: "Tawaf al-Ifadah",
      description:
        "Also known as Tawaf al-Ziyarah, this is a compulsory pillar of Hajj. Perform seven circuits around the Kaaba on the 10th or the following days. After this, all Ihram restrictions are lifted and normal life resumes.",
      location: "Masjid al-Haram, Makkah",
      mediaUrls: {
        image: "/media/hajj/tawaf-ifadah.jpg",
        video: "/media/hajj/tawaf-ifadah.mp4",
        audioDua: "/media/dua/tawaf-ifadah.mp3",
      },
      commonErrors: [
        "Delaying Tawaf al-Ifadah beyond the days of Tashreeq without excuse",
        "Not renewing wudu before Tawaf",
        "Thinking it can be substituted by Tawaf al-Wada",
      ],
    },
    {
      order: 10,
      name: "Tawaf al-Wada (Farewell Tawaf)",
      description:
        "The final rite of Hajj. Before leaving Makkah, perform a farewell circumambulation of the Kaaba (seven circuits). This is the last act in the Kaaba before departing. Women in menstruation or post-natal bleeding are exempt.",
      location: "Masjid al-Haram, Makkah",
      mediaUrls: {
        image: "/media/hajj/tawaf-wada.jpg",
        video: "/media/hajj/tawaf-wada.mp4",
        audioDua: "/media/dua/tawaf-wada.mp3",
      },
      commonErrors: [
        "Engaging in buying/shopping after Tawaf al-Wada before leaving Makkah",
        "Leaving Makkah without performing it (for non-exempt pilgrims)",
        "Thinking it replaces Tawaf al-Ifadah",
      ],
    },
  ],

  umrah: [
    {
      order: 1,
      name: "Ihram",
      description:
        "Enter the state of Ihram at the Miqat. Perform Ghusl, wear Ihram garments, make the intention (Niyyah) for Umrah, and recite the Talbiyah continuously until reaching the Kaaba.",
      location: "Miqat (boundary point depending on direction of arrival)",
      mediaUrls: {
        image: "/media/umrah/ihram.jpg",
        video: "/media/umrah/ihram.mp4",
        audioDua: "/media/dua/talbiyah.mp3",
      },
      commonErrors: [
        "Crossing the Miqat without Ihram",
        "Applying perfume after entering Ihram",
        "Men wearing stitched clothing",
      ],
    },
    {
      order: 2,
      name: "Tawaf",
      description:
        "Perform seven complete circuits around the Kaaba counter-clockwise, starting from the Black Stone. Men perform Idtiba (right shoulder uncovered) and Raml (brisk pace in first three circuits). Touch or signal the Black Stone at each circuit if possible.",
      location: "Masjid al-Haram, Makkah",
      mediaUrls: {
        image: "/media/umrah/tawaf.jpg",
        video: "/media/umrah/tawaf.mp4",
        audioDua: "/media/dua/tawaf.mp3",
      },
      commonErrors: [
        "Touching the Black Stone during crowded times",
        "Stepping inside the Hijr Ismail during Tawaf",
        "Losing count of circuits",
      ],
    },
    {
      order: 3,
      name: "Sa'i",
      description:
        "Walk seven times between Safa and Marwah, starting at Safa and ending at Marwah. Recite the Qur'an and make du'a throughout. Reflect on the perseverance of Hagar (Hajar) in her search for water.",
      location: "Masjid al-Haram, Makkah (Safa–Marwah corridor)",
      mediaUrls: {
        image: "/media/umrah/sai.jpg",
        video: "/media/umrah/sai.mp4",
        audioDua: "/media/dua/sai.mp3",
      },
      commonErrors: [
        "Not ensuring the entire distance is covered each round",
        "Men not jogging in the marked green-light section",
        "Not making du'a on Safa and Marwah",
      ],
    },
    {
      order: 4,
      name: "Halq or Taqsir (Shaving/Trimming)",
      description:
        "Men shave their entire head (Halq — preferred) or trim their hair (Taqsir). Women cut a fingertip-length portion from their hair. This completes Umrah and releases you from all Ihram restrictions.",
      location: "Masjid al-Haram or nearby barber stations",
      mediaUrls: {
        image: "/media/umrah/halq.jpg",
        video: "/media/umrah/halq.mp4",
        audioDua: "/media/dua/halq.mp3",
      },
      commonErrors: [
        "Shaving before completing Sa'i",
        "Women shaving their heads",
        "Not trimming at least a fingertip length of hair",
      ],
    },
  ],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing data
    await RitualStep.deleteMany({});
    console.log("Cleared existing RitualStep collection");

    // Insert Hajj rituals
    const hajjSteps = ritualData.hajj.map((s) => ({ ...s, ritualType: "hajj" }));
    const umrahSteps = ritualData.umrah.map((s) => ({ ...s, ritualType: "umrah" }));

    const allSteps = [...hajjSteps, ...umrahSteps];

    await RitualStep.insertMany(allSteps);
    console.log(`Inserted ${hajjSteps.length} Hajj steps`);
    console.log(`Inserted ${umrahSteps.length} Umrah steps`);
    console.log(`Total: ${allSteps.length} ritual steps`);

    // Confirm
    const count = await RitualStep.countDocuments();
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
