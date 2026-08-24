import {
    __all,
    __groups_select,
    __inverse,
    __none,
    __pendingInvites_accept,
    __pendingInvites_action,
    __pendingInvites_cancel,
    __pendingInvites_cancelConfirm,
    __pendingInvites_ignore,
    __pendingInvites_manage,
    __pendingInvites_noneSelected,
    __pendingInvites_selected,
} from "@Strings/_strings";
import {L} from "@Core/Localization/Localization";
import Feature from "@Content/Modules/Context/Feature";
import type CFriendsAndGroups from "@Content/Features/Community/FriendsAndGroups/CFriendsAndGroups";
import HTML from "@Core/Html/Html";
import RequestData from "@Content/Modules/RequestData";
import SteamFacade from "@Content/Modules/Facades/SteamFacade";

const RECEIVED = "#search_results";
const SENT = "#search_results_sentinvites";

export default class FPendingInvitesManage extends Feature<CFriendsAndGroups> {

    private _enabled: boolean = false;

    override checkPrerequisites(): boolean {
        return this.context.myProfile;
    }

    override apply(): void {
        document.addEventListener("click", (e) => {
            if (!this._enabled || (e as MouseEvent).button !== 0) { return; }

            const overlay = (e.target as Element).closest(".selectable_overlay");
            const row = overlay?.closest<HTMLElement>(".invite_row");
            if (row) {
                e.preventDefault();
                this._toggleRow(row);
            }
        }, true);

        document.addEventListener("as_subpageNav", () => this.callback());
        this.callback();
    }

    callback(): void {
        if (!document.getElementById("friends_pending")) { return; }
        if (document.getElementById("es_pending_invites_control")) { return; }

        this._enabled = false;

        const titleBar = document.querySelector<HTMLElement>("#friends_pending .title_bar.pending_sent_invites");
        if (!titleBar) { return; }

        const button = HTML.toElement<HTMLButtonElement>(
            `<button id="es_pending_invites_control" class="profile_friends manage_link btnv6_blue_hoverfade btn_small btn_uppercase">
                <span>${L(__pendingInvites_manage)}</span>
            </button>`);
        if (button) {
            titleBar.appendChild(button);
            button.addEventListener("click", () => this._toggle());
        }

        HTML.afterEnd(titleBar,
            `<div id="es_pending_invites_panel" class="manage_friends_panel">
                <div class="row">${L(__pendingInvites_action)}
                    <span class="row">
                        <span class="dimmed">${L(__groups_select)}</span>
                        <span class="selection_type" id="es_pending_select_all">${L(__all)}</span>
                        <span class="selection_type" id="es_pending_select_none">${L(__none)}</span>
                        <span class="selection_type" id="es_pending_select_inverse">${L(__inverse)}</span>
                    </span>
                </div>
                <div class="row">
                    <div class="manage_friend_actions_ctn">
                        <span class="manage_action btnv6_lightblue_blue btn_small" id="es_pending_accept">
                            <span>${L(__pendingInvites_accept)}</span>
                        </span>
                        <span class="manage_action btnv6_lightblue_blue btn_small" id="es_pending_ignore">
                            <span>${L(__pendingInvites_ignore)}</span>
                        </span>
                        <span class="manage_action btnv6_lightblue_blue btn_small" id="es_pending_cancel">
                            <span>${L(__pendingInvites_cancel)}</span>
                        </span>
                    </div>
                    <span id="es_pending_selected_err" class="selected_msg error hidden"></span>
                    <span id="es_pending_selected_msg" class="selected_msg hidden">${L(__pendingInvites_selected, {n: '<span id="es_pending_selected_count"></span>'})}</span>
                </div>
            </div>`);

        document.getElementById("es_pending_select_all")!.addEventListener("click", () => this._selectAll());
        document.getElementById("es_pending_select_none")!.addEventListener("click", () => this._selectNone());
        document.getElementById("es_pending_select_inverse")!.addEventListener("click", () => this._selectInverse());
        document.getElementById("es_pending_accept")!.addEventListener("click", () => this._accept());
        document.getElementById("es_pending_ignore")!.addEventListener("click", () => this._ignore());
        document.getElementById("es_pending_cancel")!.addEventListener("click", () => this._cancel());
    }

