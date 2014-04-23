/**
 *  Project: FI-WARE  
 *  Copyright (c) 2014 Center for Internet Excellence, University of Oulu, All Rights Reserved
 *  For conditions of distribution and use, see copyright notice in license.txt
 */

(function ( namespace, undefined ) {
    var log = namespace.Util.log, AR = namespace.AR, sensorManager, communication, ARManager, sceneManager, xml3dElem, img, title, desc, orientationListener;
    var searchRadius = 300; 
    var currentLoc = {}; 
    var ouluLoc =  {
        'latitude' : 65.0121489732791, 'longitude' : 25.470692664384842};
    var ouluSelected = false;
    var favs = ["8b024e4f-e72e-4f6f-b2c3-83c2046bae9f", "459655ad-8e68-4d74-ba76-fd5a6e146639", "c687096e-9dec-480d-998d-39cb00568d41", "28048160-8c96-4b3d-88fc-62ebeb3039c4", 
               "cf711ea0-4cd3-425f-acc4-1764bb710c99", "18916bea-e79e-42f7-8aaa-49f31d1f0455", "49745104-1475-421a-a660-45cf1725bda8"];
     
    window.onload = function () {
    
        xml3dElem = $("xml3d");
        var offset = xml3dElem.offset();
        var x = offset.left + (xml3dElem.height() / 2);
        var y = offset.top + (xml3dElem.width() / 2);
        setInterval(function(){openPOIFromCoordinates(x, y)}, 500);
        
        img = document.querySelector( '#thumbNail' );
        title = document.querySelector( '#POItitle' );
        desc = document.querySelector( '#description' );
        document.querySelector( '#button_res' ).onclick = get_res;
        document.querySelector( '#button_caf' ).onclick = get_caf;
        document.querySelector( '#button_fav' ).onclick = get_fav;
        
        document.querySelector( '#button_oulu' ).onclick = function() {
            if(!ouluSelected) {
                setLocation(ouluLoc); document.querySelector( '#button_oulu' ).style.color = 'red';
                ouluSelected = true;
            }
            else {
                setLocation(ouluLoc); document.querySelector( '#button_oulu' ).style.color = 'grey';
                ouluSelected = false;
            }
        }

        AR.start(); 
        sceneManager = AR.setupSceneManager();
        sensorManager = AR.setupSensors();
        communication = AR.setupConnection();
        orientationListener = sensorManager.listenSensor('orientation');
        sensorManager.getCurrentPosition(gpsHandler);
        communication.addRemoteService("POI_Data_Provider", "http://dev.cie.fi/FI-WARE/poi_dp/");
        sceneManager.setCameraDegreesOfFreedom(false, false, false, true, false, false);
        orientationListener.addAction(sceneManager.setCameraOrientation);
        sceneManager.setCameraVerticalPlane(90);
    };
    
     function get_res() {
        getPOIsByCategory(currentLoc, "restaurant");
        document.querySelector( '#button_res' ).style.color = 'red';
    }

    function get_caf() {
        getPOIsByCategory(currentLoc, "cafe");
        document.querySelector( '#button_caf' ).style.color = 'red';
    }
    
    function get_fav() {
        getPOIsByID(favs);
        document.querySelector( '#button_fav' ).style.color = 'red';
    }
    
    function gpsHandler (position) {
        currentLoc = position.coords;
    }
    
    function setLocation(location) {
        currentLoc = location;
    }
    
    function getPOIsByCategory(gpsCoordinates, category) {
        var result;
        var restOptions = {
            'function' : "radial_search",
            'lat' : gpsCoordinates.latitude,
            'lon' : gpsCoordinates.longitude,
            'category' : category,
            'radius' : 300 
        }
        log("Requesting POIs by category: " + category);
        communication.queryData("POI_Data_Provider", restOptions, handlePoi, null);   
    }
    
    function getPOIsByID(IDs) {
        var restOptions = {
            'function' : "get_pois",
            'poi_id' : IDs
        }
        
        log("Requesting POIs by id");
        communication.queryData("POI_Data_Provider", restOptions, handlePoi, null);
    }
    
    function handlePoi(data) {
        var uuid, pois, poiData, location, category;
        
        if(!data) {
            return null;
        }

        log("Parsing POI data...");

        if(!data.hasOwnProperty( "pois" )) {
            log("Error: Invalid POI data.");
            return null;
        }

        pois = data['pois'];
        for( uuid in pois ) {
            poiData = pois[uuid];           
            
            if(poiData.hasOwnProperty( "fw_core" )) {
                if(poiData["fw_core"].hasOwnProperty( "location" )) {
                    location = poiData["fw_core"]['location'];
 
                    if(location.hasOwnProperty( 'wgs84' )) {
                        if(poiData["fw_core"].hasOwnProperty( "category" )) {
                            var POIpointer = {};
                        
                            if(poiData["fw_core"].hasOwnProperty( "thumbnail" ) && poiData["fw_core"]["thumbnail"] != null) {
                                var poiThumbNail = poiData["fw_core"]["thumbnail"];
                                POIpointer.thumbNail = poiThumbNail;
                            }
                            
                            if(poiData["fw_core"].hasOwnProperty( "name" ) && poiData["fw_core"]["name"] != null) {
                                var poiTitle = poiData["fw_core"]["name"][""];
                                POIpointer.title = poiTitle;
                            }
                            
                            if(poiData["fw_core"].hasOwnProperty( "description" ) && poiData["fw_core"]["description"] != null) {
                                var poiDesc = poiData["fw_core"]["description"][""];
                                POIpointer.description = poiDesc;
                            }
                            
                            var dist = sceneManager.getDistance(currentLoc, location['wgs84']);
                            var xml3dElement = createPOI(poiData["fw_core"]["category"], uuid, POIpointer.title, Math.round(dist.distance));
                            sceneManager.setPositionFromGeoLocation(currentLoc, location['wgs84'] , xml3dElement, 10, 25);
                            sceneManager.addObjetcToBillboardSet(xml3dElement);
                            POIpointer.pointer = xml3dElement;
                            addEventListeners(POIpointer); 
                        }
                    }
                } 
            }
        }
    }
    
    function createPOI(category, uuid, name, distance) {
        var iconMaterial, POIname = category+uuid, 
            iconMaterialName = category + "IconMaterial",
           
        iconMaterial = getPOImaterial(iconMaterialName);
         
        if(!iconMaterial) { 
            switch(category) {
                case 'cafe':
                    iconMaterial = createPOIMaterial(iconMaterialName, "../../assets/POI/cafeNoAlpha.png", [1.0, 0.55, 0.55]);
                    break;
                case 'restaurant':
                    iconMaterial = createPOIMaterial(iconMaterialName, "../../assets/POI/restaurantNoAlpha.png", [0.55, 0.55, 1.0]);
                    break;
                case 'pub':
                    iconMaterial = createPOIMaterial(iconMaterialName, "../../assets/POI/pubNoAlpha.png", [1.0, 1.0, 0.55]);
                    break;
                default:
                    iconMaterial = createPOIMaterial(iconMaterialName, "../../assets/POI/crossNoAlpha.png");
            }
        }
        createPOIPointer(POIname, iconMaterialName, name, distance);
        return getPOIPointer(POIname);
    }

    function addEventListeners(element) {
        element.pointer.addEventListener("click", function() {showDetails(element);}, false);
    }
       
    function showDetails(pointer) {
        title.innerHTML = pointer.title;
        desc.style.visibility = "hidden";
        img.style.visibility = "hidden";
        
        if(pointer.thumbNail) {
            img.src = pointer.thumbNail;
            img.onload = function() {img.style.visibility = "visible";} //img.style.visibility = "visible";
        }
        
        if(pointer.description) {
            desc.innerHTML = pointer.description;
            desc.style.visibility = "visible";
        }
    };
    
    function openPOIFromCoordinates(x, y) {
        var elem = xml3dElem[0].getElementByPoint(x, y);
        
        if(elem)
            elem.click();
    }
}( window['wex'] = window['wex'] || {} ));
