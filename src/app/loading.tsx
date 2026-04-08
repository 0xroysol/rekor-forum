export default function Loading() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080a0f" }}>
      <div className="mx-auto max-w-7xl px-5 py-5 space-y-4">
        {/* Welcome banner skeleton */}
        <div className="h-28 rounded-xl animate-pulse" style={{ backgroundColor: "#131820" }} />
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            {/* Category group skeletons */}
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-32 mb-2 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1e293b" }}>
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-4 px-4 py-3.5" style={{ backgroundColor: "#131820", borderBottom: "1px solid #1e293b" }}>
                      <div className="w-11 h-11 rounded-lg animate-pulse" style={{ backgroundColor: "#1a2130" }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
                        <div className="h-3 w-64 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Sidebar skeleton */}
          <div className="hidden xl:block w-72 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ backgroundColor: "#131820", border: "1px solid #1e293b", height: "160px" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
