/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;


    var SceneManager = AR.SceneManager = function ( framework, options ) {

        var defaults = {}, opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var activeCamera, xml3d, cameraVerticalPlane = 0, billboardSet = [], 
            transIndex = 0, up = new XML3DVec3(0,1,0), prevTime = 0, velocityStart = {}, prevAcceleration = {}, accWeight = {},
            accLimit = 1.0, accWeightValue = 30, currentVelocity = 0, cameraTranslationStepSize = 1.0, cameraTranslationLimit = 0.01, degreesOfFreedom = {};

        this.init = function () {
        
            log( "SceneManager: Initialising...");
            
            xml3d = document.querySelector("xml3d");
            accWeight.forward = 1, accWeight.backward = 1;
            accWeight.up = 1, accWeight.down = 1;
            accWeight.left = 1, accWeight.right = 1;
            prevAcceleration.z = 0, prevAcceleration.y = 0, prevAcceleration.x = 0;
            degreesOfFreedom.heave = false, degreesOfFreedom.sway = false, degreesOfFreedom.surge = true;
            degreesOfFreedom.yaw = true, degreesOfFreedom.pitch = true, degreesOfFreedom.roll = false;
            this.initCamera();
            
            log( "SceneManager: Initialization done");
        };

        this.setCameraVerticalPlane = function (degrees) {
            cameraVerticalPlane = degrees;
        };

        this.addObjetcToBillboardSet = function(xml3dElement) {
            billboardSet.push(xml3dElement);
        };

        this.initCamera = function() {
            activeCamera = XML3D.URIResolver.resolveLocal(xml3d.getAttribute("activeView"), xml3d.ownerDocument);
        };

        this.getActiveCamera = function() {
            return activeCamera;
        };
        
        this.setPositionFromGeoLocation = function (curLoc, elemLoc, xml3dElement, minDistance, maxDistance) {

            var transform, radius;
            transform = XML3D.URIResolver.resolveLocal(xml3dElement.getAttribute("transform"), xml3dElement.ownerDocument);
            
            if(transform === null) {
                 transform = XML3D.createElement("transform");
                 transform.setAttribute("id", "transform" + transIndex);
                 xml3d.appendChild(transform);
                 xml3dElement.setAttribute("transform", "#transform" + transIndex);
                 transIndex++;
            }
            
            var geolocation = distanceBetween(curLoc, elemLoc);
            
            radius = Math.max(minDistance, Math.min(geolocation.distance, maxDistance));

            transform.translation.z = activeCamera.position.z + radius * Math.cos(Math.PI - geolocation.bearing);
            transform.translation.x = activeCamera.position.x + radius * Math.sin(Math.PI - geolocation.bearing);

        };
        
        this.setTransformFromMarker = function(markerTransform, xml3dElement, rotateX) {
            var transform, mat3x3 = [], quat = XML3D.math.quat.create();

            if(!markerTransform || !xml3dElement)
                return;

            transform = XML3D.URIResolver.resolveLocal(xml3dElement.getAttribute("transform"), xml3dElement.ownerDocument);

            if(!transform)
                return;
                
            //XML3D.math.mat4.toMat3(transforms, mat3x3);
            mat3x3[0] = markerTransform[0], mat3x3[1] = markerTransform[4], mat3x3[2] = markerTransform[8],
            mat3x3[3] = markerTransform[1], mat3x3[4] = markerTransform[5], mat3x3[5] = markerTransform[9],
            mat3x3[6] = markerTransform[2], mat3x3[7] = markerTransform[6], mat3x3[8] = markerTransform[10];
            XML3D.math.quat.setFromMat3(mat3x3, quat);
            
            XML3D.math.quat.normalize(quat, quat);
            
            if(rotateX)
                XML3D.math.quat.rotateX(quat, quat, Math.PI/2);
                
            transform.rotation._setQuaternion(XML3D.math.quat.multiply(quat, activeCamera.orientation.getQuaternion(), quat));
            transform.translation.set(activeCamera.orientation.rotateVec3(new XML3DVec3(markerTransform[12], markerTransform[13], markerTransform[14])));

        };
        
        //heave: moving camera up and down.
        //sway: moving camera left and right.
        //surge: moving camera forward and backward.
        this.setCameraDegreesOfFreedom = function(heave, sway, surge, yaw, pitch, roll) {
            degreesOfFreedom.heave = heave; 
            degreesOfFreedom.sway = sway; 
            degreesOfFreedom.surge = surge;
            degreesOfFreedom.yaw = yaw; 
            degreesOfFreedom.pitch = pitch; 
            degreesOfFreedom.roll = roll;
        }
        
        this.setCameraOrientation = function (deviceOrientationEvent) {

            if(!activeCamera)
                return;

            var x = degreesOfFreedom.pitch ? (deviceOrientationEvent.beta - cameraVerticalPlane) : 0;
            var z = degreesOfFreedom.roll ? deviceOrientationEvent.gamma : 0;
            var y = degreesOfFreedom.yaw ? deviceOrientationEvent.alpha : 0;
            
            var degToRad2 = Math.PI/360;
               
            //convert to quaternion, order z y x
            var cosX = Math.cos( x * degToRad2 ),
		    cosY = Math.cos( y * degToRad2 ),
		    cosZ = Math.cos( -z * degToRad2 ),
		    sinX = Math.sin( x * degToRad2 ),
		    sinY = Math.sin( y * degToRad2 ),
		    sinZ = Math.sin( -z * degToRad2 );

	        var rotX = sinX * cosY * cosZ - cosX * sinY * sinZ,
		    rotY = cosX * sinY * cosZ + sinX * cosY * sinZ,
		    rotZ = cosX * cosY * sinZ - sinX * sinY * cosZ,
		    rotW = cosX * cosY * cosZ + sinX * sinY * sinZ;
		    
		    activeCamera.orientation.setQuaternion(new XML3DVec3(rotX, rotY, rotZ), rotW);	
		    updateBillboardSet();
        };
        
        this.translateCameraFromGps = function (curLoc, gpsPoint, maxStep) {

            if(!activeCamera || !curLoc || !gpsPoint)
                return;
              
            var geolocation = distanceBetween(curLoc, gpsPoint);
            
            if(geolocation.distance > maxStep)
                return;
                
            var radius = geolocation.distance;

            activeCamera.position.z = activeCamera.position.z + radius * Math.cos(Math.PI - geolocation.bearing);
            activeCamera.position.x = activeCamera.position.x + radius * Math.sin(Math.PI - geolocation.bearing);

        };
        
        this.setCameraMotionTranslationStepSize = function(step) {
            cameraTranslationStepSize = step;
        }
        
        this.setCameraMotionTranslationLimit = function(limit) {
            cameraTranslationLimit = limit;
        }
        
        this.translateCameraForward = function(deviceMotion) {
            var curTime, velocityFinal = {}, delta = {}, deltaTime, stepFactor = 1000;
            
            if(!activeCamera)
                return;
                
            curTime = Date.now();
            
            if(prevTime != 0) {
                deltaTime = (curTime - prevTime)/1000;
                velocityFinal.z = Math.max(deviceMotion.acceleration.z * deltaTime, 0);
                delta.z = stepFactor * cameraTranslationStepSize * (velocityStart.z + velocityFinal.z) * deltaTime;
            }
                 
            if(delta.z > cameraTranslationLimit) {
                var camDirection = activeCamera.getDirection();
                camDirection.y = 0;
                activeCamera.position.set(activeCamera.position.add(camDirection.scale(delta.z)));
            }
            
            prevAcceleration = deviceMotion.acceleration.y;
            prevTime = curTime;
            velocityStart = velocityFinal;
        };
        
        //This feature is stil very experimental and can cause weird behaviour.
        this.translateCameraFromMotion = function(deviceMotion) {
            var curTime, delta = {}, deltaTime = 0, sign = {};
            
            if(!activeCamera)
                return;
                
            curTime = Date.now();
            
            if(prevTime != 0)
                deltaTime = (curTime - prevTime)/1000;
            
            if(degreesOfFreedom.surge) {
                if((prevAcceleration.z < -accLimit * accWeight.forward) && (deviceMotion.acceleration.z < -accLimit * accWeight.forward)) {
                    delta.z = Math.abs(deviceMotion.acceleration.z) * cameraTranslationStepSize;
                    sign.z = 1;
                    accWeight.backward = accWeightValue;
                }
                
                if((prevAcceleration.z > accLimit * accWeight.backward) && (deviceMotion.acceleration.z > accLimit * accWeight.backward)) {
                    delta.z = Math.abs(deviceMotion.acceleration.z) * cameraTranslationStepSize;
                    sign.z = -1;
                    accWeight.forward = accWeightValue;
                }
                
                if(Math.abs(delta.z) > cameraTranslationLimit) {
                    var camDirection = activeCamera.getDirection();
                    camDirection.y = 0;
                    activeCamera.position.set(activeCamera.position.add(camDirection.scale(sign.z * delta.z)));
                }
                
                if(accWeight.forward > accLimit)
                    accWeight.forward--;
                
                if(accWeight.backward > accLimit)
                    accWeight.backward--;
            }
            
            if(degreesOfFreedom.heave) {
                if((prevAcceleration.y < -accLimit * accWeight.down) && (deviceMotion.acceleration.y < -accLimit * accWeight.down)) {
                    delta.y = Math.abs(deviceMotion.acceleration.y) * cameraTranslationStepSize;
                    sign.y = -1;
                    accWeight.up = accWeightValue;
                }
                
                if((prevAcceleration.y > accLimit * accWeight.up) && (deviceMotion.acceleration.y > accLimit * accWeight.up)) {
                    delta.y = Math.abs(deviceMotion.acceleration.y) * cameraTranslationStepSize;
                    sign.y = 1;
                    accWeight.down = accWeightValue;
                }
                
                if(Math.abs(delta.y) > cameraTranslationLimit) {
                    activeCamera.position.y += sign.y * delta.y;
                }
                
                if(accWeight.up > accLimit)
                    accWeight.up--;
                
                if(accWeight.down > accLimit)
                    accWeight.down--;
            }
            
            if(degreesOfFreedom.sway) {
                if((prevAcceleration.x < -accLimit * accWeight.left) && (deviceMotion.acceleration.x < -accLimit * accWeight.left)) {
                    delta.x = Math.abs(deviceMotion.acceleration.x) * cameraTranslationStepSize;
                    sign.x = 1;
                    accWeight.right = accWeightValue;
                }
                
                if((prevAcceleration.x > accLimit * accWeight.right) && (deviceMotion.acceleration.x > accLimit * accWeight.right)) {
                    delta.x = Math.abs(deviceMotion.acceleration.x) * cameraTranslationStepSize;
                    sign.x = -1;
                    accWeight.left = accWeightValue;
                }
                
                if(Math.abs(delta.x) > cameraTranslationLimit) {
                    var camDirection = activeCamera.getDirection();
                    var right = new XML3DVec3(camDirection.z, 0.0, camDirection.x);
                    activeCamera.position.set(activeCamera.position.add(right.scale(sign.x * delta.x)));
                }
                
                if(accWeight.right > accLimit)
                    accWeight.right--;
                
                if(accWeight.left > accLimit)
                    accWeight.left--;
            }

            prevTime = curTime;
            prevAcceleration = deviceMotion.acceleration;
        };
        
        this.getDistance = function(curLoc, gpsPoint) {
            return distanceBetween(curLoc, gpsPoint);
        };
        
        //Bearign(radians) and distance between two points(meters) on a sphere using the spherical law of cosines. 
        function distanceBetween(p1, p2) {
            var rad = Math.PI / 180;
            var dLonRad = (p2.longitude - p1.longitude) * rad;
            var p1LatRad = p1.latitude * rad;
            var p2LatRad = p2.latitude * rad;
            var distance = Math.acos(Math.sin(p1LatRad) * Math.sin(p2LatRad) + Math.cos(p1LatRad) * Math.cos(p2LatRad) * Math.cos(dLonRad)) * 6378137;
        
            var y = Math.sin(dLonRad) * Math.cos(p2LatRad);
            var x = Math.cos(p1LatRad) * Math.sin(p2LatRad) - Math.sin(p1LatRad) * Math.cos(p2LatRad) * Math.cos(dLonRad);
            var bearing = Math.atan2(y, x);

            var result = {
                'distance': distance,
                'bearing': bearing
            };

            return result;
        }

        function updateBillboardSet() {
       
            var billboard, transform, targetX, targetY, targetZ;
            
            if(billboardSet.length === 0)
                return;
            
            for(billboard in billboardSet) {
                
                transform = XML3D.URIResolver.resolveLocal(billboardSet[billboard].getAttribute("transform"), billboardSet[billboard].ownerDocument);    
                
                targetZ = activeCamera.position.subtract(transform.translation);
                targetZ = targetZ.normalize();
                
                targetX = up.cross(targetZ);
                targetX = targetX.normalize();
        
                targetY = targetZ.cross(targetX);
                targetY = targetY.normalize();
                transform.rotation.setFromBasis(targetX, targetY, targetZ);         
            }
        }

        this.init();
    };


}( window['wex'] = window['wex'] || {} ));