    private _getRows(container: string): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>(`${container} > .invite_row`));
    }

    private _getAllRows(): HTMLElement[] {
        return [...this._getRows(RECEIVED), ...this._getRows(SENT)];
    }

    private _getSelectedRows(container: string): HTMLElement[] {
        return this._getRows(container)
            .filter(r => r.classList.contains("selected") && r.style.display !== "none");
    }

    private _toggleRow(row: HTMLElement): void {
        const checkbox = row.querySelector<HTMLInputElement>(".select_friend_checkbox");
        if (checkbox) { checkbox.checked = !checkbox.checked; }
        row.classList.toggle("selected");
        this._updateSelection();
    }

    private _toggle(): void {
        this._enabled = !this._enabled;

        document.getElementById("es_pending_invites_panel")
            ?.classList.toggle("manage", this._enabled);
        document.getElementById("es_pending_invites_control")
            ?.classList.toggle("btn_active", this._enabled);

        for (const row of this._getAllRows()) {
            row.classList.toggle("manage", this._enabled);
        }

        if (this._enabled) {
            this._updateSelection();
        }
    }

    private _selectAll(): void {
        for (const row of this._getAllRows()) {
            row.classList.add("selected");
            const checkbox = row.querySelector<HTMLInputElement>(".select_friend_checkbox");
            if (checkbox) { checkbox.checked = true; }
        }
        this._updateSelection();
    }

    private _selectNone(): void {
        for (const row of this._getAllRows()) {
            row.classList.remove("selected");
            const checkbox = row.querySelector<HTMLInputElement>(".select_friend_checkbox");
            if (checkbox) { checkbox.checked = false; }
        }
        this._updateSelection();
    }

    private _selectInverse(): void {
        for (const row of this._getAllRows()) {
            row.classList.toggle("selected");
            const checkbox = row.querySelector<HTMLInputElement>(".select_friend_checkbox");
            if (checkbox) { checkbox.checked = !checkbox.checked; }
        }
        this._updateSelection();
    }

    private _updateSelection(): void {
        const count = this._getSelectedRows(RECEIVED).length + this._getSelectedRows(SENT).length;

        const err = document.getElementById("es_pending_selected_err");
        const msg = document.getElementById("es_pending_selected_msg");
        if (!err || !msg) { return; }

        if (count > 0) {
            err.classList.add("hidden");
            msg.classList.remove("hidden");
            const counter = document.getElementById("es_pending_selected_count");
            if (counter) { counter.textContent = String(count); }
        } else {
            msg.classList.add("hidden");
            err.classList.add("hidden");
        }
    }

    private _showError(): void {
        const err = document.getElementById("es_pending_selected_err");
        const msg = document.getElementById("es_pending_selected_msg");
        if (!err || !msg) { return; }
        msg.classList.add("hidden");
        err.classList.remove("hidden");
        err.textContent = L(__pendingInvites_noneSelected);
    }

    private _removeRows(rows: HTMLElement[]): void {
        for (const row of rows) { row.remove(); }

        for (const [container, empty] of [[RECEIVED, "search_results_empty"], [SENT, "search_results_sentinvites_empty"]] as const) {
            const message = document.getElementById(empty);
            if (message) {
                message.style.display = this._getRows(container).length === 0 ? "" : "none";
            }
        }

        this._updateSelection();
    }

    private _endpoint(): URL {
        return new URL("friends/action", this.context.user.profileUrl);
    }

    private async _massAction(action: string, rows: HTMLElement[]): Promise<boolean> {
        const sessionId = this.context.user.sessionId;
        if (!sessionId) { throw new Error("Unknown session id"); }

        const steamids = rows
            .map(row => row.dataset.steamid)
            .filter((id): id is string => id !== undefined);

        const data: Record<string, string> = {
            "sessionid": sessionId,
            "steamid": this.context.user.steamId,
            "ajax": "1",
            "action": action,
        };
        steamids.forEach((id, i) => { data[`steamids[${i}]`] = id; });

        try {
            const response = await RequestData.post(this._endpoint(), data);
            const json = await response.json();
            return json.success === 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    private async _accept(): Promise<void> {
        const rows = this._getSelectedRows(RECEIVED);
        if (rows.length === 0) { this._showError(); return; }

        const sessionId = this.context.user.sessionId;
        if (!sessionId) { throw new Error("Unknown session id"); }

        const handled: HTMLElement[] = [];
        for (const row of rows) {
            const steamid = row.dataset.steamid;
            if (!steamid) { continue; }

            try {
                const response = await RequestData.post(
                    "https://steamcommunity.com/actions/AddFriendAjax",
                    {"sessionID": sessionId, "steamid": steamid, "accept_invite": "1"}
                );
                if (response.ok) { handled.push(row); }
            } catch (e) {
                console.error(e);
            }
        }

        this._removeRows(handled);
    }

    private async _ignore(): Promise<void> {
        const rows = this._getSelectedRows(RECEIVED);
        if (rows.length === 0) { this._showError(); return; }

        if (await this._massAction("ignore_invite", rows)) {
            this._removeRows(rows);
        } else {
            this._showError();
        }
    }

    private async _cancel(): Promise<void> {
        const rows = this._getSelectedRows(SENT);
        if (rows.length === 0) { this._showError(); return; }

        const result = await SteamFacade.showConfirmDialog(
            L(__pendingInvites_cancel),
            L(__pendingInvites_cancelConfirm, {n: rows.length})
        );
        if (result !== "OK") { return; }

        if (await this._massAction("remove", rows)) {
            this._removeRows(rows);
        } else {
            this._showError();
        }
    }
}
