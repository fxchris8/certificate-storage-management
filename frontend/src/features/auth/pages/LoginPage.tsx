import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { usePostLogin } from "@/features/auth/_hooks/@post/usePostLogin";
import { LoginFormData, loginSchema } from "@/types/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const SSO_INITIATE_URL =
  (import.meta.env.VITE_API_URL ?? "http://localhost:5000") +
  "/api/auth/sso/initiate";

export function LoginPage() {
  const { mutate: login, isPending: isLoading, error } = usePostLogin();
  const [searchParams] = useSearchParams();
  const ssoError = searchParams.get("sso_error");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  const handleSsoLogin = () => {
    // Full page redirect — the backend SSO route handles the OAuth flow.
    window.location.href = SSO_INITIATE_URL;
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
                      <Input
                        placeholder="Enter your username"
                        disabled={isLoading}
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <p className="text-sm text-red-500 text-center">
                  Login gagal. Periksa kembali username dan password Anda.
                </p>
              )}

              {ssoError && (
                <p className="text-sm text-red-500 text-center">
                  Login SSO gagal: {decodeURIComponent(ssoError)}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 dark:bg-slate-950/50 px-2 text-muted-foreground">
                atau
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSsoLogin}
          >
            <svg
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
            Login dengan SSO SPIL
          </Button>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          &copy; 2026 Certificate Storage Management
        </CardFooter>
      </Card>
    </div>
  );
}
