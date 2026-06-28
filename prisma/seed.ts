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
