import * as autl from './AppUtl.js';

/////////////////////////////////////////////////////////////////////
// DeviceInfoController
/////////////////////////////////////////////////////////////////////

export class DeviceInfoController
{
    Configure(cfg)
    {
        this.conn = cfg.conn;

        this.dom = {};
        this.dom.deviceInfo = document.getElementById(cfg.idDeviceInfo);
    }

    GetMessageTypeMapList()
    {
        return [
            {
                msgType: "REP_GET_DEVICE_INFO",
                cbFn : (msg) => { this.OnMessageRepGetDeviceInfo(msg); },
            },
        ];
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
        let hwVersion = msg["hwVersion"];
        let swVersion = msg["swVersion"];

        this.dom.deviceInfo.innerHTML = `Device HW: ${hwVersion}, SW: ${swVersion}`;
    }
}
