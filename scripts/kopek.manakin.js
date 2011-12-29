(function($){
	$.manakin.Kopek = $.Class.create($.manakin.Eventable,{
		initialize:function($super, node, state, settings){
			this.node = $(node);
			this.manakin = this.node.manakin(settings)
			$super();
			this.switch_state(state);
		},
		draw:function(){
			this.manakin.draw();
		},
		add_drawable:function(drawable){
			this.manakin.add_drawable(drawable);
		},
		remove_drawable:function(drawable){
			this.manakin.remove_drawable(drawable);
		},
		switch_state:function(new_state){
			if(this.state && this.state.teardown) this.state.teardown();
			this.__state__ = new_state;
			this.state = new this.__state__(this);
			this.state.init();
		},
		to_top:function(drawable){
			this.manakin.to_top(drawable);
		}
	});
	$.manakin.State = $.Class.create($.manakin.Eventable,{
		initialize:function($super, engine){
			$super();
			this.engine = engine;
			this.drawables = [];
		},
		init:function(){},
		add:function(drawable){
			var i = this.drawables.length;
			this.drawables[i] = drawable;
			this.engine.add_drawable(drawable);
		},
		remove:function(drawable){
			var o_arr = [],
					cnt = 0,
					self = this;
			$(this.drawables).each(function(){
				if(this.__id__ != drawable.__id__){
					o_arr[cnt++] = this;
				}else{
					self.engine.remove_drawable(this);
				};
			});
			this.drawables = o_arr;
		},
		teardown:function(){
			var self = this;
			$(this.drawables).each(function(){
				self.engine.remove_drawable(this);
			});
			this.drawables = [];
		}
	});
})(window.MakeSeven)