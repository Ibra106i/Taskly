import { z } from "zod";
import { RECURRENCE_OPTIONS } from "@/lib/constants";

export const UUID = z.string().uuid();
export const TITLE_MAX = 500;
export const SEARCH_MAX = 100;
export const RECURRENCE_VALUES = RECURRENCE_OPTIONS.map((o) => o.value) as [string, ...string[]];
