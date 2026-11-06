import { Suspense } from "react";

import { AuthView } from "@/components/auth/auth-view";

export default function AuthPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10">
      <Suspense fallback={<div className="text-sm text-zinc-600">Loading…</div>}>
        <AuthView />
      </Suspense>
    </div>
  );
}

