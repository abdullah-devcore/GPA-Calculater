const { spawn } = require("child_process");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

console.log("Building GPA Calculator for web...");

const expo = spawn(
  "pnpm",
  ["exec", "expo", "export", "--platform", "web"],
  {
    stdio: "inherit",
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  }
);

expo.on("close", (code) => {
  if (code !== 0) {
    console.error(`Build failed with exit code ${code}`);
    process.exit(code);
  }
  console.log("Web build complete! Output in dist/");
  process.exit(0);
});

expo.on("error", (err) => {
  console.error("Failed to start build:", err.message);
  process.exit(1);
});
