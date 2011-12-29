(function($){
	$.manakin = {};
	$.fn.manakin = function(raw_settings){
		return new Manakin(this.get(0), raw_settings)
	};
	var Manakin = $.Class.create({
		initialize:function(scope, raw_settings){
			this.style = $.extend({}, manakin_default_style, raw_settings);
			this.graphics = new Graphics(scope, this.style);
			this.mouse = new Mouse(this, scope, this.graphics);
		},
		draw:function(){
			this.graphics.draw();
		},
		add_drawable:function(drawable){
			this.graphics.add_drawable(drawable);
		},
		remove_drawable:function(drawable){
			this.graphics.remove_drawable(drawable);
		},
		get_width:function(){
			return this.graphics.get_width();
		},
		get_height:function(){
			return this.graphics.get_height();
		},
		to_top:function(drawable){
			this.graphics.to_top(drawable);
		},
		teardown:function(){
			this.graphics.draw_queue.lookup = {};
			this.graphics.draw_queue.drawables = [];
			this.graphics.draw_queue.highest_depth = -1;
		},
		mousemove:function(){}
	});
	var Mouse = $.Class.create({
		initialize:function(parent, scope, graphics){
			this.parent = parent;
			this.scope = scope;
			this.graphics = graphics;
			this.x = 0;
			this.y = 0;
			this.target = undefined;
			this.down = false;
			this.old_target = undefined;
			this.down_target = undefined;
			var self = this;
			$(this.scope).bind('mousemove', function(e){ self.mousemove(e); });
			$(this.scope).bind('mouseup', function(e){ self.mouseup(e); });
			$(this.scope).bind('mousedown', function(e){ self.mousedown(e); });
			$(this.scope).bind('mouseout', function(e){ self.mouseout(e); });
			//$(this.scope).bind('touchstart', function(e){ self.mousemove(e); self.mousedown(e); });
			//$(this.scope).bind('touchmove', function(e){ self.mousemove(e); });
			//$(this.scope).bind('touchend', function(e){ self.mouseup(e); });
			//$(this.scope).bind('touchcancel', function(e){ self.mouseout(e); });
		},
		get_target:function(){
			var target_candidate = undefined;
			var contact;
			var neighbors = this.graphics.get_drawables();
			var self = this;
			$(neighbors).each(function(){
				if(this.visible == false) return;
				contact = point_in_polygon({'x':self.x, 'y':self.y}, this);
				if(contact && !target_candidate){
					target_candidate = this;
				}else if(contact && target_candidate && this.depth > target_candidate.depth){
					target_candidate = this;
				};
			});
			return target_candidate;
		},
		mousemove:function(e){
			if(e.changedTouches) e = e.changedTouches[0];
			var offset = $(this.scope).offset();
			offset_left = offset.left;
			offset_top = offset.top;
			var ie = MakeSeven.fn.is_ie();
			if(ie){
				if(document.documentElement && (document.documentElement.scrollLeft || document.documentElement.scrollTop)){
					this.x = e.clientX + document.documentElement.scrollLeft - offset_left;
					this.y = e.clientY + document.documentElement.scrollTop - offset_top;
				}else{
					this.x = e.clientX + document.body.scrollLeft - offset_left;
					this.y = e.clientY + document.body.scrollTop - offset_top;
				};
			}else{
				this.x = e.pageX - offset_left - 2;
				this.y = e.pageY - offset_top - 2;
			};
			if(this.target) this.old_target = this.target;
			this.target = this.get_target();
			if(this.target && !this.old_target){
				this.target_state = "mouseover";
				this.target.trigger('mouseover', this);
			}else if(this.target && this.old_target){
				if(this.target != this.old_target){
					if(this.down && this.down_target){
						this.target = this.down_target;
					}else{
						this.old_target.trigger('mouseout', this);
						this.target_state = "mouseover";
						this.target.trigger('mouseover', this);
					};
				};
			}else if(!this.target && this.down && this.down_target){
				this.target = this.down_target;
			}else if(!this.target && this.old_target && !this.down){
				if(this.target_state == "mousedown") this.old_target.trigger('mouseup', this);
				this.old_target.trigger('mouseout', this);
				this.old_target = undefined;
				this.target_state = undefined;
			};
			this.parent.mousemove(this);
		},
		mouseup:function(e){
			if(this.target && this.target == this.old_target){
				this.target_state = "mouseup";
				this.target.trigger("mouseup", this);
				this.old_target = undefined;
			};
			if(this.target && this.old_target && this.target == this.old_target){
				this.target_state = "mouseover";
				this.target.trigger("mouseover", this);
			};
			this.down = false;
		},
		mousedown:function(e){
			if(this.target){
				this.target_state = "mousedown";
				this.target.trigger('mousedown', this);
			}else if(!this.target && this.old_target){
				this.old_target.trigger('mouseup', this);
			};
			this.down = true;
			this.down_target = this.target;
		},
		mouseout:function(e){
			if(this.target){
				this.target_state = "mouseout";
				this.target.trigger('mouseout', this);
			};
			this.down = false;
		}
	});
	var Canvas = $.Class.create({
		initialize:function(scope){
			this.graphics = scope.getContext('2d');
		},
		get_width:function(){
			return this.graphics.canvas.width;
		},
		get_height:function(){
			return this.graphics.canvas.height;
		},
		clear:function(){
			this.graphics.canvas.width = this.graphics.canvas.width;
		},
		fill:function(color){
			this.graphics.save();
			this.graphics.fillStyle = color;
			this.graphics.fillRect(0, 0, this.get_width(), this.get_height());
			this.graphics.restore();
		}
	});
	var Graphics = $.Class.create(Canvas,{
		initialize:function($super, scope, style){
			this.style = style;
			this.draw_queue = new DrawQueue();
			$super(scope);
		},
		draw:function(){
			this.clear();
			this.fill(this.style['background-color']);
			this.draw_queue.draw(this.graphics);
		},
		add_drawable:function(drawable){
			if(!drawable.depth) drawable.depth = this.draw_queue.highest_depth + 1;
			if(!drawable.__id__) drawable.__id__ = (Math.round(0xFFFFFFFFFFFF * Math.random()).toString(16) + "0000000000")
				.replace(/([a-f0-9]{12}).+/, "$1").toUpperCase();
			this.draw_queue.add_drawable(drawable);
		},
		remove_drawable:function(drawable){
			this.draw_queue.remove_drawable(drawable);
		},
		get_drawables:function(){
			return this.draw_queue.to_array();
		},
		swap_depth:function(drawable, new_depth){
			this.draw_queue.swap-depth(drawable, new_depth);
		},
		to_top:function(drawable){
			this.draw_queue.swap_depth(drawable, this.draw_queue.highest_depth + 1);
		}
	});
	var DrawQueue = $.Class.create({
		initialize:function(){
			this.lookup = {};
			this.drawables = [];
			this.highest_depth = -1;
		},
		add_drawable:function(drawable){
			var i = drawable.depth;
			if(i > this.highest_depth) this.highest_depth = i;
			if(!this.drawables[i]) this.drawables[i] = [];
			var l = this.drawables[i].length;
			this.drawables[i][l] = drawable;
			this.lookup[drawable.__id__] = l;
		},
		remove_drawable:function(drawable){
			var l = this.lookup[drawable.__id__];
			delete this.lookup[drawable.__id__];
			this.drawables[drawable.depth].splice(l, 1);
		},
		swap_depth:function(drawable, new_depth){
			this.remove_drawable(drawable);
			drawable.depth = new_depth;
			this.add_drawable(drawable);
		},
		to_array:function(){
			this.drawables_out = [];
			var self = this;
			$(this.drawables).each(function(){
				self.drawables_out = self.drawables_out.concat(this);
			});
			return this.drawables_out;
		},
		draw:function(graphics){
			$(this.drawables).each(function(){
				$(this).each(function(){
					this.draw(graphics);
				});
			});
		}
	});
	$.manakin.Eventable = $.Class.create({
		initialize:function(){
			this.__event_lookup__ = {};
			this.__event_subscribers__ = {};
		},
		bind:function(type, fn){
			if(!this.__event_subscribers__[type]) this.__event_subscribers__[type] = [];
			var l = this.__event_subscribers__[type].length;
			this.__event_subscribers__[type][l] = fn;
			this.__event_lookup__[fn] = {'index':l,'type':type};
		},
		unbind:function(fn){
			var binding = this.__event_lookup__[fn];
			this.subcribers[binding.type].splice(binding.index, 1);
			delete this.__event_lookup__[fn];
		},
		trigger:function(type, data){
			var self = this;
			var args = $.extend({'data':data},{'type':type});
			$(this.__event_subscribers__[type]).each(function(){
				this.call(self, args);
			});
		},
		is_mouseable:function(){
			this.bind('mousedown', this.mousedown);
			this.bind('mouseup', this.mouseup);
			this.bind('mouseover', this.mouseover);
			this.bind('mouseout', this.mouseout);
			this.bind('touchstart', this.touchstart);
			this.bind('touchmove', this.touchmove);
			this.bind('touchend', this.touchend);
			this.bind('touchcancel', this.touchcancel);
		},
		mousedown:function(){},
		mouseup:function(){},
		mouseover:function(){},
		mouseout:function(){},
		touchstart:function(){},
		touchmove:function(){},
		touchend:function(){},
		touchcancel:function(){}
	});
	$.manakin.Drawable = $.Class.create($.manakin.Eventable,{
		initialize:function($super, x, y, raw_settings){
			this.x = x;
			this.y = y;
			this.depth = undefined;
			this.visible = true;
			this.vertices = [];
			this.__id__ = undefined;
			this.style = $.extend({}, drawable_default_styles, raw_settings);
			$super();
		},
		add_vertex:function(new_vertex){
			var l = this.vertices.length;
			this.vertices[l] = new_vertex;
		},
		draw:function(graphics){
			if(!this.visible) return;
			graphics.save();
			graphics.translate(this.x, this.y);
			graphics.beginPath();
			graphics.fillStyle = this.style['background-color'];
			if(this.style['border-width'] > 0){
				graphics.strokeStyle = this.style['border-color'];
				graphics.lineWidth = this.style['border-width'];
			};
			var last_vertex = {'x':undefined,'y':undefined};
			var self = this;
			var v_l = this.vertices.length - 1;
			$(this.vertices).each(function(i){
				if(i == 0){
					graphics.moveTo(this.x, this.y);
				}else{
					graphics.lineTo(this.x, this.y, last_vertex.x, last_vertex.y);
				};
				last_vertex = this;
			});
			if(last_vertex && this.vertices[0]){
				graphics.lineTo(this.vertices[0].x, this.vertices[0].y, last_vertex.x, last_vertex.y);
			};
			graphics.fill();
			if(this.style['border-width'] > 0){
				graphics.stroke();
			};
			graphics.closePath();
			graphics.restore();
		}
	});
	$.manakin.PolygonShape = $.Class.create($.manakin.Drawable,{
		initialize:function($super, x, y, radius, edge_count, rotation, settings){
			$super(x, y, settings);
			this.radius = radius;
			this.edge_count = edge_count;
			this.rotation = rotation;
			var point_index,
					point_increment = 360 / this.edge_count,
					plot_x, plot_y;
			for(point_index = 0; point_index <= 360; point_index += point_increment){
				plot_x = Math.sin(Math.convert_to_radians(point_index + this.rotation)) * radius;
				plot_y = Math.cos(Math.convert_to_radians(point_index + this.rotation)) * radius;
				this.add_vertex({'x':plot_x, 'y':plot_y});
			};
		}
	});
	$.manakin.RectangleShape  = $.Class.create($.manakin.Drawable,{
		initialize:function($super, x, y, width, height, settings){
			$super(x, y, settings);
			this.width = width;
			this.height = height;
			this.add_vertex({'x':0,'y':0});
			this.add_vertex({'x':this.width,'y':0});
			this.add_vertex({'x':this.width,'y':this.height});
			this.add_vertex({'x':0,'y':this.height});
		}
	});
	$.manakin.Textable = $.Class.create($.manakin.RectangleShape,{
		initialize:function($super, x, y, width, height, text, settings){
			$super(x, y, width, height, settings);
			this.text = text;
		},
		draw:function($super, graphics){
			$super(graphics);
			var ascent = this.font_ascent();
			if(this.style['text-align'] == 'center'){
				this.draw_text_center(graphics, this.x + this.width / 2, this.y + (this.height / 2) + (ascent / 2));
			}else if(this.style['text-align'] == 'right'){
				this.draw_text_right(graphics, this.x + this.width, this.y +  (this.height / 2) + (ascent / 2));
			}else{
				this.draw_text(graphics, this.x, this.y + (this.height / 2) + (ascent / 2));
			};
		},
		draw_text:function(graphics, x, y){
			var text = this.text;
			var font = this.style['font-family'];
			var size = this.style['font-size'] * 1;
			var color = this.style['color'];
			var total = 0;
			var len = text.length;
			var c, i, j, a;
			var pen_up, need_stroke;
			var mag = size / 25.0;
			graphics.save();
			graphics.fillStyle = color;
			graphics.strokeStyle = color;
			graphics.lineWidth = this.style['font-width'];
			graphics.font = (size + "px") + " " + font;
			for(i = 0; i < len; i++){
				c = this.letter(text.charAt(i));
				if(c){
					graphics.beginPath();
					pen_up = 1;
					need_stroke = 0;
					for(j = 0; j < c.points.length; j++){
						a = c.points[j];
						if(a[0] == -1 && a[1] == -1){
							pen_up = 1;
							continue;
						};
						if(pen_up){
							graphics.moveTo(x + a[0] * mag, y - a[1] * mag);
							pen_up = false;
						}else{
							graphics.lineTo(x + a[0] * mag, y - a[1] * mag);
						};
					};
					graphics.stroke();
					graphics.closePath();
					x += c.width * mag;
				}else{
					if(graphics.fillText){
						graphics.fillText(text.charAt(i), x, y);
					}else if(graphics.mozDrawText){
						graphics.translate(x, y);
						graphics.mozDrawText(text.chartAt(i));
						graphics.translate(0 - x, 0 - y);
					};
					x += 16 * mag;
				};
			};
			graphics.restore();
			return total;
		},
		draw_text_right:function(graphics, x, y){
			var w = this.measure_text();
			return this.draw_text(graphics, x - w, y);
		},
		draw_text_center:function(graphics, x, y){
			var w = this.measure_text();
			return this.draw_text(graphics, x - w / 2, y);
		},
		measure_text:function(){
			var total = 0;
			var len = this.text.length;
			var i, c;
			for(i = 0; i < len; i++){
				c = this.letter(this.text.charAt(i));
				if(!c) c= {'width':13};
				total += c.width * this.style['font-size'] / 25.0;
			};
			return total;
		},
		font_ascent:function(){
			return this.style['font-size'] * 0.75;
		},
		font_descent:function(){
			return 7.0 * this.style['font-size'] / 25.0;
		},
		letter:function(ch){
			return $.manakin.letters_meta[ch];
		}
	});
	$.manakin.letters_meta = {
			' ': { width: 16, points: [] },
			'!': { width: 10, points: [[5,21],[5,7],[-1,-1],[5,2],[4,1],[5,0],[6,1],[5,2]] },
			'"': { width: 16, points: [[4,21],[4,14],[-1,-1],[12,21],[12,14]] },
			'#': { width: 21, points: [[11,25],[4,-7],[-1,-1],[17,25],[10,-7],[-1,-1],[4,12],[18,12],[-1,-1],[3,6],[17,6]] },
			'$': { width: 20, points: [[10,25],[10,-4],[-1,-1],[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
			'%': { width: 24, points: [[21,21],[3,0],[-1,-1],[8,21],[10,19],[10,17],[9,15],[7,14],[5,14],[3,16],[3,18],[4,20],[6,21],[8,21],[10,20],[13,19],[16,19],[19,20],[21,21],[-1,-1],[17,7],[15,6],[14,4],[14,2],[16,0],[18,0],[20,1],[21,3],[21,5],[19,7],[17,7]] },
			'&': { width: 26, points: [[23,12],[23,13],[22,14],[21,14],[20,13],[19,11],[17,6],[15,3],[13,1],[11,0],[7,0],[5,1],[4,2],[3,4],[3,6],[4,8],[5,9],[12,13],[13,14],[14,16],[14,18],[13,20],[11,21],[9,20],[8,18],[8,16],[9,13],[11,10],[16,3],[18,1],[20,0],[22,0],[23,1],[23,2]] },
			'\'': { width: 10, points: [[5,19],[4,20],[5,21],[6,20],[6,18],[5,16],[4,15]] },
			'(': { width: 14, points: [[11,25],[9,23],[7,20],[5,16],[4,11],[4,7],[5,2],[7,-2],[9,-5],[11,-7]] },
			')': { width: 14, points: [[3,25],[5,23],[7,20],[9,16],[10,11],[10,7],[9,2],[7,-2],[5,-5],[3,-7]] },
			'*': { width: 16, points: [[8,21],[8,9],[-1,-1],[3,18],[13,12],[-1,-1],[13,18],[3,12]] },
			'+': { width: 26, points: [[13,18],[13,0],[-1,-1],[4,9],[22,9]] },
			',': { width: 10, points: [[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
			'-': { width: 26, points: [[4,9],[22,9]] },
			'.': { width: 10, points: [[5,2],[4,1],[5,0],[6,1],[5,2]] },
			'/': { width: 22, points: [[20,25],[2,-7]] },
			'0': { width: 20, points: [[9,21],[6,20],[4,17],[3,12],[3,9],[4,4],[6,1],[9,0],[11,0],[14,1],[16,4],[17,9],[17,12],[16,17],[14,20],[11,21],[9,21]] },
			'1': { width: 20, points: [[6,17],[8,18],[11,21],[11,0]] },
			'2': { width: 20, points: [[4,16],[4,17],[5,19],[6,20],[8,21],[12,21],[14,20],[15,19],[16,17],[16,15],[15,13],[13,10],[3,0],[17,0]] },
			'3': { width: 20, points: [[5,21],[16,21],[10,13],[13,13],[15,12],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
			'4': { width: 20, points: [[13,21],[3,7],[18,7],[-1,-1],[13,21],[13,0]] },
			'5': { width: 20, points: [[15,21],[5,21],[4,12],[5,13],[8,14],[11,14],[14,13],[16,11],[17,8],[17,6],[16,3],[14,1],[11,0],[8,0],[5,1],[4,2],[3,4]] },
			'6': { width: 20, points: [[16,18],[15,20],[12,21],[10,21],[7,20],[5,17],[4,12],[4,7],[5,3],[7,1],[10,0],[11,0],[14,1],[16,3],[17,6],[17,7],[16,10],[14,12],[11,13],[10,13],[7,12],[5,10],[4,7]] },
			'7': { width: 20, points: [[17,21],[7,0],[-1,-1],[3,21],[17,21]] },
			'8': { width: 20, points: [[8,21],[5,20],[4,18],[4,16],[5,14],[7,13],[11,12],[14,11],[16,9],[17,7],[17,4],[16,2],[15,1],[12,0],[8,0],[5,1],[4,2],[3,4],[3,7],[4,9],[6,11],[9,12],[13,13],[15,14],[16,16],[16,18],[15,20],[12,21],[8,21]] },
			'9': { width: 20, points: [[16,14],[15,11],[13,9],[10,8],[9,8],[6,9],[4,11],[3,14],[3,15],[4,18],[6,20],[9,21],[10,21],[13,20],[15,18],[16,14],[16,9],[15,4],[13,1],[10,0],[8,0],[5,1],[4,3]] },
			':': { width: 10, points: [[5,14],[4,13],[5,12],[6,13],[5,14],[-1,-1],[5,2],[4,1],[5,0],[6,1],[5,2]] },
			',': { width: 10, points: [[6,1],[5,0],[4,1],[5,2],[6,1],[6,-1],[5,-3],[4,-4]] },
			'<': { width: 24, points: [[20,18],[4,9],[20,0]] },
			'=': { width: 26, points: [[4,12],[22,12],[-1,-1],[4,6],[22,6]] },
			'>': { width: 24, points: [[4,18],[20,9],[4,0]] },
			'?': { width: 18, points: [[3,16],[3,17],[4,19],[5,20],[7,21],[11,21],[13,20],[14,19],[15,17],[15,15],[14,13],[13,12],[9,10],[9,7],[-1,-1],[9,2],[8,1],[9,0],[10,1],[9,2]] },
			'@': { width: 27, points: [[18,13],[17,15],[15,16],[12,16],[10,15],[9,14],[8,11],[8,8],[9,6],[11,5],[14,5],[16,6],[17,8],[-1,-1],[12,16],[10,14],[9,11],[9,8],[10,6],[11,5],[-1,-1],[18,16],[17,8],[17,6],[19,5],[21,5],[23,7],[24,10],[24,12],[23,15],[22,17],[20,19],[18,20],[15,21],[12,21],[9,20],[7,19],[5,17],[4,15],[3,12],[3,9],[4,6],[5,4],[7,2],[9,1],[12,0],[15,0],[18,1],[20,2],[21,3],[-1,-1],[19,16],[18,8],[18,6],[19,5]] },
			'A': { width: 18, points: [[9,21],[1,0],[-1,-1],[9,21],[17,0],[-1,-1],[4,7],[14,7]] },
			'B': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[-1,-1],[4,11],[13,11],[16,10],[17,9],[18,7],[18,4],[17,2],[16,1],[13,0],[4,0]] },
			'C': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5]] },
			'D': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[11,21],[14,20],[16,18],[17,16],[18,13],[18,8],[17,5],[16,3],[14,1],[11,0],[4,0]] },
			'E': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,21],[17,21],[-1,-1],[4,11],[12,11],[-1,-1],[4,0],[17,0]] },
			'F': { width: 18, points: [[4,21],[4,0],[-1,-1],[4,21],[17,21],[-1,-1],[4,11],[12,11]] },
			'G': { width: 21, points: [[18,16],[17,18],[15,20],[13,21],[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[18,8],[-1,-1],[13,8],[18,8]] },
			'H': { width: 22, points: [[4,21],[4,0],[-1,-1],[18,21],[18,0],[-1,-1],[4,11],[18,11]] },
			'I': { width: 8, points: [[4,21],[4,0]] },
			'J': { width: 16, points: [[12,21],[12,5],[11,2],[10,1],[8,0],[6,0],[4,1],[3,2],[2,5],[2,7]] },
			'K': { width: 21, points: [[4,21],[4,0],[-1,-1],[18,21],[4,7],[-1,-1],[9,12],[18,0]] },
			'L': { width: 17, points: [[4,21],[4,0],[-1,-1],[4,0],[16,0]] },
			'M': { width: 24, points: [[4,21],[4,0],[-1,-1],[4,21],[12,0],[-1,-1],[20,21],[12,0],[-1,-1],[20,21],[20,0]] },
			'N': { width: 22, points: [[4,21],[4,0],[-1,-1],[4,21],[18,0],[-1,-1],[18,21],[18,0]] },
			'O': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21]] },
			'P': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,14],[17,12],[16,11],[13,10],[4,10]] },
			'Q': { width: 22, points: [[9,21],[7,20],[5,18],[4,16],[3,13],[3,8],[4,5],[5,3],[7,1],[9,0],[13,0],[15,1],[17,3],[18,5],[19,8],[19,13],[18,16],[17,18],[15,20],[13,21],[9,21],[-1,-1],[12,4],[18,-2]] },
			'R': { width: 21, points: [[4,21],[4,0],[-1,-1],[4,21],[13,21],[16,20],[17,19],[18,17],[18,15],[17,13],[16,12],[13,11],[4,11],[-1,-1],[11,11],[18,0]] },
			'S': { width: 20, points: [[17,18],[15,20],[12,21],[8,21],[5,20],[3,18],[3,16],[4,14],[5,13],[7,12],[13,10],[15,9],[16,8],[17,6],[17,3],[15,1],[12,0],[8,0],[5,1],[3,3]] },
			'T': { width: 16, points: [[8,21],[8,0],[-1,-1],[1,21],[15,21]] },
			'U': { width: 22, points: [[4,21],[4,6],[5,3],[7,1],[10,0],[12,0],[15,1],[17,3],[18,6],[18,21]] },
			'V': { width: 18, points: [[1,21],[9,0],[-1,-1],[17,21],[9,0]] },
			'W': { width: 24, points: [[2,21],[7,0],[-1,-1],[12,21],[7,0],[-1,-1],[12,21],[17,0],[-1,-1],[22,21],[17,0]] },
			'X': { width: 20, points: [[3,21],[17,0],[-1,-1],[17,21],[3,0]] },
			'Y': { width: 18, points: [[1,21],[9,11],[9,0],[-1,-1],[17,21],[9,11]] },
			'Z': { width: 20, points: [[17,21],[3,0],[-1,-1],[3,21],[17,21],[-1,-1],[3,0],[17,0]] },
			'[': { width: 14, points: [[4,25],[4,-7],[-1,-1],[5,25],[5,-7],[-1,-1],[4,25],[11,25],[-1,-1],[4,-7],[11,-7]] },
			'\\': { width: 14, points: [[0,21],[14,-3]] },
			']': { width: 14, points: [[9,25],[9,-7],[-1,-1],[10,25],[10,-7],[-1,-1],[3,25],[10,25],[-1,-1],[3,-7],[10,-7]] },
			'^': { width: 16, points: [[6,15],[8,18],[10,15],[-1,-1],[3,12],[8,17],[13,12],[-1,-1],[8,17],[8,0]] },
			'_': { width: 16, points: [[0,-2],[16,-2]] },
			'`': { width: 10, points: [[6,21],[5,20],[4,18],[4,16],[5,15],[6,16],[5,17]] },
			'a': { width: 19, points: [[15,14],[15,0],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
			'b': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
			'c': { width: 18, points: [[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
			'd': { width: 19, points: [[15,21],[15,0],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
			'e': { width: 18, points: [[3,8],[15,8],[15,10],[14,12],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
			'f': { width: 12, points: [[10,21],[8,21],[6,20],[5,17],[5,0],[-1,-1],[2,14],[9,14]] },
			'g': { width: 19, points: [[15,14],[15,-2],[14,-5],[13,-6],[11,-7],[8,-7],[6,-6],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
			'h': { width: 19, points: [[4,21],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
			'i': { width: 8, points: [[3,21],[4,20],[5,21],[4,22],[3,21],[-1,-1],[4,14],[4,0]] },
			'j': { width: 10, points: [[5,21],[6,20],[7,21],[6,22],[5,21],[-1,-1],[6,14],[6,-3],[5,-6],[3,-7],[1,-7]] },
			'k': { width: 17, points: [[4,21],[4,0],[-1,-1],[14,14],[4,4],[-1,-1],[8,8],[15,0]] },
			'l': { width: 8, points: [[4,21],[4,0]] },
			'm': { width: 30, points: [[4,14],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0],[-1,-1],[15,10],[18,13],[20,14],[23,14],[25,13],[26,10],[26,0]] },
			'n': { width: 19, points: [[4,14],[4,0],[-1,-1],[4,10],[7,13],[9,14],[12,14],[14,13],[15,10],[15,0]] },
			'o': { width: 19, points: [[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3],[16,6],[16,8],[15,11],[13,13],[11,14],[8,14]] },
			'p': { width: 19, points: [[4,14],[4,-7],[-1,-1],[4,11],[6,13],[8,14],[11,14],[13,13],[15,11],[16,8],[16,6],[15,3],[13,1],[11,0],[8,0],[6,1],[4,3]] },
			'q': { width: 19, points: [[15,14],[15,-7],[-1,-1],[15,11],[13,13],[11,14],[8,14],[6,13],[4,11],[3,8],[3,6],[4,3],[6,1],[8,0],[11,0],[13,1],[15,3]] },
			'r': { width: 13, points: [[4,14],[4,0],[-1,-1],[4,8],[5,11],[7,13],[9,14],[12,14]] },
			's': { width: 17, points: [[14,11],[13,13],[10,14],[7,14],[4,13],[3,11],[4,9],[6,8],[11,7],[13,6],[14,4],[14,3],[13,1],[10,0],[7,0],[4,1],[3,3]] },
			't': { width: 12, points: [[5,21],[5,4],[6,1],[8,0],[10,0],[-1,-1],[2,14],[9,14]] },
			'u': { width: 19, points: [[4,14],[4,4],[5,1],[7,0],[10,0],[12,1],[15,4],[-1,-1],[15,14],[15,0]] },
			'v': { width: 16, points: [[2,14],[8,0],[-1,-1],[14,14],[8,0]] },
			'w': { width: 22, points: [[3,14],[7,0],[-1,-1],[11,14],[7,0],[-1,-1],[11,14],[15,0],[-1,-1],[19,14],[15,0]] },
			'x': { width: 17, points: [[3,14],[14,0],[-1,-1],[14,14],[3,0]] },
			'y': { width: 16, points: [[2,14],[8,0],[-1,-1],[14,14],[8,0],[6,-4],[4,-6],[2,-7],[1,-7]] },
			'z': { width: 17, points: [[14,14],[3,0],[-1,-1],[3,14],[14,14],[-1,-1],[3,0],[14,0]] },
			'{': { width: 14, points: [[9,25],[7,24],[6,23],[5,21],[5,19],[6,17],[7,16],[8,14],[8,12],[6,10],[-1,-1],[7,24],[6,22],[6,20],[7,18],[8,17],[9,15],[9,13],[8,11],[4,9],[8,7],[9,5],[9,3],[8,1],[7,0],[6,-2],[6,-4],[7,-6],[-1,-1],[6,8],[8,6],[8,4],[7,2],[6,1],[5,-1],[5,-3],[6,-5],[7,-6],[9,-7]] },
			'|': { width: 8, points: [[4,25],[4,-7]] },
			'}': { width: 14, points: [[5,25],[7,24],[8,23],[9,21],[9,19],[8,17],[7,16],[6,14],[6,12],[8,10],[-1,-1],[7,24],[8,22],[8,20],[7,18],[6,17],[5,15],[5,13],[6,11],[10,9],[6,7],[5,5],[5,3],[6,1],[7,0],[8,-2],[8,-4],[7,-6],[-1,-1],[8,8],[6,6],[6,4],[7,2],[8,1],[9,-1],[9,-3],[8,-5],[7,-6],[5,-7]] },
			'~': { width: 24, points: [[3,6],[3,8],[4,11],[6,12],[8,12],[10,11],[14,8],[16,7],[18,7],[20,8],[21,10],[-1,-1],[3,8],[4,10],[6,11],[8,11],[10,10],[14,7],[16,6],[18,6],[20,7],[21,10],[21,12]] }
		};
	$.extend(Math,{
		'convert_to_radians':function(degrees){
			return Math.PI / 180 * degrees;
		},
		'convert_to_degrees':function(radians){
			return radians * (180 / Math.PI);
		}
	});
	var drawable_default_styles = {
			'background-color':'rgba(255, 255, 255, 0)',
			'border-width':0,
			'border-color':'rgba(0, 0, 0, 0)',
			'font-family':'sans-serif',
			'font-size':16,
			'color':'#000000',
			'text-align':'left',
			'font-width':1
		};
	var manakin_default_style = {
				'background-color':'#FFFFFF'
		};
	var point_in_polygon = function(point, polygon){
		var x = point.x;
		var y = point.y;
		var vertices = polygon.vertices;
		var vert_count = vertices.length;
		var i, j, contact = false;
		var vy, vx, vly, vlx;
		for(i = 0, j = vert_count - 1; i < vert_count; j = i++){
			vy = vertices[i].y + polygon.y;
			vx = vertices[i].x + polygon.x;
			vly = vertices[j].y + polygon.y;
			vlx = vertices[j].x + polygon.x;
			if(((vy > y) != (vly > y)) && (x < (vlx - vx) * (y - vy) / (vly - vy) + vx)){
				contact = !contact;
			};
		};
		return contact;
	};
})(window.MakeSeven);