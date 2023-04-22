import { Event } from './Event.js';
import { WebSerial } from './WebSerial.js';


export class Connection
{
    Configure(cfg)
    {
        this.dbg = cfg.dbg;

        Event.AddHandler(this);

        this.disconnectOk = false;
        this.lineCount = 0;

        this.ws = new WebSerial(cfg.filterList);

        this.ws.SetOnLineCallback((line) => {
            this.OnMessageLine(line);
        });

        this.ws.SetOnConnectedCallback(() => {
            this.lineCount = 0;
            Event.Emit({type: "connected"})
        });
        
        this.ws.SetOnDisconnectedCallback(() => {
            Event.Emit({type: "disconnected", ok: this.disconnectOk})

            this.disconnectOk = false;
        });
    }

    async Connect()
    {
        this.ws.Connect();
    }
    
    async Disconnect()
    {
        Event.Emit({ type: "pre-disconnect" });

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
        this.lineCount += 1;

        let msg = null;
        try {
            msg = JSON.parse(line);

            let jsonStrPretty = JSON.stringify(msg, null, 2);
            // console.log(`Parsed json object from string of len ${line.length}`);
            // console.log(msg);

            this.dbg.Debug("received:" + "\n" + jsonStrPretty);
        } catch (e) {
            if (line.trim() != "")
            {
                // the first line, sadly, may be garbage due to device-side issue
                if (this.lineCount != 1)
                {
                    console.log(`Could not JSON.parse line "${line}"`);
                }
            }
        }

        if (msg)
        {
            Event.Emit({type: "msg", msg: msg })
        }
    };
}
