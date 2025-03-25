'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceRecorderProps {
  onRecording: (formData: FormData) => Promise<void>
  recording?: boolean
}

export function VoiceRecorder({ onRecording, recording }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const mimeType = useRef<string>('audio/webm')

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Try to use a supported format for Whisper API
      // Whisper supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, webm
      const supportedTypes = [
        'audio/webm',
        'audio/mp3',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav'
      ]
      
      // Find first supported mime type
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType.current = type
          break
        }
      }
      
      mediaRecorder.current = new MediaRecorder(stream, { mimeType: mimeType.current })
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        // Map mime type to file extension
        let extension = 'webm' // default
        if (mimeType.current.includes('mp3')) extension = 'mp3'
        else if (mimeType.current.includes('mp4')) extension = 'mp4'
        else if (mimeType.current.includes('mpeg')) extension = 'mpeg'
        else if (mimeType.current.includes('ogg')) extension = 'ogg'
        else if (mimeType.current.includes('wav')) extension = 'wav'
        else if (mimeType.current.includes('flac')) extension = 'flac'
        
        const audioBlob = new Blob(chunks.current, { type: mimeType.current })
        const formData = new FormData()
        
        // Explicitly name the file with proper extension
        formData.append('audio', audioBlob, `audio.${extension}`)
        
        await onRecording(formData)
      }

      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop()
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground mb-2">
        Describe your meal clearly, including portion sizes.
        <br />
        Example: "I had a palm-sized chicken breast, a cup of rice, and a large handful of broccoli"
      </p>
      
      <Button
        variant={isRecording ? "destructive" : "secondary"}
        size="lg"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={recording}
        className={cn(
          "w-full max-w-[200px]",
          isRecording && "animate-pulse"
        )}
      >
        {recording ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isRecording ? (
          <Square className="h-5 w-5 mr-2" />
        ) : (
          <Mic className="h-5 w-5 mr-2" />
        )}
        {isRecording ? "Stop Recording" : "Record Voice Note"}
      </Button>
    </div>
  )
}
