// Bangkok skywalk navigation data
// Hybrid model: real station/exit geometry + custom skywalk layer + transfer logic
//
// LINE_ORDER defines station sequence north→south on the Sukhumvit Line.
// To add a station: add one entry to STATIONS, then insert its key into
// LINE_ORDER in the correct position. That's it — routing is generic.

const STATIONS = {
  siam: {
    name: "Siam",
    code: "CEN",
    line: "Sukhumvit + Silom (Interchange)",
    exits: [
      { id: 1, label: "Exit 1", desc: "Siam Square, Rama 1 Rd" },
      { id: 2, label: "Exit 2", desc: "Siam Discovery / MBK skywalk" },
      { id: 3, label: "Exit 3", desc: "Siam Paragon direct skywalk" },
      { id: 4, label: "Exit 4", desc: "Central World skywalk (long covered bridge)" },
      { id: 5, label: "Exit 5", desc: "Hua Chang canal side, Siam Square soi entrance" },
      { id: 6, label: "Exit 6", desc: "Chulalongkorn University side" }
    ],
    skywalk: true,
    skywalkNote: "Siam has the most extensive skywalk web on the network — covered bridges run directly into Paragon, Siam Discovery, and across to Central World/Centara. You can reach all of these without touching street level.",
    interchange: {
      type: "stacked-by-direction",
      headline: "Level = direction, not line",
      levels: [
        {
          level: 4,
          tag: "L4 · Upper",
          direction: "↑ Northbound",
          lines: "Sukhumvit → Mo Chit · Silom → Nat'l Stadium"
        },
        {
          level: 3,
          tag: "L3 · Lower",
          direction: "↓ Southbound",
          lines: "Sukhumvit → Bearing · Silom → Bang Wa"
        }
      ],
      watch: "Same direction = cross platform. Direction change = change levels."
    }
  },
  chitlom: {
    name: "Chit Lom",
    code: "E1",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Central Chidlom direct skywalk" },
      { id: 2, label: "Exit 2", desc: "Gaysorn Plaza skywalk" },
      { id: 3, label: "Exit 3", desc: "Towards Central World (short walk, partly covered)" },
      { id: 4, label: "Exit 4", desc: "Soi Chit Lom / Ratchadamri side" }
    ],
    skywalk: true,
    skywalkNote: "Direct covered skywalk into Central Chidlom (Exit 1) and Gaysorn Plaza (Exit 2). Central World is reachable mostly under cover but requires a short street crossing."
  },
  phloenchit: {
    name: "Phloen Chit",
    code: "E2",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Central Embassy direct skywalk" },
      { id: 2, label: "Exit 2", desc: "Wireless Road side" },
      { id: 3, label: "Exit 3", desc: "Towards Soi Ruamrudee" },
      { id: 4, label: "Exit 4", desc: "Sukhumvit Soi 2 side" }
    ],
    skywalk: true,
    skywalkNote: "Covered skywalk runs directly into Central Embassy from Exit 1."
  },
  nana: {
    name: "Nana",
    code: "E3",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 3/1, Arab Quarter side" },
      { id: 2, label: "Exit 2", desc: "Sukhumvit Soi 4, towards Soi Nana" },
      { id: 3, label: "Exit 3", desc: "Sukhumvit Soi 6 / Beach Road side" },
      { id: 4, label: "Exit 4", desc: "Robinson side, towards Soi 5" }
    ],
    skywalk: false
  },
  asok: {
    name: "Asok",
    code: "E4",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 21 (Asok Montri Rd)" },
      { id: 2, label: "Exit 2", desc: "Terminal 21 direct skywalk link" },
      { id: 3, label: "Exit 3", desc: "Towards MRT Sukhumvit, Soi 19 side" },
      { id: 4, label: "Exit 4", desc: "Sukhumvit Soi 23 side" },
      { id: 5, label: "Exit 5", desc: "Sukhumvit Soi 21, southbound side" },
      { id: 6, label: "Exit 6", desc: "Towards MRT Sukhumvit entrance 3" }
    ],
    skywalk: true,
    skywalkNote: "Covered skywalk connects Exit 2 directly into Terminal 21, 2nd floor.",
    transfer: {
      to: "MRT Sukhumvit (Blue Line)",
      via: "Exit 3 or 6",
      walkMinutes: 4,
      notes: "No direct skywalk to MRT — short street-level walk along Soi 21, mostly shaded by building overhangs. Use Exit 6 for the most direct line to MRT entrance 3."
    }
  },
  phromphong: {
    name: "Phrom Phong",
    code: "E5",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 39 side" },
      { id: 2, label: "Exit 2", desc: "Emporium / Emporium Suites direct skywalk" },
      { id: 5, label: "Exit 5", desc: "EmQuartier skywalk" },
      { id: 6, label: "Exit 6", desc: "Benjasiri Park / EmSphere side" }
    ],
    skywalk: true,
    skywalkNote: "Covered skywalks link Exit 2 to Emporium and Exit 5/6 to EmQuartier and EmSphere — the whole EM District is reachable without touching street level."
  },
  thonglo: {
    name: "Thong Lo",
    code: "E6",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 55 (Thonglor), bar/restaurant side" },
      { id: 3, label: "Exit 3", desc: "Sukhumvit Soi 53 side" },
      { id: 4, label: "Exit 4", desc: "J Avenue / residential side" }
    ],
    skywalk: false,
    skywalkNote: "No major skywalk network here — Thong Lo is mostly a street-level neighborhood of bars, cafes, and condos."
  },
  ekkamai: {
    name: "Ekkamai",
    code: "E7",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Gateway Ekamai mall direct access" },
      { id: 2, label: "Exit 2", desc: "Ekkamai Bus Terminal (buses to eastern Thailand)" },
      { id: 3, label: "Exit 3", desc: "Sukhumvit Soi 63 side" }
    ],
    skywalk: false,
    skywalkNote: "Exit 1 connects directly into Gateway Ekamai. The bus terminal at Exit 2 is useful if you're heading further east out of Bangkok."
  },
  phrakhanong: {
    name: "Phra Khanong",
    code: "E8",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 71 side" },
      { id: 2, label: "Exit 2", desc: "Canal/Khlong Tan side" }
    ],
    skywalk: false,
    skywalkNote: "Mostly a local residential stop, minimal skywalk coverage."
  },
  onnut: {
    name: "On Nut",
    code: "E9",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Tesco Lotus / market side" },
      { id: 3, label: "Exit 3", desc: "Sukhumvit Soi 77 side" },
      { id: 4, label: "Exit 4", desc: "Residential / On Nut market side" }
    ],
    skywalk: false,
    skywalkNote: "Busy local hub with a market and Tesco Lotus near Exit 1, but no extended skywalk network."
  },
  bangchak: {
    name: "Bang Chak",
    code: "E10",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 101 side" },
      { id: 2, label: "Exit 2", desc: "Residential / local side" }
    ],
    skywalk: false,
    skywalkNote: "Quiet residential stop, street-level access only."
  },
  punnawithi: {
    name: "Punnawithi",
    code: "E11",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 101/1 side" },
      { id: 2, label: "Exit 2", desc: "Local market / residential side" }
    ],
    skywalk: false,
    skywalkNote: "Street-level access, mostly residential surroundings."
  },
  udomsuk: {
    name: "Udom Suk",
    code: "E12",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 103 side" },
      { id: 4, label: "Exit 4", desc: "Local market side" }
    ],
    skywalk: false,
    skywalkNote: "Local neighborhood stop, street-level access."
  },
  bangna: {
    name: "Bang Na",
    code: "E13",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Central Bangna direct access" },
      { id: 2, label: "Exit 2", desc: "Bang Na Intersection / expressway side" }
    ],
    skywalk: true,
    skywalkNote: "Skywalk connects toward Central Bangna shopping mall."
  },
  bearing: {
    name: "Bearing",
    code: "E14",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Sukhumvit Soi 105 side" },
      { id: 2, label: "Exit 2", desc: "Towards Samut Prakan / expressway side" }
    ],
    skywalk: false,
    skywalkNote: "Marks the start of the eastern extension toward Samut Prakan — mostly street-level from here on."
  },
  samrong: {
    name: "Samrong",
    code: "E15",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Towards MRT Yellow Line entrance" },
      { id: 2, label: "Exit 2", desc: "Local market / Big C side" }
    ],
    skywalk: false,
    skywalkNote: "Functional interchange station, mostly utilitarian with local shops nearby.",
    transfer: {
      to: "MRT Yellow Line",
      via: "Exit 1",
      walkMinutes: 3,
      notes: "Short walkway connects to the MRT Yellow Line, but it's a separate ticketing system — you'll need to tap out and buy a new fare or tap a fresh card entry, even with the same Rabbit Card. No combined fare exists."
    }
  },
  puchao: {
    name: "Pu Chao",
    code: "E16",
    line: "Sukhumvit",
    exits: [
      { id: 1, label: "Exit 1", desc: "Pu Chao Saming Phrai Rd side" },
      { id: 2, label: "Exit 2", desc: "Residential / local soi side" }
    ],
    skywalk: false,
    skywalkNote: "Quiet residential station in Samut Prakan, street-level access only."
  }
};

