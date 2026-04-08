export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-5 space-y-4">
      {/* Profile header skeleton */}
      <div className="rounded-xl p-6" style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full animate-pulse" style={{ backgroundColor: "#1a2130" }} />
          <div className="flex-1 space-y-2">
            <div className="h-6 w-40 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            <div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            <div className="flex gap-4 mt-2">
              <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{ backgroundColor: "#131820", border: "1px solid #1e293b", height: "80px" }}
          />
        ))}
      </div>

      {/* Activity skeleton */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
        <div className="h-10" style={{ backgroundColor: "#1a2130" }} />
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3"
            style={{ backgroundColor: "#131820", borderBottom: "1px solid #1e293b" }}
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 w-72 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
              <div className="h-3 w-40 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
