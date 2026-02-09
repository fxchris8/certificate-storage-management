import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"

export function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - in a real app this would call an API
    console.log("Logging in with", username, password)
    navigate("/dashboard")
  }

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-md shadow-lg border-opacity-40 bg-white/80 backdrop-blur-sm dark:bg-slate-950/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access the Certificate Storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
              Sign In
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          &copy; 2024 Certificate Storage Management
        </CardFooter>
      </Card>
    </div>
  )
}
