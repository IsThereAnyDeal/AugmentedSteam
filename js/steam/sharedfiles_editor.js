
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

function BBCode_SpoilerSelection()
{
	g_textarea.wrapSelection("[spoiler]", "[/spoiler]");
}

function BBCode_NoParseSelection()
{
	g_textarea.wrapSelection("[noparse]", "[/noparse]");
}

function BBCode_QuoteSelection()
{
	g_textarea.wrapSelection("[quote]", "[/quote]");
}

function BBCode_CodeSelection()
{
	g_textarea.wrapSelection("[code]", "[/code]");
}

function BBCode_MakeOListFromSelection()
{
	g_textarea.collectFromEachSelectedLine(function(line) {
		return (line.match(/\*+\s/) ? "[*]" : "[*] ") + line;
	}, "[olist]\n", "\n[/olist]");
}

function BBCode_MakeTableFromSelection()
{
	let w = 1;
	let h = 1;

	let Modal = ShowConfirmDialog("",
		`W:<input type="number" min="1" style="width: 50px;" value="${w}" id="es_width">
		&nbsp; X &nbsp;
		H:<input type="number" min="1" style="width: 50px;" value="${h}" id="es_height">
		<br><br>`
	);
	
	$J("#es_width").on("keydown paste input change", () => w = parseInt($J("#es_width").val()));
	$J("#es_height").on("keydown paste input change", () => h = parseInt($J("#es_height").val()));

	Modal.done(function() {
		let n = 0;
		let tab = "    ";

		let c = "";
		while (w > 1) {
			c += `${tab}${tab}[td][/td]\n`;
			w--;
		}

		g_textarea.collectFromEachSelectedLine(function(line) {
			n++;
			return `${tab}[tr]\n${tab}${tab}[td]${line}[/td]\n${c}${tab}[/tr]`;
		}, ``, ``);

		let r = ``;
		while (h > n) {
			r += `\n${tab}[tr]\n${tab}${tab}[td][/td]\n${c}${tab}[/tr]`;
			h--;
		}

		g_textarea.wrapSelection("", r);
		g_textarea.wrapSelection("[table]\n", "\n[/table]");
	});
};

function BBCode_HyperlinkSelection()
{
	let text = g_textarea.getSelection();
	let Modal = ShowConfirmDialog("URL",
		`<div class="commentthread_entry_quotebox">
			<textarea class="commentthread_textarea" id="es_url" rows="1"></textarea>
		</div>`
	);
	
	let url = "";
	$J("#es_url").on("keydown paste input", function(e) {
		let code = e.keyCode || e.which;
		if (code == 13) {
			Modal.Dismiss();
			BBCode_MakeURLFromSelection(url, text);
			return;
		}

		url = $J("#es_url").val();
	});

	Modal.done(() => BBCode_MakeURLFromSelection(url, text));
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
