var Game = OZ.Class();

Game.COLORS = ["red", "green", "blue", "yellow", "magenta", "cyan"];

Game.prototype.init = function() {
	var colors = 3;
	if (localStorage.getItem("colors")) {
		colors = parseInt(localStorage.getItem("colors"));
	}
	var select = OZ.$("colors");
	select.value = colors;
	Game.COLORS.splice(colors, Game.COLORS.length-colors);
	OZ.Event.add(select, "change", this._changeColor.bind(this));

	var size = [10, 10];
	if (localStorage.getItem("size")) {
		size = localStorage.getItem("size").split(",");
		size.map(function($){return parseInt($);});
	}
	this._size = size;
	var select = OZ.$("size");
	select.value = this._size.join(",");
	OZ.Event.add(select, "change", this._changeSize.bind(this));

	this._cellSize = [25, 25];
	this._data = [];
	
	
	var canvas = OZ.DOM.elm("canvas");
	canvas.width = this._size[0]*this._cellSize[0];
	canvas.height = this._size[1]*this._cellSize[1];
	this._ctx = canvas.getContext("2d");
	
	document.body.appendChild(canvas);
	
	this._initData();
	OZ.Event.add(canvas, "click", this._click.bind(this));
}

Game.prototype._changeColor = function(e) {
	var colors = OZ.Event.target(e).value;
	localStorage.setItem("colors", colors);
	location.reload();
}

Game.prototype._changeSize = function(e) {
	var size = OZ.Event.target(e).value;
	localStorage.setItem("size", size);
	location.reload();
}

Game.prototype._initData = function() {
	for (var i=0;i<this._size[0];i++) {
		this._data.push([]);
		for (var j=0;j<this._size[1];j++) {
			this._data[i].push(Math.floor(Math.random() * Game.COLORS.length));
		}
	}
	
	this._redraw();
}

Game.prototype._draw = function(x, y) {
	var color = this._data[x][y];
	var w = this._cellSize[0];
	var h = this._cellSize[1];
	var left = x * w;
	var top = y * h;
	if (color == -1) {
		this._ctx.clearRect(left, top, w, h);
	} else {	 
		this._ctx.fillStyle = Game.COLORS[color];
		this._ctx.fillRect(left, top, w, h);
	}
}

Game.prototype._click = function(e) {
	var pos = OZ.DOM.pos(this._ctx.canvas);
	var x = e.clientX - pos[0];
	var y = e.clientY - pos[1];
	x = Math.floor(x / this._cellSize[0]);
	y = Math.floor(y / this._cellSize[1]);
	
	this._explode(x, y);
	this._checkEnd();
}

Game.prototype._explode = function(x, y) {
	var color = this._data[x][y];
	if (color == -1) { return; }
	var all = this._getArea(x, y);
	if (all.length == 1) { return; }
	
	for (var i=0;i<all.length;i++) {
		var c = all[i];
		var x = c[0];
		var y = c[1];
		this._data[x][y] = -1;
		this._draw(x, y);
	}
	
	this._sync();
	this._redraw();
}

Game.prototype._sync = function() {
	var cols = this._size[0];
	for (var i=0;i<cols;i++) {
		var colEmpty = true;
		var removed = 0;
		for (var j=this._size[1]-1;j>=0;j--) {
			var v = this._data[i][j];
			if (v == -1) { /* empty - remember */
				removed++;
			} else { /* not empty - shift, mark col as not empty */
				if (removed > 0) {
					this._data[i][j+removed] = v;
					this._data[i][j] = -1;
				}
				colEmpty = false;
			}
		}
		
		if (colEmpty) { /* remove whole column => append it to the end */
			var col = this._data.splice(i, 1)[0];
			this._data.push(col);
			cols--;
			i--;
		}
	}
}

Game.prototype._redraw = function() {
	for (var i=0;i<this._size[0];i++) {
		for (var j=0;j<this._size[1];j++) {
			this._draw(i, j);
		}
	}
}	

Game.prototype._getArea = function(x, y) {
	var color = this._data[x][y];
	var dirs = [
		[ 1,  0],
		[-1,  0],
		[ 0,  1],
		[ 0, -1],
	];
	var cache = {};
	var result = [];
	
	var visit = function(x, y) {
		var c = this._data[x][y];
		if (c != color) { return; }
		cache[x+"-"+y] = 1;
		result.push([x, y]);
		for (var i=0;i<dirs.length;i++) {
			var xx = x + dirs[i][0];
			var yy = y + dirs[i][1];
			if (xx < 0 || xx == this._size[0] || yy < 0 || yy == this._size[1]) { continue; }
			if (xx+"-"+yy in cache) { continue; }
			arguments.callee.call(this, xx, yy);
		}
	}
	
	visit.call(this, x, y);
	return result;
}

Game.prototype._checkEnd = function() {
	var nonEmpty = 0;
	
	for (var i=0;i<this._size[0];i++) {
		for (var j=0;j<this._size[1];j++) {
			var v = this._data[i][j];
			if (v == -1) { continue; }
			nonEmpty++;
			var all = this._getArea(i, j);
			if (all.length > 1) { return; }
		}
	}
	
	if (nonEmpty) {
		alert("Game over, " + nonEmpty + " left");
	} else {
		alert("Congratulations!");
	}
}
