# NodeOBS-ZoomOSC-AutoCrop
## Uses [Node.js](https://nodejs.org/) to automatically crop Zoom meeting participants into seperate 'Scenes' in [OBS](https://obsproject.com/) via ZoomOSC

### This is an add-on to the [Node-OBSosc](https://github.com/jshea2/Node-OBSosc) repository. Please refer to this for OSC to OBS commands documentation


### Requires:

### [OBS](https://obsproject.com/), [obs-websocket](https://github.com/Palakis/obs-websocket/releases), [Node.js](https://nodejs.org/), [obs-websocket-js](https://github.com/haganbmj/obs-websocket-js), & [node-osc](https://github.com/MylesBorins/node-osc), [ZoomOSC](https://www.liminalet.com/zoomosc-downloads) (if you are on Mac, join the [Slack Channel](https://app.slack.com/client/T018R5246R4/C018WFQDA4D?force_cold_boot=1) to download the beta).


## Installation and Setup:

- Download and Install [OBS](https://obsproject.com/)
- Download and Install [obs-websocket](https://github.com/Palakis/obs-websocket/releases) plugin
- Download and Install [Node.js](https://nodejs.org/)
- Clone or Download this repository
- Open it preferred source code editor (ex. [Visual Studio Code](https://code.visualstudio.com/download) or Terminal/Command Prompt)
  - If you use Visual Studio Code...
  - Go to "View > Command Palette..."
  -  Type "Git: Clone" [Enter]
  -  Paste the Github Clone HTTPS URL. This is the same as the URL just with ".git" added to the end (https://github.com/jshea2/Node-OBSosc.git)
- Open code editor's Terminal
- Install obs-websocket-js & node-osc: `npm install` (Prepend `sudo` if on Mac)(Installs dependencies from 'package.json')
  
  
  
  or install seperately
  - `npm install obs-websocket-js`
  - `npm install node-osc`
  
  

  (Prepend `sudo` if on Mac)
 
 
 - In file 'Node-OBSosc.js' change config info.
 
  
  Configure this to match your OBS Websocket plugin:

``` javascript
//OBS Config
const obsIp = "127.0.0.1"
const obsPort = 4444;
const obsPassword = "secret"
```


Configure your OSC application to send to this IP and Port (Node recieves OSC Messages on this IP and Port and Converts to OBS Websocket):
``` javascript
//OSC Server (IN) Config
const oscServerIp = "127.0.0.1";
const oscPortIn = 3333;
```


Configure your OSC application to listen on this IP and Port (OBS Websocket sends to Node, then sends OSC Messages to this IP and Port):
```javascript
//OSC Client (OUT) Config
const oscClientIp = "127.0.0.1";
const oscPortOut = 53000;
```

Configure ZoomOSC application to send to this IP and Port (Node recieves OSC Messages on this IP and Port and Converts to OBS Websocket):
``` javascript
//ZoomOSC Server (IN) Config
const zoomOSCServerIp = "127.0.0.1";
const zoomOSCPortIn = 1234;
```


Configure ZoomOSC application to listen on this IP and Port (OSC sends to Node, then sends OSC Messages to this IP and Port on ZoomOSC):
```javascript
//ZoomOSC Client (OUT) Config
const zoomOSCClientIp = "127.0.0.1";
const zoomOSCPortOut = 8000;
```

- Save file, then Run "Node-OBSosc.js" in Terminal: 
    
    `node NodeOBS-ZoomOSC.js` 


  or  

  `npm start`



This was inspired by [Other Lonestar](https://www.youtube.com/watch?v=WUJUGsxdMEQ)'s Node-Red version.