---
icon: material/crosshairs-gps

hide:
  - toc
---

# API Mode - GPS Test

<!DOCTYPE html>
<html>
    <head>

<!-- https://github.com/apvarun/toastify-js/blob/master/README.md -->
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">



<script>
</script>

        <script type='module'>
import * as autl from '/trackergui/js/AppUtl.js';
import { ConnectController } from '/trackergui/js/ConnectController.js';
import { Connection } from '/trackergui/js/Connection.js';
import { DeviceInfoController } from '/trackergui/js/DeviceInfoController.js';
import { Event } from '/trackergui/js/Event.js';
import { GpsTestController } from './GpsTestController.js';




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
        this.deviceInfoController  = new DeviceInfoController();
        this.gpsTestController  = new GpsTestController();

        let obj = {
            Debug: s => {
                //console.log(`debug(${s})`);
            }
        };


        // configure
        this.conn.Configure({
            dbg: obj,
            eventer: this.eventer,
            filterList: [
                {
                    usbVendorId: 12259,
                    usbProductId: 8,
                },
            ],
        });

        this.deviceInfoController.Configure({
            dbg: obj,
            conn: this.conn,
            idDeviceInfo: "deviceInfo",
            suppressApiModeWarning: true,
        });

        this.connectController.Configure({
            dbg: obj,
            conn: this.conn,
            idStatus: "status",
            idConnect: "connect",
            idDisconnect: "disconnect",
        });

        this.gpsTestController.Configure({
            dbg: obj,
            conn: this.conn,
            nameStartAction: "startAction",
            idStartButton: "start",
            idStopButton: "stop",
            idResetButton: "reset",
            idGpsTestStatus: "gpsTestStatus",
            idGpsOutput: "gpsOutput",
            idGpsTestSummary: "gpsTestSummary",
            idDataTableContainer: "dataTableContainer",
        });
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(evt.ok); break;
            case "msg":
                switch (evt.msg.type) {
                    case "REP_GET_DEVICE_INFO": this.OnMessageRepGetDeviceInfo(evt.msg); break;
                }
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

    OnMessageRepGetDeviceInfo(msg)
    {
        let swVersion = msg["swVersion"];
        let mode = msg["mode"];
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


<style>
.page {
    font-family: Consolas,monaco,monospace;
    font-size: small;
}

#status {
    padding: 2px;
    display: inline-block;
    min-width: 150px;
}

#deviceInfo {
    display: inline-block;
}

td {
    text-align: center;
}

button {
    all: unset;

    font-family: Consolas, monaco, monospace;
    font-size: small;
    appearance: auto;
    color: buttontext;
    letter-spacing: normal;
    word-spacing: normal;
    line-height: normal;
    text-transform: none;
    text-indent: 0px;
    text-shadow: none;
    display: inline-block;
    text-align: center;
    align-items: flex-start;
    cursor: default;
    box-sizing: border-box;
    background-color: buttonface;
    margin: 0em;
    padding-block: 1px;
    padding-inline: 6px;
    border-width: 1px;
    border-style: outset;
    border-color: buttonborder;
    border-image: initial;

}
</style>
    </head>

    <body>
    <div class="page">
        <fieldset class="outer">
            <legend>Tracker Connection</legend>
            <section>
                <button id="connect">Connect</button>
                <button id="disconnect">Disconnect</button>
                Status <span id="status">Disconnected</span>
                <span id="deviceInfo"></span>
            </section>
        </fieldset>

<pre>
This demonstration of the API mode functionality allows you to start/stop an
automatic sequence of timed GPS locks by the device.

The steps taken are:
- Take the selected action to start each lock duration test
- Wait for a 3D lock
- Update list of recorded durations

This process repeats indefinitely until you click stop.

New values are added to the end of the list of prior measurements if you start again.
You can start a new set of measurements with the Clear Data button.
</pre>

        Action to start each lock duration test:<br/>
        <input type="radio" name="startAction" id="cold_reset" value="cold_reset"><label for="cold_reset">Cold Reset</label><br/>
        <input type="radio" name="startAction" id="warm_reset" value="warm_reset"><label for="warm_reset">Warm Reset</label><br/>
        <input type="radio" name="startAction" id="hot_reset" value="hot_reset"><label for="hot_reset">Hot Reset</label><br/>
        <input type="radio" name="startAction" id="power_off_batt_on" value="power_off_batt_on" checked><label for="power_off_batt_on">Power Off, Battery On</label> (this is normal flight behavior)<br/>
        <input type="radio" name="startAction" id="power_off_batt_off" value="power_off_batt_off"><label for="power_off_batt_off">Power Off, Battery Off</label><br/>

        <button id="start">Start GPS Test</button>
        <button id="stop">Stop GPS Test</button>
        <button id="reset">Clear Data</button>

        <br/>
        <br/>
        
        Test Status: <span id="gpsTestStatus"></span>
        <br/>
        <br/>
        <textarea id="gpsOutput" rows="9" cols="80" readonly></textarea>
        
        <br/>
        <br/>

        3D Lock Duration Results (secs):
        <span id="gpsTestSummary"></span>

        <br/>
        <br/>

        <div id="dataTableContainer"></div>

        <br/><br/><br/><br/>
        <br/><br/><br/><br/>
        <br/><br/><br/><br/>
        <br/><br/><br/><br/>
        <br/><br/><br/><br/>
        <br/><br/><br/><br/>
        <br/><br/><br/><br/>
        <br/><br/><br/><br/>

    </div>
    </body>
</html>