---
icon: material/television-guide

hide:
  - path
---

# Tracker GUI

<!DOCTYPE html>
<html>
    <head>

<!-- https://github.com/apvarun/toastify-js/blob/master/README.md -->
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">



<script>
</script>

        <script type='module'>
import * as autl from './js/AppUtl.js';
import { ConfigController } from './js/ConfigController.js';
import { ConnectController } from './js/ConnectController.js';
import { Connection } from './js/Connection.js';
import { DebugController } from './js/DebugController.js';
import { DeviceInfoController } from './js/DeviceInfoController.js';
import { Event } from './js/Event.js';
import { TestController } from './js/TestController.js';




/////////////////////////////////////////////////////////////////////
// App
/////////////////////////////////////////////////////////////////////

export class App
{
    constructor()
    {
        console.log("App Started");

        Event.AddHandler(this);

        // create
        this.conn = new Connection();
        
        this.connectController = new ConnectController();
        this.configController  = new ConfigController();
        this.debugController = new DebugController();
        this.deviceInfoController  = new DeviceInfoController();
        this.testController  = new TestController();


        // configure
        this.conn.Configure({
            dbg: this.debugController,
            eventer: this.eventer,
            filterList: [
                {
                    usbVendorId: 12259,
                    usbProductId: 8,
                },
            ],
        });

        this.deviceInfoController.Configure({
            dbg: this.debugController,
            conn: this.conn,
            idDeviceInfo: "deviceInfo",
        });

        this.connectController.Configure({
            dbg: this.debugController,
            conn: this.conn,
            idStatus: "status",
            idConnect: "connect",
            idDisconnect: "disconnect",
        });
        
        this.configController.Configure({
            dbg: this.debugController,
            conn: this.conn,
            idBand: "band",
            idChannel: "channel",
            idCallsign: "callsign",
            idSaveButton: "saveConfig",
            idRestoreButton: "restoreConfig",
            idDefaultButton: "defaultConfig",
            idFreq: "freq",
            idCorrectionRange: "correctionRange",
            idCorrectionNumber: "correctionNumber",
        });

        this.debugController.Configure({
            dbg: this.debugController,
            conn: this.conn,
            idForm: "form",
            idShell: "shell",
            idJson: "json",
            idOutput: "output",
            idPing: "ping",
            idPing2: "ping2",
            idClear: "clear",
            idCopy: "copy",
        });

        this.testController.Configure({
            dbg: this.debugController,
            conn: this.conn,
            idTempC: "tempC",
            idTempF: "tempF",
            idCallsign: "sendCallsign",
            idGrid4: "sendGrid4",
            idPower: "sendPower",
            idSendButton: "send",
            idGpsOutput: "gpsOutput",
            idGpsResetHotButton: "gpsResetHot",
            idGpsResetWarmButton: "gpsResetWarm",
            idGpsResetColdButton: "gpsResetCold",
            idGpsTime: "gpsTime",
            idGpsTimeFirstLockDuration: "gpsTimeFirstLockDuration",
            idGpsLatLng: "gpsLatLng",
            idGpsLatLngFirstLockDuration: "gpsLatLngFirstLockDuration",
            idGps3D: "gps3D",
            idGps3DFirstLockDuration: "gps3DFirstLockDuration",
            idGpsPowerOnButton: "gpsPowerOn",
            idGpsPowerOffBattOnButton: "gpsPowerOffBattOn",
            idGpsPowerOffButton: "gpsPowerOff",
        });

        // show debug when requested
        document.addEventListener("keydown", (e) => {
            let retVal = true;

            if (e.key == "?" && e.target == document.body)
            {
                e.preventDefault();
                retVal = false;

                let dbg = document.getElementById("debug");
                let dbgCal = document.getElementById("debugCalibration");
                
                if (dbg.style.display != "block")
                {
                    dbg.style.display = "block";
                }
                else
                {
                    dbg.style.display = "none";
                }

                dbgCal.style.display = dbg.style.display;
            }

            return retVal;
        });
    }

// private

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(evt.ok); break;
        }
    }

    OnConnected()
    {
        autl.ToastOk("Connected");
    }
    
    OnDisconnected(ok)
    {
        if (ok)
        {
            autl.ToastOk("Disconnected (expected)");
        }
        else
        {
            autl.ToastErr("Disconnected (unexpected)");
        }
    }
}

