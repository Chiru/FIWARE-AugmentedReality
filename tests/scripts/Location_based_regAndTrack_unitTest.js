/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, communication, ARManager, sceneManager, gpsValid = false,
        orientationValid = false, motionValid = false, lightValid = false, proximityValid = false,
        distEpsilon = 10, rotEpsilon = 1, epsilon = 0.00001, camera, radToDeg = 180/Math.PI;
       
    window.onload = function () {

        //AR.start();
        sceneManager = AR.setupSceneManager();
        sensorManager = AR.setupSensors();
        
        orientationListener = sensorManager.listenSensor('orientation');
        motionListener = sensorManager.listenSensor('motion');
        lightListener = sensorManager.listenSensor('light');
        proximityListener = sensorManager.listenSensor('proximity');
        camera = sceneManager.getActiveCamera();
        
        if(orientationListener)
            orientationListener.addAction(testOrientationValue);
        if(motionListener)    
            motionListener.addAction(testmotionValue);
        if(lightListener)
            lightListener.addAction(testLightValue);
        if(proximityListener)    
            proximityListener.addAction(testProximityValue);

        sceneManager.setCameraDegreesOfFreedom(true, true, true, true, true, true);
        unitTest();
    };
    
    function unitTest() {
    
        module("Location based registration and tracking");
        test( "Testcase 1. Checking browser support for sensor events", function() {
            ok( sensorManager.hasGPS, "GPS supported" );
            ok( orientationListener, "Browser supports orientation listener" );
            ok( motionListener, "Browser supports motion listener" );
            ok( lightListener, "Browser supports light listener" );
            ok( proximityListener, "Browser supports proximity listener" );

        });
        
        test( "Testcase 2. Reading sensor values through Sensor API", function() {
            ok( orientationValid, "Orientation listener: Valid values" );
            ok( motionValid, "Motion listener: Valid values" );
            ok( lightValid, "Light listener: Valid values" );
            ok( proximityValid, "Proximity listener: Valid values" );
        });
        
        test( "Testcase 3. Positioning a virtual object in the xml3d scene, using gps coordinates, through Scene API", function() { 
            ok( testSetPositionFromGeoLocation(), "Positioning object using gps coordinates succeeded" );
        });
        test( "Testcase 4. Rotating a virtual camera in the xml3d scene, using device orientation, through Scene API", function() {
            ok( testRotationFromDeviceOrientation(), "Rotating virtual camera succeeded" );
        });
        test( "Testcase 5. Translating a virtual camera in the xml3d scene, using device motion, through Scene API", function() {
            ok( testTranslateCameraFromMotion(), "Translating virtual camera succeeded" );
        });
    }
    
    function testOrientationValue(deviceOrientationEvent) {
        var beta = deviceOrientationEvent.beta,
            gamma = deviceOrientationEvent.gamma,
            alpha = deviceOrientationEvent.alpha;

        if((alpha > 0 || alpha < 360) && (beta > -180 || beta < 180) && (gamma > -90 || gamma < 90)) {
            orientationValid = true;
        }
        else {
            orientationValid = false;
        }
    }
    
    function testmotionValue(deviceMotion) {
    
        if(isNumber(deviceMotion.acceleration.x) && isNumber(deviceMotion.acceleration.y) && isNumber(deviceMotion.acceleration.z)) {
            motionValid = true;
        }
        else {
            motionValid = false;
        }
    }
    
    function testLightValue(deviceLight) {
    
        if(isNumber(deviceLight.value) && (deviceLight.value > 0) ) {
            lightValid = true;
        }
        else {
            lightValid = false;
        }
    }
    
    function testProximityValue(deviceLight) {
    
        if(isNumber(deviceLight.value) && (deviceLight.value > 0) ) {
            proximityValid = true;
        }
        else {
            proximityValid = false;
        }
    }
    
    function isNumber(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    
    function testSetPositionFromGeoLocation () {
        var i, sign;
        var xml3dElement = document.getElementById('testObject');
        forward = new XML3DVec3(0,0,-1); 
        
        for(i = 0; i < testGeoLocationSet.length; ++i) {
            sceneManager.setPositionFromGeoLocation(currentLoc, testGeoLocationSet[i]['position'], xml3dElement, 10, 10000);
            var transform = XML3D.URIResolver.resolveLocal(xml3dElement.getAttribute("transform"));
            var distance = transform.translation.length();
            
            if(transform.translation.x < 0)
                sign = -1;
            else
                sign = 1;
                
            var bearing = sign * (Math.acos(transform.translation.normalize().dot(forward)) * radToDeg);
            
            if(Math.abs(distance - parseFloat(testGeoLocationSet[i]['distance'])) > distEpsilon || Math.abs(bearing - parseFloat(testGeoLocationSet[i]['bearing'])) > rotEpsilon) 
                return false;
            
        }
        
        return true;;
    }
    
    function testRotationFromDeviceOrientation() {
        var i;
        
        for(i = 0; i < testDeviceOrientationSet.length; ++i) {
            sceneManager.setCameraOrientation(testDeviceOrientationSet[i]);
            var camDir = camera.getDirection();
            var camUp = camera.getUpVector();

            var yaw = Math.round(Math.atan2(camDir.x, -camDir.z) * radToDeg);
            var pitch = Math.round(Math.acos(camDir.y) * radToDeg);
            
            pitch -= 90;
            yaw =  (yaw >= 0) ? yaw : yaw + 360;

            if(Math.abs(yaw - testDeviceOrientationSet[i]['alpha']) > rotEpsilon || Math.abs(pitch - testDeviceOrientationSet[i]['beta']) > rotEpsilon)
                return false;
        }
        
        return true;
    }
    
    function testTranslateCameraFromMotion() {
        var i;
        
        sceneManager.setCameraOrientation({'beta' : 0, 'gamma' : 0, 'alpha' : '0'});
        var cameraPosBegin = camera.position;
        
        for(i = 0; i < testDeviceMotionSet.length; ++i) {
            sceneManager.translateCameraFromMotion(testDeviceMotionSet[i]);
        }
        
        var cameraPosEnd = camera.position;
        var deltaPos = cameraPosBegin.subtract(cameraPosEnd);
 
        if(Math.abs(deltaPos.x) < epsilon && Math.abs(deltaPos.y) < epsilon && Math.abs(deltaPos.z) < epsilon)
            return true;
        else
            return false;
    }
    
}( window['wex'] = window['wex'] || {} ));

