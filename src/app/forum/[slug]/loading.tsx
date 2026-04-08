export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-5 space-y-4">
      <div className="h-4 w-48 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
      <div className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }} />
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
        <div className="h-10" style={{ backgroundColor: "#1a2130" }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3" style={{ backgroundColor: "#131820", borderBottom: "1px solid #1e293b" }}>
            <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-64 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
              <div className="h-3 w-32 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
