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
    
    function markerCallback(Marker5x5Transforms, imageMarkerTransforms, Marker5x5Visibilities, imageMarkerVisibilities) {
        
        if(imageMarkerTransforms && imageMarkerVisibilities) { 
            testObject.visible = imageMarkerVisibilities[0];
            sceneManager.setTransformFromMarker(imageMarkerTransforms[0], testObject, true);
			
			testObject3.visible = imageMarkerVisibilities[1];
            sceneManager.setTransformFromMarker(imageMarkerTransforms[1], testObject3, true);
        }
       
        if(Marker5x5Transforms && Marker5x5Visibilities) {
            testObject2.visible = Marker5x5Visibilities[0];
            sceneManager.setTransformFromMarker(Marker5x5Transforms[0], testObject2, true);
        }
    }
}( window['wex'] = window['wex'] || {} ));