import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "firebase/auth";
import { UserData, UserService } from "../services/userService";
import { GuestUsageStore } from "../storage/guestUsageStore";

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
  canUse: boolean;
  usesLeft: number;
  shouldShowAds: boolean;
  consumeAction: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  user: User | null;
  isGuest: boolean;
}

export function UserProvider({ children, user, isGuest }: UserProviderProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [canUse, setCanUse] = useState(true);
  const [usesLeft, setUsesLeft] = useState(0);
  const [shouldShowAds, setShouldShowAds] = useState(true);

  const refreshUserData = async () => {
    if (!user || isGuest) {
      setUserData(null);
      const guestStatus = await GuestUsageStore.getStatus();
      setCanUse(guestStatus.canUse);
      setUsesLeft(guestStatus.usesLeft);
      setShouldShowAds(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Initialize or get user data
      const data = await UserService.initializeUser(user.uid, user.email || "");
      setUserData(data);

      // Check usage permissions
      const usageCheck = await UserService.canUseService(user.uid);
      setCanUse(usageCheck.canUse);
      setUsesLeft(usageCheck.usesLeft || 0);

      // Check ads
      const showAds = await UserService.shouldShowAds(user.uid);
      setShouldShowAds(showAds);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [user, isGuest]);

  const consumeAction = async () => {
    if (!user || isGuest) {
      const result = await GuestUsageStore.consume();
      const usesLeft = Math.max(0, 3 - result.usage.uses);
      setCanUse(result.usage.uses < 3);
      setUsesLeft(usesLeft);
      return result.ok;
    }

    const ok = await UserService.useAction(user.uid);
    await refreshUserData();
    return ok;
  };

  const value: UserContextType = {
    userData,
    loading,
    refreshUserData,
    canUse,
    usesLeft,
    shouldShowAds,
    consumeAction,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserContext must be used within UserProvider");
  }
  return context;
}
