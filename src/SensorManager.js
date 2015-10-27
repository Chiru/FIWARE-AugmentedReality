/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, 
 *  All Rights Reserved

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function ( namespace, undefined ) {
    "use strict";

    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;

    var SensorListener = function ( type ) {

        var callBackFunctions = [],
            eventType;

        function callBack(event) {
            var i;
            for(i in callBackFunctions) {
                callBackFunctions[i](event);
            }
        }

        if ( type === 'orientation' ) {
            eventType = "deviceorientation";
        } else if ( type === 'motion' ) {
            eventType = "devicemotion";
        } else if ( type === 'light' ) {
            eventType = "devicelight";
        } else if ( type === 'proximity' ) {
            eventType = "deviceproximity";
        }

        window.addEventListener( eventType, callBack, false );

        this.addAction = function(callback) {
            callBackFunctions.push(callback);
        };
    };

    var SensorManager = AR.SensorManager = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var SENSOR_TYPES = this.sensorTypes = namespace.Util.createEnum( 'orientation', 'motion', 'light', 'proximity' ),
            availableSensors = [],
            listeners = {},
            hasGPS = false;

        this.init = function () {
            // Checking available sensors and GPS
            log( "SensorManager: Initialising..." );

            log( "SensorManager: Checking sensors..." );

            if ( navigator.geolocation ) {
                hasGPS = true;
                log( "SensorManager: GPS available." );
            }

            if ( window.DeviceOrientationEvent ) {
                availableSensors.push( 'orientation' );
                log( "SensorManager: Orientation available." );
            }

            if ( window.DeviceMotionEvent ) {
                availableSensors.push( 'motion' );
                log( "SensorManager: Acceleration available." );
            }

            if ( window.DeviceLightEvent ) {
                availableSensors.push( 'light' );
                log( "SensorManager: Ambient light available." );
            }

            if ( window.DeviceProximityEvent ) {
                availableSensors.push( 'proximity' );
                log( "SensorManager: Proximity available." );
            }

            log( "SensorManager: Initialization done" );
        };

        this.listenSensor = function ( type ) {
            if ( SENSOR_TYPES.hasOwnProperty( type ) && availableSensors.indexOf( type ) === -1 ) {
                return false;
            }
            var listener = new SensorListener( type );

            if ( !listeners.hasOwnProperty( type ) ) {
                listeners[type] = listener;
            }

            return listeners[type];
        };

        this.hasGPS = function () {
            return hasGPS;
        };

        this.getCurrentPosition = function ( success, error, options ) {
            if ( hasGPS ) {
                navigator.geolocation.getCurrentPosition( success, error, options);
                return true;
            }

            return false;

        };
        
        this.watchPosition = function ( success, error, options ) {
             if ( hasGPS ) {
                 navigator.geolocation.watchPosition(success, error, options);
             }
        }

        this.getAvailableSensors = function () {
            return availableSensors;
        };

        this.getSensorListeners = function () {
            return listeners;
        };

        this.getListener = function(sensorType){
            if (typeof sensorType === "string" && listeners.hasOwnProperty(sensorType)){
                return listeners[sensorType];
            }

            return false;
        };

        // Initialise when created
        this.init();

    };

}( window['wex'] = window['wex'] || {} ));
