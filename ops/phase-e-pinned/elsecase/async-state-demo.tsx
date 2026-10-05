"use client"

import { useState } from "react"
import { AsyncState, type AsyncStatus } from "@/components/auto-index/async-state"

const states: AsyncStatus[] = ["loading", "success", "empty", "error", "offline", "forbidden", "refreshing"]

export default function AsyncStateDemo() {
  const [status, setStatus] = useState<AsyncStatus>("error")

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-900">
      <h2 className="mb-1 text-lg font-semibold">Workspace members</h2>
      <p className="mb-5 text-sm text-slate-500">Choose a response to preview each state.</p>
      <label className="mb-4 block text-sm font-medium" htmlFor="async-state-status">Response</label>
      <select
        className="mb-5 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3"
        id="async-state-status"
        onChange={(event) => setStatus(event.target.value as AsyncStatus)}
        value={status}
      >
        {states.map((state) => <option key={state} value={state}>{state}</option>)}
      </select>
      <AsyncState onRetry={() => setStatus("success")} status={status}>
        <div className="rounded-lg border border-slate-200 p-5">
          <p className="font-semibold">12 active members</p>
          <p className="text-sm text-slate-500">The latest workspace response is ready.</p>
        </div>
      </AsyncState>
    </div>
  )
}
