<script lang="ts">
    import {__close, __copied, __steamidOfUser, __viewSteamid} from "@Strings/_strings";
    import {L} from "@Core/Localization/Localization";
    import ExtensionResources from "@Core/ExtensionResources";
    import SteamFacade from "@Content/Modules/Facades/SteamFacade";
    import Clipboard from "@Content/Modules/Clipboard";

    export let ids: Array<string|null>;
    export let ownProfile: boolean = false;

    async function showDialog(): Promise<void> {

        async function copySteamId(e: MouseEvent) {
            const elem = (<HTMLElement>(e.target)).closest(".es-copy");
            if (!elem) { return; }

            const result = await Clipboard.set(elem.querySelector<HTMLElement>(".es-copy__id")!.textContent!);
            if (!result) { return; }

            elem.addEventListener("transitionend", () => {
                elem.classList.remove("is-copied");
            }, {"once": true});

            elem.classList.add("is-copied");
        }

        document.addEventListener("click", copySteamId);

        const imgUrl = ExtensionResources.getURL("img/clippy.svg");

        let html = "";
        for (const id of ids) {
            if (!id) { continue; }
            html += `<p>
                        <a class="es-copy">
                            <span class="es-copy__id">${id}</span>
                            <img src="${imgUrl}" class="es-copy__icon">
                            <span class="es-copy__copied">${L(__copied)}</span>
                        </a>
                    </p>`;
        }

        if (!ownProfile) {
            SteamFacade.hideMenu("profile_action_dropdown_link", "profile_action_dropdown");
        }

        await SteamFacade.showAlertDialog(
            L(__steamidOfUser).replace("__user__", document.querySelector(".actual_persona_name")!.textContent!.trim()),
            html,
            L(__close)
        );

        document.removeEventListener("click", copySteamId);
    }
</script>


<!--
 This feature largely relies on Steam styling, so certain a11y warnings have been disabled.
-->
{#if ownProfile}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-missing-attribute -->
    <a class="btn_profile_action btn_medium" on:click={showDialog} tabindex="0" role="button">
        <span>{L(__viewSteamid)}</span>
    </a>
{:else}
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-missing-attribute -->
    <a class="popup_menu_item" on:click={showDialog} tabindex="0" role="button">
        <img src="//community.cloudflare.steamstatic.com/public/images/skin_1/iconForums.png" alt="icon">&nbsp; {L(__viewSteamid)}
    </a>
{/if}


<style global>
    .es-copy {
        display: flex;
        align-items: baseline;
    }
    .es-copy:hover .es-copy__id {
        text-decoration: underline;
    }
    .es-copy:hover .es-copy__icon {
        opacity: 1;
    }
    .es-copy .es-copy__icon {
        filter: invert(55%);
        height: 1.2em;
        margin-left: 5px;
        opacity: 0;
    }
    .es-copy__copied {
        opacity: 0;
        transition: opacity .2s .6s;
        margin-left: 20px;
        color: #999;
        font-size: 0.95em;
    }
    .es-copy.is-copied .es-copy__copied {
        opacity: 1;
        transition: opacity .2s 0s;
    }
</style>
