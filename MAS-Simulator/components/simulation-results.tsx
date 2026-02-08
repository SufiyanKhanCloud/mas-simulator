"use client"

import React from "react"

import { useRef, useEffect } from "react"
import gsap from "gsap"
import type { SimulationResult } from "@/lib/simulation"
import { GanttChart } from "./gantt-chart"
import { AnalyticsCharts } from "./analytics-charts"
import { ArrowLeft, Clock, Users, Activity, Timer, Server, Gauge, BarChart3 } from "lucide-react"

interface SimulationResultsProps {
  result: SimulationResult
  lambda: number
  mu: number
  servers: number
  usePriority: boolean
  onBack: () => void
  queueTypeLabel?: string
  distParams?: { distribution: "normal" | "uniform"; mu?: number; sigma?: number; a?: number; b?: number }
}

const NEON_COLORS = [
  "#00ff88",
  "#00d4ff",
  "#a855f7",
  "#ff2d95",
  "#fbbf24",
  "#00ff88",
  "#00d4ff",
]

export function SimulationResults({ result, lambda, mu, servers, usePriority, onBack, queueTypeLabel, distParams }: SimulationResultsProps) {
  const { rows, chunks, averages } = result
  const queueType = queueTypeLabel || (servers > 1 ? `M/M/${servers}` : "M/M/1")
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<HTMLDivElement>(null)

  const metricsCards = [
    { label: "Avg Turnaround", value: averages.avgTurnaround.toFixed(2), icon: Clock },
    { label: "Avg Wait Time", value: averages.avgWait.toFixed(2), icon: Timer },
    { label: "Avg Response", value: averages.avgResponse.toFixed(2), icon: Activity },
    { label: "Avg Inter-Arrival", value: averages.avgInterArrival.toFixed(2), icon: BarChart3 },
    { label: "Avg Service", value: averages.avgService.toFixed(2), icon: Server },
    { label: "Utilization", value: `${averages.serverUtilization.toFixed(1)}%`, icon: Gauge },
    { label: "Total Customers", value: averages.totalCustomers.toString(), icon: Users },
  ]

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )

    if (cardsRef.current) {
      tl.fromTo(
        Array.from(cardsRef.current.children),
        { opacity: 0, y: 30, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06 },
        "-=0.2"
      )
    }

    tl.fromTo(
      tableRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.2"
    )

    tl.fromTo(
      ganttRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6 },
      "-=0.3"
    )
  }, [])

  const columnDefs = [
    { key: "observation", label: "#" },
    { key: "cp", label: "CP" },
    { key: "cpLookup", label: "CP Lookup" },
    { key: "noBetweenArrivals", label: "Between Arrivals" },
    { key: "interArrivals", label: "Inter-Arrivals" },
    { key: "arrivalTime", label: "Arrival Time" },
    { key: "serviceTime", label: "Service Time" },
    ...(usePriority ? [{ key: "priority", label: "Priority" }] : []),
    { key: "serviceStart", label: "Service Start" },
    { key: "serviceEnd", label: "Service End" },
    ...(servers > 1 ? [{ key: "server", label: "Server" }] : []),
    { key: "turnaroundTime", label: "Turnaround" },
    { key: "waitTime", label: "Wait" },
    { key: "responseTime", label: "Response" },
  ]

  return (
    <div className="min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 py-16">
        {/* Header */}
        <div ref={headerRef} className="flex items-center gap-4 mb-10">
          <NeonBackButton onClick={onBack} />
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "#00ff88", textShadow: "0 0 10px rgba(0,255,136,0.4)" }}
            >
              Performance Analysis
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {queueType} Queue{" "}
              <span className="mx-1.5 text-muted-foreground/40">|</span>
              <span style={{ color: "#00ff88" }}>{"\u03BB"} = {lambda}</span>
              {distParams ? (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">|</span>
                  {distParams.distribution === "normal" ? (
                    <>
                      <span style={{ color: "#00d4ff" }}>{"\u03BC"} = {distParams.mu?.toFixed(2)}</span>
                      <span className="mx-1.5 text-muted-foreground/40">|</span>
                      <span style={{ color: "#a855f7" }}>{"\u03C3"} = {distParams.sigma?.toFixed(2)}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: "#00d4ff" }}>a = {distParams.a?.toFixed(2)}</span>
                      <span className="mx-1.5 text-muted-foreground/40">|</span>
                      <span style={{ color: "#a855f7" }}>b = {distParams.b?.toFixed(2)}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">|</span>
                  <span style={{ color: "#00d4ff" }}>{"\u03BC"} = {mu}</span>
                </>
              )}
              {servers > 1 && (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">|</span>
                  <span style={{ color: "#fbbf24" }}>Servers = {servers}</span>
                </>
              )}
              {usePriority && (
                <>
                  <span className="mx-1.5 text-muted-foreground/40">|</span>
                  <span style={{ color: "#fbbf24" }}>Priority</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div ref={cardsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-10">
          {metricsCards.map((metric, idx) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              color={NEON_COLORS[idx]}
            />
          ))}
        </div>

        {/* Data Table */}
        <div ref={tableRef} className="mb-10">
          <NeonTable rows={rows} columnDefs={columnDefs} />
        </div>

        {/* Gantt Chart */}
        <div ref={ganttRef}>
          <GanttChart chunks={chunks} serverCount={servers} />
        </div>

        {/* Analytics Charts */}
        <div className="mt-12">
          <AnalyticsCharts rows={rows} averages={averages} servers={servers} />
        </div>
      </div>
    </div>
  )
}

