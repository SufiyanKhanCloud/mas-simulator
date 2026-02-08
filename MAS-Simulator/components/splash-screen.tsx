"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import gsap from "gsap"

const MATH_FORMULAS = [
  "P(X=k) = e^{-\u03BB} \u00B7 \u03BB^k / k!",
  "\u03C1 = \u03BB / (s\u03BC)",
  "L_q = \u03BB\u00B2 / \u03BC(\u03BC-\u03BB)",
  "W = 1 / (\u03BC - \u03BB)",
  "W_q = \u03BB / \u03BC(\u03BC-\u03BB)",
  "\u03C0_0 = 1 - \u03C1",
  "L_s = \u03BB / (\u03BC - \u03BB)",
  "P_n = (1-\u03C1)\u03C1^n",
  "\u2211 P(n) = 1",
  "E[N] = \u03BB \u00B7 W",
  "\u03BC > \u03BB",
  "f(t) = \u03BBe^{-\u03BBt}",
  "P(W>t) = e^{-\u03BCt}",
  "\u03C3\u00B2 = \u03BB",
  "L = \u03BBW",
  "\u03C1 = \u03BB/\u03BC < 1",
]

const STAT_FACTS = [
  { label: "Poisson Distribution", value: "P(X=k)", desc: "Probability of k arrivals in time t" },
  { label: "Little's Law", value: "L = \u03BBW", desc: "Avg customers = arrival rate x avg wait" },
  { label: "Utilization Factor", value: "\u03C1 = \u03BB/\u03BC", desc: "Server busy fraction" },
  { label: "Stability Condition", value: "\u03C1 < 1", desc: "System must not be overloaded" },
  { label: "Avg Queue Length", value: "L_q", desc: "Expected number waiting in queue" },
  { label: "Service Rate", value: "\u03BC", desc: "Customers served per unit time" },
]

