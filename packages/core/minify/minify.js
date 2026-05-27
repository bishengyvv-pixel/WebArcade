import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

import { rollup } from "rollup";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

import { minify } from "@node-minify/core";
import { cleanCss } from "@node-minify/clean-css";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "../");

async function doMinify() {
    try {
        const bundle = await rollup({
            input: path.join(rootPath, "data/src/emulator.ts"),
            context: "window",
            plugins: [
                typescript({
                    tsconfig: path.join(rootPath, "tsconfig.json"),
                    compilerOptions: {
                        rootDir: path.join(rootPath, "data/src"),
                        outDir: path.join(rootPath, "data"),
                    }
                }),
                terser()
            ]
        });

        await bundle.write({
            file: path.join(rootPath, "data/emulator.min.js"),
            format: "es",
            sourcemap: true
        });
        console.log("Bundled and Minified JS");

        // Concatenate split CSS modules in order, then minify
        const cssModules = [
            "data/src/css/base.css",
            "data/src/css/menu.css",
            "data/src/css/gamepad.css",
            "data/src/css/popup.css",
            "data/src/css/ads.css",
        ];
        const cssConcatPath = path.join(rootPath, "data/.css-concat.tmp");
        let combinedCss = "";
        for (const mod of cssModules) {
            combinedCss += await fs.readFile(path.join(rootPath, mod), "utf8");
            combinedCss += "\n";
        }
        await fs.writeFile(cssConcatPath, combinedCss);

        await minify({
            compressor: cleanCss,
            input: cssConcatPath,
            output: path.join(rootPath, "data/emulator.min.css"),
        });
        await fs.unlink(cssConcatPath);
        console.log("Minified CSS");
    } catch(e) {
        console.error(e);
    }
}

console.log("Minifying");
(async () => {
    await doMinify();
    console.log("Minifying Done!");
})();
