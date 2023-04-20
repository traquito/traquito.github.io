import { WebSerial } from '/js/WebSerial.js';


/////////////////////////////////////////////////////////////////////
// Connection
/////////////////////////////////////////////////////////////////////

export class Connection
{
    Configure(cfg)
    {
        this.dbg = cfg.dbg;

        this.evtHandler = cfg.evtHandler;

        this.disconnectOk = false;

        this.ws = new WebSerial();

        this.ws.SetOnLineCallback((line) => {
            this.OnMessageLine(line);
        });

        this.ws.SetOnConnectedCallback(() => {
            this.evtHandler.OnConnected();
        });

        this.ws.SetOnDisconnectedCallback(() => {
            let disconnectOk = this.disconnectOk;

            this.evtHandler.OnDisconnected(disconnectOk);

            this.disconnectOk = false;
        });
    }

    async Connect()
    {
        this.ws.Connect();
    }
    
    async Disconnect()
    {
        this.disconnectOk = true;

        this.ws.Disconnect();
    }

    Send(msg)
    {
        let msgStr = JSON.stringify(msg);

        this.dbg.Debug(`sending "${msgStr}"`);
        
        this.ws.Send(msgStr);
    };

    SendType(str)
    {
        this.Send({
            "type" : str
        });
    }

    SendShellCmd(str)
    {
        this.Send({
            "type": "SHELL_COMMAND",
            "cmd": str,
        });
    }


// private

    OnMessageLine(line)
    {
        let msg = null;
        try {
            msg = JSON.parse(line);

            let jsonStrPretty = JSON.stringify(msg, null, 2);
            // console.log(`Parsed json object from string of len ${line.length}`);
            // console.log(msg);

            this.dbg.Debug("received:" + "\n" + jsonStrPretty);
        } catch (e) {
            console.log(`Could not JSON.parse line "${line}`);
        }

        if (msg)
        {
            try {
                this.evtHandler.OnMessage(msg);
            } catch (e) {
                console.log(`Handler for msg failed, msg: ${line}`)
                console.log(this.evtHandler);
            }
        }
    };
}
