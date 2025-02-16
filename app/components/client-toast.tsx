'use client'
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { clearCookie } from "../actions"
export function ClientToast({ message }: { message: string }) {
  const { toast } = useToast()
  
  useEffect(() => {
    toast({
      title: "Success",
      description: message
    })
    clearCookie('flash-message')
  }, [message, toast])
  
  return null
}
