/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    "use strict";

    // Namespace for this application
    var AR = namespace.AR = {},
        util = namespace.Util;

    // Attributes
    AR.VERSION = 'v0.1.1';
    AR.NAME = 'Wex AR';
    AR.ENUMS = {};


    //XML3D Settings
    XML3D.debug.loglevel = 0;

    // Top Level API
    AR.setupSensors = function ( options ) {
        return AR.Framework.createSensorManager( options );

    };

    AR.setupARManager = function ( options ) {
        return AR.Framework.createARManager( options );

    };

    AR.setupConnection = function ( options ) {
        return AR.Framework.createConnection( options );

    };

    AR.setupSceneManager = function ( options ) {
        return AR.Framework.createSceneManager( options );

    };

    AR.start = function () {
        return AR.Framework.start();
    };

    util.log( "Loading " + AR.NAME + " " + AR.VERSION + " application..." );


}( window['wex'] = window['wex'] || {} ));
