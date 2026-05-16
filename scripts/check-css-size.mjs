import fs from "fs";
import path from "path";

const QUIZ_DIR = "css/quiz";
/** Per-file cap (lt-keyboard base ~355 lines; modes ~388). */
const MAX_FILE = 500;
/** Sum of split files; monolith was ~1715 lines — catch re-merging into one file. */
const MAX_TOTAL = 1800;

const files = fs.readdirSync(QUIZ_DIR).filter((name) => name.endsWith(".css") && name !== "index.css");

let total = 0;
const failures = [];

for (const name of files) {
    const filePath = path.join(QUIZ_DIR, name);
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).length;
    total += lines;
    if (lines > MAX_FILE) {
        failures.push(`${filePath}: ${lines} lines (max ${MAX_FILE})`);
    }
}

if (total > MAX_TOTAL) {
    failures.push(`${QUIZ_DIR}: ${total} lines total (max ${MAX_TOTAL})`);
}

if (failures.length) {
    console.error("CSS size check failed:\n" + failures.map((f) => `  - ${f}`).join("\n"));
    process.exit(1);
}

console.log(`CSS size OK (${files.length} quiz files, ${total} lines total).`);
