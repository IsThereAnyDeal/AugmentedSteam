import {Feature} from "../../../modulesContent";
import {Page} from "../../Page";

export default class FPatchBlotterFunc extends Feature {

    apply() {

        // Fix undefined function when clicking on the "show all x comments" button under "uploaded a screenshot" type activity
        Page.runInPageContext(() => {
            const f = window.SteamFacade;

            if (typeof f.global("Blotter_ShowLargeScreenshot") !== "function") {

                f.globalSet("Blotter_ShowLargeScreenshot", (galleryid, showComments) => {
                    const gallery = f.global("g_BlotterGalleries")[galleryid];
                    const ss = gallery.shots[gallery.m_screenshotActive];
                    f.showModalContent(`${ss.m_modalContentLink}&insideModal=1&showComments=${showComments}`, ss.m_modalContentLinkText, ss.m_modalContentLink, true);
                });
            }
        });
    }
}
