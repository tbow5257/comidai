'use client'
import { login, type AuthState } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useActionState, useState } from 'react'
import { Loader2 } from "lucide-react"
  
const initialState: AuthState = {}

export function AuthForm() {
    const [isLogin, setIsLogin] = useState(true)
    const [state, formAction, pending] = useActionState(login, initialState)
  
  return (
    <>
      {state?.error && <p className="text-red-500 mb-4">{state.error}</p>}
      <form action={formAction} className="space-y-4">
        <Input
          name="username"
          placeholder="Username"
          type="text"
          autoComplete="username"
          required
        />
        <Input
          name="password"
          placeholder="Password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
        />
        {!isLogin && (
          <Input
            name="dailyCalorieGoal"
            placeholder="Daily Calorie Goal"
            type="number"
            defaultValue={2000}
          />
        )}
        <input type="hidden" name="mode" value={isLogin ? 'login' : 'register'} />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLogin ? "Login" : "Register"}
        </Button>
        <Button
          type="button"
          variant="link"
          className="w-full"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin
            ? "Need an account? Register"
            : "Already have an account? Login"}
        </Button>
      </form>
    </>
  )
}
