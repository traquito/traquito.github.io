import * as autl from './AppUtl.js';
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
        this.msgTypeDoNotLogList = ["ACK"];

        this.ws = new WebSerial(cfg.filterList);

        this.ws.SetOnLineCallback((line) => {
            this.OnMessageLine(line);
        });

        this.ws.SetOnConnectFailCallback(e => {
            autl.ToastDialog(
            `Couldn't connect...

            Perhaps you're already connected in another browser window?

            Try this:
            - unplug the tracker from USB
            - plug the tracker back into USB
            - try to connect again
            `
            )
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

    AddMsgTypeToDoNotLogList(type)
    {
        this.msgTypeDoNotLogList.push(type);
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

    Send(msg, log = true)
    {
        let msgStr = JSON.stringify(msg);

        if (log)
        {
            this.dbg.Debug(`sending "${msgStr}"`);
        }
        
        this.ws.Send(msgStr);
    };
    
    SendString(str)
    {
        this.dbg.Debug(`sending string "${str}"`);

        this.ws.Send(str);
    }

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
        let emitThis = true;
        try {
            msg = JSON.parse(line);

            let debugLogThis = true;
            let debugStr = "received:";

            if (msg.type)
            {
                if (this.msgTypeDoNotLogList.includes(msg.type))
                {
                    debugLogThis = false;
                }
            }
            else
            {
                // yes, but because it's an error
                debugStr = "unknown message type:";
                emitThis = false;
            }
            
            if (debugLogThis)
            {
                let jsonStrPretty = JSON.stringify(msg, null, 2);
                this.dbg.Debug(debugStr + "\n" + jsonStrPretty);
            }
        } catch (e) {
            if (line.trim() != "")
            {
                emitThis = false;

                // the first line, sadly, may be garbage due to device-side issue
                if (this.lineCount != 1)
                {
                    console.log(`Could not JSON.parse line "${line}"`);
                }
            }
        }

        if (msg && emitThis)
        {
            Event.Emit({type: "msg", msg: msg })
        }
    };
}
