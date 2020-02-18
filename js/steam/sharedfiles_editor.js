
var g_textarea;
function InitSectionDescriptionTextArea( textArea, OnContentChanged )
{
	g_textarea = new Control.TextArea( textArea, OnContentChanged );
		if( !$( 'PreviewFileYouTube' ) )
	{
		$J('#YouTubeBtn').hide()
	}
}


function BBCode_BoldSelection()
{
	g_textarea.wrapSelection('[b]','[/b]');
}

function BBCode_UnderlineSelection()
{
	g_textarea.wrapSelection('[u]','[/u]');
}

function BBCode_ItalicizeSelection()
{
	g_textarea.wrapSelection('[i]','[/i]');
}

function BBCode_StrikethroughSelection()
{
	g_textarea.wrapSelection('[strike]','[/strike]');
}

function BBCode_MakeURLFromSelection( url, urlText )
{
	g_textarea.replaceSelection( urlText );
	g_textarea.wrapSelection('[url=' + url + ']', '[/url]' );
}

function BBCode_MakeListFromSelection()
{
	g_textarea.collectFromEachSelectedLine(function(line) {
		return ( line.match(/\*+\s/) ? '[*]' : '[*] ' ) + line;
	},'[list]\n', '\n[/list]' );
}

function BBCode_H1Selection()
{
	g_textarea.wrapSelection('[h1]','[/h1]');
}

function ShowURLDialog()
{
	$('URLInsertForm_Text').value = g_textarea.getSelection();
	ShowMenu( $('URLInsertBtn'), 'EditGuideURLInsertControls', 'left' );
}

function InsertURL()
{
	var url = $('URLInsertForm_URL').value;
	var urlText = $('URLInsertForm_Text').value;
	BBCode_MakeURLFromSelection( url, urlText );
	HideMenu( $('URLInsertBtn'), 'EditGuideURLInsertControls' );
}

function ShowYouTubeDialog()
{
	ShowMenu( $('YouTubeBtn'), 'EditGuideYouTubeInsertControls', 'left' );
}

function youtubeIDextract( url )
{
	var youtube_id;
	youtube_id = url.replace(/^[^v]+v.(.{11}).*/,"$1");
	return youtube_id;
}

function InsertYouTubeVideo()
{
	$( 'PreviewFileYouTube' ).youtubeurl.value.strip();
	var youtubeid = youtubeIDextract( $( 'PreviewFileYouTube' ).youtubeurl.value );
	if ( $( 'PreviewFileYouTube' ).youtubeurl.value.length == 0 ||
		youtubeid == null ||
		( $( 'PreviewFileYouTube' ).youtubeurl.value.indexOf( "youtube.com") == - 1 &&
			$( 'PreviewFileYouTube' ).youtubeurl.value.indexOf( "youtu.be" ) == - 1 ) )
	{
		alert( 'Please enter a valid YouTube™ URL.' );
		return;
	}

	var formattingOption = Form.getInputs('PreviewFileYouTube','radio','previewVideoInsertType').find(function(radio) { return radio.checked; }).value;

	g_textarea.wrapSelection( '[previewyoutube=' + youtubeid + ';' + formattingOption + ']', '[/previewyoutube]' );

	$( 'PreviewFileYouTube' ).youtubeurl.value = '';

	HideMenu( $('YouTubeBtn'), 'EditGuideYouTubeInsertControls' );
}
