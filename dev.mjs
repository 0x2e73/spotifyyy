import { spawn } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, "music-playlists");

const COLORS = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

function prefix(label, color) {
  return `${color}[${label}]${COLORS.reset}`;
}

function log(label, color, data) {
  const lines = data.toString().trimEnd().split("\n");
  for (const line of lines) {
    console.log(`${prefix(label, color)} ${line}`);
  }
}

console.log(`${COLORS.green}Starting Spotifyy dev environment...${COLORS.reset}`);
console.log(`${COLORS.dim}──────────────────────────────────────${COLORS.reset}`);
console.log(`${COLORS.yellow}  Frontend ${COLORS.reset} http://localhost:3000`);
console.log(`${COLORS.cyan}  API      ${COLORS.reset} http://localhost:8000/api/`);
console.log(`${COLORS.dim}  MongoDB   mongodb://localhost:27017${COLORS.reset}`);
console.log(`${COLORS.dim}──────────────────────────────────────${COLORS.reset}`);
console.log();

// 1. Start Docker (MongoDB + Django API)
const docker = spawn("docker", ["compose", "up", "--build"], {
  cwd: __dirname,
  stdio: ["ignore", "pipe", "pipe"],
});

docker.stdout.on("data", (d) => log("BACK ", COLORS.cyan, d));
docker.stderr.on("data", (d) => log("BACK ", COLORS.cyan, d));

docker.on("error", (err) => {
  console.error(`${COLORS.red}Failed to start Docker: ${err.message}${COLORS.reset}`);
  process.exit(1);
});

// 2. Start Next.js frontend
const frontend = spawn("npm", ["run", "dev"], {
  cwd: frontendDir,
  stdio: ["ignore", "pipe", "pipe"],
});

frontend.stdout.on("data", (d) => log("FRONT", COLORS.yellow, d));
frontend.stderr.on("data", (d) => log("FRONT", COLORS.yellow, d));

frontend.on("error", (err) => {
  console.error(`${COLORS.red}Failed to start frontend: ${err.message}${COLORS.reset}`);
});

// Cleanup on exit
function cleanup() {
  console.log(`\n${COLORS.dim}Shutting down...${COLORS.reset}`);
  frontend.kill();
  const down = spawn("docker", ["compose", "down"], {
    cwd: __dirname,
    stdio: "inherit",
  });
  down.on("close", () => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

docker.on("close", (code) => {
  console.log(`${prefix("BACK ", COLORS.cyan)} exited (${code})`);
});

frontend.on("close", (code) => {
  console.log(`${prefix("FRONT", COLORS.yellow)} exited (${code})`);
});
