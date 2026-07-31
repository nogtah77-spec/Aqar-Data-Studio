import { useGetSettings } from "@workspace/api-client-react";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

export function useCurrency(): string {
  const { data } = useGetSettings({
    query: { queryKey: ["settings"] },
  });

  return data?.currency || DEFAULT_CURRENCY;
}