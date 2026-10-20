// Default photos for rituals, duas and landing sections.
// Photos live in client/public/images/.
// If an admin picks an image from the Media Library, that image is used;
// otherwise these defaults are shown, so nothing looks empty.

const IMG = (name) => `/images/${name}`;

// Order matters: the first matching rule wins (specific rules before generic).
const RULES = [
  [/qudum|arrival/, "kaaba-tawaf.jpg"],
  [/ifadah/, "tawaf-crowd.jpg"],
  [/wada|farewell/, "kaaba-arch.jpg"],
  [/tawaf|kaaba|kabah|haram/, "tawaf-crowd.jpg"],
  [/sa'?i|safa|marwa/, "haram-interior.jpg"],
  [/arafat|arafah|wuquf|rahmah/, "arafat-jabal-rahmah.jpg"],
  [/muzdalifah/, "pilgrims-walking.jpg"],
  [/jamarat|rami|stoning|pebble/, "jamarat.jpg"],
  [/qurbani|sacrifice|hady/, "pilgrims-crowd.jpg"],
  [/halq|taqsir|shav|trim/, "ihram-prayer.jpg"],
  [/mina/, "pilgrims-crowd.jpg"],
  [/ihram|miqat|niyyah|talbiyah/, "ihram-walking.jpg"],
  [/madinah|medina|nabawi/, "green-dome.jpg"],
];

/**
 * Returns the default image for a ritual step / dua location.
 * @param {...string} texts  step name, location, etc.
 * @param fallback used when nothing matches (pass as last arg via getRitualImageOr)
 */
export function getRitualImage(...texts) {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  for (const [re, file] of RULES) {
    if (re.test(hay)) return IMG(file);
  }
  return IMG("haram-courtyard.jpg");
}

// For duas: match by step/location, else show the "dua hands" photo.
export function getDuaImage(...texts) {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  if (!hay.trim()) return IMG("dua-hands.jpg");
  for (const [re, file] of RULES) {
    if (re.test(hay)) return IMG(file);
  }
  return IMG("dua-hands.jpg");
}

// Landing page "4 stages" photos
export const STAGE_IMAGES = {
  prepare: IMG("makkah-clock-tower.jpg"),
  ihram: IMG("ihram-walking.jpg"),
  rituals: IMG("tawaf-crowd.jpg"),
  return: IMG("green-dome.jpg"),
};

// Login / register / verify side panel
export const AUTH_IMAGES = {
  login: IMG("makkah-clock-tower.jpg"),
  register: IMG("kaaba-tawaf.jpg"),
  verify: IMG("kaaba-door.jpg"),
};
