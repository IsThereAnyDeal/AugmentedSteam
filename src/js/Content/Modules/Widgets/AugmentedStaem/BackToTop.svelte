<script lang="ts">
    import {onMount} from "svelte";

    export let target: HTMLElement|undefined;

    let visible: boolean = false;

    function toTop(): void {
        (target ?? window).scroll({
            "top": 0,
            "left": 0,
            "behavior": "smooth"
        });
    }

    function handleScroll(): void {
        const scrollTop = target
            ? target.scrollTop
            : window.scrollY;

        visible = scrollTop >= 400;
    }

    onMount(() => {
        (target ?? window).addEventListener("scroll", handleScroll);
    });
</script>


<button class:is-visible={visible}
     on:click={toTop}
>▲</button>


<style>
    button {
        position: fixed;
        display: flex;
        width: 50px;
        height: 50px;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        visibility: hidden;
        box-shadow: 0 0 10px 2px #000000;
        left: 50%;
        bottom: 20px;
        top: auto;
        margin-left: 500px;
        font-size: 22px;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        background: linear-gradient( to bottom, rgba(33,101,138,1) 5%, rgba(23,67,92,1) 95%);
        transition: visibility 0s 200ms, opacity 200ms ease-in-out;
        color: white;
    }
    button:hover {
        background: linear-gradient( to bottom, rgba(47,137,188,1) 5%, rgba(23,67,92,1) 95%);
    }
    button.is-visible {
        opacity: 1;
        visibility: visible;
        transition: visibility, opacity 200ms ease-in-out;
    }

</style>