"use client"

import type { ServiceChunk } from "@/lib/simulation"
import { useMemo, useRef, useEffect } from "react"
import gsap from "gsap"

const CUSTOMER_NEON_COLORS = [
  "#00ff88",
  "#00d4ff",
  "#a855f7",
  "#ff2d95",
  "#fbbf24",
  "#06b6d4",
  "#f43f5e",
  "#10b981",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#e11d48",
  "#0ea5e9",
  "#c084fc",
  "#34d399",
  "#fb7185",
  "#38bdf8",
  "#facc15",
  "#818cf8",
  "#4ade80",
]

const IDLE_COLOR = "#1e293b"

interface GanttChartProps {
  chunks: ServiceChunk[]
  serverCount: number
  title?: string
}

interface TimelineBlock {
  label: string
  start: number
  end: number
}

function buildTimeline(chunks: ServiceChunk[]): TimelineBlock[] {
  const timeline: TimelineBlock[] = []
  if (chunks.length === 0) return timeline

  let currentTime = chunks[0].start
  for (const chunk of chunks) {
    if (chunk.start > currentTime) {
      timeline.push({ label: "Idle", start: currentTime, end: chunk.start })
    }
    timeline.push({ label: chunk.label, start: chunk.start, end: chunk.end })
    currentTime = chunk.end
  }
  return timeline
}

function GanttRow({
  timeline,
  colorMap,
  title,
}: {
  timeline: TimelineBlock[]
  colorMap: Record<string, string>
  title?: string
}) {
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (rowRef.current) {
      gsap.fromTo(
        Array.from(rowRef.current.children),
        { opacity: 0, scale: 0.5, y: 15 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.04,
          ease: "back.out(1.7)",
        }
      )
    }
  }, [])

  return (
    <div className="mb-8">
      {title && (
        <h4 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#00d4ff" }}>
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#00d4ff", boxShadow: "0 0 8px #00d4ff" }}
          />
          {title}
        </h4>
      )}
      <div ref={rowRef} className="flex flex-wrap gap-2">
        {timeline.map((block, i) => {
          const isIdle = block.label === "Idle"
          const bgColor = isIdle ? IDLE_COLOR : colorMap[block.label] || "#4b5563"
          const duration = block.end - block.start

          return (
            <div
              key={`${block.label}-${block.start}-${i}`}
              className="flex flex-col items-center group"
              style={{ minWidth: Math.max(56, duration * 7) }}
            >
              <div
                className="w-full rounded-lg flex items-center justify-center text-xs font-extrabold py-3.5 px-2 transition-all cursor-default relative overflow-hidden"
                style={{
                  backgroundColor: isIdle ? "rgba(30, 41, 59, 0.4)" : `${bgColor}55`,
                  color: isIdle ? "#475569" : "#ffffff",
                  border: isIdle ? "1px dashed rgba(71, 85, 105, 0.4)" : `2px solid ${bgColor}`,
                  boxShadow: isIdle
                    ? "none"
                    : `0 0 12px ${bgColor}60, 0 0 25px ${bgColor}30, inset 0 0 15px ${bgColor}25`,
                  textShadow: isIdle ? "none" : `0 0 10px ${bgColor}, 0 1px 2px rgba(0,0,0,0.8)`,
                  letterSpacing: "0.05em",
                }}
              >
                {/* Inner glow gradient */}
                {!isIdle && (
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: `linear-gradient(180deg, ${bgColor}40 0%, transparent 50%, ${bgColor}20 100%)`,
                    }}
                  />
                )}
                {/* Hover shine sweep */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: isIdle
                      ? "none"
                      : `linear-gradient(105deg, transparent 30%, ${bgColor}40 48%, ${bgColor}50 50%, ${bgColor}40 52%, transparent 70%)`,
                  }}
                />
                <span className="relative z-10">{block.label}</span>
              </div>
              <div className="flex justify-between w-full mt-1.5 px-0.5">
                <span className="text-[10px] font-mono font-semibold" style={{ color: `${isIdle ? "#475569" : bgColor}99` }}>
                  {block.start}
                </span>
                <span className="text-[10px] font-mono font-semibold" style={{ color: `${isIdle ? "#475569" : bgColor}99` }}>
                  {block.end}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function GanttChart({ chunks, serverCount, title }: GanttChartProps) {
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}
    const uniqueCustomers = [...new Set(chunks.filter((c) => c.label.startsWith("C")).map((c) => c.label))].sort()
    uniqueCustomers.forEach((cust, i) => {
      map[cust] = CUSTOMER_NEON_COLORS[i % CUSTOMER_NEON_COLORS.length]
    })
    return map
  }, [chunks])

  if (chunks.length === 0) return null

  if (serverCount <= 1) {
    const timeline = buildTimeline(chunks)
    return (
      <div
        className="rounded-xl border overflow-hidden p-6"
        style={{
          background: "rgba(8, 12, 20, 0.75)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(0, 212, 255, 0.2)",
          boxShadow: "0 0 30px rgba(0, 212, 255, 0.05)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-2.5 h-2.5 rounded-full neon-pulse"
            style={{ background: "#00d4ff", boxShadow: "0 0 10px #00d4ff" }}
          />
          <h3 className="text-lg font-bold" style={{ color: "#00d4ff", textShadow: "0 0 8px rgba(0,212,255,0.4)" }}>
            {title || "Server Utilization Timeline"}
          </h3>
        </div>
        <GanttRow timeline={timeline} colorMap={colorMap} />
        <NeonLegend colorMap={colorMap} />
      </div>
    )
  }

  const serverCharts = []
  for (let s = 0; s < serverCount; s++) {
    const srvName = `S${s + 1}`
    const srvChunks = chunks.filter((c) => c.server === srvName)
    if (srvChunks.length === 0) continue
    const timeline = buildTimeline(srvChunks.map((c) => ({ label: c.label, start: c.start, end: c.end })))
    serverCharts.push(
      <GanttRow key={srvName} timeline={timeline} colorMap={colorMap} title={`Server ${s + 1}`} />
    )
  }

  return (
    <div
      className="rounded-xl border overflow-hidden p-6"
      style={{
        background: "rgba(8, 12, 20, 0.75)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(0, 212, 255, 0.2)",
        boxShadow: "0 0 30px rgba(0, 212, 255, 0.05)",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-2.5 h-2.5 rounded-full neon-pulse"
          style={{ background: "#00d4ff", boxShadow: "0 0 10px #00d4ff" }}
        />
        <h3 className="text-lg font-bold" style={{ color: "#00d4ff", textShadow: "0 0 8px rgba(0,212,255,0.4)" }}>
          {title || "Server Utilization Timeline"}
        </h3>
      </div>
      {serverCharts}
      <NeonLegend colorMap={colorMap} />
    </div>
  )
}

function NeonLegend({ colorMap }: { colorMap: Record<string, string> }) {
  return (
    <div
      className="flex flex-wrap gap-4 mt-6 pt-4 border-t"
      style={{ borderColor: "rgba(51, 65, 85, 0.3)" }}
    >
      {Object.entries(colorMap).map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded"
            style={{
              backgroundColor: `${color}55`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 6px ${color}60`,
            }}
          />
          <span className="text-xs font-mono font-bold" style={{ color, textShadow: `0 0 6px ${color}50` }}>
            {label}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <div
          className="w-4 h-4 rounded"
          style={{
            backgroundColor: "rgba(30, 41, 59, 0.4)",
            border: "1px dashed #475569",
          }}
        />
        <span className="text-xs font-mono text-muted-foreground">Idle</span>
      </div>
    </div>
  )
}
