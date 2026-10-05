import PulsatingDots from "@/components/auto-index/pulsating-loader"

export default function PulsatingLoaderDemo() {
  return (
    <div className="mx-auto flex min-h-48 w-full max-w-md flex-col items-center justify-center gap-5 rounded-2xl border border-slate-200 bg-white p-8 text-slate-900">
      <PulsatingDots />
      <p className="text-sm text-slate-500">Loading your content</p>
    </div>
  )
}
