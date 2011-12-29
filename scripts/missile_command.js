var kopek,
		$ = MakeSeven;
var on_load = function(){
	kopek = new $.manakin.Kopek("#canvas", MenuState, {'background-color':'#444444'});
	kopek.draw();
};
var MenuState = $.Class.create($.manakin.State,{
	init:function(){
		var title = new Title(30, 30, 'Missile Command')
		var play_btn = new Button(30, 80, 'large', 'Play');
		var self = this;
		play_btn.bind('mousedown',function(){
			self.engine.switch_state(PlayState);
			self.engine.draw();
		});
		this.add(title);
		this.add(play_btn);
	}
});
var PlayState = $.Class.create($.manakin.State,{
	init:function(){
		this.score = 0;
		this.game_continue = false;
		this.missiles = [];
		this.counters = [];
		this.explosions = [];
		this.missile_speed = 1;
		this.counter_speed = 5;
		this.proximity_manager = new ProximityManager(this.city_width * 2);
		this.terrain = new Terrain(0, 272, 480, 48, this.city_count, this.city_width, {'background-color':'#888800'});
		this.sky = new Sky(0, 0, 480, 272 - (this.city_width * 2), {'background-color':'#000000'});
		this.turret = new Turret(240, 272, {'background-color':'#008888'});
		this.score_txt = new ScoreText(10, 292, this.score);
		this.cities = this.build_cities();
		this.add(this.terrain);
		this.add(this.sky);
		this.add(this.turret);
		this.add(this.score_txt);
		this.add_interactivity();
		this.init_back_btn();
		var self = this;
		this.timer = setInterval(function(){ self.draw(); }, 100);
	},
	city_count:6,
	city_width:10,
	max_missiles:6,
	draw:function(){
		this.proximity_manager.refresh();
		var missile,
				self = this;
		if(this.missiles.length < this.max_missiles){
			missile = this.new_missile();
			this.missiles[this.missiles.length] = missile;
			this.add_missile(missile, true);
		};
		var n_missiles = [],
				cnt = 0;
		$(this.missiles).each(function(){
			if(!this.target){ return self.remove_missile(this, true); };
			if(this.y > this.target.y + this.target.height){
				self.remove_missile(this, true);
				this.target.active = false;
				self.remove(this.target);
			}else{
				n_missiles[cnt++] = this;
			};
		});
		this.missiles = n_missiles;
		var explosion,
				n_counters = [],
				cnt = 0;
		$(this.counters).each(function(){
			if(!this.target) return;
			if(this.y < this.target.y){
				explosion = self.new_explosion(this);
				self.remove_missile(this);
				self.explosions[self.explosions.length] = explosion;
				self.add(explosion);
			}else{
				n_counters[cnt++] = this;
			};
		});
		this.counters = n_counters;
		var missile,
				c_radius,
				neighbors,
				m,
				n_missiles = [],
				n_explosions = [],
				cnt = 0,
				ent = 0;
		$(self.explosions).each(function(i){
			explosion = this;
			neighbors = self.proximity_manager.get_neighbors(explosion);
			$(neighbors).each(function(){
				missile = this;
				c_radius = explosion.radius + missile.width;
				if(get_distance(missile, explosion) < c_radius){
					self.score += 10;
					self.remove_missile(missile, true);
					self.missile_speed += 0.2;
					self.counter_speed += 0.125;
					n_missiles[cnt++] = missile.__id__;
				};
			});
			if(explosion.radius >= explosion.max_radius){
				self.remove(explosion, true);
			}else{
				n_explosions[ent++] = explosion;
			};
		});
		var i,
				out_m = [],
				cnt = 0;
		$(self.missiles).each(function(){
			i = $.inArray(this.__id__, n_missiles)
			if(i == -1){
				out_m[cnt++] = this;
			};
		});
		this.missiles = out_m;
		this.explosions = n_explosions;
		self.game_continue = false;
		$(self.cities).each(function(){
			self.game_continue = this.active || self.game_continue;
		});
		if(!self.game_continue) clearInterval(self.timer);
		self.score_txt.text = self.score + '';
		self.engine.draw();
	},
	teardown:function($super){
		clearInterval(this.timer);
		$super();
	},
	init_back_btn:function(){
		var back_btn = new Button(430, 292, 'small', 'Menu');
		var self = this;
		back_btn.bind('mousedown',function(){
			self.engine.switch_state(MenuState);
			self.engine.draw();
		});
		this.add(back_btn);
	},
	add_interactivity:function(){
		this.sky.is_mouseable();
		var self = this;
		this.sky.bind('mousedown',function(e){
			var missile = self.new_counter(e);
			self.add_missile(missile);
			self.counters[self.counters.length] = missile;
		});
	},
	add_missile:function(missile, prox_too){
		this.add(missile.trail);
		this.add(missile);
		if(prox_too) this.proximity_manager.add_item(missile);
	},
	remove_missile:function(missile, prox_too){
		this.remove(missile.trail);
		this.remove(missile);
		if(prox_too) this.proximity_manager.remove_item(missile);
	},
	build_cities:function(){
		var city,
				cities = new Array(this.city_count),
				x,
				y,
				height = this.city_width * 0.75,
				h_cw = this.city_width / 2;
		var self = this;
		$(cities).each(function(i){
			city = new City(self.terrain.bunker_lots[i], self.terrain.y - height - h_cw, self.city_width, height, {'background-color':'#888888'});
			cities[i] = city;
			self.add(city);
		});
		return cities;
	},
	new_missile:function(){
		var i = Math.floor(Math.random() * this.cities.length);
		return new Missile(480 * Math.random(), 0, 5, 5, this.cities[i], this.missile_speed, {'background-color':'#00FFFF'});
	},
	new_counter:function(e){
		return new Missile(this.turret.x, this.turret.y, 5, 5, {'x':e.data.x,'y':e.data.y,'width':1,'height':1}, this.counter_speed, {'background-color':'#880000'});
	},
	new_explosion:function(missile){
		return new Explosion(missile.x, missile.y, missile.width * 4);
	}
});
var Title = $.Class.create($.manakin.Textable,{
	initialize:function($super, x, y, text){
		$super(x, y, 120, 40, text, {'background-color':'rgba(0,0,0,0)','text-align':'left','border-width':0,'color':'#FFFFFF','font-size':18,'font-width':1.5});
	}
});
var ScoreText = $.Class.create($.manakin.Textable,{
	initialize:function($super, x, y, text){
		$super(x, y, 40, 18, text + '', {'background-color':'rgba(0,0,0,0)','text-align':'left','border-width':0,'color':'#FFFFFF','font-size':10,'font-width':1.5});
	}
});
var Button = $.Class.create($.manakin.Textable,{
	initialize:function($super, x, y, size, text){
		var width = size == 'large' ? 120 : 40;
		var height = size == 'large' ? 40 : 18;
		var font_size = size == 'large' ? 16 : 10;
		$super(x, y, width, height, text, {'background-color':'#BED6AE','text-align':'center','border-width':0,'font-size':font_size});
		this.is_mouseable();
		this.original_color = this.style['background-color'];
		this.original_text_color = this.style['color'];
	},
	mouseover:function(){
		this.style['background-color'] = '#880000';
		this.style['color'] = '#FFFFFF';
		kopek.draw();
	},
	mouseout:function(){
		this.style['background-color'] = this.original_color;
		this.style['color'] = this.original_text_color;
		kopek.draw();
	}
});
var rotation_to_target = function(hero, target){
	var dx = hero.x - (target.x + target.width / 2),
			dy = hero.y - (target.y + target.height / 2);
	return Math.atan2(dx, dy) / Math.PI * -180;
};
var get_distance = function(hero, target){
	var x = target.x - hero.x,
			y = target.y - hero.y,
			x2 = x * x,
			y2 = y * y;
	return Math.sqrt(x2 + y2);
};
var Explosion = $.Class.create($.manakin.PolygonShape,{
	initialize:function($super, x, y, max_radius){
		$super(x, y, 5, 18, 0, {'background-color':'#FF0000'});
		this.max_radius = max_radius;
	},
	draw:function($super, graphics){
		this.style['background-color'] = (Math.round(0xFFFFFF * Math.random()).toString(16) + "000000").replace(/([a-f0-9]{6}).+/, "#$1").toUpperCase();
		var point_index,
				point_increment = 360 / this.edge_count,
				plot_x, plot_y;
		if(this.radius < this.max_radius) this.radius++;
		for(point_index = 0; point_index <= 360; point_index += point_increment){
			plot_x = Math.sin(Math.convert_to_radians(point_index + this.rotation)) * this.radius;
			plot_y = Math.cos(Math.convert_to_radians(point_index + this.rotation)) * this.radius;
			this.add_vertex({'x':plot_x, 'y':plot_y});
		};
		$super(graphics);
	}
});
var Missile = $.Class.create($.manakin.RectangleShape,{
	initialize:function($super, x, y, width, height, target, speed, settings){
		$super(x, y, width, height, settings);
		this.target = target;
		this.speed = speed;
		this.trail = new Trail(this, {'background-color':this.style['background-color'],'border-width':1,'border-color':this.style['background-color']});
		this.rotation = (rotation_to_target(this, this.target) + 270) % 360;
		var self = this,
				hw = this.width / 2,
				hh = this.height / 2;
		$(this.vertices).each(function(j){
			self.vertices[j] = {'x':this.x - hw,'y':this.y - hh};
		});
	},
	draw:function($super, graphics){
		this.x += Math.cos(this.rotation * Math.PI / 180) * this.speed;
		this.y += Math.sin(this.rotation * Math.PI / 180) * this.speed;
		$super(graphics);
	}
});
var Trail = $.Class.create($.manakin.Drawable,{
	initialize:function($super, missile, settings){
		this.missile = missile;
		$super(this.missile.x, this.missile.y, settings);
		this.vertices[0] = {'x':missile.x - this.x,'y':missile.y - this.y};
	},
	draw:function($super, graphics){
		this.vertices[1] = {'x':this.missile.x - this.x,'y':this.missile.y - this.y};
		$super(graphics);
	}
});
var Turret = $.Class.create($.manakin.Drawable,{
});
var Sky = $.Class.create($.manakin.RectangleShape,{
});
var City = $.Class.create($.manakin.RectangleShape,{
	initialize:function($super, x, y, width, height, settings){
		$super(x, y, width, height, settings);
		this.active = true;
	}
});
var Terrain = $.Class.create($.manakin.Drawable,{
	initialize:function($super, x, y, width, height, bunker_count, bunker_width, settings){
		$super(x, y, settings);
		this.width = width;
		this.height = height;
		this.bunker_count = bunker_count;
		this.bunker_width = bunker_width;
		this.build_vertices();
		this.bunker_lots;
	},
	build_vertices:function(){
		this.bunker_lots = [];
		var interval = this.width / this.bunker_count,
				cnt = 0,
				i,
				h_bw = this.bunker_width / 2;
		this.add_vertex({'x':0,'y':0});
		for(i = 0; i < this.bunker_count; i++){
			cnt = interval * i;
			cnt += interval / 2
			this.bunker_lots[i] = cnt - h_bw;
			this.add_vertex({'x':(cnt - h_bw * 2),'y':0});
			this.add_vertex({'x':cnt - h_bw,'y':0 - h_bw});
			this.add_vertex({'x':cnt + h_bw,'y':0 - h_bw});
			this.add_vertex({'x':cnt + (h_bw * 2),'y':0});
		};
		this.add_vertex({'x':this.width,'y':0});
		this.add_vertex({'x':this.width,'y':this.height});
		this.add_vertex({'x':0,'y':this.height});
	}
});