const child_process = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

const teamId = process.argv[2];
const buildDir = path.resolve("dist");
const chromeDir = path.resolve(buildDir, "dev.chrome");
const safariDir = path.resolve(buildDir, "dev.safari");
const manifestFile = "config/manifests/base.json";

function getColor(num) {
	return "\x1b[" + num + "m";
}

const colors = {
	red    : getColor(31),
	yellow : getColor(33),
	blue   : getColor(34),
	green  : getColor(32),
	magenta: getColor(35),
	cyan   : getColor(36),
	reset  : getColor(0),
};

function print(color, msg) {
	console.log(`${colors[color]}${msg}${colors["reset"]}`);
}

function error(msg) {
	print("red", "Error: " + msg);
	process.exit(1);
}

function exec(cmd, path) {
	try {
		if (path) {
			return child_process.execSync(cmd, {cwd: path})
				.toString();
		} else {
			return child_process.execSync(cmd)
				.toString();
		}
	}
	catch (err) {
		fs.rmdirSync("dist", {recursive: true});
		error(err.msg);
	}
}

function run(label, cmd, path = null) {
	print("blue", label);
	const output = exec(cmd, path);
	print("green", "Success");
}

if (os.platform() !== "darwin") {
	error("Safari extension can only be built on Mac");
}

if (!teamId || teamId.match(/^[\n\r\s]*$/)) {
	error("TeamID is missing");
}

if (teamId.match(/myteamid/i)) {
	error("You must specify your TeamID");
}

const xcrun = child_process.execSync("command -v xcrun")
	.toString();

if (!xcrun || xcrun.match(/^[\n\r\s]*$/)) {
	error("XCode not found");
}

const manifest = JSON.parse(fs.readFileSync(manifestFile)
	.toString());
const appName = manifest.name;
const appDir = path.resolve(safariDir, appName);

run("Building Chrome extension", "node config/scripts/build.cjs chrome");
run("Converting Chrome extension to Safari extension",
	`xcrun safari-web-extension-converter --project-location "${safariDir}" --app-name "${appName}" --no-open --no-prompt --force "${chromeDir}"`);
run("Building Safari extension", `xcodebuild -target "${appName} (macOS)" DEVELOPMENT_TEAM=${teamId}`, appDir);
const app = path.resolve(appDir, "build", "Release", appName + ".app");

if (!fs.existsSync(app)) {
	error("Unknown error while building");
}

print("magenta", "App Location: " + path.resolve(appDir, "build", "Release", appName + ".app"));
print("green", "Build completed successfully!");
