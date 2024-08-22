<script lang="ts">
    import ExtensionResources from "@Core/ExtensionResources";
    import ITADSyncStatus from "@Content/Modules/Widgets/ITADSync/ITADSyncStatus.svelte";
    import EITADSyncStatus from "@Content/Modules/Widgets/ITADSync/EITADSyncStatus";

    const itadLogo = ExtensionResources.getURL("img/itad.png");

    let statusComponent: ITADSyncStatus;
    let status: EITADSyncStatus;
</script>


<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="asi" on:mouseenter={() => statusComponent.updateLastImport()}>
    <img class="asi__logo" src={itadLogo} alt="ITAD logo">
    <span class="asi__indicator"
          class:is-loading={status === EITADSyncStatus.Loading}
          class:is-error={status === EITADSyncStatus.Error}></span>

    <div class="asi__hover">
        <div class="asi__content">
            <ITADSyncStatus bind:status bind:this={statusComponent} />
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
    .asi__indicator {
        margin-left: 0.4em;
        border: 3px solid #02ba55;
        border-radius: 50%;
    }
    .asi__indicator.is-error {
        border-color: #d72e2e;
    }
    .asi__indicator.is-loading {
        border-color: #3090ce;
        animation: pulse 600ms alternate infinite;
    }
    @keyframes pulse {
        0% { opacity: 0; }
        100% { opacity: 1; }
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
