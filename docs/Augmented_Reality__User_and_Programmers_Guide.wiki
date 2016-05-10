{{TOCright}}
= Release Information =
This document corresponds the release R4.4

== Previous Releases ==

[http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Augmented_Reality_-_User_and_Programmers_Guide_R3.3 R3.3] Uses ALVAR library.

= Introduction =
This document introduces how to use the augmented reality JavaScript API. It gives a description of the API functionality and how it is used to implement augmented reality web applications.

=== Background and Detail ===
This User and Programmers Guide relates to the Augmented Reality GE which is part of the [[Advanced_Middleware_and_Web_UI_Architecture | Advanced Middleware and Web User Interfaces chapter]]. Please find more information about this Generic Enabler in the related [[FIWARE.OpenSpecification.MiWi.AugmentedReality  | Open Specification]] and [[FIWARE.ArchitectureDescription.MiWi.AugmentedReality | Architecture Description]].

= User guide =

There is no general user interface, because the content and functionality of an AR application varies by implementation, and so does the user interface. User can access AR applications using a web browser, that supports the required features.

Here is some example UIs from the demos.
<gallery mode=packed widths=200px>
File:POI_AR.png‎ | AR_POI
File:House.jpg‎ | house
File:House2.jpg‎ | house
</gallery>

= Programmers guide =
This is a guide how to implement Augmented Reality applications using the provided javaScript APIs: Sensor, AR, Scene and Communication, see [[Augmented Reality Open API Specification]].

