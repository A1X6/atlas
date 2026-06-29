import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, type ProductStatus } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// argon2id parameters (OWASP-aligned).
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type SeedProduct = {
  name: string;
  category: string;
  priceCents: number;
  description: string;
  status: ProductStatus;
  stock: number;
};

const PRODUCTS: SeedProduct[] = [
  { name: "Aurora Headphones", category: "Audio", priceCents: 24900, description: "Active noise cancelling, 40h battery.", status: "PUBLISHED", stock: 120 },
  { name: "Nimbus Keyboard", category: "Accessories", priceCents: 12900, description: "Low-profile mechanical, hot-swap.", status: "PUBLISHED", stock: 80 },
  { name: "Vertex Webcam 4K", category: "Video", priceCents: 17900, description: "Auto-framing with HDR sensor.", status: "DRAFT", stock: 0 },
  { name: "Pulse Charger 65W", category: "Power", priceCents: 5900, description: "GaN, three ports, foldable pins.", status: "PUBLISHED", stock: 240 },
  { name: "Drift Mouse", category: "Accessories", priceCents: 8900, description: "Silent clicks, 8K polling rate.", status: "OUT_OF_STOCK", stock: 0 },
  { name: "Halo Desk Lamp", category: "Home", priceCents: 13900, description: "Tunable white, presence sensing.", status: "PUBLISHED", stock: 60 },
  { name: "Echo Earbuds Pro", category: "Audio", priceCents: 15900, description: "Adaptive ANC, spatial audio.", status: "PUBLISHED", stock: 200 },
  { name: "Sonic Soundbar", category: "Audio", priceCents: 19900, description: "2.1 channel with wireless sub.", status: "PUBLISHED", stock: 45 },
  { name: "Bass Cube Speaker", category: "Audio", priceCents: 7900, description: "Portable, 24h playtime, IPX7.", status: "PUBLISHED", stock: 150 },
  { name: "Studio Monitor X", category: "Audio", priceCents: 32900, description: "Flat-response near-field monitor.", status: "DRAFT", stock: 0 },
  { name: "Glide Trackpad", category: "Accessories", priceCents: 9900, description: "Glass surface, force-touch.", status: "PUBLISHED", stock: 90 },
  { name: "Apex Switch Set", category: "Accessories", priceCents: 3900, description: "Tactile hot-swap switches, 70-pack.", status: "PUBLISHED", stock: 300 },
  { name: "Carbon Laptop Stand", category: "Accessories", priceCents: 6900, description: "Folding aluminium, six heights.", status: "PUBLISHED", stock: 110 },
  { name: "Flux USB-C Hub", category: "Accessories", priceCents: 4900, description: "7-in-1, 4K HDMI + 100W PD.", status: "PUBLISHED", stock: 175 },
  { name: "Loop Cable Pack", category: "Accessories", priceCents: 2400, description: "Braided USB-C cables, 3-pack.", status: "PUBLISHED", stock: 400 },
  { name: "Cinema Capture Card", category: "Video", priceCents: 14900, description: "1080p120 / 4K30 passthrough.", status: "PUBLISHED", stock: 55 },
  { name: "Beam Projector Mini", category: "Video", priceCents: 28900, description: "Pocket DLP, auto-keystone.", status: "PUBLISHED", stock: 30 },
  { name: "Frame Ring Light", category: "Video", priceCents: 6400, description: "18\" bi-color with remote.", status: "OUT_OF_STOCK", stock: 0 },
  { name: "Volt Power Bank 20K", category: "Power", priceCents: 6900, description: "20,000mAh, 65W bidirectional.", status: "PUBLISHED", stock: 220 },
  { name: "Surge Protector Pro", category: "Power", priceCents: 4400, description: "8 outlets, 4000J, USB-C.", status: "PUBLISHED", stock: 130 },
  { name: "Coil Wireless Pad", category: "Power", priceCents: 3900, description: "15W Qi2 magnetic alignment.", status: "PUBLISHED", stock: 260 },
  { name: "Grid Solar Charger", category: "Power", priceCents: 8900, description: "28W foldable panel, dual USB.", status: "DRAFT", stock: 0 },
  { name: "Mist Humidifier", category: "Home", priceCents: 5400, description: "Ultrasonic, 4L, app control.", status: "PUBLISHED", stock: 95 },
  { name: "Ember Smart Mug", category: "Home", priceCents: 9900, description: "Temperature-controlled, 90min.", status: "PUBLISHED", stock: 70 },
  { name: "Nest Thermostat Mini", category: "Home", priceCents: 11900, description: "Learning schedule, geofencing.", status: "PUBLISHED", stock: 85 },
  { name: "Aura Air Monitor", category: "Home", priceCents: 12900, description: "PM2.5, CO2, VOC, humidity.", status: "PUBLISHED", stock: 65 },
  { name: "Pace Fitness Band", category: "Wearables", priceCents: 7400, description: "14-day battery, SpO2, sleep.", status: "PUBLISHED", stock: 180 },
  { name: "Chrono Smartwatch", category: "Wearables", priceCents: 22900, description: "AMOLED, GPS, ECG, 5ATM.", status: "PUBLISHED", stock: 75 },
  { name: "Pulse Heart Strap", category: "Wearables", priceCents: 5900, description: "ANT+/BLE chest HR monitor.", status: "OUT_OF_STOCK", stock: 0 },
  { name: "Mesh Router Tri-Band", category: "Networking", priceCents: 25900, description: "Wi-Fi 6E, 2-pack, 5,500 sq ft.", status: "PUBLISHED", stock: 50 },
  { name: "Bolt Ethernet Switch", category: "Networking", priceCents: 4900, description: "8-port 2.5GbE unmanaged.", status: "PUBLISHED", stock: 140 },
  { name: "Signal Wi-Fi Extender", category: "Networking", priceCents: 3400, description: "AX1800 dual-band repeater.", status: "PUBLISHED", stock: 160 },
  { name: "Vault SSD 1TB", category: "Storage", priceCents: 10900, description: "USB 3.2 Gen2, 1050MB/s.", status: "PUBLISHED", stock: 210 },
  { name: "Cache NVMe 2TB", category: "Storage", priceCents: 17900, description: "PCIe 4.0, 7,000MB/s read.", status: "PUBLISHED", stock: 100 },
  { name: "Pocket HDD 4TB", category: "Storage", priceCents: 8900, description: "Portable USB-C, shock-rated.", status: "DRAFT", stock: 0 },
  { name: "Pixel Monitor 27", category: "Display", priceCents: 27900, description: "27\" QHD 165Hz IPS.", status: "PUBLISHED", stock: 40 },
  { name: "Crisp Monitor 32 4K", category: "Display", priceCents: 44900, description: "32\" 4K USB-C 90W KVM.", status: "PUBLISHED", stock: 25 },
  { name: "Quill Stylus Pen", category: "Accessories", priceCents: 4900, description: "Tilt + pressure, USB-C charge.", status: "PUBLISHED", stock: 230 },
  { name: "Stack Monitor Riser", category: "Home", priceCents: 3900, description: "Bamboo riser with drawer.", status: "PUBLISHED", stock: 120 },
  { name: "Knit Laptop Sleeve", category: "Accessories", priceCents: 2900, description: "Water-resistant, up to 16\".", status: "PUBLISHED", stock: 280 },
];

