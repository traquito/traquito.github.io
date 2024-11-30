import * as utl from '/js/Utl.js';
import * as autl from './AppUtl.js';
import { Event } from './Event.js';


export class TestController
{
    Configure(cfg)
    {
        this.conn = cfg.conn;

        this.conn.AddMsgTypeToDoNotLogList("TEMP");
        this.conn.AddMsgTypeToDoNotLogList("GPS_LINE");
        this.conn.AddMsgTypeToDoNotLogList("GPS_FIX_TIME");
        this.conn.AddMsgTypeToDoNotLogList("GPS_FIX_2D");
        this.conn.AddMsgTypeToDoNotLogList("GPS_FIX_3D");

        Event.AddHandler(this);

        this.dom = {};
        this.dom.tempC = document.getElementById(cfg.idTempC);
        this.dom.tempF = document.getElementById(cfg.idTempF);
        this.dom.callsign = document.getElementById(cfg.idCallsign);
        this.dom.grid4 = document.getElementById(cfg.idGrid4);
        this.dom.power = document.getElementById(cfg.idPower);
        this.dom.sendButton = document.getElementById(cfg.idSendButton);
        this.dom.gpsOutput = document.getElementById(cfg.idGpsOutput);
        this.dom.gpsResetHotButton = document.getElementById(cfg.idGpsResetHotButton);
        this.dom.gpsResetWarmButton = document.getElementById(cfg.idGpsResetWarmButton);
        this.dom.gpsResetColdButton = document.getElementById(cfg.idGpsResetColdButton);
        this.dom.gpsTime = document.getElementById(cfg.idGpsTime);
        this.dom.gpsTimeFirstLockDuration = document.getElementById(cfg.idGpsTimeFirstLockDuration);
        this.dom.gpsLatLng = document.getElementById(cfg.idGpsLatLng);
        this.dom.gpsLatLngFirstLockDuration = document.getElementById(cfg.idGpsLatLngFirstLockDuration);
        this.dom.gps3D = document.getElementById(cfg.idGps3D);
        this.dom.gps3DFirstLockDuration = document.getElementById(cfg.idGps3DFirstLockDuration);
        this.dom.gpsPowerOnButton = document.getElementById(cfg.idGpsPowerOnButton);
        this.dom.gpsPowerOffBattOnButton = document.getElementById(cfg.idGpsPowerOffBattOnButton);
        this.dom.gpsPowerOffButton = document.getElementById(cfg.idGpsPowerOffButton);

        this.clearGpsFieldsUntilFirstLock = false;

        // prevent spaces in the callsign and grid
        let NoSpace = e => {
            let retVal = true;

            if (e.which === 32)
            {
                e.preventDefault();
                retVal = false;
            }

            return retVal;
        };

        this.dom.callsign.addEventListener("keydown", NoSpace);
        this.dom.grid4.addEventListener("keydown", NoSpace);

        this.dom.sendButton.onclick = (event) => {
            let dom = autl.ModalShow("Sending, this will take 1 min 50 sec");

            let progress = document.createElement("progress");
            progress.value = 0;
            progress.max = 110592; // 110 sec 592ms
            progress.style.width = "100%";

            dom.appendChild(document.createElement("br"));
            dom.appendChild(progress);

            autl.ProgressInc(progress, 200, 200);

            Event.Emit("disable");

            this.conn.Send({
                type : "REQ_WSPR_SEND",
                callsign: this.dom.callsign.value.trim().toUpperCase(),
                grid: this.dom.grid4.value.trim().toUpperCase(),
                power: this.dom.power.value.trim(),
            });
        };
        this.dom.gpsResetHotButton.onclick = () => {
            this.conn.Send({
                type: "REQ_GPS_RESET",
                temp: "hot",
            });

            this.ClearGpsFieldsUntilFirstLock();
        };
        this.dom.gpsResetWarmButton.onclick = () => {
            this.conn.Send({
                type: "REQ_GPS_RESET",
                temp: "warm",
            });

            this.ClearGpsFieldsUntilFirstLock();
        };
        this.dom.gpsResetColdButton.onclick = () => {
            this.conn.Send({
                type: "REQ_GPS_RESET",
                temp: "cold",
            });

            this.ClearGpsFieldsUntilFirstLock();
        };
        this.dom.gpsPowerOnButton.onclick = () => {
            this.conn.Send({
                type: "REQ_GPS_POWER_ON",
            });

            this.ClearGpsFieldsUntilFirstLock();
        };
        this.dom.gpsPowerOffBattOnButton.onclick = () => {
            this.conn.Send({
                type: "REQ_GPS_POWER_OFF_BATT_ON",
            });

            this.ClearGpsFieldsUntilFirstLock();
        };
        this.dom.gpsPowerOffButton.onclick = () => {
            this.conn.Send({
                type: "REQ_GPS_POWER_OFF",
            });

            this.ClearGpsFieldsUntilFirstLock();
        };

        // set initial state
        this.OnDisconnected();
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "disable": this.Disable(); break;
            case "enable": this.Enable(); break;
            case "msg":
            switch (evt.msg.type) {
                case "REP_WSPR_SEND": this.OnMsgRepWsprSend(evt.msg); break;
                case "GPS_LINE": this.OnMsgGpsLine(evt.msg); break;
                case "GPS_FIX_TIME": this.OnMsgGpsFixTime(evt.msg); break;
                case "GPS_FIX_2D": this.OnMsgGpsFix2D(evt.msg); break;
                case "GPS_FIX_3D": this.OnMsgGpsFix3D(evt.msg); break;
                case "TEMP": this.OnMsgTemp(evt.msg); break;
            }
        }
    }

    Enable()
    {
        this.dom.tempC.disabled = false;
        this.dom.tempF.disabled = false;
        this.dom.callsign.disabled = false;
        this.dom.grid4.disabled = false;
        this.dom.power.disabled = false;
        this.dom.sendButton.disabled = false;
        this.dom.gpsOutput.disabled = false;
        this.dom.gpsResetHotButton.disabled = false;
        this.dom.gpsResetWarmButton.disabled = false;
        this.dom.gpsResetColdButton.disabled = false;
        this.dom.gpsTime.disabled = false;
        this.dom.gpsLatLng.disabled = false;
        this.dom.gps3D.disabled = false;
        this.dom.gpsPowerOnButton.disabled = false;
        this.dom.gpsPowerOffBattOnButton.disabled = false;
        this.dom.gpsPowerOffButton.disabled = false;
    }
    
    Disable()
    {
        this.dom.tempC.innerHTML = "";
        this.dom.tempF.innerHTML = "";

        this.dom.callsign.disabled = true;
        this.dom.grid4.disabled = true;
        this.dom.power.disabled = true;
        this.dom.sendButton.disabled = true;
        
        this.dom.gpsOutput.value = "";
        this.dom.gpsOutput.disabled = true;
        
        this.dom.gpsResetHotButton.disabled = true;
        this.dom.gpsResetWarmButton.disabled = true;
        this.dom.gpsResetColdButton.disabled = true;

        this.dom.gpsTime.innerHTML = "";
        this.dom.gpsTimeFirstLockDuration.innerHTML = "";
        this.dom.gpsLatLng.innerHTML = "";
        this.dom.gpsLatLngFirstLockDuration.innerHTML = "";
        this.dom.gps3D.innerHTML = "";
        this.dom.gps3DFirstLockDuration.innerHTML = "";

        this.dom.gpsPowerOnButton.disabled = true;
        this.dom.gpsPowerOffBattOnButton.disabled = true;
        this.dom.gpsPowerOffButton.disabled = true;

    }

    OnConnected()
    {
        this.Enable();

        this.clearGpsFieldsUntilFirstLock = false;
    }
    
    OnDisconnected()
    {
        this.Disable();
    }

    OnMsgRepWsprSend(msg)
    {
        autl.ModalClose();

        Event.Emit("enable");

        autl.ToastOk("Sent!");
    }

    OnMsgGpsLine(msg)
    {
        autl.StickyScrollAdd(
            this.dom.gpsOutput, 
            this.dom.gpsOutput.value == "" ? msg.line : "\n" + msg.line
        );

        autl.TruncateTo(this.dom.gpsOutput, 9);
    }

    OnMsgGpsFixTime(msg)
    {
        if ((this.clearGpsFieldsUntilFirstLock == false) ||
            (this.clearGpsFieldsUntilFirstLock && (msg.firstLockDuration || this.dom.gpsTimeFirstLockDuration.innerHTML)))
        {
            this.dom.gpsTime.innerHTML = msg.time;
        }

        if (msg.firstLockDuration)
        {
            let secs = utl.Commas(Math.floor(msg.firstLockDuration / 1000) + 1);

            this.dom.gpsTimeFirstLockDuration.innerHTML = 
                "(First lock in " + secs + " s)";
        }
    }
    
    OnMsgGpsFix2D(msg)
    {
        if ((this.clearGpsFieldsUntilFirstLock == false) ||
            (this.clearGpsFieldsUntilFirstLock && (msg.firstLockDuration || this.dom.gpsLatLngFirstLockDuration.innerHTML)))
        {
            this.dom.gpsLatLng.innerHTML = msg.latDeg + ", " + msg.lngDeg;
        }

        if (msg.firstLockDuration)
        {
            let secs = utl.Commas(Math.floor(msg.firstLockDuration / 1000) + 1);

            this.dom.gpsLatLngFirstLockDuration.innerHTML = 
                "(First lock in " + secs + " s)";
        }
    }

    OnMsgGpsFix3D(msg)
    {
        if ((this.clearGpsFieldsUntilFirstLock == false) ||
            (this.clearGpsFieldsUntilFirstLock && (msg.firstLockDuration || this.dom.gps3DFirstLockDuration.innerHTML)))
        {
            this.dom.gps3D.innerHTML  = `Alt: ${utl.Commas(msg.altM)} M / ${utl.Commas(msg.altF)} Ft`;
            this.dom.gps3D.innerHTML += "<br/>";
            this.dom.gps3D.innerHTML += `SpeedKnots: ${utl.Commas(msg.speedK)}`;
            this.dom.gps3D.innerHTML += "<br/>";
            this.dom.gps3D.innerHTML += `CourseDeg: ${utl.Commas(msg.courseDeg)}`;
        }

        if (msg.firstLockDuration)
        {
            let secs = utl.Commas(Math.floor(msg.firstLockDuration / 1000) + 1);

            this.dom.gps3DFirstLockDuration.innerHTML = 
                "(First lock in " + secs + " s)";
        }
    }

    OnMsgTemp(msg)
    {
        this.dom.tempC.innerHTML  = Math.round(msg.tempC);
        this.dom.tempF.innerHTML  = Math.round(msg.tempF);
    }

    ClearGpsFieldsUntilFirstLock()
    {
        this.dom.gpsTime.innerHTML = "";
        this.dom.gpsTimeFirstLockDuration.innerHTML = "";
        this.dom.gpsLatLng.innerHTML = "";
        this.dom.gpsLatLngFirstLockDuration.innerHTML = "";
        this.dom.gps3D.innerHTML = "";
        this.dom.gps3DFirstLockDuration.innerHTML = "";

        this.clearGpsFieldsUntilFirstLock = true;
    }
}
