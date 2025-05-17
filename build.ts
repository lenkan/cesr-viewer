import esbulid from "esbuild";

const ctx = await esbulid.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  outdir: "dist",
});

console.log("Building...", process.argv);
if (process.argv.includes("--watch")) {
  await ctx.watch();
}
