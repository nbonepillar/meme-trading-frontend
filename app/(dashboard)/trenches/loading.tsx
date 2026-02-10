import MainLayout from '@/components/common/layout/main-layout';

export default function Loading() {
  return (
    <MainLayout noPadding>
      <div className="h-full flex flex-col">
        <div className="h-[60px] flex items-center px-6 justify-between" style={{ backgroundColor: 'rgb(12, 12, 15)' }}>
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-16 bg-muted animate-pulse rounded" />
        </div>

        <div className="flex-1 px-[10px] overflow-hidden">
          <div className="h-full flex rounded-[5px] overflow-hidden" style={{ backgroundColor: 'rgb(17, 18, 20)', border: '1px solid rgb(39, 40, 46)' }}>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex-1 flex flex-col last:border-r-0"
                style={{ borderRight: i < 3 ? '1px solid rgb(39, 40, 46)' : 'none' }}
              >
                <div className="h-12 flex items-center px-4" style={{ borderBottom: '1px solid rgb(39, 40, 46)' }}>
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex-1 p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div
                      key={j}
                      className="h-[120px] bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
