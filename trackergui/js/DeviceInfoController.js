import { Event } from './Event.js';
import * as autl from './AppUtl.js';

/////////////////////////////////////////////////////////////////////
// DeviceInfoController
/////////////////////////////////////////////////////////////////////

export class DeviceInfoController
{
    Configure(cfg)
    {
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.deviceInfo = document.getElementById(cfg.idDeviceInfo);
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "msg":
                switch (evt.msg.type) {
                    case "REP_GET_DEVICE_INFO": this.OnMessageRepGetDeviceInfo(evt.msg); break;
                }
        }
    }

    OnConnected()
    {
        this.conn.Send({
            "type": "REQ_GET_DEVICE_INFO",
        });
    }

    OnDisconnected()
    {
        this.dom.deviceInfo.innerHTML = "";
        document.body.style.backgroundImage = "";
    }

    OnMessageRepGetDeviceInfo(msg)
    {
        let swVersion = msg["swVersion"];
        let mode = msg["mode"];

        if (mode == "API")
        {
            this.dom.deviceInfo.innerHTML = `API MODE SW: ${swVersion}`;
            document.body.style.backgroundImage = "url(warning.png)";
            autl.ToastDialogWarn(
                `This device is in API Mode

                 This is not a tracker

                 Use with caution, do not fly!
                `
            );
        }
        else
        {
            this.dom.deviceInfo.innerHTML = `Jetpack SW: ${swVersion}`;
        }

        Event.Emit({type: "mode", mode: mode});
    }
}
