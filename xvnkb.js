//----------------------------------------------------------------------------
//  xvnkb.js - a.k.a CHIM - CHuoi's Input Method
//----------------------------------------------------------------------------
//  copyright         : (C) 2005, 2006, 2007 by Dao Hai Lam
//  website           : http://xvnkb.sf.net/chim
//  email             : daohailam<at>yahoo<dot>com
//  last modify       : Thu, 05 Jul 2007 23:07:22 +0700
//  version           : 0.9.3
//----------------------------------------------------------------------------
//
//  This program is free software; you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation; either version 2 of the License, or
//  (at your option) any later version.
//
//----------------------------------------------------------------------------
// Class: CHIM
//----------------------------------------------------------------------------
CHIM = function() {
	return this;
}
//----------------------------------------------------------------------------
// Constants:
//----------------------------------------------------------------------------
CHIM.CHAR_A = 'A';
CHIM.CHAR_a = 'a';
CHIM.CHAR_U = 'U';
CHIM.CHAR_u = 'u';
CHIM.CHAR_G = 'G';
CHIM.CHAR_g = 'g';
CHIM.CHAR_Q = 'Q';
CHIM.CHAR_q = 'q';
CHIM.CHAR_0x80 = String.fromCharCode(0x80);
//----------------------------------------------------------------------------
CHIM.vowels = "AIUEOYaiueoy";
CHIM.separators = " !@#$%^&*()_+=-{}[]|\\:\";'<>?,./~`\r\n\t";
//----------------------------------------------------------------------------
CHIM.off = 0;
CHIM.buffer = [];
CHIM.dirty = false;
//----------------------------------------------------------------------------
CHIM.method = 2;
//----------------------------------------------------------------------------
// Function: CHIM.CharIsUI
//	Checking if given character is in U & I set or not
//
// Parameters:
//	u - given char
//
// Returns:
//	True - if u is in [U,I]
//----------------------------------------------------------------------------
CHIM.CharIsUI = function(u) {
	var n, UI = CHIM.UI;
	u = u.charCodeAt(0);
	for ( n = 0; UI[n] != 0 && UI[n] != u; n++ );
	return UI[n] != 0 ? n : -1;
}
//----------------------------------------------------------------------------
// Function: CHIM.CharPriorityCompare
//	Compare 2 chars using VNese priority table
//----------------------------------------------------------------------------
CHIM.CharPriorityCompare = function(u1, u2) {
	var VN = CHIM.VN;
	var n, i = -1, j = -1, u;
	for ( n = 0, u = u1.charCodeAt(0); VN[n] != 0 && VN[n] != u; n++ );
	if ( VN[n] != 0 ) i = n;
	for ( n = 0, u = u2.charCodeAt(0); VN[n] != 0 && VN[n] != u; n++ );
	if ( VN[n] ) j = n;
	return i - j;
}
//----------------------------------------------------------------------------
// Function: CHIM.SetCharAt
//----------------------------------------------------------------------------
CHIM.SetCharAt = function( n, c ) {
	CHIM.buffer[n] = String.fromCharCode( c );
}
//----------------------------------------------------------------------------
// Class: CHIM.Speller
//----------------------------------------------------------------------------
CHIM.Speller = function() {
	return this;
}
//----------------------------------------------------------------------------
CHIM.Speller.enabled = true;
CHIM.Speller.position = 0;
CHIM.Speller.count = 0;
CHIM.Speller.vowels = [];
CHIM.Speller.lasts = [];
//----------------------------------------------------------------------------
CHIM.Speller.Activate = function() {
	CHIM.Speller.enabled = true;
}
//----------------------------------------------------------------------------
CHIM.Speller.Deactivate = function() {
	CHIM.Speller.enabled = false;
}
//----------------------------------------------------------------------------
CHIM.Speller.Toggle = function() {
	CHIM.Speller.enabled = !CHIM.Speller.enabled;
}
//----------------------------------------------------------------------------
CHIM.Speller.Set = function(position, key) {
	CHIM.Speller.vowels[CHIM.Speller.count] = CHIM.Speller.position;
	CHIM.Speller.lasts[CHIM.Speller.count++] = key;
	CHIM.Speller.position = position;
}
//----------------------------------------------------------------------------
CHIM.Speller.Clear = function() {
	CHIM.Speller.position = -1;
	CHIM.Speller.count = 0;
}
//----------------------------------------------------------------------------
CHIM.Speller.Last = function() {
	return CHIM.Speller.lasts[CHIM.Speller.count - 1];
}
//----------------------------------------------------------------------------
// Function: CHIM.Append
//----------------------------------------------------------------------------
CHIM.Append = function(count, lastkey, key) {
	var consonants = "BCDFGHJKLMNPQRSTVWXZbcdfghjklmnpqrstvwxz";
	var spchk = "AIUEOYaiueoy|BDFJKLQSVWXZbdfjklqsvwxz|'`~?.^*+=";
	var vwchk = "|ia|ua|oa|ai|ui|oi|au|iu|eu|ie|ue|oe|ye|ao|uo|eo|ay|uy|uu|ou|io|";
	var nvchk = "FfJjWwZz";

	var separators = "!@#$%^&*()_+=-{}[]|\\:\";'<>?,./~`";
	if ( separators.indexOf(key) >= 0 ) {
		CHIM.ClearBuffer();
		return;
	}

	if( CHIM.Speller.enabled && !CHIM.off ) {
		var kp = spchk.indexOf(key);

		if ( !count ) {
			if ( nvchk.indexOf(key) >= 0 )
				CHIM.off = -1;
			else
			if ( kp >= 0 && kp < 12 ) {
				CHIM.Speller.Set(0, key);
			}
			else
			if( kp == 12 || kp > 37 )
				return;
			else {
				CHIM.Speller.Clear();
			}
		}
		else
		if( kp == 12 || kp > 37 ) {
			CHIM.ClearBuffer();
			return;
		}
		else
		if( kp > 12 ) // b, d, f,...
			CHIM.off = count;
		else
		if( kp >= 0 ) { // vowels
			if( CHIM.Speller.position < 0 ) {
				CHIM.Speller.Set(count, key);
			}
			else
			if( count - CHIM.Speller.position > 1 )
				CHIM.off = count;
			else {
				var w = "|"+CHIM.Speller.Last().toLowerCase()+key.toLowerCase()+"|";
				if ( vwchk.indexOf(w) < 0 )
					CHIM.off = count;
				else {
					CHIM.Speller.Set(count, key);
				}
			}
		}
		else
		switch( key ) {
			case 'h':
			case 'H': // [cgknpt]h
				if( lastkey >= CHIM.CHAR_0x80 || "CGKNPTcgknpt".indexOf(lastkey) < 0 )
					CHIM.off = count;
				break;
			case 'g':
			case 'G': // [n]g
				if( lastkey != 'n' && lastkey != 'N' )
					CHIM.off = count;
				break;
			case 'r':
			case 'R': // [t]r
				if( lastkey != 't' && lastkey != 'T' )
					CHIM.off = count;
				break;
			default:
				if( consonants.indexOf(lastkey) >= 0 )
					CHIM.off = count;
				break;
		}
	}
	CHIM.buffer.push(key);
}
//----------------------------------------------------------------------------
// Function: CHIM.AddKey
//	Add key to internal buffer
//
// Parameters:
//	key - the key to add
//
// Returns:
//	-1 - if nothing change in the internal buffer
//	N >= 0 - indicate the position of internal buffer has been changed
//----------------------------------------------------------------------------
CHIM.AddKey = function( key ) {
	var p = -1;
	var i, j = -1;
	var b, c = 0, cc, l;
	var count = CHIM.buffer.length;
	var m = CHIM.modes[ CHIM.method-1 ], n;
	var v = null;

	if( !count || CHIM.off != 0 ) {
		CHIM.Append(0, 0, key);
		return -1;
	}

	b = CHIM.buffer;
	c = b[p = count - 1];
	n = key.toLowerCase();
	for( i = 1; i < m.length; i++ )
		if( m[i].indexOf(n) >= 0 ) break;
	if( i >= m.length ) {
		CHIM.Append(count, c, key);
		return -1;
	}

	switch( l = i ) {
		case 1:
			break;
		case 2:
		default:
			i = p;
			while( i >= 0 && b[i] < CHIM.CHAR_0x80 && CHIM.vowels.indexOf(b[i]) < 0 ) i--;
			if( i < 0 ) {
				CHIM.Append(count, c, key);
				return -1;
			}

			while( i >= 0 && b[i] < CHIM.CHAR_0x80 && CHIM.vowels.indexOf(b[i]) < 0 ) i--;
			while( i-1 >= 0 &&
				(CHIM.vowels.indexOf(b[i-1]) >=0 || b[i-1] > CHIM.CHAR_0x80) &&
				CHIM.CharPriorityCompare( b[i-1], b[i] ) < 0 ) i--;
			if( i == count-1 && i-1 >= 0 &&	(j = CHIM.CharIsUI(b[i-1])) > 0 )
			switch( b[i] ) {
				case CHIM.CHAR_a:
				case CHIM.CHAR_A:
					if( i-2 < 0 ||
						(j < 24 && b[i-2] != CHIM.CHAR_q && b[i-2] != CHIM.CHAR_Q) ||
						(j >= 24 && b[i-2] != CHIM.CHAR_g && b[i-2] != CHIM.CHAR_G) )
						i = i - 1;
					break;
				case CHIM.CHAR_u:
				case CHIM.CHAR_U:
					if( i-2 < 0 || (b[i-2] != CHIM.CHAR_g && b[i-2] != CHIM.CHAR_G) )
						i = i - 1;
					break;
			}
			c = b[p = i];
			break;
	}

	var x = c.charCodeAt(0);
	var found = false;
	if( l == 1 ) {
		m = m[0];
		for( i = 0; !found && i < m.length; i++ ) {
			var k = m[i];
			if( k[0] == n ) {
				for( i = 1; i < k.length; i++ ) {
					v = CHIM.vncode_1[k[i]];
					for( j = 0; j < v.length; j++ )
						if( v[j] == x ) {
							if( j % 2 == 0 )
								CHIM.SetCharAt( p, v[j+1] );
							else {
								CHIM.SetCharAt( p, v[j-1] );
								CHIM.buffer.push(key);
								CHIM.off = count + 1;
							}
							// breakout
							found = true;
							i = k.length;
							break;
						}
				}
				break;
			}
		}
	}
	else {
		for( i = 0; i < CHIM.vncode_2.length; i++ ) {
			v = CHIM.vncode_2[i];
			for( j = 0; j < v.length; j++ )
				if( v[j] == x ) {
					i = m[2].indexOf(n);
					if( i >= 0 ) {
						if( i != j )
							CHIM.SetCharAt( p, v[i] );
						else {
							CHIM.SetCharAt( p, v[0] );
							CHIM.buffer.push(key);
							CHIM.off = count + 1;
						}
						found = true;
					}
					j = v.length;
					i = CHIM.vncode_2.length;
				}
		}
	}
	if( !found ) {
		CHIM.Append(count, c, key);
		return -1;
	}

	return p;
}
//----------------------------------------------------------------------------
// Function: CHIM.BackSpace
//	Delete the last char in internal buffer and update Speller status
//----------------------------------------------------------------------------
CHIM.BackSpace = function() {
	var count = CHIM.buffer.length;
	if( count <= 0 )
		CHIM.dirty = true;
	else {
		--count;
		CHIM.buffer.pop();
		if( count == CHIM.Speller.position )
			CHIM.Speller.position = CHIM.Speller.vowels[--CHIM.Speller.count];
		if( (CHIM.off < 0 && !count) || (count <= CHIM.off) )
			CHIM.off = 0;
	}
}
//----------------------------------------------------------------------------
// Function: CHIM.ClearBuffer
//	Clear internal buffer & Speller status
//----------------------------------------------------------------------------
CHIM.ClearBuffer = function() {
	CHIM.off = 0;
	CHIM.buffer = [];
	CHIM.Speller.Clear();
}
//----------------------------------------------------------------------------
// Function: CHIM.SetDisplay
//	Show current status on browser
//----------------------------------------------------------------------------
CHIM.SetDisplay = function() {
	if ( typeof(DISPLAY_ID) != "undefined" && CHIM.method < DISPLAY_ID.length ) {
		var r = document.getElementById( DISPLAY_ID[CHIM.method] );
		if ( r ) r.checked = true;
	}
	if ( typeof(SPELLCHECK_ID) != "undefined" ) {
		var r = document.getElementById( SPELLCHECK_ID );
		if ( r ) r.checked = CHIM.Speller.enabled;
	}
}
//----------------------------------------------------------------------------
// Function: CHIM.SwitchMethod
//	Switching to next pecking method
//----------------------------------------------------------------------------
CHIM.SwitchMethod = function() {
	CHIM.ClearBuffer();
	CHIM.method = (++CHIM.method & 3);
	CHIM.SetDisplay();
}
//----------------------------------------------------------------------------
// Function: CHIM.SetMethod
//	Set pecking method :-)
//
// Parameters:
//	m - value of pecking method
//----------------------------------------------------------------------------
CHIM.SetMethod = function(m) {
	CHIM.ClearBuffer();
	CHIM.method = (m & 3);
	CHIM.SetDisplay();
}
//----------------------------------------------------------------------------
// Function: CHIM.GetTarget
//	Get the current target which CHIM's pointing to
//
// Parameters:
//	e - the current active event
//
// Returns:
//	The current target
//----------------------------------------------------------------------------
CHIM.GetTarget = function(e) {
	if ( e == null )
		e = window.event;
	if ( e == null )
		return null;
	if ( e.srcElement != null ) // IE
		r = e.srcElement;
	else {
		var r = e.target;
		while ( r && r.nodeType != 1 ) // climb up from text nodes on Moz
			r = r.parentNode;
	}

	if (r.tagName == 'BODY') {
		r = r.parentNode;
	}

	CHIM.peckable = r.tagName=='HTML' || r.type=='textarea' || r.type=='text';

	return r;
}
//----------------------------------------------------------------------------
// Function: CHIM.GetCursorPosition
//----------------------------------------------------------------------------
CHIM.GetCursorPosition = function( target ) {
	if (target == null || target.value == null || target.value.length == 0)
		return -1;
	// Moz/Opera
	if (typeof(target.selectionStart) != 'undefined') {
		if (target.selectionStart < 0 || target.selectionStart > target.length ||
			target.selectionEnd < 0 || target.selectionEnd > target.length ||
			target.selectionEnd < target.selectionStart)
			return -1;
		return target.selectionStart;
	}
	// IE
	if (document.selection) {
		var selection = document.selection.createRange();
		var textRange = target.createTextRange();
		// if the current selection is within the edit control
		if (textRange == null || selection == null ||
			((selection.text != "") && textRange.inRange(selection) == false))
			return -1;
		if (selection.text == "") {
			var index = 1;
			if ( target.tagName == "INPUT" ) {
				var contents = textRange.text;
				while (index < contents.length) {
					textRange.findText(contents.substring(index));
					if (textRange.boundingLeft == selection.boundingLeft) break;
					index++;
				}
			}
			// Handle text areas.
			else if ( target.tagName == "TEXTAREA" ) {
				var caret = document.selection.createRange().duplicate();
				index = target.value.length + 1;
				while (caret.parentElement() == target && caret.move("character", 1) == 1) {
					--index;
					if (target.value.charCodeAt(index) == 10) index -= 1;
				}
				if (index == target.value.length + 1) index = -1;
			}
			return index;
		}
		return textRange.text.indexOf(selection.text);
	}
}
//----------------------------------------------------------------------------
// Function: CHIM.SetCursorPosition
//----------------------------------------------------------------------------
CHIM.SetCursorPosition = function(target, p) {
	if (p < 0) return;
	if (target.setSelectionRange)
		target.setSelectionRange(p, p);
	else
	if (target.createTextRange) {
		var range = target.createTextRange();
		range.collapse(true);
		range.moveEnd('character', p);
		range.moveStart('character', p);
		range.select();
	}
}
//----------------------------------------------------------------------------
// Function: CHIM.UpdateBuffer
//----------------------------------------------------------------------------
CHIM.UpdateBuffer = function(target) {
	CHIM.ClearBuffer();

	if (target.tagName != 'HTML') {
		var separators = CHIM.separators;
		var c = CHIM.GetCursorPosition( target ) - 1;
		if ( c > 0 ) {
			while ( c >= 0 && separators.indexOf(target.value.charAt(c)) < 0 ) {
				CHIM.buffer.unshift(target.value.charAt(c));
				c = c - 1;
			}
		}
	}
	else {
		CHIM.buffer = CHIM.HTMLEditor.GetCurrentWord(target).split('');
	}

	CHIM.dirty = false;
}
//----------------------------------------------------------------------------
CHIM.NOOP = [];	// e.g. ["f_password", "f_number", "f_english"]
//----------------------------------------------------------------------------
CHIM.VK_TAB = 9;
CHIM.VK_BACKSPACE = 8;
CHIM.VK_ENTER = 13;
CHIM.VK_DELETE = 46;
CHIM.VK_SPACE = 32;
CHIM.VK_LIMIT = 128
CHIM.VK_LEFT_ARROW = 37;
CHIM.VK_RIGHT_ARROW = 39;
CHIM.VK_HOME = 36;
CHIM.VK_END = 35;
CHIM.VK_PAGE_UP = 33;
CHIM.VK_PAGE_DOWN = 34;
CHIM.VK_UP_ARROW = 38;
CHIM.VK_DOWN_ARROW = 40;
CHIM.VK_HOTKEY = 'z'.charCodeAt(0);
//----------------------------------------------------------------------------
// Function: ProcessControlKey
//----------------------------------------------------------------------------
CHIM.ProcessControlKey = function(keyCode, release) {
	switch ( keyCode ) {
		case CHIM.VK_TAB:
		case CHIM.VK_ENTER:
			CHIM.ClearBuffer();
			break;
		case CHIM.VK_BACKSPACE:
			if (!release) CHIM.BackSpace();
			break;
		case CHIM.VK_DELETE:
		case CHIM.VK_LEFT_ARROW:
		case CHIM.VK_RIGHT_ARROW:
		case CHIM.VK_HOME:
		case CHIM.VK_END:
		case CHIM.VK_PAGE_UP:
		case CHIM.VK_PAGE_DOWN:
		case CHIM.VK_UP_ARROW:
		case CHIM.VK_DOWN_ARROW:
			CHIM.dirty = true;
			break;
	}
}
//----------------------------------------------------------------------------
// Function: IsHotkey
//	Check if key pressed is a CHIM hotkey or not
//
// Parameters:
//	e - the event object
//	k - the value of key
//
// Returns:
//	True - if k is a hotkey
//
// See also:
//	<CHIM.SwitchMethod>
//----------------------------------------------------------------------------
CHIM.IsHotkey = function(e, k) {
	if (e.altKey || e.altLeft) {
		if ( k == CHIM.VK_HOTKEY )
			CHIM.SwitchMethod();
		return true;
	}
	return false;
}
//----------------------------------------------------------------------------
// Class: CHIM.HTMLEditor
//----------------------------------------------------------------------------
CHIM.HTMLEditor = function() {
	return this;
}
//----------------------------------------------------------------------------
// Function: CHIM.HTMLEditor.GetRange
//----------------------------------------------------------------------------
CHIM.HTMLEditor.GetRange = function(target) {
	var win = target.parentNode.iframe.contentWindow;
	return (!window.opera && document.all) ?
			win.document.selection.createRange() :
			win.getSelection().getRangeAt(0);
}
//----------------------------------------------------------------------------
// Function: CHIM.HTMLEditor.GetCurrentWord
//----------------------------------------------------------------------------
CHIM.HTMLEditor.GetCurrentWord = function(target) {
	var range = CHIM.HTMLEditor.GetRange(target);

	if (!window.opera && document.all) {
		while (range.moveStart('character', -1) == -1) {
			if (CHIM.separators.indexOf(range.text.charAt(0)) >= 0) {
				range.moveStart('character', 1);
				break;
			}
		}
		return range.text;
	}

	var word = '';
	var s = range.startContainer.nodeValue;
	var c = range.startOffset - 1;
	if (c > 0)
	while ( c >= 0 && CHIM.separators.indexOf(s.charAt(c)) < 0 ) {
		word = s.charAt(c) + word;
		c = c - 1;
	}
	return word;
}
//----------------------------------------------------------------------------
// Function: CHIM.HTMLEditor.Process
//----------------------------------------------------------------------------
CHIM.HTMLEditor.Process = function(target, p, l) {
	var range = CHIM.HTMLEditor.GetRange(target);
	if (!window.opera && document.all) {
		var x = -CHIM.buffer.length + p + (l < CHIM.buffer.length ? 1 : 0);
		range.moveStart('character', x);
		range.moveEnd('character', x+1);
		range.pasteHTML(CHIM.buffer[p]);
		return;
	}

	var container = range.startContainer;
	var offset = range.startOffset;
	var start = offset - CHIM.buffer.length + p + (l < CHIM.buffer.length ? 1 : 0);

	container.nodeValue = container.nodeValue.substring(0, start) +
		CHIM.buffer[p] + container.nodeValue.substring(start + 1);
	range.setEnd(container, offset);
	range.setStart(container, offset);
}
//----------------------------------------------------------------------------
// Function: CHIM.Freeze
//----------------------------------------------------------------------------
CHIM.Freeze = function(target) {
	var NOOP = CHIM.NOOP;
	if (NOOP.length > 0)
	for ( var i = 0; i < NOOP.length; i++ )
		if( target.id == NOOP[i] ) return true;
	return false;
}
//----------------------------------------------------------------------------
// Function: CHIM.KeyHandler
//	Handle key press event
//----------------------------------------------------------------------------
CHIM.KeyHandler = function(e) {
	if ( e == null ) e = window.event;

	var keyCode = e.keyCode;
	if ( keyCode == 0 ) // as it might on Moz
		keyCode = e.charCode;
	if ( keyCode == 0 ) // unlikely to get here
		keyCode = e.which;
	if ( CHIM.IsHotkey(e, keyCode) )
		return;

	if ( !CHIM.method ) return;

	var target = null;
	if ( !(target = CHIM.GetTarget(e)) || !CHIM.peckable || CHIM.Freeze(target) ) return;
	if ( e.ctrlKey || e.ctrlLeft || e.metaKey ) return;

	if ( e.charCode == null || e.charCode != 0 ) { // process ASCII only
		var key = String.fromCharCode(keyCode);
		if ( keyCode == CHIM.VK_SPACE || keyCode == CHIM.VK_ENTER )
			CHIM.ClearBuffer();
		else
		if ( keyCode > CHIM.VK_SPACE && keyCode < CHIM.VK_LIMIT ) {
			if ( CHIM.dirty )
				CHIM.UpdateBuffer( target );

			var l = CHIM.buffer.length;
			var p = CHIM.AddKey(key);
			if ( p >= 0 ) {
				if (target.tagName == 'HTML') {
					CHIM.HTMLEditor.Process(target, p, l);
					if (l < CHIM.buffer.length) return;
					if (e.stopPropagation) e.stopPropagation();
					if (e.preventDefault) e.preventDefault();
					e.cancelBubble = true;
					e.returnValue = false;
					return false;
				}

				var c = CHIM.GetCursorPosition( target ) - 1;
				if ( c >= 0 ) {
					var t = target.scrollTop;
					var r = c - CHIM.buffer.length + p + 1;
					if ( l < CHIM.buffer.length ) r++;
					target.value = target.value.substring( 0, r ) +
						CHIM.buffer[p] + target.value.substring( r + 1 );
					CHIM.SetCursorPosition( target, c + 1 );
					target.scrollTop = t;
					if ( l < CHIM.buffer.length ) return;
				}
				return false;
			}
		}
		else {
			CHIM.dirty = true;
		}
	}
	else { // process control key
		CHIM.ProcessControlKey( keyCode, true );
	}
}
//----------------------------------------------------------------------------
// Function: KeyDown
//	Handle the key down event
//
// Parameters:
//	e - event which is passed by some browsers
//----------------------------------------------------------------------------
CHIM.KeyDown = function(e) {
	if ( !CHIM.method ) return;

	var target = null;
	if ( e == null ) e = window.event;
	if ( !(target = CHIM.GetTarget(e)) || !CHIM.peckable || CHIM.Freeze(target) ) return;
	if ( e.ctrlKey || e.ctrlLeft || e.altKey || e.altLeft || e.metaKey ||
			e.shiftKey || e.shiftLetf ) return;

	var keyCode = e.keyCode;
	if ( keyCode == 0 ) // as it might on Moz
		keyCode = e.charCode;

	if ( keyCode == 0 ) // unlikely to get here
		keyCode = e.which;

	CHIM.ProcessControlKey( keyCode, false );
}
//----------------------------------------------------------------------------
// Function: MouseDown
//	Handle the mouse down event
//----------------------------------------------------------------------------
CHIM.MouseDown = function(e) {
	CHIM.dirty = true;
}
//----------------------------------------------------------------------------
// Function: Attach
//	Attach CHIM to an element
//
// Parameters:
//	e - element to attach
//	r - boolean value indicates that CHIM functions will replace the
//		default handlers
//----------------------------------------------------------------------------
CHIM.Attach = function(e, r) {
	if (!e) return;

	if (!e.chim) {
		if (!r) {
			if (!window.opera && document.all) { // IE
				e.attachEvent('onkeydown', CHIM.KeyDown);
				e.attachEvent('onkeypress', CHIM.KeyHandler);
				e.attachEvent('onmousedown', CHIM.MouseDown);
			}
			else { // Moz & others
				e.addEventListener('keydown', CHIM.KeyDown, false);
				e.addEventListener('keypress', CHIM.KeyHandler, false);
				e.addEventListener('mousedown', CHIM.MouseDown, false);
			}
		}
		else {
			e.onkeydown = CHIM.KeyDown;
			e.onkeypress = CHIM.KeyHandler;
			e.onmousedown = CHIM.MouseDown;
		}
		e.chim = true;
	}

	var f = e.getElementsByTagName('iframe');
	for (var i = 0; i < f.length; i++) {
		var doc = (!window.opera && document.all) ?
				f[i].contentWindow.document : f[i].contentDocument;

		doc.iframe = f[i];
		CHIM.Attach(doc, false);
	}
	// TODO:
	//	Do we need to do the same thing
	//	with <frame> ?
}
//----------------------------------------------------------------------------
// Function: CHIM.Activate
//----------------------------------------------------------------------------
CHIM.Activate = function() {
	CHIM.Attach(document, true);
}
//----------------------------------------------------------------------------
// Function: FCKeditor_OnComplete
//	Invoke after FCKeditor is complete
//----------------------------------------------------------------------------
function FCKeditor_OnComplete( editorInstance ) {
	CHIM.Activate();
}
//----------------------------------------------------------------------------
setTimeout('CHIM.Activate()', 1000);
//----------------------------------------------------------------------------
//  Code tables
//----------------------------------------------------------------------------
CHIM.vn_A0=[65,193,192,7842,195,7840];
CHIM.vn_a0=[97,225,224,7843,227,7841];
CHIM.vn_A6=[194,7844,7846,7848,7850,7852];
CHIM.vn_a6=[226,7845,7847,7849,7851,7853];
CHIM.vn_A8=[258,7854,7856,7858,7860,7862];
CHIM.vn_a8=[259,7855,7857,7859,7861,7863];
CHIM.vn_O0=[79,211,210,7886,213,7884];
CHIM.vn_o0=[111,243,242,7887,245,7885];
CHIM.vn_O6=[212,7888,7890,7892,7894,7896];
CHIM.vn_o6=[244,7889,7891,7893,7895,7897];
CHIM.vn_O7=[416,7898,7900,7902,7904,7906];
CHIM.vn_o7=[417,7899,7901,7903,7905,7907];
CHIM.vn_U0=[85,218,217,7910,360,7908];
CHIM.vn_u0=[117,250,249,7911,361,7909];
CHIM.vn_U7=[431,7912,7914,7916,7918,7920];
CHIM.vn_u7=[432,7913,7915,7917,7919,7921];
CHIM.vn_E0=[69,201,200,7866,7868,7864];
CHIM.vn_e0=[101,233,232,7867,7869,7865];
CHIM.vn_E6=[202,7870,7872,7874,7876,7878];
CHIM.vn_e6=[234,7871,7873,7875,7877,7879];
CHIM.vn_I0=[73,205,204,7880,296,7882];
CHIM.vn_i0=[105,237,236,7881,297,7883];
CHIM.vn_Y0=[89,221,7922,7926,7928,7924];
CHIM.vn_y0=[121,253,7923,7927,7929,7925];
//----------------------------------------------------------------------------
CHIM.vncode_2=[
	CHIM.vn_A0,CHIM.vn_a0,CHIM.vn_A6,CHIM.vn_a6,CHIM.vn_A8,CHIM.vn_a8,
	CHIM.vn_O0,CHIM.vn_o0,CHIM.vn_O6,CHIM.vn_o6,CHIM.vn_O7,CHIM.vn_o7,
	CHIM.vn_U0,CHIM.vn_u0,CHIM.vn_U7,CHIM.vn_u7,
	CHIM.vn_E0,CHIM.vn_e0,CHIM.vn_E6,CHIM.vn_e6,
	CHIM.vn_I0,CHIM.vn_i0,CHIM.vn_Y0,CHIM.vn_y0
];
//----------------------------------------------------------------------------
CHIM.vn_AA=[
	65,194,193,7844,192,7846,7842,7848,195,7850,7840,7852,258,194,7854,7844,
	7856,7846,7858,7848,7860,7850,7862,7852,97,226,225,7845,224,7847,7843,
	7849,227,7851,7841,7853,259,226,7855,7845,7857,7847,7859,7849,7861,7851,
	7863,7853
];
CHIM.vn_AW=[
	65,258,193,7854,192,7856,7842,7858,195,7860,7840,7862,194,258,7844,7854,
	7846,7856,7848,7858,7850,7860,7852,7862,97,259,225,7855,224,7857,7843,
	7859,227,7861,7841,7863,226,259,7845,7855,7847,7857,7849,7859,7851,7861,
	7853,7863
];
//----------------------------------------------------------------------------
CHIM.vn_OO=[
	79,212,211,7888,210,7890,7886,7892,213,7894,7884,7896,416,212,7898,7888,
	7900,7900,7902,7892,7904,7894,7906,7896,111,244,243,7889,242,7891,7887,
	7893,245,7895,7885,7897,417,244,7899,7889,7901,7891,7903,7893,7905,7895,
	7907,7897
];
CHIM.vn_OW=[
	79,416,211,7898,210,7900,7886,7902,213,7904,7884,7906,212,416,7888,7898,
	7890,7900,7892,7902,7894,7904,7896,7906,111,417,243,7899,242,7901,7887,
	7903,245,7905,7885,7907,244,417,7889,7899,7891,7901,7893,7903,7895,7905,
	7897,7907
];
CHIM.vn_UW=[
	85,431,218,7912,217,7914,7910,7916,360,7918,7908,7920,117,432,250,
	7913,249,7915,7911,7917,361,7919,7909,7921];
