export default function TokenDetailSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-pulse" style={{ backgroundColor: 'rgb(17, 18, 20)' }}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left side skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header skeleton */}
          <div className="flex-shrink-0 bg-[#1a1a1a] p-4" style={{ borderBottom: '1px solid rgb(39, 40, 46)' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-700" />
                <div>
                  <div className="h-6 w-24 bg-gray-700 rounded mb-1" />
                  <div className="h-4 w-32 bg-gray-700 rounded" />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-8 gap-6 ml-8">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-12 bg-gray-700 rounded mb-2" />
                    <div className="h-5 w-16 bg-gray-700 rounded mb-1" />
                    <div className="h-3 w-10 bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart skeleton */}
          <div className="flex-shrink-0" style={{ backgroundColor: 'rgb(17, 18, 20)', borderBottom: '1px solid rgb(39, 40, 46)' }}>
            <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid rgb(39, 40, 46)' }}>
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-8 bg-gray-700 rounded" />
                ))}
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-6 bg-gray-700 rounded" />
                <div className="h-6 w-6 bg-gray-700 rounded" />
              </div>
            </div>
            <div className="h-[500px] bg-gray-800/30" />
          </div>

          {/* History skeleton */}
          <div className="flex-1 overflow-hidden">
            <div className="flex" style={{ borderBottom: '1px solid rgb(39, 40, 46)' }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="h-4 w-16 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
            <div className="p-4 space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  {Array.from({ length: 12 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-700 rounded" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side skeleton */}
        <div className="w-[400px] flex-shrink-0 p-4" style={{ backgroundColor: 'rgb(17, 18, 20)', borderLeft: '1px solid rgb(39, 40, 46)' }}>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-8 bg-gray-700 rounded mb-1" />
                  <div className="h-4 w-12 bg-gray-700 rounded" />
                </div>
              ))}
            </div>
            <div className="h-20 bg-gray-700 rounded" />
            <div className="h-8 bg-gray-700 rounded" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 h-8 bg-gray-700 rounded" />
              ))}
            </div>
            <div className="h-12 bg-gray-700 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-6 bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}