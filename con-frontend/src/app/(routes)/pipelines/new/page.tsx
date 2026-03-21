"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createPipeline,
  STAGE_TYPES,
  type BuildStep,
  type DefinitionType,
} from "@/lib/pipelines";
import { listCredentials, type CredentialSummary } from "@/lib/credentials";
import {
  GitMerge,
  ArrowLeft,
  Plus,
  Trash2,
  AlertTriangle,
  FileCode2,
  Code2,
  Terminal,
  GripVertical,
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

const DEFINITION_OPTIONS: { value: DefinitionType; label: string; desc: string; icon: typeof FileCode2 }[] = [
  { value: "CONDUIT_FILE", label: "ConduitFile", desc: "Read pipeline from a ConduitFile in your repo (like Jenkinsfile)", icon: FileCode2 },
  { value: "SCRIPT", label: "Script", desc: "Write pipeline script directly in the editor", icon: Code2 },
  { value: "FREESTYLE", label: "Freestyle", desc: "Add individual shell commands as build steps", icon: Terminal },
];

export default function NewPipelinePage() {
  const router = useRouter();

  // Basic
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [definitionType, setDefinitionType] = useState<DefinitionType>("CONDUIT_FILE");

  // Source
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("main");

  // ConduitFile mode
  const [conduitFilePath, setConduitFilePath] = useState("ConduitFile");

  // Script mode
  const [script, setScript] = useState(`pipeline {\n  agent any\n  stages {\n    stage('Build') {\n      steps {\n        sh 'echo "Building..."'\n      }\n    }\n    stage('Test') {\n      steps {\n        sh 'echo "Testing..."'\n      }\n    }\n  }\n}`);

  // Freestyle mode
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([
    { name: "Build", command: "" },
  ]);

  // Trigger
  const [trigger, setTrigger] = useState<"MANUAL" | "WEBHOOK" | "CRON">("MANUAL");
  const [cronExpression, setCronExpression] = useState("");

  // Credentials
  const [credentials, setCredentials] = useState<CredentialSummary[]>([]);
  const [selectedCredentialIds, setSelectedCredentialIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCredentials = useCallback(async () => {
    try {
      const data = await listCredentials();
      setCredentials(data);
    } catch {
      // Credentials are optional — ignore errors
    }
  }, []);

  useEffect(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  const addBuildStep = () => {
    setBuildSteps([...buildSteps, { name: "", command: "" }]);
  };

  const removeBuildStep = (index: number) => {
    setBuildSteps(buildSteps.filter((_, i) => i !== index));
  };

  const updateBuildStep = (index: number, field: keyof BuildStep, value: string) => {
    setBuildSteps(buildSteps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const toggleCredential = (id: string) => {
    setSelectedCredentialIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Pipeline name is required");
      return;
    }

    setIsLoading(true);
    try {
      await createPipeline({
        name: name.trim(),
        description: description.trim(),
        repoUrl: repoUrl.trim(),
        branch: branch.trim() || "main",
        definitionType,
        conduitFilePath: definitionType === "CONDUIT_FILE" ? conduitFilePath.trim() || "ConduitFile" : undefined,
        script: definitionType === "SCRIPT" ? script : undefined,
        buildSteps: definitionType === "FREESTYLE" ? buildSteps.filter((s) => s.command.trim()) : undefined,
        trigger,
        cronExpression: trigger === "CRON" ? cronExpression.trim() : undefined,
        credentialIds: selectedCredentialIds.length > 0 ? selectedCredentialIds : undefined,
      });
      router.push("/pipelines");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/pipelines")}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GitMerge className="h-6 w-6" />
            New Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure a CI/CD pipeline for your project.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm font-medium text-destructive px-4 py-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basic Information</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. api-service" className="h-10" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="h-10" />
            </div>
          </div>
        </div>

        {/* Definition Type */}
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Pipeline Definition</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {DEFINITION_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const selected = definitionType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDefinitionType(opt.value)}
                  className={`flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left ${
                    selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-2 ${selected ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {opt.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Source Repository */}
        <div className="border rounded-xl p-6 bg-card space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Source Repository</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <label className="text-sm font-medium text-foreground">Repository URL</label>
              <Input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo" className="h-10" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Branch</label>
              <Input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" className="h-10" />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Trigger</label>
              <Select value={trigger} onValueChange={(v) => setTrigger(v as typeof trigger)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="WEBHOOK">Webhook</SelectItem>
                  <SelectItem value="CRON">Cron</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {trigger === "CRON" && (
              <div className="grid gap-2 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Cron Expression</label>
                <Input value={cronExpression} onChange={(e) => setCronExpression(e.target.value)} placeholder="0 0 * * *" className="h-10 font-mono text-sm" />
              </div>
            )}
          </div>
        </div>

        {/* Definition-specific section */}
        {definitionType === "CONDUIT_FILE" && (
          <div className="border rounded-xl p-6 bg-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <FileCode2 className="h-4 w-4" /> ConduitFile Configuration
            </h3>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Script Path</label>
              <Input
                value={conduitFilePath}
                onChange={(e) => setConduitFilePath(e.target.value)}
                placeholder="ConduitFile"
                className="h-10 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Path to the pipeline script in your repository, relative to the root. Default: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">ConduitFile</code>
              </p>
            </div>
          </div>
        )}

        {definitionType === "SCRIPT" && (
          <div className="border rounded-xl p-6 bg-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Code2 className="h-4 w-4" /> Pipeline Script
            </h3>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Groovy Script</label>
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                rows={16}
                className="w-full rounded-lg border bg-muted/30 px-4 py-3 text-sm font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="pipeline { ... }"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                Write your pipeline script using Groovy DSL syntax.
              </p>
            </div>
          </div>
        )}

        {definitionType === "FREESTYLE" && (
          <div className="border rounded-xl p-6 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4" /> Build Steps
              </h3>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addBuildStep}>
                <Plus className="h-3.5 w-3.5" /> Add Step
              </Button>
            </div>

            {buildSteps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No build steps. Add shell commands to run.
              </div>
            ) : (
              <div className="space-y-3">
                {buildSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/20">
                    <GripVertical className="h-5 w-5 text-muted-foreground/40 mt-2.5 shrink-0" />
                    <div className="flex-1 grid gap-3 sm:grid-cols-3">
                      <div className="grid gap-1.5">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Step Name</label>
                        <Input
                          value={step.name}
                          onChange={(e) => updateBuildStep(index, "name", e.target.value)}
                          placeholder="e.g. Install"
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="grid gap-1.5 sm:col-span-2">
                        <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Shell Command</label>
                        <Input
                          value={step.command}
                          onChange={(e) => updateBuildStep(index, "command", e.target.value)}
                          placeholder="npm install"
                          className="h-9 text-sm font-mono"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBuildStep(index)}
                      className="p-1.5 mt-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Credentials */}
        {credentials.length > 0 && (
          <div className="border rounded-xl p-6 bg-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Credentials</h3>
            <p className="text-xs text-muted-foreground">Select credentials this pipeline can access at runtime.</p>
            <div className="grid gap-2">
              {credentials.map((cred) => (
                <label
                  key={cred.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCredentialIds.includes(cred.id)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCredentialIds.includes(cred.id)}
                    onChange={() => toggleCredential(cred.id)}
                    className="rounded border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cred.name}</p>
                    {cred.description && <p className="text-xs text-muted-foreground truncate">{cred.description}</p>}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded border bg-muted/50 shrink-0">
                    {cred.type.replace("_", " ")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading} className="gap-2">
            <GitMerge className="h-4 w-4" />
            {isLoading ? "Creating..." : "Create Pipeline"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/pipelines")}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
