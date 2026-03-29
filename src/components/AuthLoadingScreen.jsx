export default function AuthLoadingScreen({ message = "Checking your secure session..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#183c7d_0%,#10254f_40%,#081326_100%)] px-4 text-slate-100">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/10 px-6 py-5 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-white/20 border-t-cyan-300" />
        <p className="text-sm font-medium tracking-wide text-slate-100">{message}</p>
      </div>
    </div>
  );
}
