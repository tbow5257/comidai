import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  
  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <main className="container mx-auto py-6">
      <h1 className="text-3xl font-bold">Welcome to AI Calorie Tracker</h1>
    </main>
  );
}
