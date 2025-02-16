import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthForm } from "./auth-form";

export default function AuthPage() {

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <AuthForm />
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
