import { ImageResponse } from "next/og";

export async function GET() {
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
          Spor &amp; Bahis Tartışma Platformu
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
