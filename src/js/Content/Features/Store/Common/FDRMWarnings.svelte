<script lang="ts">
    interface Props {
        drmString: string;
    }

    let { drmString }: Props = $props();
</script>


<div>{drmString}</div>


<style>
    div {
        box-sizing: border-box;
        width: 100%;
        padding: 12px 15px;
        background: linear-gradient(to right, #bf3022, #49161a);
        margin-bottom: 10px;
        color: #c6d4df;
    }
</style>
