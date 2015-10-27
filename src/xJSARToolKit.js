(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;

    var JSARToolkit = AR.JSARToolkit = function (framework, options) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );
        
        var jsar = {}, jsarInitialized = false;
        
        function drawImageData(image) {

            if (!jsar.canvas) {
                jsar.canvas = document.createElement('canvas');
                jsar.canvas.width = image.width;
                jsar.canvas.height = image.height;
                jsar.context = jsar.canvas.getContext('2d');
            }

            jsar.context.putImageData(image, 0, 0);
            jsar.canvas.changed = true;
        };

		function initCustomMarkers() {
			
			var encoder = new FLARIdMarkerDataEncoder_RawBit();
			var markerCodes = [], markerWidths = [];
			var customMarkerUrls = document.getElementById( "customMarkerContainer" ).children;
			
			for(var i = 0; i < customMarkerUrls.length; ++i) {
				var url = customMarkerUrls[i].innerHTML;
				if(url) {
					var req = new XMLHttpRequest();
					req.onload = function(e) {
						//Create 32x32 custom marker.
						var markerCode = new FLARCode(32,32);
						markerCode.loadARPatt(req.response);
						encoder.encode(markerCode,encoder.createDataInstance());
						markerCodes.push(markerCode);
						markerWidths.push(1.0);
					}
							
					req.open("get", url, false);
					req.send();
				}
			}
			
			jsar.customDetector = new FLARMultiMarkerDetector(jsar.param, markerCodes, markerWidths, customMarkerUrls.length);
			jsar.customDetector.setContinueMode(true);
		};
		
        function initARToolkit(image, createMarkerDetector, createCustomDetector) {
            log( "JSARToolkit: initializing..." );
            drawImageData(image);
            jsar.raster = new NyARRgbRaster_Canvas2D(jsar.canvas); // create reader for the video canvas
            jsar.param = new FLARParam(jsar.canvas.width, jsar.canvas.height); // create new Param for the canvas [~camera params]
            var viewMat = XML3D.math.mat4.create();
            var zNear = 0.1;
            var zFar = 1000.0;
            jsar.param.copyCameraMatrix(viewMat, zNear, zFar);
			//copyCameraMatrix calculates the Z direction unit cube like this:
			//q[2][2] = -(FAR_CLIP + NEAR_CLIP) / (NEAR_CLIP - FAR_CLIP);
            //q[2][3] = 2.0 * FAR_CLIP * NEAR_CLIP / (NEAR_CLIP - FAR_CLIP);
            //Flip the q[2][2] to positive.
			viewMat[10] = -viewMat[10];
			//Camera should look towards -Z instead of +Z.
            viewMat[11] = -viewMat[11];
			//Now we have correct perspective matrix.
            jsar.perspective = viewMat;
			
			if(createMarkerDetector) {
				jsar.detector = new FLARMultiIdMarkerDetector(jsar.param, 1); // marker size is 1 [transform matrix units]
				jsar.detector.setContinueMode(true);
			}
			if(createCustomDetector) {
				initCustomMarkers();
			}
			
            jsarInitialized = true;
        };
		
		function getMarkerID(id) {
			var currId;
			// read back id marker data byte by byte (welcome to javaism)
			if (id.packetLength > 4) {
				currId = -1;
			} else {
				currId = 0;
				for (var i = 0; i < id.packetLength; i++) {
					currId = (currId << 8) | id.getPacketData(i);
				}
			}
			
			return currId;
		};
		
		function detectMarkers(customMarkerConfidence) {
	        var threshold = 120;//140;//128;
			var resultMarkers = [];
			//Get custom markers
			if (jsar.customDetector) {
				var detectedCustom = jsar.customDetector.detectMarkerLite(jsar.raster, threshold);		
				for (var i = 0; i < detectedCustom; i++) {
					if(jsar.customDetector.getConfidence(i) > customMarkerConfidence) {
						var marker = {};
						marker.transform = new NyARTransMatResult();
						jsar.customDetector.getTransformMatrix(i, marker.transform);

						//get id                
                        marker.id = jsar.customDetector.getARCodeIndex(i);
						marker.type = 'custom';
						resultMarkers.push(marker);
					}
				}
			}
			
			//Get 5x5 markers
			if(jsar.detector) {
				var detected5x5 = jsar.detector.detectMarkerLite(jsar.raster, threshold);
				for (var i = 0; i < detected5x5; i++) {
					var marker = {};
					marker.transform = new NyARTransMatResult();
					jsar.detector.getTransformMatrix(i, marker.transform);

					//get id                
					var ind = jsar.detector.getIdMarkerData(i);
                    marker.id = getMarkerID(ind);
					marker.type = '5x5';
					resultMarkers.push(marker);
				}			
			}

			return resultMarkers;
        };
		
        this.registerXFlowOperators = function() {
           log("JSARToolkit: registering xFlow operators");
           Xflow.registerOperator('detect', {
                outputs: [ {type: 'float4x4', name : 'marker5x5Transforms', customAlloc: true},
                           {type: 'float4x4', name : 'customMarkerTransforms', customAlloc: true},
                           {type: 'bool', name: 'marker5x5Visibilities', customAlloc: true},
                           {type: 'bool', name: 'customMarkerVisibilities', customAlloc: true},
                           {type: 'float4x4', name : 'perspective', customAlloc: true}
                         ],
                params:  [ {type: 'texture', source : 'imageData', optional: true},
                           {type: 'int', source: 'marker5x5', optional: true},
                           {type: 'int', source: 'customMarkers', optional: true},
                           {type: 'float', source: 'customMarkerConfidence', optional: true},
                           {type: 'bool', source: 'flip', optional: true}
                         ],
                alloc: function(sizes, imageData, marker5x5, customMarkers) {
                    sizes['marker5x5Transforms'] = marker5x5.length;
                    sizes['customMarkerTransforms'] = customMarkers.length;
                    sizes['marker5x5Visibilities'] = marker5x5.length;
                    sizes['customMarkerVisibilities'] = customMarkers.length;
                    sizes['perspective'] = 1;
                },
                evaluate: function(marker5x5Transforms, customMarkerTransforms, 
                		marker5x5Visibilities, customMarkerVisibilities, 
                		perspective, imageData, marker5x5, customMarkers, customMarkerConfidence, flip) {

                	perspective[0] = 1; perspective[1] = 0; perspective[2] = 0; perspective[3] = 0;
                	perspective[4] = 0; perspective[5] = 1; perspective[6] = 0; perspective[7] = 0;
                	perspective[8] = 0; perspective[9] = 0; perspective[10] = 1; perspective[11] = 0;
                	perspective[12] = 0; perspective[13] = 0; perspective[14] = 0; perspective[15] = 1;

                	// Initialize visibilities and transforms to default values
                	for (var i = 0; i < marker5x5Transforms.length; ++i) {
                		marker5x5Visibilities[i] = false;
                		var mi = 16*i;
                		marker5x5Transforms[mi+0] = 1; marker5x5Transforms[mi+1] = 0; marker5x5Transforms[mi+2] = 0; marker5x5Transforms[mi+3] = 0;
                		marker5x5Transforms[mi+4] = 0; marker5x5Transforms[mi+5] = 1; marker5x5Transforms[mi+6] = 0; marker5x5Transforms[mi+7] = 0;
                		marker5x5Transforms[mi+8] = 0; marker5x5Transforms[mi+9] = 0; marker5x5Transforms[mi+10] = 1; marker5x5Transforms[mi+11] = 0;
                		marker5x5Transforms[mi+12] = 0; marker5x5Transforms[mi+13] = 0; marker5x5Transforms[mi+14] = 0; marker5x5Transforms[mi+15] = 1;
                	}

                	for (var i = 0; i < customMarkerTransforms.length; ++i) {
                		customMarkerVisibilities[i] = false;
                		var mi = 16*i;
                		customMarkerTransforms[mi+0] = 1; customMarkerTransforms[mi+1] = 0; customMarkerTransforms[mi+2] = 0; customMarkerTransforms[mi+3] = 0;
                		customMarkerTransforms[mi+4] = 0; customMarkerTransforms[mi+5] = 1; customMarkerTransforms[mi+6] = 0; customMarkerTransforms[mi+7] = 0;
                		customMarkerTransforms[mi+8] = 0; customMarkerTransforms[mi+9] = 0; customMarkerTransforms[mi+10] = 1; customMarkerTransforms[mi+11] = 0;
                		customMarkerTransforms[mi+12] = 0; customMarkerTransforms[mi+13] = 0; customMarkerTransforms[mi+14] = 0; customMarkerTransforms[mi+15] = 1;
                	}
					
					// Skip marker detection if image data is not ready
                	if(!imageData || !imageData.data || imageData.length == 0)
                		return;
					
                    if (!jsarInitialized) {
                        initARToolkit(imageData, (marker5x5.length > 0), (customMarkers.length > 0));
                    } else {
                        drawImageData(imageData);
                    }

                    for (var i = 0; i < 16; ++i) {
                        perspective[i] = jsar.perspective[i];
                    }

                    var detected = detectMarkers(customMarkerConfidence[0]);
					
					//var transforms, markers, visibilities;
					for (var i = 0; i < detected.length; i++) {
                    	// Get marker
                    	var marker = detected[i];
                    	
                    	// Initialize some array references
                    	if(marker.type == 'custom'){
                    		var transforms = customMarkerTransforms;
                    		var markers = customMarkers;
                    		var visibilities = customMarkerVisibilities;
                    	} else {							
							var transforms = marker5x5Transforms;
                    		var markers = marker5x5;
                    		var visibilities = marker5x5Visibilities;
                    	}

                    	// Loop markers add set values using references
                    	var markerIndex = 0;
                    	for (; markerIndex < markers.length; markerIndex++) {
                    		if (markers[markerIndex] == marker.id) {
                    			visibilities[markerIndex] = true;
                    			break;
                    		}
                    	}
						
                        var xfm = marker.transform;
						var mOffset = 16*markerIndex;

                        if (flip && flip[0]) {
                            // webcam (we show mirrored picture on the screen)
                            transforms[mOffset+0]  = +xfm.m00;
                            transforms[mOffset+1]  = +xfm.m10;
                            transforms[mOffset+2]  = +xfm.m20;
                            transforms[mOffset+3]  = 0;
                            transforms[mOffset+4]  = -xfm.m01;
                            transforms[mOffset+5]  = -xfm.m11;
                            transforms[mOffset+6]  = -xfm.m21;
                            transforms[mOffset+7]  = 0;
                            transforms[mOffset+8]  = -xfm.m02;
                            transforms[mOffset+9]  = -xfm.m12;
                            transforms[mOffset+10] = -xfm.m22;
                            transforms[mOffset+11] = 0;
                            transforms[mOffset+12] = -xfm.m03;
                            transforms[mOffset+13] = -xfm.m13;
                            transforms[mOffset+14] = -xfm.m23;
                            transforms[mOffset+15] = 1;
                        } else {
                            transforms[mOffset+0]  = +xfm.m00;
                            transforms[mOffset+1]  = -xfm.m10;
                            transforms[mOffset+2]  = -xfm.m20;
                            transforms[mOffset+3]  = 0;
                            transforms[mOffset+4]  = +xfm.m01;
                            transforms[mOffset+5]  = -xfm.m11;
                            transforms[mOffset+6]  = -xfm.m21;
                            transforms[mOffset+7]  = 0;
                            transforms[mOffset+8]  = +xfm.m02;
                            transforms[mOffset+9]  = -xfm.m12;
                            transforms[mOffset+10] = -xfm.m22;
                            transforms[mOffset+11] = 0;
                            transforms[mOffset+12] = +xfm.m03;
                            transforms[mOffset+13] = -xfm.m13;
                            transforms[mOffset+14] = -xfm.m23;
                            transforms[mOffset+15] = 1;
                        }
                    }
                    
                    return true;
                }
            });
        }
        
        this.registerXFlowOperators();  
    };
    
}( window['wex'] = window['wex'] || {} ));