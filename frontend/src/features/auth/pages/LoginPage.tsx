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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { usePostLogin } from "@/features/auth/_hooks/@post/usePostLogin"
import { LoginFormData, loginSchema } from "@/types/loginSchema"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"

export function LoginPage() {
  const { mutate: login, isPending: isLoading, error } = usePostLogin();
  
  const form = useForm<LoginFormData>({
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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" disabled={isLoading} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {error && (
                  <p className="text-sm text-red-500 text-center">
                      Login failed. Please check your credentials.
                  </p>
              )}

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          &copy; 2024 Certificate Storage Management
        </CardFooter>
      </Card>
    </div>
  )
}
