import esbulid from "esbuild";
import { cp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outdir = process.env.OUTDIR ?? "dist";
await mkdir(outdir, { recursive: true });
const watch = process.argv.includes("--watch");

function renderManifest() {
  const host_permissions = ["<all_urls>"];

  if (watch) {
    host_permissions.push("http://localhost:8000/*");
  }

  return {
    name: "CESR Viewer",
    version: "0.0.1",
    description: "CESR Viewer - View CESR streams in your browser",
    icons: {
      "32": "icon-32.png",
      "48": "icon-48.png",
      "128": "icon-128.png",
    },
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
      type: "module",
    },
    permissions: ["scripting", "declarativeNetRequest", "activeTab", "webRequest"],
    host_permissions,
  };
}

function renderRules() {
  return [
    {
      id: 1,
      priority: 1,
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
            cp("public", outdir, { recursive: true }),
            writeFile(join(outdir, "rules.json"), JSON.stringify(renderRules(), null, 2)),
            writeFile(join(outdir, "manifest.json"), JSON.stringify(renderManifest(), null, 2)),
            ...(outfiles.map(async (file) => {
              await writeFile(file.path, file.contents);
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
