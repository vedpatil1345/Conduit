"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listCredentials,
  createCredential,
  deleteCredential,
  type CredentialSummary,
  type CredentialType,
  CREDENTIAL_TYPE_LABELS,
  CREDENTIAL_TYPE_COLORS,
} from "@/lib/credentials";
import {
  KeyRound,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  X,
  User,
  Lock,
  Key,
  FileKey,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CREDENTIAL_TYPES: { value: CredentialType; label: string; icon: typeof Key }[] = [
  { value: "USERNAME_PASSWORD", label: "Username & Password", icon: User },
  { value: "SECRET_TEXT", label: "Secret Text", icon: FileKey },
  { value: "SSH_KEY", label: "SSH Key", icon: Key },
  { value: "TOKEN", label: "Token", icon: Lock },
];

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<CredentialType>("USERNAME_PASSWORD");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newSecretText, setNewSecretText] = useState("");
  const [newSshKey, setNewSshKey] = useState("");
  const [newSshPassphrase, setNewSshPassphrase] = useState("");
  const [newToken, setNewToken] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchCredentials = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listCredentials();
      setCredentials(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load credentials");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const showSuccessMsg = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewType("USERNAME_PASSWORD");
    setNewUsername("");
    setNewPassword("");
    setNewSecretText("");
    setNewSshKey("");
    setNewSshPassphrase("");
    setNewToken("");
    setShowCreate(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newName.trim()) {
      setError("Credential name is required");
      return;
    }

    setIsCreating(true);
    try {
      await createCredential({
        name: newName.trim(),
        description: newDescription.trim(),
        type: newType,
        ...(newType === "USERNAME_PASSWORD" && { username: newUsername, password: newPassword }),
        ...(newType === "SECRET_TEXT" && { secretText: newSecretText }),
        ...(newType === "SSH_KEY" && { sshKey: newSshKey, sshPassphrase: newSshPassphrase }),
        ...(newType === "TOKEN" && { token: newToken }),
      });
      resetForm();
      showSuccessMsg("Credential created successfully");
      fetchCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create credential");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCredential(id);
      setDeleteConfirm(null);
      showSuccessMsg("Credential deleted successfully");
      fetchCredentials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete credential");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <KeyRound className="h-6 w-6" />
            Credentials
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {credentials.length} credential{credentials.length !== 1 ? "s" : ""} stored
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          Add Credential
        </Button>
      </div>

      {/* Feedback */}
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

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">New Credential</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. docker-hub" className="h-10" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select value={newType} onValueChange={(v) => setNewType(v as CredentialType)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CREDENTIAL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Optional description" className="h-10" />
            </div>
          </div>

          {/* Type-specific fields */}
          <div className="border-t pt-4">
            {newType === "USERNAME_PASSWORD" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Username</label>
                  <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Username" className="h-10" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" className="h-10" />
                </div>
              </div>
            )}
            {newType === "SECRET_TEXT" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Secret</label>
                <Input type="password" value={newSecretText} onChange={(e) => setNewSecretText(e.target.value)} placeholder="Secret value" className="h-10" />
              </div>
            )}
            {newType === "SSH_KEY" && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Private Key</label>
                  <textarea
                    value={newSshKey}
                    onChange={(e) => setNewSshKey(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border bg-muted/30 px-4 py-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                    spellCheck={false}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Passphrase (optional)</label>
                  <Input type="password" value={newSshPassphrase} onChange={(e) => setNewSshPassphrase(e.target.value)} placeholder="Key passphrase" className="h-10" />
                </div>
              </div>
            )}
            {newType === "TOKEN" && (
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Token</label>
                <Input type="password" value={newToken} onChange={(e) => setNewToken(e.target.value)} placeholder="API token or access token" className="h-10" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isCreating} className="gap-2">
              <KeyRound className="h-4 w-4" /> {isCreating ? "Creating..." : "Create Credential"}
            </Button>
            <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Credentials table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : credentials.length === 0 && !showCreate ? (
        <div className="border rounded-xl bg-card flex flex-col items-center justify-center py-20 text-center">
          <KeyRound className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No credentials yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Store credentials securely to use in your pipelines — passwords, tokens, SSH keys.
          </p>
          <Button className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> Add Credential
          </Button>
        </div>
      ) : credentials.length > 0 ? (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Description</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Created</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{cred.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${CREDENTIAL_TYPE_COLORS[cred.type] || ""}`}>
                      {CREDENTIAL_TYPE_LABELS[cred.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground truncate max-w-[200px] block">{cred.description || "—"}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{formatDate(cred.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {deleteConfirm === cred.id ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-destructive">Delete?</span>
                        <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleDelete(cred.id)}>Yes</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setDeleteConfirm(null)}>No</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(cred.id)}
                        className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
