/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR,
        sensorManager, communication, ARManager, sceneManager, testObject, testObject2, testObject3,
        marker3x3ID = 32, marker5x5ID = 1, imageMarkerID = 0, testVideo, curImgNum = 0, testImgDuration = 2.0, 
        epsilon = 0.001, maxErrorTransformations = 80, numErrorTransformations = 0, markersAdded = false,
        imageMarkersDetected = false, marker3x3Detected = false, marker5x5Detected = false;
       
    window.onload = function () {
        //AR.start();
        ARManager = AR.setupARManager();
        sceneManager = AR.setupSceneManager();
        //ARManager.setMarkerCallback(markerCallback);
        unitTest();    
    };
    
    function unitTest() {
    
        module("Vision based registration and tracking");
        test( "Testcase 1. Adding markers", function() {
            ok(testAddMarkers(), "Marker IDs added succesfully" );
        });

        asyncTest("Testcase 2. Tracking marker through AR API and positioning a virtual object on it" , function() {
            //stop();

            testVideo = document.querySelector('video');
            testObject = document.getElementById('testObject');
            testObject2 = document.getElementById('testObject2');
            testObject3 = document.getElementById('testObject3');
            testVideo.addEventListener('ended', markerTest, false);
            testVideo.load();
            testVideo.play();
            
            if(!markersAdded)
                addMarkers();
                
            ARManager.setMarkerCallback(markerCallback);
        });  
    }
    
    var markerTest = function () {
        ok(((numErrorTransformations < maxErrorTransformations) && (imageMarkersDetected && marker3x3Detected && marker5x5Detected)), "Transforms and visibilities are valid");
        start();
        testVideo.removeEventListener('ended', markerTest, false);
    }
    
    function testAddMarkers() {
        var marker3x3 = document.getElementById('Marker3x3').value;
        var marker5x5 = document.getElementById('Marker5x5').value;
        var imageMarker = document.getElementById('imageMarkers').value;
        
        if(!markersAdded)
            addMarkers();
            
        if(marker3x3[0] == marker3x3ID && marker5x5[0] == marker5x5ID && imageMarker[0] == imageMarkerID)
            return true;
        else
            return false;
    }
    
    function addMarkers() {
        ARManager.addMarker(marker3x3ID, "Marker3x3");
        ARManager.addMarker(marker5x5ID, "Marker5x5");
        ARManager.addMarker(imageMarkerID, "imageMarker");
        markersAdded = true;
    }
    
    function markerCallback(Marker3x3Transforms, Marker5x5Transforms, imageMarkerTransforms, Marker3x3Visibilities, Marker5x5Visibilities, imageMarkerVisibilities) {
        var curTime = testVideo.currentTime;

        if(curTime > curImgNum * testImgDuration && curTime < (curImgNum + 1) * testImgDuration)
            curImgNum++;
            
        if(imageMarkerTransforms && imageMarkerVisibilities) { 
            testObject.visible = imageMarkerVisibilities[0];
            sceneManager.setTransformFromMarker(imageMarkerTransforms[0], testObject);
            
            if(imageMarkerVisibilities[0]) {
                imageMarkersDetected = true;
                if(!transformEqual(imageMarkerTransforms[0], imageMarkerTransformsTestSet[curImgNum - 1]))
                    numErrorTransformations++;
            }
        }
        
        if(Marker3x3Transforms && Marker3x3Visibilities) {
            testObject2.visible = Marker3x3Visibilities[0];
            sceneManager.setTransformFromMarker(Marker3x3Transforms[0], testObject2);
            
            if(Marker3x3Visibilities[0]) {
                marker3x3Detected = true;
                if(!transformEqual(Marker3x3Transforms[0], marker3x3TransformsTestSet[curImgNum - 1]))
                    numErrorTransformations++;
            }
        }
       
        if(Marker5x5Transforms && Marker5x5Visibilities) {
            testObject3.visible = Marker5x5Visibilities[0];
            sceneManager.setTransformFromMarker(Marker5x5Transforms[0], testObject3);
            
            if(Marker5x5Visibilities[0]) {
                marker5x5Detected = true;
                if(!transformEqual(Marker5x5Transforms[0], marker5x5TransformsTestSet[curImgNum - 1]))
                    numErrorTransformations++;
            }
        }
        
        //log("imgNum: " +curImgNum+ " numErrorTransformations " + numErrorTransformations); 
    }
       
    function transformEqual(trans1, trans2) {
        var i = 0;

        if(trans1 == null || trans2 == null) 
            return false;
        
        if(trans1.length != trans2.length) 
            return false;
            
        for(i = 0; i < trans1.length; ++i) {
            if(Math.abs(trans1[i] - trans2[i]) > epsilon)
                return false;
        }
  
        return true;
    }
    
}( window['wex'] = window['wex'] || {} ));
