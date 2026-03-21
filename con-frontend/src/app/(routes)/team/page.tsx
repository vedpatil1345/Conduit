"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/store/index";
import {
  listUsers,
  createUser,
  updateUserRole,
  deleteUser,
  type UserProfile,
  ROLES,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
} from "@/lib/users";
import {
  UserPlus,
  Shield,
  Trash2,
  Users,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === "ADMIN";
  const isManager = currentUser?.role === "MANAGER";
  const canViewTeam = isAdmin || isManager;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [roleEditing, setRoleEditing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listUsers();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewTeam) fetchUsers();
    else setIsLoading(false);
  }, [canViewTeam, fetchUsers]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setRoleEditing(null);
      showSuccess("Role updated successfully");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await deleteUser(userId);
      setDeleteConfirm(null);
      showSuccess("User deleted successfully");
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  if (!canViewTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
        <p className="text-sm text-muted-foreground">Only admins and managers can view team members.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} member{users.length !== 1 ? "s" : ""} in your organization
          </p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogDescription>
                  Add a new team member to your organization.
                </DialogDescription>
              </DialogHeader>
              <CreateUserForm
                onCreated={() => {
                  setCreateOpen(false);
                  showSuccess("User created successfully");
                  fetchUsers();
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="h-4 w-4" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm font-medium text-destructive px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4" /> {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Users table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Email</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Role</th>
                {isAdmin && (
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {user.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {user.username}
                          {user.id === currentUser?.id && (
                            <span className="ml-2 text-[10px] text-muted-foreground font-normal">(you)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{user.email || "—"}</span>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    {isAdmin && roleEditing === user.id ? (
                      <Select
                        defaultValue={user.role}
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                      >
                        <SelectTrigger className="w-40 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => (
                            <SelectItem key={role} value={role} className="text-xs">
                              <span className="font-medium">{role}</span>
                              <span className="text-muted-foreground ml-1">— {ROLE_DESCRIPTIONS[role]?.split("—")[0]}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => isAdmin && setRoleEditing(user.id)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${ROLE_COLORS[user.role] || ""} ${isAdmin ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                      >
                        {user.role}
                        {isAdmin && <ChevronDown className="h-3 w-3 opacity-50" />}
                      </button>
                    )}
                  </td>

                  {/* Actions */}
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      {user.id !== currentUser?.id && (
                        <>
                          {deleteConfirm === user.id ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="text-xs text-destructive">Delete?</span>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs px-2"
                                onClick={() => handleDelete(user.id)}
                              >
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs px-2"
                                onClick={() => setDeleteConfirm(null)}
                              >
                                No
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No team members found.</div>
          )}
        </div>
      )}

      {/* Role descriptions */}
      <div className="border rounded-xl p-5 bg-card space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4" /> Role Permissions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLES.filter(r => r !== "SERVICE_ACCOUNT").map((role) => (
            <div key={role} className={`px-3 py-2 rounded-lg border ${ROLE_COLORS[role]}`}>
              <p className="text-xs font-bold uppercase tracking-wider">{role}</p>
              <p className="text-[11px] mt-0.5 opacity-80">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Create User Form ---

function CreateUserForm({ onCreated }: { onCreated: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await createUser({ username, email, password, role });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 pt-2">
      {error && (
        <div className="text-xs text-destructive font-medium px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Username *</label>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. john.doe"
          className="h-10"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@company.com"
          className="h-10"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Password *</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 4 characters"
          className="h-10"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Role *</label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.filter(r => r !== "SERVICE_ACCOUNT").map((r) => (
              <SelectItem key={r} value={r}>
                <div>
                  <span className="font-medium">{r}</span>
                  <span className="text-muted-foreground text-xs ml-2">{ROLE_DESCRIPTIONS[r]?.split("—")[0]}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 gap-2">
        <UserPlus className="h-4 w-4" />
        {isLoading ? "Creating..." : "Create Account"}
      </Button>
    </form>
  );
}
