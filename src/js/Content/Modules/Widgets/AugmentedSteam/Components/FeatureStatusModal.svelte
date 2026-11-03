<script lang="ts">
    import Modal from "@Core/Modals/Contained/Modal.svelte";
    import FeatureReport, {FeatureDesc} from "@Content/FeatureReport.svelte.js";
    import YesIcon from "@Content/Icons/Status/EnabledIcon.svelte";
    import NoIcon from "@Content/Icons/Status/DisabledIcon.svelte";
    import ErrorIcon from "@Content/Icons/Status/ErrorIcon.svelte";
    import LoadingIcon from "@Content/Icons/Status/LoadingIcon.svelte";

    interface Props {
        report: FeatureReport,
        onclose: () => void
    }

    let { report, onclose }: Props = $props();

    const features: FeatureDesc[] = $derived.by(() => {
        let result: Array<[string, FeatureDesc]> = report.features.map(desc => [desc.name, desc])
        result.sort((a, b) => a[0].localeCompare(b[0]));
        return result.map(a => a[1]);
    });
</script>


<Modal title="Status" showClose oncancel={onclose}>
    <ul>
        {#each features as feature}
            <li class={{
                enabled: !feature.loading && feature.enabled,
                failed: !feature.loading && feature.failed
            }}>
                <div class="status">
                    {#if feature.loading}
                        <LoadingIcon />
                    {:else if feature.failed}
                        <ErrorIcon />
                    {:else if feature.enabled}
                        <YesIcon />
                    {:else}
                        <NoIcon />
                    {/if}
                </div>
                <div>
                    <div class="name">{feature.name}</div>
                    <div class="message">{feature.message}</div>
                </div>
            </li>
        {/each}
    </ul>
</Modal>


<style>
    ul {
        font-size: 14px;
        margin: 0;
        padding: 0;
    }

    li {
        --color: #67c1f5;
        padding: 5px;
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 5px;
        border-radius: 2px;
        background: linear-gradient(
                135deg,
                hsla(from var(--color) h s l / 0.1) 10%,
                hsla(from var(--color) h s l / 0.5) 100%
        );

        &.enabled {
            --color: #02ba55;
        }
        &.failed {
            --color: #d72e2e;
        }

        & + li {
            margin-top: 1px;
        }
    }

    .status {
        color: var(--color);
    }

    .name {
        color: white;
    }

    .message {
        font-size: 12px;
        color: #acb2b8;
    }
</style>
