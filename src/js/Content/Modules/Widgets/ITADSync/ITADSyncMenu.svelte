<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";
    import ITADSyncStatus from "@Content/Modules/Widgets/ITADSync/ITADSyncStatus.svelte";
    import ESyncStatus from "@Core/Sync/ESyncStatus";
    import SyncIndicator from "@Core/Sync/SyncIndicator.svelte";
    import Settings from "@Options/Data/Settings";

    const itadLogo = ExtensionResources.getURL("img/itad.png");

    let statusComponent: ITADSyncStatus;
    let status: ESyncStatus|undefined = undefined;
</script>


<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="asi" on:mouseenter={() => statusComponent.updateLastImport()}>
    <img class="asi__logo" src={itadLogo} alt="ITAD logo">
    <SyncIndicator {status} />

    <div class="asi__hover">
        <div class="asi__content">
            <ITADSyncStatus isConnected
                            enableSync={Settings.itad_sync_library || Settings.itad_sync_wishlist}
                            bind:status bind:this={statusComponent} />
        </div>
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
    img {
        margin-right: 0.4em;
    }

    .asi__hover {
        display: none;
        position: absolute;
        top: 0;
        z-index: 1200;
        left: -115px;
        width: 250px;
        margin-top: 13px;
    }
    .asi:hover .asi__hover {
        display: block;
    }

    .asi__content {
        padding: 12px;
        border: 1px solid #3d4450;
        position: relative;
        background-color: #3d4450;
        margin: 12px 12px 12px 12px;
        box-shadow: 0 0 12px #000000;
        white-space: nowrap;
    }
</style>
