"use client";
import { useEffect, useState } from "react";
import { auth } from "@/lib/api";

interface FeaturesState {
  loaded: boolean;
  role: string;
  hasAll: boolean;
  features: Set<string>;
  hasFeature: (key: string) => boolean;
  refresh: () => Promise<void>;
}

/**
 * V2.9: Hook para acceder a las features del usuario actual.
 *
 * Uso:
 *   const { hasFeature, loaded } = useFeatures();
 *   if (loaded && !hasFeature("certificates")) return <LockedCard />;
 */
export function useFeatures(): FeaturesState {
  const [loaded, setLoaded] = useState(false);
  const [role, setRole] = useState("");
  const [hasAll, setHasAll] = useState(false);
  const [features, setFeatures] = useState<Set<string>>(new Set());

  const load = async () => {
    try {
      const res = await auth.myFeatures();
      setRole(res.role || "");
      setHasAll(!!res.has_all);
      setFeatures(new Set(res.features || []));
      setLoaded(true);
    } catch (e) {
      setLoaded(true);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    loaded,
    role,
    hasAll,
    features,
    hasFeature: (key: string) => hasAll || features.has(key),
    refresh: load,
  };
}
