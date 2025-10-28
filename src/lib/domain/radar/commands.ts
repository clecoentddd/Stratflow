
import type { RadarItem } from "@/lib/types";

// The full item is passed for create and update
export type UpsertRadarItemCommand = RadarItem;

export type DeleteRadarItemCommand = {
    id: string;
};
