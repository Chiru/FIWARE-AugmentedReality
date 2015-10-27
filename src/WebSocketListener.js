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


    var WebSocketListener = AR.WebSocketListener = function ( framework, options ) {

        var defaults = {},
            opts;

        // Setting options
        opts = extend( {}, defaults, options );

        var ws = null, url = "", callBackFunctions = [];

        this.connect = function(url) {
            this.url = url;
            
            try{
                if(window.WebSocket)
                    this.ws = new window.WebSocket(this.url);
                else if (window.MozWebSocket)
                    this.webSocket = new window.MozWebSocket(this.url);
                else
                    log("WebSocketListener: Browser does not support WebSocket");
     
                this.webSocket.binaryType = 'arraybuffer';
            }
            catch (e) {
                log("WebSocketListener: Connecting WebSocket failed: " + e.stack);
            }

            this.ws.onopen = function(evt) {
                log("WebSocketListener: Connected: " + this.url);
            }.bind(this);

            this.ws.onclose = function(evt) {
                log("WebSocketListener: Disconnected: " + this.url + " reason: " + evt.reason);
                this.ws = null;
            }.bind(this);

            this.ws.onerror = function(evt) {
                log("WebSocketListener: Error: " + evt.data);
            }.bind(this);
            
            this.ws.onmessage = function(evt) {
                var i = 0;
                var json = JSON.parse(evt.data);
                
                if(callBackFunctions.length === 0)
                    return;
                        
                for(i in callBackFunctions) {
                    callBackFunctions[i](json);
                }
                    
            }.bind(this);
        
        };
        
        this.addAction = function(callback)
        {
            callBackFunctions.push(callback);
        };
        
    };

}( window['wex'] = window['wex'] || {} ));
