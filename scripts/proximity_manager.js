var ProximityManager = function(_grid_size){
	this.grid_size = _grid_size || 25;
	var display_objects = {};
	var cached_results = [];
	var positions = [];
	this.add_item = function(displayable){
		display_objects[displayable.__id__] = displayable;
	};
	this.remove_item = function(displayable){
		return delete(display_objects[displayable.__id__]);
	};
	this.refresh = function(){
		var m = display_objects;
		var p = [];
		var off = this.grid_size * 1024;
		for(var o in display_objects){
			var displayable = display_objects[o];
			var index = ((displayable.x + off) / this.grid_size) << 11 | ((displayable.y + off) / this.grid_size);
			if(p[index] == null){p[index] = [displayable]; continue;};
			p[index].push(displayable);
		};
		cached_results = [];
		positions = p;
	};
	this.get_neighbors = function(displayble){
		var off = this.grid_size * 1024;
		var index = ((displayble.x + off) / this.grid_size) << 11 | ((displayble.y + off) / this.grid_size);
		if(cached_results[index]) return cached_results[index];
		var p = positions;
		var r = p[index];
		if(r == null) r = [];
		if(p[index - 2048 - 1]) r = r.concat(p[index - 2048 - 1]);
		if(p[index - 1]) r = r.concat(p[index - 1]);
		if(p[index + 2048 - 1]) r = r.concat(p[index + 2048 - 1]);
		if(p[index - 2048]) r = r.concat(p[index - 2048]);
		if(p[index + 2048]) r = r.concat(p[index + 2048]);
		if(p[index - 2048 + 1]) r = r.concat(p[index - 2048 + 1]);
		if(p[index + 1]) r = r.concat(p[index + 1]);
		if(p[index + 2048 + 1]) r = r.concat(p[index + 2048 + 1]);
		cached_results[index] = r;
		return r;
	};
};