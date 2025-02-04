import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";

interface Props {
  onCapture: (formData: FormData) => Promise<void>;
  analyzing: boolean;
}

export function CameraUpload({ onCapture, analyzing }: Props) {
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
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
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append("image", blob);
          await onCapture(formData);
          stopCamera();
        }
      }, "image/jpeg");
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append("image", file);
      await onCapture(formData);
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
