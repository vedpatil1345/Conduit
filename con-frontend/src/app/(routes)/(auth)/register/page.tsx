"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RegisterSchema, type RegisterFormValues } from "@/common/validation/auth";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    // @ts-expect-error - Zod schema types mismatch due to strict mode or version diffs
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log(data);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative lg:absolute top-0 right-0 w-full lg:w-1/2 h-full flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-saddle-brown-100 dark:text-khaki-beige-900 mb-2">Create Account</h1>
          <p className="text-sm font-medium text-saddle-brown-400 dark:text-khaki-beige-700 lg:hidden mt-2">
            Join us today! Please fill in your details.
          </p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
          <div className="grid gap-3">
            <div>
              <Input
                id="name"
                placeholder="Name"
                type="text"
                autoComplete="name"
                {...register("name")}
                className="h-14 bg-white/20 backdrop-blur-sm dark:bg-dark-walnut-100/50 border border-camel-700/30 dark:border-white/10 px-5 rounded-xl focus-visible:ring-saddle-brown-500 dark:focus-visible:ring-khaki-beige-600 font-medium text-lg text-foreground dark:text-khaki-beige-800 placeholder:text-saddle-brown-300/60 dark:placeholder:text-khaki-beige-600/50"
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium px-1 mt-1">{errors.name.message}</p>
              )}
            </div>
            
            <div>
              <Input
                id="email"
                placeholder="Email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="h-14 bg-white/20 backdrop-blur-sm dark:bg-dark-walnut-100/50 border border-camel-700/30 dark:border-white/10 px-5 rounded-xl focus-visible:ring-saddle-brown-500 dark:focus-visible:ring-khaki-beige-600 font-medium text-lg text-foreground dark:text-khaki-beige-800 placeholder:text-saddle-brown-300/60 dark:placeholder:text-khaki-beige-600/50"
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium px-1 mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <Input
                id="password"
                placeholder="Password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                className="h-14 bg-white/20 backdrop-blur-sm dark:bg-dark-walnut-100/50 border border-camel-700/30 dark:border-white/10 px-5 rounded-xl focus-visible:ring-saddle-brown-500 dark:focus-visible:ring-khaki-beige-600 font-medium text-lg text-foreground dark:text-khaki-beige-800 placeholder:text-saddle-brown-300/60 dark:placeholder:text-khaki-beige-600/50"
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium px-1 mt-1 leading-snug">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <Input
                id="confirm-password"
                placeholder="Confirm Password"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                className="h-14 bg-white/20 backdrop-blur-sm dark:bg-dark-walnut-100/50 border border-camel-700/30 dark:border-white/10 px-5 rounded-xl focus-visible:ring-saddle-brown-500 dark:focus-visible:ring-khaki-beige-600 font-medium text-lg text-foreground dark:text-khaki-beige-800 placeholder:text-saddle-brown-300/60 dark:placeholder:text-khaki-beige-600/50"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive font-medium px-1 mt-1 leading-snug">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>
          
          <Button 
            disabled={isLoading}
            className="h-12 mx-auto bg-saddle-brown-100 hover:bg-saddle-brown-200 text-camel-900 shadow-xl shadow-saddle-brown-100/20 dark:bg-dark-walnut-400 dark:hover:bg-dark-walnut-300 dark:shadow-dark-walnut-400/20 transition-all rounded-full mt-2 font-bold tracking-wider uppercase text-sm px-10"
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </Button>

          {/* Mobile Only: Link to Login */}
          <div className="mt-8 text-center lg:hidden">
            <p className="text-sm text-saddle-brown-400 dark:text-khaki-beige-700">
              Already have an account?{" "}
              <Link href="/login" className="font-bold text-saddle-brown-100 dark:text-khaki-beige-900 hover:underline transition-all">
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
