<script lang="ts">
    import FeatureStatusModal from "@Content/Modules/Widgets/AugmentedSteam/Components/FeatureStatusModal.svelte";
    import {mount, unmount} from "svelte";
    import type FeatureReport from "@Content/FeatureReport.svelte.js";

    interface Props {
        report: FeatureReport
    }

    let { report }: Props = $props();

    function onclick(): void {
        const modal = mount(FeatureStatusModal, {
            target: document.body,
            props: {
                report,
                onclose: () => unmount(modal)
            }
        });
    }
</script>


<button type="button" {onclick}>
    {#if report.loading > 0}
        {Math.round((report.loaded / report.enabled) * 100)}%
    {:else}
        {report.loaded}<!--
        -->{#if report.failed > 0}<!--
            --><span class="failed">{report.failed}</span>
        {/if}
    {/if}
</button>


<style>
    button {
        border: 0;
        outline: 0;
        background: transparent;
        color: #acb2b8;
        font-size: 10px;
        height: 25px;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        gap: 4px;
        margin-right: 10px;
        cursor: pointer;

        &:hover {
            color: white;
        }
    }

    .failed {
        padding: 2px 5px;
        border-radius: 2px;
        background: linear-gradient(
                135deg,
                hsla(from #d72e2e h s l / 0.1) 10%,
                hsla(from #d72e2e h s l / 0.5) 100%
        )
    }
</style>