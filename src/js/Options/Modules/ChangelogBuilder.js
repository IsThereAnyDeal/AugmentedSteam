import {ExtensionResources, HTML} from "../../modulesCore";

class ChangelogBuilder {

    async build() {
        const data = await ExtensionResources.getJSON("changelog.json");

        let html = "";
        for (const [version, logHtml] of Object.entries(data)) {

            html += `<div class="changelog__release">
                        <h2 class="changelog__version">${version}</h2>
                        <div class="changelog__log">${logHtml}</div>
                    </div>`;
        }

        HTML.inner(".js-changelog", html);
    }
}

export {ChangelogBuilder};