CHIM.vn_EE=[
	69,202,201,7870,200,7872,7866,7874,7868,7876,7864,7878,101,234,233,7871,
	232,7873,7867,7875,7869,7877,7865,7879
];
CHIM.vn_DD=[68,272,100,273];
//----------------------------------------------------------------------------
CHIM.vncode_1=[
	CHIM.vn_AA,CHIM.vn_EE,CHIM.vn_OO,
	CHIM.vn_AW,CHIM.vn_OW,CHIM.vn_UW,
	CHIM.vn_DD
];
//----------------------------------------------------------------------------
CHIM.modes=[
	[[['6',0,1,2],['7',4,5],['8',3],['9',6]],'6789','0123456'],
	[[['a',0],['e',1],['o',2],['w',3,4,5],['d',6]],'adeow','zsfrxj'],
	[[['^',0,1,2],['+',4,5],['(',3],['d',6]],'^+(d',"='`?~."]
];
//----------------------------------------------------------------------------
CHIM.UI=[
	85,218,217,7910,360,7908,117,250,249,7911,361,7909,431,7912,7914,7916,
	7918,7920,432,7913,7915,7917,7919,7921,73,205,204,7880,296,7882,105,237,
	236,7881,297,7883,0
];
//----------------------------------------------------------------------------
CHIM.VN=[
	97,65,225,193,224,192,7843,7842,227,195,7841,7840,226,194,7845,7844,7847,
	7846,7849,7848,7851,7850,7853,7852,259,258,7855,7854,7857,7856,7859,7858,
	7861,7860,7863,7862,101,69,233,201,232,200,7867,7866,7869,7868,7865,7864,
	234,202,7871,7870,7873,7872,7875,7874,7877,7876,7879,7878,111,79,243,211,
	242,210,7887,7886,245,213,7885,7884,244,212,7889,7888,7891,7890,7893,
	7892,7895,7894,7897,7896,417,416,7899,7898,7901,7900,7903,7902,7905,7904,
	7907,7906,121,89,253,221,7923,7922,7927,7926,7929,7928,7925,7924,117,85,
	250,218,249,217,7911,7910,361,360,7909,7908,432,431,7913,7912,7915,7914,
	7917,7916,7919,7918,7921,7920,105,73,237,205,236,204,7881,7880,297,296,
	7883,7882,273,272,0
];
//----------------------------------------------------------------------------
