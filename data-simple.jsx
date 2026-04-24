// Vilnius sport facilities — enriched with real-world info inspired by activevilnius.lt
// Real lat/lng across Vilnius

const DISTRICTS = [
  { id: "senamiestis", name: "Senamiestis", lat: 54.6794, lng: 25.2888 },
  { id: "naujamiestis", name: "Naujamiestis", lat: 54.6850, lng: 25.2620 },
  { id: "zverynas", name: "Žvėrynas", lat: 54.6895, lng: 25.2530 },
  { id: "antakalnis", name: "Antakalnis", lat: 54.7000, lng: 25.3080 },
  { id: "zirmunai", name: "Žirmūnai", lat: 54.7150, lng: 25.2960 },
  { id: "fabijoniskes", name: "Fabijoniškės", lat: 54.7270, lng: 25.2350 },
  { id: "justiniskes", name: "Justiniškės", lat: 54.7220, lng: 25.2140 },
  { id: "seskine", name: "Šeškinė", lat: 54.7170, lng: 25.2300 },
  { id: "karoliniskes", name: "Karoliniškės", lat: 54.6900, lng: 25.2100 },
  { id: "lazdynai", name: "Lazdynai", lat: 54.6700, lng: 25.2080 },
  { id: "vilkpede", name: "Vilkpėdė", lat: 54.6600, lng: 25.2350 },
  { id: "naujininkai", name: "Naujininkai", lat: 54.6500, lng: 25.2700 },
  { id: "pilaite", name: "Pilaitė", lat: 54.7150, lng: 25.1850 },
  { id: "verkiai", name: "Verkiai", lat: 54.7450, lng: 25.2800 },
  { id: "pasilaiciai", name: "Pašilaičiai", lat: 54.7380, lng: 25.2200 },
  { id: "rasos", name: "Rasos", lat: 54.6720, lng: 25.3050 },
];

const TYPES = [
  { id: "pool",       name: "Swimming Pool",  cap: [60, 180],  icon: "🏊" },
  { id: "gym",        name: "Gym",            cap: [40, 120],  icon: "🏋" },
  { id: "basketball", name: "Basketball",     cap: [20, 60],   icon: "🏀" },
  { id: "football",   name: "Football",       cap: [22, 60],   icon: "⚽" },
  { id: "tennis",     name: "Tennis",         cap: [8, 24],    icon: "🎾" },
  { id: "ice",        name: "Ice Rink",       cap: [40, 100],  icon: "⛸" },
  { id: "climbing",   name: "Climbing Gym",   cap: [20, 60],   icon: "🧗" },
  { id: "sauna",      name: "Sauna",          cap: [10, 30],   icon: "🧖" },
  { id: "track",      name: "Running Track",  cap: [15, 40],   icon: "🏃" },
  { id: "skate",      name: "Skate Park",     cap: [10, 35],   icon: "🛹" },
  { id: "arena",      name: "Multi-Sport Arena", cap: [80, 250], icon: "🏟" },
  { id: "yoga",       name: "Yoga Studio",    cap: [15, 40],   icon: "🧘" },
];

