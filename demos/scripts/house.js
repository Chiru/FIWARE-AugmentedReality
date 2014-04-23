/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, communication, ARManager, sceneManager, light, curLoc;

    window.onload = function () {
        AR.start();
        sceneManager = AR.setupSceneManager();
        sensorManager = AR.setupSensors();
        
        var orientationListener = sensorManager.listenSensor('orientation');
        var lightListener = sensorManager.listenSensor('light');
        var motionListener = sensorManager.listenSensor('motion');
        orientationListener.addAction(sceneManager.setCameraOrientation);
        sceneManager.setCameraDegreesOfFreedom(false, false, true, true, true, false);    
        sceneManager.setCameraMotionTranslationStepSize(0.1);
        sceneManager.setCameraMotionTranslationLimit(0.015);    
        //motionListener.addAction(sceneManager.translateCameraFromMotion);
        motionListener.addAction(sceneManager.translateCameraForward); 
        
        if(lightListener)
            lightListener.addAction(changeLighting);
           
        light = document.getElementById('light_1');
        camera = sceneManager.getActiveCamera();
        camera.fieldOfView = 45 * Math.PI/180;
        sceneManager.setCameraVerticalPlane(90);
    };
    
    function changeLighting(eventData) {
        light.intensity = eventData.value/1000;
    };
    
    function gpsHandler(position) {
        sceneManager.translateCamera(curLoc, position.coords)
        curLoc = position.coords;
    };
       
}( window['wex'] = window['wex'] || {} ));
