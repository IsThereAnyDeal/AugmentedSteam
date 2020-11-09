import {ExtensionResources} from "../../Core/ExtensionResources";
import {HTML} from "../../Core/Html/Html";

class ChangelogBuilder {

    async build() {
        const data = await ExtensionResources.getJSON("changelog.json");

        let html = "";
        for (const [version, logHtml] of Object.entries(data)) {

            html += `
                <h2>${version}</h2>
                <div>${logHtml}</div>
            `;
        }

        HTML.inner(
            document.querySelector(".js-changelog"),
            html
        );
    }
}

export {ChangelogBuilder};
