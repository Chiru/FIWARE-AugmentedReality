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
