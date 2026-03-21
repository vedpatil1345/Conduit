"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPipeline,
  deletePipeline,
  updatePipeline,
  type Pipeline,
  STATUS_COLORS,
  TRIGGER_LABELS,
  DEFINITION_LABELS,
  DEFINITION_COLORS,
  STAGE_TYPES,
  type BuildStep,
  type DefinitionType,
} from "@/lib/pipelines";
import { listCredentials, type CredentialSummary } from "@/lib/credentials";
import {
  GitMerge,
  ArrowLeft,
  Trash2,
  Check,
  AlertTriangle,
  X,
  GitBranch,
  Clock,
  Webhook,
  Play,
  Pause,
  Settings,
  Layers,
  Calendar,
  Edit3,
  Save,
  Plus,
  FileCode2,
  Code2,
  Terminal,
  KeyRound,
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

export default function PipelineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);

  // Edit state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRepoUrl, setEditRepoUrl] = useState("");
  const [editBranch, setEditBranch] = useState("");
  const [editTrigger, setEditTrigger] = useState<"MANUAL" | "WEBHOOK" | "CRON">("MANUAL");
  const [editCron, setEditCron] = useState("");
  const [editConduitFilePath, setEditConduitFilePath] = useState("ConduitFile");
  const [editScript, setEditScript] = useState("");
  const [editBuildSteps, setEditBuildSteps] = useState<BuildStep[]>([]);
  const [editCredentialIds, setEditCredentialIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPipeline(id);
      setPipeline(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pipeline not found");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchCredentials = useCallback(async () => {
    try {
      const data = await listCredentials();
      setCredentials(data);
    } catch { /* optional */ }
  }, []);

  useEffect(() => {
    fetchPipeline();
    fetchCredentials();
  }, [fetchPipeline, fetchCredentials]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDelete = async () => {
    try {
      await deletePipeline(id);
      router.push("/pipelines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pipeline");
    }
  };

  const handleToggleStatus = async () => {
    if (!pipeline) return;
    const newStatus = pipeline.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await updatePipeline(id, { status: newStatus });
      showSuccess(`Pipeline ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
      fetchPipeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const startEditing = () => {
    if (!pipeline) return;
    setEditName(pipeline.name);
    setEditDescription(pipeline.description || "");
    setEditRepoUrl(pipeline.repoUrl || "");
    setEditBranch(pipeline.branch || "");
    setEditTrigger(pipeline.trigger);
    setEditCron(pipeline.cronExpression || "");
    setEditConduitFilePath(pipeline.conduitFilePath || "ConduitFile");
    setEditScript(pipeline.script || "");
    setEditBuildSteps(pipeline.buildSteps ? [...pipeline.buildSteps] : []);
    setEditCredentialIds(pipeline.credentialIds ? [...pipeline.credentialIds] : []);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!pipeline) return;
    setIsSaving(true);
    setError(null);
    try {
      await updatePipeline(id, {
        name: editName.trim(),
        description: editDescription.trim(),
        repoUrl: editRepoUrl.trim(),
        branch: editBranch.trim(),
        trigger: editTrigger,
        cronExpression: editTrigger === "CRON" ? editCron.trim() : undefined,
        conduitFilePath: pipeline.definitionType === "CONDUIT_FILE" ? editConduitFilePath.trim() : undefined,
        script: pipeline.definitionType === "SCRIPT" ? editScript : undefined,
        buildSteps: pipeline.definitionType === "FREESTYLE" ? editBuildSteps.filter((s) => s.command.trim()) : undefined,
        credentialIds: editCredentialIds,
      });
      setIsEditing(false);
      showSuccess("Pipeline updated successfully");
      fetchPipeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pipeline");
    } finally {
      setIsSaving(false);
    }
  };

  const addEditBuildStep = () => setEditBuildSteps([...editBuildSteps, { name: "", command: "" }]);
  const removeEditBuildStep = (i: number) => setEditBuildSteps(editBuildSteps.filter((_, idx) => idx !== i));
  const updateEditBuildStep = (i: number, field: keyof BuildStep, val: string) =>
    setEditBuildSteps(editBuildSteps.map((s, idx) => (idx === i ? { ...s, [field]: val } : s)));
  const toggleEditCredential = (cid: string) =>
    setEditCredentialIds((prev) => prev.includes(cid) ? prev.filter((c) => c !== cid) : [...prev, cid]);

  const triggerIcon = (trigger: string) => {
    switch (trigger) {
      case "WEBHOOK": return <Webhook className="h-4 w-4" />;
      case "CRON": return <Clock className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const definitionIcon = (dt: DefinitionType) => {
    switch (dt) {
      case "CONDUIT_FILE": return <FileCode2 className="h-4 w-4" />;
      case "SCRIPT": return <Code2 className="h-4 w-4" />;
      case "FREESTYLE": return <Terminal className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) return <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>;

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <GitMerge className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Pipeline Not Found</h2>
        <p className="text-sm text-muted-foreground mb-4">{error || "The pipeline doesn't exist."}</p>
        <Button variant="outline" onClick={() => router.push("/pipelines")}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
      </div>
    );
  }

  const boundCredentials = credentials.filter((c) => pipeline.credentialIds?.includes(c.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.push("/pipelines")} className="p-2 mt-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <GitMerge className="h-6 w-6" /> {pipeline.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${DEFINITION_COLORS[pipeline.definitionType] || ""}`}>
                {definitionIcon(pipeline.definitionType)} {DEFINITION_LABELS[pipeline.definitionType]}
              </span>
              {pipeline.description && <span className="text-sm text-muted-foreground">— {pipeline.description}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11 sm:ml-0">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={startEditing}><Edit3 className="h-3.5 w-3.5" /> Edit</Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleToggleStatus}>
                {pipeline.status === "ACTIVE" ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Activate</>}
              </Button>
              {deleteConfirm ? (
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs text-destructive">Delete?</span>
                  <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={handleDelete}>Yes</Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setDeleteConfirm(false)}>No</Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )}
            </>
          ) : (
            <>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={isSaving}><Save className="h-3.5 w-3.5" /> {isSaving ? "Saving..." : "Save"}</Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
            </>
          )}
        </div>
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

      {!isEditing ? (
        /* --- VIEW MODE --- */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Config */}
          <div className="space-y-6">
            <div className="border rounded-xl p-5 bg-card space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider"><Settings className="h-4 w-4" /> Configuration</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                  <span className={`inline-flex items-center text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border mt-1 ${STATUS_COLORS[pipeline.status]}`}>{pipeline.status}</span>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Trigger</p>
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground mt-1">{triggerIcon(pipeline.trigger)} {TRIGGER_LABELS[pipeline.trigger]}</span>
                  {pipeline.trigger === "CRON" && pipeline.cronExpression && <p className="text-xs text-muted-foreground font-mono mt-0.5">{pipeline.cronExpression}</p>}
                </div>
                {pipeline.repoUrl && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Repository</p>
                    <div className="flex items-center gap-1.5 text-sm text-foreground mt-1"><GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate">{pipeline.repoUrl}</span></div>
                    {pipeline.branch && <p className="text-xs text-muted-foreground mt-0.5 ml-6">Branch: <span className="font-medium text-foreground">{pipeline.branch}</span></p>}
                  </div>
                )}
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Created</p>
                  <span className="flex items-center gap-1.5 text-sm text-foreground mt-1"><Calendar className="h-4 w-4 text-muted-foreground" />{formatDate(pipeline.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Credentials card */}
            {boundCredentials.length > 0 && (
              <div className="border rounded-xl p-5 bg-card space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider"><KeyRound className="h-4 w-4" /> Credentials</h3>
                <div className="space-y-2">
                  {boundCredentials.map((cred) => (
                    <div key={cred.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground flex-1 truncate">{cred.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded border bg-muted/50 shrink-0">{cred.type.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Definition content */}
          <div className="lg:col-span-2 space-y-6">
            {pipeline.definitionType === "CONDUIT_FILE" && (
              <div className="border rounded-xl p-5 bg-card space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider"><FileCode2 className="h-4 w-4" /> ConduitFile</h3>
                <div className="p-3 rounded-lg border bg-muted/20">
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Script Path</p>
                  <p className="text-sm text-foreground font-mono">{pipeline.conduitFilePath || "ConduitFile"}</p>
                </div>
                <p className="text-xs text-muted-foreground">Pipeline reads its definition from this file in the repository.</p>
              </div>
            )}

            {pipeline.definitionType === "SCRIPT" && (
              <div className="border rounded-xl p-5 bg-card space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider"><Code2 className="h-4 w-4" /> Pipeline Script</h3>
                <pre className="p-4 rounded-lg border bg-muted/20 text-sm font-mono text-foreground overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                  {pipeline.script || "// No script defined"}
                </pre>
              </div>
            )}

            {pipeline.definitionType === "FREESTYLE" && (
              <div className="border rounded-xl p-5 bg-card space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider">
                  <Terminal className="h-4 w-4" /> Build Steps ({pipeline.buildSteps?.length || 0})
                </h3>
                {!pipeline.buildSteps || pipeline.buildSteps.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No build steps defined.</div>
                ) : (
                  <div className="space-y-2">
                    {pipeline.buildSteps
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                      .map((step, index) => (
                        <div key={step.id || index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{index + 1}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{step.name || `Step ${index + 1}`}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{step.command}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Stages (if any) */}
            {pipeline.stages && pipeline.stages.length > 0 && (
              <div className="border rounded-xl p-5 bg-card space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wider"><Layers className="h-4 w-4" /> Stages ({pipeline.stages.length})</h3>
                <div className="space-y-2">
                  {pipeline.stages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((stage, index) => (
                    <div key={stage.id || index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{stage.name}</p>
                        {stage.command && <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{stage.command}</p>}
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded border bg-muted/50 shrink-0">{stage.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- EDIT MODE --- */
        <div className="space-y-6 max-w-2xl">
          <div className="border rounded-xl p-6 bg-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basic Information</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="h-10" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Repository URL</label>
                  <Input value={editRepoUrl} onChange={(e) => setEditRepoUrl(e.target.value)} className="h-10" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Branch</label>
                  <Input value={editBranch} onChange={(e) => setEditBranch(e.target.value)} className="h-10" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Trigger</label>
                  <Select value={editTrigger} onValueChange={(v) => setEditTrigger(v as typeof editTrigger)}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                      <SelectItem value="WEBHOOK">Webhook</SelectItem>
                      <SelectItem value="CRON">Cron</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editTrigger === "CRON" && (
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-foreground">Cron Expression</label>
                    <Input value={editCron} onChange={(e) => setEditCron(e.target.value)} className="h-10 font-mono text-sm" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Definition-specific edit */}
          {pipeline.definitionType === "CONDUIT_FILE" && (
            <div className="border rounded-xl p-6 bg-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"><FileCode2 className="h-4 w-4" /> ConduitFile Path</h3>
              <Input value={editConduitFilePath} onChange={(e) => setEditConduitFilePath(e.target.value)} className="h-10 font-mono text-sm" />
            </div>
          )}

          {pipeline.definitionType === "SCRIPT" && (
            <div className="border rounded-xl p-6 bg-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"><Code2 className="h-4 w-4" /> Pipeline Script</h3>
              <textarea
                value={editScript}
                onChange={(e) => setEditScript(e.target.value)}
                rows={16}
                className="w-full rounded-lg border bg-muted/30 px-4 py-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
              />
            </div>
          )}

          {pipeline.definitionType === "FREESTYLE" && (
            <div className="border rounded-xl p-6 bg-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2"><Terminal className="h-4 w-4" /> Build Steps</h3>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addEditBuildStep}><Plus className="h-3.5 w-3.5" /> Add Step</Button>
              </div>
              <div className="space-y-3">
                {editBuildSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                    <div className="flex-1 grid gap-3 sm:grid-cols-3">
                      <div className="grid gap-1.5">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Name</label>
                        <Input value={step.name} onChange={(e) => updateEditBuildStep(index, "name", e.target.value)} className="h-9 text-sm" />
                      </div>
                      <div className="grid gap-1.5 sm:col-span-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Command</label>
                        <Input value={step.command} onChange={(e) => updateEditBuildStep(index, "command", e.target.value)} className="h-9 text-sm font-mono" />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeEditBuildStep(index)} className="p-1.5 mt-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Credentials edit */}
          {credentials.length > 0 && (
            <div className="border rounded-xl p-6 bg-card space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Credentials</h3>
              <div className="grid gap-2">
                {credentials.map((cred) => (
                  <label key={cred.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${editCredentialIds.includes(cred.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <input type="checkbox" checked={editCredentialIds.includes(cred.id)} onChange={() => toggleEditCredential(cred.id)} className="rounded border-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{cred.name}</p>
                      {cred.description && <p className="text-xs text-muted-foreground truncate">{cred.description}</p>}
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded border bg-muted/50 shrink-0">{cred.type.replace("_", " ")}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
