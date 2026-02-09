import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "../features/dashboard/components/Sidebar"
import { Bell, Search, Menu } from "lucide-react"
import { cn } from "@/lib/utils"

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile menu when route changes
  // You might want to add useLocation here if you want that behavior, 
  // but for now let's just create the UI structure.

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
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 md:relative md:z-0 transition-transform duration-300 ease-in-out md:translate-x-0",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <Sidebar collapsed={sidebarCollapsed} />
      </div>
      <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300">
        {/* Modern Header */}
        <header className="flex h-20 items-center justify-between border-b border-zinc-200/60 bg-white/80 px-4 md:px-8 backdrop-blur-sm z-10 dark:bg-zinc-950/80 dark:border-zinc-800">
          <div className="flex items-center gap-4 w-full max-w-lg">
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

             <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <input 
                    type="text" 
                    placeholder="Search certificates, seamen..." 
                    className="h-10 w-full rounded-full border-none bg-zinc-100 pl-10 text-sm focus:ring-0 dark:bg-zinc-900"
                />
             </div>
          </div>
          
          <div className="flex items-center space-x-6">
             <button className="relative text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-600"></span>
             </button>
             
             <div className="flex items-center gap-3 pl-6 border-l border-zinc-200 dark:border-zinc-800">
                 <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bryan SPIL</span>
                    <span className="text-xs text-zinc-500">Admin</span>
                 </div>
                 <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-red-600 to-red-400 flex items-center justify-center text-white font-bold shadow-md shadow-red-500/20">
                    B
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