// A curated set of real & realistic Vilnius facilities — loosely inspired by
// activevilnius.lt listings. Adds amenities, hours, pricing, etc.
const BASE_FACILITIES = [
  // Pools
  { name: "Lazdynų baseinas", type: "pool", district: "lazdynai", cap: 180,
    addr: "Erfurto g. 13, Vilnius", phone: "+370 5 244 5833", web: "lazdynubaseinas.eu",
    hours: "06:30 – 22:00", price: "€7–12 / session",
    sub: "50m pool · Kids pool · Sauna",
    amen: ["shower", "lockers", "parking", "cafe", "sauna", "rental"] },
  { name: "Žirmūnų baseinas", type: "pool", district: "zirmunai", cap: 150,
    addr: "Žirmūnų g. 1M, Vilnius", phone: "+370 5 277 4151", web: "zirmunubaseinas.lt",
    hours: "07:00 – 22:00", price: "€6–10 / session",
    sub: "25m pool · Kids pool · Hot tub",
    amen: ["shower", "lockers", "parking", "sauna"] },
  { name: "Fabijoniškių baseinas", type: "pool", district: "fabijoniskes", cap: 140,
    addr: "S. Stanevičiaus g. 24, Vilnius", phone: "+370 5 240 7300", web: "fabijoniskiubaseinas.lt",
    hours: "06:30 – 22:30", price: "€7–11 / session",
    sub: "25m pool · Gym · Sauna",
    amen: ["shower", "lockers", "parking", "cafe", "sauna", "gym", "wifi"] },

  // Arenas & multi-sport
  { name: "Active Vilnius Arena", type: "arena", district: "naujininkai", cap: 220,
    addr: "Žirnių g. 8, Vilnius", phone: "+370 5 212 8899", web: "activevilnius.lt",
    hours: "07:00 – 23:00", price: "€15–35 / hr",
    sub: "Basketball · Volleyball · Futsal",
    amen: ["shower", "lockers", "parking", "cafe", "wifi", "rental"] },
  { name: "NBA Basketball School Arena", type: "basketball", district: "naujamiestis", cap: 55,
    addr: "Ozo g. 14C, Vilnius", phone: "+370 699 12345", web: "nbabs.lt",
    hours: "08:00 – 22:00", price: "€12–25 / hr",
    sub: "Full court · Training · Kids programs",
    amen: ["shower", "lockers", "parking", "wifi", "rental"] },
  { name: "Vilniaus kultūros, pramogų ir sporto rūmai", type: "arena", district: "zirmunai", cap: 250,
    addr: "Žirmūnų g. 1E, Vilnius", phone: "+370 5 272 1717", web: "activevilnius.lt",
    hours: "08:00 – 22:00", price: "€10–40 / hr",
    sub: "Multiple halls · Events · Tennis",
    amen: ["shower", "lockers", "parking", "cafe", "wifi"] },
  { name: "Pilaitės futbolo maniežas", type: "football", district: "pilaite", cap: 50,
    addr: "Priegliaus g. 1, Vilnius", phone: "+370 5 205 4321", web: "activevilnius.lt",
    hours: "08:00 – 23:00", price: "€40–70 / hr",
    sub: "Indoor dome · Full pitch",
    amen: ["shower", "lockers", "parking", "cafe", "wifi"] },

  // Football pitches
  { name: "LFF Stadium", type: "football", district: "zverynas", cap: 45,
    addr: "Liepkalnio g. 119, Vilnius", phone: "+370 5 263 8265", web: "lff.lt",
    hours: "09:00 – 22:00", price: "€50–90 / hr",
    sub: "National stadium · Artificial turf",
    amen: ["shower", "lockers", "parking", "cafe"] },
  { name: "Vingio parko aikštynas", type: "football", district: "zverynas", cap: 30,
    addr: "Vingio parkas, Vilnius", phone: "—", web: "vilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Public pitch · 5-a-side",
    amen: ["parking"] },
  { name: "Mykolo Biržiškos sporto aikštynas", type: "football", district: "antakalnis", cap: 35,
    addr: "Pamiškės g. 27, Vilnius", phone: "+370 5 234 5678", web: "activevilnius.lt",
    hours: "07:00 – 22:00", price: "€20 / hr",
    sub: "School playground · Football · Track",
    amen: ["shower", "lockers", "parking"] },

  // Basketball
  { name: "Žalgirio halė", type: "basketball", district: "naujamiestis", cap: 60,
    addr: "Žemaitės g. 6, Vilnius", phone: "+370 5 233 8271", web: "zalgirio-arena.lt",
    hours: "08:00 – 23:00", price: "€25 / hr",
    sub: "Pro court · League home",
    amen: ["shower", "lockers", "parking", "cafe", "wifi"] },
  { name: "Kalnai Arena", type: "basketball", district: "senamiestis", cap: 40,
    addr: "Kalnų parkas, Vilnius", phone: "—", web: "vilnius.lt",
    hours: "09:00 – 21:00", price: "Free",
    sub: "Outdoor · 3x3",
    amen: [] },
  { name: "Saulėtekio Krepšinio Aikštelė", type: "basketball", district: "antakalnis", cap: 35,
    addr: "Saulėtekio al., Vilnius", phone: "—", web: "vilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Outdoor · Public",
    amen: ["parking"] },
  { name: "Baltasis Tiltas Court", type: "basketball", district: "zverynas", cap: 30,
    addr: "Baltasis tiltas, Vilnius", phone: "—", web: "baltasistiltas.lt",
    hours: "08:00 – 23:00", price: "Free",
    sub: "Outdoor · Live webcam",
    amen: ["parking"] },
  { name: "Šeškinės Krepšinio Aikštelė", type: "basketball", district: "seskine", cap: 28,
    addr: "Šeškinės g. 21, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Outdoor · 2 courts",
    amen: ["parking"] },

  // Tennis
  { name: "SEB Arena", type: "tennis", district: "vilkpede", cap: 24,
    addr: "Ozo g. 14C, Vilnius", phone: "+370 5 276 3355", web: "sebarena.lt",
    hours: "07:00 – 23:00", price: "€18–30 / hr",
    sub: "6 indoor courts · Clay",
    amen: ["shower", "lockers", "parking", "cafe", "rental"] },
  { name: "Vingio Tennis Klubas", type: "tennis", district: "zverynas", cap: 18,
    addr: "M. K. Čiurlionio g. 100, Vilnius", phone: "+370 5 233 8881", web: "vingistennis.lt",
    hours: "07:00 – 22:00", price: "€15–25 / hr",
    sub: "4 outdoor · 2 indoor",
    amen: ["shower", "lockers", "parking", "cafe", "rental"] },
  { name: "Žirmūnų teniso kortai", type: "tennis", district: "zirmunai", cap: 16,
    addr: "Žirmūnų g. 1E, Vilnius", phone: "+370 5 272 1717", web: "savitarna.activevilnius.lt",
    hours: "08:00 – 21:00", price: "€10–18 / hr",
    sub: "Public · Online booking",
    amen: ["lockers", "parking"] },

  // Gyms
  { name: "Impuls Akropolis", type: "gym", district: "seskine", cap: 120,
    addr: "Ozo g. 25, Vilnius", phone: "+370 5 236 3000", web: "impuls.lt",
    hours: "06:00 – 23:00", price: "€45 / month",
    sub: "Full gym · Group classes · Pool",
    amen: ["shower", "lockers", "parking", "cafe", "sauna", "wifi", "pool"] },
  { name: "Lemon Gym Ogmios", type: "gym", district: "zirmunai", cap: 90,
    addr: "Verkių g. 29, Vilnius", phone: "+370 700 55544", web: "lemongym.lt",
    hours: "24 / 7", price: "€29 / month",
    sub: "24/7 · Cardio · Strength",
    amen: ["shower", "lockers", "parking", "wifi"] },
  { name: "MyFitness Europa", type: "gym", district: "naujamiestis", cap: 110,
    addr: "Konstitucijos pr. 7A, Vilnius", phone: "+370 5 212 4400", web: "myfitness.lt",
    hours: "06:00 – 23:30", price: "€39 / month",
    sub: "Full gym · Group classes",
    amen: ["shower", "lockers", "parking", "cafe", "sauna", "wifi"] },
  { name: "Gym+ Pilaitė", type: "gym", district: "pilaite", cap: 75,
    addr: "Priegliaus g. 3, Vilnius", phone: "+370 5 240 3000", web: "gymplius.lt",
    hours: "06:00 – 23:00", price: "€35 / month",
    sub: "Cardio · Strength · Classes",
    amen: ["shower", "lockers", "parking", "wifi"] },
  { name: "Core Gym Antakalnis", type: "gym", district: "antakalnis", cap: 65,
    addr: "Antakalnio g. 74, Vilnius", phone: "+370 699 88112", web: "coregym.lt",
    hours: "06:30 – 22:30", price: "€42 / month",
    sub: "Functional · CrossFit",
    amen: ["shower", "lockers", "wifi"] },
  { name: "Viada Fit Fabijoniškės", type: "gym", district: "fabijoniskes", cap: 85,
    addr: "S. Stanevičiaus g. 30, Vilnius", phone: "+370 5 240 7700", web: "viadafit.lt",
    hours: "06:00 – 23:00", price: "€32 / month",
    sub: "Gym · Yoga · Pilates",
    amen: ["shower", "lockers", "parking", "wifi"] },
  { name: "Forma Karoliniškės", type: "gym", district: "karoliniskes", cap: 70,
    addr: "Loretos Asanavičiūtės g. 6, Vilnius", phone: "+370 5 244 3100", web: "formagym.lt",
    hours: "06:30 – 22:30", price: "€30 / month",
    sub: "Gym · Cardio",
    amen: ["shower", "lockers", "parking"] },

  // Ice rinks
  { name: "Vilnius Ice Arena", type: "ice", district: "naujamiestis", cap: 100,
    addr: "Ukmergės g. 282, Vilnius", phone: "+370 5 237 9000", web: "vilniusice.lt",
    hours: "08:00 – 23:00", price: "€6–10 + skate rental",
    sub: "Public skating · Hockey · Figure",
    amen: ["shower", "lockers", "parking", "cafe", "rental"] },
  { name: "Akropolis Ice", type: "ice", district: "seskine", cap: 75,
    addr: "Ozo g. 25, Vilnius", phone: "+370 5 236 3200", web: "akropolisice.lt",
    hours: "10:00 – 22:00", price: "€6 / session",
    sub: "Mall rink · Rental included",
    amen: ["lockers", "parking", "cafe", "rental"] },

  // Climbing
  { name: "Nerta Climbing", type: "climbing", district: "naujininkai", cap: 55,
    addr: "Savanorių pr. 187, Vilnius", phone: "+370 600 12134", web: "nerta.lt",
    hours: "10:00 – 23:00", price: "€13–17 + gear",
    sub: "Bouldering · Lead · Top-rope",
    amen: ["shower", "lockers", "parking", "cafe", "rental"] },
  { name: "Vertical Climbing Gym", type: "climbing", district: "vilkpede", cap: 45,
    addr: "Švitrigailos g. 11M, Vilnius", phone: "+370 699 44332", web: "vertical.lt",
    hours: "11:00 – 22:00", price: "€12–15",
    sub: "Bouldering only",
    amen: ["shower", "lockers", "rental"] },
  { name: "Boulder Lab", type: "climbing", district: "antakalnis", cap: 35,
    addr: "Antakalnio g. 120, Vilnius", phone: "+370 620 55443", web: "boulderlab.lt",
    hours: "12:00 – 22:00", price: "€14",
    sub: "Bouldering · Training boards",
    amen: ["shower", "lockers", "cafe", "rental"] },

  // Saunas
  { name: "Baltic Sauna", type: "sauna", district: "senamiestis", cap: 24,
    addr: "Pilies g. 22, Vilnius", phone: "+370 5 212 1234", web: "balticsauna.lt",
    hours: "12:00 – 23:00", price: "€25 / 2 hr",
    sub: "Finnish · Steam · Cold plunge",
    amen: ["shower", "lockers", "cafe"] },
  { name: "Pirtis LT Verkiai", type: "sauna", district: "verkiai", cap: 28,
    addr: "Verkių g. 100, Vilnius", phone: "+370 699 77889", web: "pirtis.lt",
    hours: "14:00 – 23:00", price: "€30 / 2 hr",
    sub: "Lithuanian traditional",
    amen: ["shower", "lockers", "parking", "cafe"] },
  { name: "Vilnius Pirtis", type: "sauna", district: "rasos", cap: 18,
    addr: "Rasų g. 32, Vilnius", phone: "+370 600 99001", web: "vilniuspirtis.lt",
    hours: "15:00 – 23:00", price: "€22 / session",
    sub: "Wood-fired · Traditional",
    amen: ["shower", "lockers", "parking"] },

  // Running tracks
  { name: "Vingio parko takas", type: "track", district: "zverynas", cap: 40,
    addr: "Vingio parkas, Vilnius", phone: "—", web: "vilnius.lt",
    hours: "Always open", price: "Free",
    sub: "6 km loop · Forest",
    amen: ["parking"] },
  { name: "LSU Stadium Track", type: "track", district: "antakalnis", cap: 30,
    addr: "Saulėtekio al. 9, Vilnius", phone: "+370 5 234 3000", web: "lsu.lt",
    hours: "07:00 – 22:00", price: "€2 / session",
    sub: "400m tartan · 8 lanes",
    amen: ["shower", "lockers", "parking"] },
  { name: "Pašilaičių bėgimo takas", type: "track", district: "pasilaiciai", cap: 25,
    addr: "Pašilaičių g., Vilnius", phone: "—", web: "vilnius.lt",
    hours: "Always open", price: "Free",
    sub: "3.2 km · Paved",
    amen: [] },

  // Skate parks
  { name: "Šeškinės riedučių parkas", type: "skate", district: "seskine", cap: 35,
    addr: "Šeškinės g. 1, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Skateboard · BMX · Inline",
    amen: ["parking"] },
  { name: "Fabijoniškių riedučių parkas", type: "skate", district: "fabijoniskes", cap: 28,
    addr: "S. Stanevičiaus g. 36, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Concrete bowl · Street",
    amen: ["parking"] },
  { name: "Viršuliškių Pump Track", type: "skate", district: "seskine", cap: 25,
    addr: "Viršuliškių g. 5, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "Always open", price: "Free",
    sub: "Asphalt pump track",
    amen: ["parking"] },
  { name: "Trakų Vokės Skate Park", type: "skate", district: "naujininkai", cap: 22,
    addr: "Trakų Vokė, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Concrete · Bowls · Rails",
    amen: [] },

  // Yoga
  { name: "Yoga Studio Antakalnis", type: "yoga", district: "antakalnis", cap: 30,
    addr: "Antakalnio g. 40, Vilnius", phone: "+370 620 33221", web: "yogastudio.lt",
    hours: "07:00 – 22:00", price: "€12–15 / class",
    sub: "Vinyasa · Hatha · Restorative",
    amen: ["shower", "lockers", "wifi"] },
  { name: "Breathe Yoga Senamiestis", type: "yoga", district: "senamiestis", cap: 22,
    addr: "Vokiečių g. 18, Vilnius", phone: "+370 699 11223", web: "breathe.lt",
    hours: "08:00 – 21:30", price: "€14 / class",
    sub: "Hot yoga · Meditation",
    amen: ["shower", "lockers"] },

  // Extras to round out to ~50
  { name: "Kaukysos sporto aikštynas", type: "football", district: "justiniskes", cap: 32,
    addr: "Kaukysos g. 15, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "07:00 – 22:00", price: "Free",
    sub: "Public · Turf",
    amen: ["parking"] },
  { name: "Vaidilutės sporto aikštynas", type: "basketball", district: "pasilaiciai", cap: 30,
    addr: "Vaidilutės g. 79, Vilnius", phone: "—", web: "activevilnius.lt",
    hours: "08:00 – 22:00", price: "Free",
    sub: "Outdoor · Basketball · Football",
    amen: ["parking"] },
  { name: "Žirmūnų sporto aikštynas", type: "track", district: "zirmunai", cap: 45,
    addr: "Žirmūnų g. 1, Vilnius", phone: "+370 5 272 1717", web: "activevilnius.lt",
    hours: "07:00 – 22:00", price: "Free",
    sub: "Track · Football pitch",
    amen: ["shower", "lockers", "parking"] },
  { name: "Lazdynų bėgimo takas", type: "track", district: "lazdynai", cap: 20,
    addr: "Lazdynų miškas, Vilnius", phone: "—", web: "vilnius.lt",
    hours: "Always open", price: "Free",
    sub: "4 km · Forest",
    amen: ["parking"] },
  { name: "Verkių parko takas", type: "track", district: "verkiai", cap: 22,
    addr: "Verkių regioninis parkas", phone: "—", web: "verkiuparkas.lt",
    hours: "Always open", price: "Free",
    sub: "8 km · Hills",
    amen: ["parking"] },
];

