import {Feature} from "modules";

import {SyncedStorage} from "core";

export default class FRemoveGuidesLangFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("removeguideslanguagefilter");
    }

    apply() {

        for (let node of document.querySelectorAll("#rightContents .browseOption")) {
            let onclick = node.getAttribute("onclick");

            let linkNode = node.querySelector("a");
            linkNode.href = linkNode.href.replace(/requiredtags[^&]+/, "requiredtags[]=-1");

            if (onclick) {
                let url = linkNode.href;
                node.removeAttribute("onclick");
                node.addEventListener("click", function() {
                    window.location.href = url;
                });
            }
        }

        for (let node of document.querySelectorAll(".guides_home_view_all_link > a, .guide_home_category_selection")) {
            node.href = node.href.replace(/&requiredtags[^&]+$/, "");
        }
    }
}
