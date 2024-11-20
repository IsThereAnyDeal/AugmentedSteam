import manifest from "./manifest.mjs";

export default class ManifestBuilder {

    constructor() {
        this._manifest = structuredClone(manifest);
    }

    version(version) {
        this._manifest.version = version;
    }

    contentScript(script) {
        let {matches, excludes, js, css, run_at, world} = script;

        if (!Array.isArray(matches) || matches.length === 0) {
            return;
        }

        if (!this._manifest.content_scripts) {
            this._manifest.content_scripts = [];
        }

        this._manifest.content_scripts.push({
            matches: script.matches,
            exclude_matches: excludes && Array.isArray(excludes) && excludes.length > 0
                ? excludes
                : undefined,
            js: js && Array.isArray(js) && js.length > 0
                ? js
                : undefined,
            css: css && Array.isArray(css) && css.length > 0
                ? css
                : undefined,
            run_at,
            world
        })
    }

    build(options) {
        let {dev, browser} = options;

        if (browser === "chrome") {
            this._manifest.key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgSsjOO0ecqqAz6LCjjIoiRUV3VyW4p7mmTg9bC9uUkj28OgVr5+NRJpyI8gJx7Nd43ZEQ8dfwOl8GLnc3+m90jPSUASlliWxG2LQt81IZhtFurCLUELGIfUSr5vPdthRbwgnPrmRc5nylstBORBwYtT0Dos9pBcikHn0QKo87ggWEAQEBGkLXQ8An01LnQopLX4VbZHTfvoTIjPZOiHUVhKhn4aKM70e/u61mGMSp9WDBYrV0/OFKsVC9jWd9s0DX/uOm3KpFhOj4Bx+ehzEklXNuTTQshIC7NSgh+tAJwSa1GpO9jcCWCnFRqjfxwOrdylqIvCy+87fpU7nJ6sHRQIDAQAB";
        }

        if (browser === "chrome" || browser === "edge") {
            this._manifest.permissions.push("offscreen");
            this._manifest.background.service_worker = "js/background.js";
        }

        if (browser === "firefox") {
            this._manifest.browser_specific_settings = {
                gecko: {
                    id: "{1be309c5-3e4f-4b99-927d-bb500eb4fa88}",
                    strict_min_version: "109.0"
                }
            };

            this._manifest.background.scripts = ["js/background.js"];
        }

        return this._manifest;
    }
}
