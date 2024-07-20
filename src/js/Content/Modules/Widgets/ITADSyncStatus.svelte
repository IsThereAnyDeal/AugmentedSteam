<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";
    import ITADApiFacade from "@Content/Modules/Facades/ITADApiFacade";
    import {L} from "@Core/Localization/Localization";
    import {__itad_from, __itad_lastImport, __itad_syncNow, __itad_to, __never} from "@Strings/_strings";
    import Settings from "@Options/Data/Settings";
    import TimeUtils from "@Core/Utils/TimeUtils";

    const itadLogo = ExtensionResources.getURL("img/itad.png");

    let from: number|null = null;
    let to: number|null = null;

    let syncFailure: boolean = false;
    let syncSuccess: boolean = false;
    let syncLoading: boolean = false;

    async function updateLastImport(): Promise<void> {
        const last = await ITADApiFacade.getLastImport();
        from = last.from;
        to = last.to;
    }

    async function syncNow(): Promise<void> {
        syncFailure = false;
        syncSuccess = false;
        syncLoading = true;

        let timeout: number;

        try {
            await ITADApiFacade.sync(true);
            syncSuccess = true;
            await updateLastImport();

            timeout = 1000;
        } catch (e) {
            syncFailure = true;

            console.group("ITAD sync");
            console.error("Failed to sync with ITAD");
            console.error(e);
            console.groupEnd();

            timeout = 3000;
        }

        syncLoading = false;
        await TimeUtils.timer(timeout);
    }
</script>


<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="asi" on:mouseenter={updateLastImport}>
    <img class="asi__logo" src={itadLogo} alt="ITAD logo">
    <span class="asi__status">✓</span>

    <div class="asi__hover" class:is-loading={syncLoading}>
        <div class="asi__content">
            <h4>{L(__itad_lastImport)}</h4>

            <div class="asi__last">
                <div>{L(__itad_from)}</div>
                <div>{from ? new Date(from * 1000).toLocaleString() : L(__never)}</div>

                {#if Settings.itad_import_library || Settings.itad_import_wishlist}
                    <div>{L(__itad_to)}</div>
                    <div>{to ? new Date(to * 1000).toLocaleString() : L(__never)}</div>
                {/if}
            </div>

            <div class="asi__sync">
                <button class="asi__sync-now" on:click={syncNow}>{L(__itad_syncNow)}</button>
                {#if syncLoading}
                    <div class="asi__loader"></div>
                {/if}
                {#if syncFailure}
                    <span class="asi__failed">&#10060;</span>
                {/if}
                {#if syncSuccess}
                    <span class="asi__success">&#10003;</span>
                {/if}
            </div>
        </div>
        <div class="asi__arrow"></div>
    </div>
</div>



<style>
    .asi {
        display: inline-flex;
        align-items: center;
        margin-right: 1em;
    }
    .asi__logo {
        height: 20px;
    }
    .asi__status {
        color: rgb(81, 119, 29);
        margin-left: 0.4em;
    }

    .asi__hover {
        display: none;
        position: absolute;
        top: 0;
        z-index: 1200;
        margin-top: 24px;
    }
    .asi:hover .asi__hover, .asi__hover.is-loading {
        display: block;
    }
    .asi__content {
        padding: 6px 10px;
        background-color: #3b3938;
        border: 1px solid #797979;
        margin: 12px 12px 12px -12px;
        box-shadow: 0 0 12px #000000;
        white-space: nowrap;
    }
    .asi__arrow {
        background-image: url("https://community.cloudflare.steamstatic.com/public/shared/images/popups/hover_arrow_both.gif");
        background-repeat: no-repeat;
        position: absolute;
        top: 0;
        width: 26px;
        height: 13px;
    }
    .asi__last {
        display: grid;
        grid-template-columns: auto auto;
        grid-column-gap: 1em;
    }
    .asi__sync {
        display: flex;
        justify-content: center;
    }
    .asi__sync-now {
        font-weight: bolder;
        font-size: medium;
        cursor: pointer;
        text-decoration: underline;
        margin-right: 5px;
    }
    .asi__success {
        color: rgb(81, 119, 29);
    }

    /* https://www.w3schools.com/howto/howto_css_loader.asp */
    .asi__loader {
        border: 1px solid #f3f3f3;
        border-top: 1px solid #3498db;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        animation: spin 2s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
