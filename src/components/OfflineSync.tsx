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

    const run = () => {
      if (queueSize() === 0) return;
      const { synced } = flushQueue();
      if (synced > 0) {
        toast.success(
          `${synced} pending request${synced === 1 ? "" : "s"} synced now that you're back online.`,
        );
      }
    };

    run();
    window.addEventListener("online", run);
    return () => window.removeEventListener("online", run);
  }, []);

  return null;
}
