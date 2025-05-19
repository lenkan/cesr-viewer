import esbulid from "esbuild";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

function renderManifest() {
  return {
    name: "My Extension",
    version: "1.0.0",
    description: "My Extension Description",
    manifest_version: 3,
    content_scripts: [{ matches: ["<all_urls>"], js: ["main.js"], css: ["main.css"] }],
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
    permissions: ["declarativeNetRequest", "activeTab"],
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
            value: "text/plain",
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
  outdir: "dist",
  plugins: [
    {
      name: "manifest",
      setup(build) {
        build.onEnd(async () => {
          await writeFile(
            join(build.initialOptions.outdir ?? "dist", "rules.json"),
            JSON.stringify(renderRules(), null, 2)
          );

          await writeFile(
            join(build.initialOptions.outdir ?? "dist", "manifest.json"),
            JSON.stringify(renderManifest(), null, 2)
          );
        });
      },
    },
  ],
});

if (process.argv.includes("--watch")) {
  await ctx.serve({
    port: 8000,
    servedir: "dist",
  });

  await ctx.watch({});
}

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...!!");
  await ctx.dispose();
});
