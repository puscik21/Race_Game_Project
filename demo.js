//////// global variables //////////////
var camera, scene, renderer, stats, carModel, carModel2, materialsLib, envMap, ambientLight;

var clock = new THREE.Clock();

var lightHolder = new THREE.Group();
var cameraTarget = new THREE.Vector3();
var origin = new THREE.Vector3();
damping = 5.0;
distance = 5;

var car2 = new THREE.Car2();
var car = new THREE.Car();
var carParts2 = {
	body: [],
	rims:[],
	glass: [],
};
car.turningRadius = 75;
car2.turningRadius = 75;
var carParts = {
	body: [],
	rims:[],
	glass: [],
};

// both used to make camera follow smootly the car
var cameraGoal = new THREE.Object3D;
var cameraGoal2 = new THREE.Object3D;
var temp = new THREE.Vector3;
var temp2 = new THREE.Vector3;

var box1, box2;
var shape;

var mesh;
var mesh2;
var vehicle;
var vehicle2;

var box;
var test;

var windowWidth;
var	windowHeight;

var views = [
	{
		left: 0,
		top: 0,
		width: 1,
		height: 0.5,
		background: new THREE.Color( 0, 0, 0 ),
		eye: [ 0, 0, 0 ],
		up: [ 0, 1, 0 ],
		fov: 45,
		updateCamera: function ( camera, target, temp) {

			camera.position.z -= 1;
			camera.position.y -= 0.25;
			camera.lookAt( target.position );
			camera.position.lerp(temp, 0.3);
		}
	},
	{
		left: 0,
		top: 0.5,
		width: 1,
		height: 0.5,
		background: new THREE.Color( 0, 0, 0 ),
		eye: [ 0, 0, 0 ],
		up: [ 0, 1, 0 ],
		fov: 45,
		updateCamera: function ( camera, target, temp ) {

			camera.position.z -= 1;
			camera.position.y -= 0.25;
			camera.lookAt( target.position );
			camera.position.lerp(temp, 0.3);

		}
	}
];

var raceTrack;

var track;

'use strict';
Physijs.scripts.worker = 'js/physics/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';


