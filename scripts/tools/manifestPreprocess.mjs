import fs from "node:fs/promises";

export default function() {

    let map = new Map();

    function expandPath(path) {

        // match (..)
        let m = path.match(/\((.+?)\)/)
        if (m) {
            let options = m[1].split("|");
            return options
                .map(o => path.replace(m[0], o))
                .map(expandPath)
                .flat();
        }

        // match [..]
        m = path.match(/\[(.+?)\]/);
        if (m) {
            return [
                path.replace(m[0], ""),
                path.replace(m[0], m[1])
            ].map(expandPath)
             .flat();
        }

        return [path];
    }

    function processPath(path) {
        path = path.replaceAll("\\/", "/");

        let result = expandPath(path);

        for (let parsed of result) {
            if (/[*/]$/.test(parsed) || parsed.includes("?")) {
                continue;
            }

            result.push(`${parsed}?*`);

            if (!result.includes(`${parsed}/*`)) {
                result.push(
                    `${parsed}/`,
                    `${parsed}/?*`,
                );
            }
        }

        return result.sort();
    }

    return {
        map,
        plugin: {
            name: "manifest",
            setup(build) {
                build.onLoad({ filter: /[\\/]P.+?\.(js|ts)$/ }, async (args) => {
                    let contents = await fs.readFile(args.path, "utf8")
                    const doc = contents.match(/\/\*\*.+?@contentScript.+?\*\//s);

                    if (doc && doc[0]) {
                        const matches = doc[0].matchAll(/@match\s+(.+)\s*/g);
                        const excludes = doc[0].matchAll(/@exclude\s+(.+)\s*/g);

                        map.set(args.path, {
                            matches: [...(new Set([...matches].map(m => processPath(m[1])).flat()))],
                            excludes: [...(new Set([...excludes].map(m => processPath(m[1])).flat()))]
                        });
                    }
                })
            },
        }
    }
};
