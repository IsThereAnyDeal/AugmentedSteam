
var g_rgAnimationDefaults = {
	height: 130,
	width: 130,
	fps: 30
};

var g_rgAnimations = [
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/ball_blink_1170_9_69.png',
		cols: 9,
		frames: 69
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/ball_jump_650_5_25.png',
		cols: 5,
		frames: 25
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/ball_wave_1170_9_78.png',
		cols: 9,
		frames: 78
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/cupcake_blink_1040_8_60.png',
		cols: 8,
		frames: 60
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/cupcake_jump_650_5_25.png',
		cols: 5,
		frames: 25
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/cupcake_wave_1040_8_54.png',
		cols: 8,
		frames: 54
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/monte_blink_1040_8_62.png',
		cols: 8,
		frames: 62
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/monte_wave_1040_8_57.png',
		cols: 8,
		frames: 57
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/runner_blink_1170_9_72.png',
		cols: 9,
		frames: 72
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/runner_present_1170_9_79.png',
		cols: 9,
		frames: 79
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/runner_wave_1170_9_68.png',
		cols: 9,
		frames: 68
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/zippy_blink_1040_8_59.png',
		cols: 8,
		frames: 59
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/zippy_shiv_910_7_46.png',
		cols: 7,
		frames: 46
	},
	{
		image: 'https://steamcommunity-a.akamaihd.net/public/images/profile/holidayprofile/sprite_sheets/crushed/zippy_wave_910_7_45.png',
		cols: 7,
		frames: 45
	}
];

ANIMATION_TICK_RATE = 11;

CAnimation = function( rgAnimation, $Parent, x, y )
{
	this.m_rgAnimation = $J.extend( {}, g_rgAnimationDefaults, rgAnimation );
	this.m_x = x;
	this.m_y = y;

	this.m_$Element = $J('<div/>', {'class': 'holidayprofile_animation'});
	this.m_$Element.css( 'height', this.m_rgAnimation.height + 'px' );
	this.m_$Element.css( 'width', this.m_rgAnimation.width + 'px' );
	this.m_$Element.css( 'background', 'url( \'' + this.m_rgAnimation.image + '\') no-repeat');
	this.m_$Element.appendTo( $Parent );
	this.m_$Element.offset( {left: x, top: y } );
	this.m_$Element.show();

	this.m_frame = 0;
	this.m_start = 0;
	this.m_rate = 1000 / this.m_rgAnimation.fps;

	this.m_interval = 0;
};

CAnimation.sm_cAnimationsRunning = 0;

CAnimation.prototype.Start = function() {
	this.m_start = $J.now();
	this.m_interval = window.setInterval( $J.proxy( this.Tick, this ), ANIMATION_TICK_RATE );
	CAnimation.sm_cAnimationsRunning++;
};

CAnimation.prototype.Tick = function () {
	var sElapsed = $J.now() - this.m_start;
	var iCurFrame = Math.floor( sElapsed / this.m_rate );
	if ( iCurFrame != this.m_frame )
	{
		this.m_frame = iCurFrame;
		if ( this.m_frame <= this.m_rgAnimation.frames )
		{
			var nBackgroundX = ( this.m_frame % this.m_rgAnimation.cols ) * this.m_rgAnimation.width;
			var nBackgroundY = Math.floor( this.m_frame / this.m_rgAnimation.cols ) * this.m_rgAnimation.height;
			this.m_$Element.css( 'background-position', '-' + nBackgroundX + 'px -' + nBackgroundY + 'px' );
		}
		else
		{
			this.Destroy();
		}
	}
};

CAnimation.prototype.Destroy = function () {
	if ( this.m_interval )
		window.clearInterval( this.m_interval );
	this.m_$Element.remove();
	CAnimation.sm_cAnimationsRunning--;
};

function StartAnimation()
{
	var $Showcases = $J('.profile_customization:not(.none_selected)');
	if ( !$Showcases.length )
		return;

	AnimationForShowcase( $J( $Showcases[0] ) );

	$Showcases.click( function() {
		AnimationForShowcase( $J(this) );
	});

	window.setInterval( function() {
		if ( CAnimation.sm_cAnimationsRunning == 0 && Math.random() < 0.25 )
		{
			var nScrollY = window.scrollY;
			var nWindowHeight = $J(window).height();
			var $VisibleShowcases = $Showcases.filter( function() {
				var $Showcase = $J(this);
				var nShowcaseTop = $Showcase.offset().top;
				return nShowcaseTop >= nScrollY + 100 && nShowcaseTop < ( nScrollY + nWindowHeight );
			});
			if ( $VisibleShowcases.length )
			{
				var nShowcase = Math.floor( Math.random() * $VisibleShowcases.length );
				AnimationForShowcase( $J($VisibleShowcases[nShowcase]) );
			}
		}
	}, 1500 );
}

function AnimationForShowcase( $Showcase )
{
	var nAnimation = Math.floor( Math.random() * g_rgAnimations.length );
	var pos = $Showcase.offset();
	var xpad = 100;
	var x = Math.floor( Math.random() * ( $Showcase.width() - 2 * xpad ) ) + ( xpad / 2 );
	var Animation = new CAnimation( g_rgAnimations[nAnimation], $Showcase, pos.left + x, pos.top - 120 );
	Animation.Start();
}

StartAnimation();
