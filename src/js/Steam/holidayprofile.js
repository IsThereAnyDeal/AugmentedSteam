/* globals ANIMATION_TICK_RATE:writable, CAnimation:writable, $J */

const animationDefaults = {
    "height": 130,
    "width": 130,
    "fps": 30
};

const animations = [
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/ball_blink_1170_9_69.png",
        "cols": 9,
        "frames": 69
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/ball_jump_650_5_25.png",
        "cols": 5,
        "frames": 25
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/ball_wave_1170_9_78.png",
        "cols": 9,
        "frames": 78
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/cupcake_blink_1040_8_60.png",
        "cols": 8,
        "frames": 60
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/cupcake_jump_650_5_25.png",
        "cols": 5,
        "frames": 25
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/cupcake_wave_1040_8_54.png",
        "cols": 8,
        "frames": 54
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/monte_blink_1040_8_62.png",
        "cols": 8,
        "frames": 62
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/monte_wave_1040_8_57.png",
        "cols": 8,
        "frames": 57
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/runner_blink_1170_9_72.png",
        "cols": 9,
        "frames": 72
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/runner_present_1170_9_79.png",
        "cols": 9,
        "frames": 79
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/runner_wave_1170_9_68.png",
        "cols": 9,
        "frames": 68
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/zippy_blink_1040_8_59.png",
        "cols": 8,
        "frames": 59
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/zippy_shiv_910_7_46.png",
        "cols": 7,
        "frames": 46
    },
    {
        "image": "https://community.cloudflare.steamstatic.com/public/images/profile/holidayprofile/sprite_sheets/crushed/zippy_wave_910_7_45.png",
        "cols": 7,
        "frames": 45
    }
];

ANIMATION_TICK_RATE = 11;

CAnimation = class {

    constructor(animation, parent, x, y) {
        this._animation = $J.extend({}, animationDefaults, animation);
        this._x = x;
        this._y = y;

        this._element = $J("<div/>", {"class": "holidayprofile_animation"});
        this._element.css("height", `${this._animation.height}px`);
        this._element.css("width", `${this._animation.width}px`);
        this._element.css("background", `url( '${this._animation.image}') no-repeat`);
        this._element.appendTo(parent);
        this._element.offset({"left": x, "top": y});
        this._element.show();

        this._frame = 0;
        this._start = 0;
        this._rate = 1000 / this._animation.fps;

        this._interval = 0;
    }

    start() {
        this._start = $J.now();
        this._interval = window.setInterval($J.proxy(this.tick, this), ANIMATION_TICK_RATE);
        CAnimation.animationsRunning++;
    }

    tick() {
        const sElapsed = $J.now() - this._start;
        const iCurFrame = Math.floor(sElapsed / this._rate);
        if (iCurFrame !== this._frame) {
            this._frame = iCurFrame;
            if (this._frame <= this._animation.frames) {
                const nBackgroundX = (this._frame % this._animation.cols) * this._animation.width;
                const nBackgroundY = Math.floor(this._frame / this._animation.cols) * this._animation.height;
                this._element.css("background-position", `-${nBackgroundX}px -${nBackgroundY}px`);
            } else {
                this.destroy();
            }
        }
    }

    destroy() {
        if (this._interval) { window.clearInterval(this._interval); }
        this._element.remove();
        CAnimation.animationsRunning--;
    }
};

CAnimation.animationsRunning = 0;

function animationForShowcase($Showcase) {
    const nAnimation = Math.floor(Math.random() * animations.length);
    const pos = $Showcase.offset();
    const xpad = 100;
    const x = Math.floor(Math.random() * ($Showcase.width() - (2 * xpad))) + (xpad / 2);
    const Animation = new CAnimation(animations[nAnimation], $Showcase, pos.left + x, pos.top - 120);
    Animation.start();
}

function startAnimation() {
    const $Showcases = $J(".profile_customization:not(.none_selected)");
    if (!$Showcases.length) { return; }

    animationForShowcase($J($Showcases[0]));

    $Showcases.click(function() {
        animationForShowcase($J(this));
    });

    window.setInterval(() => {
        if (CAnimation.animationsRunning === 0 && Math.random() < 0.25) {
            const nScrollY = window.scrollY;
            const nWindowHeight = $J(window).height();
            const $VisibleShowcases = $Showcases.filter(function() {
                const $Showcase = $J(this);
                const nShowcaseTop = $Showcase.offset().top;
                return nShowcaseTop >= nScrollY + 100 && nShowcaseTop < (nScrollY + nWindowHeight);
            });
            if ($VisibleShowcases.length) {
                const nShowcase = Math.floor(Math.random() * $VisibleShowcases.length);
                animationForShowcase($J($VisibleShowcases[nShowcase]));
            }
        }
    }, 1500);
}

startAnimation();
