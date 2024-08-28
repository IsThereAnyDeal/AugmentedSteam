import archiver from "archiver";
import {Command} from "commander";
import {execSync} from "node:child_process";
import fs from "node:fs";
import fsAsync from "node:fs/promises";
import YAML from "yaml";

const __dirname = import.meta.dirname;

const root = `${__dirname}/../`;
const changelogPath = `${root}/changelog.yml`;
const releasesPath = `${root}/../AugmentedSteam_releases/`;

const options = (new Command())
    .option("--force", "Overwrite existing release", false)
    .parse()
    .opts();

const changelog = fs.readFileSync(changelogPath, {
    "encoding": "utf8",
    "flag": "r"
});

const json = YAML.parse(changelog);
const latestVersion = Object.keys(json)[0];

const releaseDir = `${releasesPath}${latestVersion}`;
const sourceDir = `${releaseDir}/source`;

if (fs.existsSync(releaseDir)) {
    if (options.rewrite) {
        await fsAsync.rm(releaseDir, {recursive: true});
    } else {
        console.error(`${latestVersion} dir already exists`);
        process.exit(1);
    }
}

function copySource() {
    const toCopy = [
        "badges",
        "scripts",
        "tsconfig.json",
        "src",
        ".gitignore",
        "changelog.yml",
        "LICENSE",
        "package.json",
        "package-lock.json",
        "README.md"
    ];

    for (const f of toCopy) {
        const src = `${root}/${f}`;
        const dest = `${sourceDir}/${f}`;

        fs.cpSync(src, dest, {
            "recursive": true
        });
    }
}

function run(command) {
    execSync(command, {
        "cwd": sourceDir
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(error);
            process.exit(2);
        }
        console.log(stdout);
        if (stderr) {
            console.error("Errors:", stderr);
        }
    });
}

async function zip(dirpath, outname) {
    const output = fs.createWriteStream(`${releaseDir}/${outname}.zip`);
    const archive = archiver("zip", {
        zlib: {
            level: 6
        }
    });

    archive.on("error", (err) => {
        throw err;
    });
    archive.pipe(output);
    archive.directory(dirpath, false);
    await archive.finalize();
}

async function cleanup() {
    await fsAsync.rm(sourceDir, {
        "recursive": true
    });
}


console.log(`Creating release ${latestVersion}`);
console.log("1. copy source");
copySource();

console.log("2. zip source");
await zip(sourceDir, "source");

console.log("3. npm install");
run("npm install");

console.log("4. build...");
for (const platform of ["firefox", "chrome", "edge"]) {
    console.log(`...${platform}`);
    run(`node scripts/build.mjs ${platform} --production`);
    await zip(`${sourceDir}/dist/prod.${platform}`, platform);
}

console.log("5. cleanup");
await cleanup();
