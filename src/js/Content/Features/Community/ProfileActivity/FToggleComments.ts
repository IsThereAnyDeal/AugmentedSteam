import {L} from "@Core/Localization/Localization";
import {
    __featureHint_desc, __featureHint_reminder,
    __hideComments,
    __options_hideannouncementcomments,
    __showComments, __thewordno, __thewordyes,
} from "@Strings/_strings";
import type CProfileActivity from "@Content/Features/Community/ProfileActivity/CProfileActivity";
import Feature from "@Content/Modules/Context/Feature";
import HTML from "@Core/Html/Html";
import Settings, {SettingsStore} from "@Options/Data/Settings";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

export default class FToggleComments extends Feature<CProfileActivity> {

    private readonly _btnEl: HTMLElement;

    constructor(context: CProfileActivity) {
        super(context);
        this._btnEl = HTML.toElement<HTMLElement>('<span class="btn_grey_grey btn_small_thin as_comments_toggle"><span></span></span>')!;
    }

    override apply(): void {
        this.callback();
        this.context.onContent.subscribe(e => this.callback(e.data));
    }

    callback(parent: Document|HTMLElement = document) {

        const nodes = parent.querySelectorAll(".blotter_userstatus[id^=group_announcement]");
        const hide = Settings.hideannouncementcomments;

        for (const node of nodes) {

            const commentArea = node.querySelector<HTMLElement>(".commentthread_area");
            if (!commentArea) {
                continue;
            }

            let btnEl = node.querySelector<HTMLElement>(".as_comments_toggle");

            if (!btnEl) {
                btnEl = this._btnEl.cloneNode(true) as HTMLElement;
                btnEl.addEventListener("click", () => this._clickHandler(commentArea, btnEl!));
                node.querySelector(".blotter_viewallcomments_container")?.append(btnEl);
            }

            this._toggleComments(commentArea, btnEl, hide);
        }
    }

    async _clickHandler(commentArea: HTMLElement, btnEl: HTMLElement): Promise<void> {

        if (!Settings.hideannouncementcomments) {

            const _strTitle = "Augmented Steam";
            const _strDescription =
                `${L(__featureHint_desc)}<br><br>
                <span style="color: white;">${L(__options_hideannouncementcomments)}</span><br><br>
                ${L(__featureHint_reminder)}`;

            const result = await SteamFacade.showConfirmDialog(_strTitle, _strDescription, {
                okButton: L(__thewordyes),
                cancelButton: L(__thewordno)
            });

            const hide = result === "OK";
            await SettingsStore.set("hideannouncementcomments", hide);

            if (hide) {
                this.callback(); // Hide all currently visible comment areas
            }
        }

        this._toggleComments(commentArea, btnEl, !btnEl.classList.contains("as-comments-hidden"));
    }

    _toggleComments(commentArea: HTMLElement, btnEl: HTMLElement, hide: boolean): void {
        commentArea.style.display = hide ? "none" : "";
        btnEl.classList.toggle("as-comments-hidden", hide);
        btnEl.querySelector("span")!.textContent = L(hide ? __showComments : __hideComments);
    }
}
