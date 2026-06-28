import { ImageResponse } from "next/og";

// Per-locale social-share card. Cairo (Google Fonts) is loaded explicitly for
// both locales — it carries Latin + Arabic glyphs, so EN and AR both render
// crisply (and we avoid relying on next/og's bundled default font). AR lays out RTL.
export const alt = "Atlas — Product & User Management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COPY = {
  en: { title: "Product & User Management", subtitle: "Secure, multilingual, API-first." },
  ar: { title: "إدارة المنتجات والمستخدمين", subtitle: "آمن، متعدد اللغات، ويعتمد على واجهات API." },
} as const;

/** Fetch just the glyphs we need for `text` from Google Fonts (Cairo, 700). */
async function loadCairo(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=Cairo:wght@700&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
    if (!match) return null;
    const res = await fetch(match[1]);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: "en" | "ar" = raw === "ar" ? "ar" : "en";
  const copy = COPY[locale];
  const isAr = locale === "ar";

  const fontData = await loadCairo(`${copy.title}${copy.subtitle}Atlas&`);
  const fonts = fontData
    ? [{ name: "Cairo", data: fontData, weight: 700 as const, style: "normal" as const }]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: isAr ? "flex-end" : "flex-start",
          textAlign: isAr ? "right" : "left",
          direction: isAr ? "rtl" : "ltr",
          background: "#0a0b0d",
          backgroundImage:
            "radial-gradient(900px 500px at 50% -10%, rgba(37,99,235,0.35) 0%, transparent 60%)",
          padding: "90px",
          fontFamily: "Cairo",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 9, border: "5px solid #fff" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>Atlas</div>
        </div>
        <div
          style={{
            marginTop: 44,
            fontSize: 68,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.15,
            letterSpacing: isAr ? "0" : "-0.02em",
          }}
        >
          {copy.title}
        </div>
        <div style={{ marginTop: 24, fontSize: 30, color: "#9aa4b2" }}>{copy.subtitle}</div>
      </div>
    ),
    { ...size, fonts },
  );
}
