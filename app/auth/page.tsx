
'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import type { InsertUser } from "../lib/db/schema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-login";

export default function AuthPage() {
  // TODO register
  const { isLogin, isLoading, error, handleAuth, toggleMode } = useAuth();
  const form = useForm<InsertUser>();

  const onSubmit = form.handleSubmit(handleAuth);

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <form onSubmit={onSubmit} className="space-y-4">
              <Input
                {...form.register("username")}
                placeholder="Username"
                type="text"
                autoComplete="username"
                required
              />
              <Input
                {...form.register("password")}
                placeholder="Password"
                type="password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              {!isLogin && (
                <Input
                  {...form.register("dailyCalorieGoal", { valueAsNumber: true })}
                  placeholder="Daily Calorie Goal"
                  type="number"
                  defaultValue={2000}
                />
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Login" : "Register"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => toggleMode}
              >
                {isLogin
                  ? "Need an account? Register"
                  : "Already have an account? Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="hidden md:block bg-muted">
        <div className="h-full flex flex-col justify-center p-8">
          <h1 className="text-4xl font-bold mb-4">
            AI-Powered Calorie Tracking
          </h1>
          <p className="text-lg text-muted-foreground">
            Track your daily nutrition with the power of AI. Simply take a photo of
            your meal and let our advanced image recognition do the rest.
          </p>
        </div>
      </div>
    </div>
  );
}
