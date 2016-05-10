{{TOCright}}
= Release Information =
This document corresponds the release R4.4

== Previous Releases ==

[http://forge.fiware.org/plugins/mediawiki/wiki/fiware/index.php/Augmented_Reality_Open_API_Specification_R2 R2] (Uses [http://virtual.vtt.fi/virtual/proj2/multimedia/alvar/index.html ALVAR] library)

=JavaScript Library=

The augmented reality GE will provide a JavaScript library, which implements the components specified in the Generic Architecture part. The JavaScript library includes a programming API for each component and a framework for creating the needed components. 

This is a description of the JavaScript programming APIs.

==Framework==
*start()
:Starts the framework, and gets the video feed.  

*createSensorManager()
:Creates Sensor API object, which implements the Location-based tracking and registration component.

*createARManager()
:Creates AR API, which implements the Vision-based Registration and Tracking component.

*createSceneManager()
:Creates the Scene API, which implements the 3D Scene Management component.

*createConnection()
:Creates the Connection API, which implements the Web Service Interface component.

==Sensor API==
Sensor API is used for creating sensor listeners. The Sensor API is based on the following W3C specifications [http://dev.w3.org/geo/api/spec-source.html Geolocation], [http://dev.w3.org/geo/api/spec-source-orientation.html DeviceOrientation], [http://www.w3.org/TR/ambient-light/ DeviceLight], [https://dvcs.w3.org/hg/dap/raw-file/default/proximity/Overview.html DeviceProximity].

The supported sensor types:
 SensorType
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

*hasGPS()
:Returns true if the device has a GPS sensor.

*getCurrentPosition(successCallback, errorCallback, options)
:Attaches the given callback functions to "one-shot" position request. Uses the HTML5 Geolocation API getCurrentPosition() method to get the device's position.

*watchPosition(successCallback, errorCallback, options)
:Attaches the given success callback function to updated position as the device moves. Uses the HTML5 Geolocation API getCurrentPosition() method to get the device's position updates.

==AR API==
AR API is used for registering and tracking for two kind of markers: 5x5 fiducal markers and custom markers.

To use the Xflow interface of JSARToolKit JavaScript, the following code listing must be added inside the xml3d tag into HTML document.

  <data id="MarkerDetector" 
      compute="Marker5x5Transforms, customMarkerTransforms, 
      Marker5x5Visibilities, customMarkerVisibilities, perspective 
      = detect(arvideo, Marker5x5, customMarkers, customMarkerConfidence, flip)">
          <bool name="flip">false</bool>
          <int name="customMarkerConfidence"></int>
          <int name="customMarkers"></int>
          <int name="Marker5x5"></int>
          <texture name="arvideo">
              <video autoplay="false"></video>
          </texture>
  </data> 

All input parameters for the detect Xflow operator are optional meaning that the parameters’ XHTML elements must exist but the element values can be empty.
{| align="center" border="1" cellpadding="2" style="textalign: left; border-collapse: collapse; border-width: 1px; border-style: solid;"
|arvideo
|The type of this parameter is XML3D texture and in this case should contain video stream from devices local camera.
|-
|Marker5x5
|The type of this parameter is XML3D int and it must contain zero or more IDs of 5x5Markers in a whitespace-separated list. 
|-
|customMarkers
|The type of this parameter is XML3D int and it must contain zero or more custom image marker IDs in a whitespace-separated list. 
|-
|customMarkerConfidence
| The type of this parameter is XML3D int and it must contain zero or more whitespace-separated values of allowed errors to be used in image marker detection. Each value is related to a value with the same position in the customMarkers list. For example, the second value in the customMarkerConfidence is the error value for the second marker ID in the customMarkers. Thus, the marker IDs, to which the application developer wants to define a custom error value, should be put in the beginning of the customMarkers list. The error values are relative to the used image marker content complexity so the application developer should try out which error values suit best for different markers. 
|-
|flip
|The type of this parameter is XML3D bool and its value can be either true or false, the default value being false. When the value is true, the resulting transform matrices from marker detection are flipped so that they respond to flipped camera feed.
|-
|}

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

*setCameraDegreesOfFreedom(heave, sway, surge, yaw, pitch, roll)
:The given Boolean parameters define the freedom of degrees that the virtual camera currently has. 
::heave: allows virtual camera to move up and down.
::sway: allows virtual camera to move left and right.
::surge: allows virtual camera to move forward and backward.
::yaw: allows virtual camera to rotate around y-axis.
::pitch: allows virtual camera to rotate around x-axis.
::roll: allows virtual camera to rotate around z-axis. 

*setTransformFromMarker(markerTransform, xml3dElement, rotateX)
:Sets the given marker transform to the given xml3dElement. if rotateX is true the given xml3dElement is rotated 90 degrees.

*setCameraVerticalPlane(degrees)
:Sets the camera vertical plane into the given input degrees.   

*addObjectToBillboardSet(xml3dElement)
:Adds the given xml3dElement into a billboard set. Objects that belong to billboard set, are always facing towards the virtual camera. 

*getActiveCamera()
:Returns the xml3d active view element.

*getDistance(gpsPoint1, gpsPoint2)
:Returns the distance (meters) and bearing(radians) between the given gps coordinates.

==Communication API==
Communication API is used for handling the basic communication with 3rd party services (other GEs). 
*addRemoteService(serviceName, sourceURL)
:Adds a new remote service with the given service name and url. Remote service, such as POI Data Provider, must provide a RESTful API for communication. 

*queryData(serviceName, restOptions, successCallback, errorCallback)
:Builds the REST query based on the given REST options and sends XMLHttpRequest to the given remote service. If the query is successful, the success callback function will handle the remote service's response message.

*sendData(serviceName, message, succesCallback, errorCallback)
:Sends the given message to the given remote service.

*listenWebsocket(url)
:Opens a websocket and connects it to given url.