// Order of stations north → south along the Sukhumvit Line.
// Insert new station keys here in correct position as the network grows.
const LINE_ORDER = [
  "siam", "chitlom", "phloenchit", "nana", "asok",
  "phromphong", "thonglo", "ekkamai", "phrakhanong", "onnut",
  "bangchak", "punnawithi", "udomsuk", "bangna", "bearing",
  "samrong", "puchao"
];

// Walking segments between ADJACENT stations only (the custom data layer
// OSM won't have). Longer routes are summed automatically.
const SEGMENTS = [
  { from: "siam", to: "chitlom", distanceKm: 0.9, walkMinutes: 11, coveredPercent: 60,
    notes: "Largely walkable under cover via Siam's skywalk network feeding toward Chit Lom, but train is faster.", recommendTrain: true },
  { from: "chitlom", to: "phloenchit", distanceKm: 0.8, walkMinutes: 10, coveredPercent: 30,
    notes: "Short hop, partial cover. Fine to walk if not in a hurry.", recommendTrain: false },
  { from: "phloenchit", to: "nana", distanceKm: 1.0, walkMinutes: 12, coveredPercent: 15,
    notes: "Mostly street-level along Sukhumvit Rd.", recommendTrain: false },
  { from: "nana", to: "asok", distanceKm: 1.1, walkMinutes: 14, coveredPercent: 20,
    notes: "Mostly street-level along Sukhumvit Rd. Some shop awnings but no continuous skywalk. Better to take the train one stop unless you want the walk.", recommendTrain: true },
  { from: "asok", to: "phromphong", distanceKm: 1.2, walkMinutes: 15, coveredPercent: 15,
    notes: "Long stretch along Sukhumvit Rd, mostly street-level. Take the train.", recommendTrain: true },
  { from: "phromphong", to: "thonglo", distanceKm: 1.0, walkMinutes: 13, coveredPercent: 10,
    notes: "Street-level, busy road. Take the train.", recommendTrain: true },
  { from: "thonglo", to: "ekkamai", distanceKm: 0.9, walkMinutes: 11, coveredPercent: 10,
    notes: "Short hop, mostly street-level.", recommendTrain: true },
  { from: "ekkamai", to: "phrakhanong", distanceKm: 1.1, walkMinutes: 14, coveredPercent: 5,
    notes: "Street-level, less pedestrian infrastructure this far out. Take the train.", recommendTrain: true },
  { from: "phrakhanong", to: "onnut", distanceKm: 1.0, walkMinutes: 13, coveredPercent: 5,
    notes: "Street-level. Take the train.", recommendTrain: true },
  { from: "onnut", to: "bangchak", distanceKm: 1.2, walkMinutes: 15, coveredPercent: 5,
    notes: "Long stretch, street-level. Take the train.", recommendTrain: true },
  { from: "bangchak", to: "punnawithi", distanceKm: 1.0, walkMinutes: 13, coveredPercent: 5,
    notes: "Street-level. Take the train.", recommendTrain: true },
  { from: "punnawithi", to: "udomsuk", distanceKm: 1.1, walkMinutes: 14, coveredPercent: 5,
    notes: "Street-level. Take the train.", recommendTrain: true },
  { from: "udomsuk", to: "bangna", distanceKm: 1.3, walkMinutes: 16, coveredPercent: 10,
    notes: "Long stretch toward the expressway. Take the train.", recommendTrain: true },
  { from: "bangna", to: "bearing", distanceKm: 1.2, walkMinutes: 15, coveredPercent: 5,
    notes: "Street-level, near the expressway. Take the train.", recommendTrain: true },
  { from: "bearing", to: "samrong", distanceKm: 1.4, walkMinutes: 18, coveredPercent: 5,
    notes: "Long stretch into Samut Prakan. Take the train.", recommendTrain: true },
  { from: "samrong", to: "puchao", distanceKm: 1.3, walkMinutes: 16, coveredPercent: 5,
    notes: "Street-level, residential stretch. Take the train.", recommendTrain: true }
];

