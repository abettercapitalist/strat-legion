import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export type UserRole = "law" | "sales" | "manager" | "finance";

export interface User {
  name: string;
  role: UserRole;
  email: string;
}

interface UserContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const roleUsers: Record<UserRole, User> = {
  law: {
    name: "Sarah Chen",
    role: "law",
    email: "sarah.chen@playbook.com",
  },
  sales: {
    name: "John Smith",
    role: "sales",
    email: "john.smith@playbook.com",
  },
  manager: {
    name: "David Lee",
    role: "manager",
    email: "david.lee@playbook.com",
  },
  finance: {
    name: "Rachel Adams",
    role: "finance",
    email: "rachel.adams@playbook.com",
  },
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("playbook_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (role: UserRole) => {
    const selectedUser = roleUsers[role];
    setUser(selectedUser);
    localStorage.setItem("playbook_user", JSON.stringify(selectedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("playbook_user");
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
