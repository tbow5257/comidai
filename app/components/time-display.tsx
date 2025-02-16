'use client'

import { useEffect, useState } from "react"

interface TimeDisplayProps {
  utcTimestamp: string | Date
  createdTimeZone: string
}

export function TimeDisplay({ utcTimestamp, createdTimeZone }: TimeDisplayProps) {
    const [hasMounted, setHasMounted] = useState(false)
  
    useEffect(() => {
      setHasMounted(true)
    }, [])
  
    // Server-side or initial render: show UTC
    if (!hasMounted) {
      return (
        <span className="text-sm text-muted-foreground">
          {new Date(utcTimestamp).toISOString()}
        </span>
      )
    }  
  return (
    <span className="text-sm text-muted-foreground" title={`Created in ${createdTimeZone}`}>
      {new Date(utcTimestamp).toLocaleString()}
    </span>
  )
}
