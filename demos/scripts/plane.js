/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, communication, ARManager, sceneManager;

    window.requestAnimationFrame =  (window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame);

    var plane, planeTrans, camera, flying = false;
    
    window.onload = function () {

        AR.start();
        ARManager = AR.setupARManager();
        sceneManager = AR.setupSceneManager();
        sensorManager = AR.setupSensors();
        ARManager.setMarkerCallback(drawMesh);
        orientationListener = sensorManager.listenSensor('orientation');
        orientationListener.addAction(sceneManager.setCameraOrientation);
        plane = document.getElementById('plane');
        planeTrans = XML3D.URIResolver.resolveLocal(plane.getAttribute("transform"), plane.ownerDocument);
        plane.addEventListener("click", startFly);
        sceneManager.setCameraVerticalPlane(65);   
        camera = sceneManager.getActiveCamera();
        camera.fieldOfView = 40 * Math.PI/180;    
    };
    
    function drawMesh(Marker5x5Transforms, imageMarkerTransforms, Marker5x5Visibilities, imageMarkerVisibilities) {
    
        if(!Marker5x5Transforms || !Marker5x5Visibilities || flying)
            return;
            
        plane.visible = Marker5x5Visibilities[0];
        sceneManager.setTransformFromMarker(Marker5x5Transforms[0], plane);    
    }
    
    function startFly() {
        if(!flying) {
            flying = true;
            requestId = window.requestAnimationFrame(flyOff);
        }
    }

    function flyOff() {
        planeTrans.translation.y += 0.5;
        window.requestAnimationFrame(flyOff);
        
        if(planeTrans.translation.y > 100) {
            flying = false;
            planeTrans.translation.y = 0;
            window.cancelAnimationFrame(requestId);
        }
    }
    
}( window['wex'] = window['wex'] || {} ));
