export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-black dark:to-zinc-950 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse mx-auto mb-3">
          <span className="text-white text-lg font-bold">PT</span>
        </div>
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1 animate-pulse">
          Payment Tools
        </h1>
        <p className="text-xs text-slate-500 dark:text-zinc-500">Loading tools...</p>
      </div>
    </div>
  );
};
