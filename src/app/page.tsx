import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <header className="bg-surface-container-lowest shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-headline-md text-primary font-bold">Taskly</h1>
          <div className="flex items-center gap-lg">
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-xl">
          <p className="font-body-md text-on-surface-variant">
            Welcome! Your todo list will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
