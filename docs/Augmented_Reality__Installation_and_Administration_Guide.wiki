{{TOCright}}
= Introduction =

The purpose of this documentation is to provide information how to install and administer the Augmented Reality Generic Enabler.

= System Requirements  =

== Hardware Requirements ==
The Augmented Reality GE should work on any modern Intel X86 compatible computer and high-end Android based mobile devices.

== Operating System Support ==
The Augmented Reality GE has been tested against the following Operating Systems:

 Windows
   Windows 8 (Desktop)
 Android
   version 4.2.2
 Ubuntu
   version 12.04

== Software Requirements ==
 Browser
    Mozilla Firefox 25.0a1 or higher

= Software Installation and Configuration =
The Augmented Reality GE is a collections of JavaScript source files which have to be included in a web application.

Latest version can be cloned from the repository at https://github.com/Chiru/FIWARE-AugmentedReality.<br> 
The repository encloses a demo directory, which contains example applications that show how the needed source files are included. More Detailed information how to use the GE can be found in the [[Augmented Reality - User and Programmers Guide]].

= Sanity check procedures =
==End to End testing==
One can test Augmented Reality GE by opening any of the demo or/and test files from the cloned repository, with Mozilla Firefox web browser. Just navigate to the directory where the repository is cloned and start a web server (e.g ''python SimpleHTTPServer'', or ''node.js http-server''). After that, open Firefox browser and navigate to the address where the server is running (e.g. localhost:8000 if it is running on the same device) and click either the Demos or Tests folder. It is recommended to try demos first.    

'''Demos'''<br>
The demo folder includes four demos in subfolders ''AR_POI'', ''house'', ''markerDetection'' and ''plane''. Each subfolder has an index.xhtml file, which starts the demo.

'''Tests'''<br>
The tests folder includes two test suit files, ''Location_based_regAndTrack_unitTest.html'' and ''Vision_based_regAndTrack_unitTest.html''.

==List of Running Processes==
N/A
==Network interfaces Up & Open ==
N/A
==Databases==
N/A

=Diagnosis Procedures=

==Resource availability==
N/A

==Remote Service Access==
N/A

==Resource consumption==
The amount of resources used by the Augmented Reality GE vary a lot depending on the AR application, RAM in respect of the 3D content in a virtual scene and CPU in respect of marker tracking and rendering.

Example of resource consumption: Amount of resources used in tracking markers at 25 fps speed using the following setup.
HP EliteBook 2760p,
CPU: Intel i5-2540M, 4 GB RAM,
GPU: Intel HD Graphics 3000, 1,6 GB RAM,
Operating system: windows 8,
Browser: Mozilla Firefox 28.0a1

{| style="border-collapse: collapse; border-width: 1px; border-style: solid; border-color: #000"
|-
! style="border-style: solid; border-width: 1px"| Device
! style="border-style: solid; border-width: 1px"| CPU usage
! style="border-style: solid; border-width: 1px"| Ram usage
|-
| style="border-style: solid; border-width: 1px"| HP EliteBook 2760p
| style="border-style: solid; border-width: 1px"| 38%
| style="border-style: solid; border-width: 1px"| 200 MB
|}

==I/O flows==
N/A
