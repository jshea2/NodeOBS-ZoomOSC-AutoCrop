//NodeOBS-ZoomOSC
//by Joe Shea

//Get Modules and Setup
const OBSWebSocket = require('obs-websocket-js');
const { Client, Server } = require('node-osc');
const obs = new OBSWebSocket();

//INPUT YOUR STUFF HERE:
//OBS Config
const obsIp = "127.0.0.1"
const obsPort = 4444;
const obsPassword = "secret"
//OSC Server (IN) Config
const oscServerIp = "127.0.0.1";
const oscPortIn = 3333;
//OSC Client (OUT) Config
const oscClientIp = "127.0.0.1";
const oscPortOut = 53000;
const oscOutPrefix = "/cue/"
const oscOutSuffix = "/start"
//ZoomOSC Server (IN) Config
const zoomOSCServerIp = "127.0.0.1";
const zoomOSCPortIn = 1234;
//ZoomOSC Client (OUT) Config
const zoomOSCClientIp = "127.0.0.1";
const zoomOSCPortOut = 8000;
//QLab OSC Response Server (IN) Config
const qlabOscServerIp = "127.0.0.1";
const qlabOscPortIn = 53001;
//ZoomOSC Delay
let millisec = 614



//Connect to OBS
obs.connect({
        address: obsIp + ':'+ obsPort,
        password: obsPassword
    })
    .then(() => {
        console.log(`\nConnected & authenticated to OBS Websockets...\nIP: ${obsIp}\nPort: ` + obsPort);

        return obs.send('GetSceneList');                                    //Send a Get Scene List Promise
    })
    .then(data => {
        console.log(`\n${data.scenes.length} Available Scenes.` + "\n");    //Log Total Scenes
        console.log(data.scenes.forEach((thing, index) => {
            console.log((index + 1) + " - " + thing.name);                  //Log List of Available Scenes with OSC Index
        }));
        clientZoom.send("/zoom/load", 1)
        clientZoom.send("/zoom/autoUpdate", 1)
        console.log('-- Use "/scene [index]" For OSC Control --\n\n');      //Log OSC Scene Syntax
    })
    .catch(err => {
        console.log(err);                                                   //Log Catch Errors
        console.log("-!- Make Sure OBS is Running and Websocket IP/Port/Password are Correct -!-");
    });

//Listen and Log When New Scene is Activated
obs.on('SwitchScenes', data => {
    console.log(`New Active Scene: ${data.sceneName}`);
});

let currentSceneItem
//Save Scene Item as Variable
obs.on("SceneItemSelected", data => {
    currentSceneItem = data['item-name']
    console.log("Selected Scene Item: " + currentSceneItem)
    
})


// Handler to Avoid Uncaught Exceptions.
obs.on('error', err => {
    console.error('socket error:', err);
});

//Connect to OSC
const client = new Client(oscClientIp, oscPortOut);
const clientZoom = new Client(zoomOSCClientIp, zoomOSCPortOut);
var server = new Server(oscPortIn, oscServerIp);
var serverZoom = new Server(zoomOSCPortIn, zoomOSCServerIp);
var serverQlab = new Server(qlabOscPortIn, qlabOscServerIp)

//ZoomOSC Server (IN)
server.on('listening', () => {
  console.log("\n\n" + 'OSC Server is listening on...\n IP: ' + oscServerIp + '\n Port: ' + oscPortIn);
  console.log('\nOSC Server is sending back on...\n IP: ' + oscClientIp + '\n Port: ' + oscPortOut);
  console.log("\n\n" + 'ZoomOSC Server is listening on...\n IP: ' + zoomOSCServerIp + '\n Port: ' + zoomOSCPortIn);
})

// //Qlab Response to ZoomOSC "SM" Playhead Cue via Chat
// serverQlab.on('message', (msg) => {
//      //console.log(msg)
//      let parse
//      let currentCue
     
//     if(msg[0].includes('playbackPosition')){
//         client.send('/cue/playhead/number')
//         client.send('/runningCues/shallow')
//     }

//     if(msg[0].includes('/runningCues/shallow')){
//         let runningCue = JSON.parse(msg[1])

//         if (runningCue.data[0] !== undefined){
//             clientZoom.send('/zoom/chat', 'SM', `** CUE "${runningCue.data[2].number}" Triggered! **`)
//             clientZoom.send('/zoom/chat', 'SM', `-                                       -`)
//         console.log(`Qlab Cue "${runningCue.data[2].number}" was Triggered`)
//         //console.log(runningCue.data)
//         }
        
//     }

