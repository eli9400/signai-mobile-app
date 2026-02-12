import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export type AccountType = "free" | "premium";

export interface UserData {
  email: string;
  createdAt: Timestamp;

  // Account status
  accountType: AccountType;

  // Premium
  premiumExpiresAt: Timestamp | null;

  // Weekly limits (for free users)
  weeklyLimit: number;
  usesThisWeek: number;
  weekStartDate: string | null; // YYYY-MM-DD

  // Credits (Pay-Per-Use)
  credits: number;

  // Payments
  stripeCustomerId: string | null;
  hasPaymentMethod: boolean;

  // History
  totalUses: number;
  lastUsedAt: Timestamp | null;
  lastCheckedAt: Timestamp | null;

  // Settings
  adsEnabled: boolean;
}

const DEFAULT_USER_DATA: Omit<UserData, "email" | "createdAt"> = {
  accountType: "free",
  premiumExpiresAt: null,
  weeklyLimit: 3,
  usesThisWeek: 0,
  weekStartDate: null,
  credits: 0,
  stripeCustomerId: null,
  hasPaymentMethod: false,
  totalUses: 0,
  lastUsedAt: null,
  lastCheckedAt: null,
  adsEnabled: true,
};

function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper: Calculate days between two dates
function daysBetween(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

async function getServerDateString(uid: string): Promise<string> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { lastCheckedAt: serverTimestamp() });
    const snap = await getDocFromServer(userRef);
    const ts = snap.data()?.lastCheckedAt;
    if (ts && typeof ts.toDate === "function") {
      return formatDateString(ts.toDate());
    }
  } catch {
    // ignore and fall back to local time
  }
  return formatDateString(new Date());
}

export const UserService = {
  /**
   * Create or get user document in Firestore
   */
  async initializeUser(uid: string, email: string): Promise<UserData> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserData;
    }

    // Create new user
    const newUser: UserData = {
      ...DEFAULT_USER_DATA,
      email,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(userRef, newUser);
    return newUser;
  },

  /**
   * Get user data from Firestore
   */
  async getUserData(uid: string): Promise<UserData | null> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return null;
    }

    return userSnap.data() as UserData;
  },

  /**
   * Check if user can perform an action
   * Returns: { canUse: boolean, reason?: string }
   */
  async canUseService(
    uid: string,
  ): Promise<{ canUse: boolean; reason?: string; usesLeft?: number }> {
    const userData = await this.getUserData(uid);

    if (!userData) {
      return { canUse: false, reason: "User not found" };
    }

    // Premium users: always can use
    if (userData.accountType === "premium") {
      const now = new Date();
      if (
        userData.premiumExpiresAt &&
        userData.premiumExpiresAt.toDate() > now
      ) {
        return { canUse: true };
      }
      // Premium expired - treat as free user
      await updateDoc(doc(db, "users", uid), {
        accountType: "free",
        adsEnabled: true,
      });
    }

    // Check if we need to reset weekly counter
    const today = await getServerDateString(uid);
    const weekStart = userData.weekStartDate ?? null;
    if (weekStart) {
      const rawDaysSinceWeekStart = daysBetween(weekStart, today);
      if (rawDaysSinceWeekStart < 0) {
        await updateDoc(doc(db, "users", uid), {
          weekStartDate: today,
        });
        userData.weekStartDate = today;
      }
      const daysSinceWeekStart = Math.max(0, rawDaysSinceWeekStart);
      if (daysSinceWeekStart >= 7) {
        // Reset weekly counter window
        await updateDoc(doc(db, "users", uid), {
          usesThisWeek: 0,
          weekStartDate: null,
        });
        userData.usesThisWeek = 0;
        userData.weekStartDate = null;
      }
    }

    const weeklyRemaining = Math.max(
      0,
      userData.weeklyLimit - userData.usesThisWeek,
    );

    // If user has credits, allow usage but keep weekly count separate
    if (userData.credits > 0) {
      return {
        canUse: true,
        usesLeft: weeklyRemaining,
      };
    }

    // Check weekly limit
    if (weeklyRemaining > 0) {
      return { canUse: true, usesLeft: weeklyRemaining };
    }

    // No credits and exceeded weekly limit
    return {
      canUse: false,
      reason: "weeklyLimitReached",
      usesLeft: 0,
    };
  },

  /**
   * Use one action (deduct from credits or weekly counter)
   */
  async useAction(uid: string): Promise<boolean> {
    const userData = await this.getUserData(uid);

    if (!userData) {
      return false;
    }

    const userRef = doc(db, "users", uid);

    // Premium users: just track usage
    if (userData.accountType === "premium") {
      await updateDoc(userRef, {
        totalUses: userData.totalUses + 1,
        lastUsedAt: serverTimestamp(),
      });
      return true;
    }

    const today = await getServerDateString(uid);
    const weekStart = userData.weekStartDate ?? null;
    if (weekStart) {
      const rawDaysSinceWeekStart = daysBetween(weekStart, today);
      if (rawDaysSinceWeekStart < 0) {
        await updateDoc(userRef, {
          weekStartDate: today,
        });
        userData.weekStartDate = today;
      }
      const daysSinceWeekStart = Math.max(0, rawDaysSinceWeekStart);
      if (daysSinceWeekStart >= 7) {
        userData.usesThisWeek = 0;
        userData.weekStartDate = null;
      }
    }

    // If user has credits, use credit first
    if (userData.credits > 0) {
      await updateDoc(userRef, {
        credits: userData.credits - 1,
        totalUses: userData.totalUses + 1,
        lastUsedAt: serverTimestamp(),
      });
      return true;
    }

    // Use weekly quota
    if (userData.usesThisWeek < userData.weeklyLimit) {
      await updateDoc(userRef, {
        usesThisWeek: userData.usesThisWeek + 1,
        weekStartDate: userData.weekStartDate ?? today,
        totalUses: userData.totalUses + 1,
        lastUsedAt: serverTimestamp(),
      });
      return true;
    }

    return false;
  },

  /**
   * Add credits to user account
   */
  async addCredits(uid: string, amount: number): Promise<void> {
    const userData = await this.getUserData(uid);

    if (!userData) {
      throw new Error("User not found");
    }

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      credits: userData.credits + amount,
    });
  },

  async setHasPaymentMethod(uid: string, hasPaymentMethod: boolean) {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      hasPaymentMethod,
    });
  },

  /**
   * Upgrade user to premium
   */
  async upgradeToPremium(
    uid: string,
    durationDays: number = 30,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      accountType: "premium",
      premiumExpiresAt: Timestamp.fromDate(expiresAt),
      adsEnabled: false,
    });
  },

  /**
   * Check if user should see ads
   */
  async shouldShowAds(uid: string | null): Promise<boolean> {
    // Guest users see ads
    if (!uid) {
      return true;
    }

    const userData = await this.getUserData(uid);

    if (!userData) {
      return true;
    }

    return userData.adsEnabled;
  },
};
