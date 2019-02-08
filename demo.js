//////// global variables //////////////
var camera, scene, renderer, stats, carModel, materialsLib, envMap, ambientLight;

var clock = new THREE.Clock();

var lightHolder = new THREE.Group();
var cameraTarget = new THREE.Vector3();
var origin = new THREE.Vector3();
damping = 5.0;
distance = 5;

var car2 = new THREE.Car2();
var car = new THREE.Car();
var carModel2;
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


var goal = new THREE.Object3D;

////////////////////////


function init(){
	scene = new THREE.Scene();
	// making fog
	scene.fog = new THREE.Fog( 0xd7cbb1, 1, 160 );

	camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
	// camera.position.set( 3.25, 2.0, -5 );

	// create ground
	var ground = new THREE.Mesh(
		new THREE.PlaneBufferGeometry( 50, 2000),
		new THREE.MeshPhongMaterial( { color: 0xffffff, opacity: 0.15, depthWrite: false }
	) );
	// normaly ground is created in Y axis
	ground.rotation.x = - Math.PI / 2;
	ground.receiveShadow = true;
	ground.renderOrder = 1;
	scene.add( ground );

	// adding nice grid to the ground - prob we will use texture anyway, so...
	var grid = new THREE.GridHelper( 400, 40, 0x000000, 0x000000 );
	grid.material.opacity = 0.2;
	grid.material.depthWrite = false;
	grid.material.transparent = true;
	scene.add( grid );


	// global light 
	ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
	scene.add(ambientLight);

	var hemiLight = new THREE.HemisphereLight( 0x7c849b, 0xd7cbb1, 0.1 );
	hemiLight.position.set( 0, 1, 0 );
	scene.add( hemiLight );

	// will be used to follow the car
	var shadowLight  = new THREE.DirectionalLight( 0xffffee, 0.1 );
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
	 		object.position.z -= 1000;
	 		object.castShadow = true;
	 		object.receiveShadow = true;
	        scene.add(object);
	    });
	});




	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.gammaOutput = true;
	renderer.shadowMap.enabled = true;
	renderer.setSize( window.innerWidth, window.innerHeight );

	container.appendChild( renderer.domElement );

	stats = new Stats();
	container.appendChild( stats.dom );

	// prob not needed
	// camera.position.x += 10;

	
	initMaterials();
	initCar();
	initCar2();
	

	window.addEventListener( 'resize', onWindowResize, false );


	renderer.setAnimationLoop( function() {
		update();
		renderer.render( scene, camera );

	} );
}

function initCar(){
	THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/' );

	var loader = new THREE.GLTFLoader();
	loader.setDRACOLoader( new THREE.DRACOLoader() );

	loader.load( 'models/gltf/ferrari.glb', function( gltf ) {

		carModel = gltf.scene.children[ 0 ];

		// add lightHolder to car so that the shadow will track the car as it moves
		carModel.add( lightHolder );
		carModel.position.x += 5;

		car.setModel( carModel );
		carModel.traverse( function ( child ) {

			if ( child.isMesh  ) {

				child.castShadow = true;
				child.receiveShadow = true;
				child.material.envMap = envMap;

			}

		} );

		// texture of this fancy shadow under the car
		var texture = new THREE.TextureLoader().load( 'models/gltf/ferrari_ao.png' );
		var shadow = new THREE.Mesh(
			new THREE.PlaneBufferGeometry( 0.655 * 4, 1.3 * 4 ).rotateX( - Math.PI / 2 ),
			new THREE.MeshBasicMaterial( { map: texture, opacity: 0.8, transparent: true } )
		);
		shadow.renderOrder = 2;
		carModel.add( shadow );
		//goal is used to make camera movement smooth
		goal.position.set(0, 2.5, 5);
		carModel.add(goal);
		camera.position.z += 4;
		camera.position.y += 2.5;
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

		carModel2 = gltf.scene.children[ 0 ];

		// add lightHolder to car so that the shadow will track the car as it moves
		carModel2.add( lightHolder );

		car2.setModel( carModel2 );
		carModel2.traverse( function ( child ) {

			if ( child.isMesh  ) {

				child.castShadow = true;
				child.receiveShadow = true;
				child.material.envMap = envMap;

			}

		} );

		// texture of this fancy shadow under the car
		var texture = new THREE.TextureLoader().load( 'models/gltf/ferrari_ao.png' );
		var shadow = new THREE.Mesh(
			new THREE.PlaneBufferGeometry( 0.655 * 4, 1.3 * 4 ).rotateX( - Math.PI / 2 ),
			new THREE.MeshBasicMaterial( { map: texture, opacity: 0.8, transparent: true } )
		);
		shadow.renderOrder = 2;
		carModel2.add( shadow );
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

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onFollowCameraToggle() {

	carModel.position.copy( origin );

}


function update() {

	var delta = clock.getDelta();

	if ( carModel ) {

		// dont know why / 3
		car.update( delta / 3 );

		// keep the light (and shadow) pointing in the same direction as the car rotates
		// light should be changed to one big source for the whole map
		lightHolder.rotation.y = -carModel.rotation.y;

		// camera smoothly follow the car
		var temp = new THREE.Vector3;
		temp.setFromMatrixPosition(goal.matrixWorld);
		camera.position.lerp(temp, 0.3);

		
		camera.lookAt( carModel.position );
	}

	if ( carModel2 )
		car2.update( delta / 3 );

	stats.update();


	console.log(car.getOrientation);

}

// start of everything :O
window.onload = init;
