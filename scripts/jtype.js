(function(window, $){
	var Class = new function(){
		var subclass = function(){};
		var create = function(){
			var parent = null,
					properties = parse_arguments(arguments);
			if($.is_function(properties[0])) parent = properties.shift();
			var klass = function(){
				this.initialize.apply(this, arguments);
			};
			$.extend(klass, $.Class.Methods);
			klass.superclass = parent;
			klass.subclasses = [];
			if(parent){
				subclass.prototype = parent.prototype;
				klass.prototype = new subclass;
				if(!parent.subclasses) parent.subclasses = [];
				parent.subclasses[parent.subclasses.length] = klass;
			};
			$(properties).each(function(i, property){
				klass.addMethods(property);
			});
			if(!klass.prototype.initialize) klass.prototype.initialize = $.noop;
			klass.prototype.constructor = klass;
			return klass;
		};
		var addMethods = function(source){
			var ancestor = this.superclass && this.superclass.prototype;
			var properties = Object.keys(source);
			if(!Object.keys({'toString':true}).length){
				if(source.toString != Object.prototype.toString) properties[properties.length] = "toString";
				if(source.valueOf != Object.prototype.valueOf) properties[properties.length] = "valueOf";
			};
			var value,
					self = this;
			$(properties).each(function(i, property){
				value = source[property];
				if(ancestor && $.is_function(value) && value.argumentNames().first() == "$super"){
					var method = value;
					value = (function(m){
							return function(){return ancestor[m].apply(this, arguments); };
						})(property).wrap(method);
					value.valueOf = method.valueOf.bind(method);
					value.toString = method.toString.bind(method);
				};
				self.prototype[property] = value;
			});
			return this;
		};
		return {'create':create, 'Methods':{'addMethods':addMethods}};
	};
	var parse_arguments = function(iterable){
		if(!iterable) return [];
		if('toArray' in Object(iterable)) return iterable.toArray();
		var length = iterable.length || 0,
				results = new Array(length);
		while(length--) results[length] = iterable[length];
		return results;
	};
	var update = function(array, args){
		var array_length = array.length,
				length = args.length;
		while(length--) array[array_length + length] = args[length];
		return array;
	};
	var merge = function(array, args){
		array = slice.call(array, 0);
		return update(array, args);
	};
	var slice = Array.prototype.slice;
	$.extend(Function.prototype, {
		argumentNames:function(){
			var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').replace(/\s+/g, '').split(',');
			return names.length == 1 && !names[0] ? [] : names;
		},
		wrap:function(wrapper){
			var __method = this;
			return function(){
				var a = update([__method.bind(this)], arguments);
				return wrapper.apply(this, a);
			};
		},
		bind:function(context){
			if(arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
			var __method = this, args = slice.call(arguments, 1);
			return function(){
				var a = merge(args, arguments);
				return __method.apply(context, a);
			};
		}
	});
	$.Class = $.fn.Class = Class;
})(window, window.MakeSeven);