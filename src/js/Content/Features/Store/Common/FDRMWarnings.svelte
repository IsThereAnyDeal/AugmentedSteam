<script lang="ts">
    export let drmString: string;
</script>


<div class="drm_warning"><span>{drmString}</span></div>


<style>
    .drm_warning {
        display: table;
        width: 100%;
        padding-top: 8px;
        padding-bottom: 8px;
        min-height: 38px;
        background: linear-gradient(rgb(73, 22, 26) 0%, rgb(191, 48, 34) 100%);
        margin-bottom: 10px;
    }
    .drm_warning span {
        display: table-cell;
        vertical-align: middle;
        line-height: normal;
        padding: 0 15px;
    }
</style>
