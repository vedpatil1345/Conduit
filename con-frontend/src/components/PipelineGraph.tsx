"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Pipeline, BuildStep, Stage } from "@/lib/pipelines";
import type { StageResult, RunStatus } from "@/lib/runs";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Terminal,
  ArrowRight,
} from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  command: string;
  type?: string;
}

interface PipelineGraphProps {
  pipeline: Pipeline;
  stageResults?: StageResult[];
}

const NODE_W = 200;
const NODE_H = 68;
const GAP_X = 64;
const GAP_Y = 0;
const PADDING = 32;

function getStatusStyle(status?: RunStatus) {
  switch (status) {
    case "QUEUED":
      return {
        gradId: "grad-queued",
        border: "#60a5fa",
        text: "#1e3a8a",
        subtext: "#3b82f6",
        iconBg: "#dbeafe",
      };
    case "RUNNING":
      return {
        gradId: "grad-running",
        border: "#22d3ee",
        text: "#164e63",
        subtext: "#0891b2",
        iconBg: "#cffafe",
      };
    case "PASSED":
      return {
        gradId: "grad-passed",
        border: "#4ade80",
        text: "#14532d",
        subtext: "#16a34a",
        iconBg: "#dcfce7",
      };
    case "FAILED":
      return {
        gradId: "grad-failed",
        border: "#f87171",
        text: "#7f1d1d",
        subtext: "#dc2626",
        iconBg: "#fee2e2",
      };
    case "CANCELLED":
      return {
        gradId: "grad-cancelled",
        border: "#9ca3af",
        text: "#374151",
        subtext: "#6b7280",
        iconBg: "#f3f4f6",
      };
    default:
      return {
        gradId: "grad-default",
        border: "#d1d5db",
        text: "#4b5563",
        subtext: "#9ca3af",
        iconBg: "#f3f4f6",
      };
  }
}

function getStatusIcon(status?: RunStatus) {
  switch (status) {
    case "QUEUED":
      return <Clock className="h-4 w-4 text-blue-600" />;
    case "RUNNING":
      return <Play className="h-4 w-4 text-cyan-600" />;
    case "PASSED":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "FAILED":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "CANCELLED":
      return <Ban className="h-4 w-4 text-gray-500" />;
    default:
      return <Terminal className="h-4 w-4 text-gray-500" />;
  }
}