function mulberry32(s) {
  return function() {
    let t = s += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function makeFacilities() {
  const rng = mulberry32(7);
  return BASE_FACILITIES.map((base, i) => {
    const d = DISTRICTS.find(x => x.id === base.district) || DISTRICTS[0];
    const typeInfo = TYPES.find(t => t.id === base.type);
    const lat = d.lat + (rng() - 0.5) * 0.014;
    const lng = d.lng + (rng() - 0.5) * 0.022;
    const capacity = base.cap || typeInfo.cap[1];
    const isClosed = rng() < 0.05;
    const fill = rng();
    const current = isClosed ? 0 : Math.floor(capacity * fill);

    // 24h history
    const hist = [];
    for (let h = 0; h < 24; h++) {
      let b = 0.1;
      if (h >= 6 && h < 9) b = 0.5 + rng() * 0.3;
      else if (h >= 11 && h < 14) b = 0.4 + rng() * 0.3;
      else if (h >= 17 && h < 21) b = 0.6 + rng() * 0.3;
      else if (h >= 21 || h < 6) b = 0.05 + rng() * 0.1;
      else b = 0.3 + rng() * 0.2;
      hist.push(Math.floor(capacity * b * (0.8 + rng() * 0.4)));
    }

    // Weekly heatmap 7x24 (0-1 normalized to capacity)
    const weekly = [];
    for (let day = 0; day < 7; day++) {
      const row = [];
      const weekend = day >= 5;
      for (let h = 0; h < 24; h++) {
        let v = 0.05;
        if (h >= 6 && h < 9) v = 0.45 + rng() * 0.25;
        else if (h >= 11 && h < 14) v = 0.35 + rng() * 0.25;
        else if (h >= 17 && h < 21) v = (weekend ? 0.5 : 0.7) + rng() * 0.25;
        else if (h >= 21 || h < 6) v = 0.02 + rng() * 0.08;
        else v = 0.25 + rng() * 0.2;
        if (weekend && h >= 10 && h < 17) v = 0.5 + rng() * 0.3;
        row.push(Math.min(1, v));
      }
      weekly.push(row);
    }

    const hourSums = Array(24).fill(0);
    weekly.forEach(r => r.forEach((v, h) => { hourSums[h] += v; }));
    let peakHour = 0;
    hourSums.forEach((v, h) => { if (v > hourSums[peakHour]) peakHour = h; });

    const todayEntries = Math.floor(capacity * (2 + rng() * 4));
    const weekEntries = Math.floor(todayEntries * (5.5 + rng() * 2)); // 5.5-7.5 days avg
    const monthEntries = Math.floor(weekEntries * (4 + rng() * 0.5));
    // Weekly trend direction (−1 / 0 / +1) and magnitude
    const trendPct = Math.round((rng() - 0.4) * 40); // -16 to +24 %
    const rating = (3.7 + rng() * 1.3).toFixed(1);
    const reviews = 20 + Math.floor(rng() * 380);

    // ---------- Deep analytics ----------
    // 90-day daily entry series (seasonal + weekly pattern + trend + noise)
    const daily90 = [];
    const baseDaily = todayEntries;
    for (let d = 0; d < 90; d++) {
      const dayOfWeek = (d + 5) % 7; // Mon..Sun
      const weekendBoost = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.25 : 1;
      const weekdayDip   = (dayOfWeek === 0) ? 0.85 : 1;
      const seasonal = 1 + 0.08 * Math.sin((d / 90) * Math.PI * 2);
      const growth = 1 + (trendPct / 100) * (d / 90); // growth toward "now"
      const noise = 0.82 + rng() * 0.36;
      daily90.push(Math.max(0, Math.floor(baseDaily * weekendBoost * weekdayDip * seasonal * growth * noise)));
    }
    // 14-day forecast (next)
    const forecast14 = [];
    const lastAvg = daily90.slice(-7).reduce((s, v) => s + v, 0) / 7;
    for (let d = 0; d < 14; d++) {
      const dayOfWeek = (90 + d + 5) % 7;
      const weekendBoost = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.25 : 1;
      const weekdayDip   = (dayOfWeek === 0) ? 0.85 : 1;
      forecast14.push(Math.floor(lastAvg * weekendBoost * weekdayDip * (0.95 + rng() * 0.1)));
    }

    // Entry method split (QR / NFC / Card)
    const qrShare = 0.3 + rng() * 0.3;
    const nfcShare = 0.2 + rng() * 0.3;
    const cardShare = Math.max(0, 1 - qrShare - nfcShare);
    const entryMethod = {
      qr: Math.round(qrShare * 100),
      nfc: Math.round(nfcShare * 100),
      card: Math.max(0, 100 - Math.round(qrShare * 100) - Math.round(nfcShare * 100)),
    };

    // Membership mix
    const memberShare = 0.4 + rng() * 0.4;
    const daypassShare = 0.15 + rng() * 0.2;
    const walkinShare = Math.max(0, 1 - memberShare - daypassShare);
    const memberMix = {
      member:  Math.round(memberShare * 100),
      daypass: Math.round(daypassShare * 100),
      walkin:  Math.max(0, 100 - Math.round(memberShare * 100) - Math.round(daypassShare * 100)),
    };

    // Age demographics
    const ageBuckets = [
      { label: "13–17", pct: Math.floor(3 + rng() * 10) },
      { label: "18–24", pct: Math.floor(12 + rng() * 15) },
      { label: "25–34", pct: Math.floor(20 + rng() * 20) },
      { label: "35–44", pct: Math.floor(15 + rng() * 15) },
      { label: "45–54", pct: Math.floor(8 + rng() * 12) },
      { label: "55+",   pct: Math.floor(5 + rng() * 12) },
    ];
    const ageSum = ageBuckets.reduce((s, b) => s + b.pct, 0);
    ageBuckets.forEach(b => { b.pct = Math.round(b.pct / ageSum * 100); });

    // Gender split (informational only, de-identified)
    const genderM = Math.floor(40 + rng() * 25);
    const gender = { m: genderM, f: 100 - genderM };

    // Dwell-time histogram (minutes) — 0-30, 30-60, 60-90, 90-120, 120+
    const dwellRaw = [
      Math.floor(5 + rng() * 20),
      Math.floor(20 + rng() * 25),
      Math.floor(25 + rng() * 20),
      Math.floor(15 + rng() * 20),
      Math.floor(5 + rng() * 15),
    ];
    const dwellTotal = dwellRaw.reduce((s, v) => s + v, 0);
    const dwellBuckets = [
      { label: "<30m",   pct: Math.round(dwellRaw[0] / dwellTotal * 100) },
      { label: "30–60m", pct: Math.round(dwellRaw[1] / dwellTotal * 100) },
      { label: "1–1.5h", pct: Math.round(dwellRaw[2] / dwellTotal * 100) },
      { label: "1.5–2h", pct: Math.round(dwellRaw[3] / dwellTotal * 100) },
      { label: "2h+",    pct: Math.round(dwellRaw[4] / dwellTotal * 100) },
    ];
    const avgDwellMin = Math.round(
      dwellBuckets[0].pct * 15 + dwellBuckets[1].pct * 45 + dwellBuckets[2].pct * 75 +
      dwellBuckets[3].pct * 105 + dwellBuckets[4].pct * 150
    ) / 100;

    // Utilization (avg% of capacity over last 7 days)
    const avgUtil = Math.min(95, Math.round(40 + rng() * 45));

    // Turnover: unique visitors / capacity today
    const uniqueToday = Math.floor(todayEntries * (0.85 + rng() * 0.1));
    const turnoverRate = (uniqueToday / capacity).toFixed(1);

    // Incidents (synthetic ops data)
    const incidents7d = Math.floor(rng() * 4);

    // Capacity-breach count (times hit >90% in last 30d)
    const capacityBreaches30d = Math.floor(rng() * 12);

    // Repeat visitor rate
    const repeatRate = Math.floor(55 + rng() * 30);

    // Staff-on-duty (ops)
    const staffOnDuty = Math.max(1, Math.floor(capacity / 30) + Math.floor(rng() * 3));

    // Net promoter proxy
    const nps = Math.round((rating - 3) / 2 * 100);

    return {
      id: `F${String(i + 1).padStart(3, "0")}`,
      name: base.name,
      type: base.type,
      typeName: typeInfo.name,
      typeIcon: typeInfo.icon,
      district: d.name,
      districtId: d.id,
      lat, lng,
      capacity,
      current,
      isClosed,
      history: hist,
      weekly,
      peakHour,
      todayEntries,
      weekEntries,
      monthEntries,
      trendPct,
      daily90,
      forecast14,
      entryMethod,
      memberMix,
      ageBuckets,
      gender,
      dwellBuckets,
      avgDwellMin,
      avgUtil,
      uniqueToday,
      turnoverRate,
      incidents7d,
      capacityBreaches30d,
      repeatRate,
      staffOnDuty,
      nps,
      lastScan: isClosed ? "—" : `${Math.floor(rng() * 15)}m ago`,
      address: base.addr,
      phone: base.phone,
      website: base.web,
      hours: base.hours,
      price: base.price,
      subtype: base.sub,
      amenities: base.amen || [],
      rating: parseFloat(rating),
      reviews,
    };
  });
}

const FACILITIES = makeFacilities();

function statusOf(f) {
  if (f.isClosed) return "closed";
  const r = f.current / f.capacity;
  if (r < 0.4) return "low";
  if (r < 0.75) return "medium";
  return "full";
}

const STATUS = {
  low:    { label: "Available", color: "#10b981" },
  medium: { label: "Busy",      color: "#f59e0b" },
  full:   { label: "Full",      color: "#ef4444" },
  closed: { label: "Closed",    color: "#9ca3af" },
};

const AMENITY_META = {
  shower:  { icon: "🚿", label: "Shower" },
  lockers: { icon: "🔐", label: "Lockers" },
  parking: { icon: "🅿️", label: "Parking" },
  cafe:    { icon: "☕", label: "Cafe" },
  sauna:   { icon: "🧖", label: "Sauna" },
  wifi:    { icon: "📶", label: "Wi-Fi" },
  rental:  { icon: "🎽", label: "Rental" },
  gym:     { icon: "🏋", label: "Gym" },
  pool:    { icon: "🏊", label: "Pool" },
};

Object.assign(window, { FACILITIES, TYPES, DISTRICTS, statusOf, STATUS, AMENITY_META });
