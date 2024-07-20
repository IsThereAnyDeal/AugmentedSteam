import type CBase from "@Content/Features/Common/CBase";
import Feature from "@Content/Modules/Context/Feature";
import Settings from "@Options/Data/Settings";

export default class FDisableLinkFilter extends Feature<CBase> {

    override checkPrerequisites(): boolean {
        return Settings.disablelinkfilter;
    }

    override apply(): void {

        document.addEventListener("click", (e: MouseEvent) => {
            if (!e.target) { return; }

            const target = e.target as HTMLElement;
            if (target.tagName !== "A") { return; }

            const href = (<HTMLAnchorElement>target).href;
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
