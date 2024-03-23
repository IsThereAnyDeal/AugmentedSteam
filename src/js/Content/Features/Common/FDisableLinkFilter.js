import {SyncedStorage} from "../../../modulesCore";
import {Feature} from "../../modulesContent";

export default class FDisableLinkFilter extends Feature {

    checkPrerequisites() {
        return SyncedStorage.get("disablelinkfilter");
    }

    apply() {

        document.addEventListener("click", e => {
            if (e.target?.tagName !== "A") { return; }

            const href = e.target.href;
            if (!/\/linkfilter\//.test(href)) { return; }

            const params = new URL(href).searchParams;
            // TODO "url" param was used prior to 11/2023, remove after some time
            const url = params.get("u") ?? params.get("url");
            if (!url) { return; }

            // Skip censored links (has '♥')
            if (url.includes("%E2%99%A5")) { return; }

            e.preventDefault();

            // TODO check whether it's safe to just directly edit e.target.href
            window.location.href = url;
        });
    }
}
