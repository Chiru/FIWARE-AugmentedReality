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

         var defaults = {
            markerDetector : 'JSARToolkit'
        }, opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var flowAnalysers, observers, background, bgCtx, callBackFunctions = [], maxMarkersToTrack = {}, cameraProjection = null;

         flowAnalysers = {
            'MarkerDetector': false,
        };

        observers = {
            'MarkerDetector': VideoStreamObserver(),
            'MarkerAnalyser': MarkerObserver(),
        };
        
        var markerDetector;

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
                    marker5x5Transforms = records[0].result.getValue("marker5x5Transforms"),
                    imageMarkerTransforms = records[0].result.getValue("customMarkerTransforms"),
                    marker5x5Visibilities = records[0].result.getValue("marker5x5Visibilities"),
                    imageMarkerVisibilities = records[0].result.getValue("customMarkerVisibilities");
                
				    cameraProjection = records[0].result.getValue("perspective");
                    if(callBackFunctions.length == 0)
                        return;
                        
                    var mat4x4Marker5x5TransArray = null;
                    var mat4x4ImgMarkerTransArray = null;
                                           
                    if(marker5x5Transforms)    
                        mat4x4Marker5x5TransArray = sliceArray(marker5x5Transforms, marker5x5Visibilities);
                        
                    if(imageMarkerTransforms)  
                        mat4x4ImgMarkerTransArray = sliceArray(imageMarkerTransforms, imageMarkerVisibilities);
                                             
                    for(i in callBackFunctions) {
                        callBackFunctions[i](mat4x4Marker5x5TransArray, mat4x4ImgMarkerTransArray, marker5x5Visibilities, imageMarkerVisibilities);
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
                     observers['MarkerAnalyser'].observe( flowAnalysers[id], {names: ["marker5x5Transforms", "customMarkerTransforms", "marker5x5Visibilities",
                                                                                      "customMarkerVisibilities", "perspective"]} );
                 }
            }
        }

        this.init = function () {
        
            log("ARManager: Initialising..." );

            background = document.getElementById('background' );
            
            if(background)
                bgCtx = background.getContext( '2d' );

            initFlowAnalysers();

             if(opts.markerDetector === "JSARToolkit")
                markerDetector = new AR.JSARToolkit(framework);
			else
                log("ARManager: Marker detector not defined");
			
            initObservers();
            maxMarkersToTrack.marker5x5 = document.getElementById('marker5x5').value.length;
            maxMarkersToTrack.imageMarker = document.getElementById('customMarkers').value.length;
            
            log("ARManager: Max number of marker5x5s to track " + maxMarkersToTrack.marker5x5);
            log("ARManager: Max number of custom markers to track " + maxMarkersToTrack.imageMarker);
            log("ARManager: Initialization done");

        };
    
        this.setMarkerCallback = function(callback) {
            callBackFunctions.push(callback);
        };
        
		this.getProjectionMatrix = function() {
			return cameraProjection;
		};

        this.init();

    };

}( window['wex'] = window['wex'] || {} ));