//     if(msg[0].includes('/number') && msg[0].includes('/reply')){
//         parse = JSON.parse(msg[1])
//         currentCue = parse.data
//         setTimeout(() => {
//             clientZoom.send('/zoom/chat', 'SM', `-- standing by cue: "${parse.data}" --`)
//         }, 100); 
//         console.log(`'${parse.data}' - Qlab Cue Stading By`)
//         //console.log(currentCue)
//     }


// })

//OSC -> OBS
server.on('message', (msg) => {
    //Trigger Scene by Index Number
  if (msg[0] === "/scene" && typeof msg[1] === 'number'){ 
      console.log("number thing works")                                     //When OSC Recieves a /scene do...
      var oscMessage = msg[1] - 1;                                          //Convert Index Number to Start at 1
      var oscMessage = Math.floor(oscMessage);                              //Converts Any Float Argument to Lowest Integer
    return obs.send('GetSceneList').then(data => {                          //Request Scene List Array
        console.log(`OSC IN: ${msg[0]} ${oscMessage + 1} (${data.scenes[oscMessage].name})`)
        obs.send("SetCurrentScene", {
            'scene-name': data.scenes[oscMessage].name                      //Set to Scene from OSC
            })
        }).catch(() => {
            console.log("Error: Out Of '/scene' Range");                    //Catch Error
        });
    } 

    //Trigger Scene if Argument is a String and Contains a Space
    else if (msg[0] === "/scene" && msg.length > 2){                      //When OSC Recieves a /scene do...                                       
        var firstIndex = msg.shift();                                       //Removes First Index from 'msg' and Stores it to Another Variable
        oscMultiArg = msg.join(' ')                                         //Converts 'msg' to a String with spaces
      return obs.send('GetSceneList').then(data => {                        //Request Scene List Array
          console.log(`OSC IN: ${firstIndex} ${oscMultiArg}`)
          obs.send("SetCurrentScene", {
              'scene-name': oscMultiArg                                     //Set to Scene from OSC
              }).catch(() => {
                console.log(`Error: There is no Scene "${oscMultiArg}" in OBS. Double check case sensitivity.`);
              })
          }).catch((err) => {
              console.log(err)                                                            //Catch Error
          });
      } 
      
      //Trigger Scene if Argument is a String
      else if (msg[0] === "/scene" && typeof msg[1] === 'string'){          //When OSC Recieves a /scene do...
        var oscMessage = msg[1]; 
      return obs.send('GetSceneList').then(data => {                         //Request Scene List Array
          console.log(`OSC IN: ${msg[0]} ${oscMessage}`)
          obs.send("SetCurrentScene", {
              'scene-name': oscMessage                                       //Set to Scene from OSC
              }).catch(() => {
                console.log(`Error: There is no Scene "${msg[1]}" in OBS. Double check case sensitivity.`);
              })
          }).catch((err) => {
              console.log(err)                                                            //Catch Error
          });
      } 

      //Trigger Scene if Scene Name is in the OSC String
      else if (msg[0].includes('/scene') && msg.length === 1){
        var msgArray = msg[0].split("/")
        msgArray.shift()
        msgArray.shift()
        obs.send("SetCurrentScene", {
            'scene-name': msgArray[0].split("_").join(" ").toString(),                                          //Set to Scene from OSC
            }).catch(() => {
              console.log(`Error: There is no Scene "${msgArray}" in OBS. Double check case sensitivity.`);
            }).catch((err) => {
            console.log(err)                                                //Catch Error
        });

      }
      
      //Triggers to "GO" to the Next Scene
      else if (msg[0] === "/go"){                                          //When OSC Recieves a /go do...
            
        return obs.send('GetSceneList').then(data => {                      //Request Scene List Array
            
            var cleanArray = []
            var rawSceneList = data                                         //Assign Get Scene List 'data' to variable 
            data.scenes.forEach(element => {cleanArray.push(element.name)}); //Converting Scene List To a Cleaner(Less Nested) Array (Getting the Desired Nested Values) 
            return obs.send("GetCurrentScene").then(data => {               //Request Current Scene Name
                var currentSceneIndex = cleanArray.indexOf(data.name)       //Get the Index of the Current Scene Referenced from the Clean Array
                if (currentSceneIndex + 1 >= rawSceneList.scenes.length){   //When the Current Scene is More than the Total Scenes...
                obs.send("SetCurrentScene", {
                        'scene-name': rawSceneList.scenes[0].name           //Set the Scene to First Scene
                })
             } else {
                obs.send("SetCurrentScene", {
                    'scene-name': rawSceneList.scenes[currentSceneIndex + 1].name  //Set Scene to Next Scene (Referenced from the Current Scene and Array)
                    })   
                }
        }).catch(() => {
            console.log("Error: Invalid OSC Message");                              //Catch Error
            });
        })
    } 
    
    //Triggers Previous Scene to go "BACK"
    else if (msg[0] === "/back"){                                                 //Same Concept as Above Except Going to the Previous Scene

        return obs.send('GetSceneList').then(data => {
            
            var cleanArray = []
            var rawSceneList = data
            data.scenes.forEach(element => {cleanArray.push(element.name)});
            return obs.send("GetCurrentScene").then(data => {
                var currentSceneIndex = cleanArray.indexOf(data.name)
                if (currentSceneIndex - 1 <= -1){
                obs.send("SetCurrentScene", {
                        'scene-name': rawSceneList.scenes[rawSceneList.scenes.length - 1].name 
                })
             } else {
                obs.send("SetCurrentScene", {
                    'scene-name': rawSceneList.scenes[currentSceneIndex - 1].name
                    })   
                }
        }).catch(() => {
            console.log("Error: Invalid OSC Message");
            });
        })


    } 
    //Triggers Start Recording
    else if (msg[0] === "/startRecording"){
        obs.send("StartRecording").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Stop Recording
    else if (msg[0] === "/stopRecording"){
        obs.send("StopRecording").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Toggle Recording
    else if (msg[0] === "/toggleRecording"){
        obs.send("StartStopRecording").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Start Streaming
    else if (msg[0] === "/startStreaming"){
        obs.send("StartStreaming").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Stop Streaming
    else if (msg[0] === "/stopStreaming"){
        obs.send("StopStreaming").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Toggle Streaming
    else if (msg[0] === "/toggleStreaming"){
        obs.send("StartStopStreaming").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Pause Recording
    else if (msg[0] === "/pauseRecording"){
        obs.send("PauseRecording").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Resume Recording
    else if (msg[0] === "/resumeRecording"){
        obs.send("ResumeRecording").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Enable Studio Mode
    else if (msg[0] === "/enableStudioMode"){
        obs.send("EnableStudioMode").catch((err) => {
            console.log(`ERROR: ${err.error}`)
        })
    
    } 
    //Triggers Disable Studio Mode
    else if (msg[0] === "/disableStudioMode"){
        obs.send("DisableStudioMode").catch((err) => {
            console.log(`ERROR: ${err.error}`);
        })
    
    } 
    //Triggers Toggle Studio Mode
    else if (msg[0] === "/toggleStudioMode"){
        obs.send("ToggleStudioMode").catch((err) => {
            console.log(err)
        })
    
    } 
    //Triggers Source Visibility On/Off
    else if (msg[0].includes('visible')){
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        var visible;
        if(msg[1] === 0 || msg[1] === 'off'){
            visible = false
        } else if(msg[1] === 1 || msg[1] === 'on'){
            visible = true
        }
        obs.send("SetSceneItemProperties", {
            'scene-name': msgArray[0].split('_').join(' ').toString(),
            'item': msgArray[1].split('_').join(' ').toString(),
            'visible': visible,
        }).catch(() => {
            console.log("Error: Invalid Syntax. Make Sure There Are NO SPACES in Scene Name and Source Name. /[Scene Name]/[Source Name]/visible 0 or 1, example: /Wide/VOX/visible 1")
        })
    } 

    //Triggers Filter Visibility On/Off
    else if (msg[0].includes('filterVisibility')){
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        var visiblef;
        if(msg[1] === 0 || msg[1] === 'off'){
            visiblef = false
        } else if(msg[1] === 1 || msg[1] === 'on'){
            visiblef = true
        }
        obs.send("SetSourceFilterVisibility", {
            'sourceName': msgArray[0].split('_').join(' '),
            'filterName': msgArray[1].split('_').join(' '),
            'filterEnabled': visiblef
        }).catch(() => {
            console.log("Error: Invalid Syntax. Make Sure There Are NO SPACES in Source Name and Filter name. /[Scene Name]/[Source Name]/visible 0 or 1, example: /Wide/VOX/visible 1")
        })
    } 
    //Triggers the Source Opacity (via Filter > Color Correction)
    else if (msg[0].includes('opacity')){
        console.log(`OSC IN: ${msg[0]} ${msg[1]}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        obs.send("SetSourceFilterSettings", {
           'sourceName': msgArray[0].split('_').join(' '),
           'filterName': msgArray[1].split('_').join(' '),
           'filterSettings': {'opacity' : msg[1]*100}
        }).catch(() => {
            console.log("ERROR: Opacity Command Syntax is Incorrect. Refer to Node OBSosc Github for Reference")
        })  
    }

    //Set Transition Type and Duration
    else if (msg[0] === '/transition'){
        if (msg[1] === "Cut" || msg[1] === "Stinger") {
            console.log(`OSC IN: ${msg[0]} ${msg[1]}`)
            obs.send("SetCurrentTransition", {
                'transition-name': msg[1].toString()
            }).catch(() => {
                console.log("Whoops")
            })
        } else if(msg[1] === "Fade" || msg[1] === "Move" || msg[1] === "Luma_Wipe" || msg[1] === "Fade_to_Color" || msg[1] === "Slide" || msg[1] === "Swipe"){
            if (msg[2] === undefined){
                obs.send("GetTransitionDuration").then(data => {
                    var tranisionTime = data["transition-duration"]
                    console.log(`OSC IN: ${msg[0]} ${msg[1]}\nCurrent Duration: ${tranisionTime}`)
                })
            } else {
            console.log(`OSC IN: ${msg[0]} ${msg[1]} ${msg[2]}`)
            }
            var makeSpace = msg[1].split('_').join(' ');
        obs.send("SetCurrentTransition", {
            'transition-name': makeSpace.toString()
        })
        if(msg.length === 3){
        obs.send("SetTransitionDuration", {
            'duration': msg[2]
        })}
        } else {
            console.log("ERROR: Invalid Transition Name. It's Case Sensitive. Or if it contains SPACES use '_' instead")
        } 
        
    } 
    
    //Source Position Translate
    else if (msg[0].includes('position')){
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        var x = msg[1] + 960
        var y = msg[2] - (msg[2] * 2)
        obs.send("SetSceneItemProperties", {
            'scene-name': msgArray[0].toString().split('_').join(' '),
            'item': msgArray[1].toString().split('_').join(' '),
            'position': { 'x': x, 'y': y + 540}
        }).catch(() => {
            console.log("ERROR: Invalis Position Syntax")
        })
    }

    //Source Position Select Move
    else if (msg[0] === '/move'){
        return obs.send("GetCurrentScene").then(data => {
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        var x = Math.floor((msg[2]*2000))
        var y = Math.floor((msg[1]*2000) + 960)
        console.log(x + " " + y)
        obs.send("SetSceneItemProperties", {
            'scene-name': data.name,
            'item': currentSceneItem,
            'position': { 'x': x + 540, 'y': y, 'alignment': 0}
        }).catch(() => {
            console.log("ERROR: Invalis Position Syntax")
        })
    })
    }

        //Source Position Select MoveX
        else if (msg[0] === '/movex'){
            return obs.send("GetCurrentScene").then(data => {
            console.log(`OSC IN: ${msg}`)
            var msgArray = msg[0].split("/")
            msgArray.shift()
            var x = Math.floor((msg[1]*2000))
            var y = Math.floor((msg[1]*2000) + 960)
            console.log(x + " " + y)
            obs.send("SetSceneItemProperties", {
                'scene-name': data.name,
                'item': currentSceneItem,
                'position': { 'x': x + 540, 'alignment': 0}
            }).catch(() => {
                console.log("ERROR: Invalis Position Syntax")
            })
        })
        }

        //Source Position Select MoveY
        else if (msg[0] === '/movey'){
            return obs.send("GetCurrentScene").then(data => {
            console.log(`OSC IN: ${msg}`)
            var msgArray = msg[0].split("/")
            msgArray.shift()
            var x = Math.floor((msg[2]*2000))
            var y = Math.floor((msg[1]*2000) + 960)
            console.log(x + " " + y)
            obs.send("SetSceneItemProperties", {
                'scene-name': data.name,
                'item': currentSceneItem,
                'position': { 'y': y, 'alignment': 0}
            }).catch(() => {
                console.log("ERROR: Invalis Position Syntax")
            })
        })
        }

        
    //Source Align
    else if (msg[0] === '/align'){
        return obs.send("GetCurrentScene").then(data => {
        console.log(`OSC IN: ${msg}`)
        var x = 0 + 960
        var y = 0 + 540
        obs.send("SetSceneItemProperties", {
            'scene-name': data.name.toString(),
            'item': currentSceneItem,
            'position': {'x': x, 'y':y, 'alignment': msg[1]}
        }).catch(() => {
            console.log("Error: Select A Scene Item in OBS for Alignment")
        })
    })
    }

    //Set Transition Override
    else if(msg[0].includes('/transOverrideType')){
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        console.log("Messge array: " + msgArray)
        return obs.send("GetCurrentScene").then(data => {
        obs.send("SetSceneTransitionOverride", {
            'sceneName': data.name,
            'transitionName': msgArray[1].toString(),
        })
    })
    }

    //Set Transition Override
    else if(msg[0] === '/transOverrideDuration'){
        let currentSceneName
        console.log(`OSC IN: ${msg}`)
        return obs.send("GetCurrentScene").then(data => {
            currentSceneName = data.name
        return obs.send("GetSceneTransitionOverride", {
            'sceneName': currentSceneName
        }).then(data => {
            obs.send("SetSceneTransitionOverride", {
                'sceneName': currentSceneName,
                'transitionName': data.transitionName,
                'transitionDuration': Math.floor(msg[1])
            })
        })
        })
    }

    //Source Size
    else if (msg[0] === '/size'){
        return obs.send("GetCurrentScene").then(data => {
        console.log(`OSC IN: ${msg}`)
        obs.send("SetSceneItemProperties", {
            'scene-name': data.name.toString(),
            'item': currentSceneItem,
            'scale': {'x': msg[1], 'y': msg[1]}
        }).catch(() => {
            console.log("Error: Select A Scene Item in OBS for Size")
        })
    })
    }

    //Source Scale Translate
    else if (msg[0].includes('scale')){
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        var visible;
        obs.send("SetSceneItemProperties", {
            'scene-name': msgArray[0].split('_').join(' ').toString(),
            'item': msgArray[1].split('_').join(' ').toString(),
            'scale': { 'x': msg[1], 'y': msg[1]}
        }).catch(() => {
            console.log("Error: Invalid Scale Syntax. Make Sure There Are NO SPACES in Scene Name and Source Name. /[Scene Name]/[Source Name]/visible 0 or 1, example: /Wide/VOX/visible 1")
        })
    } 
    
    //Source Rotation Translate
    else if (msg[0].includes('rotate')){
        console.log(`OSC IN: ${msg}`)
        var msgArray = msg[0].split("/")
        msgArray.shift()
        var visible;
        obs.send("SetSceneItemProperties", {
            'scene-name': msgArray[0].split('_').join(' ').toString(),
            'item': msgArray[1].split('_').join(' ').toString(),
            'rotation': msg[1]
        }).catch(() => {
            console.log("Error: Invalid Rotation Syntax. Make Sure There Are NO SPACES in Scene Name and Source Name. /[Scene Name]/[Source Name]/visible 0 or 1, example: /Wide/VOX/visible 1")
        })
    } 
    
    //Add SceneItem (NOT YET AVAILABLE)
    else if (msg[0].includes('addScene')){
        return obs.send("GetCurrentScene").then(data => {
            console.log(data.name)
            obs.send("AddSceneItem", {
                "sceneName": data.name,
                "sourceName": msg[1].toString()
            })
        })
    } else if (msg[0] === "/lock"){
        obs.send("GetScene")
        obs.send("GetSceneItemProperties")
    } 

    else if(msg[0] === "/delay"){
        millisec  = Math.floor(msg[1])
        console.log("Delay is now: " + millisec + "ms")
    }

    else if(msg[0] === "/zv"){
        clientZoom.send("/zoom/video/on", msg[1])
    }

    else if(msg[0] === "/za"){
        clientZoom.send("/zoom/mic/unmute", msg[1])
    }

    else if (msg[0] === "/fuck"){
        client.send(`${oscOutPrefix}FUCK${oscOutSuffix}`, (err) => {  //Takes OBS Scene Name and Sends it Out as OSC String (Along with Prefix and Suffix)
                     if (err) console.error(err);
                   });
    }

    //Log Error
    else {
        console.log(msg)
        console.log("Error: Invalid OSC command. Please refer to Node OBSosc on Github for Command List")
    }
});

// //OBS -> OSC Client (OUT)
// obs.on('SwitchScenes', data => {
//     client.send(`${oscOutPrefix}${data.sceneName}${oscOutSuffix}`, (err) => {  //Takes OBS Scene Name and Sends it Out as OSC String (Along with Prefix and Suffix)
//         if (err) console.error(err);
//       });
//     })

//Send Update Requests Command, So Qlab Will Send OSC When Anything Happens in QLab 
client.send('/updates', 1)

//This is the same as above, but it does it every 59 seconds, because QLab times out after 1min apparently.
setInterval(() => {
    client.send('/updates', 1)
}, 59000);




//ZoomOSC Config:

//See Documentation For Which Letter Corresponds With Which Crop In OBS
// 1 person:
const a = 49
const a1 = 61
const b = 97
// 2 people:
const c = 281
const c1 = 268
const d = 964
const e = 13
// 3-4 people:
const f = 54
const f1 = 67
const g = 550
const g1 = 193
const h = 109
const i = 528
// 5-6 people:
const j = 180
const j1 = 537
const k = 1278
const l = 18
const m = 648
const n = 334
// 7 people:
const o = 56
const p = 710
const q = 1246
const r = 114
const s = 680
const t = 376
const z = 389
// 8-9 people:
const u = 68
const v = 698
const w = 397


//ZoomOSC Auto-Cropping
serverZoom.on('message', (msg) => {

    if(msg.includes("/zoomosc/gallery/count")){
        return null
    } else {
    console.log(`ZoomOSC OSC Message: ${msg}`)
    }
    if (msg.includes(0)){
        msg = msg.filter((i) => {
            return i !== 0
        })
        console.log(`New Gallery Order: ${msg}`)
    }
    
    if (msg.includes("/zoomosc/spotlight/on")){
        console.log("Spot User: " + msg[1])
              var boxSpot = msg[1]

              setTimeout(() => {
              obs.send("SetSceneItemProperties", {
                'scene-name': boxSpot.toString(),
                'item': `Display Capture ${msg[1]}`,
                'crop': { 'top': a, 'bottom': a, 'right': b, 'left': b },
            })
    }, 0)
}

if (msg.includes("/zoomosc/spotlight/off")){
    clientZoom.send("/zoom/load", 1)
    setTimeout(() => {
    clientZoom.send("/zoom/gallery", 1)
    }, 1320)
}

if (msg.includes("/zoomosc/sound/off")){
    if (msg.includes(-1)){
        
        clientZoom.send('/zoom/load', 1, () => {
            console.log("Sending '/zoom/load 1' to ZoomOSC")
        })
    }
}
    if (msg[0] === "/zoomosc/gallery/order" || msg[0] === "/zoomosc/vid/galorder") {
        switch (msg.length - 1){
           case 1:
               console.log("1 Zoom Boxes")
              var box1 = msg[1]

              setTimeout(() => {
              obs.send("SetSceneItemProperties", {
                'scene-name': box1.toString(),
                'item': `Display Capture ${msg[1]}`,
                'crop': { 'top': a, 'bottom': a1, 'right': b, 'left': b },
            }).catch((err) => {console.log(err)})
        }, millisec)
                break;
            
            case 2:
                console.log("2 Zoom Boxes")
                var box1 = msg[1]
                var box2 = msg[2]

                setTimeout(() => {
              obs.send("SetSceneItemProperties", {
                'scene-name': box1.toString(),
                'item': `Display Capture ${msg[1]}`,
                'crop': { 'top': c1, 'bottom': c, 'right': d, 'left': e },
            }).catch((err) => {console.log(err)})
            obs.send("SetSceneItemProperties", {
                'scene-name': box2.toString(),
                'item': `Display Capture ${msg[2]}`,
                'crop': { 'top': c1, 'bottom': c, 'right': e, 'left': d },
            }).catch((err) => {console.log(err)})
        }, millisec)
                break;

            case 3:
                console.log("3 Zoom Boxes")
                var box1 = msg[1]
                var box2 = msg[2]
                var box3 = msg[3]

                setTimeout(() => {
              obs.send("SetSceneItemProperties", {
                'scene-name': box1.toString(),
                'item': `Display Capture ${msg[1]}`,
                'crop': { 'top': f, 'bottom': g, 'right': d, 'left': h },
            }).catch((err) => {console.log(err)})
            obs.send("SetSceneItemProperties", {
                'scene-name': box2.toString(),
                'item': `Display Capture ${msg[2]}`,
                'crop': { 'top': f, 'bottom': g, 'right': h, 'left': d },
            }).catch((err) => {console.log(err)})
            obs.send("SetSceneItemProperties", {
                'scene-name': box3.toString(),
                'item': `Display Capture ${msg[3]}`,
                'crop': { 'top': j1, 'bottom': f1, 'right': j1, 'left': j1 },
            }).catch((err) => {console.log(err)})
        }, millisec)
                break;

            case 4:
                console.log("4 Zoom Boxes")
                var box1 = msg[1]
                var box2 = msg[2]
                var box3 = msg[3]
                var box4 = msg[4]
            setTimeout(() => {
              obs.send("SetSceneItemProperties", {
                'scene-name': box1.toString(),
                'item': `Display Capture ${msg[1]}`,
                'crop': { 'top': f, 'bottom': g, 'right': d, 'left': h },
            }).catch((err) => {console.log(err)})
            obs.send("SetSceneItemProperties", {
                'scene-name': box2.toString(),
                'item': `Display Capture ${msg[2]}`,
                'crop': { 'top': f, 'bottom': g, 'right': h, 'left': d },
            }).catch((err) => {console.log(err)})
            obs.send("SetSceneItemProperties", {
                'scene-name': box3.toString(),
                'item': `Display Capture ${msg[3]}`,
                'crop': { 'top': j1, 'bottom': f1, 'right': d, 'left': h },
            }).catch((err) => {console.log(err)})
            obs.send("SetSceneItemProperties", {
                'scene-name': box4.toString(),
                'item': `Display Capture ${msg[4]}`,
                'crop': { 'top': j1, 'bottom': f1, 'right': h, 'left': d },
            }).catch((err) => {console.log(err)})
        }, millisec)
                break;

            case 5:
                console.log("5 Zoom Boxes")
                    var box1 = msg[1]
                    var box2 = msg[2]
                    var box3 = msg[3]
                    var box4 = msg[4]
                    var box5 = msg[5]

                    setTimeout(() => {
                  obs.send("SetSceneItemProperties", {
                    'scene-name': box1.toString(),
                    'item': `Display Capture ${msg[1]}`,
                    'crop': { 'top': j, 'bottom': g, 'right': k, 'left': l },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box2.toString(),
                    'item': `Display Capture ${msg[2]}`,
                    'crop': { 'top': j, 'bottom': g, 'right': m, 'left': m },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box3.toString(),
                    'item': `Display Capture ${msg[3]}`,
                    'crop': { 'top': j, 'bottom': g, 'right': l, 'left': k },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box4.toString(),
                    'item': `Display Capture ${msg[4]}`,
                    'crop': { 'top': j1, 'bottom': g1, 'right': d, 'left': n },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box5.toString(),
                    'item': `Display Capture ${msg[5]}`,
                    'crop': { 'top': j1, 'bottom': g1, 'right': n, 'left': d },
                }).catch((err) => {console.log(err)})
            }, millisec)
                    break;

            case 6:
                console.log("6 Zoom Boxes")
                    var box1 = msg[1]
                    var box2 = msg[2]
                    var box3 = msg[3]
                    var box4 = msg[4]
                    var box5 = msg[5]
                    var box6 = msg[6]

                    setTimeout(() => {
                obs.send("SetSceneItemProperties", {
                    'scene-name': box1.toString(),
                    'item': `Display Capture ${msg[1]}`,
                    'crop': { 'top': j, 'bottom': g, 'right': k, 'left': l },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box2.toString(),
                    'item': `Display Capture ${msg[2]}`,
                    'crop': { 'top': j, 'bottom': g, 'right': m, 'left': m },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box3.toString(),
                    'item': `Display Capture ${msg[3]}`,
                    'crop': { 'top': j, 'bottom': g, 'right': l, 'left': k },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box4.toString(),
                    'item': `Display Capture ${msg[4]}`,
                    'crop': { 'top': j1, 'bottom': g1, 'right': k, 'left': l },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box5.toString(),
                    'item': `Display Capture ${msg[5]}`,
                    'crop': { 'top': j1, 'bottom': g1, 'right': m, 'left': m },
                }).catch((err) => {console.log(err)})
                obs.send("SetSceneItemProperties", {
                    'scene-name': box6.toString(),
                    'item': `Display Capture ${msg[6]}`,
                    'crop': { 'top': j1, 'bottom': g1, 'right': l, 'left': k },
                }).catch((err) => {console.log(err)})
            }, millisec)
                    break;
                
           case 7:
            console.log("7 Zoom Boxes")
                    var box1 = msg[1]
                    var box2 = msg[2]
                    var box3 = msg[3]
                    var box4 = msg[4]
                    var box5 = msg[5]
                    var box6 = msg[6]
                    var box7 = msg[7]

                    setTimeout(() => {
                obs.send("SetSceneItemProperties", {
                    'scene-name': box1.toString(),
                    'item': `Display Capture ${msg[1]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box2.toString(),
                    'item': `Display Capture ${msg[2]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box3.toString(),
                    'item': `Display Capture ${msg[3]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': r, 'left': q },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box4.toString(),
                    'item': `Display Capture ${msg[4]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box5.toString(),
                    'item': `Display Capture ${msg[5]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box6.toString(),
                    'item': `Display Capture ${msg[6]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': r, 'left': q },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box7.toString(),
                    'item': `Display Capture ${msg[7]}`,
                    'crop': { 'top': v, 'bottom': u, 'right': s, 'left': s },
                })
            }, millisec)
                    break;

            case 8:
                console.log("8 Zoom Boxes")
                    var box1 = msg[1]
                    var box2 = msg[2]
                    var box3 = msg[3]
                    var box4 = msg[4]
                    var box5 = msg[5]
                    var box6 = msg[6]
                    var box7 = msg[7]
                    var box8 = msg[8]

                    setTimeout(() => {
                obs.send("SetSceneItemProperties", {
                    'scene-name': box1.toString(),
                    'item': `Display Capture ${msg[1]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box2.toString(),
                    'item': `Display Capture ${msg[2]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box3.toString(),
                    'item': `Display Capture ${msg[3]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': r, 'left': q },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box4.toString(),
                    'item': `Display Capture ${msg[4]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box5.toString(),
                    'item': `Display Capture ${msg[5]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box6.toString(),
                    'item': `Display Capture ${msg[6]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': r, 'left': q },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box7.toString(),
                    'item': `Display Capture ${msg[7]}`,
                    'crop': { 'top': v, 'bottom': u, 'right': d, 'left': w },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box8.toString(),
                    'item': `Display Capture ${msg[8]}`,
                    'crop': { 'top': v, 'bottom': u, 'right': w, 'left': d },
                })
            }, millisec)
                    break;

            case 9:
                console.log("9 Zoom Boxes")
                    var box1 = msg[1]
                    var box2 = msg[2]
                    var box3 = msg[3]
                    var box4 = msg[4]
                    var box5 = msg[5]
                    var box6 = msg[6]
                    var box7 = msg[7]
                    var box8 = msg[8]
                    var box9 = msg[9]

                    setTimeout(() => {
                obs.send("SetSceneItemProperties", {
                    'scene-name': box1.toString(),
                    'item': `Display Capture ${msg[1]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box2.toString(),
                    'item': `Display Capture ${msg[2]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box3.toString(),
                    'item': `Display Capture ${msg[3]}`,
                    'crop': { 'top': o, 'bottom': p, 'right': r, 'left': q },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box4.toString(),
                    'item': `Display Capture ${msg[4]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box5.toString(),
                    'item': `Display Capture ${msg[5]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box6.toString(),
                    'item': `Display Capture ${msg[6]}`,
                    'crop': { 'top': t, 'bottom': z, 'right': r, 'left': q },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box7.toString(),
                    'item': `Display Capture ${msg[7]}`,
                    'crop': { 'top': v, 'bottom': u, 'right': q, 'left': r },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box8.toString(),
                    'item': `Display Capture ${msg[8]}`,
                    'crop': { 'top': v, 'bottom': u, 'right': s, 'left': s },
                })
                obs.send("SetSceneItemProperties", {
                    'scene-name': box9.toString(),
                    'item': `Display Capture ${msg[9]}`,
                    'crop': { 'top': v, 'bottom': u, 'right': r, 'left': q },
                })
            }, millisec)
                    break;

            case -1:
                console.log("error yo")

        }
        
    }
})

//Turns OFF and ON Sources Depending On Participants Zoom Status
serverZoom.on('message', (msg) => {
    if (msg[0] === "/zoomosc/vid/off" || msg[0] === "/zoomosc/video/off") {
        obs.send("SetSceneItemProperties", {
            'scene-name': msg[1].toString(),
            'item': `Display Capture ${msg[1]}`,
            'visible': false,
        })
    } 
    
    else if (msg[0] === "/zoomosc/vid/on" || msg[0] === "/zoomosc/video/on"){
        setTimeout(() => {
        obs.send("SetSceneItemProperties", {
            'scene-name': msg[1].toString(),
            'item': `Display Capture ${msg[1]}`,
            'visible': true,
            })
        }, 1000)
    } 
    
    else if (msg[0] === "/zoomosc/chat" && msg[2] === "SM" && msg[3] === ";" || msg[3] === "G" || msg[3] === "g"){
        console.log("SM Triggered a 'GO' Command to Qlab")
        client.send(`/go`, (err) => {  //Takes OBS Scene Name and Sends it Out as OSC String (Along with Prefix and Suffix)
            if (err) console.error(err);
          });
    } 
    
    else if(msg[0] === "/zoomosc/chat" && msg[2] === "SM" && msg[3] === "!"){
        console.log("SM has Triggered a 'PANIC' to Qlab")
        clientZoom.send("/zoom/chat", "SM", "-- PANIC in QLab was Triggered --")
        client.send(`/panic`, (err) => {  //Takes OBS Scene Name and Sends it Out as OSC String (Along with Prefix and Suffix)
            if (err) console.error(err);
          });
    }

    else if(msg[0] === "/zoomosc/chat" && msg[2] === "SM"){
        if(msg[3].includes("G2q") || msg[3].includes("g2q")){
        var g2qMessage = msg[3].substring(4)
        console.log(`SM Triggered Qlab Cue: '${g2qMessage}'`)
        client.send(`/go/${g2qMessage}`, (err) => {  //Takes OBS Scene Name and Sends it Out as OSC String (Along with Prefix and Suffix)
            if (err) console.error(err);
          });
        }
    } 
})