The API architecture is modular and each API is independent. Therefore, one can use only the APIs needed in a specific application. For example vision based marker tracking application would require AR and Scene APIs, and a location based application, that fetches information from POI Data Provider would require Sensor, Scene, and Communication APIs. Example applications can be found at [https://github.com/Chiru/FIWARE-AugmentedReality/tree/master/demos demos]. The APIs are developed and tested on Firefox Nightly, both on mobile devices, and desktop computers. Hence it's '''highly recommended''' to use '''Mozilla Firefox 25.0a1 or higher'''. The Sensor API may fail to get requested sensor values, usually on desktop and most of the laptop computers as they do not comprise of the necessary sensors, although the browser might support the events.

In order to use an API, it's set up in the following way:

 AR.start();
 //Create only the APIs needed in your application.
 var sensorManager = AR.setupSensors();
 var communication = AR.setupConnection();
 var ARManager = AR.setupARManager();
 var sceneManager = AR.setupSceneManager();

If one would use the marker detection AR API, make sure to include the following piece of code inside the xml3d tag into the HTML document.

  <data id="MarkerDetector" 
      compute="marker5x5Transforms, customMarkerTransforms, 
      marker5x5Visibilities, customMarkerVisibilities, perspective 
      = detect(arvideo, marker5x5, customMarkers, customMarkerConfidence, flip)">
    <bool name = "flip">false</bool>
    <float name = "customMarkerConfidence">0.5</float>
    <int id = "customMarkers" name = "customMarkers">0 1</int>
    <int id = "marker5x5" name = "marker5x5">1</int>
    <texture name="arvideo">
      <video autoplay="false"></video>
    </texture>
  </data>

Marker5x5, customMarkers parameters are used to initialize the IDs that JSARToolKit tracks from the start, they also defines the maximum size of the marker set.   

All input parameters for the detect Xflow operator are optional meaning that the parameters’ XHTML elements must exist but the element values can be empty.
  arvideo:                The type of this parameter is XML3D texture and in 
                          this case should contain video stream from devices 
                          local camera.

  Marker5x5:              The type of this parameter is XML3D int.

  customMarkers:          The type of this parameter is XML3D int and it must 
                          contain zero or more custom image marker IDs in a 
                          whitespace-separated list. The only limitation for the 
                          custom markers is that they need to be square and 
                          contain a black border. Testing the suitable border 
                          width and image marker content is up to the 
                          application developer, since these properties depend 
                          on the nature of the application and the usage 
                          environment. Custom markers can be prepared using 
                          a suitable tool.                          

  customMarkerConfidence: The type of this parameter is XML3D int and it must 
                          contain zero or more whitespace-separated values of 
                          allowed errors to be used in custom marker detection. 
                          Each value is related to a value with the same 
                          position in the customMarkers list. For example, the 
                          second value in the customMarkerConfidence is the 
                          error value for the second marker ID in the 
                          customMarkers. Thus, the marker IDs, to which the 
                          application developer wants to define a custom error 
                          value, should be put in the beginning of the 
                          customMarkers list. The error values are relative to 
                          the used image marker content complexity so the 
                          application developer should try out which error 
                          values suit best for different markers.

  flip:                   The type of this parameter is XML3D bool and its value 
                          can be either true or false, the default value being 
                          false. When the value is true, the resulting transform 
                          matrices from marker detection are flipped so that 
                          they respond to flipped camera feed.

A tool for preparing customMarkers: http://flash.tarotaro.org/blog/2008/12/14/artoolkit-marker-generator-online-released/

Example of different types of allowed markers:
<gallery perrow="5">
File:Marker5x5_1.png|Marker5x5
File:Bottle.png|CustomMarker
File:AndroidLogo128x128.png‎|CustomMarker
File:TrafficSign128x128.png|CustomMarker
</gallery>

==Sensor API==
Sensor API is used for creating sensor listeners. The Sensor API is based on the following W3C specifications [http://dev.w3.org/geo/api/spec-source.html Geolocation], [http://dev.w3.org/geo/api/spec-source-orientation.html DeviceOrientation], [http://www.w3.org/TR/ambient-light/ DeviceLight], [https://dvcs.w3.org/hg/dap/raw-file/default/proximity/Overview.html DeviceProximity].

The supported sensor types:
 '''SensorType'''
   orientation
   motion
   light
   proximity

*getAvailableSensors()
:Returns an array of available sensor types.

*getSensorListeners()
:Returns a dictionary of currently active sensor listeners.

*listenSensor(sensorType)
:Returns sensor listener for the given sensor type.

:'''''For example: listen device orientation and use it to rotate the virtual camera.'''''
  orientationListener = sensorManager.listenSensor('orientation');
  orientationListener.addAction(sceneManager.setCameraOrientation);

*hasGPS()
:Returns true if the device has a GPS sensor.

*getCurrentPosition(successCallback, errorCallback, options)
:Attaches the given callback functions to "one-shot" position request. Uses the HTML5 Geolocation API getCurrentPosition() method to get the device's position.
:'''''For example: Get POIs nearby. The getPois function is defined at the example for queryData function in Communication API'''''
 sensorManager.getCurrentPosition(getPOIs);

*watchPosition(successCallback, errorCallback, options)
:Attaches the given success callback function to updated position as the device moves. Uses the HTML5 Geolocation API getCurrentPosition() method to get the device's position updates.

==AR API==
AR API is used for registering and tracking markers.

*setMarkerCallback(callback)
:Sets a callback function for detected markers, the function has six input parameters callBackFunction(Marker5x5Transforms, customMarkerTransforms, Marker5x5Visibilities, customMarkerVisibilities).

==Scene API==
Scene API is used for manipulating the elements in a xml3d scene. The actual xml3d scene can be defined in the web page using tags such as, mesh, group, transform, view, shader, etc. More information about how to use the xml3d can be found here: [[XML3D Open API Specification]]

*setPositionFromGeoLocation(curLoc, elemLoc, xml3dElement, minDistance, maxDistance)
:Positions the given xml3dElement(virtual object) into the virtual scene by using the given parameters: curLoc is the current gps location of the device, elemLoc is the gps location of the xml3dElement, and the calculated distance is clamped between minDistance and maxDistance.

*setCameraOrientation(deviceOrientation)
:Replaces the existing orientation of the virtual camera with the given device orientation.

*translateCameraFromGps(curLoc, gpsPoint, maxStep)
:Translates the camera from current gps location to gpsPoint. The translation is discarded if the distance between the current and new location exceeds the maxStep.

*translateCameraFromMotion(deviceMotion)
:Translates the camera according to the acceleration from deviceMotion event.

*setCameraMotionTranslationStepSize(stepSize)
:The given step size value defines the resolution of the virtual camera movement. 
:The default value is '''1.0'''.

*setCameraDegreesOfFreedom(heave, sway, surge, yaw, pitch, roll)
:The given Boolean parameters define the freedom of degrees that the virtual camera currently has. 
::heave: allows virtual camera to move up and down. The default value is '''false'''.
::sway: allows virtual camera to move left and right. The default value is '''false'''
::surge: allows virtual camera to move forward and backward. The default value is '''true'''.
::yaw: allows virtual camera to rotate around y-axis. The default value is '''true'''.
::pitch: allows virtual camera to rotate around x-axis. The default value is '''true'''.
::roll: allows virtual camera to rotate around z-axis. The default value is '''false'''.

*setTransformFromMarker(markerTransform, xml3dElement, rotateX)
:Sets the given marker transform to the given xml3dElement. if rotateX is true the given xml3dElement is rotated 90 degrees.

*setCameraVerticalPlane(degrees)
:Sets the camera vertical plane into the given input degrees.   

*addObjectToBillboardSet(xml3dElement)
:Adds the given xml3dElement into a billboard set. Objects that belong to billboard set, are always facing towards the virtual camera. 

*getActiveCamera()
:Returns the xml3d active view element.

*getDistance(gpsPoint1, gpsPoint2)
:Returns the distance(meters) and bearing(radians) between the given gps coordinates.

==Communication API==
Communication API is used for handling the basic communication with remote services(Other GEs). 
*addRemoteService(serviceName, sourceURL)
:Adds a new remote service with the given service name and url. Remote service, such as POI Data Provider, must provide a RESTful API for communication.
:'''''For example: Add a POI Data Provider.'''''
 communication.addRemoteService("POI_Data_Provider", "http://someUrl");

*queryData(serviceName, restOptions, successCallback, errorCallback)
:Builds the REST query based on the given REST options and sends XMLHttpRequest to the given remote service. If the query is successful, the success callback function will handle the remote service's response message.
:'''''For example: Query data from the POI Data Provider, added earlier.'''''
 function getPOIs(gpsCoordinates) 
     var restOptions = {
         'function' : "radial_search",
         'lat' : gpsCoordinates.latitude,
         'lon' : gpsCoordinates.longitude,
         'category' : "cafe",
         'radius' : 1500 
     }
     communication.queryData("POI_Data_Provider", restOptions, handlePoi, null);
 }

*sendData(serviceName, message, succesCallback, errorCallback)
:Sends the given message to the given remote service.

*listenWebsocket(url)
:Opens a websocket and connects it to given url.
