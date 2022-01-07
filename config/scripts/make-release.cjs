const YAML = require("yaml");
const fs = require("fs");
const {execSync} = require("child_process");
const archiver = require("archiver");

const root = `${__dirname}/../..`;
const changelogPath = `${root}/changelog.yml`;
const releasesPath = `${root}/releases/`;

const changelog = fs.readFileSync(changelogPath, {
    "encoding": "utf8",
    "flag": "r"
});

const json = YAML.parse(changelog);
const latestVersion = Object.keys(json)[0];

const releaseDir = `${releasesPath}${latestVersion}`;
const sourceDir = `${releaseDir}/source`;

if (fs.existsSync(releaseDir)) {
    console.error(`${latestVersion} dir already exists`);
    process.exit(1);
}

function copySource() {
    const toCopy = [
        "badges",
        "config",
        "src",
        ".eslintrc.json",
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

async function zipSource() {
    const output = fs.createWriteStream(`${releaseDir}/source.zip`);
    const archive = archiver("zip");

    archive.on("error", (err) => {
        throw err;
    });
    archive.pipe(output);
    archive.directory(sourceDir, false);
    await archive.finalize();
}

function cleanup() {
    fs.rmSync(sourceDir, {
        "recursive": true
    });
}

(async function() {
    console.log(`Creating release ${latestVersion}`);
    console.log("1. copy source");
    copySource();

    console.log("2. zip source");
    await zipSource();

    console.log("3. npm install");
    run("npm install");

    console.log("4. build...");
    for (const platform of ["firefox", "chrome", "edge"]) {
        console.log(`...${platform}`);
        run(`npm run build ${platform} -- --production`);
        fs.cpSync(`${sourceDir}/dist/${platform}.zip`, `${releaseDir}/${platform}.zip`);
    }

    console.log("5. cleanup");
    cleanup();
})();