function init(){
	TWEEN.start();

	scene = new Physijs.Scene({ fixedTimeStep: 1 / 120 });
	scene.setGravity(new THREE.Vector3(0, -30, 0));
	scene.addEventListener(
		'update',
		function(){
			scene.simulate(undefined, 1);
			stats.update();
		}
	);
	// making fog
	// scene.fog = new THREE.Fog( 0xd7cbb1, 1, 160 );

	// camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

	for ( var i = 0; i < views.length; ++ i ) {
		var view = views[ i ];
		var camera = new THREE.PerspectiveCamera( view.fov, window.innerWidth / window.innerHeight, 0.1, 1000 );

		camera.position.fromArray( view.eye );
		camera.up.fromArray( view.up );
		view.camera = camera;
	}


	var ground_material = Physijs.createMaterial( 
			new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'textures/ground/rocks.jpg' ) }),
		0.6,  	//friction
		0.3		//restitution
	);
	ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
	ground_material.map.repeat.set( 25, 100 );

	ground = new Physijs.BoxMesh(
		new THREE.CubeGeometry( 500, 2000, 1),
		//new THREE.PlaneGeometry(50, 50),
		ground_material,
		0 // mass
	);

	box = new Physijs.BoxMesh(
		new THREE.CubeGeometry(4, 4, 100),
		ground_material,
		0
	);
	box.position.z += 50;
	box.setCcdMotionThreshold(1);
	box.setCcdSweptSphereRadius(0.2);
	// scene.add(box);

	// by default ground is created in Y axis
	ground.rotation.x = - Math.PI / 2;
	ground.receiveShadow = true;
	ground.renderOrder = 1;
	ground.position.y -= 0.5;
	scene.add( ground );

	// adding nice grid to the ground - prob we will use texture anyway, so...
	var grid = new THREE.GridHelper( 400, 40, 0x000000, 0x000000 );
	grid.material.opacity = 0.2;
	grid.material.depthWrite = false;
	grid.material.transparent = true;
	// scene.add( grid );


	// global light 
	ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
	scene.add(ambientLight);

	var hemiLight = new THREE.HemisphereLight( 0x7c849b, 0xd7cbb1, 0.1 );
	hemiLight.position.set( 0, 1, 0 );
	scene.add( hemiLight );

	// will be used to follow the car
	var shadowLight  = new THREE.DirectionalLight( 0xffffee, 0.5 );
	shadowLight.position.set( -1.5, 1.25, -1.5 );
	shadowLight.castShadow = true;
	shadowLight.shadow.width = 512;
	shadowLight.shadow.height = 512;
	shadowLight.shadow.camera.top = 2;
	shadowLight.shadow.camera.bottom = -2;
	shadowLight.shadow.camera.left = -2.5;
	shadowLight.shadow.camera.right = 2.5;
	shadowLight.shadow.camera.far = 5.75;
	shadowLight.shadow.bias = -0.025;

	lightHolder.add( shadowLight, shadowLight.target );
	scene.add(lightHolder);
	

	// create background skybox
	envMap = new THREE.CubeTextureLoader()
	.setPath( 'textures/cube/skybox/')
	.load( [ 'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg' ] );

	scene.background = envMap;
	
	// big R2-D2 object
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setTexturePath('models/obj/');
	mtlLoader.setPath('models/obj/');
	mtlLoader.load('r2-d2.mtl', function (materials) {
	 
	    materials.preload();
	 
	    var objLoader = new THREE.OBJLoader();
	    objLoader.setMaterials(materials);
	    objLoader.setPath('models/obj/');
	    objLoader.load('r2-d2.obj', function (object) {
	 		object.position.y -= 60;
	 		object.position.z += 1000;
	 		object.castShadow = true;
	 		object.receiveShadow = true;
	        scene.add(object);
	    });
	});


	// track = new Track();
	// track.loadTrack("Mountain");

	THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/' );
	var loader = new THREE.GLTFLoader();
	loader.setDRACOLoader( new THREE.DRACOLoader() );

	loader.load( 'models/gltf/MountainValley_Track.glb', function( track ) {

		var model = track.scene.children[ 0 ];
		model.position.y += 0.5;

		model.traverse( function ( child ) {

			if ( child.isMesh  ) {
				child.castShadow = true;
				child.receiveShadow = true;
				child.material.envMap = envMap;
			}
		} );

		scene.add(model);
	});

	// THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/' );
	// var loader = new THREE.GLTFLoader();
	// loader.setDRACOLoader( new THREE.DRACOLoader() );

	// loader.load( 'models/gltf/Mountain_Street.glb', function( gltf ) {
		
	// 	model = gltf.scene.children[ 0 ];
		
	// 	model.traverse( function ( child ) {

	// 		if ( child.isMesh  ) {
	// 			child.castShadow = true;
	// 			child.receiveShadow = true;
	// 			child.material.envMap = envMap;
	// 		}
	// 	} );

	// 	scene.add(model);
	// });






	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	stats = new Stats();
	container.appendChild( stats.domElement );

	initCarPhysicsMaterials();
	initMaterials();
	initCar();
	initCar2();


	var mat2 = Physijs.createMaterial(
		new THREE.MeshLambertMaterial({ color: 0xff0000, opacity: 1, transparent: true }),
		.9, // friction
		.3 // restitution
	);

	var box2 = new THREE.CubeGeometry( 2, 1, 4 );
	test = new Physijs.BoxMesh(
		box2,
		mat2,
		1
	);
	test.position.z -= 200;
	test.position.y = 1;
	scene.add(test);
	var rotation_matrix = new THREE.Matrix4().extractRotation(test.matrix);
	var force_vector = new THREE.Vector3(0 , 0, 300 ).applyMatrix4(rotation_matrix);
	test.applyCentralImpulse(force_vector);


	scene.simulate();

	// window.addEventListener( 'resize', onWindowResize, false );

	renderer.setAnimationLoop( function() {
		update();
		render();
	} );
}

function initCarPhysicsMaterials(){
	mat = Physijs.createMaterial(
	new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 0, transparent: true }),
		.9, // friction
		.3 // restitution
	);

	box = new THREE.CubeGeometry( 2, 1, 4.4 );
	carModel = new Physijs.BoxMesh(
		box,
		mat,
		1
	);
	carModel2 = new Physijs.BoxMesh(
		box,
		mat,
		1
	);
}

