"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  getPipeline,
  updatePipeline,
  triggerPipeline,
  type Pipeline,
  type UpdatePipelineRequest,
  STATUS_COLORS,
  TRIGGER_LABELS,
  DEFINITION_LABELS,
} from "@/lib/pipelines";
import {
  Activity,
  ArrowLeft,
  Check,
  AlertTriangle,
  Play,
  Settings,
  Github,
  GitBranch,
  Clock,
  Save,
  Network,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useSearchParams } from "next/navigation";

export default function PipelineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "runs";

  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Edit state
  const [editData, setEditData] = useState<UpdatePipelineRequest>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchPipeline = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPipeline(resolvedParams.id);
      setPipeline(data);
      setEditData({
        name: data.name,
        description: data.description,
        repoUrl: data.repoUrl,
        branch: data.branch,
        trigger: data.trigger,
        status: data.status,
        cronExpression: data.cronExpression,
        script: data.script,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setIsLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleTrigger = async () => {
    if (!pipeline) return;
    try {
      await triggerPipeline(pipeline.id);
      showSuccess("Pipeline triggered successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger pipeline");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipeline) return;

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updatePipeline(pipeline.id, editData);
      setPipeline(updated);
      showSuccess("Pipeline updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pipeline");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[60vh] text-muted-foreground">Loading pipeline details...</div>;
  }

  if (!pipeline) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Pipeline not found</h2>
        <p className="text-sm text-muted-foreground mb-6">The pipeline you're looking for doesn't exist or has been deleted.</p>
        <Link href="/pipelines">
          <Button>Back to Pipelines</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-4 border-b">
        <div className="flex items-start gap-4">
          <Link href="/pipelines">
            <Button variant="ghost" size="icon" className="h-8 w-8 mt-1 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground">{pipeline.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase ${STATUS_COLORS[pipeline.status]}`}>
                {pipeline.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              {pipeline.repoUrl && (
                <div className="flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" />
                  {pipeline.repoUrl.replace("https://github.com/", "")}
                </div>
              )}
              {pipeline.branch && (
                <div className="flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {pipeline.branch}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Updated {formatDistanceToNow(new Date(pipeline.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start">
          <Button 
            onClick={handleTrigger} 
            disabled={pipeline.status !== "ACTIVE"}
            className="gap-2 shrink-0 shadow-sm"
          >
            <Play className="h-4 w-4" fill="currentColor" />
            Run Pipeline
          </Button>
        </div>
      </div>

      {/* Messages */}
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

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("runs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "runs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Runs
        </button>
        {pipeline.definitionType === "SCRIPT" && (
          <button
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "editor"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            }`}
          >
            Editor
          </button>
        )}
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
          }`}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        
        {/* RUNS TAB */}
        {activeTab === "runs" && (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-dashed">
            <Network className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-medium text-foreground">Pipeline Runs</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Run execution history will appear here once the Runs feature is enabled.
            </p>
            <Button onClick={handleTrigger} disabled={pipeline.status !== "ACTIVE"} variant="outline">
              <Play className="h-4 w-4 mr-2" /> Trigger Now
            </Button>
          </div>
        )}

        {/* EDITOR TAB */}
        {activeTab === "editor" && pipeline.definitionType === "SCRIPT" && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="rounded-xl border bg-[#1e1e1e] overflow-hidden flex flex-col h-[500px]">
              <div className="bg-[#2d2d2d] px-4 py-2 text-xs font-mono text-gray-300 flex items-center justify-between border-b border-[#404040]">
                <span>pipeline.script</span>
                <span className="text-[10px] text-gray-500">Conduit Script</span>
              </div>
              <textarea
                value={editData.script || ""}
                onChange={(e) => setEditData({ ...editData, script: e.target.value })}
                className="flex-1 w-full bg-transparent text-gray-300 p-4 font-mono text-sm resize-none focus:outline-none"
                placeholder="stages {&#10;  stage('Build') {&#10;    sh 'npm install'&#10;  }&#10;}"
                spellCheck={false}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Script</>}
              </Button>
            </div>
          </form>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <form onSubmit={handleUpdate} className="max-w-3xl space-y-8 bg-card border rounded-xl p-6">
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">General Settings</h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Pipeline Name</label>
                  <Input
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="h-10"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <Select
                    value={editData.status}
                    onValueChange={(val: "ACTIVE" | "PAUSED" | "DRAFT") => setEditData({ ...editData, status: val })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="PAUSED">Paused</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Description</label>
                <Textarea
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Source Configuration</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Github className="h-3.5 w-3.5" /> Repository URL
                  </label>
                  <Input
                    value={editData.repoUrl || ""}
                    onChange={(e) => setEditData({ ...editData, repoUrl: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <GitBranch className="h-3.5 w-3.5" /> Branch
                  </label>
                  <Input
                    value={editData.branch || ""}
                    onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">Trigger Configuration</h3>
              <div className="grid gap-2 max-w-sm">
                <label className="text-sm font-medium text-foreground">Trigger Mode</label>
                <Select
                  value={editData.trigger}
                  onValueChange={(val: "MANUAL" | "WEBHOOK" | "CRON") => setEditData({ ...editData, trigger: val })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["MANUAL", "WEBHOOK", "CRON"] as const).map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="font-medium">{TRIGGER_LABELS[t]}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editData.trigger === "CRON" && (
                <div className="grid gap-2 max-w-sm bg-muted/30 p-4 rounded-lg border border-border/50">
                  <label className="text-sm font-medium text-foreground">Cron Expression</label>
                  <Input
                    value={editData.cronExpression || ""}
                    onChange={(e) => setEditData({ ...editData, cronExpression: e.target.value })}
                    placeholder="0 * * * *"
                    className="h-9 font-mono bg-background"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? "Saving..." : <><Save className="h-4 w-4" /> Save Settings</>}
              </Button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
