"use client";

import { useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPipeline,
  type Pipeline,
} from "@/lib/pipelines";
import { cancelRun, getRun, RUN_STATUS_COLORS, type Run } from "@/lib/runs";
import PipelineGraph from "@/components/PipelineGraph";
import {
  ArrowLeft,
  Activity,
  Terminal,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  X,
  StopCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

function getStatusIcon(status?: string) {
  switch (status) {
    case "QUEUED": return <Clock className="h-5 w-5 text-blue-500" />;
    case "RUNNING": return <Play className="h-5 w-5 text-cyan-500" />;
    case "PASSED": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case "FAILED": return <XCircle className="h-5 w-5 text-red-500" />;
    case "CANCELLED": return <Ban className="h-5 w-5 text-gray-400" />;
    default: return <Activity className="h-5 w-5 text-muted-foreground" />;
  }
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const sec = Math.floor(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit"
  });
}

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pipelineId = params.id as string;
  const runId = params.runId as string;

  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the terminal logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }); // Runs after every render to keep it at the bottom while streaming

  const { data: pipeline, isLoading: isPipelineLoading, error: pipelineError } = useQuery({
    queryKey: ["pipeline", pipelineId],
    queryFn: () => getPipeline(pipelineId),
  });

  const { data: run, isLoading: isRunLoading, error: runError } = useQuery({
    queryKey: ["run", runId],
    queryFn: () => getRun(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return (status === "QUEUED" || status === "RUNNING") ? 500 : false;
    },
  });

  const isLoading = isPipelineLoading || isRunLoading;
  const errorObj = pipelineError || runError;
  const displayError = errorObj instanceof Error ? errorObj.message : errorObj ? "Failed to load data" : null;

  let progressPct = 0;
  if (run?.status === "RUNNING" && pipeline) {
    const total = Math.max(pipeline.stages?.length || 0, pipeline.buildSteps?.length || 0, run.stageResults?.length || 1);
    const completed = run.stageResults?.filter((r) => r.status === "PASSED" || r.status === "FAILED").length || 0;
    const hasRunning = run.stageResults?.some((r) => r.status === "RUNNING");
    const current = hasRunning ? 0.5 : 0;
    progressPct = Math.min(Math.round(((completed + current) / total) * 100), 96);
  }

  const handleCancel = async () => {
    if (!run) return;
    try {
      await cancelRun(run.id);
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      queryClient.invalidateQueries({ queryKey: ["runs", pipelineId] });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading && (!pipeline || !run)) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
        Loading run details...
      </div>
    );
  }

  if (displayError || !pipeline || !run) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-destructive px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
        <AlertTriangle className="h-4 w-4" /> {displayError || "Run not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/pipelines/${pipelineId}`)}
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                {pipeline.name} <span className="text-muted-foreground font-normal">#{run.id.substring(0, 6)}</span>
              </h2>
              {run.status === "RUNNING" ? (
                <div className="flex items-center gap-3 w-32 ml-2">
                  <div className="flex-1 h-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 transition-all duration-500 ease-out rounded-full shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {progressPct}%
                  </span>
                </div>
              ) : (
                <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${RUN_STATUS_COLORS[run.status] || ""}`}>
                  {run.status}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3">
              <span>{formatDate(run.startedAt)}</span>
              {run.durationMs > 0 && <span>• {formatDuration(run.durationMs)}</span>}
            </p>
          </div>
        </div>

        {(run.status === "QUEUED" || run.status === "RUNNING") && (
          <Button variant="destructive" onClick={handleCancel} className="gap-2">
            <StopCircle className="h-4 w-4" /> Cancel Run
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Pipeline Graph */}
        <div className="border rounded-xl p-6 bg-card space-y-6">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4" /> Execution Graph
          </h3>
          <PipelineGraph pipeline={pipeline} stageResults={run.stageResults} />
        </div>

        {/* Live Terminal Output */}
        <div className="border rounded-xl bg-black overflow-hidden flex flex-col shadow-inner">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20 bg-muted/20">
            <Terminal className="h-4 w-4 text-foreground/70" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Terminal Output</span>
            {run.status === "RUNNING" && <span className="ml-auto flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
          </div>
          <div 
            ref={logContainerRef}
            className="p-4 text-[13px] leading-relaxed font-mono text-zinc-300 min-h-[400px] max-h-[600px] overflow-y-auto w-full break-normal whitespace-pre-wrap flex flex-col"
          >
            {run.stageResults?.length === 0 ? (
              <div className="text-zinc-500 italic">Initializing workplace...</div>
            ) : run.stageResults.map((stage) => (
              <div key={stage.stageId} className="mb-4 last:mb-0">
                <div className="text-blue-400 font-bold mb-1 border-b border-blue-900/30 pb-1 w-full inline-block">❯ {stage.stageName}</div>
                {stage.logs && stage.logs.map((log, i) => (
                  <div key={i} className={`
                    ${log.includes('[ERROR]') ? 'text-red-400 font-medium' : ''}
                    ${log.includes('[SUCCESS]') || log.includes('SUCCESS') ? 'text-green-400 font-medium' : ''}
                    ${log.includes('[INFO]') ? 'text-blue-300' : ''}
                    ${log.startsWith('> ') ? 'text-yellow-200 opacity-80 mt-2 mb-1' : ''}
                  `}>{log}</div>
                ))}
              </div>
            ))}
            {run.status === 'RUNNING' && <div className="animate-pulse w-2 h-4 bg-zinc-400 mt-1"></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
