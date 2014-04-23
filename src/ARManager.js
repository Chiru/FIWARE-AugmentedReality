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


    var ARManager = AR.ARManager = function ( framework, options ) {

        var defaults = {}, opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var flowAnalysers, observers, background, bgCtx, callBackFunctions = [], maxMarkersToTrack = {};

         flowAnalysers = {
            'MarkerDetector': false,
        };

        observers = {
            'MarkerDetector': VideoStreamObserver(),
            'MarkerAnalyser': MarkerObserver(),
        };
        
        var markerDetector, numMarkers3x3 = 63;

        function VideoStreamObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                var arVideo = records[0].result.getValue( "arvideo" ),
                    imageData, i, dataLen, width, height;
                    
                if ( arVideo && bgCtx) {
                
                    width = arVideo.width;
                    height = arVideo.height;
         
                    // Setup background canvas
                    if ( width !== background.width || height !== background.height ) {
                        background.width = width;
                        background.height = height;
                    }
                    bgCtx.putImageData( arVideo, 0, 0 );
                }
            } );
        }

        function MarkerObserver() {
            return new XML3DDataObserver( function ( records, observer ) {
                var i,
                    Marker3x3Transforms = records[0].result.getValue("Marker3x3Transforms"),
                    Marker5x5Transforms = records[0].result.getValue("Marker5x5Transforms"),
                    imageMarkerTransforms = records[0].result.getValue("imageMarkerTransforms"),
                    Marker3x3Visibilities = records[0].result.getValue("Marker3x3Visibilities"),
                    Marker5x5Visibilities = records[0].result.getValue("Marker5x5Visibilities"),
                    imageMarkerVisibilities = records[0].result.getValue("imageMarkerVisibilities");
                
                    if(callBackFunctions.length == 0)
                        return;
                        
                    var mat4x4Marker3x3TransArray = null;
                    var mat4x4Marker5x5TransArray = null;
                    var mat4x4ImgMarkerTransArray = null;
                    
                    if(Marker3x3Transforms)
                        mat4x4Marker3x3TransArray = sliceArray(Marker3x3Transforms, Marker3x3Visibilities);
                        
                    if(Marker5x5Transforms)    
                        mat4x4Marker5x5TransArray = sliceArray(Marker5x5Transforms, Marker5x5Visibilities);
                        
                    if(imageMarkerTransforms)  
                        mat4x4ImgMarkerTransArray = sliceArray(imageMarkerTransforms, imageMarkerVisibilities);
                                             
                    for(i in callBackFunctions) {
                        callBackFunctions[i](mat4x4Marker3x3TransArray, mat4x4Marker5x5TransArray, mat4x4ImgMarkerTransArray, Marker3x3Visibilities, Marker5x5Visibilities, imageMarkerVisibilities);
                    }
            } );
        }
      
        function sliceArray(transformArray, visibilities) {
            var i, j, mat4x4Array = [];
                
            for(i = 0; i < transformArray.length/16; ++i) {
                if(visibilities[i]) {
                    var mat4x4 = [];
                    for(j = 0; j < 16; ++j) {
                        mat4x4[j] = transformArray[i * 16 + j];
                    }
                    mat4x4Array[i] = mat4x4;
                }
            }
            
            return mat4x4Array;
        }
                            
        function initFlowAnalysers() {
            var id, xflowEl;

            for ( id in flowAnalysers ) {
                xflowEl = document.getElementById( id );
                flowAnalysers[id] = xflowEl ? xflowEl : false;
            }

        }

        function initObservers() {
            var id;
            for ( id in flowAnalysers ) {
                 if( id === 'MarkerDetector' ) {
                     observers['MarkerDetector'].observe( flowAnalysers[id], {names: ["arvideo"]} );
                     log("ARManager: Observing Marker tags from the camera feed." );
                     observers['MarkerAnalyser'].observe( flowAnalysers[id], {names: ["Marker5x5Transforms", "Marker3x3Transforms", "imageMarkerTransforms", "Marker5x5Visibilities",
                                                                                      "Marker3x3Visibilities", "imageMarkerVisibilities"]} );
                 }
            }
        }

        this.init = function () {
        
            log("ARManager: Initialising..." );

            background = document.getElementById('background' );
            
            if(background)
                bgCtx = background.getContext( '2d' );

            initFlowAnalysers();

            markerDetector = new AR.Alvar(framework);
                
            initObservers();
            maxMarkersToTrack.marker3x3 = document.getElementById('Marker3x3').value.length;
            maxMarkersToTrack.marker5x5 = document.getElementById('Marker5x5').value.length;
            maxMarkersToTrack.imageMarker = document.getElementById('imageMarkers').value.length;
            
            log("ARManager: Max number of marker3x3s to track " + maxMarkersToTrack.marker3x3);
            log("ARManager: Max number of marker5x5s to track " + maxMarkersToTrack.marker5x5);
            log("ARManager: Max number of image markers to track " + maxMarkersToTrack.imageMarker);
            log("ARManager: Initialization done");

        };
    
        this.setMarkerCallback = function(callback) {
            callBackFunctions.push(callback);
        };
        
        this.addMarker = function (markerId, markerType) {
            var i, markers;
            
            if(markerType == "Marker3x3") {
                if(markerId < 0 && markerId > numMarkers)
                    log("ARManager: Incorrect marker3x3 id " +markerId+ ". Marker3x3 must be between 0 - 63");
                
                 markers = document.getElementById('Marker3x3').value;       
            }
            else if(markerType == "Marker5x5") {
                markers = document.getElementById('Marker5x5').value;
            } 
            else if(markerType == "imageMarker") {
                markers = document.getElementById('imageMarkers').value;
            }
            else {
                log("ARManager: Wrong marker type " + markerType);
                return; 
            }
            
            for(i = 0; i < markers.length; ++i)
            {
                if(markers[i] == -1) {
                    markers[i] = markerId;
                    return;
                }
            }
               
            log("ARManager: Could not add " + markerType + " id " + markerId + " to objects to track"); 
        };

        this.init();

    };

}( window['wex'] = window['wex'] || {} ));