function initCar(){
	THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/' );
	var loader = new THREE.GLTFLoader();
	loader.setDRACOLoader( new THREE.DRACOLoader() );

	loader.load( 'models/gltf/ferrari.glb', function( gltf ) {
		carModel.position.set(0, 10, -50);
		
		var model = gltf.scene.children[ 0 ];
		// model.position.y -= 0.5;
		carModel.add(model);
		// add lightHolder to car so that the shadow will track the car as it moves
		// carModel.add( lightHolder );
		carModel.position.x += 5;

		car.setModel( carModel );

		carModel.traverse( function ( child ) {

			if ( child.isMesh  ) {
				child.castShadow = true;
				child.receiveShadow = true;
				child.material.envMap = envMap;
			}
		} );
		carModel.castShadow = false;

		// texture of this fancy shadow under the car
		var texture = new THREE.TextureLoader().load( 'models/gltf/ferrari_ao.png' );
		var shadow = new THREE.Mesh(
			new THREE.PlaneBufferGeometry( 0.655 * 4, 1.3 * 4 ).rotateX( - Math.PI / 2 ),
			new THREE.MeshBasicMaterial( { map: texture, opacity: 0.8, transparent: true } )
		);
		shadow.position.y += 0.01;
		shadow.renderOrder = 2;
		carModel.add( shadow );
		//goal is used to make camera movement smooth
		cameraGoal.position.set(0, 2.5, 5);
		carModel.add(cameraGoal);
		carModel.rotation.set(0, Math.PI, 0);
		// camera.position.z += 4;
		// camera.position.y += 2.5;
		scene.add( carModel );

		// car parts for material selection
		carParts.body.push( carModel.getObjectByName( 'body' ) );

		carParts.rims.push(
			carModel.getObjectByName( 'rim_fl' ),
			carModel.getObjectByName( 'rim_fr' ),
			carModel.getObjectByName( 'rim_rr' ),
			carModel.getObjectByName( 'rim_rl' ),
			carModel.getObjectByName( 'trim' ),
		);

		carParts.glass.push(
			carModel.getObjectByName( 'glass' ),
		 );

		updateMaterials();
	});
}

// TODO nice function that initialize both cars
function initCar2(){
	THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/' );
	var loader = new THREE.GLTFLoader();
	loader.setDRACOLoader( new THREE.DRACOLoader() );

	loader.load( 'models/gltf/ferrari.glb', function( gltf ) {
		carModel2.position.set(-6.5, 10, -50);
		
		var model = gltf.scene.children[ 0 ];
		// model.position.y -= 0.5;
		carModel2.add(model);
		// add lightHolder to car so that the shadow will track the car as it moves

		carModel2.position.x += 5;

		car2.setModel( carModel2 );
		carModel2.traverse( function ( child ) {

			if ( child.isMesh  ) {

				child.castShadow = true;
				child.receiveShadow = true;
				child.material.envMap = envMap;
			}
			carModel2.castShadow = false;

		} );

		// texture of this fancy shadow under the car
		var texture = new THREE.TextureLoader().load( 'models/gltf/ferrari_ao.png' );
		var shadow = new THREE.Mesh(
			new THREE.PlaneBufferGeometry( 0.655 * 4, 1.3 * 4 ).rotateX( - Math.PI / 2 ),
			new THREE.MeshBasicMaterial( { map: texture, opacity: 0.8, transparent: true } )
		);
		shadow.position.y += 0.01;
		shadow.renderOrder = 2;
		carModel2.add( shadow );
		//goal is used to make camera movement smooth
		cameraGoal2.position.set(0, 2.5, 5);
		carModel2.add(cameraGoal2);
		carModel2.rotation.set(0, Math.PI, 0);
		scene.add( carModel2 );

		// car parts for material selection
		carParts2.body.push( carModel2.getObjectByName( 'body' ) );

		carParts2.rims.push(
			carModel2.getObjectByName( 'rim_fl' ),
			carModel2.getObjectByName( 'rim_fr' ),
			carModel2.getObjectByName( 'rim_rr' ),
			carModel2.getObjectByName( 'rim_rl' ),
			carModel2.getObjectByName( 'trim' ),
		);

		carParts2.glass.push(
			carModel2.getObjectByName( 'glass' ),
		 );

		updateMaterials2();
	});
}


