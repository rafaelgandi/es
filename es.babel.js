/*	
    Babel AMD ES6 Transpiler
	 - Uses babel to transpile code to es6
	 - Polyfill for ''.trim(), [].forEach(), [].indexOf, [].map
	 - Serves as a simple safety net for the features above.
	Author: Rafael Gandionco (www.rafaelgandi.tk)
	LM: 2017-07-21
	
	NOTE: Requires this config:
	--------------------------- 
	requirejs.config({
		paths: {
			'es': 'util/es.babel'
		},
		es: {
			babelStandalonePath: '/js/util/babel.min.js'
		}
	});
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
	// Production steps of ECMA-262, Edition 5, 15.4.4.19
	// See: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/map?v=example
	if (!Array.prototype.map) {
		Array.prototype.map=function(a){var b,c,d;if(this==null)throw new TypeError("this is null or not defined");var e=Object(this),f=e.length>>>0;if(typeof a!="function")throw new TypeError(a+" is not a function");arguments.length>1&&(b=arguments[1]),c=Array(f),d=0;while(d<f){var g,h;d in e&&(g=e[d],h=a.call(b,g,d,e),c[d]=h),d++}return c};
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
	// Require JS plugin API //
	// See: http://requirejs.org/docs/plugins.html
	define({	
		load: function (name, req, onLoad, config) {
			/**/
			if (IS_ARROW_FUNC_SUPPORTED) { // no need to do anymore work, yay!
				req([name], function (module) { onLoad(module); });
				return;
			}
			/**/
			req([config.es.babelStandalonePath], function (babel) {
				getScriptCode(resolveName(req.toUrl(name)), function (code) {
					window.Babel = (typeof window.Babel == 'undefined') ? babel : window.Babel;
					var esCode = Babel.transform(code, { presets: ['es2015'] }).code;
					// See: http://requirejs.org/docs/plugins.html#apiload
					// Not using onLoad.fromText()because for some reason modules don't 
					// load when other modules are loaded that are not using this plugin. 
					// So I have to use the eval hack below.
					// To avoid anonymous define() mismatch error when evaling make sure to 
					// specify a module id for the define() method.
					esCode = esCode.replace('define(', 'define("'+name+'",');
					// if (name.indexOf('SelectorCache') !== -1) {
					//console.log(esCode);
					// }				
					// Indirect call to eval for implicit global scope. 
					try { window.eval(esCode); }
					catch (evalError) {
						throw new Error('es.js: Eval error for "'+req.toUrl(name)+'" with message: "' + evalError.message + '"');
					}
					req([name], function (module) { onLoad(module); });
				});
			});
		}
	});
})();