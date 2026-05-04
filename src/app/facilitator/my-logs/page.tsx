"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToBridge() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/facilitator/bridge/my-logs");
  }, [router]);
  return null;
}
