/*
 * Vinova Beta - Innovative Vietnamese Input Method
 * Author: Tien Dung (dungtn@gmail.com)
 * Use '~' (a rarely use button) to switch between Raw and Vietnamese mode
 */

/* Coding Convention
 * $variableName for global vars ( to be shared between functions or init one only)
 */

(function () { // scope intro

if (window.vinova) { return; }

window.vinova = function () {
  if ( ! $initialized ) {
    $initialized = true;
    jQuery( document ).
      bind( "keypress",  keypress  ).
      bind( "keydown",   keydown   ).
      bind( "mousedown", function () { vinova.reset(); } );
    
    vinova.tip = jQuery("<div id='vinova_tip' style='font-size:1.2em; color: rgb(51, 102, 153); position:absolute; z-index:99999999; height:1.25em; background:#dfe8f6; border:solid 1px gray; padding:2px;' />");
    
    jQuery( function() {
      vinova.tip.appendTo( document.body );
    });
    
    vinova.reset();
  }
};

/***************************************************************************
 * Binding vinova to a text edit area
 ***************************************************************************/
// Global constants
var ENTER     = 13, 
    SPACE     = 32, 
    ESC       = 27, 
    BACKSPACE = 8, 
    SHIFT     = 16, 
    SWITCH    = 96, 
    FINISH    = 9999, 
    TELEX     = 1, 
    VNI       = 2;

// Global vars
var $target         = null, 
    $cursor, 
    $viMode         = true, 
    $initialized    = false, 
    $byPassKeypress = false, 
    $logging        = false, 
    $isVietnamese, 
    $showSingle     = true, 
    $preViMode      = true, 
    $showTip        = false;


function log() {
  if ( ! $logging ) { return; }
  console.log.apply(console, arguments);
}


function isValid( event ) {
  if (event.ctrlKey || event.altKey || event.metaKey) { return false; }
  
  var code = event.keyCode;

  return  (49 <= code && code <= 57 && !event.shiftKey)  || // [1-9] for VNI
          (65 <= code && code <= 90)  || // [[a-z]|[A-Z]
          !!vinova[ code ];
}


function logKey( event ) {
  log(
      "type:",      event.type, 
    ", keyCode: ",  event.keyCode, 
    ", charCode: ", event.charCode,
    ", byPassKeypress", $byPassKeypress, 
    ", valid:", isValid( event.keyCode || event.charCode )
  );
  log("Event position", getEventPosition( event ) );
}


function keydown(event) {

  var target = event.srcElement || event.target;
  $byPassKeypress = false;
  
  
  if ( target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" ) {
    $byPassKeypress = true;
    vinova.reset();
    return;
  } 

    $target = target; 
    $showTip = ( $target.id === 'DICTIONARY_SEARCH_FIELD' );
  
  $cursor = getCursorPosition( $target );
  
  if ( !isValid( event ) ) {
    $byPassKeypress = true;
        
    if ( vinova.raw.length !== 0 ) {
      updateTarget( FINISH );
    }
    vinova.reset( event.keyCode === SPACE );
  }
  else {
    if ( jQuery.browser.msie && event.keyCode === BACKSPACE ) { // for IE only
      vinova.process( event );
    }
  }

  logKey( event );
}


function keypress( event ) {
  if ( $byPassKeypress ) {
    vinova.reset();
    return;
  }
  
  logKey( event );
  
  if ( vinova.cursor === null ) {    
    vinova.cursor = $cursor;
  }

  log( $target.tagName, ", cursor: ", $cursor, ", saved: ", vinova.cursor );
  vinova.process( event );
}


function updateTarget( option ) {
  var text = $target.value, chunk, tip;

  if ( option === FINISH ) {
    $preViMode = $viMode;
  }

  if ( !option && vinova.raw !== vinova.mix ) {
    chunk = $viMode ?
      ('['+vinova.raw+"]"+vinova.mix):
      ('['+vinova.mix+"]"+vinova.raw);    
  }
  else {
    
    if ( $viMode !== VNI && $showTip  && vinova.raw !== vinova.mix ) {
      var offset = jQuery( $target ).offset();
      tip = !$viMode ? vinova.mix : vinova.raw;
      vinova.tip.html( tip ).show().css( {top:offset.top+25,left:offset.left} ); 
    } else {
      vinova.tip.hide();
    }
    
    chunk = $viMode ? vinova.mix : vinova.raw;
  }
  
  $target.value = text.substr( 0, vinova.cursor ) + chunk + text.substr( $cursor );
  setCursorTo( vinova.cursor + chunk.length );
}


// get and set cursor are modified functions from xvnkb.js
function getCursorPosition( target ) {

	if (target === null || target.value === null || target.value.length === 0) { return 0; }
	// Moz/Opera
	if ( typeof target.selectionStart !== 'undefined') {
		if (target.selectionStart < 0 || target.selectionStart > target.length ||
			target.selectionEnd < 0 || target.selectionEnd > target.length ||
			target.selectionEnd < target.selectionStart) { return 0; }
		return target.selectionStart;
	}
	// IE
	if (document.selection) {
		var selection = document.selection.createRange();
		var textRange = target.createTextRange();
		// if the current selection is within the edit control
		if (textRange === null || selection === null ||
			((selection.text !== "") && textRange.inRange(selection) === false)) { return 0; }
		if (selection.text === "") {
			var index = 1;
			if ( target.tagName === "INPUT" ) {
				var contents = textRange.text;
				while (index < contents.length) {
					textRange.findText( contents.substring(index) );
					if (textRange.boundingLeft == selection.boundingLeft) { break; }
					index++;
				}
			}
			// Handle text areas.
			else if ( target.tagName == "TEXTAREA" ) {
				var caret = document.selection.createRange().duplicate();
				index = target.value.length + 1;
				while (caret.parentElement() == target && caret.move("character", 1) == 1) {
					--index;
					if (target.value.charCodeAt(index) === 10) { index -= 1; }
				}
				if (index == target.value.length + 1) { index = 0; }
			}
			return index;
		}
		return textRange.text.indexOf(selection.text);
	}
}


function setCursorTo( position ) {
	if (position < 0) { return; }
	if ($target.setSelectionRange) {
		$target.setSelectionRange(position, position);
	}
	else
	if ($target.createTextRange) {
		var range = $target.createTextRange();
		range.collapse(true);
		range.moveEnd('character', position);
		range.moveStart('character', position);
		range.select();
	}
}


/***************************************************************************
 * User Interface Decoration
 * (KHÓ) Hiện song song hai dòng Vietnamese và Raw tại vị trí con trỏ
 * (TRUNG BÌNH) Hiện Raw và Vi ở dạng text like this [mỏe|<b>more</b>] 
 * (DỄ) Gặp trường hợp confuse mới hiện lựa chọn
 ***************************************************************************/

function getEventPosition( event ) {
  // get mouse position not cursor position :(
	event = event || window.event;
	var x = event.pageX || (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft)) || 0;
	var y = event.pageY || (event.clientY + (document.documentElement.scrollTop  || document.body.scrollTop))  || 0;
	return { x:x, y:y };
}

/***************************************************************************
 * Core engine
 ***************************************************************************/
 
vinova.reset = function ( opt ) {
  this.raw = "";
  this.mix = "";
  this.cursor = null;
  this.enFilterIsNotUsed = true;
  this.tip.hide();
  
  if (!opt) {
    $viMode = true;
  }
  
};


vinova.toggle = function( what ) {
  switch ( what ) {
    case 'log':
      $logging = !$logging; 
      console.log('log =', $logging);
      break;
    case 'mode':
      $viMode = !$viMode;
      console.log('mode = ', $viMode);
      break;
    default:
      console.log("invalid argument, try vinova.toggle('log|mode')");
  }
};


var $count = 0;
vinova.log = function () {
  log("#", $count++, ":");
  log(" raw -> ", this.raw);
  log(" mix -> ", this.mix);
};


vinova.viMode = function (a) {
  if (typeof a !== 'undefined') {
    $viMode = !!a;
  }
  return $viMode;
};


vinova.process = function ( event ) {
  var charCode = event.keyCode || event.charCode, 
      chr = String.fromCharCode( charCode );
  if ( this[charCode] ) {
    if ( this[charCode]() ) { return; }
  } else {
    this.raw += chr;
  }
  // length guard to avoid too long syllable
  if ( this.raw.length > 20 ) { $viMode = false; return; }
  
  this.update();
  if /*[1..9]*/ ( chr <= '9' && chr >= '1' ) {
    $showTip = false;
    $viMode = VNI;
  } else { $isVietnamese = this.isViSyllable( this.mix ); }
  
  if (charCode === SWITCH || charCode === BACKSPACE || this.raw.length > 1) {
    if ( $viMode !== VNI ) {
      if (charCode !== SWITCH) { $viMode = $isVietnamese; }
      if ( this.enFilterIsNotUsed )  
      {
        var raw = this.raw.toLowerCase();
        if ( $enFilter[ raw ] ) 
        { 
          $viMode = false; 
          this.enFilterIsNotUsed = false;
        } 
        else if ( $evConfuse[ raw ] ) 
        { 
          $viMode = $preViMode; 
          this.enFilterIsNotUsed = false;
        }
      }
    }
    updateTarget( $showSingle );
    event.preventDefault();
  }
  
  /*INFOR*/this.log();
};


function convert( text, code ) {
  if (!code) { return text; }
  return text.replace( code.re, function (c) { return code.map[c] || c; });
}  

// Update other text format from raw text
vinova.update = function () {
  var text = this.raw;
  // Turn one for vowels (aa -> â, ow -> .. )
  text = convert( text, $telex );
  text = convert( text, $vni );
  // Turn two for tones (âs -> ấ, o2 -> ò ...)
  text = convert( correctTonePositions( text ), $telexTone );
  text = convert( text, $vniTone );
  this.mix = text;
  return text;
};


// SWICH is `/~ key
vinova[ SWITCH ] = vinova[ 96 ] = vinova[ 192 ] = function () { 
  $viMode = !$viMode;
};


vinova[ BACKSPACE ] = function () {
  var length = this.raw.length;
  if (length === 0) {
    this.reset();
    return true;
  }
  this.raw = this.raw.substr(0, length-1);
};


// Move telex tone chars to the correct position ( cois => cosi )
function correctTonePositions( text ) {
  var pos, 
      curChar, 
      preChar, 
      tone = null, 
      tonePos, 
      vowel, 
      preVowel, 
      posibleInitial, 
      nextChar = " ";
  
  for ( pos = text.length - 1; pos >= 0; pos-- ) {
    curChar = text.charAt( pos );
    preChar = text.charAt( pos-1 );
    if ( curChar === " " ) {
      tone = null;
    } 
    else
    if ( $toneMap[ curChar ] ) {
      tonePos = pos;
      tone = $toneMap[ curChar ];
    } 
    else
    if ( tone && (vowel = $vowelMap[ curChar ]) ) {
      preVowel = $vowelMap[ preChar ];
      posibleInitial = text.charAt(pos-2);
      var preCharIsNotUIVowel = ("u" !== preVowel || "-qQ".indexOf( posibleInitial ) <= 0) &&
                                ("i" !== preVowel || "-gG".indexOf( posibleInitial ) <= 0);

      /*TRACE*/log( tone, preCharIsNotUIVowel, curChar + '->' + vowel, preChar + '->' + preVowel);
      
      if(preVowel &&
        ( ( "iu".match(vowel) && preCharIsNotUIVowel  ) || 
          ( "y" === vowel && "a" === preVowel         ) || 
          ( "oO".match( curChar ) && "ae".match( preVowel )  ) ||
          ( "a" === vowel && (("iyu".match( preVowel ) && preCharIsNotUIVowel ) && ( $toneMap[nextChar] || nextChar == " "))  )
        )) 
      { pos--; }
      // move tone char to right after vowel position
      text = text.substr(0, pos+1) + tone + text.substr(pos+1, tonePos-pos-1) + text.substr(tonePos+1);
      tone = null;
    }
    nextChar = curChar;
  }
  return text;
}

/***************************************************************************
 * Encoding data
 ***************************************************************************/

var $vowelMap = {"a":"a","á":"a","à":"a","ả":"a","ã":"a","ạ":"a","A":"a","Á":"a","À":"a","Ả":"a","Ã":"a","Ạ":"a","ă":"a","ắ":"a","ằ":"a","ẳ":"a","ẵ":"a","ặ":"a","Ă":"a","Ắ":"a","Ằ":"a","Ẳ":"a","Ẵ":"a","Ặ":"a","â":"a","ấ":"a","ầ":"a","ẩ":"a","ẫ":"a","ậ":"a","Â":"a","Ấ":"a","Ầ":"a","Ẩ":"a","Ẫ":"a","Ậ":"a","e":"e","é":"e","è":"e","ẻ":"e","ẽ":"e","ẹ":"e","E":"e","É":"e","È":"e","Ẻ":"e","Ẽ":"e","Ẹ":"e","ê":"e","ế":"e","ề":"e","ể":"e","ễ":"e","ệ":"e","Ê":"e","Ế":"e","Ề":"e","Ể":"e","Ễ":"e","Ệ":"e","i":"i","í":"i","ì":"i","ỉ":"i","ĩ":"i","ị":"i","I":"i","Í":"i","Ì":"i","Ỉ":"i","Ĩ":"i","Ị":"i","u":"u","ú":"u","ù":"u","ủ":"u","ũ":"u","ụ":"u","U":"u","Ú":"u","Ù":"u","Ủ":"u","Ũ":"u","Ụ":"u","ư":"u","ứ":"u","ừ":"u","ử":"u","ữ":"u","ự":"u","Ư":"u","Ứ":"u","Ừ":"u","Ử":"u","Ữ":"u","Ự":"u","y":"y","ý":"y","ỳ":"y","ỷ":"y","ỹ":"y","ỵ":"y","Y":"y","Ý":"y","Ỳ":"y","Ỷ":"y","Ỹ":"y","Ỵ":"y","o":"o","ó":"o","ò":"o","ỏ":"o","õ":"o","ọ":"o","O":"o","Ó":"o","Ò":"o","Ỏ":"o","Õ":"o","Ọ":"o","ô":"o","ố":"o","ồ":"o","ổ":"o","ỗ":"o","ộ":"o","Ô":"o","Ố":"o","Ồ":"o","Ổ":"o","Ỗ":"o","Ộ":"o","ơ":"o","ớ":"o","ờ":"o","ở":"o","ỡ":"o","ợ":"o","Ơ":"o","Ớ":"o","Ờ":"o","Ở":"o","Ỡ":"o","Ợ":"o"};

//*qfvxj*/ var $toneMap = {"q":"q","f":"f","v":"v","x":"x","j":"j","Q":"q","F":"f","V":"v","X":"x","J":"j"};
/*Telex + qfvxj*/ var $toneMap = {"s":"s","r":"r","q":"q","f":"f","v":"v","x":"x","S":"s","R":"r","j":"j","Q":"q","F":"f","V":"v","X":"x","J":"j"};
//*dfjkl*/ var $toneMap = {"d":"d","f":"f","j":"j","k":"k","l":"l","D":"d","F":"f","J":"j","K":"k","L":"l"};

var $telex = { 
  re: /aw|AW|aa|AA|ee|EE|oo|OO|ow|OW|uw|UW|dd|DD|uwow|UWOW"/g,
  map: {"aw":"ă","AW":"Ă","aa":"â","AA":"Â","ee":"ê","EE":"Ê","oo":"ô","OO":"Ô","ow":"ơ","OW":"Ơ","uw":"ư","UW":"Ư","dd":"đ","DD":"Đ","w":"ư","W":"Ư","uwow":"ươ","UWOW":"ƯƠ"}
},

$telexTone = {
  /*Telex*/
  re: /as|As|af|Af|ar|Ar|ax|Ax|aj|Aj|ăs|Ăs|ăf|Ăf|ăr|Ăr|ăx|Ăx|ăj|Ăj|âs|Âs|âf|Âf|âr|Âr|âx|Âx|âj|Âj|es|Es|ef|Ef|er|Er|ex|Ex|ej|Ej|ês|Ês|êf|Êf|êr|Êr|êx|Êx|êj|Êj|is|Is|if|If|ir|Ir|ix|Ix|ij|Ij|ys|Ys|yf|Yf|yr|Yr|yx|Yx|yj|Yj|os|Os|of|Of|or|Or|ox|Ox|oj|Oj|ôs|Ôs|ôf|Ôf|ôr|Ôr|ôx|Ôx|ôj|Ôj|ơs|Ơs|ơf|Ơf|ơr|Ơr|ơx|Ơx|ơj|Ơj|us|Us|uf|Uf|ur|Ur|ux|Ux|uj|Uj|ưs|Ưs|ưf|Ưf|ưr|Ưr|ưx|Ưx|ưj|Ưj"/g,
  map: {"as":"á","As":"Á","af":"à","Af":"À","ar":"ả","Ar":"Ả","ax":"ã","Ax":"Ã","aj":"ạ","Aj":"Ạ","ăs":"ắ","Ăs":"Ắ","ăf":"ằ","Ăf":"Ằ","ăr":"ẳ","Ăr":"Ẳ","ăx":"ẵ","Ăx":"Ẵ","ăj":"ặ","Ăj":"Ặ","âs":"ấ","Âs":"Ấ","âf":"ầ","Âf":"Ầ","âr":"ẩ","Âr":"Ẩ","âx":"ẫ","Âx":"Ẫ","âj":"ậ","Âj":"Ậ","es":"é","Es":"É","ef":"è","Ef":"È","er":"ẻ","Er":"Ẻ","ex":"ẽ","Ex":"Ẽ","ej":"ẹ","Ej":"Ẹ","ês":"ế","Ês":"Ế","êf":"ề","Êf":"Ề","êr":"ể","Êr":"Ể","êx":"ễ","Êx":"Ễ","êj":"ệ","Êj":"Ệ","is":"í","Is":"Í","if":"ì","If":"Ì","ir":"ỉ","Ir":"Ỉ","ix":"ĩ","Ix":"Ĩ","ij":"ị","Ij":"Ị","ys":"ý","Ys":"Ý","yf":"ỳ","Yf":"Ỳ","yr":"ỷ","Yr":"Ỷ","yx":"ỹ","Yx":"Ỹ","yj":"ỵ","Yj":"Ỵ","os":"ó","Os":"Ó","of":"ò","Of":"Ò","or":"ỏ","Or":"Ỏ","ox":"õ","Ox":"Õ","oj":"ọ","Oj":"Ọ","ôs":"ố","Ôs":"Ố","ôf":"ồ","Ôf":"Ồ","ôr":"ổ","Ôr":"Ổ","ôx":"ỗ","Ôx":"Ỗ","ôj":"ộ","Ôj":"Ộ","ơs":"ớ","Ơs":"Ớ","ơf":"ờ","Ơf":"Ờ","ơr":"ở","Ơr":"Ở","ơx":"ỡ","Ơx":"Ỡ","ơj":"ợ","Ơj":"Ợ","us":"ú","Us":"Ú","uf":"ù","Uf":"Ù","ur":"ủ","Ur":"Ủ","ux":"ũ","Ux":"Ũ","uj":"ụ","Uj":"Ụ","ưs":"ứ","Ưs":"Ứ","ưf":"ừ","Ưf":"Ừ","ưr":"ử","Ưr":"Ử","ưx":"ữ","Ưx":"Ữ","ưj":"ự","Ưj":"Ự"}
  /*dfjkl*/
  //re: /ad|Ad|af|Af|aj|Aj|ak|Ak|al|Al|ăd|Ăd|ăf|Ăf|ăj|Ăj|ăk|Ăk|ăl|Ăl|âd|Âd|âf|Âf|âj|Âj|âk|Âk|âl|Âl|ed|Ed|ef|Ef|ej|Ej|ek|Ek|el|El|êd|Êd|êf|Êf|êj|Êj|êk|Êk|êl|Êl|id|Id|if|If|ij|Ij|ik|Ik|il|Il|yd|Yd|yf|Yf|yj|Yj|yk|Yk|yl|Yl|od|Od|of|Of|oj|Oj|ok|Ok|ol|Ol|ôd|Ôd|ôf|Ôf|ôj|Ôj|ôk|Ôk|ôl|Ôl|ơd|Ơd|ơf|Ơf|ơj|Ơj|ơk|Ơk|ơl|Ơl|ud|Ud|uf|Uf|uj|Uj|uk|Uk|ul|Ul|ưd|Ưd|ưf|Ưf|ưj|Ưj|ưk|Ưk|ưl|Ưl/g,
  //map: {"ad":"á","Ad":"Á","af":"à","Af":"À","aj":"ả","Aj":"Ả","ak":"ã","Ak":"Ã","al":"ạ","Al":"Ạ","ăd":"ắ","Ăd":"Ắ","ăf":"ằ","Ăf":"Ằ","ăj":"ẳ","Ăj":"Ẳ","ăk":"ẵ","Ăk":"Ẵ","ăl":"ặ","Ăl":"Ặ","âd":"ấ","Âd":"Ấ","âf":"ầ","Âf":"Ầ","âj":"ẩ","Âj":"Ẩ","âk":"ẫ","Âk":"Ẫ","âl":"ậ","Âl":"Ậ","ed":"é","Ed":"É","ef":"è","Ef":"È","ej":"ẻ","Ej":"Ẻ","ek":"ẽ","Ek":"Ẽ","el":"ẹ","El":"Ẹ","êd":"ế","Êd":"Ế","êf":"ề","Êf":"Ề","êj":"ể","Êj":"Ể","êk":"ễ","Êk":"Ễ","êl":"ệ","Êl":"Ệ","id":"í","Id":"Í","if":"ì","If":"Ì","ij":"ỉ","Ij":"Ỉ","ik":"ĩ","Ik":"Ĩ","il":"ị","Il":"Ị","yd":"ý","Yd":"Ý","yf":"ỳ","Yf":"Ỳ","yj":"ỷ","Yj":"Ỷ","yk":"ỹ","Yk":"Ỹ","yl":"ỵ","Yl":"Ỵ","od":"ó","Od":"Ó","of":"ò","Of":"Ò","oj":"ỏ","Oj":"Ỏ","ok":"õ","Ok":"Õ","ol":"ọ","Ol":"Ọ","ôd":"ố","Ôd":"Ố","ôf":"ồ","Ôf":"Ồ","ôj":"ổ","Ôj":"Ổ","ôk":"ỗ","Ôk":"Ỗ","ôl":"ộ","Ôl":"Ộ","ơd":"ớ","Ơd":"Ớ","ơf":"ờ","Ơf":"Ờ","ơj":"ở","Ơj":"Ở","ơk":"ỡ","Ơk":"Ỡ","ơl":"ợ","Ơl":"Ợ","ud":"ú","Ud":"Ú","uf":"ù","Uf":"Ù","uj":"ủ","Uj":"Ủ","uk":"ũ","Uk":"Ũ","ul":"ụ","Ul":"Ụ","ưd":"ứ","Ưd":"Ứ","ưf":"ừ","Ưf":"Ừ","ưj":"ử","Ưj":"Ử","ưk":"ữ","Ưk":"Ữ","ưl":"ự","Ưl":"Ự"}

  /*qfvxj*/
  //re: /aq|Aq|af|Af|av|Av|ax|Ax|aj|Aj|ăq|Ăq|ăf|Ăf|ăv|Ăv|ăx|Ăx|ăj|Ăj|âq|Âq|âf|Âf|âv|Âv|âx|Âx|âj|Âj|eq|Eq|ef|Ef|ev|Ev|ex|Ex|ej|Ej|êq|Êq|êf|Êf|êv|Êv|êx|Êx|êj|Êj|iq|Iq|if|If|iv|Iv|ix|Ix|ij|Ij|yq|Yq|yf|Yf|yv|Yv|yx|Yx|yj|Yj|oq|Oq|of|Of|ov|Ov|ox|Ox|oj|Oj|ôq|Ôq|ôf|Ôf|ôv|Ôv|ôx|Ôx|ôj|Ôj|ơq|Ơq|ơf|Ơf|ơv|Ơv|ơx|Ơx|ơj|Ơj|uq|Uq|uf|Uf|uv|Uv|ux|Ux|uj|Uj|ưq|Ưq|ưf|Ưf|ưv|Ưv|ưx|Ưx|ưj|Ưj/g,
  //map: {"aq":"á","Aq":"Á","af":"à","Af":"À","av":"ả","Av":"Ả","ax":"ã","Ax":"Ã","aj":"ạ","Aj":"Ạ","ăq":"ắ","Ăq":"Ắ","ăf":"ằ","Ăf":"Ằ","ăv":"ẳ","Ăv":"Ẳ","ăx":"ẵ","Ăx":"Ẵ","ăj":"ặ","Ăj":"Ặ","âq":"ấ","Âq":"Ấ","âf":"ầ","Âf":"Ầ","âv":"ẩ","Âv":"Ẩ","âx":"ẫ","Âx":"Ẫ","âj":"ậ","Âj":"Ậ","eq":"é","Eq":"É","ef":"è","Ef":"È","ev":"ẻ","Ev":"Ẻ","ex":"ẽ","Ex":"Ẽ","ej":"ẹ","Ej":"Ẹ","êq":"ế","Êq":"Ế","êf":"ề","Êf":"Ề","êv":"ể","Êv":"Ể","êx":"ễ","Êx":"Ễ","êj":"ệ","Êj":"Ệ","iq":"í","Iq":"Í","if":"ì","If":"Ì","iv":"ỉ","Iv":"Ỉ","ix":"ĩ","Ix":"Ĩ","ij":"ị","Ij":"Ị","yq":"ý","Yq":"Ý","yf":"ỳ","Yf":"Ỳ","yv":"ỷ","Yv":"Ỷ","yx":"ỹ","Yx":"Ỹ","yj":"ỵ","Yj":"Ỵ","oq":"ó","Oq":"Ó","of":"ò","Of":"Ò","ov":"ỏ","Ov":"Ỏ","ox":"õ","Ox":"Õ","oj":"ọ","Oj":"Ọ","ôq":"ố","Ôq":"Ố","ôf":"ồ","Ôf":"Ồ","ôv":"ổ","Ôv":"Ổ","ôx":"ỗ","Ôx":"Ỗ","ôj":"ộ","Ôj":"Ộ","ơq":"ớ","Ơq":"Ớ","ơf":"ờ","Ơf":"Ờ","ơv":"ở","Ơv":"Ở","ơx":"ỡ","Ơx":"Ỡ","ơj":"ợ","Ơj":"Ợ","uq":"ú","Uq":"Ú","uf":"ù","Uf":"Ù","uv":"ủ","Uv":"Ủ","ux":"ũ","Ux":"Ũ","uj":"ụ","Uj":"Ụ","ưq":"ứ","Ưq":"Ứ","ưf":"ừ","Ưf":"Ừ","ưv":"ử","Ưv":"Ử","ưx":"ữ","Ưx":"Ữ","ưj":"ự","Ưj":"Ự"}
},

$vni = {
  re: /a8|A8|a6|A6|e6|E6|o6|O6|o7|O7|u7|U7|d9|D9|u7|U7|u7o7|U7O7"/g,
  map: {"a8":"ă","A8":"Ă","a6":"â","A6":"Â","e6":"ê","E6":"Ê","o6":"ô","O6":"Ô","o7":"ơ","O7":"Ơ","u7":"ư","U7":"Ư","d9":"đ","D9":"Đ","u7o7":"ươ","U7O7":"ƯƠ"}
},
$vniTone = {
  re: /a1|A1|a2|A2|a3|A3|a4|A4|a5|A5|ă1|Ă1|ă2|Ă2|ă3|Ă3|ă4|Ă4|ă5|Ă5|â1|Â1|â2|Â2|â3|Â3|â4|Â4|â5|Â5|e1|E1|e2|E2|e3|E3|e4|E4|e5|E5|ê1|Ê1|ê2|Ê2|ê3|Ê3|ê4|Ê4|ê5|Ê5|i1|I1|i2|I2|i3|I3|i4|I4|i5|I5|y1|Y1|y2|Y2|y3|Y3|y4|Y4|y5|Y5|o1|O1|o2|O2|o3|O3|o4|O4|o5|O5|ô1|Ô1|ô2|Ô2|ô3|Ô3|ô4|Ô4|ô5|Ô5|ơ1|Ơ1|ơ2|Ơ2|ơ3|Ơ3|ơ4|Ơ4|ơ5|Ơ5|u1|U1|u2|U2|u3|U3|u4|U4|u5|U5|ư1|Ư1|ư2|Ư2|ư3|Ư3|ư4|Ư4|ư5|Ư5"/g,
  map: {"a1":"á","A1":"Á","a2":"à","A2":"À","a3":"ả","A3":"Ả","a4":"ã","A4":"Ã","a5":"ạ","A5":"Ạ","ă1":"ắ","Ă1":"Ắ","ă2":"ằ","Ă2":"Ằ","ă3":"ẳ","Ă3":"Ẳ","ă4":"ẵ","Ă4":"Ẵ","ă5":"ặ","Ă5":"Ặ","â1":"ấ","Â1":"Ấ","â2":"ầ","Â2":"Ầ","â3":"ẩ","Â3":"Ẩ","â4":"ẫ","Â4":"Ẫ","â5":"ậ","Â5":"Ậ","e1":"é","E1":"É","e2":"è","E2":"È","e3":"ẻ","E3":"Ẻ","e4":"ẽ","E4":"Ẽ","e5":"ẹ","E5":"Ẹ","ê1":"ế","Ê1":"Ế","ê2":"ề","Ê2":"Ề","ê3":"ể","Ê3":"Ể","ê4":"ễ","Ê4":"Ễ","ê5":"ệ","Ê5":"Ệ","i1":"í","I1":"Í","i2":"ì","I2":"Ì","i3":"ỉ","I3":"Ỉ","i4":"ĩ","I4":"Ĩ","i5":"ị","I5":"Ị","y1":"ý","Y1":"Ý","y2":"ỳ","Y2":"Ỳ","y3":"ỷ","Y3":"Ỷ","y4":"ỹ","Y4":"Ỹ","y5":"ỵ","Y5":"Ỵ","o1":"ó","O1":"Ó","o2":"ò","O2":"Ò","o3":"ỏ","O3":"Ỏ","o4":"õ","O4":"Õ","o5":"ọ","O5":"Ọ","ô1":"ố","Ô1":"Ố","ô2":"ồ","Ô2":"Ồ","ô3":"ổ","Ô3":"Ổ","ô4":"ỗ","Ô4":"Ỗ","ô5":"ộ","Ô5":"Ộ","ơ1":"ớ","Ơ1":"Ớ","ơ2":"ờ","Ơ2":"Ờ","ơ3":"ở","Ơ3":"Ở","ơ4":"ỡ","Ơ4":"Ỡ","ơ5":"ợ","Ơ5":"Ợ","u1":"ú","U1":"Ú","u2":"ù","U2":"Ù","u3":"ủ","U3":"Ủ","u4":"ũ","U4":"Ũ","u5":"ụ","U5":"Ụ","ư1":"ứ","Ư1":"Ứ","ư2":"ừ","Ư2":"Ừ","ư3":"ử","Ư3":"Ử","ư4":"ữ","Ư4":"Ữ","ư5":"ự","Ư5":"Ự"}
};

/***************************************************************************
 * Spelling checking
 ***************************************************************************/

function enSpellCheck( word ) {
  if ( jQuery.browser.mozilla ) {
    netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
    var spellCheckEngine = Components.classes["@mozilla.org/spellchecker/myspell;1"].getService(Components.interfaces.mozISpellCheckingEngine);
    spellCheckEngine.dictionary = 'en-US';
    return spellCheckEngine.check( word );
  }
  return true;
}
//*qvfxj*/ $enFilter = {'of':1,'if':1,'ex':1,'move':1,'love':1,'navy':1,'nix':1,'nova':1,'now':1,'ova':1,'oven':1,'room':1,'rove':1,'see':1,'sofa':1,'soon':1,'taxi':1,'viva':1,'how':1,'':1,'':1,'':1,'':1 };
/*telex*/
var $enFilter = {"arm":1,"barn":1,"bore":1,"bose":1,"bosc":1,"born":1,"bura":1,"burn":1,"core":1,"corm":1,"corn":1,"cosa":1,"cose":1,"coset":1,"cost":1,"cora":1,"darn":1,"dari":1,"dern":1,"derm":1,"dojc":1,"dust":1,"esp":1,"est":1,"esn":1,"gij":1,"gasp":1,"giro":1,"girn":1,"harm":1,"of":1,"if":1,"ex":1,"nix":1,"now":1,"how":1,"room":1,"see":1,"sofa":1,"soon":1,"taxi":1,"is":1,"cast":1,"chest":1,"arng":1,"asch":1,"asp":1,"ast":1,"bari":1,"barm":1,"bast":1,"berm":1,"bern":1,"best":1,"boast":1,"boost":1,"bury":1,"bust":1,"busy":1,"cary":1,"chari":1,"charm":1,"chary":1,"chasm":1,"chirm":1,"choir":1,"chore":1,"chose":1,"chosen":1,"chufa":1,"churn":1,"co2":1,"coast":1,"coats":1,"coax":1,"coxa":1,"curn":1,"cusp":1,"disa":1,"doer":1,"doom":1,"dooms":1,"doren":1,"dorm":1,"dose":1,"dost":1,"dufy":1,"dura":1,"durn":1,"esm":1,"goes":1,"gora":1,"gore":1,"guar":1,"gust":1,"haji":1,"hari":1,"hasp":1,"hast":1,"herm":1,"hern":1,"hero":1,"hex":1,"hist":1,"hoary":1,"horn":1,"hose":1,"host":1,"huji":1,"icsh":1,"ira":1,"ism":1,"isn":1,"kern":1,"kist":1,"lari":1,"larn":1,"last":1,"lest":1,"lira":1,"lisp":1,"list":1,"lisu":1,"loran":1,"lore":1,"loren":1,"lorn":1,"lose":1,"lost":1,"lust":1,"mari":1,"maro":1,"mary":1,"mast":1,"maxi":1,"misch":1,"mist":1,"moray":1,"more":1,"mori":1,"morn":1,"mosan":1,"most":1,"moxa":1,"musa":1,"must":1,"nary":1,"naso":1,"nast":1,"nero":1,"nest":1,"nist":1,"noir":1,"noes":1,"norm":1,"norn":1,"nose":1,"nusa":1,"oary":1,"oast":1,"ofay":1,"ora":1,"oran":1,"orang":1,"ore":1,"oreo":1,"oxen":1,"quasi":1,"quern":1,"quest":1,"quran":1,"roast":1,"roost":1,"rosa":1,"rose":1,"rufa":1,"rasp":1,"resp":1,"rest":1,"rijn":1,"rira":1,"rooms":1,"rusa":1,"rust":1,"sari":1,"saxo":1,"seer":1,"sir":1,"sira":1,"soja":1,"sora":1,"sore":1,"soren":1,"sori":1,"sorn":1,"sufi":1,"sura":1,"surya":1,"susa":1,"susi":1,"tarn":1,"taro":1,"term":1,"tern":1,"test":1,"therm":1,"thorn":1,"those":1,"thuja":1,"toast":1,"tora":1,"tore":1,"toreo":1,"tori":1,"torn":1,"tosa":1,"town":1,"trias":1,"trojan":1,"troops":1,"trust":1,"tufa":1,"tureen":1,"turn":1,"ufa":1,"urn":1,"usa":1,"usn":1,"vary":1,"vast":1,"vest":1,"visa":1};
var $evConfuse = {"air":1,"aix":1,"ans":1,"ar":1,"as":1,"auf":1,"awn":1,"ax":1,"ayr":1,"bar":1,"bas":1,"bats":1,"bee":1,"beef":1,"been":1,"beer":1,"bias":1,"bis":1,"bits":1,"boar":1,"boer":1,"bois":1,"bons":1,"boo":1,"boom":1,"boon":1,"boor":1,"boots":1,"bora":1,"bos":1,"bow":1,"box":1,"bumf":1,"buns":1,"bur":1,"bus":1,"caps":1,"car":1,"cats":1,"chair":1,"chaos":1,"chaps":1,"char":1,"chaus":1,"cheer":1,"chef":1,"chips":1,"chops":1,"chow":1,"coif":1,"coir":1,"cons":1,"coo":1,"coon":1,"cor":1,"cos":1,"cosec":1,"cow":1,"cows":1,"cox":1,"cups":1,"cur":1,"cuts":1,"dais":1,"dar":1,"das":1,"dawn":1,"days":1,"dee":1,"deem":1,"deems":1,"deer":1,"dens":1,"der":1,"des":1,"dias":1,"dis":1,"dix":1,"doj":1,"door":1,"dos":1,"dots":1,"dow":1,"down":1,"downs":1,"duns":1,"dux":1,"ee":1,"emf":1,"ems":1,"ens":1,"eos":1,"er":1,"ern":1,"es":1,"gar":1,"gari":1,"gary":1,"gas":1,"gaur":1,"ghee":1,"gist":1,"goaf":1,"goer":1,"goo":1,"goof":1,"goon":1,"gown":1,"gur":1,"gus":1,"guts":1,"hair":1,"haj":1,"hans":1,"has":1,"hays":1,"her":1,"hest":1,"his":1,"hoar":1,"hoax":1,"hoof":1,"hoops":1,"hoots":1,"hops":1,"howf":1,"hus":1,"imf":1,"inf":1,"inr":1,"ins":1,"ir":1,"its":1,"ix":1,"keen":1,"keeps":1,"kef":1,"khayr":1,"kif":1,"kir":1,"lair":1,"laos":1,"lar":1,"las":1,"lats":1,"lawn":1,"lax":1,"lays":1,"lee":1,"leer":1,"lees":1,"lens":1,"ler":1,"liar":1,"lias":1,"lir":1,"lis":1,"loaf":1,"loir":1,"loo":1,"loom":1,"loon":1,"loos":1,"los":1,"lots":1,"low":1,"lox":1,"luis":1,"lux":1,"manx":1,"maps":1,"mar":1,"mas":1,"max":1,"mays":1,"meer":1,"mens":1,"mer":1,"minx":1,"mips":1,"mir":1,"mix":1,"mons":1,"moo":1,"moon":1,"moor":1,"mots":1,"mow":1,"mown":1,"muir":1,"munj":1,"mus":1,"naif":1,"nee":1,"neem":1,"nij":1,"noon":1,"nor":1,"nox":1,"nuf":1,"nuts":1,"nux":1,"nyx":1,"oaf":1,"oar":1,"oas":1,"oats":1,"ois":1,"oof":1,"oom":1,"ops":1,"or":1,"os":1,"ow":1,"own":1,"ox":1,"queen":1,"queens":1,"queer":1,"quins":1,"quits":1,"quois":1,"raf":1,"raj":1,"ras":1,"rays":1,"ree":1,"reef":1,"rees":1,"ref":1,"reps":1,"res":1,"rex":1,"roar":1,"roo":1,"roof":1,"roots":1,"row":1,"ruf":1,"rus":1,"rux":1,"sachs":1,"sais":1,"sans":1,"sas":1,"sawm":1,"sawn":1,"sax":1,"seem":1,"seen":1,"sens":1,"seps":1,"sex":1,"sif":1,"sis":1,"six":1,"soar":1,"songs":1,"sops":1,"sos":1,"sow":1,"sown":1,"sox":1,"sur":1,"sus":1,"taif":1,"taj":1,"taos":1,"taps":1,"tar":1,"tax":1,"tee":1,"teem":1,"teen":1,"teens":1,"teer":1,"tef":1,"thee":1,"this":1,"thor":1,"thur":1,"thus":1,"tips":1,"tir":1,"toes":1,"tongs":1,"tons":1,"too":1,"toons":1,"tops":1,"tor":1,"tow":1,"trans":1,"tree":1,"tref":1,"trois":1,"trots":1,"trow":1,"tums":1,"tux":1,"tyr":1,"uns":1,"ur":1,"us":1,"ux":1,"var":1,"vas":1,"vaux":1,"vee":1,"veer":1,"veps":1,"vex":1,"vis":1,"voix":1,"vow":1,"vox":1,"xix":1,"xor":1,"yr":1};
/*
var $enFilter = {"arm":1,"barn":1,"bore":1,"bose":1,"bosc":1,"born":1,"bura":1,"burn":1,"core":1,"corm":1,"corn":1,"cosa":1,"cose":1,"coset":1,"cost":1,"cora":1,"darn":1,"dari":1,"dern":1,"derm":1,"dojc":1,"dust":1,"esp":1,"est":1,"esn":1,"gij":1,"gasp":1,"giro":1,"girn":1,"harm":1,"of":1,"if":1,"ex":1,"nix":1,"now":1,"how":1,"room":1,"see":1,"sofa":1,"soon":1,"taxi":1,"is":1,"cast":1,"chest":1,"arng":1,"asch":1,"asp":1,"ast":1,"bari":1,"barm":1,"bast":1,"berm":1,"bern":1,"best":1,"boast":1,"boost":1,"bury":1,"bust":1,"busy":1,"cary":1,"chari":1,"charm":1,"chary":1,"chasm":1,"chirm":1,"choir":1,"chore":1,"chose":1,"chosen":1,"chufa":1,"churn":1,"co2":1,"coast":1,"coats":1,"coax":1,"coxa":1,"curn":1,"cusp":1,"disa":1,"doer":1,"doom":1,"dooms":1,"doren":1,"dorm":1,"dose":1,"dost":1,"dufy":1,"dura":1,"durn":1,"esm":1,"goes":1,"gora":1,"gore":1,"guar":1,"gust":1,"haji":1,"hari":1,"hasp":1,"hast":1,"herm":1,"hern":1,"hero":1,"hex":1,"hist":1,"hoary":1,"horn":1,"hose":1,"host":1,"huji":1,"icsh":1,"ira":1,"ism":1,"isn":1,"kern":1,"kist":1,"lari":1,"larn":1,"last":1,"lest":1,"lira":1,"lisp":1,"list":1,"lisu":1,"loran":1,"lore":1,"loren":1,"lorn":1,"lose":1,"lost":1,"lust":1,"mari":1,"maro":1,"mary":1,"mast":1,"maxi":1,"misch":1,"mist":1,"moray":1,"more":1,"mori":1,"morn":1,"mosan":1,"most":1,"moxa":1,"musa":1,"must":1,"nary":1,"naso":1,"nast":1,"nero":1,"nest":1,"nist":1,"noir":1,"noes":1,"norm":1,"norn":1,"nose":1,"nusa":1,"oary":1,"oast":1,"ofay":1,"ora":1,"oran":1,"orang":1,"ore":1,"oreo":1,"oxen":1,"quasi":1,"quern":1,"quest":1,"quran":1,"roast":1,"roost":1,"rosa":1,"rose":1,"rufa":1,"rasp":1,"resp":1,"rest":1,"rijn":1,"rira":1,"rooms":1,"rusa":1,"rust":1,"sari":1,"saxo":1,"seer":1,"sir":1,"sira":1,"soja":1,"sora":1,"sore":1,"soren":1,"sori":1,"sorn":1,"sufi":1,"sura":1,"surya":1,"susa":1,"susi":1,"tarn":1,"taro":1,"term":1,"tern":1,"test":1,"therm":1,"thorn":1,"those":1,"thuja":1,"toast":1,"tora":1,"tore":1,"toreo":1,"tori":1,"torn":1,"tosa":1,"town":1,"trias":1,"trojan":1,"troops":1,"trust":1,"tufa":1,"tureen":1,"turn":1,"ufa":1,"urn":1,"usa":1,"usn":1,"vary":1,"vast":1,"vest":1,"visa":1};
var $evConfuse = {"air":1,"aix":1,"ans":1,"ar":1,"arm":1,"arng":1,"as":1,"asch":1,"asp":1,"ast":1,"auf":1,"awn":1,"ax":1,"ayr":1,"bar":1,"bari":1,"barm":1,"barn":1,"bas":1,"bast":1,"bats":1,"bee":1,"beef":1,"been":1,"beer":1,"berm":1,"bern":1,"best":1,"bias":1,"bis":1,"bits":1,"boar":1,"boast":1,"boer":1,"bois":1,"bons":1,"boo":1,"boom":1,"boon":1,"boor":1,"boost":1,"boots":1,"bora":1,"bore":1,"born":1,"bos":1,"bosc":1,"bose":1,"bow":1,"box":1,"bumf":1,"buns":1,"bur":1,"bura":1,"burn":1,"bury":1,"bus":1,"bust":1,"busy":1,"caps":1,"car":1,"cary":1,"cast":1,"cats":1,"chair":1,"chaos":1,"chaps":1,"char":1,"chari":1,"charm":1,"chary":1,"chasm":1,"chaus":1,"cheer":1,"chef":1,"chest":1,"chips":1,"chirm":1,"choir":1,"chops":1,"chore":1,"chose":1,"chosen":1,"chow":1,"chufa":1,"churn":1,"co2":1,"coast":1,"coats":1,"coax":1,"coif":1,"coir":1,"cons":1,"coo":1,"coon":1,"cor":1,"cora":1,"core":1,"corm":1,"corn":1,"cos":1,"cosa":1,"cose":1,"cosec":1,"coset":1,"cost":1,"cow":1,"cows":1,"cox":1,"coxa":1,"cups":1,"cur":1,"curn":1,"cusp":1,"cuts":1,"dais":1,"dar":1,"dari":1,"darn":1,"das":1,"dawn":1,"days":1,"dee":1,"deem":1,"deems":1,"deer":1,"dens":1,"der":1,"derm":1,"dern":1,"des":1,"dias":1,"dis":1,"disa":1,"dix":1,"doer":1,"doj":1,"dojc":1,"doom":1,"dooms":1,"door":1,"doren":1,"dorm":1,"dos":1,"dose":1,"dost":1,"dots":1,"dow":1,"down":1,"downs":1,"dufy":1,"duns":1,"dura":1,"durn":1,"dust":1,"dux":1,"ee":1,"emf":1,"ems":1,"ens":1,"eos":1,"er":1,"ern":1,"es":1,"esm":1,"esn":1,"esp":1,"est":1,"ex":1,"gar":1,"gari":1,"gary":1,"gas":1,"gasp":1,"gaur":1,"ghee":1,"gij":1,"girn":1,"giro":1,"gist":1,"goaf":1,"goer":1,"goes":1,"goo":1,"goof":1,"goon":1,"gora":1,"gore":1,"gown":1,"guar":1,"gur":1,"gus":1,"gust":1,"guts":1,"hair":1,"haj":1,"haji":1,"hans":1,"hari":1,"harm":1,"has":1,"hasp":1,"hast":1,"hays":1,"her":1,"herm":1,"hern":1,"hero":1,"hest":1,"hex":1,"his":1,"hist":1,"hoar":1,"hoary":1,"hoax":1,"hoof":1,"hoops":1,"hoots":1,"hops":1,"horn":1,"hose":1,"host":1,"how":1,"howf":1,"huji":1,"hus":1,"icsh":1,"if":1,"imf":1,"inf":1,"inr":1,"ins":1,"ir":1,"ira":1,"is":1,"ism":1,"isn":1,"its":1,"ix":1,"keen":1,"keeps":1,"kef":1,"kern":1,"khayr":1,"kif":1,"kir":1,"kist":1,"lair":1,"laos":1,"lar":1,"lari":1,"larn":1,"las":1,"last":1,"lats":1,"lawn":1,"lax":1,"lays":1,"lee":1,"leer":1,"lees":1,"lens":1,"ler":1,"lest":1,"liar":1,"lias":1,"lir":1,"lira":1,"lis":1,"lisp":1,"list":1,"lisu":1,"loaf":1,"loir":1,"loo":1,"loom":1,"loon":1,"loos":1,"loran":1,"lore":1,"loren":1,"lorn":1,"los":1,"lose":1,"lost":1,"lots":1,"low":1,"lox":1,"luis":1,"lust":1,"lux":1,"manx":1,"maps":1,"mar":1,"mari":1,"maro":1,"mary":1,"mas":1,"mast":1,"max":1,"maxi":1,"mays":1,"meer":1,"mens":1,"mer":1,"minx":1,"mips":1,"mir":1,"misch":1,"mist":1,"mix":1,"mons":1,"moo":1,"moon":1,"moor":1,"moray":1,"more":1,"mori":1,"morn":1,"mosan":1,"most":1,"mots":1,"mow":1,"mown":1,"moxa":1,"muir":1,"munj":1,"mus":1,"musa":1,"must":1,"naif":1,"nary":1,"naso":1,"nast":1,"nee":1,"neem":1,"nero":1,"nest":1,"nij":1,"nist":1,"nix":1,"noes":1,"noir":1,"noon":1,"nor":1,"norm":1,"norn":1,"nose":1,"now":1,"nox":1,"nuf":1,"nusa":1,"nuts":1,"nux":1,"nyx":1,"oaf":1,"oar":1,"oary":1,"oas":1,"oast":1,"oats":1,"of":1,"ofay":1,"ois":1,"oof":1,"oom":1,"ops":1,"or":1,"ora":1,"oran":1,"orang":1,"ore":1,"oreo":1,"os":1,"ow":1,"own":1,"ox":1,"oxen":1,"quasi":1,"queen":1,"queens":1,"queer":1,"quern":1,"quest":1,"quins":1,"quits":1,"quois":1,"quran":1,"raf":1,"raj":1,"ras":1,"rasp":1,"rays":1,"ree":1,"reef":1,"rees":1,"ref":1,"reps":1,"res":1,"rest":1,"rex":1,"rijn":1,"rira":1,"roar":1,"roast":1,"roo":1,"roof":1,"room":1,"rooms":1,"roost":1,"roots":1,"rosa":1,"rose":1,"row":1,"ruf":1,"rufa":1,"rus":1,"rusa":1,"rust":1,"rux":1,"sachs":1,"sais":1,"sans":1,"sari":1,"sas":1,"sawm":1,"sawn":1,"sax":1,"saxo":1,"see":1,"seem":1,"seen":1,"seer":1,"sens":1,"seps":1,"sex":1,"sif":1,"sir":1,"sira":1,"sis":1,"six":1,"soar":1,"sofa":1,"soja":1,"songs":1,"soon":1,"sops":1,"sora":1,"sore":1,"soren":1,"sori":1,"sorn":1,"sos":1,"sow":1,"sown":1,"sox":1,"sufi":1,"sur":1,"sura":1,"surya":1,"sus":1,"susa":1,"susi":1,"taif":1,"taj":1,"taos":1,"taps":1,"tar":1,"tarn":1,"taro":1,"tax":1,"taxi":1,"tee":1,"teem":1,"teen":1,"teens":1,"teer":1,"tef":1,"term":1,"tern":1,"test":1,"thee":1,"therm":1,"this":1,"thor":1,"thorn":1,"those":1,"thuja":1,"thur":1,"thus":1,"tips":1,"tir":1,"toast":1,"toes":1,"tongs":1,"tons":1,"too":1,"toons":1,"tops":1,"tor":1,"tora":1,"tore":1,"toreo":1,"tori":1,"torn":1,"tosa":1,"tow":1,"town":1,"trans":1,"tree":1,"tref":1,"trias":1,"trois":1,"trojan":1,"troops":1,"trots":1,"trow":1,"trust":1,"tufa":1,"tums":1,"tureen":1,"turn":1,"tux":1,"tyr":1,"ufa":1,"uns":1,"ur":1,"urn":1,"us":1,"usa":1,"usn":1,"ux":1,"var":1,"vary":1,"vas":1,"vast":1,"vaux":1,"vee":1,"veer":1,"veps":1,"vest":1,"vex":1,"vis":1,"visa":1,"voix":1,"vow":1,"vox":1,"xix":1,"xor":1,"yr":1};
for (var prop in $evConfuse) {
  if ($evConfuse[prop] === 1 && $enFilter[prop] === 1) {
    delete $evConfuse[prop];
    console.log(prop);
  }
}
console.log( JSON.stringify($enFilter) );
console.log( JSON.stringify($evConfuse) );
console.log( $enFilter );
console.log( $evConfuse );
*/

function invert( str ) {
 var a = [];
 for (var i = str.length - 1; i >= 0; i-- ) {
   a.push( str.charAt(i) );
 }
 return a.join("");
}

function match( str, part, skip ) {
  if ( skip ) { return { found: false, str: "skipped" }; }
  
  var re, found = false;

  if ( part === $coda ) { str = invert( str ); }
  
  for ( var prop in part ) {
    re = part[ prop ];
    if ( typeof re !== "string" && re.test( str ) ) {
      str = str.replace( re, prop );
      /*TRACE*/ log( re.toString() );
      found = true;
      break;
    }
  }

  if ( part === $coda ) { str = invert( str ); }

  /*TRACE*/ if (!found) { log(part.name, str); }
  return { found : found, str : str };
}

$vowelToneMap = {"á":"a1","à":"a2","ả":"a3","ã":"a4","ạ":"a5","ắ":"ă1","ằ":"ă2","ẳ":"ă3","ẵ":"ă4","ặ":"ă5","ấ":"â1","ầ":"â2","ẩ":"â3","ẫ":"â4","ậ":"â5","é":"e1","è":"e2","ẻ":"e3","ẽ":"e4","ẹ":"e5","ế":"ê1","ề":"ê2","ể":"ê3","ễ":"ê4","ệ":"ê5","í":"i1","ì":"i2","ỉ":"i3","ĩ":"i4","ị":"i5","ý":"y1","ỳ":"y2","ỷ":"y3","ỹ":"y4","ỵ":"y5","ó":"o1","ò":"o2","ỏ":"o3","õ":"o4","ọ":"o5","ố":"ô1","ồ":"ô2","ổ":"ô3","ỗ":"ô4","ộ":"ô5","ớ":"ơ1","ờ":"ơ2","ở":"ơ3","ỡ":"ơ4","ợ":"ơ5","ú":"u1","ù":"u2","ủ":"u3","ũ":"u4","ụ":"u5","ứ":"ư1","ừ":"ư2","ử":"ư3","ữ":"ư4","ự":"ư5"};

vinova.parseViSyllable = function ( str, opt ) {
  var save = str.toLowerCase(), tone = 0;
  var r, pass = 0, chr, possible = false;
  str = "";

  // get tone number
  for (var i = 0, sl = save.length; i < sl; i++) {
    chr = save.charAt( i );
    chr = $vowelToneMap[ chr ] || chr;
    possible = parseInt( chr.substr(1), 10 );
    if (possible) {
      tone = possible;
      pass += 1;
    }
    str += chr.substr(0, 1);
  }
  
  pass = pass <= 1;
  
  opt = !!opt;
  r = match(   str, $initial, /*skip=*/opt && !pass    );  pass &= r.found;
  r = match( r.str, $onset  , /*skip=*/opt && !r.found );  pass &= r.found;
  r = match( r.str, $vowel  , /*skip=*/opt && !r.found );  pass &= r.found;
  r = match( r.str, $coda   , /*skip=*/opt && !r.found );  pass &= r.found;
  
  // verify tone for "p,t,k coda"
  if ( /-(p|t|k)$/.test( r.str ) && (tone !== 1 && tone !== 5 ) ) { pass = false; }
  return { pass : !!pass, str : tone + r.str };
};

vinova.isViSyllable = function ( str ) {
  return vinova.parseViSyllable( str, "as fast as possible" ).pass;
};

/***************************************************************************
 * Vietnamese Phoenitic Data
 * Reference: http://ngonngu.net/index.php?p=68
 ***************************************************************************/
/*  a ă â | e ê | i y | o ô ơ | u ư */
var $initial = {
  'ng-' : /^ng(h(?=i|e|ê)|(?!i|e|ê|y))/   , // nghĩ, nghe, nghê, nghiêng | ngủi ngỡ ngàng NOT ngy
  'g-'  : /^g(h(?=i|e|ê)|(?!i|e|ê))/      , // ghi, ghè, ghế | gỡ gạc
  'c-'  : /^ch(?!y)/                      , // chích choè NOT chy
  'k-'  : /^(k(?=i|y|e|ê)|c(?!i|y|e|ê))/  , // kim, kem, kê, kiếm, kỷ | con cà cuống
  'z-i' : /^gi(?!u|ư|a|â|ă|o|ơ)/          , // gỉ, gìn
  'z-'  : /^(d|gi)/                       , // giây da, giữ
  'kh-' : /^kh(?!y)/ , // khúc khích NOT khy
  'tr-' : /^tr(?!y)/ , // trống trải
  'nh-' : /^nh(?!y)/ , // nhắn nhủ  
  'th-' : /^th(?!y)/ , // thảnh thơi
  'f-'  : /^ph(?!y)/ , // phong phú
  'b-'  : /^b(?!y)/  , // buôn bán
  'd-'  : /^đ(?!y)/  , // đúng đắn
  'q-'  : /^q(?=u)/  , // quê, quán, quyên
  'h-'  : /^h/ , // hớt hải
  'l-'  : /^l/ , // lo lắng
  'm-'  : /^m/ , // may mắn
  'n-'  : /^n/ , // nắn nót
  'v-'  : /^v/ , // vỗ về
  't-'  : /^t/ , // tin tưởng
  'r-'  : /^r/ , // rõ ràng
  'x-'  : /^x/ , // xinh xắn
  's-'  : /^s/ , // sẵn sàng
  
  "-"   : /^/  ,
  name  : "initial"
};

var $onset = {
  'k-w-' : /q-u(?!ô)/                   , // quyên, quăn
  '-w-'  : /-(u(?=y|ê|ơ|â)|o(?=a|e|ă))/ , // huy, thuế, huơ, thuần, chuyện | hoá, hoè, choắt, loang

  '--'   : /-/ ,
  name   : "onset"
};

var $coda = {
  'w-ă' : /^u-aă/ , // máu
  'j-ă' : /^y-aă/ , // máy
  'gn-' : /^(hn-(?=i|ea|ê)|gn-(?=ô|o|ơ|e|êi|â|a|ă|u|ư))/ , // inh, kính, mênh, canh | ông, xong, siêng, keng, trang, trăng, hương, chúng
  'k-'  : /^(hc-(?=i|ea|ê)|c-(?=ô|o|ơ|e|êi|â|a|ă|u|ư))/  , // ích, mếch, cạch | ác, lắc, bọc, tiếc, giấc
  'w-'  : /^(o-(?=a|e)|u-(?=i|a|ă|ê|â|ơ|ư))/           , // áo, xạo, kéo | au, mếu, nấu, rượu, xíu, lưu
  'j-'  : /^(y-(?=â)|i-(?!ă|â|i|y|e|ê))/               , // cậy | cài, ngoái, tươi, tuổi, coi
  'm-'  : /^m-/   , // ám, lắm
  'n-'  : /^n-/   , // in, nghẹn
  'p-'  : /^p-/   , // úp, lấp
  't-'  : /^t-/   , // át, cắt

  '-'   : /^-/  ,
  name  : "coda"
};

var $vowel = {
  'w-iê-' : /w-(yê(?=.+)|ya$)/          , // uyên, tuyển | khuya, tuya
  '--iê-' : /--(yê(?=.+)|iê(?=.+)|ia$)/ , // yêu, yểng | tiến, miếng | mía, tia, ỉa

  '-ươ-'  : /-(ươ(?=.+)|ưa$)/ , // ưỡn, lượng | ưa, cứa
  '-uô-'  : /-(uô(?=.+)|ua$)/ , // uốn, muỗng | úa, bùa
  
  'w-i-'  : /w-y/      , // thuý, quý, quỳnh, quỵt
  '--i-'  : /--y$/     , // y (tá)
   '-i-'  : /-i(?!ng)/ , // nghi, minh NOT ming
                         // bi, hỉ, kí, lì, mì, tỉ, sĩ, vĩ

  '-ă-'   : /-ă(?=.+)/    , // cắn, đắng 
  '-ăa-'  : /-a(?=u|y)/   , // rau, tay, quay
  '-ae-'  : /-a(?=nh|ch)/ , // nhanh, ách, ngách
  '-a-'   : /-a/          , // nhà, át, ngang, tai, quai, ác

  '-ôô-'  : /-ôô(?=ng)/   , // bôông
  '-ô-'   : /-ô/          , // cô, bông

  '-oo-'  : /-(oo(?=ng|c)|o(?!=ch))/ , // coong, moóc | lò, con ...
  '-o-'   : /-o(?=ng|c)/             , // cong, móc
  
  '-ê-'   : /-ê/        , // khế, tên, lênh
  '-e-'   : /-e(?!nh)/  , // bé, kẻng, lém NOT kenh
  '-ơ-'   : /-ơ/        , // mơ, lớn
  '-â-'   : /-â(?=.+)/  , // tân, bâng, khuâng, giấc, ất ...
  '-ư-'   : /-ư/        , // tư, cứng
  '-u-'   : /-u/        , // xu, cúng
  name    : "vowel"
};

})(); // scope outro

vinova();
