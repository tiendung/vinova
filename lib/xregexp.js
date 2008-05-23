/* XRegExp 0.2.2; MIT License
By Steven Levithan <http://stevenlevithan.com>
----------
Adds support for the following regular expression features:
- Free-spacing and comments ("x" flag)
- Dot matches all ("s" flag)
- Named capture ("k" flag)
  - Capture: (<name>...)
  - Backreference: \k<name>
  - In replacement: ${name}
  - Stored at: result.name
*/

/* Protect this from running more than once, which would break its references to native functions */
if (window.XRegExp === undefined) {
	var XRegExp;
	
	(function () {
		var native = {
			RegExp: RegExp,
			exec: RegExp.prototype.exec,
			match: String.prototype.match,
			replace: String.prototype.replace
		};
		
		XRegExp = function (pattern, flags) {
			return native.RegExp(pattern).addFlags(flags);
		};
		
		RegExp.prototype.addFlags = function (flags) {
			var pattern = this.source,
				useNamedCapture = false,
				re = XRegExp._re;
			
			flags = (flags || "") + native.replace.call(this.toString(), /^[\S\s]+\//, "");
			
			if (flags.indexOf("x") > -1) {
				pattern = native.replace.call(pattern, re.extended, function ($0, $1, $2) {
					return $1 ? ($2 ? $2 : "(?:)") : $0;
				});
			}
			
			if (flags.indexOf("k") > -1) {
				var captureNames = [];
				pattern = native.replace.call(pattern, re.capturingGroup, function ($0, $1) {
					if (/^\((?!\?)/.test($0)) {
						if ($1) useNamedCapture = true;
						captureNames.push($1 || null);
						return "(";
					} else {
						return $0;
					}
				});
				if (useNamedCapture) {
					/* Replace named with numbered backreferences */
					pattern = native.replace.call(pattern, re.namedBackreference, function ($0, $1, $2) {
						var index = $1 ? captureNames.indexOf($1) : -1;
						return index > -1 ? "\\" + (index + 1).toString() + ($2 ? "(?:)" + $2 : "") : $0;
					});
				}
			}
			
			/* If "]" is the leading character in a character class, replace it with "\]" for consistent
			cross-browser handling. This is needed to maintain correctness without the aid of browser sniffing
			when constructing the regexes which deal with character classes. They treat a leading "]" within a
			character class as a non-terminating, literal character, which is consistent with IE, .NET, Perl,
			PCRE, Python, Ruby, JGsoft, and most other regex engines. */
			pattern = native.replace.call(pattern, re.characterClass, function ($0, $1) {
				/* This second regex is only run when a leading "]" exists in the character class */
				return $1 ? native.replace.call($0, /^(\[\^?)]/, "$1\\]") : $0;
			});
			
			if (flags.indexOf("s") > -1) {
				pattern = native.replace.call(pattern, re.singleline, function ($0) {
					return $0 === "." ? "[\\S\\s]" : $0;
				});
			}
			
			var regex = native.RegExp(pattern, native.replace.call(flags, /[sxk]+/g, ""));
			
			if (useNamedCapture) {
				regex._captureNames = captureNames;
			/* Preserve capture names if adding flags to a regex which has already run through addFlags("k") */
			} else if (this._captureNames) {
				regex._captureNames = this._captureNames.valueOf();
			}
			
			return regex;
		};
		
		String.prototype.replace = function (search, replacement) {
			/* If search is not a regex which uses named capturing groups, just run the native replace method */
			if (!(search instanceof native.RegExp && search._captureNames)) {
				return native.replace.apply(this, arguments);
			}
			
			if (typeof replacement === "function") {
				return native.replace.call(this, search, function () {
					/* Convert arguments[0] from a string primitive to a string object which can store properties */
					arguments[0] = new String(arguments[0]);
					/* Store named backreferences on the first argument before calling replacement */
					for (var i = 0; i < search._captureNames.length; i++) {
						if (search._captureNames[i]) arguments[0][search._captureNames[i]] = arguments[i + 1];
					}
					return replacement.apply(window, arguments);
				});
			} else {
				return native.replace.call(this, search, function () {
					var args = arguments;
					return native.replace.call(replacement, XRegExp._re.replacementVariable, function ($0, $1, $2) {
						/* Numbered backreference or special variable */
						if ($1) {
							switch ($1) {
								case "$": return "$";
								case "&": return args[0];
								case "`": return args[args.length - 1].substring(0, args[args.length - 2]);
								case "'": return args[args.length - 1].substring(args[args.length - 2] + args[0].length);
								/* Numbered backreference */
								default:
									/* What does "$10" mean?
									- Backreference 10, if at least 10 capturing groups exist
									- Backreference 1 followed by "0", if at least one capturing group exists
									- Else, it's the string "$10" */
									var literalNumbers = "";
									$1 = +$1; /* Cheap type-conversion */
									while ($1 > search._captureNames.length) {
										literalNumbers = $1.toString().match(/\d$/)[0] + literalNumbers;
										$1 = Math.floor($1 / 10); /* Drop the last digit */
									}
									return ($1 ? args[$1] : "$") + literalNumbers;
							}
						/* Named backreference */
						} else if ($2) {
							/* What does "${name}" mean?
							- Backreference to named capture "name", if it exists
							- Else, it's the string "${name}" */
							var index = search._captureNames.indexOf($2);
							return index > -1 ? args[index + 1] : $0;
						} else {
							return $0;
						}
					});
				});
			}
		};
		
		RegExp.prototype.exec = function (str) {
			var result = native.exec.call(this, str);
			if (!(this._captureNames && result && result.length > 1)) return result;
			
			for (var i = 1; i < result.length; i++) {
				var name = this._captureNames[i - 1];
				if (name) result[name] = result[i];
			}
			
			return result;
		};
		
		String.prototype.match = function (regexp) {
			if (!regexp._captureNames || regexp.global) return native.match.call(this, regexp);
			return regexp.exec(this);
		};
	})();
}

/* Regex syntax parsing with support for escapings, character classes, and various other context and cross-browser issues */
XRegExp._re = {
	extended: /(?:[^[#\s\\]+|\\(?:[\S\s]|$)|\[\^?]?(?:[^\\\]]+|\\(?:[\S\s]|$))*]?)+|(\s*#[^\n\r]*\s*|\s+)([?*+]|{\d+(?:,\d*)?})?/g,
	singleline: /(?:[^[\\.]+|\\(?:[\S\s]|$)|\[\^?]?(?:[^\\\]]+|\\(?:[\S\s]|$))*]?)+|\./g,
	characterClass: /(?:[^\\[]+|\\(?:[\S\s]|$))+|\[\^?(]?)(?:[^\\\]]+|\\(?:[\S\s]|$))*]?/g,
	capturingGroup: /(?:[^[(\\]+|\\(?:[\S\s]|$)|\[\^?]?(?:[^\\\]]+|\\(?:[\S\s]|$))*]?|\((?=\?))+|\((?:<([$\w]+)>)?/g,
	namedBackreference: /(?:[^\\[]+|\\(?:[^k]|$)|\[\^?]?(?:[^\\\]]+|\\(?:[\S\s]|$))*]?|\\k(?!<[$\w]+>))+|\\k<([$\w]+)>(\d*)/g,
	replacementVariable: /(?:[^$]+|\$(?![1-9$&`']|{[$\w]+}))+|\$(?:([1-9]\d*|[$&`'])|{([$\w]+)})/g
};

XRegExp.overrideNative = function () {
	/* Override the global RegExp constructor/object with the XRegExp constructor. This precludes accessing
	properties of the last match via the global RegExp object. However, those properties are deprecated as
	of JavaScript 1.5, and the values are available on RegExp instances or via RegExp/String methods. It also
	affects the result of (/x/.constructor == RegExp) and (/x/ instanceof RegExp), so use with caution. */
	RegExp = XRegExp;
};

/* indexOf method from Mootools 1.11; MIT License */
Array.prototype.indexOf = Array.prototype.indexOf || function (item, from) {
	var len = this.length;
	for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++) {
		if (this[i] === item) return i;
	}
	return -1;
};