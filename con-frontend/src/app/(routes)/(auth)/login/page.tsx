"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoginSchema, type LoginFormValues } from "@/common/validation/auth";
import { useAuthStore } from "@/store/index";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError(null);
    try {
      await login({
        username: data.username,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      router.push("/dashboard");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative lg:absolute top-0 right-0 w-full lg:w-1/2 h-full flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-saddle-brown-100 dark:text-khaki-beige-900 mb-2">Sign in</h1>
          <p className="text-sm font-medium text-saddle-brown-400 dark:text-khaki-beige-700 lg:hidden mt-2">
            Welcome back! Please enter your details.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          {serverError && (
            <div className="text-xs text-destructive font-medium px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
              {serverError}
            </div>
          )}
          
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Input
                id="username"
                placeholder="Username"
                type="text"
                autoComplete="username"
                {...register("username")}
                className="h-14 bg-camel-300/20 backdrop-blur-sm dark:bg-dark-walnut-100/50 border border-camel-700/30 dark:border-white/10 px-5 rounded-xl focus-visible:ring-saddle-brown-500 dark:focus-visible:ring-khaki-beige-600 font-medium text-lg text-foreground dark:text-khaki-beige-800 placeholder:text-saddle-brown-300/60 dark:placeholder:text-khaki-beige-600/50"
              />
              {errors.username && (
                <p className="text-xs text-destructive font-medium px-1">{errors.username.message}</p>
              )}
            </div>
            
            <div className="grid gap-2">
              <Input
                id="password"
                placeholder="Password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                className="h-14 bg-white/20 backdrop-blur-sm dark:bg-dark-walnut-100/50 border border-camel-700/30 dark:border-white/10 px-5 rounded-xl focus-visible:ring-saddle-brown-500 dark:focus-visible:ring-khaki-beige-600 font-medium text-lg text-foreground dark:text-khaki-beige-800 placeholder:text-saddle-brown-300/60 dark:placeholder:text-khaki-beige-600/50"
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium px-1 leading-snug">{errors.password.message}</p>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-saddle-brown-400 dark:text-khaki-beige-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("rememberMe")}
                    className="rounded border-camel-700/30 dark:border-white/10"
                  />
                  Remember me
                </label>
                <a href="#" className="text-xs font-bold text-saddle-brown-400 hover:text-saddle-brown-100 dark:text-khaki-beige-700 dark:hover:text-khaki-beige-900 transition-colors border-b border-transparent hover:border-saddle-brown-100 dark:hover:border-khaki-beige-900">
                  Forgot your password?
                </a>
              </div>
            </div>
          </div>
          
          <Button 
            disabled={isLoading} 
            className="h-12 mx-auto bg-saddle-brown-100 hover:bg-saddle-brown-200 text-camel-900 shadow-xl shadow-saddle-brown-100/20 dark:bg-dark-walnut-400 dark:hover:bg-dark-walnut-300 dark:shadow-dark-walnut-400/20 transition-all rounded-full mt-4 font-bold tracking-wider uppercase text-sm px-10"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
