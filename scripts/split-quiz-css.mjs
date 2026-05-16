import fs from "fs";

const sourcePath = "css/quiz-training.css";
if (!fs.existsSync(sourcePath)) {
    console.error(`Missing ${sourcePath}. Restore with: git show HEAD:css/quiz-training.css > ${sourcePath}`);
    process.exit(1);
}

const lines = fs.readFileSync(sourcePath, "utf8").split(/\r?\n/);

function slice(ranges) {
    const out = [];
    for (const [start, end] of ranges) {
        for (let i = start - 1; i < end; i++) out.push(lines[i]);
    }
    return `${out.join("\n")}\n`;
}

const files = {
    "css/quiz/quiz-layout.css": [
        [1, 19],
        [1498, 1519],
    ],
    "css/quiz/vocab-card.css": [[45, 397]],
    "css/quiz/vocab-modes.css": [
        [398, 777],
        [762, 768],
    ],
    "css/quiz/vocab-hardcore.css": [[1628, 1709]],
    "css/quiz/quiz-forms.css": [
        [21, 43],
        [815, 959],
    ],
    "css/quiz/lt-keyboard.css": [[960, 1314]],
    "css/quiz/lt-keyboard-coarse.css": [[1316, 1440]],
    "css/quiz/quiz-cases.css": [[779, 813]],
    "css/quiz/quiz-verbs.css": [[1521, 1626]],
    "css/quiz/quiz-feedback.css": [
        [1442, 1496],
        [1711, 1714],
    ],
};

for (const [path, ranges] of Object.entries(files)) {
    fs.writeFileSync(path, slice(ranges));
}

fs.writeFileSync(
    "css/quiz/index.css",
    `/* Cascade order matches former quiz-training.css */
@import "./quiz-layout.css";
@import "./vocab-card.css";
@import "./vocab-modes.css";
@import "./quiz-cases.css";
@import "./quiz-forms.css";
@import "./lt-keyboard.css";
@import "./lt-keyboard-coarse.css";
@import "./quiz-verbs.css";
@import "./vocab-hardcore.css";
@import "./quiz-feedback.css";
`,
);

let covered = new Set();
for (const ranges of Object.values(files)) {
    for (const [s, e] of ranges) {
        for (let i = s; i <= e; i++) covered.add(i);
    }
}
const missing = [];
for (let i = 1; i <= lines.length; i++) {
    if (!covered.has(i) && lines[i - 1]?.trim()) missing.push(i);
}
if (missing.length) {
    console.error("Missing lines:", missing.join(", "));
    process.exit(1);
}
console.log("Split complete.");
