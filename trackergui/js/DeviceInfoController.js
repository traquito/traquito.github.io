import { Event } from './Event.js';

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
    }

    OnMessageRepGetDeviceInfo(msg)
    {
        let swVersion = msg["swVersion"];

        this.dom.deviceInfo.innerHTML = `Device SW: ${swVersion}`;
    }
}
