'use client'
import imageCompression from 'browser-image-compression';

import { useState, useRef, use } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import { toast, useToast } from "@/hooks/use-toast";

interface Props {
  onCapture: (formData: FormData, previewUrl: string) => void;
  analyzing: boolean;
}


const formatSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)}MB`;
};

const compressImage = async (file: File | Blob) => {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };
  
  return await imageCompression(file as File, options);
}

export function CameraUpload({ onCapture, analyzing }: Props) {
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast()

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err: any) {

      if (err.name === 'NotFoundError') {
        toast({
          title: "Camera Not Found",
          description: "No camera device detected. Please connect a camera and try again.",
          variant: "destructive",
        });
      } else if (err.name === 'PermissionDeniedError') {
        toast({
          title: "Camera Access Denied",
          description: "Please allow camera access in your browser settings.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Camera Error",
          description: "An unexpected error occurred while accessing the camera.",
          variant: "destructive",
        });
      }
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setShowCamera(false);
    }
  }

  async function captureImage() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      
      const previewUrl = canvas.toDataURL('image/jpeg');
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const compressedBlob = await compressImage(blob);
          const formData = new FormData();
          formData.append("image", compressedBlob);
          await onCapture(formData, previewUrl);
          stopCamera();
        }
      }, "image/jpeg");
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedFile);
      console.log(`Compressed image size: ${formatSize(compressedFile.size)}`);
      const previewUrl = URL.createObjectURL(file);
      await onCapture(formData, previewUrl);
    }
  }

  return (
    <div className="space-y-4">
      {showCamera ? (
        <div className="space-y-4">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full rounded-lg"
          />
          <div className="flex justify-center gap-4">
            <Button onClick={captureImage} disabled={analyzing}>
              {analyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              Capture
            </Button>
            <Button variant="outline" onClick={stopCamera}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center gap-4">
          <Button onClick={startCamera}>
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
          <Button variant="outline" asChild>
            <label>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
