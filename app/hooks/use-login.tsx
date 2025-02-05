import { useState } from "react";
import { useRouter } from "next/navigation";
import type { InsertUser } from "../lib/db/schema";

export const useAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (data: InsertUser) => {
    setIsLoading(true);
    setError("");
    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error);
      }

      if (isLogin) {
        router.push("/");
      } else {
        setIsLogin(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => setIsLogin((prev) => !prev);

  return { isLogin, isLoading, error, handleAuth, toggleMode };
};
