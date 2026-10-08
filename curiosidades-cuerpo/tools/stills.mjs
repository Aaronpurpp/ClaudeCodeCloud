import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
const BROWSER = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const jobs = JSON.parse(process.argv[2]); // [[compId, frame, outName]]
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const [id, frame, name] of jobs) {
  const comp = await selectComposition({ serveUrl, id, browserExecutable: BROWSER });
  await renderStill({ composition: comp, serveUrl, frame, output: `/tmp/stills/${name}.png`, browserExecutable: BROWSER, chromiumOptions: { gl: "swangle" } });
  console.log("ok", name);
}
