<script lang="ts">
    export let down: boolean = false;
</script>

<i class:down></i>

<style>
    i {
        width: 14px;
        height: 16px;
        background-size: 14px 26px;
        display: inline-block;
        background: url("extension://img/steam/review_graph_expander.png") no-repeat 0 2px;
        transition: background-position 200ms;
    }
    .down {
        background-position: 0 -12px;
    }
</style>
