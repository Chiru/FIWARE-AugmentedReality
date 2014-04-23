/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR, ARManager, sceneManager;
       
    window.onload = function () {
        testObject = document.getElementById('testObject');
        testObject2 = document.getElementById('testObject2');
        testObject3 = document.getElementById('testObject3');
        AR.start();
        ARManager = AR.setupARManager();
        sceneManager = AR.setupSceneManager();
        ARManager.setMarkerCallback(markerCallback);  
    };
    
    function markerCallback(Marker3x3Transforms, Marker5x5Transforms, imageMarkerTransforms, Marker3x3Visibilities, Marker5x5Visibilities, imageMarkerVisibilities) {
        
        if(imageMarkerTransforms && imageMarkerVisibilities) { 
            testObject.visible = imageMarkerVisibilities[0];
            sceneManager.setTransformFromMarker(imageMarkerTransforms[0], testObject, true);
        }
        
        if(Marker3x3Transforms && Marker3x3Visibilities) {
            testObject2.visible = Marker3x3Visibilities[0];
            sceneManager.setTransformFromMarker(Marker3x3Transforms[0], testObject2, true);
        }
       
        if(Marker5x5Transforms && Marker5x5Visibilities) {
            testObject3.visible = Marker5x5Visibilities[0];
            sceneManager.setTransformFromMarker(Marker5x5Transforms[0], testObject3, true);
        }
    }
}( window['wex'] = window['wex'] || {} ));
