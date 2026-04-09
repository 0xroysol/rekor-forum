import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const size = searchParams.get("size");

  // PWA icon: 192x192 or 512x512
  if (size === "192" || size === "512") {
    const dim = parseInt(size);
    const logoSize = dim === 192 ? 80 : 220;
    const fontSize = dim === 192 ? 48 : 130;
    const radius = dim === 192 ? 40 : 100;

    return new ImageResponse(
      (
        <div
          style={{
            background: "linear-gradient(135deg, #1f844e, #0f5132)",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: radius,
            fontFamily: "sans-serif",
          }}
        >
          <span
            style={{
              fontSize,
              fontWeight: 800,
              color: "white",
            }}
          >
            R
          </span>
        </div>
      ),
      { width: dim, height: dim }
    );
  }

  // Default: 1200x630 OG image
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0d1017, #131820, #0d1017)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #1f844e, #0f5132)",
            width: 80,
            height: 80,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            color: "white",
            fontWeight: 800,
          }}
        >
          R
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#e2e8f0",
            marginTop: 24,
          }}
        >
          Rekor Forum
        </div>
        <div style={{ fontSize: 20, color: "#94a3b8", marginTop: 8 }}>
          Spor Tartışma Platformu
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
