import {Feature} from "../../../Modules/Feature/Feature";
import {SyncedStorage} from "../../../../Core/Storage/SyncedStorage";

export default class FRemoveGuidesLangFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("removeguideslanguagefilter");
    }

    apply() {

        for (const node of document.querySelectorAll(".rightDetailsBlock .browseOption")) {
            node.removeAttribute("onclick"); // remove redundant onclick attribute

            const linkNode = node.querySelector("a");
            const newLink = new URL(linkNode.href);

            // note the param is "requiredtags[0]" here for whatever reason
            if (newLink.searchParams.has("requiredtags[0]")) {
                newLink.searchParams.set("requiredtags[0]", "-1");
            }

            linkNode.href = newLink.href;
        }

        for (const node of document.querySelectorAll(".guides_home_view_all_link > a, .guide_home_category_selection")) {
            const newLink = new URL(node.href);
            newLink.searchParams.set("requiredtags[]", "-1");
            node.href = newLink.href;
        }
    }
}
