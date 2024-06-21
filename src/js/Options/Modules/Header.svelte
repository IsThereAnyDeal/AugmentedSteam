<svelte:options immutable={false} />

<script lang="ts">
    import Logo from "@Assets/logo/logo.svg";
</script>


<div>
    <a href="https://store.steampowered.com/">
        <img src={Logo} alt="Augmented Steam Logo" />
    </a>
</div>


<style>
    div {
        height: 80px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding-left: 20px;
        margin-bottom: 30px;
    }

    img {
        height: 60px;
    }
</style>
