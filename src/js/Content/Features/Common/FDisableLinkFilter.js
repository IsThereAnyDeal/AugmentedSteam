import {SyncedStorage} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FDisableLinkFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("disablelinkfilter");
    }

    apply() {
        document.addEventListener("click", function(e) {
            if (e.target.tagName && e.target.tagName === "A") {
                let href = e.target.href;
                if (/\/linkfilter\//.test(href)) {
                    let params = new URLSearchParams(href.search);
                    // TODO "url" param was used prior to 11/2023, remove after some time
                    let url = params.get("u") ?? params.get("url");
                    if (url) {
                        // TODO check whether it's safe to just directly edit e.target.href
                        window.location.href = url;
                        e.preventDefault();
                    }
                }
            }
        });
    }
}
