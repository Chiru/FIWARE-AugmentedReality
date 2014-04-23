(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;

    var Alvar = AR.Alvar = function (framework, options) {

        var defaults = {},
            opts;
        
        // Setting options
        opts = extend( {}, defaults, options );
        var imageBuffer, projectionMatrix, markersJson, width, height, channels = 4, alvarInitialized = false,
            imageMarkerArray = [], alvarMarkerArray = [], artoolkitMarkerArray = [];
        
        function initAlvar(imageWidth, imageHeight) {
            log( "Alvar: initializing..." );
	        // Size
	        width = imageWidth;
	        height = imageHeight;
	
	        // In case of reinitialization?
	        if(imageBuffer)
		        Module._free(imageBuffer);
	        // Memory for shared memory space
	        imageBuffer = Module._malloc(width*height*channels*Uint8Array.BYTES_PER_ELEMENT);

	        // Init Alvar
	        var projection = Module.ccall(
			        'init', // Function 
			        'string', // Return value
			        // Parameters
			        ['number', 		'number', 		'number'], 
			        [width, 	height, 	imageBuffer]);
	
	        // Set projection matrix
	        projectionMatrix = JSON.parse(projection);
	        alvarInitialized = true;
        }

        function addAlvarMarker(id){
	        Module.ccall(
			    'add_alvar_marker', // Function 
			    null, // Return value
			    // Parameters
			    ['number'], 
			    [id]);
        }

        function addArtoolkitMarker(id){
	        Module.ccall(
			        'add_artoolkit_marker', // Function 
			        null, // Return value
			        // Parameters
			        ['number'], 
			        [id]);
        }

        function addImageMarker(id, allowedErrors){
        
            if(id < 0)
                return;
                
	        var image = new Image();
	        image.crossOrigin = "anonymous";
	        var urlDiv
	        
	        try {
	            urlDiv = document.getElementById( "imageContainer" ).children[id];
	        } 
	        catch(err) {
	            log("Alvar: " + err);
	        } 
	        
	        var imageUrl;
	        
	        if(urlDiv)
                imageUrl = urlDiv.innerHTML;
            
            if(imageUrl) 
	            image.src = imageUrl;
	        else 
	            log("Alvar: No url found for image ID " + id);
	        
	        // Using separate function in order to sustain Alvar reference, loop index and marker ID
	        image.onload = function(){
		        var canvas = document.createElement('canvas');
		        canvas.width = this.width;
		        canvas.height = this.height;
		        // Copy the image contents to the canvas
		        var ctx = canvas.getContext('2d');
		        ctx.drawImage(this, 0, 0);
		        // Get image data
		        var imageData = ctx.getImageData(0, 0, this.width, this.height);
		        imageData = new Uint8Array(imageData.data);    
		        var imageMarkerBuffer = Module._malloc(imageData.length*imageData.BYTES_PER_ELEMENT);
		        Module.HEAPU8.set(imageData, imageMarkerBuffer);
		
		        // Call Alvar
		        Module.ccall(
				        'add_image_marker', // Function 
				        null, // Return value
				        // Parameters
				        ['number',		'number',		'number',			'number',	'number'], 
				        [this.width,	this.height,	imageMarkerBuffer,	id,			allowedErrors]);
		
		        // Gives error: Uncaught abort() at Error
		        Module._free(imageMarkerBuffer);
		        log('Alvar: Loading image for ID ' + id + ' url: ' + imageUrl + ' height: ' + this.height + ' width ' + this.width + ' was successful');
	        };
	        image.onabort = function(event){
		        log('Alvar: Loading image for ID ' + id + ' url: ' + imageUrl + ' was aborted');
	        };
	        image.onerror = function(event){
		        log('Alvar: Error while loading image for ID ' + id + ' url: ' + imageUrl);
	        };
        }

        function detectMarkers(imageData) {
	        // Set image data
	        var arr = new Uint8Array(imageData.data);
	        Module.HEAPU8.set(arr, imageBuffer);
	        // Call Alvar
	        var markers = Module.ccall('process_image', 'string');
	
	        try {
		        // Get markers
		        markersJson = JSON.parse(markers);
	        }
	        catch(err) {
		        markersJson = [];
	        }
	        // Return the number of detected markers
	        var markerCount = (markersJson) ? markersJson.length : 0;
	
	        return markerCount;
        }

        function getMarker(index) {
	        return markersJson[index];
        }

        function getProjectionMatrix() {
	        return projectionMatrix;
        }

        function setMarkers(alvarMarkers, artoolkitMarkers, imageMarkers, allowedImageMarkerErrors) {
            var i;
	        // Add markers that are not already added
	        for(i = 0; i < alvarMarkers.length; ++i){
		        var id = alvarMarkers[i];
		        if(alvarMarkerArray.indexOf(id) == -1){
			        alvarMarkerArray.push(id);
			        addAlvarMarker(id);
		        }
	        }
	        for(i = 0; i < artoolkitMarkers.length; ++i){
		        var id = artoolkitMarkers[i];
		        if(artoolkitMarkerArray.indexOf(id) == -1){
			        artoolkitMarkerArray.push(id);
			        addArtoolkitMarker(id);
		        }
	        }
	        for(i = 0; i  <imageMarkers.length; ++i){
		        var id = imageMarkers[i];
		        if(imageMarkerArray.indexOf(id) == -1){
			        imageMarkerArray.push(id);
			        var allowedErrors = (allowedImageMarkerErrors && allowedImageMarkerErrors[i]) ? allowedImageMarkerErrors[i] : -1;
			        addImageMarker(id, allowedErrors);
		        }
	        }
        }
        
        this.registerXFlowOperators = function() {
            log("Alvar: registering xFlow operators");
            Xflow.registerOperator('alvar.detect', {
                outputs: [ {type: 'float4x4', name : 'Marker5x5Transforms', customAlloc: true},
                           {type: 'float4x4', name : 'Marker3x3Transforms', customAlloc: true},
                           {type: 'float4x4', name : 'imageMarkerTransforms', customAlloc: true},
                           {type: 'bool', name: 'Marker5x5Visibilities', customAlloc: true},
                           {type: 'bool', name: 'Marker3x3Visibilities', customAlloc: true},
                           {type: 'bool', name: 'imageMarkerVisibilities', customAlloc: true},
                           {type: 'float4x4', name : 'perspective', customAlloc: true}
                         ],
                params:  [ {type: 'texture', source : 'imageData', optional: true},
                           {type: 'int', source: 'Marker5x5', optional: true},
                           {type: 'int', source: 'Marker3x3', optional: true},
                           {type: 'int', source: 'imageMarkers', optional: true},
                           {type: 'int', source: 'allowedImageMarkerErrors', optional: true},
                           {type: 'bool', source: 'flip', optional: true}
                         ],
                alloc: function(sizes, imageData, Marker5x5, Marker3x3, imageMarkers) {
                    var alvarMarkerLength = Marker5x5.length;
                    var artoolkitMarkerLength = Marker3x3.length;
                    var imageMarkerLength = imageMarkers.length;
                    sizes['Marker5x5Transforms'] = alvarMarkerLength;
                    sizes['Marker3x3Transforms'] = artoolkitMarkerLength;
                    sizes['imageMarkerTransforms'] = imageMarkerLength;
                    sizes['Marker5x5Visibilities'] = alvarMarkerLength;
                    sizes['Marker3x3Visibilities'] = artoolkitMarkerLength;
                    sizes['imageMarkerVisibilities'] = imageMarkerLength;
                    sizes['perspective'] = 1;
                },
                evaluate: function(Marker5x5Transforms, Marker3x3Transforms, imageMarkerTransforms, 
                		Marker5x5Visibilities, Marker3x3Visibilities, imageMarkerVisibilities, 
                		perspective, imageData, Marker5x5, Marker3x3, imageMarkers, allowedImageMarkerErrors, flip) {
                	    	
                	// Initialize projection matrix to default values
                	for (var i = 0; i < 16; ++i) {
                		perspective[0] = 1; perspective[1] = 0; perspective[2] = 0; perspective[3] = 0;
                		perspective[4] = 0; perspective[5] = 1; perspective[6] = 0; perspective[7] = 0;
                		perspective[8] = 0; perspective[9] = 0; perspective[10] = 1; perspective[11] = 0;
                		perspective[12] = 0; perspective[13] = 0; perspective[14] = 0; perspective[15] = 1;
                	}
                	// Initialize visibilities and transforms to default values
                	for (var i = 0; i < Marker5x5Transforms.length; ++i) {
                		Marker5x5Visibilities[i] = false;
                		var mi = 16*i;
                		Marker5x5Transforms[mi+0] = 1; Marker5x5Transforms[mi+1] = 0; Marker5x5Transforms[mi+2] = 0; Marker5x5Transforms[mi+3] = 0;
                		Marker5x5Transforms[mi+4] = 0; Marker5x5Transforms[mi+5] = 1; Marker5x5Transforms[mi+6] = 0; Marker5x5Transforms[mi+7] = 0;
                		Marker5x5Transforms[mi+8] = 0; Marker5x5Transforms[mi+9] = 0; Marker5x5Transforms[mi+10] = 1; Marker5x5Transforms[mi+11] = 0;
                		Marker5x5Transforms[mi+12] = 0; Marker5x5Transforms[mi+13] = 0; Marker5x5Transforms[mi+14] = 0; Marker5x5Transforms[mi+15] = 1;
                	}
                	for (var i = 0; i < Marker3x3Transforms.length; ++i) {
                		Marker3x3Visibilities[i] = false;
                		var mi = 16*i;
                		Marker3x3Transforms[mi+0] = 1; Marker3x3Transforms[mi+1] = 0; Marker3x3Transforms[mi+2] = 0; Marker3x3Transforms[mi+3] = 0;
                		Marker3x3Transforms[mi+4] = 0; Marker3x3Transforms[mi+5] = 1; Marker3x3Transforms[mi+6] = 0; Marker3x3Transforms[mi+7] = 0;
                		Marker3x3Transforms[mi+8] = 0; Marker3x3Transforms[mi+9] = 0; Marker3x3Transforms[mi+10] = 1; Marker3x3Transforms[mi+11] = 0;
                		Marker3x3Transforms[mi+12] = 0; Marker3x3Transforms[mi+13] = 0; Marker3x3Transforms[mi+14] = 0; Marker3x3Transforms[mi+15] = 1;
                	}
                	for (var i = 0; i < imageMarkerTransforms.length; ++i) {
                		imageMarkerVisibilities[i] = false;
                		var mi = 16*i;
                		imageMarkerTransforms[mi+0] = 1; imageMarkerTransforms[mi+1] = 0; imageMarkerTransforms[mi+2] = 0; imageMarkerTransforms[mi+3] = 0;
                		imageMarkerTransforms[mi+4] = 0; imageMarkerTransforms[mi+5] = 1; imageMarkerTransforms[mi+6] = 0; imageMarkerTransforms[mi+7] = 0;
                		imageMarkerTransforms[mi+8] = 0; imageMarkerTransforms[mi+9] = 0; imageMarkerTransforms[mi+10] = 1; imageMarkerTransforms[mi+11] = 0;
                		imageMarkerTransforms[mi+12] = 0; imageMarkerTransforms[mi+13] = 0; imageMarkerTransforms[mi+14] = 0; imageMarkerTransforms[mi+15] = 1;
                	}
                	
                	// Skip marker detection if image data is not ready
                	if(!imageData || !imageData.data || imageData.length == 0)
                		return;
                	
                	// Initialize Alvar if not done already
                	if(!alvarInitialized){
                		initAlvar(imageData.width, imageData.height);
                	}
                	
                	// Set markers
                	setMarkers(Marker5x5, Marker3x3, imageMarkers, allowedImageMarkerErrors);
                	
                	// Set projection matrix
                	var projectionMatrix = getProjectionMatrix();
                	for (var i = 0; i < 16; ++i) {
                		perspective[i] = projectionMatrix[i];
                	}

                    // Detect markers from frame
                    var detected = detectMarkers(imageData);

                    // Loop all detected markers
                    for (var i = 0; i < detected; i++) {
                    	// Get marker
                    	var marker = getMarker(i);
                    	
                    	// Initialize some array references
                    	if(marker.type == 'alvar'){
                    		var transforms = Marker5x5Transforms;
                    		var markers = Marker5x5;
                    		var visibilities = Marker5x5Visibilities;
                    	}
                    	else if(marker.type == 'artoolkit'){
                    		var transforms = Marker3x3Transforms;
                    		var markers = Marker3x3;
                    		var visibilities = Marker3x3Visibilities;
                    	}
                    	else{
                    		var transforms = imageMarkerTransforms;
                    		var markers = imageMarkers;
                    		var visibilities = imageMarkerVisibilities;
                    	}

                    	// Loop markers add set values using references
                    	var markerIndex = 0;
                    	for (; markerIndex < markers.length; markerIndex++) {
                    		if (markers[markerIndex] == marker.id) {
                    			visibilities[markerIndex] = true;
                    			break;
                    		}
                    	}
                    	
                        // Get the transform matrix for the marker
                        var t = marker.transform;

                        var mOffset = 16*markerIndex;

                        if (flip && flip[0]) {
                            // webcam (we show mirrored picture on the screen)
                            transforms[mOffset+0]  = t[0];
                            transforms[mOffset+1]  = -t[1];
                            transforms[mOffset+2]  = -t[2];
                            //transforms[mOffset+3]  = 0;
                            transforms[mOffset+4]  = -t[4];
                            transforms[mOffset+5]  = t[5];
                            transforms[mOffset+6]  = t[6];
                            //transforms[mOffset+7]  = 0;
                            transforms[mOffset+8]  = -t[8];
                            transforms[mOffset+9]  = t[9];
                            transforms[mOffset+10] = t[10];
                            //transforms[mOffset+11] = 0;
                            transforms[mOffset+12] = -t[12];
                            transforms[mOffset+13] = t[13];
                            transforms[mOffset+14] = t[14];
                            //transforms[mOffset+15] = 1;
                        } else {
                            transforms[mOffset+0]  = t[0];
                            transforms[mOffset+1]  = t[1];
                            transforms[mOffset+2]  = t[2];
                            //transforms[mOffset+3]  = 0;
                            transforms[mOffset+4]  = t[4];
                            transforms[mOffset+5]  = t[5];
                            transforms[mOffset+6]  = t[6];
                            //transforms[mOffset+7]  = 0;
                            transforms[mOffset+8]  = t[8];
                            transforms[mOffset+9]  = t[9];
                            transforms[mOffset+10] = t[10];
                            //transforms[mOffset+11] = 0;
                            transforms[mOffset+12] = t[12];
                            transforms[mOffset+13] = t[13];
                            transforms[mOffset+14] = t[14];
                            //transforms[mOffset+15] = 1;
                    	}
                    }        
                    
                    return true;
                }
            });

            Xflow.registerOperator('alvar.selectTransform', {
                outputs: [ {type: 'float4x4', name : 'transform', customAlloc: true} ],
                params:  [ {type: 'int', source : 'index'},
                           {type: 'float4x4', source: 'transforms'} ],
                alloc: function(sizes, index, transforms) {
                    sizes['transform'] = 1;
                },
                evaluate: function(transform, index, transforms) {
                    var i = 16 * index[0];
                    if (i < transforms.length && i+15 < transforms.length) {
			            transform[0] = transforms[i+0]; transform[1] = transforms[i+1]; transform[2] = transforms[i+2]; transform[3] = transforms[i+3];
			            transform[4] = transforms[i+4]; transform[5] = transforms[i+5]; transform[6] = transforms[i+6]; transform[7] = transforms[i+7];
			            transform[8] = transforms[i+8]; transform[9] = transforms[i+9]; transform[10] = transforms[i+10]; transform[11] = transforms[i+11];
			            transform[12] = transforms[i+12]; transform[13] = transforms[i+13]; transform[14] = transforms[i+14]; transform[15] = transforms[i+15];
                    } else {
			            transform[0] = 1; transform[1] = 0; transform[2] = 0; transform[3] = 0;
			            transform[4] = 0; transform[5] = 1; transform[6] = 0; transform[7] = 0;
			            transform[8] = 0; transform[9] = 0; transform[10] = 1; transform[11] = 0;
			            transform[12] = 0; transform[13] = 0; transform[14] = 0; transform[15] = 1;
                    }
                }
            });
        };
        
                this.registerXFlowOperators();
    };


}( window['wex'] = window['wex'] || {} ));
        
        
