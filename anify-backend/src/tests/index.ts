import { spawn } from "node:child_process";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import colors from "colors";

const testDir = __dirname;

// Helper function to recursively find all test files
const findTestFiles = (dir: string, fileList: string[] = []): string[] => {
    const files = readdirSync(dir);

    for (const file of files) {
        const fullPath = join(dir, file);
        if (statSync(fullPath).isDirectory()) {
            findTestFiles(fullPath, fileList);
        } else if (file.endsWith(".test.ts") || file.endsWith(".test.js")) {
            fileList.push(fullPath);
        }
    }
    return fileList;
};

// Extract the file name from the command-line arguments
const args = process.argv.slice(2);
const fileName = args[0];

if (!fileName) {
    console.error("Please provide a test file name. Usage: bun test <file_name>");
    process.exit(1);
}

// Find all test files
const testFiles = findTestFiles(testDir);

// Locate the matching test file
const testFile = testFiles.find((file) => file.includes(fileName));

if (!testFile) {
    console.error(`No test file found matching "${fileName}".`);
    process.exit(1);
}

// Run the selected test file using Bun
const bunTest = spawn("bun", ["test", testFile], { stdio: "inherit" });

bunTest.on("close", (code) => {
    if (code === 0) {
        console.log(colors.green(`Test file "${testFile}" executed successfully.`));
    } else {
        console.error(colors.red(`Test file "${testFile}" failed with exit code ${code}.`));
    }
});
