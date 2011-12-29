(function($){
	var MakeSeven = function(obj){
		return new MakeSeven.fn.init(obj);
	};
	MakeSeven.fn = {
		init:function(selector){
			if(!selector) return this;
			if(typeof selector === "string"){
				elem = document.getElementById(selector);
				match = quick_expr.exec(selector);
				elem = document.getElementById(match[2]);
				if(elem){
					this.length = 1;
					this[0] = elem;
				};
				this.context = document;
				this.selector = selector;
				return this;
			};
			return MakeSeven.make_array(selector, this);
		},
		each:function(callback, args){
			return MakeSeven.each(this, callback, args);
		},
		toArray:function(){
			return slice.call(this, 0);
		},
		get:function(i){
			return i == null ? this.toArray() : (i < 0 ? this.slice(i)[0] : this[i]);
		},
		bind:function(type, handler){
			return MakeSeven(this).each(function(){
				MakeSeven.fn.add_event_listener(this, type, handler);
			});
		},
		unbind:function(type, handler){
			var self = this;
			return MakeSeven(this).each(function(){
				MakeSeven.fn.remove_event_listener(this, type, handler);
			});
		},
		add_event_listener:function(element, type, handler){
			if(element.addEventListener){
				element.addEventListener(type, handler, false);
			}else{
				if(!handler.$$guid) handler.$$guid = MakeSeven.fn.guid++;
				if(!element.events) element.events = {};
				var handlers = element.events[type];
				if(!handlers){
					handlers = element.events[type] = {};
					if(element["on" + type]){
						handlers[0] = element["on" + type];
					};
				};
				handlers[handler.$$guid] = handler;
				element["on" + type] = MakeSeven.fn.handle_event;
			};
		},
		remove_event_listener:function(element, type, handler){
			if(element.removeEventListener){
				element.removeEventListener(type, handler, false);
			}else{
				if(element.events && element.events[type]){
					delete elements.events[type][handler.$$guid];
				};
			};
		},
		handle_event:function(event){
			var return_value = true;
			event = event || MakeSeven.fn.fix_event(((this.ownerDocument || this.document || this).parentWindow || window).event);
			var handlers = this.events[event.type];
			for(var i in handlers){
				this.$$handle_event = handlers[i];
				if(this.$$handle_event(event) == false){
					return_value = false;
				};
			};
			return return_value;
		},
		fix_event:function(event){
			event.preventDefault = function(){ this.returnValue = false; };
			event.stopPropagation = function(){ this.cancelBubble = true; };
			return event;
		},
		is_ie:function(){ return !!document.all; },
		offset:function(){
			var left = 0,
					top = 0;
			var elem = this.get(0);
			if(elem.offsetParent){
				do{
					left += elem.offsetLeft;
					top += elem.offsetTop;
				}while(elem = elem.offsetParent);
			};
			return {'left':left,'top':top};
		},
		noop:function(){},
		context:undefined,
		selector:undefined,
		guid:0,
		length:0,
		push:push,
		sort:[].sort,
		splice:[].splice,
		slice:Array.prototype.slice
	};
	MakeSeven.fn.init.prototype = MakeSeven.fn;
	var toString = Object.prototype.toString,
			hasOwnProperty = Object.prototype.hasOwnProperty,
			push = Array.prototype.push,
			slice = Array.prototype.slice,
			indexOf = Array.prototype.indexOf,
			quick_expr = /^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/,
			match,
			elem,
			root_MakeSeven = MakeSeven();
	MakeSeven.is_function = MakeSeven.fn.is_function = function(obj){
		return obj.constructor.toString().indexOf('Function') == -1 ? false : true;
	};
	MakeSeven.is_array = MakeSeven.fn.is_array = function(obj){
		return obj.constructor.toString().indexOf('Array') == -1 ? false : true;
	};
	MakeSeven.inArray = MakeSeven.fn.inArray = function(elem, array){
		if(array.indexOf){
			return array.indexOf(elem);
		};
		for(var i = 0, length = array.length; i< length; i++){
			if(array[i] === elem){
				return i;
			};
		};;
		return -1;
	},
	MakeSeven.is_plain_object = MakeSeven.fn.is_plain_object = function(obj){
		if(!obj || obj.constructor.toString().indexOf('Object') == -1 || obj.nodeType || obj.setInterval) return false;
		if(obj.constructor && !obj.hasOwnProperty("constructor") && !obj.constructor.prototype.hasOwnProperty("isPrototypeOf")) return false;
		var key;
		for(key in obj){};
		return key === undefined || hasOwnProperty.call(obj, key);
	};
	MakeSeven.merge = MakeSeven.fn.merge = function(first, second){
		var i = first.length,
				j = 0;
		if(typeof second.length === "number"){
			for(var l = second.length; j < l; j++){
				first[i++] = second[j];
			};
		}else{
			while(second[j] !== undefined){
				first[i++] = second[j++];
			};
		};
		first.length = i;
		return first;
	};
	MakeSeven.each = function(object, callback, args){
		var name,
				i = 0,
				length = object.length,
				is_obj = length === undefined || MakeSeven.is_function(object);
		if(args){
			if(is_obj){
				for(name in object){
					if(callback.apply(object[name], args) === false){
						break;
					}
				};
			}else{
				for(; i < length;){
					if(callback.apply(object[i++], args) === false){
						break;
					};
				};
			};
		}else{
			if(is_obj){
				for(name in object){
					if(callback.call(object[name], name, object[name]) == false) break;
				};
			}else{
				for(var value = object[0]; i < length && callback.call(value, i, value) !== false; value = object[++i]){};
			};
		};
		return object;
	};
	MakeSeven.make_array = MakeSeven.fn.make_array = function(array, results){
		var ret = results || [];
		if(array != null){
			if(array.length == null || typeof array === "string" || MakeSeven.is_function(array) || (typeof array !== "function" && array.setInterval)){
				push.call(ret, array);
			}else{
				MakeSeven.merge(ret, array);
			};
		};
		return ret;
	};
	MakeSeven.extend = MakeSeven.fn.extend = function(){
		var target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false,
				options,
				name,
				src,
				copy,
				clone;
		if(typeof target === "boolean"){
			deep = target;
			target = arguments[1] || {};
			i == 2;
		};
		if(typeof target !== "object" && !MakeSeven.is_function(target)){
			target = {};
		};
		if(length === i){
			target = this;
			--i;
		};
		for(; i < length; i++){
			if((options = arguments[i]) != null){
				for(name in options){
					src = target[name];
					copy = options[name];
					if(target === copy) continue;
					if(deep && copy && (MakeSeven.fn.is_plain_object(copy) || MakeSeven.fn.is_array(copy))){
						clone = src && (MakeSeven.fn.is_plain_object(src) || MakeSeven.fn.is_array(src)) ? src : MakeSeven.is_array(copy) ? [] : {};
						target[name] = MakeSeven.extend(deep, clone, copy);
					}else if(copy !== undefined){
						target[name] = copy;
					};
				};
			};
		};
		return target;
	};
	MakeSeven.extend(Object,{
		keys:function(object){
			var results = [];
			for(var property in object) results[results.length] = property;
			return results;
		},
		isUndefined:function(object){
			return typeof object === "undefined";
		}
	});
	MakeSeven.extend(Array.prototype, {
		first:function(){
			return this[0];
		}
	});
	$.MakeSeven = MakeSeven;
})(window);