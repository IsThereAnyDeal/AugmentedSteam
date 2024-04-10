
<button on:click>
    <slot></slot>
</button>


<style>
    button {
        border-radius: 2px;
        padding: 2px 4px;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        text-decoration: none !important;
        color: #67c1f5 !important;
        background: rgba( 103, 193, 245, 0.2 );
    }
    button:hover {
        text-decoration: none !important;
        color: #fff !important;
        background: #417a9b;
        background: -webkit-linear-gradient( 150deg, #417a9b 5%,#67c1f5 95%);
        background: linear-gradient( -60deg, #417a9b 5%,#67c1f5 95%);
    }
</style>
