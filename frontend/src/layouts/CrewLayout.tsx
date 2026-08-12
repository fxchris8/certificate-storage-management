import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { CrewSidebar } from "../features/crew/components/CrewSidebar"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CrewUser } from "../features/crew/types/crew.types"

export function CrewLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [crew, setCrew] = useState<CrewUser | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("crew")
    if (stored) {
      try {
        setCrew(JSON.parse(stored))
      } catch {
        // ignore malformed data
      }
    }
  }, [])

  return (
    <div className="flex h-screen w-full bg-zinc-50/50 dark:bg-zinc-950 relative">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:relative md:z-0 transition-transform duration-300 ease-in-out md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <CrewSidebar collapsed={sidebarCollapsed} />
      </div>

      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-zinc-200/60 bg-white/80 px-4 md:px-8 backdrop-blur-sm z-10 dark:bg-zinc-950/80 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-2 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 focus:outline-none dark:hover:bg-zinc-800 dark:text-zinc-400"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 focus:outline-none dark:hover:bg-zinc-800 dark:text-zinc-400"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Right side — Crew info */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-2 md:gap-3 pl-3 md:pl-6 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col items-end max-w-[180px] md:max-w-none">
                <span className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate w-full text-right">
                  {crew?.name || "Crew"}
                </span>
                <span className="text-xs md:text-xs text-zinc-500 truncate w-full text-left">
                  {crew?.seafarercode || "Crew Portal"}
                </span>
              </div>
              <div className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/20 shrink-0">
                {(crew?.name || "C").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default CrewLayout
