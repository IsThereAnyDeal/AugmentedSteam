/**
 * @contentScript
 * @match *://*.steampowered.com/app/*
 */

import CApp from "@Content/Features/Store/App/CApp";
import StorePage from "@Content/Features/StorePage";

const page = new StorePage(CApp);
const selector = ".page_content_ctn > .page_content, #error_box";

if (document.querySelector(selector)) {
    page.run();
} else {
    const observer = new MutationObserver(() => {
        if (!document.querySelector(selector)) { return; }

        observer.disconnect();
        page.run();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
}
