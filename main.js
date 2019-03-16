window.onload = function () {
  var socket = io.connect("http://24.16.255.56:8888");

  socket.on("load", function (data) {
      console.log(data.data);
      var data = data.data;
      for (var i = 0; i < gameEngine.entities.length; i ++) {
         gameEngine.entities[i].x = data[i].x;
         gameEngine.entities[i].y = data[i].y;
         gameEngine.entities[i].it = data[i].it;
         gameEngine.entities[i].radius = data[i].radius;
         gameEngine.entities[i].visualRadius = data[i].visualRadius;
         gameEngine.entities[i].colors = data[i].colors;
         gameEngine.entities[i].die = data[i].die;
         gameEngine.entities[i].velocity = data[i].velocity;
      }
  });

  var text = document.getElementById("text");
  var saveButton = document.getElementById("save");
  var loadButton = document.getElementById("load");

  saveButton.onclick = function () {
    console.log("save");
    text.innerHTML = "Saved."
    var savedata = [];
    for (var i =0; i < gameEngine.entities.length; i ++) {
      savedata.push({x:gameEngine.entities[i].x, y: gameEngine.entities[i].y
         , it: gameEngine.entities[i].it, radius: gameEngine.entities[i].radius
         , visualRadius: gameEngine.entities[i].visualRadius, colors: gameEngine.entities[i].colors
         , die: gameEngine.entities[i].die, velocity: gameEngine.entities[i].velocity});
    }

    socket.emit("save", { studentname: "Steven Huang", statename: "aState", data: savedata });
  };

  loadButton.onclick = function () {
    console.log("load");
    text.innerHTML = "Loaded."
    socket.emit("load", { studentname: "Steven Huang", statename: "aState" });
  };

};



// GameBoard code below

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function Circle(game) {
    this.player = 1;
    this.radius = 10;
    this.visualRadius = 500;
    this.colors = ["Red", "Green", "Blue", "White"];
    this.setNotIt();
    this.x = this.radius + Math.random() * (700 - this.radius * 2);
    this.y = this.radius + Math.random() * (700 - this.radius * 2);
    Entity.call(this, game, this.x, this.y);

    this.die = 0;
    this.game = game;

    this.velocity = { x: Math.random() * 1000, y: Math.random() * 1000 };
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
};

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.setIt = function () {
    this.it = true;
    this.color = 0;
    this.visualRadius = 500;
    this.velocity.x *= 1.5;
    this.velocity.y *= 1.5;
    this.radius = 10;
};

Circle.prototype.setNotIt = function () {
    this.it = false;
    this.visualRadius = 50;
    if (!this.die) {
        this.color = 3;
    } else if (this.die > 0 && this.die < 6) {
        this.color = 1;
        this.velocity.x *= 1.5;
        this.velocity.y *= 1.5;
    } else if (this.die > 5) {
        this.color = 2;
        this.velocity.x *= 1.7;
        this.velocity.y *= 1.7;
    }
    if (this.color === 1) {
        this.radius = 15;
    }
    if (this.color === 2) {
        this.radius = 20;
    }
};

Circle.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Circle.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

Circle.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Circle.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);
 //  console.log(this.velocity);

    // this.x += this.velocity.x * this.game.clockTick;
    // this.y += this.velocity.y * this.game.clockTick;

    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            var temp = { x: this.velocity.x, y: this.velocity.y };

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x)/dist;
            var difY = (this.y - ent.y)/dist;

            this.x += difX * delta / 2;
            this.y += difY * delta / 2;
            ent.x -= difX * delta / 2;
            ent.y -= difY * delta / 2;

            this.velocity.x = ent.velocity.x * friction;
            this.velocity.y = ent.velocity.y * friction;
            ent.velocity.x = temp.x * friction;
            ent.velocity.y = temp.y * friction;
            this.x += this.velocity.x * this.game.clockTick;
            this.y += this.velocity.y * this.game.clockTick;
            ent.x += ent.velocity.x * this.game.clockTick;
            ent.y += ent.velocity.y * this.game.clockTick;
            if (this.it && !ent.it ) {
                if (this.die < 10)
                    this.setNotIt();//white
                ent.setIt();//red
                ent.die ++;
            }
            else if (ent.it && !this.it) {
                this.setIt();
                if (ent.die < 10)
                    ent.setNotIt();
                this.die ++;
            }
            
        }

        if (ent != this && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            if (this.it && dist > this.radius + ent.radius + 10) {
                var difX = (ent.x - this.x)/dist;
                var difY = (ent.y - this.y)/dist;
                this.velocity.x += difX * acceleration / (dist*dist);
                this.velocity.y += difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }
            if (ent.it && dist > this.radius + ent.radius) {
                var difX = (ent.x - this.x) / dist;
                var difY = (ent.y - this.y) / dist;
                this.velocity.x -= difX * acceleration / (dist * dist);
                this.velocity.y -= difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }
        }
    }
    // if (this.game.click && !gameOver) {
    //     this.game.click = false;
    //     var random = Math.round(Math.random()*5);
    //     var circle = new Circle(this.game);
    //     if (random == 2) {
    //         circle.setIt();
    //         this.game.addEntity(circle);
    //     } else if (random % 2) {
    //         this.game.addEntity(circle);
    //     } else if (random == 4) {
    //         this.removeFromWorld = true;
    //     }

    // }
    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
};

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

};



// the "main" code begins here
var friction = 1;
var acceleration = 100000;
var maxSpeed = 300;
var gameOver = false;
var gameEngine;

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
ASSET_MANAGER.queueDownload("./img/black.png");
ASSET_MANAGER.queueDownload("./img/white.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');


    gameEngine = new GameEngine();
    var circle = new Circle(gameEngine);
    circle.setIt();
    gameEngine.addEntity(circle);
    circle = new Circle(gameEngine);
    circle.setIt();
    gameEngine.addEntity(circle);
    for (var i = 0; i < 12; i++) {
        circle = new Circle(gameEngine);
        gameEngine.addEntity(circle);
    }
    gameEngine.init(ctx);
    gameEngine.start();
});