// list of various material colors
function initMaterials() {

	materialsLib = {

		main: [

			new THREE.MeshStandardMaterial( { color: 0xff4400, envMap: envMap, metalness: 0.9, roughness: 0.2, name: 'orange' } ),
			new THREE.MeshStandardMaterial( { color: 0x001166, envMap: envMap, metalness: 0.9, roughness: 0.2, name: 'blue' } ),
			new THREE.MeshStandardMaterial( { color: 0x990000, envMap: envMap, metalness: 0.9, roughness: 0.2, name: 'red' } ),
			new THREE.MeshStandardMaterial( { color: 0x000000, envMap: envMap, metalness: 0.9, roughness: 0.5, name: 'black' } ),
			new THREE.MeshStandardMaterial( { color: 0xffffff, envMap: envMap, metalness: 0.9, roughness: 0.5, name: 'white' } ),
			new THREE.MeshStandardMaterial( { color: 0x555555, envMap: envMap, envMapIntensity: 2.0, metalness: 1.0, roughness: 0.2, name: 'metallic' } ),

		],

		glass: [

			new THREE.MeshStandardMaterial( { color: 0xffffff, envMap: envMap, metalness: 0.9, roughness: 0.1, opacity: 0.15, transparent: true, premultipliedAlpha: true, name: 'clear' } ),
			new THREE.MeshStandardMaterial( { color: 0x000000, envMap: envMap, metalness: 0.9, roughness: 0.1, opacity: 0.15, transparent: true, premultipliedAlpha: true, name: 'smoked' } ),
			new THREE.MeshStandardMaterial( { color: 0x001133, envMap: envMap, metalness: 0.9, roughness: 0.1, opacity: 0.15, transparent: true, premultipliedAlpha: true, name: 'blue' } ),

		],

	}

}


// set materials to the current values of the selection menus
function updateMaterials() {

	// another numbers from materialsLib can be picked
	var bodyMat = materialsLib.main[ 2 ];
	var rimMat = materialsLib.main[ 5 ];
	var glassMat = materialsLib.glass[ 0 ];

	// changing color for each "part" of the car
	carParts.body.forEach( function ( part ) { part.material = bodyMat; } );
	carParts.rims.forEach( function ( part ) { part.material = rimMat; } );
	carParts.glass.forEach( function ( part ) { part.material = glassMat; } );

}

function updateMaterials2() {
	var bodyMat = materialsLib.main[ 5 ];
	var rimMat = materialsLib.main[ 3 ];
	var glassMat = materialsLib.glass[ 1 ];

	carParts2.body.forEach( function ( part ) { part.material = bodyMat; } );
	carParts2.rims.forEach( function ( part ) { part.material = rimMat; } );
	carParts2.glass.forEach( function ( part ) { part.material = glassMat; } );

}

function onWindowResize() {

	// camera.aspect = window.innerWidth / window.innerHeight;
	// camera.updateProjectionMatrix();
	windowWidth = window.innerWidth;
	windowHeight = window.innerHeight;

	renderer.setSize( windowWidth, windowHeight );

}

function onFollowCameraToggle() {

	carModel.position.copy( origin );

}


function update() {

	var delta = clock.getDelta();

	if ( carModel ) {

		car.update( delta );

		// keep the light (and shadow) pointing in the same direction as the car rotates
		// light should be changed to one big source for the whole map
		lightHolder.rotation.y = -carModel.rotation.y;

		// camera smoothly follow the car
		temp.setFromMatrixPosition(cameraGoal.matrixWorld);
		temp2.setFromMatrixPosition(cameraGoal2.matrixWorld);

		// camera.position.lerp(temp, 0.3);
		
		// camera.lookAt( carModel.position );

		// console.log(car.getOrientation);

		// if (camera.position.y < 0 )
		// 	camera.position.y = 1;
	}

	if ( carModel2 )
		car2.update( delta );

	stats.update();
}

function render() {

	updateSize();

	for ( var i = 0; i < views.length; ++ i ) {

		var view = views[ i ];
		var camera = view.camera;

		if (i == 0)
			view.updateCamera( camera, carModel, temp );
		else if (i == 1)
			view.updateCamera(camera, carModel2, temp2);


		var left = Math.floor( windowWidth * view.left );
		var top = Math.floor( windowHeight * view.top );
		var width = Math.floor( windowWidth * view.width );
		var height = Math.floor( windowHeight * view.height );

		renderer.setViewport( left, top, width, height );
		renderer.setScissor( left, top, width, height );
		renderer.setScissorTest( true );
		renderer.setClearColor( view.background );


		camera.aspect = width / height;
		camera.updateProjectionMatrix();

		renderer.render( scene, camera );

	}
}

// prob listener is enough
function updateSize() {

	if ( windowWidth != window.innerWidth || windowHeight != window.innerHeight ) {

		windowWidth = window.innerWidth;
		windowHeight = window.innerHeight;

		renderer.setSize( windowWidth, windowHeight );

	}
}

// start of everything :O
window.onload = init;
