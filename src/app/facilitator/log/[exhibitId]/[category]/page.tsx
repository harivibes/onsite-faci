"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RedirectToBridge() {
  const router = useRouter();
  const params = useParams<{ exhibitId: string; category: string }>();
  useEffect(() => {
    router.replace(
      `/facilitator/bridge/log/${params.exhibitId}/${params.category}`
    );
  }, [router, params.exhibitId, params.category]);
  return null;
}
