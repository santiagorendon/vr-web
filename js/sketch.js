/*jshint esversion: 10 */
var world;
var rings;
var textholder;
var cockpitImage;
var elevation;
var state = 'playing';
var tarmac, ground;
var torusArray = [];
var asteroidArray = [];
var cloudArray = [];
var projectiles = [];
var score = 0;
var user;
var sound;
var distanceTraveled = 0;
var planeSpeed = 0.05;
/* graphic settings */
var currentRender = 0;
var renderDistance = 200;
var renderCushion = 80; //distance to start rendering before reaching render distance
var cloudDensity = Math.round(0.4*renderDistance);
var torusDensity = Math.round(0.1*renderDistance);
var asteroidDensity = Math.round(0.1*renderDistance);
var shootButton

function preload() {
  sound = loadSound('point.mp3');
}

function setup() {
  noCanvas();
  world = new World('VRScene');
  world.camera.cursor.show();


  world.setFlying(true);
  container = new Container3D({});
  container2 = new Container3D({}); // container for tarmac and ground

  tarmac = new Plane({ // tarmac
    x: 0,
    y: 0.1,
    width: 10,
    height: 100,
    asset: 'pavement',
    repeatX: 10,
    repeatY: 100,
    rotationX: -90
  });

  ground = new Plane({ // regular ground
    width: 3000,
    height: 3000,
    rotationX: -90,
    asset: "ground",
    repeatX: 500,
    repeatY: 500,
  });
  container2.add(tarmac);
  container2.add(ground);
  world.add(container2);

  // add image to HUD
  cockpitImage = new Plane({
    x: 0,
    y: 0,
    z: 0,
    scaleX: 3,
    scaleY: 3,
    transparent: true,
    asset: 'cockpit',
  });
  container.addChild(cockpitImage);
  world.camera.cursor.addChild(container);

  accelerateButton = new Cylinder({
     x: .2,
     y: -.5,
     z: 0,
     red: 0,
     green: 255,
     blue: 0,
     radius: .05,
     height: .1,
     rotationX: 45,
     clickFunction: function(me){
       planeSpeed += .1
     }
    });

    deaccelerateButton = new Cylinder({
       x: -.2,
       y: -.5,
       z: 0,
       red: 255,
       green: 0,
       blue: 0,
       radius: .05,
       height: .1,
       rotationX: 45,
       clickFunction: function(me){
         if (planeSpeed >= .1){
           planeSpeed -= .1
         }
       }
      });

    container.addChild(accelerateButton);
    container.addChild(deaccelerateButton);


}



function keyPressed() {
  if (keyCode === 32) { // space bar pressed
    projectiles.push(new Projectile());
  }
}

function drawProjectiles() {
  for (let i = 0; i < projectiles.length; i++) {
    projectiles[i].move();
    // get WORLD position for this projectile
    var projectilePosition = projectiles[i].projectile.getWorldPosition();
    // remove projectiles thay go to far
    if (projectilePosition.x > 50 || projectilePosition.x < -50 || projectilePosition.z > distanceTraveled + 50 || projectilePosition.z < distanceTraveled - 50) {
      world.remove(projectiles[i].container);
      projectiles.splice(i, 1);
      i -= 1;
      continue;
    }
    // otherwise check for collisions with our targets
    for (let j = 0; j < asteroidArray.length; j++) {
      // compute distance
      const sphere = asteroidArray[j].sphere;
      const d = dist(projectilePosition.x, projectilePosition.y, projectilePosition.z, sphere.getX(), sphere.getY(), sphere.getZ());
      if (d <= 2) { // asteroid hit
        world.remove(sphere);
        asteroidArray.splice(j, 1);
        break;
      }
    }
  }
}

function removeAsteroids() {
  for (let i = 0; i < asteroidArray.length; i++) {
    if (asteroidArray[i].sphere.getZ() - 5 > distanceTraveled) { //if plane passed torus
      world.remove(asteroidArray[i].sphere);
      asteroidArray.splice(i, 1);
      i -= 1;
    }
  }
}

function createAsteroids() {
  let startPoint = distanceTraveled - renderCushion;
  // start rendering toruses closer if its first set rendered
  if (distanceTraveled === 0) {
    startPoint = 0;
  }
  for (let i = 0; i < asteroidDensity; i++) {
    asteroidArray.push(new Asteroid(startPoint, startPoint - renderDistance));
  }
}

function removeClouds() {
  for (let i = 0; i < cloudArray.length; i++) {
    if (cloudArray[i].cloud.getZ() - 5 > distanceTraveled) { //if plane passed cloud
      world.remove(cloudArray[i].cloud);
      cloudArray.splice(i, 1);
      i -= 1;
    }
  }
}