async function main() {
  console.log("Seeding database…");

  // ── Test accounts ─────────────────────────────────────────────
  const adminPassword = await hash("Admin123!", ARGON2);
  const userPassword = await hash("User123!", ARGON2);

  const admin = await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      firstName: "Mara",
      lastName: "Vance",
      role: "ADMIN",
      country: "United Kingdom",
      bio: "Product lead focused on logistics tooling.",
      passwordHash: adminPassword,
      emails: {
        create: [
          { address: "admin@atlas.io", isPrimary: true, verified: true },
          { address: "mara.vance@atlas.io", isPrimary: false },
        ],
      },
      phones: {
        create: [
          { countryCode: "+44", number: "7700 900812", isPrimary: true },
          { countryCode: "+44", number: "7911 123456", isPrimary: false },
        ],
      },
    },
  });

  const user = await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      firstName: "Dana",
      lastName: "Wu",
      role: "USER",
      country: "United States",
      passwordHash: userPassword,
      emails: { create: [{ address: "user@atlas.io", isPrimary: true, verified: true }] },
      phones: { create: [{ countryCode: "+1", number: "555 0142", isPrimary: true }] },
    },
  });

  console.log(`  admin: admin@atlas.io / Admin123!  (${admin.id})`);
  console.log(`  user:  user@atlas.io / User123!   (${user.id})`);

  // ── Sample products ───────────────────────────────────────────
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        category: p.category,
        status: p.status,
        stock: p.stock,
        sku: `SKU-${slug.toUpperCase()}`,
      },
    });
  }
  console.log(`  ${PRODUCTS.length} products seeded.`);

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
