import { Link } from "react-router-dom";
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
import { useCrewRegister } from "../_hooks/useCrewRegister";
import { CrewRegisterFormData, crewRegisterSchema } from "../types/crew.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Anchor, ShieldAlert, Info } from "lucide-react";

export function CrewRegisterPage() {
  const { mutate: register, isPending: isLoading, error, data } = useCrewRegister();

  const form = useForm<CrewRegisterFormData>({
    resolver: zodResolver(crewRegisterSchema),
    defaultValues: {
      seafarercode: "",
      name: "",
      password: "",
    },
  });

  const onSubmit = (formData: CrewRegisterFormData) => {
    register(formData);
  };

  // Extract backend API error message if mutation failed
  const apiErrorMsg =
    error || (data && !data.success)
      ? (data?.message || "Registrasi gagal. Pastikan data seafarer code dan nama sesuai.")
      : null;

  return (
    <div className="flex h-screen w-full items-center justify-center p-4 bg-gradient-to-br from-teal-50 via-slate-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Card className="w-full max-w-md shadow-lg border-opacity-40 bg-white/80 backdrop-blur-sm dark:bg-slate-950/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight text-teal-700 dark:text-teal-400">
            Crew Registration
          </CardTitle>
          <CardDescription>
            Register your Seafarer Code to upload and manage certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="seafarercode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seafarer Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your Seafarer Code"
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your registered Full Name"
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

              {apiErrorMsg && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p>{apiErrorMsg}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-700 dark:hover:bg-teal-600"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register & Sign In"}
              </Button>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 dark:bg-slate-950/50 px-2 text-muted-foreground">
                Already have an account?
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-teal-200 dark:border-teal-900/50 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30"
            asChild
          >
            <Link to="/crew/login">Login Portal Crew</Link>
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <Link
            to="/auth/login"
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            Masuk sebagai Admin / Staff SPIL
          </Link>
          <div className="mt-2 text-[10px]">
            &copy; 2026 Certificate Storage Management
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default CrewRegisterPage;
