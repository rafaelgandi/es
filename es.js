/*	
    Compile es6 syntax
	 - For now only does Fat Arrow Functions, const/let expressions and function default parameters. Tested on IE8. 
	 - Polyfill for trim(), forEach(), [].indexOf
	 - Serves as a simple safety net for the features above.
	Author: Rafael Gandionco (www.rafaelgandi.tk)
	LM: 2017-05-26
*/
;(function () {
	"use strict";
	var progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
		IS_ARROW_FUNC_SUPPORTED = (function () {
			// See: http://stackoverflow.com/questions/29046635/javascript-es6-cross-browser-detection
			try {
				eval("var bar = (x) => x+1");
			} catch (e) { return false; }
			return true;
		})();
			
	// Polyfill trim() function //
	if (typeof String.prototype.trim == 'undefined') {
		var trimRegExp = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g; // Stole this from jQuery.
		String.prototype.trim = function () {
			return this.replace(trimRegExp, '');
		};
	}
	// Production steps of ECMA-262, Edition 5, 15.4.4.18
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach?v=example
	if (! Array.prototype.forEach) {
		Array.prototype.forEach=function(a){var b,c;if(this==null)throw new TypeError("this is null or not defined");var d=Object(this),e=d.length>>>0;if(typeof a!="function")throw new TypeError(a+" is not a function");arguments.length>1&&(b=arguments[1]),c=0;while(c<e){var f;c in d&&(f=d[c],a.call(b,f,c,d)),c++}};
	}
	// Production steps of ECMA-262, Edition 5, 15.4.4.14
	// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf?v=example
	if (! Array.prototype.indexOf) {
		Array.prototype.indexOf=function(a,b){var c;if(this==null)throw new TypeError('"this" is null or not defined');var d=Object(this),e=d.length>>>0;if(e===0)return-1;var f=b|0;if(f>=e)return-1;c=Math.max(f>=0?f:e-Math.abs(f),0);while(c<e){if(c in d&&d[c]===a)return c;c++}return-1};
	}
		
    function XHR() {
		// See: https://github.com/jensarps/AMD-cache/blob/master/cache.uncompressed.js
        // Would love to dump the ActiveX crap in here. Need IE 6 to die first.
        var xhr, i, progId;
        if (typeof XMLHttpRequest !== "undefined") {
            return new XMLHttpRequest();
        } else {
            for (i = 0; i < 3; i++) {
                progId = progIds[i];
                try { xhr = new ActiveXObject(progId); } catch (e) {}
                if (xhr) {
                    progIds = [progId]; // so faster next time
                    break;
                }
            }
        }
        if (!xhr) {
            throw new Error("XHR(): XMLHttpRequest not available");
        }
        return xhr;
    }    
	
	function getScriptCode(_file, _callback) { // AJAX call to resource file
		_callback = _callback || function () {};
		var xhr = XHR();
		xhr.open('GET', _file, true);
		xhr.onreadystatechange = function (evt) {
			//Do not explicitly handle errors, those should be
			//visible via console output in the browser.
			if (xhr.readyState === 4) {
				_callback(xhr.responseText);
			}
		};
      xhr.send(null);
	}
	
	function resolveName(_name) {
		var name = _name.trim();
		// Handle query string //
		if (name.indexOf('?') !== -1) {
			return name.replace(/(\?.*)/ig, '.js$1');
		}
		// Normalize the extension (.js) //
		return name.replace('.js', '') + '.js';
	}
	
	var parser = {
		compile: function (_code) {
			var lines = _code.split(/\n/),
				compiled = '',
				piece = '';			
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].trim() !== '') {
					piece = parser.fatArrowFunctions(lines[i]);
					piece = parser.constAndLet(piece);
					piece = parser.defaultParameters(piece);
					compiled += (piece + "\n");
				}
				else { compiled += (lines[i] + "\n"); }
			}	
			return compiled;	
		},	
		fatArrowFunctions: function (_code) { 
			// Very naive and simple compiler for es6 arrow functions.  
			// See: https://caniuse.com/#feat=arrow-functions
			// Note: Not all the time fat arrow functions are good.
			// See: https://rainsoft.io/when-not-to-use-arrow-functions-in-javascript/
			var compiled = '',
				ARROW_FUNC_REGEX = [
					{regex: /\(([^\(\)]*)\)\s*=>\s*\{/ig, sub: 'function ($1) {'}, // (x) => {
					{regex: /\(([^\(\)]*)\)\s*=>\s*(true|false)/ig, sub: 'function ($1) {return $2;}'}, // on('click', () => false)
					{regex: /\(([^\(\)]*)\)\s*=>\s*([^\{\}]+)([;\,])/ig, sub: 'function ($1) {return $2;}$3'} // (x) => (x * 8) + x;
				];
			compiled = _code.replace(ARROW_FUNC_REGEX[0].regex, ARROW_FUNC_REGEX[0].sub); 
			compiled = compiled.replace(ARROW_FUNC_REGEX[1].regex, ARROW_FUNC_REGEX[1].sub); 
			compiled = compiled.replace(ARROW_FUNC_REGEX[2].regex, ARROW_FUNC_REGEX[2].sub); 
			return compiled;
		},	
		constAndLet: function (_code) {
			// Very naive and simple compiler for es6 const and let expressions. 
			// See: https://davidwalsh.name/for-and-against-let
			var compiled = '',
				CONST_LET_REGEX = [
					{regex: /const\s+([\S]+)\s*=/ig, sub: 'var $1 ='}, // const foo = 
					{regex: /let\s+([\S]+)\s*=/ig, sub: 'var $1 ='}, // let foo = 					
					{regex: /const\s+([\S]+)\s*([,|;]\s*)/ig, sub: 'var $1$2'}, // const a, b, c;					
					{regex: /let\s+([\S]+)\s*([,|;]\s*)/ig, sub: 'var $1$2'} // let a, b, c;					
				];
			compiled = _code.replace(CONST_LET_REGEX[0].regex, CONST_LET_REGEX[0].sub);	
			compiled = compiled.replace(CONST_LET_REGEX[1].regex, CONST_LET_REGEX[1].sub);	
			compiled = compiled.replace(CONST_LET_REGEX[2].regex, CONST_LET_REGEX[2].sub);	
			compiled = compiled.replace(CONST_LET_REGEX[3].regex, CONST_LET_REGEX[3].sub);	
			return compiled;	
		},
		defaultParameters: (function () {
			// Very naive and simple compiler for es6 function default parameters. 
			var DP_REGEX = {
				func1: /function\s+([a-zA-Z\d_\$]+)\s*\(([\S\s]+)\)\s*\{/ig, // function foo(aa, b) {
				func2: /function\s+\(([\s\S]+)\)\s*\{/ig // function (aa, b) {	
			};
			function _cherryPick(_argumentsMatch) {
				var replacementCode = '',
					argsString = _argumentsMatch.trim(),
					argList, pieces, argVars = [], argDefaultValueExpressions = [];
				if (argsString.indexOf('=') == -1) { return false; }				
				argList = argsString.split(',');
				for (var i = 0; i < argList.length; i++) {
					if (argList[i].indexOf('=') == -1) {
						argVars.push(argList[i].trim());
						continue;
					}
					pieces = argList[i].split('=');
					argVars.push(pieces[0].trim());
					argDefaultValueExpressions.push(pieces[0].trim() + '=(typeof '+pieces[0].trim()+' != "undefined") ? '+pieces[0].trim()+' : '+pieces[1].trim()+';');
				}
				return {
					argVars: argVars,
					argDefaultValueExpressions: argDefaultValueExpressions
				};
			}
			return function (_code) {
				// See: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Default_parameters
				var compiled = '';		
				if (DP_REGEX.func1.test(_code)) {
					// See: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter
					compiled = _code.replace(DP_REGEX.func1, function (_match, _funcName, _funcArgsMatch) {
						var replacement = _cherryPick(_funcArgsMatch);
						if (! replacement) { return _match; }
						return 'function '+_funcName+'('+replacement.argVars.join(',')+') {' + "\n" +replacement.argDefaultValueExpressions.join("\n");
					});
				}
				else if (DP_REGEX.func2.test(_code)) {
					compiled = _code.replace(DP_REGEX.func2, function (_match, _funcArgsMatch) {
						var replacement = _cherryPick(_funcArgsMatch);
						if (! replacement) { return _match; }
						return 'function ('+replacement.argVars.join(',')+') {' + "\n" +replacement.argDefaultValueExpressions.join("\n");
					});
				}
				else {
					// Nothing to do here ;)
					compiled = _code;
				}
				return compiled;
			};
		})()
	};
	// Require JS plugin API //
	// See: http://requirejs.org/docs/plugins.html
	define({	
	 	load: function (name, req, onLoad, config) {
			/**/
			if (IS_ARROW_FUNC_SUPPORTED) { // no need to do anymore work, yay!
				req([name], function (module) {
					onLoad(module);
				});
				return;
			}
			/**/
	 		getScriptCode(resolveName(req.toUrl(name)), function (code) {
	 			var esCode = parser.compile(code);
	 			// See: http://requirejs.org/docs/plugins.html#apiload
				// Not using onLoad.fromText()because for some reason modules don't 
				// load when other modules are loaded that are not using this plugin. 
				// So I have to use the eval hack below.
				// To avoid anonymous define() mismatch error when evaling make sure to 
				// specify a module id for the define() method.
				esCode = esCode.replace('define(', 'define("'+name+'",');
				//console.log(esCode);
				// Indirect call to eval for implicit global scope. 
				try { window.eval(esCode); }
				catch (evalError) {
					throw new Error('es.js: Eval error for "'+req.toUrl(name)+'" with message: "' + evalError.message + '"');
				}
				req([name], function (module) {
					onLoad(module);
				});
	 		});
	 	}
	});
})();