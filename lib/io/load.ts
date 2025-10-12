import { SystemData } from "@/lib/domain/types";
import { mergeSystemData } from "@/lib/domain/merge";

/**
 * Load system data from seed.json and optionally synced.json
 */
export async function loadSystemData(): Promise<SystemData> {
  try {
    // Load seed.json (required)
    const seedResponse = await fetch("/data/seed.json");
    if (!seedResponse.ok) {
      throw new Error("Failed to load seed.json");
    }
    const seed: SystemData = await seedResponse.json();

    // Try to load synced.json (optional)
    let synced: SystemData | undefined;
    try {
      const syncedResponse = await fetch("/data/synced.json");
      if (syncedResponse.ok) {
        synced = await syncedResponse.json();
      }
    } catch {
      // synced.json is optional, continue without it
    }

    // Merge data
    return mergeSystemData(seed, synced);
  } catch (error) {
    console.error("Error loading system data:", error);
    throw error;
  }
}

