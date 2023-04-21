import { Event } from './Event.js';
import { WebSerial } from '/js/WebSerial.js';


export class Connection
{
    Configure(cfg)
    {
        this.dbg = cfg.dbg;

        Event.AddHandler(this);

        this.disconnectOk = false;

        this.ws = new WebSerial(cfg.filterList);

        this.ws.SetOnLineCallback((line) => {
            this.OnMessageLine(line);
        });

        this.ws.SetOnConnectedCallback(() => {
            Event.OnEvent({type: "connected"})
        });
        
        this.ws.SetOnDisconnectedCallback(() => {
            Event.OnEvent({type: "disconnected", ok: this.disconnectOk})

            this.disconnectOk = false;
        });
    }

    async Connect()
    {
        this.ws.Connect();
    }
    
    async Disconnect()
    {
        Event.OnEvent({ type: "pre-disconnect" });

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
            Event.OnEvent({type: "msg", msg: msg })
        }
    };
}
