(function($){
	$.manakin.StackDocument = $.Class.create($.manakin.Drawable,{
		initialize:function($super, canvas, x, y){
			$super(x, y);
			this.canvas = canvas;
			this.width = this.canvas.get_width();
			this.height = this.canvas.get_height();
			this.body;
			this.init_body();
			this.styles;
		},
		draw:function($super, graphics){
			this.body.render(graphics);
		},
		init_body:function(){
			this.body = new $.manakin.StackElement(this.canvas);
			this.body.parent = this;
			this.body.calculated_width = this.width;
			this.body.x = this.x;
			this.body.y = this.y;
			this.body.height = this.height;
			this.body.calculated_height = this.height;
		},
		load:function(doc, styles){
			this.styles = styles;
			this.build(this.body, doc);
		},
		build:function(parent, children){
			var child,
					node,
					classes,
					o, i, j ,k, b;
			var self = this;
			$(children).each(function(){
				child = this;
				for(i in child){
					if(child && child[i] && child[i] instanceof Array){
						o = {};
						classes = i.split(",");
						$(classes).each(function(){
							$.extend(o, self.styles[this]);
						});
						node = new $.manakin.StackElement(self.canvas, o);
						parent.add_child(node);
						self.build(node, child[i]);
					}else{
						if(i == "Text"){
							b = typeof child[i];
							if(b.toLowerCase() == "string") o = {"text":child[i], "style":self.style};
							else o = child[i];
							node = new $.manakin.TextElement(parent.x, parent.y, parent.calculated_width, parent.calculated_height, o);
							parent.add_child(node);
						}else if(i == "Component"){
							node = new $.manakin.ComponentElement(self.canvas, parent.x, parent.y, parent.calculated_width, parent.calculated_height, child[i]);
							parent.add_child(node);
						};
					};
				};
			});
		}
	});
	$.manakin.StackElement = $.Class.create($.manakin.Drawable,{
		initialize:function($super, canvas, classes){
			$super(0, 0, stack_element_default_styles);
			var self = this;
			$(classes).each(function(){
				$.extend(self.style, this);
			});
			this.parent;
			this.canvas = canvas;
			this.width = this.style['width'];
			this.height = this.style['height'];
			this.children = [];
		},
		add_child:function(child_element){
			//this.canvas.add_drawable(child_element);
			child_element.bind_to_parent(this);
			this.children[this.children.length] = child_element;
			return child_element;
		},
		render:function(graphics){
			if(this.canvas.visible == false) return;
			this.draw(graphics);
			var sibling_x_offset = 0,
					sibling_y_offset = 0,
					last_width = 0,
					last_height = 0;
			$(this.children).each(function(){
				if(sibling_x_offset + this.calculated_width > this.parent.calculated_width){
					this.x = this.parent.x + sibling_x_offset - last_width;
					this.y = this.parent.y + sibling_y_offset;
				}else{
					this.x = this.parent.x + sibling_x_offset;
					this.y = this.parent.y;
					sibling_x_offset += this.calculated_width;
				};
				sibling_y_offset += this.calculated_height;
				last_width = this.calculated_width;
				last_height = this.calculated_height;
				this.render(graphics);
			});
		},
		bind_to_parent:function(parent){
			this.parent = parent;
			this.calculated_width = this.parse_dimension(this.width, 'calculated_width');
			this.calculated_height = this.parse_dimension(this.height, 'calculated_height');
			this.x = this.parent.x;
			this.y = this.parent.y;
			this.add_vertex({'x':0, 'y':0});
			this.add_vertex({'x':this.calculated_width, 'y':0});
			this.add_vertex({'x':this.calculated_width, 'y':this.calculated_height});
			this.add_vertex({'x':0, 'y':this.calculated_height});
		},
		parse_dimension:function(dimension, target_d){
			var d;
			if((dimension + "").match("%")){
				if(this.parent && this.parent[target_d]){
					d = (parseFloat(dimension) / 100) * this.parent[target_d] - 0.001;
				};
			}else{
				d = parseFloat(dimension);
			};
			return d;
		}
	});
	$.manakin.ComponentElement = $.Class.create($.manakin.Drawable,{
		initialize:function($super, canvas, x, y, width, height, args){
			$super(x, y, stack_element_default_styles);
			this.parent;
			this.canvas = canvas;
			this.width = width;
			this.height = height;
			this.args = args;
			this.component;
			this.children = [];
		},
		bind_to_parent:function(parent){
			this.parent = parent;
			this.calculated_width = parent.calculated_width;
			this.calculated_height = parent.calculated_height;
			this.x = this.parent.x;
			this.y = this.parent.y;
			this.add_vertex({'x':0,'y':0});
			this.add_vertex({'x':this.calculated_width,'y':0});
			this.add_vertex({'x':this.calculated_width,'y':this.calculated_height});
			this.add_vertex({'x':0,'y':this.calculated_height});
			this.component = new $.manakin[this.args['class']](this, this.args);
			this.children[this.children.length] = this.component;
			this.canvas.add_drawable(this.component);
		},
		add_drawable:function(drawable){
			this.canvas.add_drawable(drawable);
		},
		render:function(graphics){
			this.component.x = this.x;
			this.component.y = this.y;
			this.draw(graphics, true);
		},
		draw:function($super, graphics, really){
			this.x = this.parent.x;
			this.y = this.parent.y;
			if(really) $super(graphics);
		}
	});
	$.manakin.TextElement = $.Class.create($.manakin.Textable,{
		initialize:function($super, x, y, width, height, args){
			var text = args['text'];
			$super(x, y, width, height, text, $.extend({}, stack_element_default_styles, args['style']));
			this.parent;
		},
		bind_to_parent:function(parent){
			this.parent = parent;
			this.calculated_width = parent.calculated_width;
			this.calculated_height = parent.calculated_height;
			this.x = this.parent.x;
			this.y = this.parent.y;
			this.add_vertex({'x':0,'y':0});
			this.add_vertex({'x':this.calculated_width,'y':0});
			this.add_vertex({'x':this.calculated_width,'y':this.calculated_height});
			this.add_vertex({'x':0,'y':this.calculated_height});
		},
		render:function(graphics){
			this.draw(graphics, true);
		},
		draw:function($super, graphics, really){
			this.x = this.parent.x;
			this.y = this.parent.y;
			if(really) $super(graphics);
		}
	});
	var stack_element_default_styles = {
			'width':'100%',
			'height':'100%',
			'text-align':'center',
			'font-size':12,
			'font-width':1,
			'border-width':0,
			'border-color':'#880000'
		};
})(window.MakeSeven);