import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { LayoutDashboard, FileText, Settings, LogOut, Ship, Users, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSignOut } from "@/features/auth/_hooks/useSignOut"

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const logoutRef = useRef<HTMLDivElement>(null)
  const { signOut } = useSignOut()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (logoutRef.current && !logoutRef.current.contains(event.target as Node)) {
        setShowLogoutConfirm(false)
      }
    }

    if (showLogoutConfirm) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showLogoutConfirm])
  
  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/dashboard/users", icon: Users },
    { name: "External Submissions", href: "/dashboard/external-submissions", icon: Inbox },
  ]

  return (
    <div 
      className={cn(
        "flex h-full flex-col bg-white border-r border-zinc-200 transition-all duration-300 ease-in-out dark:bg-zinc-950 dark:border-zinc-800",
        collapsed ? "w-20 items-center" : "w-72"
      )}
    >
      <div className={cn(
        "flex h-20 items-center border-b border-zinc-100 dark:border-zinc-900/50",
        collapsed ? "justify-center px-0" : "px-8"
      )}>
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white shadow-md shadow-red-600/20 transition-all",
          collapsed ? "mr-0" : "mr-3"
        )}>
          <Ship className="h-6 w-6" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-in fade-in duration-300">
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">SPIL</span>
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Storage</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto w-full">
        <div>
            {!collapsed && (
              <h3 className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 animate-in fade-in">
                Menu
              </h3>
            )}
            <nav className="space-y-1">
                {links.map((link) => {
                const Icon = link.icon
                const isActive = location.pathname === link.href
                
                return (
                    <Link
                    key={link.name}
                    to={link.href}
                    title={collapsed ? link.name : undefined}
                    className={cn(
                        "group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200",
                        collapsed ? "justify-center px-0" : "px-4",
                        isActive 
                            ? "bg-red-50 text-red-600 shadow-sm dark:bg-red-950/20 dark:text-red-400" 
                            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
                    )}
                    >
                    <Icon className={cn(
                      "h-5 w-5 transition-colors", 
                      isActive ? "text-red-600 dark:text-red-400" : "text-zinc-400 group-hover:text-zinc-600",
                      !collapsed && "mr-3"
                    )} />
                    {!collapsed && <span>{link.name}</span>}
                    </Link>
                )
                })}
            </nav>
        </div>
      </div>

      <div ref={logoutRef} className="p-4 border-t border-zinc-100 dark:border-zinc-900 w-full relative">
        {showLogoutConfirm && (
            <div className={cn(
                "absolute bottom-full left-0 mx-4 mb-2 p-3 bg-white border border-zinc-200 shadow-xl rounded-xl dark:bg-zinc-950 dark:border-zinc-800 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200",
                collapsed ? "w-48 -left-14" : "w-[calc(100%-2rem)]"
            )}>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <Button 
                            variant="destructive" 
                            size="sm"
                            className="w-full h-8 text-xs bg-red-600 hover:bg-red-700 shadow-sm"
                            onClick={signOut}
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
                {/* Arrow pointer */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-zinc-200 rotate-45 dark:bg-zinc-950 dark:border-zinc-800"></div>
            </div>
        )}

        <button
            title={collapsed ? "Sign Out" : undefined}
            onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
            className={cn(
                "group flex w-full items-center rounded-xl py-3 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/20 dark:hover:text-red-400",
                collapsed ? "justify-center px-0" : "px-4",
                showLogoutConfirm && "bg-red-50 text-red-600 dark:bg-red-950/20"
            )}
        >
            <LogOut className={cn(
                "h-5 w-5 flex-shrink-0 text-zinc-400 group-hover:text-red-600 transition-colors",
                !collapsed && "mr-3",
                showLogoutConfirm && "text-red-600"
            )} />
            {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  )
}
