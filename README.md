<img src="es.png">


Simple and naive es6 transpiler plugin for require js. 
- Compiles es6 syntax for older browsers that dont support them.
- For now only have limited support for:
    - Fat Arrow Functions
    - const/let expressions 
    - Function default parameters
    - Template literals
- Polyfill for ''.trim(), [].forEach(), [].indexOf
- Tested on IE8. 
- Serves as a simple safety net for the features above.
- Note, this transpiler may not work on minified files :(
- A require.js plugin.

## Example Usage:
```javascript
require('es!some/path/to/es/Module1');
require('es!some/path/to/es/Module2');
require('es!some/path/to/es/Module3');
```

## License 
MIT