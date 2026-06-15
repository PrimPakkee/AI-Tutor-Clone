type TopBarProps = {
  title: string
  isLive: boolean
  watcherCount?: number
}

export function TopBar({ title, isLive, watcherCount }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 h-10 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white text-xs font-bold">
          S
        </div>
        <span className="text-sm font-semibold text-slate-800">{title}</span>
      </div>
      {isLive && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 text-xs font-bold tracking-widest">LIVE</span>
          {watcherCount !== undefined && (
            <span className="text-slate-400 text-xs ml-1">{watcherCount} watching</span>
          )}
        </div>
      )}
    </div>
  )
}
