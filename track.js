function Track() {
	this.vehiclePosition = new THREE.Vector3();
	
	this.addGround = function() {
		// Ground
		var ground_material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ map: THREE.ImageUtils.loadTexture( 'textures/ground/Grass_256-b.jpeg' ) }),
			1, // high friction
			1 // low restitution
		);
		ground_material.map.wrapS = ground_material.map.wrapT = THREE.RepeatWrapping;
		ground_material.map.repeat.set( 100, 100 );

		var ground_geometry = new THREE.PlaneGeometry( 5000, 5000, 5000 );
		ground_geometry.computeFaceNormals();
		ground_geometry.computeVertexNormals();

		// If your plane is not square as far as face count then the HeightfieldMesh
		// takes two more arguments at the end: # of x faces and # of z faces that were passed to THREE.PlaneMaterial
		var ground = new Physijs.PlaneMesh(
				ground_geometry,
				ground_material,
				0 // mass
		);
		ground.rotation.x = -Math.PI / 2;
		ground.receiveShadow = true;
		ground.position.set(0, -1, 0);
		scene.add( ground );		
	}
}
Track.prototype.loadTrack = function(selectedTrack){
	var loader = new THREE.LegacyJSONLoader();
	
	if(selectedTrack == "Mountain") {
		loader.load( 'models/tracks/MountainTrack/MountainValley_Track.js', function ( track, track_materials ) {
			
			var material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 1, transparent: true }),
				.3, // friction
				.3 // restitution
			);

			raceTrack = new Physijs.C(
				track,
			   	material,
			   	0 //mass
			);
			raceTrack.receiveShadow = true;
			scene.add(raceTrack);
		});
		loader.load( 'models/tracks/MountainTrack/Mountain_Street.js', function ( track, track_materials ) {
			var material = Physijs.createMaterial(
			new THREE.MeshLambertMaterial({ color: 0xffffff, opacity: 1, transparent: true }),
				.3, // friction
				.3 // restitution
			);
			var raceStreet = new Physijs.PlaneMesh(
				track, material, 0 );
			raceStreet.receiveShadow = true;
			scene.add(raceStreet);	
		});
	}
	this.addGround();
}

