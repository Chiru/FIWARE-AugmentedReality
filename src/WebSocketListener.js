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
