export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-[#363636] border-t-[#3ecf8e] rounded-full animate-spin" />
        <span className="text-[#898989] text-sm">Loading...</span>
      </div>
    </div>
  );
}
