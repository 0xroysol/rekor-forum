export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-5 space-y-4">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-56 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />

      {/* Thread header skeleton */}
      <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }}>
        <div className="h-6 w-3/4 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full animate-pulse" style={{ backgroundColor: "#1a2130" }} />
          <div className="h-3 w-32 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
          <div className="h-3 w-24 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
        </div>
      </div>

      {/* Post skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: "#131820", border: "1px solid #1e293b" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
              <div className="h-3 w-20 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            </div>
          </div>
          <div className="space-y-2 pl-[52px]">
            <div className="h-3 w-full rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            <div className="h-3 w-5/6 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
            <div className="h-3 w-2/3 rounded animate-pulse" style={{ backgroundColor: "#1a2130" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
