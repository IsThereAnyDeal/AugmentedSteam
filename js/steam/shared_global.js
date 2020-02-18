// proto functions used to accept an id or an element.
// This can be used to migrate them to returning jquery instead of proto-wrapped element
function $JFromIDOrElement( elem )
{
	if ( elem instanceof jQuery )
		return elem;
	else if ( typeof elem == 'string' )
		return $J('#' + elem.replace( /\./, '\\.' ) );
	else
		return $J( elem );
}

function ShowMenu( elemLink, elemPopup, align, valign, bLinkHasBorder )
{
	var $Link = $JFromIDOrElement(elemLink);
	var $Popup = $JFromIDOrElement(elemPopup);

	if ( $Link.hasClass('focus') )
	{
		HideMenu( elemLink, elemPopup );
		return;
	}

	AlignMenu( $Link, $Popup, align, valign, bLinkHasBorder );

	ShowWithFade( $Popup );
	$Link.addClass('focus');
	RegisterPopupDismissal( function() { HideMenu( elemLink, elemPopup ); }, $Popup );
}

function HideMenu( elemLink, elemPopup )
{
	var $Link = $JFromIDOrElement(elemLink);
	var $Popup = $JFromIDOrElement(elemPopup);

	$Link.data( 'menu-active', false );
	HideWithFade( $Popup );
	$Link.removeClass( 'focus' );
	$J(document).off('.RegisterPopupDismissal');
}

function AlignMenu( elemLink, elemPopup, align, valign, bLinkHasBorder )
{
	var align = align ? align : 'left';
	var $Link = $JFromIDOrElement(elemLink);
	var $Popup = $JFromIDOrElement(elemPopup);

	var offsetLink = $Link.offset();
	var nWindowScrollTop = $J(window).scrollTop();
	var nViewportHeight = $J(window).height();

	var nLinkViewportTop = offsetLink.top - nWindowScrollTop;

	// add a little bit of padding so we don't position it flush to an edge if possible
	var nPopupHeight = $Popup.height() + 8;

	if ( !valign )
	{
		//if there's not enough room between our spot and the top of the document, we definitely want to drop down
		if ( nWindowScrollTop + offsetLink.top < nPopupHeight )
		{
			valign = 'bottom';
		}
		else
		{
			var nSpaceAbove = nLinkViewportTop;
			var nSpaceBelow = nViewportHeight - ( nLinkViewportTop + $Link.height() );
			//otherwise we only want to drop down if we've got enough space below us (measured based on view area)
			// or if there's not enough space above to pop in either direction and there's more space below
			if ( nSpaceBelow > nPopupHeight || ( nSpaceAbove < nPopupHeight && nSpaceBelow > nSpaceAbove ) )
				valign = 'bottom';
			else
				valign = 'top';

		}
	}

	var borderpx = bLinkHasBorder ? 1 : 0;
	var shadowpx = $Popup.hasClass( 'popup_block_new' ) ? 0 : 12;
	var offsetLeft = 0;
	if ( align == 'left' )
	{
		//elemPopup.style.left = ( elemLink.positionedOffset()[0] - 12 ) + 'px';
		offsetLeft = -shadowpx - borderpx;
	}
	else if ( align == 'right' )
	{
		//elemPopup.style.left = ( elemLink.positionedOffset()[0] + elemLink.getWidth() - elemPopup.getWidth() + 13 ) + 'px';
		offsetLeft = $Link.outerWidth() - $Popup.outerWidth() + shadowpx + borderpx;
	}
	else if ( align == 'leftsubmenu' )
	{
		//elemPopup.style.left = ( elemLink.positionedOffset()[0] - elemPopup.getWidth() + 12 ) + 'px';
		offsetLeft = -$Popup.outerWidth() + shadowpx - borderpx;
	}
	else if ( align == 'rightsubmenu' )
	{
		//elemPopup.style.left = ( elemLink.positionedOffset()[0] + elemLink.getWidth() - 12 ) + 'px';
		offsetLeft = $Link.outerWidth()  - shadowpx + 2 * borderpx;
	}

	var offsetTop = 0;
	if ( valign == 'bottom' )
	{
		//elemPopup.style.top = ( elemLink.positionedOffset()[1] + elemLink.getHeight() - 12 ) + 'px';
		offsetTop = $Link.outerHeight() - shadowpx;
	}
	else if ( valign == 'top' )
	{
		//elemPopup.style.top = ( elemLink.positionedOffset()[1] - elemPopup.getHeight() + 12 ) + 'px';
		offsetTop = -$Popup.outerHeight() + shadowpx;
	}
	else if ( valign == 'bottomsubmenu' )
	{
		//elemPopup.style.top = ( elemLink.positionedOffset()[1] - 12 ) + 'px';
		offsetTop = -shadowpx;
	}


	var bPopupHidden = !$Popup.is(':visible');

	if ( bPopupHidden )
	{
		// IE can't do this with display: none elements
		$Popup.css( 'visibility', 'hidden' );
		$Popup.show();
	}

	$Popup.offset( {
		top: Math.max( offsetLink.top + offsetTop, 0 ),
		left: Math.max( offsetLink.left + offsetLeft, 0 )
	});

	if ( bPopupHidden )
	{
		// restore visibility
		$Popup.hide();
		$Popup.css( 'visibility', 'visible' );
	}
}

function ShowWithFade( elem, speed )
{
	var $Elem = $JFromIDOrElement(elem);

	$Elem.stop();
	$Elem.fadeTo( speed || 200, 1.0 );	//fadeTo rather than fadeIn in case it was already in a fade
}

function HideWithFade( elem, speed )
{
	var $Elem = $JFromIDOrElement(elem);

	$Elem.stop();
	$Elem.fadeOut( speed || 200 );
}

// register some events to dismiss popup (ie, user clicking elsewhere on the window, escape)
//   cleans up event binds afterwards.  clicks to children of "elemIgnore" will not dismiss popup
function RegisterPopupDismissal( dismissFunc, elemIgnore )
{
	var $Ignore = $JFromIDOrElement( elemIgnore );
	// delay registration by one frame so that we don't catch the event that triggered this popup.
	window.setTimeout( function() {
		$J(document).on('click.RegisterPopupDismissal keydown.RegisterPopupDismissal', function (event) {

			if (event.keyCode && event.keyCode != 27 /* KEY_ESC */) {
				return;
			}
			var elem = $J(event.target);

			if ( $Ignore.length && $J.contains( $Ignore[0], elem[0] ) )
				return;

			dismissFunc();
			$J(document).off('.RegisterPopupDismissal');
		});
	}, 1 );
}