export let app = null;

window.addEventListener('DOMContentLoaded', (event) => {
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1)
    {
        autl.ModalShow(
            `Apologies, Firefox doesn't support the required WebSerial
             technology used on this site.  Please try Chrome or Edge!`);
    }
    else
    {
        app = new App();
        window.app = app;
    }
});

</script>


<!-- overrides -->
<link rel="stylesheet" href="/css/mkdocs.css">

<style>


#status {
    padding: 2px;
    display: inline-block;
    min-width: 150px;
}

#deviceInfo {
    display: inline-block;
}

#correctionRange {
    direction: rtl;
}

textarea {
    width: 100%;
}

input[type='range'] {
    width: 50%;
}

div label {
    display: inline-block;
    min-width: 100px;
}

#tempC, #tempF {
    display: inline-block;
}

#gpsTimeLabel, #gpsLatLngLabel, #gps3DLabel {
    min-width: 125px;
}


#gpsTime, #gpsLatLng, #gps3D {
    min-width: 200px;
    display: inline-block;
}

#gpsTimeLabel, #gpsLatLngLabel, #gps3DLabel,
#gpsTimeFirstLockDuration, #gpsLatLngFirstLockDuration, #gps3DFirstLockDuration {
    vertical-align: top;
}

#debug, #debugCalibration {
    display: none;
}

#callsign, #sendCallsign, #sendGrid4 {
    text-transform: uppercase;
}

#help {
    float: right;
}

#shellLabel, #jsonLabel {
    min-width: 50px;
    display: inline-block;
}

