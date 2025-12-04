import { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: "law" | "sales" | "system";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  isSystemRole: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  department: string;
  title: string;
  isActive: boolean;
  createdAt: string;
}

interface RBACContextType {
  users: SystemUser[];
  roles: Role[];
  permissions: Permission[];
  addUser: (user: Omit<SystemUser, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<SystemUser>) => void;
  deleteUser: (id: string) => void;
  addRole: (role: Omit<Role, "id">) => void;
  updateRole: (id: string, updates: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  getUserRoles: (userId: string) => Role[];
  hasPermission: (userId: string, permissionId: string) => boolean;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

// Default permissions
const defaultPermissions: Permission[] = [
  // Law Module
  { id: "law.templates.view", name: "View Templates", description: "View contract templates", module: "law" },
  { id: "law.templates.create", name: "Create Templates", description: "Create new contract templates", module: "law" },
  { id: "law.templates.edit", name: "Edit Templates", description: "Edit existing templates", module: "law" },
  { id: "law.templates.delete", name: "Delete Templates", description: "Delete templates", module: "law" },
  { id: "law.templates.publish", name: "Publish Templates", description: "Publish templates for use", module: "law" },
  { id: "law.clauses.view", name: "View Clauses", description: "View clause library", module: "law" },
  { id: "law.clauses.create", name: "Create Clauses", description: "Create new clauses", module: "law" },
  { id: "law.clauses.edit", name: "Edit Clauses", description: "Edit existing clauses", module: "law" },
  { id: "law.clauses.delete", name: "Delete Clauses", description: "Delete clauses", module: "law" },
  { id: "law.requests.view", name: "View Change Requests", description: "View change requests", module: "law" },
  { id: "law.requests.approve", name: "Approve Change Requests", description: "Approve or reject change requests", module: "law" },
  { id: "law.dashboard.view", name: "View Learning Dashboard", description: "View analytics and insights", module: "law" },
  // Sales Module
  { id: "sales.deals.view", name: "View Deals", description: "View deals", module: "sales" },
  { id: "sales.deals.create", name: "Create Deals", description: "Create new deals", module: "sales" },
  { id: "sales.deals.edit", name: "Edit Deals", description: "Edit deals", module: "sales" },
  { id: "sales.approvals.view", name: "View Approvals", description: "View approval queue", module: "sales" },
  { id: "sales.approvals.approve", name: "Approve Deals", description: "Approve or reject deals", module: "sales" },
  // System
  { id: "system.users.view", name: "View Users", description: "View system users", module: "system" },
  { id: "system.users.manage", name: "Manage Users", description: "Create, edit, delete users", module: "system" },
  { id: "system.roles.view", name: "View Roles", description: "View roles and permissions", module: "system" },
  { id: "system.roles.manage", name: "Manage Roles", description: "Create, edit, delete roles", module: "system" },
  { id: "system.settings.view", name: "View Settings", description: "View system settings", module: "system" },
  { id: "system.settings.manage", name: "Manage Settings", description: "Modify system settings", module: "system" },
];

// Default roles
const defaultRoles: Role[] = [
  {
    id: "role-gc",
    name: "General Counsel",
    description: "Chief legal officer with full access to law module and system administration",
    permissions: defaultPermissions.map(p => p.id), // All permissions
    isSystemRole: true,
  },
  {
    id: "role-legal-ops-director",
    name: "Director of Legal Ops",
    description: "Oversees legal operations with full administrative access",
    permissions: defaultPermissions.map(p => p.id), // All permissions
    isSystemRole: true,
  },
  {
    id: "role-contract-counsel",
    name: "Contract Counsel",
    description: "Drafts and reviews contracts",
    permissions: [
      "law.templates.view", "law.templates.create", "law.templates.edit", "law.templates.publish",
      "law.clauses.view", "law.clauses.create", "law.clauses.edit",
      "law.requests.view", "law.requests.approve",
      "law.dashboard.view",
    ],
    isSystemRole: true,
  },
  {
    id: "role-paralegal",
    name: "Paralegal",
    description: "Supports legal team with document preparation",
    permissions: [
      "law.templates.view",
      "law.clauses.view",
      "law.requests.view",
      "law.dashboard.view",
    ],
    isSystemRole: true,
  },
  {
    id: "role-sales-ae",
    name: "Account Executive",
    description: "Sales representative managing deals",
    permissions: [
      "sales.deals.view", "sales.deals.create", "sales.deals.edit",
      "sales.approvals.view",
    ],
    isSystemRole: true,
  },
  {
    id: "role-sales-manager",
    name: "Sales Manager",
    description: "Manages sales team and approves deals",
    permissions: [
      "sales.deals.view", "sales.deals.create", "sales.deals.edit",
      "sales.approvals.view", "sales.approvals.approve",
    ],
    isSystemRole: true,
  },
  {
    id: "role-finance",
    name: "Finance Reviewer",
    description: "Reviews financial aspects of deals",
    permissions: [
      "sales.deals.view",
      "sales.approvals.view",
    ],
    isSystemRole: true,
  },
];

// Default users
const defaultUsers: SystemUser[] = [
  {
    id: "user-1",
    name: "Sarah Chen",
    email: "sarah.chen@playbook.com",
    roleIds: ["role-gc"],
    department: "Legal",
    title: "General Counsel",
    isActive: true,
    createdAt: "2024-01-15",
  },
  {
    id: "user-2",
    name: "Bobby Darin",
    email: "bobby.darin@playbook.com",
    roleIds: ["role-legal-ops-director"],
    department: "Legal",
    title: "Director of Legal Ops",
    isActive: true,
    createdAt: "2024-02-01",
  },
  {
    id: "user-3",
    name: "Michael Torres",
    email: "michael.torres@playbook.com",
    roleIds: ["role-contract-counsel"],
    department: "Legal",
    title: "Contract Counsel",
    isActive: true,
    createdAt: "2024-01-20",
  },
  {
    id: "user-4",
    name: "John Smith",
    email: "john.smith@playbook.com",
    roleIds: ["role-sales-ae"],
    department: "Sales",
    title: "Account Executive",
    isActive: true,
    createdAt: "2024-01-10",
  },
  {
    id: "user-5",
    name: "Emily Johnson",
    email: "emily.johnson@playbook.com",
    roleIds: ["role-sales-ae"],
    department: "Sales",
    title: "Senior Account Executive",
    isActive: true,
    createdAt: "2024-01-12",
  },
  {
    id: "user-6",
    name: "David Lee",
    email: "david.lee@playbook.com",
    roleIds: ["role-sales-manager"],
    department: "Sales",
    title: "Sales Manager",
    isActive: true,
    createdAt: "2024-01-08",
  },
  {
    id: "user-7",
    name: "Rachel Adams",
    email: "rachel.adams@playbook.com",
    roleIds: ["role-finance"],
    department: "Finance",
    title: "Finance Reviewer",
    isActive: true,
    createdAt: "2024-01-18",
  },
];

const STORAGE_KEY = "playbook_rbac";

export function RBACProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<SystemUser[]>(defaultUsers);
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [permissions] = useState<Permission[]>(defaultPermissions);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (data.users) setUsers(data.users);
      if (data.roles) setRoles(data.roles);
    }
  }, []);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ users, roles }));
  }, [users, roles]);

  const addUser = (user: Omit<SystemUser, "id" | "createdAt">) => {
    const newUser: SystemUser = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, updates: Partial<SystemUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const addRole = (role: Omit<Role, "id">) => {
    const newRole: Role = {
      ...role,
      id: `role-${Date.now()}`,
    };
    setRoles(prev => [...prev, newRole]);
  };

  const updateRole = (id: string, updates: Partial<Role>) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRole = (id: string) => {
    setRoles(prev => prev.filter(r => r.id !== id));
  };

  const getUserRoles = (userId: string): Role[] => {
    const user = users.find(u => u.id === userId);
    if (!user) return [];
    return roles.filter(r => user.roleIds.includes(r.id));
  };

  const hasPermission = (userId: string, permissionId: string): boolean => {
    const userRoles = getUserRoles(userId);
    return userRoles.some(role => role.permissions.includes(permissionId));
  };

  return (
    <RBACContext.Provider value={{
      users,
      roles,
      permissions,
      addUser,
      updateUser,
      deleteUser,
      addRole,
      updateRole,
      deleteRole,
      getUserRoles,
      hasPermission,
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export function useRBAC() {
  const context = useContext(RBACContext);
  if (context === undefined) {
    throw new Error("useRBAC must be used within a RBACProvider");
  }
  return context;
}
