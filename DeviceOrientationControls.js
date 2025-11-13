import * as THREE from 'three';

/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

class DeviceOrientationControls extends EventDispatcher {

	constructor( object ) {

		super();

		this.object = object;
		this.object.rotation.reorder( 'YXZ' );

		this.enabled = true;

		this.deviceOrientation = {};
		this.screenOrientation = 0;

		this.alphaOffset = 0; // radians

		const scope = this;

		const onDeviceOrientationChangeEvent = function ( event ) {

			scope.deviceOrientation = event;

		};

		const onScreenOrientationChangeEvent = function () {

			scope.screenOrientation = window.orientation || 0;

		};

		// The angles alpha, beta and gamma are in the range [-180,180].
		// z is in [0,360].
		const setObjectQuaternion = function () {

			const zee = new Vector3( 0, 0, 1 );

			const euler = new THREE.Euler();

			const q0 = new THREE.Quaternion();

			const q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

			return function ( quaternion, alpha, beta, gamma, orient ) {

				euler.set( beta, alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

				quaternion.setFromEuler( euler ); // orient the device

				quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

				quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

			};

		}();

		this.connect = function () {

			onScreenOrientationChangeEvent(); // run once on load

			// iOS 13+

			if ( window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function' ) {

				window.DeviceOrientationEvent.requestPermission().then( response => {

					if ( response == 'granted' ) {

						window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
						window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

					}

				} ).catch( function ( error ) {

					console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );

				} );

			} else {

				window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
				window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

			}

			scope.enabled = true;

		};

		this.disconnect = function () {

			window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
			window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

			scope.enabled = false;

		};

		this.update = function () {

			if ( scope.enabled === false ) return;

			let alpha = scope.deviceOrientation.alpha ? THREE.MathUtils.degToRad( scope.deviceOrientation.alpha ) + scope.alphaOffset : 0; // Z
			let beta = scope.deviceOrientation.beta ? THREE.MathUtils.degToRad( scope.deviceOrientation.beta ) : 0; // X'
			let gamma = scope.deviceOrientation.gamma ? THREE.MathUtils.degToRad( scope.deviceOrientation.gamma ) : 0; // Y''
			const orient = scope.screenOrientation ? THREE.MathUtils.degToRad( scope.screenOrientation ) : 0; // O

			setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

		};

		this.dispose = function () {

			scope.disconnect();

		};

		this.connect();

	}

}

export { DeviceOrientationControls };
