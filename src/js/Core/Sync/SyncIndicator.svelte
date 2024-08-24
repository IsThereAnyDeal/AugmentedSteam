<script lang="ts">
    import ESyncStatus from "@Core/Sync/ESyncStatus";

    export let status: ESyncStatus = ESyncStatus.OK;
</script>


<span class:is-loading={status === ESyncStatus.Loading}
      class:is-error={status === ESyncStatus.Error}></span>


<style>
    span {
        display: inline-block;
        vertical-align: middle;
        align-self: center;
        border: 3px solid #02ba55;
        border-radius: 50%;
    }
    span.is-error {
        border-color: #d72e2e;
    }
    span.is-loading {
        border-color: #3090ce;
        animation: pulse 600ms alternate infinite;
    }
    @keyframes pulse {
        0% { opacity: 0; }
        100% { opacity: 1; }
    }
</style>