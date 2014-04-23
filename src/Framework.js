/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    "use strict";

    var Framework, util, AR;

    AR = namespace.AR; // Namespace for this application
    util = namespace.Util;


    Framework = AR.Framework = {

        sensorManager: null, // Sensor manager for creating sensor listeners
        connection: null, // Communication layer for communication with remote services.
        arManager: null, //AR manager is responsible for creating observers for AR related XFlow elements. Also, manages video input stream from device camera
        sceneManager: null,
        options: {connection: {}, sensors: {}, ar: {}, scene: {}},

        // API

        setOptions: function ( options, type ) {
            if ( this.options.hasOwnProperty( type ) ) {
                util.extend( this.options[type], options );
                return true;
            }
            return false;
        },

        createConnection: function ( options ) {
            this.connection = new AR.Communication( this, options );
            return this.connection;
        },

        createSensorManager: function ( options ) {
            this.sensorManager = new AR.SensorManager( this, options );
            return this.sensorManager;
        },

        createARManager: function ( options ) {
            this.assetManager = new AR.ARManager( this, options );
            return this.assetManager;
        },

        createSceneManager: function ( options ) {
            this.sceneManager = new AR.SceneManager( this, options );
            return this.sceneManager;
        },


        start: function() {
        
            var video, localVideoStream;
            
            var noCameraFeedError = function () {
                log( "Framework: ERROR: No camera feed available." );
            };

            var noUserMediaError = function () {
                log( "Framework: ERROR: No navigator.getUserMedia method available, check if your browser supports WebRTC." );
            };
            
            window.URL = window.URL || window.webkitURL;
            navigator.getUserMedia = (navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia);

            video = document.querySelector( 'video' );

            if(!video) {
                util.log( "Framework: ERROR: No <video> tag was found." );
                return;
            }

            if(navigator.getUserMedia) {
                util.log( "Framework: Requesting Camera feed." );

                navigator.getUserMedia( {video: true, audio: false}, function ( stream ) {
                    video.src = window.URL.createObjectURL( stream );
                    localVideoStream = stream;
                    util.log( "Framework: Got camera feed. url: " + video.src);
                    video.play();
                    
                }, noCameraFeedError );
            } else {

                noUserMediaError;
            }
        }
    };

}( window['wex'] = window['wex'] || {} ));
