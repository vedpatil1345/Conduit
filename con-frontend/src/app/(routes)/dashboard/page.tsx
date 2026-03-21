export default function Home() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">Total runs today</div>
          <div className="text-2xl font-medium text-foreground">47</div>
          <div className="text-xs mt-1 text-green-600 dark:text-green-500">+12 from yesterday</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">Success rate</div>
          <div className="text-2xl font-medium text-foreground">91%</div>
          <div className="text-xs mt-1 text-green-600 dark:text-green-500">+3% this week</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">Avg duration</div>
          <div className="text-2xl font-medium text-foreground">4m 12s</div>
          <div className="text-xs mt-1 text-red-600 dark:text-red-500">+28s slower</div>
        </div>
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <div className="text-xs text-muted-foreground mb-1">Active now</div>
          <div className="text-2xl font-medium text-foreground">3</div>
          <div className="text-xs mt-1 text-amber-600 dark:text-amber-500">2 pipelines queued</div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 md:p-5 shadow-sm">
        <div className="font-medium text-foreground mb-4 flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-sm gap-1">
          Live run — api-service / main
          <span className="text-xs font-normal text-muted-foreground">triggered 2 min ago by webhook</span>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap border bg-green-100/50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">checkout</div>
            <div className="text-[10px] text-muted-foreground">0m 12s</div>
          </div>
          <div className="text-base text-muted-foreground px-2 pb-3">→</div>
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap border bg-green-100/50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">install deps</div>
            <div className="text-[10px] text-muted-foreground">1m 04s</div>
          </div>
          <div className="text-base text-muted-foreground px-2 pb-3">→</div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap border bg-green-100/50 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">lint</div>
              <div className="text-[10px] text-muted-foreground">0m 22s</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">unit tests</div>
              <div className="text-[10px] text-muted-foreground">running…</div>
            </div>
          </div>
          <div className="text-base text-muted-foreground px-2 pb-3">→</div>
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap border bg-muted text-muted-foreground">build</div>
            <div className="text-[10px] text-muted-foreground">pending</div>
          </div>
          <div className="text-base text-muted-foreground px-2 pb-3">→</div>
          <div className="flex flex-col items-center gap-1">
            <div className="px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap border bg-muted text-muted-foreground">deploy staging</div>
            <div className="text-[10px] text-muted-foreground">pending</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border rounded-lg p-4 md:p-5 shadow-sm overflow-hidden">
          <div className="font-medium text-foreground mb-4 flex justify-between items-center text-sm">
            Recent pipeline runs
            <span className="text-xs font-normal text-muted-foreground cursor-pointer hover:text-foreground">view all →</span>
          </div>
          <div className="space-y-0 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <div className="min-w-[450px]">
              {/* Run Item */}
              <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500 shrink-0"></div>
                <div className="flex-1 font-medium text-foreground truncate">api-service</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">main</div>
                <div className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-green-100/50 text-green-800 dark:bg-green-950/30 dark:text-green-400">passed</div>
                <div className="text-xs text-muted-foreground w-16 text-right shrink-0">3m 51s</div>
              </div>
              {/* Run Item */}
              <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                <div className="flex-1 font-medium text-foreground truncate">api-service</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">main</div>
                <div className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">running</div>
                <div className="text-xs text-muted-foreground w-16 text-right shrink-0">2m 10s</div>
              </div>
              {/* Run Item */}
              <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-500 shrink-0"></div>
                <div className="flex-1 font-medium text-foreground truncate">frontend</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">feat/auth</div>
                <div className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400">failed</div>
                <div className="text-xs text-muted-foreground w-16 text-right shrink-0">1m 08s</div>
              </div>
              {/* Run Item */}
              <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-500 shrink-0"></div>
                <div className="flex-1 font-medium text-foreground truncate">worker-service</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">main</div>
                <div className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-green-100/50 text-green-800 dark:bg-green-950/30 dark:text-green-400">passed</div>
                <div className="text-xs text-muted-foreground w-16 text-right shrink-0">6m 22s</div>
              </div>
              {/* Run Item */}
              <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></div>
                <div className="flex-1 font-medium text-foreground truncate">infra</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">staging</div>
                <div className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">warning</div>
                <div className="text-xs text-muted-foreground w-16 text-right shrink-0">2m 44s</div>
              </div>
              {/* Run Item */}
              <div className="flex items-center gap-3 py-2.5 border-b last:border-0 text-sm">
                <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0"></div>
                <div className="flex-1 font-medium text-foreground truncate">docs-site</div>
                <div className="flex-1 text-xs text-muted-foreground truncate">main</div>
                <div className="text-[11px] px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">skipped</div>
                <div className="text-xs text-muted-foreground w-16 text-right shrink-0">—</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4 md:p-5 shadow-sm">
          <div className="font-medium text-foreground mb-4 text-sm">Activity feed</div>
          <div className="space-y-0">
            <div className="flex gap-3 py-2 border-b last:border-0 text-xs">
              <div className="w-6 h-6 rounded-full bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-400 flex items-center justify-center shrink-0 font-medium text-[10px]">✕</div>
              <div className="flex-1 text-muted-foreground leading-relaxed"><strong className="text-foreground font-medium">frontend</strong> failed on feat/auth — lint error in Button.tsx</div>
              <div className="text-muted-foreground shrink-0">2m ago</div>
            </div>
            <div className="flex gap-3 py-2 border-b last:border-0 text-xs">
              <div className="w-6 h-6 rounded-full bg-green-100/50 text-green-800 dark:bg-green-950/30 dark:text-green-400 flex items-center justify-center shrink-0 font-medium text-[10px]">✓</div>
              <div className="flex-1 text-muted-foreground leading-relaxed"><strong className="text-foreground font-medium">worker-service</strong> deployed to production successfully</div>
              <div className="text-muted-foreground shrink-0">18m ago</div>
            </div>
            <div className="flex gap-3 py-2 border-b last:border-0 text-xs">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center shrink-0 font-medium text-[10px]">↑</div>
              <div className="flex-1 text-muted-foreground leading-relaxed"><strong className="text-foreground font-medium">GitHub</strong> webhook received — push to api-service/main</div>
              <div className="text-muted-foreground shrink-0">22m ago</div>
            </div>
            <div className="flex gap-3 py-2 border-b last:border-0 text-xs">
              <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 flex items-center justify-center shrink-0 font-medium text-[10px]">!</div>
              <div className="flex-1 text-muted-foreground leading-relaxed"><strong className="text-foreground font-medium">infra</strong> finished with warnings — 2 deprecated Terraform providers</div>
              <div className="text-muted-foreground shrink-0">34m ago</div>
            </div>
            <div className="flex gap-3 py-2 border-b last:border-0 text-xs">
              <div className="w-6 h-6 rounded-full bg-green-100/50 text-green-800 dark:bg-green-950/30 dark:text-green-400 flex items-center justify-center shrink-0 font-medium text-[10px]">✓</div>
              <div className="flex-1 text-muted-foreground leading-relaxed"><strong className="text-foreground font-medium">api-service</strong> passed all checks — merged to main</div>
              <div className="text-muted-foreground shrink-0">1h ago</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 md:p-5 shadow-sm">
        <div className="font-medium text-foreground mb-2 text-sm">Pipeline success rate (last 7 days)</div>
        <div className="text-[11px] text-muted-foreground mb-4 uppercase tracking-wider font-semibold">By pipeline</div>
        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-20 text-muted-foreground truncate">api-service</div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-600 dark:bg-green-500 rounded-full" style={{ width: '96%' }}></div>
            </div>
            <div className="w-8 text-right text-muted-foreground">96%</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-muted-foreground truncate">worker-svc</div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-green-600 dark:bg-green-500 rounded-full" style={{ width: '88%' }}></div>
            </div>
            <div className="w-8 text-right text-muted-foreground">88%</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-muted-foreground truncate">frontend</div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '72%' }}></div>
            </div>
            <div className="w-8 text-right text-muted-foreground">72%</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-muted-foreground truncate">infra</div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: '61%' }}></div>
            </div>
            <div className="w-8 text-right text-muted-foreground">61%</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 text-muted-foreground truncate">docs-site</div>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-red-600 dark:bg-red-500 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="w-8 text-right text-muted-foreground">45%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
