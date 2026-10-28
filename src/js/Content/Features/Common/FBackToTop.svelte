<script lang="ts">
    import {fade} from "svelte/transition";

    interface Props {
        target?: HTMLElement|Window;
    }

    let { target = window }: Props = $props();

    function onclick(): void {
        target.scroll({
            top: 0,
            left: 0,
            behavior: "smooth"
        });
    }

    let scrollTop: number = $state(0);
</script>


<svelte:window bind:scrollY={scrollTop} />

{#if scrollTop > 400}
    <button type="button" {onclick} transition:fade={{duration: 200}}>▲</button>
{/if}


<style>
    button {
        position: fixed;
        right: 50px;
        bottom: 20px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        box-shadow: 0 0 10px 2px #000000;
        font-size: 22px;
        border: 0;
        border-radius: 50%;
        cursor: pointer;
        background: linear-gradient( to bottom, rgba(33,101,138,1) 5%, rgba(23,67,92,1) 95%);
        color: white;

        &:hover {
            background: linear-gradient( to bottom, rgba(47,137,188,1) 5%, rgba(23,67,92,1) 95%);
        }
    }
</style>