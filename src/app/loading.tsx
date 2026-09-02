export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#45645e]">
        <svg
          className="animate-spin"
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="50 14"
          />
        </svg>
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}