function getSegment(aKey, bKey) {
  return SEGMENTS.find(s => (s.from === aKey && s.to === bKey) || (s.from === bKey && s.to === aKey));
}

// Sum adjacent segments to estimate a multi-stop walk (used for the meta pills,
// not turn-by-turn — nobody is walking 4 stations, but it's useful info).
function getWalkEstimate(fromIdx, toIdx) {
  const lo = Math.min(fromIdx, toIdx);
  const hi = Math.max(fromIdx, toIdx);
  let minutes = 0, km = 0;
  for (let i = lo; i < hi; i++) {
    const seg = getSegment(LINE_ORDER[i], LINE_ORDER[i + 1]);
    if (seg) { minutes += seg.walkMinutes; km += seg.distanceKm; }
  }
  return { walkMinutes: minutes, distanceKm: Math.round(km * 10) / 10 };
}

// Route steps generator — walks the ordered line array, so it works for
// any pair of stations on LINE_ORDER without per-pair hardcoding.
function getRoute(fromKey, toKey) {
  const from = STATIONS[fromKey];
  const to = STATIONS[toKey];
  if (!from || !to) return null;

  const fromIdx = LINE_ORDER.indexOf(fromKey);
  const toIdx = LINE_ORDER.indexOf(toKey);
  const goingNorth = toIdx < fromIdx; // toward Siam/Mo Chit
  const numStops = Math.abs(toIdx - fromIdx);
  const direction = goingNorth ? "northbound (toward Mo Chit / Khu Khot)" : "southbound (toward Bearing / Kheha)";

  const steps = [];

  steps.push({
    type: "start",
    title: `Start at ${from.name} BTS (${from.code})`,
    detail: `Enter via any exit. Head to the platform for trains ${direction}.`
  });

  // Does the path cross Siam (and is Siam not an endpoint)?
  const siamIdx = LINE_ORDER.indexOf("siam");
  const crossesSiam = siamIdx > Math.min(fromIdx, toIdx) && siamIdx < Math.max(fromIdx, toIdx);

  if (fromKey !== "siam" && toKey !== "siam" && !crossesSiam) {
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}`,
      detail: `Stay on the Sukhumvit Line. Get off at ${to.name} (${to.code}).`
    });
  } else if (fromKey === "siam") {
    steps.push({
      type: "transfer",
      title: "Confirm your platform level",
      detail: goingNorth ? "Take Level 4 (upper) — northbound." : "Take Level 3 (lower) — southbound."
    });
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}`,
      detail: `Get off at ${to.name} (${to.code}).`
    });
  } else if (toKey === "siam") {
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}`,
      detail: `Get off at Siam (${to.code}).`
    });
    steps.push({
      type: "transfer",
      title: "Siam: level = direction, not line",
      detail: "Same direction → cross platform. Switching direction → change levels via central stairs."
    });
  } else if (crossesSiam) {
    steps.push({
      type: "ride",
      title: `Ride ${numStops} stop${numStops > 1 ? "s" : ""} ${direction}, passing through Siam`,
      detail: `Stay on board through Siam (no need to change platforms since you're continuing the same direction). Get off at ${to.name} (${to.code}).`
    });
  }

  steps.push({
    type: "arrive",
    title: `Arrive at ${to.name} (${to.code})`,
    detail: to.skywalkNote || `Check exits for the closest skywalk or street access to your destination.`
  });

  const directSegment = getSegment(fromKey, toKey);
  const walkEstimate = directSegment
    ? { walkMinutes: directSegment.walkMinutes, distanceKm: directSegment.distanceKm }
    : getWalkEstimate(fromIdx, toIdx);

  const recommendTrain = numStops > 1 || (directSegment ? directSegment.recommendTrain : true);

  return {
    from, to, steps,
    segment: { ...walkEstimate, recommendTrain, notes: directSegment ? directSegment.notes : null }
  };
}

