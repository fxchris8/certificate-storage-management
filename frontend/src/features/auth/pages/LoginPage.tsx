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
import { usePostLogin } from "@/features/auth/_hooks/@post/usePostLogin"
import { LoginFormData, loginSchema } from "@/types/loginSchema"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"

export function LoginPage() {
  const { mutate: login, isPending: isLoading, error } = usePostLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                {...register("username")}
                disabled={isLoading}
              />
               {errors.username && (
                <p className="text-sm text-red-500">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>
            
            {error && (
                <p className="text-sm text-red-500 text-center">
                    Login failed. Please check your credentials.
                </p>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
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
