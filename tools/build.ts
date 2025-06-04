import esbulid from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outdir = process.env.OUTDIR ?? "dist";
await mkdir(outdir, { recursive: true });
const watch = process.argv.includes("--watch");

function renderManifest() {
  return {
    name: "My Extension",
    version: "1.0.0",
    description: "My Extension Description",
    manifest_version: 3,
    declarative_net_request: {
      rule_resources: [
        {
          id: "ruleset_1",
          enabled: true,
          path: "rules.json",
        },
      ],
    },
    background: {
      service_worker: "background.js",
    },
    permissions: ["scripting", "declarativeNetRequest", "activeTab", "webRequest"],
    web_accessible_resources: [],
    host_permissions: ["<all_urls>", "http://localhost:8000/*"],
  };
}

function renderRules() {
  return [
    {
      id: 1,
      priority: 2,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          {
            header: "Content-Type",
            operation: "set",
            value: "text/cesr",
          },
        ],
      },
      condition: {
        responseHeaders: [
          {
            header: "Content-Type",
            values: ["application/json+cesr"],
          },
        ],
        resourceTypes: ["main_frame"],
      },
    },
  ];
}

const ctx = await esbulid.context({
  entryPoints: ["src/main.ts", "src/background.ts"],
  bundle: true,
  platform: "browser",
  format: "esm",
  outdir,
  write: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
  },
  plugins: [
    {
      name: "manifest",
      setup(build) {
        build.onEnd(async (result) => {
          console.log("Build completed", result);
          const outfiles = result.outputFiles ?? [];
          await Promise.all([
            writeFile(join(outdir, "rules.json"), JSON.stringify(renderRules(), null, 2)),
            writeFile(join(outdir, "manifest.json"), JSON.stringify(renderManifest(), null, 2)),
            ...(outfiles.map(async (file) => {
              if (file.path.endsWith("background.js")) {
                const result = await esbulid.transform(file.contents, {
                  format: "iife",
                });

                return writeFile(file.path, result.code);
              } else {
                return writeFile(file.path, file.contents);
              }
            }) ?? []),
          ]);

          for (const file of result.outputFiles ?? []) {
            if (file.path.endsWith("main.js")) {
              const result = await esbulid.transform(file.contents, {
                format: "iife",
              });

              await writeFile(file.path, result.code);
            } else {
              await writeFile(file.path, file.contents);
            }
          }
        });
      },
    },
  ],
});

if (watch) {
  await ctx.serve({
    port: 8000,
    servedir: outdir,
  });

  await ctx.watch({});
} else {
  await ctx.rebuild();
  await ctx.dispose();
}

process.on("SIGTERM", async () => {
  await ctx.dispose();
});
