"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createPipeline,
  type CreatePipelineRequest,
  type DefinitionType,
  DEFINITION_LABELS,
  TRIGGER_LABELS,
} from "@/lib/pipelines";
import {
  Activity,
  ArrowLeft,
  Check,
  AlertTriangle,
  Github,
  GitBranch,
  FileCode2,
  TerminalSquare,
  Network,
  Save,
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

export default function NewPipelinePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreatePipelineRequest>({
    name: "",
    description: "",
    repoUrl: "",
    branch: "main",
    definitionType: "CONDUIT_FILE",
    trigger: "MANUAL",
    conduitFilePath: "ConduitFile",
  });

  const handleChange = (field: keyof CreatePipelineRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError("Pipeline name is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const created = await createPipeline(formData);
      router.push(`/pipelines/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create pipeline");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pipelines">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-muted-foreground" />
            Create Pipeline
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Set up a new CI/CD pipeline definition
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm font-medium text-destructive px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8 bg-card border rounded-xl p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">General Info</h3>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Pipeline Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. backend-api-deploy"
              className="h-10 max-w-md"
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="What does this pipeline do?"
              className="min-h-[80px]"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Source Repository</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Github className="h-3.5 w-3.5" /> Repository URL
              </label>
              <Input
                value={formData.repoUrl || ""}
                onChange={(e) => handleChange("repoUrl", e.target.value)}
                placeholder="https://github.com/org/repo"
                className="h-10"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" /> Branch
              </label>
              <Input
                value={formData.branch || ""}
                onChange={(e) => handleChange("branch", e.target.value)}
                placeholder="main"
                className="h-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b pb-2">Definition & Trigger</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Definition Type *</label>
              <Select
                value={formData.definitionType}
                onValueChange={(val: DefinitionType) => handleChange("definitionType", val)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONDUIT_FILE">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="h-4 w-4 text-blue-500" />
                      <div>
                        <span className="font-medium block">{DEFINITION_LABELS["CONDUIT_FILE"]}</span>
                        <span className="text-xs text-muted-foreground">Load from repo file</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="SCRIPT">
                    <div className="flex items-center gap-2">
                      <TerminalSquare className="h-4 w-4 text-purple-500" />
                      <div>
                        <span className="font-medium block">{DEFINITION_LABELS["SCRIPT"]}</span>
                        <span className="text-xs text-muted-foreground">Write inline script</span>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="FREESTYLE">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-orange-500" />
                      <div>
                        <span className="font-medium block">{DEFINITION_LABELS["FREESTYLE"]}</span>
                        <span className="text-xs text-muted-foreground">Visual builder / steps</span>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Trigger Mode *</label>
              <Select
                value={formData.trigger}
                onValueChange={(val: "MANUAL" | "WEBHOOK" | "CRON") => handleChange("trigger", val)}
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
          </div>

          {formData.definitionType === "CONDUIT_FILE" && (
            <div className="grid gap-2 mt-4 max-w-md bg-muted/30 p-4 rounded-lg border border-border/50">
              <label className="text-sm font-medium text-foreground">ConduitFile Path</label>
              <p className="text-xs text-muted-foreground mb-1">Path to the pipeline definition file in your repository</p>
              <Input
                value={formData.conduitFilePath || "ConduitFile"}
                onChange={(e) => handleChange("conduitFilePath", e.target.value)}
                placeholder="ConduitFile"
                className="h-9 bg-background"
              />
            </div>
          )}

          {formData.trigger === "CRON" && (
            <div className="grid gap-2 mt-4 max-w-md bg-muted/30 p-4 rounded-lg border border-border/50">
              <label className="text-sm font-medium text-foreground">Cron Expression *</label>
              <p className="text-xs text-muted-foreground mb-1">Standard cron syntax (e.g. "0 * * * *" for every hour)</p>
              <Input
                value={formData.cronExpression || ""}
                onChange={(e) => handleChange("cronExpression", e.target.value)}
                placeholder="0 * * * *"
                className="h-9 bg-background font-mono"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Link href="/pipelines">
            <Button type="button" variant="ghost" className="mr-3">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              "Creating..."
            ) : (
              <>
                <Save className="h-4 w-4" /> Save Pipeline
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
