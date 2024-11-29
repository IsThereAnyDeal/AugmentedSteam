<script lang="ts">
    export let type: "primary"|"secondary"|"cancel";
</script>


<button type="button"
        class:primary={type === "primary"}
        class:secondary={type === "secondary"}
        class:cancel={type === "cancel"}
        on:click>
    <span><slot></slot></span>
</button>


<style>
    button {
        margin-left: 12px;
        margin-top: 12px;
        border-radius: 2px;
        border: none;
        padding: 1px;
        display: inline-block;
        cursor: pointer;
        text-decoration: none !important;
        color: #d2efa9;
        text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.3);
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
        background-size: 330% 100%;
    }
    .primary {
        background-image: linear-gradient( to right, #75b022 5%, #588a1b 95%);
        color: #d2efa9;
    }
    .primary:hover {
        background-image: linear-gradient( to right, #8ed629 5%, #6aa621 95%);
        color: white;
    }

    .secondary {
        background-image: linear-gradient( to right, #47bfff 5%, #1a44c2 60%);
        color: #c3e1f8;
    }
    .secondary:hover {
        background-image: linear-gradient( to right, #47bfff 5%, #1a44c2 60%);
        color: white;
    }

    .cancel {
        background-image: linear-gradient( to right, #32363f 5%, #32363f 95%);
        color: #dfe3e6;
    }
    .cancel:hover {
        background-image: linear-gradient( to right, #464d58 5%, #464d58 95%);
        color: white;
    }

    span {
        padding: 0 15px;
        font-size: 15px;
        line-height: 30px;
    }
</style>