function NeonBackButton({ onClick }: { onClick: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleMouseEnter = () => {
    gsap.to(btnRef.current, { scale: 1.05, duration: 0.2, ease: "power2.out" })
  }
  const handleMouseLeave = () => {
    gsap.to(btnRef.current, { scale: 1, duration: 0.2, ease: "power2.out" })
  }

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
      style={{
        background: "rgba(0, 255, 136, 0.08)",
        color: "#00ff88",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        boxShadow: "0 0 12px rgba(0, 255, 136, 0.1)",
      }}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.05,
      duration: 0.25,
      ease: "power2.out",
    })
  }
  const handleMouseLeave = () => {
    gsap.to(cardRef.current, {
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl p-4 flex flex-col gap-3 transition-colors cursor-default"
      style={{
        background: "rgba(8, 12, 20, 0.7)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${color}30`,
        boxShadow: `0 0 15px ${color}10`,
      }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color, filter: `drop-shadow(0 0 4px ${color}80)` }} />
        <span className="text-xs text-muted-foreground truncate">{label}</span>
      </div>
      <span
        className="text-2xl font-bold font-mono"
        style={{
          color,
          textShadow: `0 0 12px ${color}60, 0 0 25px ${color}30`,
        }}
      >
        {value}
      </span>
    </div>
  )
}

function NeonTable({
  rows,
  columnDefs,
}: {
  rows: SimulationResult["rows"]
  columnDefs: { key: string; label: string }[]
}) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "rgba(8, 12, 20, 0.75)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(0, 255, 136, 0.15)",
        boxShadow: "0 0 30px rgba(0, 255, 136, 0.04)",
      }}
    >
      <div
        className="px-6 py-4 border-b flex items-center gap-3"
        style={{ borderColor: "rgba(0, 255, 136, 0.12)" }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full neon-pulse"
          style={{ background: "#00ff88", boxShadow: "0 0 10px #00ff88" }}
        />
        <h3 className="text-lg font-bold" style={{ color: "#00ff88", textShadow: "0 0 8px rgba(0,255,136,0.4)" }}>
          Simulation Data
        </h3>
        <span className="text-xs font-mono ml-auto" style={{ color: "rgba(0, 212, 255, 0.6)" }}>
          {rows.length} records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: "rgba(0, 255, 136, 0.1)",
                background: "rgba(0, 255, 136, 0.04)",
              }}
            >
              {columnDefs.map((col) => (
                <th
                  key={col.key}
                  className="px-3 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                  style={{ color: "#00ff88", textShadow: "0 0 6px rgba(0,255,136,0.3)" }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.observation}
                className="border-b transition-colors hover:bg-[rgba(0,255,136,0.04)]"
                style={{
                  borderColor: "rgba(51, 65, 85, 0.2)",
                  background: i % 2 === 0 ? "transparent" : "rgba(15, 23, 42, 0.3)",
                }}
              >
                {columnDefs.map((col) => {
                  const val = row[col.key as keyof typeof row]
                  const displayVal =
                    typeof val === "number" && (col.key === "cp" || col.key === "cpLookup")
                      ? val.toFixed(5)
                      : val
                  return (
                    <td
                      key={col.key}
                      className="px-3 py-3 whitespace-nowrap font-mono text-xs text-center"
                      style={{ color: "rgba(220, 230, 240, 0.85)" }}
                    >
                      {displayVal !== undefined ? String(displayVal) : ""}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