export default function PipelineGraph({ pipeline, stageResults }: PipelineGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Build nodes from pipeline definition, or fall back to stageResults
  const nodes: GraphNode[] = [];
  if (pipeline.stages && pipeline.stages.length > 0) {
    const sorted = [...pipeline.stages].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sorted.forEach((stage: Stage) => {
      nodes.push({ id: stage.id || String(nodes.length), label: stage.name, command: stage.command, type: stage.type });
    });
  } else if (pipeline.buildSteps && pipeline.buildSteps.length > 0) {
    const sorted = [...pipeline.buildSteps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sorted.forEach((step: BuildStep, i: number) => {
      nodes.push({ id: step.id || String(i), label: step.name || `Step ${i + 1}`, command: step.command });
    });
  } else if (stageResults && stageResults.length > 0) {
    stageResults.forEach((sr, i) => {
      nodes.push({ id: sr.stageId, label: sr.stageName, command: sr.command });
    });
  }

  if (nodes.length === 0) {
    if (pipeline.definitionType === "CONDUIT_FILE") {
      const repo = pipeline.repoUrl || "...";
      const filePath = pipeline.conduitFilePath || "ConduitFile";
      nodes.push(
        { id: "ph-1", label: "Checkout", command: `git clone -b ${pipeline.branch || "main"} ${repo} .` },
        { id: "ph-2", label: `Parse ${filePath}`, command: `cat ${filePath}` },
        { id: "ph-3", label: "Build", command: "sh ./build.sh" },
        { id: "ph-4", label: "Test", command: "sh ./test.sh" },
        { id: "ph-5", label: "Deploy", command: "sh ./deploy.sh" },
      );
    } else if (pipeline.definitionType === "SCRIPT" && pipeline.script) {
      const repo = pipeline.repoUrl || "...";
      nodes.push({ id: "ph-checkout", label: "Checkout", command: `git clone -b ${pipeline.branch || "main"} ${repo} .` });
      
      let parsedDeclarative = false;
      if (pipeline.script.includes("pipeline") && pipeline.script.includes("stage")) {
        const regex = /stage\s*\(\s*['"](.*?)['"]\s*\)\s*\{[\s\S]*?steps\s*\{([\s\S]*?)\}(?=\s*\}|\s*stage)/g;
        let match;
        let stepNum = 1;
        while ((match = regex.exec(pipeline.script)) !== null) {
          const stageName = match[1].trim();
          const cmds = match[2].trim();
          nodes.push({ id: `ph-script-${stepNum}`, label: stageName, command: cmds });
          stepNum++;
          parsedDeclarative = true;
        }
      }

      if (!parsedDeclarative) {
        const lines = pipeline.script.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//") && !l.startsWith("#"));
        lines.forEach((line, i) => {
          const label = line.length > 25 ? line.slice(0, 25) + "…" : line;
          nodes.push({ id: `ph-script-${i}`, label: `Step ${i + 1}: ${label}`, command: line });
        });
      }
      
      nodes.push({ id: "ph-finalize", label: "Finalize", command: "echo 'Pipeline complete'" });
    } else {
      return (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
          <div className="flex flex-col items-center gap-2">
            <Ban className="h-8 w-8 text-muted-foreground/50" />
            <p>No stages defined yet. Run the pipeline to build execution trees.</p>
          </div>
        </div>
      );
    }
  }

  // Find matching StageResult for a node
  const getResult = (nodeId: string): StageResult | undefined => {
    if (!stageResults) return undefined;
    return stageResults.find((sr) => sr.stageId === nodeId);
  };

  // Calculate SVG dimensions
  const svgW = PADDING * 2 + nodes.length * NODE_W + (nodes.length - 1) * GAP_X;
  const svgH = PADDING * 2 + NODE_H + 20;

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-xl border bg-card">
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="min-w-full"
          style={{ minWidth: svgW }}
        >
          <defs>
            {/* Shadows */}
            <filter id="nodeShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.05" />
            </filter>
            
            {/* Gradients */}
            <linearGradient id="grad-queued" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eff6ff" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>
            <linearGradient id="grad-running" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ecfeff" />
              <stop offset="100%" stopColor="#cffafe" />
            </linearGradient>
            <linearGradient id="grad-passed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f0fdf4" />
              <stop offset="100%" stopColor="#dcfce7" />
            </linearGradient>
            <linearGradient id="grad-failed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef2f2" />
              <stop offset="100%" stopColor="#fee2e2" />
            </linearGradient>
            <linearGradient id="grad-cancelled" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#f3f4f6" />
            </linearGradient>
            <linearGradient id="grad-default" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f9fafb" stopOpacity={0.8} />
            </linearGradient>

            {/* Animated pulse for running */}
            <radialGradient id="runningPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.15)">
                <animate attributeName="stopColor" values="rgba(6,182,212,0.15);rgba(6,182,212,0.35);rgba(6,182,212,0.15)" dur="1.5s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L8,3 L0,6 Z" fill="#9ca3af" />
            </marker>
          </defs>

          {/* Arrows between nodes */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const x1 = PADDING + (i - 1) * (NODE_W + GAP_X) + NODE_W;
            const y1 = PADDING + NODE_H / 2;
            const x2 = PADDING + i * (NODE_W + GAP_X);
            const y2 = y1;

            const prevResult = getResult(nodes[i - 1].id);
            const arrowColor = prevResult?.status === "PASSED" ? "#4ade80"
              : prevResult?.status === "FAILED" ? "#f87171"
              : prevResult?.status === "RUNNING" ? "#22d3ee"
              : "#e5e7eb";

            return (
              <g key={`arrow-${i}`}>
                <line
                  x1={x1 + 4}
                  y1={y1}
                  x2={x2 - 4}
                  y2={y2}
                  stroke={arrowColor}
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray={prevResult?.status === "RUNNING" ? "6 3" : "none"}
                >
                  {prevResult?.status === "RUNNING" && (
                    <animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite" />
                  )}
                </line>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const x = PADDING + i * (NODE_W + GAP_X);
            const y = PADDING;
            const result = getResult(node.id);
            const style = getStatusStyle(result?.status);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseLeave={() => setHoveredNode(null)}
                onMouseEnter={(e) => {
                  setHoveredNode(node.id);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom,
                  });
                }}
              >
                {/* Glow for running */}
                {result?.status === "RUNNING" && (
                  <rect
                    x={x - 4}
                    y={y - 4}
                    width={NODE_W + 8}
                    height={NODE_H + 8}
                    rx={14}
                    fill="url(#runningPulse)"
                  />
                )}

                {/* Node background with shadow & gradient */}
                <rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={12}
                  fill={`url(#${style.gradId})`}
                  stroke={style.border}
                  strokeWidth={hoveredNode === node.id ? 2 : 1.5}
                  filter="url(#nodeShadow)"
                  style={{ transition: "all 0.2s" }}
                />

                {/* Left side icon block */}
                <rect
                  x={x + 12}
                  y={y + 14}
                  width={40}
                  height={40}
                  rx={10}
                  fill={style.iconBg}
                />
                
                {/* Step number OR icon centered in block */}
                <text
                  x={x + 32}
                  y={y + 35}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="14"
                  fontWeight="700"
                  fill={style.border}
                >
                  {i + 1}
                </text>

                {/* Label */}
                <text
                  x={x + 64}
                  y={y + NODE_H / 2 - 8}
                  fontSize="13"
                  fontWeight="600"
                  fill={style.text}
                >
                  {node.label.length > 15 ? node.label.slice(0, 15) + "…" : node.label}
                </text>

                {/* Status text */}
                <text
                  x={x + 64}
                  y={y + NODE_H / 2 + 10}
                  fontSize="11"
                  fontWeight="600"
                  fill={style.subtext}
                >
                  {result?.status || "PENDING"}
                </text>

                {/* Status icon area (right side) */}
                {result?.status === "RUNNING" && (
                  <circle cx={x + NODE_W - 20} cy={y + NODE_H / 2} r={5} fill={style.border}>
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredNode && (() => {
          const node = nodes.find((n) => n.id === hoveredNode);
          const result = node ? getResult(node.id) : undefined;
          if (!node) return null;

          // Compute horizontal clamp so tooltip won't go off-screen right or left
          const screenW = typeof window !== "undefined" ? window.innerWidth : 1000;
          const leftClamped = Math.max(170, Math.min(tooltipPos.x, screenW - 170));

          return (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="fixed z-100 pointer-events-none"
              style={{
                left: leftClamped,
                top: tooltipPos.y + 12, // 12px spacing below bottom edge of node
                transform: "translateX(-50%)",
              }}
            >
              <div className="bg-popover text-popover-foreground border rounded-lg shadow-xl p-3 min-w-[260px] max-w-[340px]">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(result?.status)}
                  <span className="text-sm font-semibold">{node.label}</span>
                  {result?.status && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ml-auto ${
                      result.status === "PASSED" ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                      : result.status === "FAILED" ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                      : result.status === "RUNNING" ? "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800"
                      : "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                    }`}>
                      {result.status}
                    </span>
                  )}
                </div>

                {/* Executed command */}
                {(() => {
                  const displayCmd = result?.command || node.command;
                  return displayCmd ? (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Command</p>
                      <code className="text-xs font-mono bg-muted px-2 py-1.5 rounded block whitespace-pre-wrap break-all">$ {displayCmd}</code>
                    </div>
                  ) : null;
                })()}

                {/* Logs output */}
                {result?.logs && result.logs.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Output</p>
                    <div className="bg-gray-950 dark:bg-gray-950 rounded p-2 max-h-[160px] overflow-y-auto">
                      {result.logs.map((line, i) => (
                        <p key={i} className={`text-[11px] font-mono leading-relaxed ${
                          line.includes("[ERROR]") ? "text-red-400"
                          : line.includes("[SUCCESS]") ? "text-green-400"
                          : line.includes("[INFO]") ? "text-gray-300"
                          : line.startsWith(">") ? "text-cyan-400"
                          : "text-gray-500"
                        }`}>
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {!result && (
                  <p className="text-xs text-muted-foreground italic">Run the pipeline to see execution logs.</p>
                )}

                {result?.startedAt && (
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span>Started: {new Date(result.startedAt).toLocaleTimeString()}</span>
                    {result.finishedAt && (
                      <span>Ended: {new Date(result.finishedAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
