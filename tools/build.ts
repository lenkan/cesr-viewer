import esbulid from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const outdir = process.env.OUTDIR ?? "dist";
const version = JSON.parse(await readFile("package.json", "utf8")).version;

await mkdir(outdir, { recursive: true });
const watch = process.argv.includes("--watch");

function renderManifest() {
  const host_permissions = ["<all_urls>"];

  if (watch) {
    host_permissions.push("http://localhost:8000/*");
  }

  return {
    name: "CESR Viewer",
    version: version,
    description: "CESR Viewer - View CESR streams in your browser",
    icons: {
      "32": "icon.png",
      "48": "icon.png",
      "128": "icon.png",
    },
    manifest_version: 3,
    action: {
      default_icon: {
        "32": "icon.png",
        "48": "icon.png",
        "128": "icon.png",
      },
      default_title: "CESR Viewer",
    },
    declarative_net_request: {
      rule_resources: [
        {
          id: "rewrite_cesr_content_type",
          enabled: true,
          path: "rules.json",
        },
      ],
    },
    background: {
      service_worker: "background.js",
      type: "module",
    },
    permissions: ["declarativeNetRequest", "scripting", "webRequest"],
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

async function write(name: string, content: string | Uint8Array) {
  const path = join(outdir, name);
  await writeFile(path, content);

  console.log(`Wrote file: ${name} (${Buffer.from(content).length} bytes)`);
}

const ctx = await esbulid.context({
  entryPoints: ["src/main.tsx", "src/background.ts"],
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
          const outfiles = result.outputFiles ?? [];
          for (const file of outfiles) {
          }

          await Promise.all([
            cp("public", outdir, { recursive: true }),
            write("rules.json", JSON.stringify(renderRules(), null, 2)),
            write("manifest.json", JSON.stringify(renderManifest(), null, 2)),
            ...outfiles.map((file) => write(basename(file.path), file.text)),
          ]);
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
