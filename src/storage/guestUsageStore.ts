import AsyncStorage from "@react-native-async-storage/async-storage";

type GuestUsage = {
  uses: number;
  startDate: string | null;
};

type GuestStatus = {
  canUse: boolean;
  usesLeft: number;
  usage: GuestUsage;
};

const STORAGE_KEY = "guest_usage_v1";
const WEEKLY_LIMIT = 3;
const WINDOW_DAYS = 7;

const getTodayString = () => new Date().toISOString().split("T")[0];

const daysBetween = (from: string, to: string) => {
  const d1 = new Date(from);
  const d2 = new Date(to);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const normalizeUsage = (usage: GuestUsage): GuestUsage => {
  if (!usage.startDate) {
    return { uses: 0, startDate: null };
  }
  const today = getTodayString();
  const days = daysBetween(usage.startDate, today);
  if (days >= WINDOW_DAYS) {
    return { uses: 0, startDate: null };
  }
  return usage;
};

const loadUsage = async (): Promise<GuestUsage> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return { uses: 0, startDate: null };
  try {
    const parsed = JSON.parse(raw) as GuestUsage;
    if (typeof parsed?.uses !== "number") return { uses: 0, startDate: null };
    return {
      uses: Math.max(0, parsed.uses || 0),
      startDate: parsed.startDate ?? null,
    };
  } catch {
    return { uses: 0, startDate: null };
  }
};

const saveUsage = async (usage: GuestUsage) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
};

export const GuestUsageStore = {
  async getStatus(): Promise<GuestStatus> {
    const loaded = await loadUsage();
    const usage = normalizeUsage(loaded);
    if (usage.startDate !== loaded.startDate || usage.uses !== loaded.uses) {
      await saveUsage(usage);
    }
    const usesLeft = Math.max(0, WEEKLY_LIMIT - usage.uses);
    return {
      canUse: usage.uses < WEEKLY_LIMIT,
      usesLeft,
      usage,
    };
  },

  async consume(): Promise<{ ok: boolean; usage: GuestUsage }> {
    const status = await this.getStatus();
    if (!status.canUse) {
      return { ok: false, usage: status.usage };
    }
    const today = getTodayString();
    const next: GuestUsage = {
      uses: status.usage.uses + 1,
      startDate: status.usage.startDate ?? today,
    };
    await saveUsage(next);
    return { ok: true, usage: next };
  },

  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
};
