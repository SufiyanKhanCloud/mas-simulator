"use client"

import React, { useRef, useEffect } from "react"
import gsap from "gsap"
import type { SimulationResult } from "@/lib/simulation"
import { ArrowLeft, Clock, Trash2, Server, Users, Shuffle, Zap, ChevronRight } from "lucide-react"

export interface HistoryEntry {
  id: string
  timestamp: number
  type: string
  lambda: number
  mu: number
  servers: number
  usePriority: boolean
  distParams?: {
    distribution: "normal" | "uniform"
    mu?: number
    sigma?: number
    a?: number
    b?: number
  }
  queueTypeLabel?: string
  result: SimulationResult
}

const TYPE_CONFIG: Record<string, { color: string; icon: typeof Server }> = {
  "M/M/1": { color: "#00ff88", icon: Server },
  "M/M/S": { color: "#00d4ff", icon: Users },
  "M/G/1": { color: "#a855f7", icon: Shuffle },
  "M/G/S": { color: "#fbbf24", icon: Shuffle },
}

function getTypeConfig(type: string) {
  if (type.startsWith("M/G/") && parseInt(type.split("/")[2]) > 1) {
    return TYPE_CONFIG["M/G/S"]
  }
  if (type.startsWith("M/M/") && parseInt(type.split("/")[2]) > 1) {
    return TYPE_CONFIG["M/M/S"]
  }
  return TYPE_CONFIG[type] || TYPE_CONFIG["M/M/1"]
}

interface SimulationHistoryProps {
  entries: HistoryEntry[]
  onBack: () => void
  onSelect: (entry: HistoryEntry) => void
  onDelete: (id: string) => void
  onClearAll: () => void
}

export function SimulationHistory({
  entries,
  onBack,
  onSelect,
  onDelete,
  onClearAll,
}: SimulationHistoryProps) {
  const headerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const emptyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.5 }
    )

    if (entries.length > 0 && listRef.current) {
      tl.fromTo(
        Array.from(listRef.current.children),
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06 },
        "-=0.2"
      )
    }

    if (entries.length === 0 && emptyRef.current) {
      tl.fromTo(
        emptyRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.6 },
        "-=0.2"
      )
    }
  }, [entries.length])

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div ref={headerRef} className="mb-10">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Models
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(255, 107, 107, 0.1)",
                  border: "1px solid rgba(255, 107, 107, 0.3)",
                }}
              >
                <Clock
                  className="w-6 h-6"
                  style={{
                    color: "#ff6b6b",
                    filter: "drop-shadow(0 0 4px #ff6b6b)",
                  }}
                />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{
                    color: "#ff6b6b",
                    textShadow: "0 0 10px rgba(255,107,107,0.4)",
                  }}
                >
                  Simulation Activity Log
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entries.length} simulation{entries.length !== 1 ? "s" : ""}{" "}
                  recorded
                </p>
              </div>
            </div>

            {entries.length > 0 && (
              <button
                onClick={onClearAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Empty State */}
        {entries.length === 0 && (
          <div
            ref={emptyRef}
            className="rounded-2xl p-12 text-center"
            style={{
              background: "rgba(8, 12, 20, 0.7)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 107, 107, 0.12)",
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(255, 107, 107, 0.06)",
                border: "1px solid rgba(255, 107, 107, 0.15)",
              }}
            >
              <Zap
                className="w-8 h-8"
                style={{ color: "rgba(255, 107, 107, 0.4)" }}
              />
            </div>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: "rgba(220, 230, 240, 0.7)" }}
            >
              No simulations yet
            </p>
            <p className="text-sm text-muted-foreground">
              Run a simulation to see it appear here.
            </p>
          </div>
        )}

        {/* History List */}
        {entries.length > 0 && (
          <div ref={listRef} className="flex flex-col gap-3">
            {entries.map((entry) => {
              const config = getTypeConfig(entry.type)
              const Icon = config.icon
              const color = config.color
              const date = new Date(entry.timestamp)

              return (
                <HistoryCard
                  key={entry.id}
                  entry={entry}
                  icon={Icon}
                  color={color}
                  date={date}
                  onSelect={() => onSelect(entry)}
                  onDelete={() => onDelete(entry.id)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryCard({
  entry,
  icon: Icon,
  color,
  date,
  onSelect,
  onDelete,
}: {
  entry: HistoryEntry
  icon: React.ComponentType<{
    className?: string
    style?: React.CSSProperties
  }>
  color: string
  date: Date
  onSelect: () => void
  onDelete: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    gsap.to(cardRef.current, {
      scale: 1.015,
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

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group rounded-xl p-4 cursor-pointer transition-colors relative overflow-hidden"
      style={{
        background: "rgba(8, 12, 20, 0.7)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${color}20`,
        boxShadow: `0 0 15px ${color}06`,
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-40"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      <div className="flex items-center gap-4">
        {/* Type icon */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `${color}10`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{ color, filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-base font-bold font-mono"
              style={{
                color,
                textShadow: `0 0 8px ${color}50`,
              }}
            >
              {entry.type}
            </span>
            {entry.usePriority && (
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: "#fbbf24",
                  background: "rgba(251, 191, 36, 0.1)",
                  border: "1px solid rgba(251, 191, 36, 0.25)",
                }}
              >
                Priority
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">
              <span style={{ color: "#00ff88" }}>{"\u03BB"}</span>
              {"="}
              {entry.lambda}
            </span>
            {entry.distParams ? (
              entry.distParams.distribution === "normal" ? (
                <>
                  <span className="font-mono">
                    <span style={{ color: "#00d4ff" }}>{"\u03BC"}</span>
                    {"="}
                    {entry.distParams.mu?.toFixed(2)}
                  </span>
                  <span className="font-mono">
                    <span style={{ color: "#a855f7" }}>{"\u03C3"}</span>
                    {"="}
                    {entry.distParams.sigma?.toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-mono">
                    <span style={{ color: "#00d4ff" }}>a</span>
                    {"="}
                    {entry.distParams.a?.toFixed(2)}
                  </span>
                  <span className="font-mono">
                    <span style={{ color: "#a855f7" }}>b</span>
                    {"="}
                    {entry.distParams.b?.toFixed(2)}
                  </span>
                </>
              )
            ) : (
              <span className="font-mono">
                <span style={{ color: "#00d4ff" }}>{"\u03BC"}</span>
                {"="}
                {entry.mu}
              </span>
            )}
            {entry.servers > 1 && (
              <span className="font-mono">
                <span style={{ color: "#fbbf24" }}>S</span>
                {"="}
                {entry.servers}
              </span>
            )}
            <span className="text-muted-foreground/50">|</span>
            <span>{entry.result.averages.totalCustomers} customers</span>
          </div>

          <div className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
            {formatDate(date)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
            style={{
              color: "rgba(239, 68, 68, 0.7)",
              background: "rgba(239, 68, 68, 0.06)",
            }}
            aria-label="Delete simulation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <ChevronRight
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            style={{ color: `${color}60` }}
          />
        </div>
      </div>
    </div>
  )
}