window.STATIONS = STATIONS;
window.LINE_ORDER = LINE_ORDER;
window.SEGMENTS = SEGMENTS;
window.getRoute = getRoute;

// ===== ALL_STATIONS: cross-line dataset for the searchable picker modal =====
// Covers Sukhumvit, Silom, and Gold lines. This is separate from STATIONS
// above (which still only drives real Sukhumvit-line routing) — ALL_STATIONS
// exists purely for search/browse/select in the picker UI. Transfer stations
// (Siam, Krung Thon Buri) share one `id` across line entries so selecting
// either still resolves to the same underlying station identity.
const ALL_STATIONS = [
  // Sukhumvit Line
  { id: "siam", code: "CEN", name: "Siam", nameTh: null, line: "Sukhumvit Line", transfer: "Silom Line" },
  { id: "chitlom", code: "E1", name: "Chit Lom", nameTh: null, line: "Sukhumvit Line" },
  { id: "phloenchit", code: "E2", name: "Phloen Chit", nameTh: null, line: "Sukhumvit Line" },
  { id: "nana", code: "E3", name: "Nana", nameTh: null, line: "Sukhumvit Line" },
  { id: "asok", code: "E4", name: "Asok", nameTh: null, line: "Sukhumvit Line", transfer: "MRT Blue Line" },
  { id: "phromphong", code: "E5", name: "Phrom Phong", nameTh: null, line: "Sukhumvit Line" },
  { id: "thonglo", code: "E6", name: "Thong Lo", nameTh: null, line: "Sukhumvit Line" },
  { id: "ekkamai", code: "E7", name: "Ekkamai", nameTh: null, line: "Sukhumvit Line" },
  { id: "phrakhanong", code: "E8", name: "Phra Khanong", nameTh: null, line: "Sukhumvit Line" },
  { id: "onnut", code: "E9", name: "On Nut", nameTh: null, line: "Sukhumvit Line" },
  { id: "bangchak", code: "E10", name: "Bang Chak", nameTh: null, line: "Sukhumvit Line" },
  { id: "punnawithi", code: "E11", name: "Punnawithi", nameTh: null, line: "Sukhumvit Line" },
  { id: "udomsuk", code: "E12", name: "Udom Suk", nameTh: null, line: "Sukhumvit Line" },
  { id: "bangna", code: "E13", name: "Bang Na", nameTh: null, line: "Sukhumvit Line" },
  { id: "bearing", code: "E14", name: "Bearing", nameTh: null, line: "Sukhumvit Line" },
  { id: "samrong", code: "E15", name: "Samrong", nameTh: null, line: "Sukhumvit Line", transfer: "MRT Yellow Line" },
  { id: "puchao", code: "E16", name: "Pu Chao", nameTh: null, line: "Sukhumvit Line" },

  // Silom Line
  { id: "nationalstadium", code: "W1", name: "National Stadium", nameTh: null, line: "Silom Line" },
  { id: "siam", code: "CEN", name: "Siam", nameTh: null, line: "Silom Line", transfer: "Sukhumvit Line" },
  { id: "ratchadamri", code: "S1", name: "Ratchadamri", nameTh: null, line: "Silom Line" },
  { id: "saladaeng", code: "S2", name: "Sala Daeng", nameTh: null, line: "Silom Line", transfer: "MRT Blue Line" },
  { id: "chongnonsi", code: "S3", name: "Chong Nonsi", nameTh: null, line: "Silom Line" },
  { id: "saintlouis", code: "S4", name: "Saint Louis", nameTh: null, line: "Silom Line" },
  { id: "surasak", code: "S5", name: "Surasak", nameTh: null, line: "Silom Line" },
  { id: "saphantaksin", code: "S6", name: "Saphan Taksin", nameTh: null, line: "Silom Line" },
  { id: "krungthonburi", code: "S7", name: "Krung Thon Buri", nameTh: null, line: "Silom Line", transfer: "Gold Line" },
  { id: "wongwianyai", code: "S8", name: "Wongwian Yai", nameTh: null, line: "Silom Line" },
  { id: "phonimit", code: "S9", name: "Pho Nimit", nameTh: null, line: "Silom Line" },
  { id: "talatphlu", code: "S10", name: "Talat Phlu", nameTh: null, line: "Silom Line" },
  { id: "wutthakat", code: "S11", name: "Wutthakat", nameTh: null, line: "Silom Line" },
  { id: "bangwa", code: "S12", name: "Bang Wa", nameTh: null, line: "Silom Line", transfer: "MRT Blue Line" },

  // Gold Line
  { id: "krungthonburi", code: "G1", name: "Krung Thon Buri", nameTh: null, line: "Gold Line", transfer: "Silom Line" },
  { id: "charoennakhon", code: "G2", name: "Charoen Nakhon", nameTh: null, line: "Gold Line" },
  { id: "khlongsan", code: "G3", name: "Khlong San", nameTh: null, line: "Gold Line" }
];

const LINE_ORDER_DISPLAY = ["Sukhumvit Line", "Silom Line", "Gold Line"];

window.ALL_STATIONS = ALL_STATIONS;
window.LINE_ORDER_DISPLAY = LINE_ORDER_DISPLAY;
