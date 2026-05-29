"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPipelines,
  deletePipeline,
  updatePipeline,
  type Pipeline,
  STATUS_COLORS,
  TRIGGER_LABELS,
  DEFINITION_LABELS,
  DEFINITION_COLORS,
} from "@/lib/pipelines";
import { triggerPipeline } from "@/lib/runs";
import {
  GitMerge,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  X,
  GitBranch,
  Clock,
  Webhook,
  Play,
  MoreHorizontal,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PipelinesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: pipelines = [], isLoading, error: queryError } = useQuery({
    queryKey: ["pipelines"],
    queryFn: listPipelines,
    refetchInterval: 2000, // Background polling every 2s
  });

  const displayError = error || (queryError instanceof Error ? queryError.message : queryError ? "Failed to load pipelines" : null);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleTrigger = async (pipelineId: string) => {
    try {
      await triggerPipeline(pipelineId);
      showSuccess("Pipeline triggered — view details to track progress");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger pipeline");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePipeline(id);
      setDeleteConfirm(null);
      showSuccess("Pipeline deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pipeline");
    }
  };



  const triggerIcon = (trigger: string) => {
    switch (trigger) {
      case "WEBHOOK": return <Webhook className="h-3.5 w-3.5" />;
      case "CRON": return <Clock className="h-3.5 w-3.5" />;
      default: return <Play className="h-3.5 w-3.5" />;
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
            <GitMerge className="h-6 w-6" />
            Pipelines
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {pipelines.length} pipeline{pipelines.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/pipelines/new")}>
          <Plus className="h-4 w-4" />
          New Pipeline
        </Button>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="h-4 w-4" /> {successMsg}
        </div>
      )}
      {displayError && (
        <div className="flex items-center gap-2 text-sm font-medium text-destructive px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="h-4 w-4" /> {displayError}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Pipelines table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : pipelines.length === 0 ? (
        <div className="border rounded-xl bg-card flex flex-col items-center justify-center py-20 text-center">
          <GitMerge className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No pipelines yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Create your first CI/CD pipeline — choose from ConduitFile, Script, or Freestyle.
          </p>
          <Button className="gap-2" onClick={() => router.push("/pipelines/new")}>
            <Plus className="h-4 w-4" />
            Create Pipeline
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Pipeline</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Definition</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Repository</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Trigger</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Created</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pipelines.map((pipeline) => (
                <tr
                  key={pipeline.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => router.push(`/pipelines/${pipeline.id}`)}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{pipeline.name}</p>
                      {pipeline.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{pipeline.description}</p>
                      )}
                    </div>
                  </td>

                  {/* Definition type */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${DEFINITION_COLORS[pipeline.definitionType] || ""}`}>
                      {DEFINITION_LABELS[pipeline.definitionType] || pipeline.definitionType}
                    </span>
                  </td>

                  {/* Repo */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {pipeline.repoUrl ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <GitBranch className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[160px]">
                          {pipeline.repoUrl.replace(/^https?:\/\/(github\.com|gitlab\.com)\//, "")}
                        </span>
                        {pipeline.branch && (
                          <span className="text-foreground/70 font-medium">/ {pipeline.branch}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Trigger */}
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {triggerIcon(pipeline.trigger)}
                      {TRIGGER_LABELS[pipeline.trigger] || pipeline.trigger}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_COLORS[pipeline.status] || ""}`}>
                      {pipeline.status}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">{formatDate(pipeline.createdAt)}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {deleteConfirm === pipeline.id ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-destructive">Delete?</span>
                        <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleDelete(pipeline.id)}>Yes</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setDeleteConfirm(null)}>No</Button>
                      </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/pipelines/${pipeline.id}`)}>
                            <Circle className="h-3.5 w-3.5 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleTrigger(pipeline.id)}
                            disabled={pipeline.status !== "ACTIVE"}
                          >
                            <Play className="h-3.5 w-3.5 mr-2" /> Run Pipeline
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteConfirm(pipeline.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
