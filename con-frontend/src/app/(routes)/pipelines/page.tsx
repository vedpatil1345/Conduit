"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  listPipelines,
  deletePipeline,
  triggerPipeline,
  type Pipeline,
  STATUS_COLORS,
  TRIGGER_LABELS,
  DEFINITION_LABELS,
  DEFINITION_COLORS,
} from "@/lib/pipelines";
import {
  Play,
  Trash2,
  GitBranch,
  Settings,
  Plus,
  Clock,
  Github,
  Check,
  AlertTriangle,
  X,
  Search,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [filteredPipelines, setFilteredPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchPipelines = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listPipelines();
      setPipelines(data);
      setFilteredPipelines(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipelines");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  useEffect(() => {
    if (search) {
      const lower = search.toLowerCase();
      setFilteredPipelines(
        pipelines.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) ||
            p.description?.toLowerCase().includes(lower) ||
            p.repoUrl?.toLowerCase().includes(lower)
        )
      );
    } else {
      setFilteredPipelines(pipelines);
    }
  }, [search, pipelines]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleTrigger = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await triggerPipeline(id);
      showSuccess("Pipeline triggered successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger pipeline");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deletePipeline(id);
      setDeleteConfirm(null);
      showSuccess("Pipeline deleted successfully");
      fetchPipelines();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pipeline");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Pipelines
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your CI/CD pipelines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pipelines..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/pipelines/new">
            <Button className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              New Pipeline
            </Button>
          </Link>
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
      ) : filteredPipelines.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border flex flex-col items-center">
          <Activity className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No pipelines found</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
            {search
              ? "No pipelines matched your search."
              : "Get started by creating your first pipeline to automate your deployments."}
          </p>
          {!search && (
            <Link href="/pipelines/new">
              <Button>Create Pipeline</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Pipeline</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Repository</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPipelines.map((pipeline) => (
                <tr
                  key={pipeline.id}
                  className="hover:bg-muted/20 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/pipelines/${pipeline.id}`)}
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {pipeline.name}
                      </span>
                      {pipeline.description && (
                        <span className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                          {pipeline.description}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1.5">
                        <Clock className="h-3 w-3" />
                        Updated {formatDistanceToNow(new Date(pipeline.updatedAt), { addSuffix: true })}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {pipeline.repoUrl ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Github className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[180px]">{pipeline.repoUrl.replace("https://github.com/", "")}</span>
                        </div>
                        {pipeline.branch && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GitBranch className="h-3 w-3" />
                            {pipeline.branch}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded text-[10px] font-medium border ${DEFINITION_COLORS[pipeline.definitionType]}`}>
                        {DEFINITION_LABELS[pipeline.definitionType]}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Trigger: {TRIGGER_LABELS[pipeline.trigger]}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${STATUS_COLORS[pipeline.status]}`}>
                      {pipeline.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      {deleteConfirm === pipeline.id ? (
                        <div className="inline-flex items-center gap-2 bg-background p-1 rounded-md border shadow-sm">
                          <span className="text-xs text-destructive font-medium px-1">Delete?</span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 text-[10px] px-2"
                            onClick={(e) => handleDelete(e, pipeline.id)}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 text-[10px] px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(null);
                            }}
                          >
                            No
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/pipelines/${pipeline.id}?tab=settings`);
                            }}
                            title="Settings"
                          >
                            <Settings className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm(pipeline.id);
                            }}
                            title="Delete pipeline"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 px-3 gap-1.5"
                            onClick={(e) => handleTrigger(e, pipeline.id)}
                            disabled={pipeline.status !== "ACTIVE"}
                          >
                            <Play className="h-3.5 w-3.5" fill="currentColor" />
                            Run
                          </Button>
                        </>
                      )}
                    </div>
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
