<script lang="ts">
    export let country: string;
</script>


<span class="es-flag es-flag--{country}"></span>


<style>
    .es-flag {
        margin-right: 4px;
    }
    .es-flag:before {
        content: "";
        position: relative;
        width: 16px;
        height: 11px;
        margin-right: 4px;
        display: inline-block;
        background-repeat: no-repeat;
        background-position: top left;
        background-image: url("extension://img/flags/flags.png");
    }
    .es-flag.es-flag--ad:before {
        background-position: -16px 0;
    }
    .es-flag.es-flag--ae:before {
        background-position: -32px 0;
    }
    .es-flag.es-flag--af:before {
        background-position: -48px 0;
    }
    .es-flag.es-flag--ag:before {
        background-position: -64px 0;
    }
    .es-flag.es-flag--ai:before {
        background-position: -80px 0;
    }
    .es-flag.es-flag--al:before {
        background-position: -96px 0;
    }
    .es-flag.es-flag--am:before {
        background-position: -112px 0;
    }
    .es-flag.es-flag--an:before {
        background-position: -128px 0;
    }
    .es-flag.es-flag--ao:before {
        background-position: -144px 0;
    }
    .es-flag.es-flag--ar:before {
        background-position: -160px 0;
    }
    .es-flag.es-flag--as:before {
        background-position: -176px 0;
    }
    .es-flag.es-flag--at:before {
        background-position: -192px 0;
    }
    .es-flag.es-flag--au:before {
        background-position: -208px 0;
    }
    .es-flag.es-flag--aw:before {
        background-position: -224px 0;
    }
    .es-flag.es-flag--az:before {
        background-position: -240px 0;
    }
    .es-flag.es-flag--ba:before {
        background-position: 0 -11px;
    }
    .es-flag.es-flag--bb:before {
        background-position: -16px -11px;
    }
    .es-flag.es-flag--bd:before {
        background-position: -32px -11px;
    }
    .es-flag.es-flag--be:before {
        background-position: -48px -11px;
    }
    .es-flag.es-flag--bf:before {
        background-position: -64px -11px;
    }
    .es-flag.es-flag--bg:before {
        background-position: -80px -11px;
    }
    .es-flag.es-flag--bh:before {
        background-position: -96px -11px;
    }
    .es-flag.es-flag--bi:before {
        background-position: -112px -11px;
    }
    .es-flag.es-flag--bj:before {
        background-position: -128px -11px;
    }
    .es-flag.es-flag--bm:before {
        background-position: -144px -11px;
    }
    .es-flag.es-flag--bn:before {
        background-position: -160px -11px;
    }
    .es-flag.es-flag--bo:before {
        background-position: -176px -11px;
    }
    .es-flag.es-flag--br:before {
        background-position: -192px -11px;
    }
    .es-flag.es-flag--bs:before {
        background-position: -208px -11px;
    }
    .es-flag.es-flag--bt:before {
        background-position: -224px -11px;
    }
    .es-flag.es-flag--bv:before {
        background-position: -240px -11px;
    }
    .es-flag.es-flag--bw:before {
        background-position: 0 -22px;
    }
    .es-flag.es-flag--by:before {
        background-position: -16px -22px;
    }
    .es-flag.es-flag--bz:before {
        background-position: -32px -22px;
    }
    .es-flag.es-flag--ca:before {
        background-position: -48px -22px;
    }
    .es-flag.es-flag--catalonia:before {
        background-position: -64px -22px;
    }
    .es-flag.es-flag--cd:before {
        background-position: -80px -22px;
    }
    .es-flag.es-flag--cf:before {
        background-position: -96px -22px;
    }
    .es-flag.es-flag--cg:before {
        background-position: -112px -22px;
    }
    .es-flag.es-flag--ch:before {
        background-position: -128px -22px;
    }
    .es-flag.es-flag--ci:before {
        background-position: -144px -22px;
    }
    .es-flag.es-flag--ck:before {
        background-position: -160px -22px;
    }
    .es-flag.es-flag--cl:before {
        background-position: -176px -22px;
    }
    .es-flag.es-flag--cm:before {
        background-position: -192px -22px;
    }
    .es-flag.es-flag--cn:before {
        background-position: -208px -22px;
    }
    .es-flag.es-flag--co:before {
        background-position: -224px -22px;
    }
    .es-flag.es-flag--cr:before {
        background-position: -240px -22px;
    }
    .es-flag.es-flag--cu:before {
        background-position: 0 -33px;
    }
    .es-flag.es-flag--cv:before {
        background-position: -16px -33px;
    }
    .es-flag.es-flag--cw:before {
        background-position: -32px -33px;
    }
    .es-flag.es-flag--cy:before {
        background-position: -48px -33px;
    }
    .es-flag.es-flag--cz:before {
        background-position: -64px -33px;
    }
    .es-flag.es-flag--de:before {
        background-position: -80px -33px;
    }
    .es-flag.es-flag--dj:before {
        background-position: -96px -33px;
    }
    .es-flag.es-flag--dk:before {
        background-position: -112px -33px;
    }
    .es-flag.es-flag--dm:before {
        background-position: -128px -33px;
    }
    .es-flag.es-flag--do:before {
        background-position: -144px -33px;
    }
    .es-flag.es-flag--dz:before {
        background-position: -160px -33px;
    }
    .es-flag.es-flag--ec:before {
        background-position: -176px -33px;
    }
    .es-flag.es-flag--ee:before {
        background-position: -192px -33px;
    }
    .es-flag.es-flag--eg:before {
        background-position: -208px -33px;
    }
    .es-flag.es-flag--eh:before {
        background-position: -224px -33px;
    }
    .es-flag.es-flag--england:before {
        background-position: -240px -33px;
    }
    .es-flag.es-flag--er:before {
        background-position: 0 -44px;
    }
    .es-flag.es-flag--es:before {
        background-position: -16px -44px;
    }
    .es-flag.es-flag--et:before {
        background-position: -32px -44px;
    }
    .es-flag.es-flag--eu1:before {
        background-position: -48px -44px;
    }
    .es-flag.es-flag--fi:before {
        background-position: -64px -44px;
    }
    .es-flag.es-flag--fj:before {
        background-position: -80px -44px;
    }
    .es-flag.es-flag--fk:before {
        background-position: -96px -44px;
    }
    .es-flag.es-flag--fm:before {
        background-position: -112px -44px;
    }
    .es-flag.es-flag--fo:before {
        background-position: -128px -44px;
    }
    .es-flag.es-flag--fr:before {
        background-position: -144px -44px;
    }
    .es-flag.es-flag--ga:before {
        background-position: -160px -44px;
    }
    .es-flag.es-flag--gb:before {
        background-position: -176px -44px;
    }
    .es-flag.es-flag--gd:before {
        background-position: -192px -44px;
    }
    .es-flag.es-flag--ge:before {
        background-position: -208px -44px;
    }
    .es-flag.es-flag--gf:before {
        background-position: -224px -44px;
    }
    .es-flag.es-flag--gg:before {
        background-position: -240px -44px;
    }
    .es-flag.es-flag--gh:before {
        background-position: 0 -55px;
    }
    .es-flag.es-flag--gi:before {
        background-position: -16px -55px;
    }
    .es-flag.es-flag--gl:before {
        background-position: -32px -55px;
    }
    .es-flag.es-flag--gm:before {
        background-position: -48px -55px;
    }
    .es-flag.es-flag--gn:before {
        background-position: -64px -55px;
    }
    .es-flag.es-flag--gp:before {
        background-position: -80px -55px;
    }
    .es-flag.es-flag--gq:before {
        background-position: -96px -55px;
    }
    .es-flag.es-flag--gr:before {
        background-position: -112px -55px;
    }
    .es-flag.es-flag--gs:before {
        background-position: -128px -55px;
    }
    .es-flag.es-flag--gt:before {
        background-position: -144px -55px;
    }
    .es-flag.es-flag--gu:before {
        background-position: -160px -55px;
    }
    .es-flag.es-flag--gw:before {
        background-position: -176px -55px;
    }
    .es-flag.es-flag--gy:before {
        background-position: -192px -55px;
    }
    .es-flag.es-flag--hk:before {
        background-position: -208px -55px;
    }
    .es-flag.es-flag--hm:before {
        background-position: -224px -55px;
    }
    .es-flag.es-flag--hn:before {
        background-position: -240px -55px;
    }
    .es-flag.es-flag--hr:before {
        background-position: 0 -66px;
    }
    .es-flag.es-flag--ht:before {
        background-position: -16px -66px;
    }
    .es-flag.es-flag--hu:before {
        background-position: -32px -66px;
    }
    .es-flag.es-flag--ic:before {
        background-position: -48px -66px;
    }
    .es-flag.es-flag--id:before {
        background-position: -64px -66px;
    }
    .es-flag.es-flag--ie:before {
        background-position: -80px -66px;
    }
    .es-flag.es-flag--il:before {
        background-position: -96px -66px;
    }
    .es-flag.es-flag--im:before {
        background-position: -112px -66px;
    }
    .es-flag.es-flag--in:before {
        background-position: -128px -66px;
    }
    .es-flag.es-flag--io:before {
        background-position: -144px -66px;
    }
    .es-flag.es-flag--iq:before {
        background-position: -160px -66px;
    }
    .es-flag.es-flag--ir:before {
        background-position: -176px -66px;
    }
    .es-flag.es-flag--is:before {
        background-position: -192px -66px;
    }
    .es-flag.es-flag--it:before {
        background-position: -208px -66px;
    }
    .es-flag.es-flag--je:before {
        background-position: -224px -66px;
    }
    .es-flag.es-flag--jm:before {
        background-position: -240px -66px;
    }
    .es-flag.es-flag--jo:before {
        background-position: 0 -77px;
    }
    .es-flag.es-flag--jp:before {
        background-position: -16px -77px;
    }
    .es-flag.es-flag--ke:before {
        background-position: -32px -77px;
    }
    .es-flag.es-flag--kg:before {
        background-position: -48px -77px;
    }
    .es-flag.es-flag--kh:before {
        background-position: -64px -77px;
    }
    .es-flag.es-flag--ki:before {
        background-position: -80px -77px;
    }
    .es-flag.es-flag--km:before {
        background-position: -96px -77px;
    }
    .es-flag.es-flag--kn:before {
        background-position: -112px -77px;
    }
    .es-flag.es-flag--kp:before {
        background-position: -128px -77px;
    }
    .es-flag.es-flag--kr:before {
        background-position: -144px -77px;
    }
    .es-flag.es-flag--kurdistan:before {
        background-position: -160px -77px;
    }
    .es-flag.es-flag--kw:before {
        background-position: -176px -77px;
    }
    .es-flag.es-flag--ky:before {
        background-position: -192px -77px;
    }
    .es-flag.es-flag--kz:before {
        background-position: -208px -77px;
    }
    .es-flag.es-flag--la:before {
        background-position: -224px -77px;
    }
    .es-flag.es-flag--lb:before {
        background-position: -240px -77px;
    }
    .es-flag.es-flag--lc:before {
        background-position: 0 -88px;
    }
    .es-flag.es-flag--li:before {
        background-position: -16px -88px;
    }
    .es-flag.es-flag--lk:before {
        background-position: -32px -88px;
    }
    .es-flag.es-flag--lr:before {
        background-position: -48px -88px;
    }
    .es-flag.es-flag--ls:before {
        background-position: -64px -88px;
    }
    .es-flag.es-flag--lt:before {
        background-position: -80px -88px;
    }
    .es-flag.es-flag--lu:before {
        background-position: -96px -88px;
    }
    .es-flag.es-flag--lv:before {
        background-position: -112px -88px;
    }
    .es-flag.es-flag--ly:before {
        background-position: -128px -88px;
    }
    .es-flag.es-flag--ma:before {
        background-position: -144px -88px;
    }
    .es-flag.es-flag--mc:before {
        background-position: -160px -88px;
    }
    .es-flag.es-flag--md:before {
        background-position: -176px -88px;
    }
    .es-flag.es-flag--me:before {
        background-position: -192px -88px;
    }
    .es-flag.es-flag--mg:before {
        background-position: -208px -88px;
    }
    .es-flag.es-flag--mh:before {
        background-position: -224px -88px;
    }
    .es-flag.es-flag--mk:before {
        background-position: -240px -88px;
    }
    .es-flag.es-flag--ml:before {
        background-position: 0 -99px;
    }
    .es-flag.es-flag--mm:before {
        background-position: -16px -99px;
    }
    .es-flag.es-flag--mn:before {
        background-position: -32px -99px;
    }
    .es-flag.es-flag--mo:before {
        background-position: -48px -99px;
    }
    .es-flag.es-flag--mp:before {
        background-position: -64px -99px;
    }
    .es-flag.es-flag--mq:before {
        background-position: -80px -99px;
    }
    .es-flag.es-flag--mr:before {
        background-position: -96px -99px;
    }
    .es-flag.es-flag--ms:before {
        background-position: -112px -99px;
    }
    .es-flag.es-flag--mt:before {
        background-position: -128px -99px;
    }
    .es-flag.es-flag--mu:before {
        background-position: -144px -99px;
    }
    .es-flag.es-flag--mv:before {
        background-position: -160px -99px;
    }
    .es-flag.es-flag--mw:before {
        background-position: -176px -99px;
    }
    .es-flag.es-flag--mx:before {
        background-position: -192px -99px;
    }
    .es-flag.es-flag--my:before {
        background-position: -208px -99px;
    }
    .es-flag.es-flag--mz:before {
        background-position: -224px -99px;
    }
    .es-flag.es-flag--na:before {
        background-position: -240px -99px;
    }
    .es-flag.es-flag--nc:before {
        background-position: 0 -110px;
    }
    .es-flag.es-flag--ne:before {
        background-position: -16px -110px;
    }
    .es-flag.es-flag--nf:before {
        background-position: -32px -110px;
    }
    .es-flag.es-flag--ng:before {
        background-position: -48px -110px;
    }
    .es-flag.es-flag--ni:before {
        background-position: -64px -110px;
    }
    .es-flag.es-flag--nl:before {
        background-position: -80px -110px;
    }
    .es-flag.es-flag--no:before {
        background-position: -96px -110px;
    }
    .es-flag.es-flag--np:before {
        background-position: -112px -110px;
    }
    .es-flag.es-flag--nr:before {
        background-position: -128px -110px;
    }
    .es-flag.es-flag--nu:before {
        background-position: -144px -110px;
    }
    .es-flag.es-flag--nz:before {
        background-position: -160px -110px;
    }
    .es-flag.es-flag--om:before {
        background-position: -176px -110px;
    }
    .es-flag.es-flag--pa:before {
        background-position: -192px -110px;
    }
    .es-flag.es-flag--pe:before {
        background-position: -208px -110px;
    }
    .es-flag.es-flag--pf:before {
        background-position: -224px -110px;
    }
    .es-flag.es-flag--pg:before {
        background-position: -240px -110px;
    }
    .es-flag.es-flag--ph:before {
        background-position: 0 -121px;
    }
    .es-flag.es-flag--pk:before {
        background-position: -16px -121px;
    }
    .es-flag.es-flag--pl:before {
        background-position: -32px -121px;
    }
    .es-flag.es-flag--pm:before {
        background-position: -48px -121px;
    }
    .es-flag.es-flag--pn:before {
        background-position: -64px -121px;
    }
    .es-flag.es-flag--pr:before {
        background-position: -80px -121px;
    }
    .es-flag.es-flag--ps:before {
        background-position: -96px -121px;
    }
    .es-flag.es-flag--pt:before {
        background-position: -112px -121px;
    }
    .es-flag.es-flag--pw:before {
        background-position: -128px -121px;
    }
    .es-flag.es-flag--py:before {
        background-position: -144px -121px;
    }
    .es-flag.es-flag--qa:before {
        background-position: -160px -121px;
    }
    .es-flag.es-flag--re:before {
        background-position: -176px -121px;
    }
    .es-flag.es-flag--ro:before {
        background-position: -192px -121px;
    }
    .es-flag.es-flag--rs:before {
        background-position: -208px -121px;
    }
    .es-flag.es-flag--ru:before {
        background-position: -224px -121px;
    }
    .es-flag.es-flag--rw:before {
        background-position: -240px -121px;
    }
    .es-flag.es-flag--sa:before {
        background-position: 0 -132px;
    }
    .es-flag.es-flag--sb:before {
        background-position: -16px -132px;
    }
    .es-flag.es-flag--sc:before {
        background-position: -32px -132px;
    }
    .es-flag.es-flag--scotland:before {
        background-position: -48px -132px;
    }
    .es-flag.es-flag--sd:before {
        background-position: -64px -132px;
    }
    .es-flag.es-flag--se:before {
        background-position: -80px -132px;
    }
    .es-flag.es-flag--sg:before {
        background-position: -96px -132px;
    }
    .es-flag.es-flag--sh:before {
        background-position: -112px -132px;
    }
    .es-flag.es-flag--si:before {
        background-position: -128px -132px;
    }
    .es-flag.es-flag--sk:before {
        background-position: -144px -132px;
    }
    .es-flag.es-flag--sl:before {
        background-position: -160px -132px;
    }
    .es-flag.es-flag--sm:before {
        background-position: -176px -132px;
    }
    .es-flag.es-flag--sn:before {
        background-position: -192px -132px;
    }
    .es-flag.es-flag--so:before {
        background-position: -208px -132px;
    }
    .es-flag.es-flag--somaliland:before {
        background-position: -224px -132px;
    }
    .es-flag.es-flag--sr:before {
        background-position: -240px -132px;
    }
    .es-flag.es-flag--ss:before {
        background-position: 0 -143px;
    }
    .es-flag.es-flag--st:before {
        background-position: -16px -143px;
    }
    .es-flag.es-flag--sv:before {
        background-position: -32px -143px;
    }
    .es-flag.es-flag--sx:before {
        background-position: -48px -143px;
    }
    .es-flag.es-flag--sy:before {
        background-position: -64px -143px;
    }
    .es-flag.es-flag--sz:before {
        background-position: -80px -143px;
    }
    .es-flag.es-flag--tc:before {
        background-position: -96px -143px;
    }
    .es-flag.es-flag--td:before {
        background-position: -112px -143px;
    }
    .es-flag.es-flag--tf:before {
        background-position: -128px -143px;
    }
    .es-flag.es-flag--tg:before {
        background-position: -144px -143px;
    }
    .es-flag.es-flag--th:before {
        background-position: -160px -143px;
    }
    .es-flag.es-flag--tj:before {
        background-position: -176px -143px;
    }
    .es-flag.es-flag--tk:before {
        background-position: -192px -143px;
    }
    .es-flag.es-flag--tl:before {
        background-position: -208px -143px;
    }
    .es-flag.es-flag--tm:before {
        background-position: -224px -143px;
    }
    .es-flag.es-flag--tn:before {
        background-position: -240px -143px;
    }
    .es-flag.es-flag--to:before {
        background-position: 0 -154px;
    }
    .es-flag.es-flag--tr:before {
        background-position: -16px -154px;
    }
    .es-flag.es-flag--tt:before {
        background-position: -32px -154px;
    }
    .es-flag.es-flag--tv:before {
        background-position: -48px -154px;
    }
    .es-flag.es-flag--tw:before {
        background-position: -64px -154px;
    }
    .es-flag.es-flag--tz:before {
        background-position: -80px -154px;
    }
    .es-flag.es-flag--ua:before {
        background-position: -96px -154px;
    }
    .es-flag.es-flag--ug:before {
        background-position: -112px -154px;
    }
    .es-flag.es-flag--um:before {
        background-position: -128px -154px;
    }
    .es-flag.es-flag--us:before {
        background-position: -144px -154px;
    }
    .es-flag.es-flag--uy:before {
        background-position: -160px -154px;
    }
    .es-flag.es-flag--uz:before {
        background-position: -176px -154px;
    }
    .es-flag.es-flag--va:before {
        background-position: -192px -154px;
    }
    .es-flag.es-flag--vc:before {
        background-position: -208px -154px;
    }
    .es-flag.es-flag--ve:before {
        background-position: -224px -154px;
    }
    .es-flag.es-flag--vg:before {
        background-position: -240px -154px;
    }
    .es-flag.es-flag--vi:before {
        background-position: 0 -165px;
    }
    .es-flag.es-flag--vn:before {
        background-position: -16px -165px;
    }
    .es-flag.es-flag--vu:before {
        background-position: -32px -165px;
    }
    .es-flag.es-flag--wales:before {
        background-position: -48px -165px;
    }
    .es-flag.es-flag--wf:before {
        background-position: -64px -165px;
    }
    .es-flag.es-flag--ws:before {
        background-position: -80px -165px;
    }
    .es-flag.es-flag--ye:before {
        background-position: -96px -165px;
    }
    .es-flag.es-flag--yt:before {
        background-position: -112px -165px;
    }
    .es-flag.es-flag--za:before {
        background-position: -128px -165px;
    }
    .es-flag.es-flag--zanzibar:before {
        background-position: -144px -165px;
    }
    .es-flag.es-flag--zm:before {
        background-position: -160px -165px;
    }
    .es-flag.es-flag--zw:before {
        background-position: -176px -165px;
    }
    .es-flag.es-flag--eu2:before {
        background-position: -192px -165px;
    }
</style>
