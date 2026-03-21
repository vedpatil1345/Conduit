"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/index";
import { changePassword, ROLE_COLORS, ROLE_DESCRIPTIONS } from "@/lib/users";
import { Settings, User, Lock, Check, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and security settings.
        </p>
      </div>

      {/* Profile Card */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider">
          <User className="h-4 w-4" /> Profile
        </h3>
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shrink-0">
            {user?.username?.slice(0, 2).toUpperCase() || "??"}
          </div>
          <div className="space-y-2 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Username</p>
                <p className="text-sm font-medium text-foreground">{user?.username || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Role</p>
              <div className="mt-1">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border ${user?.role ? ROLE_COLORS[user.role] : ""}`}>
                  <Shield className="h-3 w-3" />
                  {user?.role || "—"}
                </span>
                {user?.role && (
                  <p className="text-xs text-muted-foreground mt-1">{ROLE_DESCRIPTIONS[user.role]}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="border rounded-xl p-6 bg-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider">
          <Lock className="h-4 w-4" /> Change Password
        </h3>
        <ChangePasswordForm />
      </div>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {success && (
        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="h-4 w-4" /> Password changed successfully
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm font-medium text-destructive px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Current Password</label>
        <Input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">New Password</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Minimum 4 characters"
          className="h-10"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-foreground">Confirm New Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter new password"
          className="h-10"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-fit gap-2">
        <Lock className="h-4 w-4" />
        {isLoading ? "Changing..." : "Change Password"}
      </Button>
    </form>
  );
}
