import {HTML, SyncedStorage} from "../../../../modulesCore";
import {Feature} from "../../../Modules/Feature/Feature";

export default class FRemoveGuidesLangFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("removeguideslanguagefilter");
    }

    apply() {

        for (const node of document.querySelectorAll(".rightDetailsBlock .browseOption")) {
            const linkNode = node.querySelector("a");
            const newLink = new URL(linkNode.href);

            // Note the param is "requiredtags[0]" here for whatever reason
            if (newLink.searchParams.has("requiredtags[0]")) {
                newLink.searchParams.delete("requiredtags[0]");

                linkNode.href = newLink.href;

                HTML.replace(node, node.outerHTML); // Sanitize click listeners
            }
        }

        for (const node of document.querySelectorAll(".guides_home_view_all_link > a")) {
            const newLink = new URL(node.href);

            // First "View All" link might be for showing hidden categories
            if (newLink.searchParams.has("requiredtags[]")) {
                newLink.searchParams.delete("requiredtags[]");

                node.href = newLink.href;
            }
        }

        for (const node of document.querySelectorAll(".guide_home_category_selection")) {
            const newLink = new URL(node.href);

            // Set param to first value (category tag), which will delete the others (language tag)
            newLink.searchParams.set("requiredtags[]", newLink.searchParams.get("requiredtags[]"));

            node.href = newLink.href;
        }
    }
}
