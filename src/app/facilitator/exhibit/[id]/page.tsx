"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RedirectToBridge() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  useEffect(() => {
    router.replace(`/facilitator/bridge/exhibit/${params.id}`);
  }, [router, params.id]);
  return null;
}
