"use client"

import React, { useRef, useEffect } from "react"
import gsap from "gsap"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter } from "recharts"
import type { SimulationRow, SimulationAverages } from "@/lib/simulation"

interface AnalyticsChartsProps {
  rows: SimulationRow[]
  averages: SimulationAverages
  servers: number
}

export function AnalyticsCharts({ rows, averages, servers }: AnalyticsChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartsRef = useRef<(HTMLDivElement | null)[]>([])

  // Calculate server utilization data
  const totalBusyTime = rows.reduce((sum, row) => sum + row.serviceTime, 0)
  const maxTime = Math.max(...rows.map(r => r.serviceEnd), 1)
  const totalIdleTime = Math.max(0, (maxTime * servers) - totalBusyTime)
  const utilizationData = [
    { name: "Utilized Time", value: parseFloat(totalBusyTime.toFixed(2)), color: "#ff8a38" },
    { name: "Idle Time", value: parseFloat(totalIdleTime.toFixed(2)), color: "#00d4ff" },
  ]

  // Average metrics bar chart with different colors
  const metricColors = {
    "Turnaround": "#ff3333",
    "Wait Time": "#00f5ff",
    "Response": "#a855f7",
    "Inter-Arrival": "#fbbf24",
    "Service": "#00ff88"
  }
  
  const metricsData = [
    { metric: "Turnaround", value: parseFloat(averages.avgTurnaround.toFixed(2)), color: metricColors["Turnaround"] },
    { metric: "Wait Time", value: parseFloat(averages.avgWait.toFixed(2)), color: metricColors["Wait Time"] },
    { metric: "Response", value: parseFloat(averages.avgResponse.toFixed(2)), color: metricColors["Response"] },
    { metric: "Inter-Arrival", value: parseFloat(averages.avgInterArrival.toFixed(2)), color: metricColors["Inter-Arrival"] },
    { metric: "Service", value: parseFloat(averages.avgService.toFixed(2)), color: metricColors["Service"] },
  ]

  // Arrival vs Service Time scatter
  const scatterData = rows.map(row => ({
    id: row.observation,
    x: parseFloat(row.interArrivals.toFixed(2)),
    y: parseFloat(row.serviceTime.toFixed(2)),
    arrivalTime: parseFloat(row.arrivalTime.toFixed(2)),
    serviceTime: parseFloat(row.serviceTime.toFixed(2)),
  }))

  // Queue length over time
  const queueLengthData = rows.map(row => {
    // Count customers waiting (arrived before service end but not in service)
    const waitingCount = rows.filter(
      r => r.arrivalTime <= row.arrivalTime && r.serviceEnd > row.arrivalTime && r.serviceStart > row.arrivalTime
    ).length
    return {
      time: parseFloat(row.arrivalTime.toFixed(2)),
      queueLength: waitingCount,
    }
  })

  const peakQueueLength = Math.max(...queueLengthData.map(d => d.queueLength), 0)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } })

    chartsRef.current.forEach((el, idx) => {
      if (el) {
        tl.fromTo(
          el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6 },
          idx === 0 ? "-=0.3" : "-=0.4"
        )
      }
    })
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          className="p-4 rounded-lg text-xs font-mono backdrop-blur-md border-2"
          style={{
            background: "rgba(8, 12, 20, 0.98)",
            borderColor: data.color,
            boxShadow: `0 0 20px ${data.color}80, inset 0 0 12px ${data.color}20`,
            color: data.color,
          }}
        >
          <div style={{ color: data.color, fontWeight: "bold", fontSize: "0.875rem" }}>
            {data.metric}
          </div>
          <div style={{ color: data.color, marginTop: "4px", fontSize: "1rem", fontWeight: "bold" }}>
            {data.value.toFixed(2)}
          </div>
        </div>
      )
    }
    return null
  }

  // Custom bar shape for outlined style with glow on hover
  const CustomBar = (props: any) => {
    const { x, y, width, height, payload } = props
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={`${payload.color}15`}
          stroke={payload.color}
          strokeWidth={2}
          rx={8}
          ry={8}
          style={{
            filter: `drop-shadow(0 0 8px ${payload.color}40)`,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e: any) => {
            e.target.style.filter = `drop-shadow(0 0 16px ${payload.color}80), drop-shadow(0 0 24px ${payload.color}60)`
            e.target.style.fill = `${payload.color}25`
            e.target.style.strokeWidth = "3"
          }}
          onMouseLeave={(e: any) => {
            e.target.style.filter = `drop-shadow(0 0 8px ${payload.color}40)`
            e.target.style.fill = `${payload.color}15`
            e.target.style.strokeWidth = "2"
          }}
        />
      </g>
    )
  }

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          className="p-3 rounded-lg text-xs font-mono backdrop-blur-md space-y-1"
          style={{
            background: "rgba(8, 12, 20, 0.95)",
            border: "1px solid rgba(0, 212, 255, 0.3)",
            boxShadow: "0 0 12px rgba(0, 212, 255, 0.2)",
            color: "#00d4ff",
          }}
        >
          <div>Customer ID: {data.id}</div>
          <div>Inter-arrival: {data.x.toFixed(2)}</div>
          <div>Service Time: {data.y.toFixed(2)}</div>
        </div>
      )
    }
    return null
  }

  const CustomLineTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="p-3 rounded-lg text-xs font-mono backdrop-blur-md"
          style={{
            background: "rgba(8, 12, 20, 0.95)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.2)",
            color: "#a855f7",
          }}
        >
          <div>Time: {payload[0].payload.time.toFixed(2)}</div>
          <div>Queue Length: {payload[0].value}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Server Utilization Donut Chart */}
      <div
        ref={el => {
          chartsRef.current[0] = el
        }}
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "rgba(8, 12, 20, 0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 255, 136, 0.25)",
          boxShadow: "0 0 40px rgba(0, 255, 136, 0.15)",
        }}
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2" style={{ color: "#00ff88", textShadow: "0 0 12px rgba(0,255,136,0.4)" }}>
            Server Performance & Utilization Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time capacity usage and idle time breakdown across {servers} {servers === 1 ? 'server' : 'servers'}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={utilizationData}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {utilizationData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`${entry.color}15`}
                  stroke={entry.color}
                  strokeWidth={3}
                  style={{
                    filter: `drop-shadow(0 0 12px ${entry.color}60)`,
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e: any) => {
                    e.target.style.filter = `drop-shadow(0 0 20px ${entry.color}90), drop-shadow(0 0 32px ${entry.color}60)`
                    e.target.style.fill = `${entry.color}25`
                    e.target.style.strokeWidth = "4"
                  }}
                  onMouseLeave={(e: any) => {
                    e.target.style.filter = `drop-shadow(0 0 12px ${entry.color}60)`
                    e.target.style.fill = `${entry.color}15`
                    e.target.style.strokeWidth = "3"
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: any) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const color = data.color
                  const percentage = ((data.value / (totalBusyTime + totalIdleTime)) * 100).toFixed(1)
                  return (
                    <div
                      className="p-4 rounded-lg text-xs font-mono backdrop-blur-md border-2"
                      style={{
                        background: "rgba(8, 12, 20, 0.98)",
                        borderColor: color,
                        boxShadow: `0 0 20px ${color}80`,
                      }}
                    >
                      <div style={{ color, fontWeight: "bold", fontSize: "0.875rem" }}>
                        {data.name}
                      </div>
                      <div style={{ color, marginTop: "4px", fontSize: "1rem", fontWeight: "bold" }}>
                        {percentage}%
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-muted/20">
          {utilizationData.map((entry, idx) => (
            <div 
              key={idx} 
              className="flex items-center gap-3 p-4 rounded-lg transition-all"
              style={{ 
                background: `${entry.color}12`, 
                border: `2px solid ${entry.color}40`,
                boxShadow: `0 0 12px ${entry.color}30`
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.background = `${entry.color}20`
                e.currentTarget.style.boxShadow = `0 0 20px ${entry.color}50`
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.background = `${entry.color}12`
                e.currentTarget.style.boxShadow = `0 0 12px ${entry.color}30`
              }}
            >
              <div className="w-4 h-4 rounded-full" style={{ background: entry.color, boxShadow: `0 0 10px ${entry.color}` }} />
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: "600", color: entry.color }}>{entry.name}</div>
                <div className="text-lg font-bold" style={{ color: entry.color }}>
                  {((entry.value / (totalBusyTime + totalIdleTime)) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Average Metrics Bar Chart */}
      <div
        ref={el => {
          chartsRef.current[1] = el
        }}
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "rgba(8, 12, 20, 0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 0, 110, 0.25)",
          boxShadow: "0 0 40px rgba(255, 0, 110, 0.1)",
        }}
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2" style={{ color: "#ff006e", textShadow: "0 0 12px rgba(255,0,110,0.4)" }}>
            Performance Metrics Overview
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Time-based metrics showing average system performance indicators
          </p>
          
          {/* Color Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {metricsData.map((item) => (
              <div key={item.metric} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                <span className="text-xs text-muted-foreground">{item.metric}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metricsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
            <XAxis dataKey="metric" stroke="rgba(148, 163, 184, 0.5)" />
            <YAxis stroke="rgba(148, 163, 184, 0.5)" />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar 
              dataKey="value" 
              shape={<CustomBar />}
              radius={[8, 8, 0, 0]}
            >
              {metricsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Arrival vs Service Time Scatter Plot */}
      <div
        ref={el => {
          chartsRef.current[2] = el
        }}
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "rgba(8, 12, 20, 0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(168, 85, 247, 0.25)",
          boxShadow: "0 0 40px rgba(168, 85, 247, 0.15)",
        }}
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2" style={{ color: "#a855f7", textShadow: "0 0 12px rgba(168,85,247,0.4)" }}>
            Service Dynamics Analysis
          </h3>
          <p className="text-sm text-muted-foreground">
            Relationship between inter-arrival times and service times for each customer
          </p>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.15)" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Inter-arrival Time" 
              stroke="rgba(168, 85, 247, 0.6)"
              label={{ value: "Inter-arrival Time", position: "insideBottomRight", offset: -10, fill: "rgba(168, 85, 247, 0.8)" }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Service Time" 
              stroke="rgba(168, 85, 247, 0.6)"
              label={{ value: "Service Time", angle: -90, position: "insideLeft", fill: "rgba(168, 85, 247, 0.8)" }}
            />
            <Tooltip content={<CustomScatterTooltip />} />
            <Scatter 
              name="Customers" 
              data={scatterData} 
              fill="#a855f7"
              fillOpacity={0.7}
              style={{
                filter: "drop-shadow(0 0 4px rgba(168, 85, 247, 0.6))",
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Queue Length Over Time Line Chart */}
      <div
        ref={el => {
          chartsRef.current[3] = el
        }}
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "rgba(8, 12, 20, 0.5)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(251, 191, 36, 0.25)",
          boxShadow: "0 0 40px rgba(251, 191, 36, 0.15)",
        }}
      >
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-2" style={{ color: "#fbbf24", textShadow: "0 0 12px rgba(251,191,36,0.4)" }}>
            Queue Length Over Time
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time queue occupancy tracking and peak analysis throughout the simulation period
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={queueLengthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51, 65, 85, 0.3)" />
            <XAxis dataKey="time" stroke="rgba(148, 163, 184, 0.5)" />
            <YAxis stroke="rgba(148, 163, 184, 0.5)" />
            <Tooltip content={<CustomLineTooltip />} />
            <Line
              type="monotone"
              dataKey="queueLength"
              stroke="#fbbf24"
              dot={false}
              strokeWidth={2}
              isAnimationActive={true}
            />
            {peakQueueLength > 0 && (
              <Line
                type="monotone"
                dataKey={() => peakQueueLength}
                stroke="rgba(251, 191, 36, 0.3)"
                strokeDasharray="5 5"
                dot={false}
                strokeWidth={1}
                name="Peak"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm" style={{ color: "hsl(var(--foreground))" }}>
          Peak Queue Length: <span style={{ color: "#fbbf24", fontWeight: "bold" }}>{peakQueueLength}</span>
        </div>
      </div>
    </div>
  )
}
