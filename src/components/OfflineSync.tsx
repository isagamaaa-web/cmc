import { useEffect } from "react";
import { toast } from "sonner";
import { flushQueue, queueSize } from "@/lib/offline-queue";

/**
 * Replays any booking/reschedule that could not be saved earlier
 * (offline or storage failure) as soon as the device is back online.
 */
export function OfflineSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = async () => {
      if (queueSize() === 0) return;
      const { synced } = await flushQueue();
      if (synced > 0) {
        toast.success(
          `${synced} pending request${synced === 1 ? "" : "s"} synced now that you're back online.`,
        );
      }
    };

    void run();
    const onOnline = () => void run();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