</style>
    </head>

    <body>
    <div class="page">
        <fieldset class="outer">
            <legend>Tracker Connection</legend>
            <section>
                <button class="button_not_styled" id="connect">Connect</button>
                <button class="button_not_styled" id="disconnect">Disconnect</button>
                Status <span id="status">Disconnected</span>
                <span id="deviceInfo"></span>
            </section>
        </fieldset>


        <fieldset class="outer">
            <legend>Flight Configuration</legend>

            <button class="button_not_styled" id="saveConfig">Save</button>
            <button class="button_not_styled" id="restoreConfig">Show Saved</button>
            <button class="button_not_styled" id="defaultConfig">Show Default</button>
            <br/>
            <br/>

            <fieldset class="inner">
                <legend>WSPR Configuration</legend>
        
                <div>
                <label>Band</label>
                    <select class="select_not_styled" id="band" title="band" value="20m">
                        <option value="2190m">2190m (LF)</option>
                        <option value="630m">630m (MF)</option>
                        <option value="160m">160m</option>
                        <option value="80m">80m</option>
                        <option value="60m">60m</option>
                        <option value="40m">40m</option>
                        <option value="30m">30m</option>
                        <option value="20m" selected>20m</option>
                        <option value="17m">17m</option>
                        <option value="15m">15m</option>
                        <option value="12m">12m</option>
                        <option value="10m">10m</option>
                        <option value="6m">6m</option>
                        <option value="4m">4m</option>
                        <option value="2m">2m</option>
                    </select>
                </div>

                <div>
                    <label><a href="/channelmap/help/" target="_blank">Channel</a></label> <input class="input_not_styled" id="channel" type="number" value="0" min="0" max="599" title="channel" placeholder="channel">
                </div>

                <div>
                    <label>Callsign</label> <input class="input_not_styled" id="callsign" title="callsign" placeholder="callsign" size="7" maxlength="6"></input>
                </div>

            </fieldset>

            <br/>

            <fieldset id="debugCalibration" class="inner">
                <legend>SI5351 Correction Configuration</legend>
                <div>
                    <label>
                        Correction
                    </label>
                    <input class="input_not_styled" id="correctionRange" type="range" min="-3500" value="0" max="3500" step="10" title="correction" placeholder="correction">
                    <input class="input_not_styled" id="correctionNumber" type="number" min="-3500" value="0" max="3500" step="10" title="correction" placeholder="correction">
                    <div>
                        <label>Target</label> <span id="freq">14,095,600 + 1,500Hz</span>
                    </div>
                </div>
            </fieldset>
        </fieldset>


        <fieldset class="outer">
            <legend>Test</legend>

            <fieldset class="inner">
                <legend>Temperature</legend>

                <label id="tempLabel">TempC / TempF: </label>
                <span id="tempC"></span> C / 
                <span id="tempF"></span> F
            </fieldset>

            <br/>

            <fieldset class="inner">
                <legend>Send WSPR Message</legend>

                <div>
                    <label><a href="https://www.fcc.gov/wireless/bureau-divisions/mobility-division/amateur-radio-service/amateur-call-sign-systems#sequential-call-sign-system" target="_blank">Callsign</a></label> <input class="input_not_styled" id="sendCallsign" size="7" title="callsign" placeholder="callsign" maxlength="6"> (any legal)
                </div>

                <div>
                    <label><a href="https://www.dxzone.com/grid-square-locator-system-explained/" target="_blank">Grid</a></label> <input class="input_not_styled" id="sendGrid4" title="grid" placeholder="grid" size="7" maxlength="4"></input> (4 char)
                </div>
        
                <div>
                    <label>Power dBm</label>
                    <select class="select_not_styled" id="sendPower" title="power" value="20">
                        <option value="0">0</option>
                        <option value="3">3</option>
                        <option value="7">7</option>
                        <option value="10">10</option>
                        <option value="13">13</option>
                        <option value="17" selected>17</option>
                        <option value="20">20</option>
                        <option value="23">23</option>
                        <option value="27">27</option>
                        <option value="30">30</option>
                        <option value="33">33</option>
                        <option value="37">37</option>
                        <option value="40">40</option>
                        <option value="43">43</option>
                        <option value="47">47</option>
                        <option value="50">50</option>
                        <option value="53">53</option>
                        <option value="57">57</option>
                        <option value="60">60</option>
                    </select> (all are valid)
                </div>

                <button class="button_not_styled" id="send">Send</button> (wait to click until 1 sec after an even minute)
            </fieldset>

            <br/>

            <fieldset class="inner">
                <legend>GPS Monitor / Control</legend>
                <div>
                    <label>
                        <a target="_blank" href="https://content.u-blox.com/sites/default/files/products/documents/u-blox6_ReceiverDescrProtSpec_%28GPS.G6-SW-10018%29_Public.pdf#page=45">Reset Modes</a>
                    </label>
                    <button class="button_not_styled" id="gpsResetHot">Hot</button>
                    <button class="button_not_styled" id="gpsResetWarm">Warm</button>
                    <button class="button_not_styled" id="gpsResetCold">Cold</button>
                </div>

                <div>
                    <label>
                        Power
                    </label>
                    <button class="button_not_styled" id="gpsPowerOn">On, Battery On</button>
                    <button class="button_not_styled" id="gpsPowerOffBattOn">Off, Battery On</button>
                    <button class="button_not_styled" id="gpsPowerOff">Off, Battery Off</button>
                </div>

                <div>
                    <label id="gpsTimeLabel">GPS Time: </label>
                    <span id="gpsTime"></span>
                    <span id="gpsTimeFirstLockDuration"></span>
                </div>
                <div>
                    <label id="gpsLatLngLabel">GPS 2D: </label>
                    <span id="gpsLatLng"></span>
                    <span id="gpsLatLngFirstLockDuration"></span>
                </div>
                <div>
                    <label id="gps3DLabel">GPS 3D: </label>
                    <span id="gps3D"></span>
                    <span id="gps3DFirstLockDuration"></span>
                </div>
                <textarea id="gpsOutput" rows="9" cols="80" readonly></textarea>
            </fieldset>
            
        </fieldset>

        <fieldset id="debug" class="outer">
        <legend>Debug</legend>
            <form id="form" style="display:inline-block">
                <input class="input_not_styled" type="submit" style="display:none;">
                <span id="shellLabel">shell</span> <input class="input_not_styled" id="shell" type="text" size="55" spellcheck="false"><br/>
                <span id="jsonLabel">json</span> <input class="input_not_styled" id="json" type="text" size="55" spellcheck="false"><br/>
            </form>
            <br/><br/>
            <button class="button_not_styled" id="ping">Ping</button>
            <button class="button_not_styled" id="ping2">PingX</button>
            <button class="button_not_styled" id="clear">Clear</button>
            <button class="button_not_styled" id="copy">Copy to clipboard</button>
            <br/>
            <br/>
            <textarea id="output" rows="15" cols="80" readonly></textarea>
        </fieldset>

    </div>
    </body>
</html>