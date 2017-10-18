var Ninja = function(selector, context){
	context = context || [document];
	this.context = context;
	if(selector){ return this.find(selector, context); }
};

Ninja.prototype = {
	version: '1.0.0',
	constructor: Ninja,
	length: 0,

	ready: function(func){
		if(!func){
			this.isReady = true;
			return;
		}

		if(this.source.readyState === 'complete'){
			func();
		}else if(!this.isReady){
			if(document.addEventListener){
				//only when dom is complete
				document.addEventListener('DOMContentLoaded', func, false);
				//window.addEventListener('load', function(){ func(); }, false);
			}else{
				//IE
				document.attachEvent('onreadystatechange', function(){
					if(this.source.readyState === 'complete'){ func(); }
				});
				window.attachEvent('onload', func);
			}
			this.isReady = true;
		}
	},

	each: function(object, func){
		if(!func){ return; }
		if(!object){ object = this; }

		if(this.isPlainObject(object)){
			for(var key in object){
				//only iterate through own properties, if this is removed the __ptoto__ will be iterated
				if(object.hasOwnProperty(key)){
					func(key, object[key]);
				}
			}
		}else{
			for(var i = 0, len = object.length; i < len; i++){
				func(object[i], i, len);
			}
		}
	},

	walkNodes: function(node, func){
		func(node);
		node = node.firstChild;

		while(node){
			this.walkNodes(node, func);
			node = node.nextSibling;
		}
	},

	contains: function(findValue, object){
		var found = false;
		this.each(object, function(currentObject){
			if(currentObject === findValue){
				found = true;
				return;
			}
		});
		return found;
	},

	selectorMatches: function(selectorArray, node){
		if(!selectorArray || selectorArray.length === 0 || !node || !node.matches){ return; }
		for(var i = 0, len = selectorArray.length; i < len; i++){
			if(node.matches(selectorArray[i].trim())){
				return true;
			}
		}
		return;
	},

	findQuery: function(selector, context, returnFirstMatch, split){
		if(!selector){ return this; }
		context = context || this.context || this;
		if(typeof context === 'string'){ return this; }
		if(!context.length){ context = [context]; }

		var result = [];
		var currentSelector, currentResult, currentContext;
		selector = selector.split(',');

		for(var c = 0, cLen = context.length; c < cLen; c++){
			currentContext = context[c];

			for(var i = 0, len = selector.length; i < len; i++){
				currentSelector = selector[i].trim();
				currentResult = Array.prototype.slice.call(currentContext.querySelectorAll(currentSelector));

				//include current context element in the match
				if(currentContext.matches && currentContext.matches(currentSelector)){
					currentResult.push(currentContext);
				}

				if(currentResult.length === 0){ continue; }
				if(split){
					result.push(currentResult);
				}else{
					result = result.concat(currentResult);
				}
			}
		}

		var ninjaResult = new Ninja(undefined, result);
		Ninja.prototype.makeArray(ninjaResult, result);

		return ninjaResult;
	},

	find: function(selector, context, returnFirstMatch){
		if(!selector){ return this; }
		context = context || this.context || this;
		if(typeof context === 'string'){ return this; }
		if(!context.length){ context = [context]; }
		selector = selector.split(',');

		var result = [];

		for(var i = 0, len = context.length; i < len; i++){
			if(returnFirstMatch && result.length === 1){ break; }

			Ninja.prototype.walkNodes(context[i], function(currentNode){
				if(Ninja.prototype.selectorMatches(selector, currentNode)){
					if(returnFirstMatch && result.length === 1){ return; }

					if(!Ninja.prototype.contains(currentNode, result)){
						result.push(currentNode);
					}
				}
			});
		}

		var ninjaResult = new Ninja(undefined, result);
		Ninja.prototype.makeArray(ninjaResult, result);

		return ninjaResult;
	},

	findId: function(id, source, returnFirstMatch){
		return this.find('#' + id, source, returnFirstMatch);
	},

	findClass: function(className, source, returnFirstMatch){
		return this.find('.' + className, source, returnFirstMatch);
	},

	findAttribute: function(attribute, value, operator, source, returnFirstMatch){
		var selectorString = Ninja.prototype.getSelectorString(attribute, value, operator);
		return this.find(selectorString, source, returnFirstMatch);
	},

	findData: function(dataId, value, source, returnFirstMatch){
		return this.findAttribute('data-' + dataId, value, undefined, source, returnFirstMatch);
	},

	findTag: function(tagName, source, returnFirstMatch){
		return this.find(tagName, source, returnFirstMatch);
	},

	getSelectorString: function(attribute, value, operator){
		if(!attribute || attribute.trim().length === 0){ return ''; }
		operator = Ninja.prototype.getSelectorOperatorString(operator);
		value = value ? operator +'\"' + value + '\"' : '';
		return '['+ attribute + value +']';
	},

	getSelectorOperatorString: function(operator){
		//= exact, ~= contains, |= beginsWithOrIs, ^= prefix, $= suffix, *= hasWord
		if(operator){
			operator = operator.replace('=', '');
			var operatorMatch = /[~|^$*]{1}/g.exec(operator);
			operator = operatorMatch ? operatorMatch[0] : '';
		}else{
			operator = '';
		}
		return operator + '=';
	},

	serialiazedStringToJson: function(str, keepEmptyValues){
		var arr = str.split('&');
		var keyValuePair, key, value, oldValue;
		var json = {};

		for(var i = arr.length - 1; i >= 0; i--){
			keyValuePair = arr[i].split('=');
			key = keyValuePair[0];
			value = decodeURIComponent(keyValuePair[1]);

			if(!keepEmptyValues && value.length === 0){
				continue;
			}

			if(json[key]){
				if(Ninja.prototype.isArray(json[key])){
					json[key].push(value);
				}else{
					oldValue = json[key];
					json[key] = [];
					json[key].push(oldValue);
					json[key].push(value);
				}
			}else{
				json[key] = value;
			}
		}

		return json;
	},

	extend: function(){
		if(arguments.length === 0){ return; }
		var x = arguments.length === 1 ? this : arguments[0];
		var y;

		for(var i = 1, len = arguments.length; i < len; i++) {
			y = arguments[i];
			for(var key in y){
				if(y.hasOwnProperty(key)){
					x[key] = y[key];
				}
			}
		}

		return x;
	},


	//[[arr], [arr]]
	mergeArray: function(arrays){
		var a, b, c = arrays;

		for (var i = 0, len = arrays.length; i < len - 1; i++) {
			a = arrays[i];
			b = arrays[i + 1];
			c = a.concat(b);
		}
		return c;
	},

	//{obj}, {obj}
	mergeObject: function(){
		var root;
		if(arguments.length === 0){
			return;
		}else if(arguments.length === 1){
			root = this;
			if(root === arguments[0]){
				return;
			}
		}else{
			root = arguments[0];
		}

		for(var i = 1, len = arguments.length; i < len; i++){
			for (var key in arguments[i]){
				if(arguments[i].hasOwnProperty(key)){
					root[key] = arguments[i][key];
				}
			}
		}
		return root;
	},

	makeArray: function(obj, array){
		Ninja.prototype.extend(obj, array);
		obj.splice = function(){};
		obj.length = array.length;
	},

	sortArray: function(array, key){
		return array.sort(function(a, b){
			if(a[key] < b[key]){ return - 1; }
			else if(a[key] > b[key]){ return 1; }
			return 0;
		});
	},

	splice: function(){},
	base64EncodeUnicode: function(str){ return btoa(this.utf8Encode(str)); },
	base64DecodeUnicode: function(str){ return this.utf8Decode(atob(str)); },
	utf8Encode: function(str){ return unescape(encodeURIComponent(str)); },
	utf8Decode: function(str){ return decodeURIComponent(escape(str)); },
	isString: function(obj){ obj = obj || this; return typeof obj === 'string'; },
	isArray: function(obj){ obj = obj || this; return obj instanceof Array; },
	isPlainObject: function(obj){ obj = obj || this; return obj instanceof Object && ! ( obj instanceof Function || obj.toString() !== '[object Object]' || obj.constructor.name !== 'Object' ); },
	isFunction: function(obj){ obj = obj || this; return typeof obj === 'function'; }
};
