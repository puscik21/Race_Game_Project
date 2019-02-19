THREE.Car = ( function ( ) {

	// private variables
	var steeringWheelSpeed = 4.5;
	var maxSteeringRotation = 0.3;

	var acceleration = 0;

	var maxSpeedReverse, accelerationReverse, deceleration;

	var controlKeys = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, BRAKE: 32 };

	var wheelOrientation = 0;
	var carOrientation = Math.PI;

	var root = null;

	var frontLeftWheelRoot = null;
	var frontRightWheelRoot = null;

	var frontLeftWheel = new THREE.Group();
	var frontRightWheel = new THREE.Group();
	var backLeftWheel = null;
	var backRightWheel = null;

	var steeringWheel = null;

	var wheelDiameter = 1;
	var length = 1;

	var loaded = false;

	var controls = {

		brake: false,
		moveForward: false,
		moveBackward: false,
		moveLeft: false,
		moveRight: false

	};

	var brakingDeceleration = 2;

	var variableToPrint ;

	var xVelocity = 0;
	var yVelocity = 0;
	var zVelocity = 0;

	function Car( maxSpeed, acceleration, brakePower, turningRadius, keys ) {

		this.enabled = true;

		this.elemNames = {
			flWheel: 'wheel_fl',
			frWheel: 'wheel_fr',
			rlWheel: 'wheel_rl',
			rrWheel: 'wheel_rr',
			steeringWheel: 'steering_wheel', // set to null to disable
		};

		// km/hr
		this.maxSpeed = maxSpeed || 100;
		maxSpeedReverse = - this.maxSpeed * 0.25;

		// m/s
		this.acceleration = acceleration || 15;
		accelerationReverse = this.acceleration * 0.5;

		// metres
		this.turningRadius = turningRadius || 6;

		// m/s
		deceleration = this.acceleration * 2;

		// multiplied with deceleration, so breaking deceleration = ( acceleration * 2 * brakePower ) m/s
		this.brakePower = brakePower || 4;

		// exposed so that a user can use this for various effect, e.g blur
		this.speed = 0;

		// keys used to control car - by default the arrow keys and space to brake
		controlKeys = keys || controlKeys;

		// local axes of rotation - these are likely to vary between models
		this.wheelRotationAxis = 'x';
		this.wheelTurnAxis = 'z';
		this.steeringWheelTurnAxis = 'y';

		document.addEventListener( 'keydown', this.onKeyDown, false );
		document.addEventListener( 'keyup', this.onKeyUp, false );

	}

	Car.prototype = {

		constructor: Car,

		onKeyDown( event ) {

			switch ( event.keyCode ) {

				case controlKeys.BRAKE:
					controls.brake = true;
					controls.moveForward = false;
					controls.moveBackward = false;
					break;

				case controlKeys.UP: controls.moveForward = true; break;

				case controlKeys.DOWN: controls.moveBackward = true; break;

				case controlKeys.LEFT: controls.moveLeft = true; break;

				case controlKeys.RIGHT: controls.moveRight = true; break;

			}

		},

		onKeyUp( event ) {

			switch ( event.keyCode ) {

				case controlKeys.BRAKE: controls.brake = false; break;

				case controlKeys.UP: controls.moveForward = false; break;

				case controlKeys.DOWN: controls.moveBackward = false; break;

				case controlKeys.LEFT: controls.moveLeft = false; break;

				case controlKeys.RIGHT: controls.moveRight = false; break;

			}

		},

		dispose() {

			document.removeEventListener( 'keydown', this.onKeyDown, false );
			document.removeEventListener( 'keyup', this.onKeyUp, false );

		},

		update( delta ) {

			if ( ! loaded || ! this.enabled ) return;

			// basic movement

			xVelocity = root.getLinearVelocity().x;
			yVelocity = root.getLinearVelocity().y;
			zVelocity = root.getLinearVelocity().z;
			variableToPrint = root.getLinearVelocity().length();

			if ( controls.brake )
				this.brake(delta);
			
			if ( controls.moveForward )
				this.moveForward(delta);

			if ( controls.moveBackward )
				this.moveBackward(delta);
			
			// wheels orientation
			if ( controls.moveLeft )
				wheelOrientation = THREE.Math.clamp( wheelOrientation + delta * steeringWheelSpeed, - maxSteeringRotation, maxSteeringRotation );

			if ( controls.moveRight ) 
				wheelOrientation = THREE.Math.clamp( wheelOrientation - delta * steeringWheelSpeed, - maxSteeringRotation, maxSteeringRotation );

			// steering decay
			if ( ! ( controls.moveLeft || controls.moveRight ) ) {
				this.steeringDecay(delta);
			}

			// .lenght() is like sqrt( x^2 + z^2 )
			carOrientation += root.getLinearVelocity().length() * this.turningRadius * 0.02 * wheelOrientation / 300;

			// angle of car
			root.rotation.set(0, carOrientation, 0);

			// rotation while steering
			frontLeftWheelRoot.rotation[ this.wheelTurnAxis ] = wheelOrientation;
			frontRightWheelRoot.rotation[ this.wheelTurnAxis ] = wheelOrientation;

			steeringWheel.rotation[ this.steeringWheelTurnAxis ] = -wheelOrientation * 6;
		},

		animateWheels(movementDelta){
			var angularSpeedRatio = - 2 / wheelDiameter;

			var wheelDelta = movementDelta * angularSpeedRatio * length;

			frontLeftWheel.rotation[ this.wheelRotationAxis ] -= wheelDelta;
			frontRightWheel.rotation[ this.wheelRotationAxis ] -= wheelDelta;
			backLeftWheel.rotation[ this.wheelRotationAxis ] -= wheelDelta;
			backRightWheel.rotation[ this.wheelRotationAxis ] -= wheelDelta;
		},

		brake( delta ){
//TODO fix these functions			
			// this.brakeX();

			// this.brakeZ();


			var movementDelta = 0;
			this.animateWheels(movementDelta);
		},

		brakeX(){
			if (xVelocity >= 0.5)
				root.setLinearVelocity({x: xVelocity - 0.5, y: yVelocity, z: zVelocity});
			else if(xVelocity < -0.5)
				root.setLinearVelocity({x: xVelocity + 0.5, y: yVelocity, z: zVelocity});
			else
				root.setLinearVelocity({x: 0, y: yVelocity, z: root.getLinearVelocity().z});
		},

		brakeZ(){
			if (zVelocity >= 0.5)
				root.setLinearVelocity({x: xVelocity, y: yVelocity, z: zVelocity - 0.5});
			else if (zVelocity < -0.5)
				root.setLinearVelocity({x: xVelocity, y: yVelocity, z: zVelocity + 0.5});
			else
				root.setLinearVelocity({x: root.getLinearVelocity().x, y: yVelocity, z: 0});
		},


		moveBackward(delta){
			var rotation_matrix = new THREE.Matrix4().extractRotation(root.matrix);
			var force_vector = new THREE.Vector3(0 , 0, 0.35 ).applyMatrix4(rotation_matrix);
			root.applyCentralImpulse(force_vector);
			this.limitSpeed();

			var movementDelta = root.getLinearVelocity().length() / 600;
			this.animateWheels(movementDelta);
		},


		moveForward(delta){
			var rotation_matrix = new THREE.Matrix4().extractRotation(root.matrix);
			var force_vector = new THREE.Vector3(0 , 0, -0.6 ).applyMatrix4(rotation_matrix);
			root.applyCentralImpulse(force_vector);
			this.limitSpeed();

			var movementDelta = - root.getLinearVelocity().length() / 600;
			this.animateWheels(movementDelta);
		},


		limitSpeed(){
			if (xVelocity > 30)
				root.setLinearVelocity({x: 30, y: yVelocity, z: zVelocity});
			if (yVelocity > 30)
				root.setLinearVelocity({x: xVelocity, y: 30, z: zVelocity});
			if (zVelocity > 30)
				root.setLinearVelocity({x: xVelocity, y: yVelocity, z: 30});

			if (xVelocity < -30)
				root.setLinearVelocity({x: -30, y: yVelocity, z: zVelocity});
			if (yVelocity < -30)
				root.setLinearVelocity({x: xVelocity, y: -30, z: zVelocity});
			if (zVelocity < -30)
				root.setLinearVelocity({x: xVelocity, y: yVelocity, z: -30});
		},

		steeringDecay(delta){
			if ( wheelOrientation > 0 ) 
				wheelOrientation = THREE.Math.clamp( wheelOrientation - delta * steeringWheelSpeed, 0, maxSteeringRotation );

			else 
				wheelOrientation = THREE.Math.clamp( wheelOrientation + delta * steeringWheelSpeed, - maxSteeringRotation, 0 );
		},


		setModel( model, elemNames ) {

			if ( elemNames ) 
				this.elemNames = elemNames;

			root = model;

			this.setupWheels();
			this.computeDimensions();

			loaded = true;

		},


		setupWheels() {

			frontLeftWheelRoot = root.getObjectByName( this.elemNames.flWheel );
			frontRightWheelRoot = root.getObjectByName( this.elemNames.frWheel );
			backLeftWheel = root.getObjectByName( this.elemNames.rlWheel );
			backRightWheel = root.getObjectByName( this.elemNames.rrWheel );

			if ( this.elemNames.steeringWheel !== null ) 
				steeringWheel = root.getObjectByName( this.elemNames.steeringWheel );

			while ( frontLeftWheelRoot.children.length > 0 ) 
				frontLeftWheel.add( frontLeftWheelRoot.children[ 0 ] );
			while ( frontRightWheelRoot.children.length > 0 ) 
				frontRightWheel.add( frontRightWheelRoot.children[ 0 ] );

			frontLeftWheelRoot.add( frontLeftWheel );
			frontRightWheelRoot.add( frontRightWheel );

		},


		computeDimensions() {

			var bb = new THREE.Box3().setFromObject( frontLeftWheelRoot );

			var size = new THREE.Vector3();
			bb.getSize( size );

			wheelDiameter = Math.max( size.x, size.y, size.z );

			bb.setFromObject( root );

			size = bb.getSize( size );
			length = Math.max( size.x, size.y, size.z );

		},

		get getOrientation(){
			return variableToPrint;
		}
	};


	function exponentialEaseOut( k ) {

		return k === 1 ? 1 : - Math.pow( 2, - 10 * k ) + 1;

	}

	return Car;

} )();