const PILLAR_COUNT = 16

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pillarsRef = useRef<HTMLDivElement>(null)
  const formulasRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const progressTextRef = useRef<HTMLSpanElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const hasRun = useRef(false)
  const [mounted, setMounted] = useState(false)

  // Only render random positions after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const runAnimation = useCallback(() => {
    if (hasRun.current) return
    hasRun.current = true

    const tl = gsap.timeline()

    // Phase 1: Math formulas rain in from top
    if (formulasRef.current) {
      const formulas = Array.from(formulasRef.current.children) as HTMLElement[]
      gsap.set(formulas, { opacity: 0, y: -120 })

      tl.to(formulas, {
        opacity: 1,
        y: 0,
        duration: 1.0,
        stagger: { each: 0.04, from: "random" },
        ease: "power2.out",
      })

      // Continuous floating
      formulas.forEach((f, i) => {
        gsap.to(f, {
          y: `+=${15 + Math.random() * 30}`,
          x: `+=${(Math.random() - 0.5) * 40}`,
          duration: 2.5 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.08,
        })
      })
    }

    // Phase 2: Title appears big
    tl.fromTo(
      titleRef.current,
      { opacity: 0, scale: 0.5, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(2)" },
      "+=0.2"
    )

    // Phase 2b: Glitch flicker on title
    tl.to(titleRef.current, {
      opacity: 0.2,
      duration: 0.04,
      repeat: 7,
      yoyo: true,
      ease: "none",
    })

    // Phase 3: Loader bar fills
    tl.to(
      progressRef.current,
      {
        width: "100%",
        duration: 2.5,
        ease: "power2.inOut",
        onUpdate: function () {
          if (progressTextRef.current) {
            const prog = Math.round(this.progress() * 100)
            progressTextRef.current.textContent = `${prog}%`
          }
        },
      },
      "-=0.3"
    )

    // Phase 3b: Status messages cycle
    if (statusRef.current) {
      const messages = [
        "Initializing Poisson engine...",
        "Loading queue models...",
        "Compiling service distributions...",
        "Calibrating arrival rates...",
        "Rendering simulation core...",
        "System ready.",
      ]
      messages.forEach((msg, i) => {
        tl.to(
          statusRef.current,
          {
            duration: 0.01,
            onStart: () => {
              if (statusRef.current) statusRef.current.textContent = msg
            },
          },
          `-=${2.5 - i * 0.4}`
        )
      })
    }

    // Phase 4: Stats cards stagger in
    if (statsRef.current) {
      tl.fromTo(
        Array.from(statsRef.current.children),
        { opacity: 0, y: 20, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08 },
        "-=1.2"
      )
    }

    // Phase 5: Pillars fall and shatter downward
    if (pillarsRef.current) {
      const pillars = Array.from(pillarsRef.current.children) as HTMLElement[]
      gsap.set(pillars, { y: 0, opacity: 1 })

      tl.to(
        pillars,
        {
          y: "120vh",
          opacity: 0,
          duration: 1.0,
          stagger: { each: 0.04, from: "edges" },
          ease: "power3.in",
        },
        "+=0.6"
      )
    }

    // Phase 6: Everything fades out
    tl.to(
      containerRef.current,
      {
        opacity: 0,
        duration: 0.5,
        ease: "power2.in",
        onComplete,
      },
      "-=0.3"
    )
  }, [onComplete])

  useEffect(() => {
    if (!mounted) return
    const raf = requestAnimationFrame(() => {
      runAnimation()
    })
    return () => cancelAnimationFrame(raf)
  }, [mounted, runAnimation])

  // Deterministic positions for SSR, random offsets only after mount
  const formulaPositions = MATH_FORMULAS.map((_, i) => {
    const baseLeft = 3 + (i % 5) * 19
    const baseTop = 5 + Math.floor(i / 5) * 25
    return { baseLeft, baseTop }
  })

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 overflow-hidden"
      style={{ background: "#080c14" }}
    >
      {/* Floating math formulas background */}
      <div ref={formulasRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {MATH_FORMULAS.map((formula, i) => {
          const pos = formulaPositions[i]
          // Only add randomness client-side
          const randomOffsetLeft = mounted ? ((i * 7 + 3) % 11) : 0
          const randomOffsetTop = mounted ? ((i * 5 + 2) % 9) : 0
          return (
            <div
              key={`formula-${i}`}
              className="absolute font-mono select-none whitespace-nowrap"
              style={{
                left: `${pos.baseLeft + randomOffsetLeft}%`,
                top: `${pos.baseTop + randomOffsetTop}%`,
                fontSize: `${14 + (i % 5) * 2}px`,
                color:
                  i % 3 === 0
                    ? "rgba(0, 255, 136, 0.3)"
                    : i % 3 === 1
                      ? "rgba(0, 212, 255, 0.25)"
                      : "rgba(168, 85, 247, 0.22)",
              }}
            >
              {formula}
            </div>
          )
        })}
      </div>

      {/* Pillar overlay - vertical strips that will fall away */}
      <div ref={pillarsRef} className="absolute inset-0 flex pointer-events-none">
        {Array.from({ length: PILLAR_COUNT }).map((_, i) => (
          <div
            key={`pillar-${i}`}
            className="flex-1 h-full"
            style={{
              background:
                i % 2 === 0
                  ? "linear-gradient(180deg, #080c14 0%, #0a1020 50%, #080c14 100%)"
                  : "linear-gradient(180deg, #0a0e18 0%, #0c1226 50%, #0a0e18 100%)",
              borderLeft: "1px solid rgba(0, 255, 136, 0.04)",
              borderRight: "1px solid rgba(0, 212, 255, 0.04)",
            }}
          />
        ))}
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
        {/* Title - BIGGER */}
        <div ref={titleRef} className="text-center mb-12 opacity-0">
          <div
            className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter mb-4"
            style={{
              color: "#00ff88",
              textShadow:
                "0 0 15px rgba(0,255,136,0.7), 0 0 40px rgba(0,255,136,0.4), 0 0 80px rgba(0,255,136,0.2), 0 0 120px rgba(0,255,136,0.1)",
            }}
          >
            QUEUE SIM
          </div>
          <div
            className="text-base md:text-lg font-mono tracking-[0.4em] uppercase"
            style={{
              color: "rgba(0, 212, 255, 0.8)",
              textShadow: "0 0 12px rgba(0,212,255,0.5)",
            }}
          >
            Queueing Theory Engine
          </div>
        </div>

        {/* Loader bar - BIGGER */}
        <div ref={loaderRef} className="w-80 sm:w-96 md:w-[480px] mb-4">
          <div
            className="h-3 rounded-full overflow-hidden relative"
            style={{
              background: "rgba(0, 255, 136, 0.06)",
              border: "1px solid rgba(0, 255, 136, 0.2)",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
            }}
          >
            <div
              ref={progressRef}
              className="h-full rounded-full"
              style={{
                width: "0%",
                background: "linear-gradient(90deg, #00ff88, #00d4ff, #a855f7)",
                boxShadow:
                  "0 0 15px rgba(0,255,136,0.6), 0 0 40px rgba(0,255,136,0.3), 0 0 60px rgba(0,212,255,0.2)",
              }}
            />
          </div>
          <div className="flex justify-between mt-3 items-center">
            <span
              ref={statusRef}
              className="text-xs font-mono"
              style={{ color: "rgba(0, 255, 136, 0.6)" }}
            >
              Initializing...
            </span>
            <span
              ref={progressTextRef}
              className="text-lg font-mono font-bold"
              style={{ color: "#00d4ff", textShadow: "0 0 10px rgba(0,212,255,0.5)" }}
            >
              0%
            </span>
          </div>
        </div>

        {/* Stats cards grid */}
        <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-8 w-full max-w-2xl">
          {STAT_FACTS.map((stat, i) => (
            <div
              key={stat.label}
              className="rounded-lg px-4 py-3 text-center"
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: `1px solid ${
                  i % 3 === 0
                    ? "rgba(0,255,136,0.2)"
                    : i % 3 === 1
                      ? "rgba(0,212,255,0.2)"
                      : "rgba(168,85,247,0.2)"
                }`,
                boxShadow: `0 0 10px ${
                  i % 3 === 0
                    ? "rgba(0,255,136,0.05)"
                    : i % 3 === 1
                      ? "rgba(0,212,255,0.05)"
                      : "rgba(168,85,247,0.05)"
                }`,
              }}
            >
              <div
                className="font-mono text-lg font-bold mb-1"
                style={{
                  color:
                    i % 3 === 0 ? "#00ff88" : i % 3 === 1 ? "#00d4ff" : "#a855f7",
                  textShadow: `0 0 8px ${
                    i % 3 === 0
                      ? "rgba(0,255,136,0.4)"
                      : i % 3 === 1
                        ? "rgba(0,212,255,0.4)"
                        : "rgba(168,85,247,0.4)"
                  }`,
                }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(220,230,240,0.7)" }}>
                {stat.label}
              </div>
              <div className="text-[9px]" style={{ color: "rgba(148,163,184,0.6)" }}>
                {stat.desc}
              </div>
            </div>
          ))}
        </div>

        {/* Module tags */}
        <div className="mt-8 flex gap-4 flex-wrap justify-center">
          {["M/M/1", "M/M/S", "M/G/1", "M/G/S"].map((tag, i) => {
            const colors = ["#00ff88", "#00d4ff", "#a855f7", "#fbbf24"]
            const c = colors[i % colors.length]
            return (
              <div
                key={tag}
                className="px-4 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-widest"
                style={{
                  borderColor: `${c}30`,
                  color: `${c}`,
                  background: `${c}08`,
                  textShadow: `0 0 6px ${c}40`,
                }}
              >
                {tag}
              </div>
            )
          })}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-6 left-6 font-mono text-xs z-20" style={{ color: "rgba(0,255,136,0.4)" }}>
        {">"} SYS.INIT
        <div className="text-[9px] mt-1" style={{ color: "rgba(0,255,136,0.2)" }}>
          QUEUE_THEORY::CORE
        </div>
      </div>
      <div className="absolute top-6 right-6 font-mono text-xs z-20 text-right" style={{ color: "rgba(0,212,255,0.4)" }}>
        v2.0.26
        <div className="text-[9px] mt-1" style={{ color: "rgba(0,212,255,0.2)" }}>
          NODE::ACTIVE
        </div>
      </div>
      <div className="absolute bottom-6 left-6 font-mono text-[9px] z-20" style={{ color: "rgba(0,255,136,0.25)" }}>
        [SIMULATION ENGINE LOADED]
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] z-20" style={{ color: "rgba(0,212,255,0.25)" }}>
        THREADS: READY
      </div>

      {/* Corner bracket decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 z-20" style={{ borderTop: "2px solid rgba(0,255,136,0.3)", borderLeft: "2px solid rgba(0,255,136,0.3)" }} />
      <div className="absolute top-4 right-4 w-8 h-8 z-20" style={{ borderTop: "2px solid rgba(0,212,255,0.3)", borderRight: "2px solid rgba(0,212,255,0.3)" }} />
      <div className="absolute bottom-4 left-4 w-8 h-8 z-20" style={{ borderBottom: "2px solid rgba(0,255,136,0.3)", borderLeft: "2px solid rgba(0,255,136,0.3)" }} />
      <div className="absolute bottom-4 right-4 w-8 h-8 z-20" style={{ borderBottom: "2px solid rgba(0,212,255,0.3)", borderRight: "2px solid rgba(0,212,255,0.3)" }} />
    </div>
  )
}