function createClouds() {
  let startPoint = -distanceTraveled - renderCushion;
  //start rendering clouds closer if its first set rendered
  if (distanceTraveled === 0) {
    startPoint = 0;
  }
  // create clouds
  for (let i = 0; i < cloudDensity; i++) {
    cloudArray.push(new Cloud(startPoint, startPoint - renderDistance));
  }
}

function removeToruses() {
  for (let i = 0; i < torusArray.length; i++) {
    if (torusArray[i].torus.getZ() - 5 > distanceTraveled) { //if plane passed torus
      world.remove(torusArray[i].torus);
      torusArray.splice(i, 1);
      i -= 1;
    }
  }
}

function createToruses() {
  let startPoint = distanceTraveled - renderCushion;
  // start rendering toruses closer if its first set rendered
  if (distanceTraveled === 0) {
    startPoint = 0;
  }
  for (let i = 0; i < torusDensity; i++) {
    torusArray.push(new TorusClass(startPoint, startPoint - renderDistance));
  }
}

function draw() {
  if (distanceTraveled < -currentRender+renderCushion) {
    currentRender += renderDistance;
    createClouds();
    createToruses();
    createAsteroids();
  }
  // dont render objects that the plane no longer sees
  removeClouds();
  removeToruses();
  removeAsteroids();
  drawProjectiles();

  user = world.getUserPosition(); // user's position
  elevation = world.getUserPosition().y; // user's y
  elevation = Math.round(elevation); // round it

  if (elevation <= 0) { // if they go too low, game is over
    state = 'crash';
  } else if (elevation >= 2) { // increase speed once taken off
    // planeSpeed = 0.15;
  }

  if (state == 'crash') { // create a blank game over field
    let plane3 = new Plane({
      x: 0,
      y: -0.5,
      z: 0,
      scaleX: 3,
      scaleY: 3
    });
    container.addChild(plane3);
    container2.remove(ground);
    container2.remove(tarmac);

    // remove score
    cockpitImage.tag.setAttribute('text',
      'value: ' + ' ' + '; color: rgb(0,0,0); align: center;');
    // tell user it's game over
    plane3.tag.setAttribute('text',
      'value: ' + ('game over') + '; color: rgb(0,0,0); align: center;');
  } else { // when plane is not crashed
    world.moveUserForward(planeSpeed); // move
    distanceTraveled = world.camera.getZ();
    cockpitImage.tag.setAttribute('text', 'value: ' + (score) + '; color: rgb(0,0,0); align: center;');

    // if user gets a point
    for (let i = 0; i < torusArray.length; i++) {
      if (dist(torusArray[i].torus.x, torusArray[i].torus.y, torusArray[i].torus.z, user.x, user.y, user.z) <= 1) {
        if (!sound.isPlaying()) {
          sound.play();
        }
        score += 1;
        torusArray.splice(i, 1);
        i -= 1;
      }
    }
  }
}



class Projectile {
  constructor() {
    //find out where user is
    var userPosition = world.getUserPosition();
    //get the direction they are facing
    var userRotation = world.getUserRotation();
    this.projectileSpeed = 1;
    this.container = new Container3D({
      x: userPosition.x,
      y: userPosition.y,
      z: userPosition.z - 0.8,
      rotationX: userRotation.x,
      rotationY: userRotation.y,
      rotationZ: userRotation.z
    });
    world.add(this.container);
    this.projectile = new Box({
      x: 0,
      y: 0,
      z: 0,
      width: 0.05,
      height: 0.05,
      depth: 0.5,
      red: 255,
      blue: 0,
      green: 0
    });
    // add the projectile to the container
    this.container.addChild(this.projectile);
  }
  move() {
    // easy peasy - the projectile just moves along the z-axis by a certain amount
    // since it's been placed into a container that is already rotated correctly
    this.projectile.nudge(0, 0, -this.projectileSpeed);
  }
}

class Cloud {
  constructor(start, end) {
    this.cloud = new OBJ({
      asset: 'cloud.obj',
      mtl: 'cloud.mtl',
      x: random(-200, 200),
      y: random(10, 100),
      z: random(start, end),
      scaleX: 3,
      scaleY: 3,
      scaleZ: 3
    });
    world.add(this.cloud);
  }
}
class Asteroid {
  constructor(start, end) {
    this.sphere = new Sphere({
      x: random(-10, 10),
      y: random(2, 30),
      z: random(start, end),
      asset: "asteroid",
      radius: 1.5,
      rotationX: random(0, 360)
    });
    world.add(this.sphere);
  }
}
class TorusClass {
  constructor(start, end) {
    this.torus = new Torus({
      x: random(-10, 10),
      y: random(2, 30),
      z: random(start, end),
      red: random(255),
      green: random(255),
      blue: random(255),
      radius: 1.5,
      clickFunction: function(torusInstance) {
        torusInstance.setColor(0, 255, 0);
      }
    });
    world.add(this.torus);
  }
}
