import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppRole } from "@/types/invoice";

export type RequestUser = {
  id: string;
  email: string | null;
  role: AppRole;
};

interface AuthContextType {
  user: RequestUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_CACHE_KEY = "lokerhub-session-user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RequestUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      try {
        const cachedUser = sessionStorage.getItem(SESSION_CACHE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser) as RequestUser);
          setLoading(false);
        }
      } catch {
        sessionStorage.removeItem(SESSION_CACHE_KEY);
      }
    });

    fetch("/api/auth/session", { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("Network or API error");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const nextUser = data.session?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(nextUser));
        } else {
          sessionStorage.removeItem(SESSION_CACHE_KEY);
        }
      })
      .catch((error) => {
        console.error("Gagal mengambil sesi:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      refreshSession: async () => {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
        });
        const data = (await response.json()) as {
          session: { user: RequestUser } | null;
        };
        const nextUser = data.session?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(nextUser));
        } else {
          sessionStorage.removeItem(SESSION_CACHE_KEY);
        }
      },
      signOut: async () => {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        sessionStorage.removeItem(SESSION_CACHE_KEY);
        setUser(null);
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
