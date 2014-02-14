var bouncinghearts = {};

bouncinghearts.demo = (function() {

	// Box2d vars
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2BodyDef = Box2D.Dynamics.b2BodyDef;
	var b2Body = Box2D.Dynamics.b2Body;
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	var b2Fixture = Box2D.Dynamics.b2Fixture;
	var b2World = Box2D.Dynamics.b2World;
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
	var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	

	// demo vars
	var canvas, context;
	var birdDelayCounter = 0; // counter for delaying creation of birds
	var focused = true;
	var hearts = ["heart_1.png","heart_2.png","heart_3.png","heart_4.png","heart_5.png"];
	var heartMessages = [ "sexy rita", "R-♥-P", "be mine","my love", "xoxo", "cute", "you rock","cutie pie","call me","you're sweet","kiss me","love bug","how nice","that smile","you& me"];
	var alertMessages = ["Chinese Buffets For Your Sister's Birthday","Face Painting","Gymnastics","Parent Teacher Night","Sand Sculptures At The Shore","The Best Sex Ever","I Hop", "Drawing Pictures","Hoboken Hospital","The Park","The Lake","Pancakes","My Little Pony","Spiders","Brass Knuckles","Queens Science Museum","Applefest And Apple Picking","Hay Rides","Camping","Hoolihans","Jersey Shore","Meadowlands Fair", "Danika And The Girls","Charlie","Roosevelt Island","Bike Rides","Smoking In The Bathroom","I Love You!", "Sleep Overs", "You Make Me Smile!", "You're Beautiful!","You're Sweet!","R U A Beaver? Cuz Damn!"];
	var usedMessages=[];
	var alertText;
	var alertBG;
	

	$(document).ready(function() {
		// setup functions to run once page is loaded
		console.log("document ready");
		setup.canvas();
		setup.ticker();
		box2d.setup();
		window.onfocus = onFocus;
		window.onblur = onBlur;
	});

	function onFocus() { focused = true; box2d.pauseResume(false); $('#paused').css({'display':'none'}); }
	function onBlur() { focused = false; box2d.pauseResume(true); $('#paused').css({'display':'block'}); }

/* ------ SETUP ------- */
// initial setup of canvas, contexts, and render loop

	var setup = (function() {

		var canvas = function() {
			canvas = document.getElementById('demoCanvas');
			
			context = canvas.getContext('2d');
			
			stage = new createjs.Stage(canvas);
			stage.snapPixelsEnabled = true;
			createjs.Touch.enable(stage);
			
			
			canvas.width  = window.innerWidth;
			canvas.height = window.innerHeight;
		
			bouncinghearts.demo.updateAlert("Click A Heart For A Speial Valentines Message :-)");
			
			console.log("setup stage width = "+stage.canvas.width+" stage height = "+stage.canvas.height);
		}

		var ticker = function() {
			console.log("ticker");
			createjs.Ticker.setFPS(30);
			//Ticker.useRAF = true;
			createjs.Ticker.addEventListener("tick",bouncinghearts.demo.tick);  // looks for "tick" function within the bouncinghearts.demo object
		}

		return {
			canvas: canvas,
			ticker: ticker
		}
	})();

/* ------- Birds --------- */
// bitmap birds to be sent to box2d

	var birds = (function() {
		
		var spawn = function() {
			
			var self = this;
			
			var img = hearts[Math.floor(Math.random() * hearts.length)];
			
			var birdBMP = new createjs.Bitmap("images/"+img);
			var birdCont = new createjs.Container();
			birdCont.addChild(birdBMP);
			
			var message = heartMessages[Math.floor(Math.random() * heartMessages.length)];
			var messages = message.split(" ");
			if(messages.length>1){
				message = messages[0]+"\n"+messages[1];
			}
			var text = new createjs.Text(message, "14px Arial", "#a93179");
			text.textBaseline = "top";
			text.textAlign = "center";
			
			
			if(messages.length>1){
				text.x = 22;
				text.y = 5;
			}else{
				text.x = 22;
				text.y = 10;
			}
			
			
			
			var bounds = text.getBounds();
			var pad = 10;
			var bg = new createjs.Shape();
			bg.graphics.beginFill("#114").drawRect(text.x-pad+bounds.x, text.y-pad+bounds.y, bounds.width+pad*2, bounds.height+pad*2);
			//birdCont.addChildAt(bg,1);
			
			birdCont.addChild(text);
			
			birdCont.x = Math.round(Math.random()*stage.canvas.width);
			birdCont.y = -30;
			birdCont.regX = 25;   // important to set origin point to center of your bitmap
			birdCont.regY = 25; 
			birdCont.snapToPixel = true;
			birdCont.mouseEnabled = true;
			
			birdCont.addEventListener("click", bouncinghearts.demo.handleClick);
			
			
			stage.addChild(birdCont);
			box2d.createBird(birdCont);
		}
		
		return {
			spawn: spawn
		}
	})();

/* ------- Box2D --------- */
// handles all physics movement

	var box2d = (function() {

		// important box2d scale and speed vars
		var SCALE = 30, STEP = 20, TIMESTEP = 1/STEP;

		var world;
		var lastTimestamp = Date.now();
		var fixedTimestepAccumulator = 0;
		var bodiesToRemove = [];
		var actors = [];
		var bodies = [];

		// box2d world setup and boundaries
		var setup = function() {
			world = new b2World(new b2Vec2(0,10), true);
			console.log("setup box2d stage width = "+stage.canvas.width+" stage height = "+stage.canvas.height);
			// boundaries - floor
			var floorFixture = new b2FixtureDef;
			floorFixture.density = 1;
			floorFixture.restitution = 1;
			floorFixture.shape = new b2PolygonShape;
			floorFixture.shape.SetAsBox((stage.canvas.width+50) / SCALE, 10 / SCALE);
			var floorBodyDef = new b2BodyDef;
			floorBodyDef.type = b2Body.b2_staticBody;
			floorBodyDef.position.x = -25 / SCALE;
			floorBodyDef.position.y = (stage.canvas.height+9) / SCALE;
			var floor = world.CreateBody(floorBodyDef);
			floor.CreateFixture(floorFixture);
			// boundaries - left
			var leftFixture = new b2FixtureDef;
			leftFixture.shape = new b2PolygonShape;
			leftFixture.shape.SetAsBox(10 / SCALE, (stage.canvas.height+50) / SCALE);
			var leftBodyDef = new b2BodyDef;
			leftBodyDef.type = b2Body.b2_staticBody;
			leftBodyDef.position.x = -9 / SCALE;
			leftBodyDef.position.y = -25 / SCALE;
			var left = world.CreateBody(leftBodyDef);
			left.CreateFixture(leftFixture);
			// boundaries - right
			var rightFixture = new b2FixtureDef;
			rightFixture.shape = new b2PolygonShape;
			rightFixture.shape.SetAsBox(10 / SCALE, (stage.canvas.height+50) / SCALE);
			var rightBodyDef = new b2BodyDef;
			rightBodyDef.type = b2Body.b2_staticBody;
			rightBodyDef.position.x = (stage.canvas.width+9) / SCALE;
			rightBodyDef.position.y = -25 / SCALE;
			var right = world.CreateBody(rightBodyDef);
			right.CreateFixture(rightFixture);
		}

		

		// actor object - this is responsible for taking the body's position and translating it to your easel display object
		var actorObject = function(body, skin) {
			this.body = body;
			this.skin = skin;
			this.update = function() {  // translate box2d positions to pixels
				this.skin.rotation = this.body.GetAngle() * (180 / Math.PI);
				this.skin.x = this.body.GetWorldCenter().x * SCALE;
				this.skin.y = this.body.GetWorldCenter().y * SCALE;
			}
			actors.push(this);
		}

		// create bird body shape and assign actor object
		var createBird = function(skin) {
			var birdFixture = new b2FixtureDef;
			birdFixture.density = 1;
			birdFixture.restitution = 0.6;
			birdFixture.shape = new b2CircleShape(24 / SCALE);
			var birdBodyDef = new b2BodyDef;
			birdBodyDef.type = b2Body.b2_dynamicBody;
			birdBodyDef.position.x = skin.x / SCALE;
			birdBodyDef.position.y = skin.y / SCALE;
			var bird = world.CreateBody(birdBodyDef);
			bird.CreateFixture(birdFixture);

			// assign actor
			var actor = new actorObject(bird, skin);
			bird.SetUserData(actor);  // set the actor as user data of the body so we can use it later: body.GetUserData()
			bodies.push(bird);
		}

		// remove actor and it's skin object
		var removeActor = function(actor) {
			stage.removeChild(actor.skin);
			actors.splice(actors.indexOf(actor),1);
		}

		// box2d update function. delta time is used to avoid differences in simulation if frame rate drops
		var update = function() {
			//console.log("update");
			var now = Date.now();
			var dt = now - lastTimestamp;
			fixedTimestepAccumulator += dt;
			lastTimestamp = now;
			while(fixedTimestepAccumulator >= STEP) {
				// remove bodies before world timestep
				for(var i=0, l=bodiesToRemove.length; i<l; i++) {
					removeActor(bodiesToRemove[i].GetUserData());
					bodiesToRemove[i].SetUserData(null);
					world.DestroyBody(bodiesToRemove[i]);
				}
				bodiesToRemove = [];

				// update active actors
				for(var i=0, l=actors.length; i<l; i++) {
					actors[i].update();
				}

				world.Step(TIMESTEP, 10, 10);

				fixedTimestepAccumulator -= STEP;
				world.ClearForces();
	   			
	   			
	   			if(bodies.length > 30) {
	   				bodiesToRemove.push(bodies[0]);
	   				bodies.splice(0,1);
	   			}
			}
		}

		var pauseResume = function(p) {
			console.log("pauseResume");
			if(p) { TIMESTEP = 0;
			} else { TIMESTEP = 1/STEP; }
			lastTimestamp = Date.now();
		}

		return {
			setup: setup,
			update: update,
			createBird: createBird,
			pauseResume: pauseResume
		}
	})();

/* ------- UPDATE -------- */
// main update loop for rendering assets to canvas

	var tick = function(dt, paused) {
		//console.log("tick");
		if(focused) {
			box2d.update();
			stage.update();

			birdDelayCounter++;
			if(birdDelayCounter % 10 === 0) {  // delay so it doesn't spawn a bird on every frame
				birdDelayCounter = 0;
				birds.spawn();
			}
		}
	}

	var handleClick = function(){
		var message = alertMessages[Math.floor(Math.random() * alertMessages.length)];
		console.log("handle click message = "+message+" index of = "+usedMessages.indexOf(message));
		if(usedMessages.length>=alertMessages.length){
			usedMessages=[];
		}
		try{
			while(usedMessages.indexOf(message)>-1){
				message = alertMessages[Math.floor(Math.random() * alertMessages.length)];
			}
			usedMessages.push(message);
			updateAlert(message);
		}catch(e){
			updateAlert(message);
		}
		
	}
	
	var updateAlert = function(message){
		stage.removeChild(alertBG,alertText);
		
		
		alertText = new createjs.Text(message, "18px Arial", "#a93179");
		alertText.lineWidth=stage.canvas.width-50;
		alertText.textBaseline = "top";
		alertText.textAlign = "center";
		
		var width = alertText.getBounds().width+30;
		var height = alertText.getBounds().height+20;
		
		alertBG = new createjs.Shape();
		alertBG.graphics.beginFill("#f0d3e4").drawRoundRect(0,0,width,height,10);
		
		alertText.scaleX=10;
		alertText.scaleY=10;
		
		alertText.x = stage.canvas.width/2;
		alertText.y = stage.canvas.height/2-(10*alertText.scaleY);
		
		alertBG.scaleX=10;
		alertBG.scaleY=10;
		
		
		
		alertBG.x = stage.canvas.width/2-(width*alertBG.scaleX)/2;
		alertBG.y = stage.canvas.height/2-(height*alertBG.scaleY)/2;
		
		stage.addChild(alertBG,alertText);
		stage.setChildIndex(alertBG,stage.getNumChildren()-1);
		stage.setChildIndex(alertText,stage.getNumChildren()-1);
		
		createjs.Tween.get(alertBG,{loop:false})
		.to({scaleX:1,scaleY:1,x:stage.canvas.width/2-width/2,y:stage.canvas.height/2-10},1000,createjs.Ease.bounceOut) // tween to scaleX/Y of 1 with ease bounce out
		
		createjs.Tween.get(alertText,{loop:false})
		.to({scaleX:1,scaleY:1,y:stage.canvas.height/2},1000,createjs.Ease.bounceOut)
		
	}
	
/* ------- GLOBAL -------- */
// main global functions

	return {
		tick: tick,
		handleClick: handleClick,
		updateAlert: updateAlert
	}

}());
