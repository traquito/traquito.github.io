import { Event } from './Event.js';


export class DebugController
{
    Configure(cfg)
    {
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.form   = document.getElementById(cfg.idForm);
        this.dom.input  = document.getElementById(cfg.idInput);
        this.dom.ping = document.getElementById(cfg.idPing);
        this.dom.ping2 = document.getElementById(cfg.idPing2);
        this.dom.clear = document.getElementById(cfg.idClear);
        this.dom.output = document.getElementById(cfg.idOutput);


        // have the form just leave you alone and fill it out in peace
        this.dom.form.autocomplete = 'off';

        // Change form behavior to simply give me a notice of hitting enter
        this.dom.form.onsubmit = (event) => {
            if (event) { event.preventDefault(); }

            let input = this.dom.input.value.trim();
            this.dom.input.value = "";

            this.conn.SendShellCmd(input);

            return false;
        };

        this.dom.ping.onclick = (event) => {
            this.OnPingClick()
        };

        this.dom.ping2.onclick = (event) => {
            this.OnPing2Click()
        };

        this.dom.clear.onclick = (event) => {
            this.dom.output.value = "";
        };

        // set initial state
        this.OnDisconnected();
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "msg":
                switch (evt.msg.type) {
                    case "REP_PING": this.OnMessageRepPing(evt.msg); break;
                    case "REP_PINGX": this.OnMessageRepPing2(evt.msg); break;
                }
        }
    }

    Debug(str)
    {
        let sep = "";
        this.dom.output.value += sep;
        sep = "\n";
        this.dom.output.value += str;
        this.dom.output.value += sep;
        this.dom.output.value += sep;
        this.dom.output.scrollTop = this.dom.output.scrollHeight;
    }

    OnConnected()
    {
        this.dom.input.disabled = false;
        this.dom.ping.disabled = false;
        this.dom.ping2.disabled = false;
    }

    OnDisconnected()
    {
        this.dom.input.disabled = true;
        this.dom.ping.disabled = true;
        this.dom.ping2.disabled = true;
    }

    OnPingClick()
    {
        this.pingTimeStart = performance.now();

        this.conn.Send({
            "type" : "REQ_PING"
        });
    }

    OnPing2Click()
    {
        this.OnPingClick();

        for (let i = 0; i < 10; ++i)
        {
            this.conn.Send({
                "type" : "REQ_PINGX"
            });
        }
    }

    OnMessageRepPing(msg)
    {
        let rtt = performance.now() - this.pingTimeStart;
        let rttStr = rtt.toFixed(1);
        
        this.ping1Time = msg["timeNow"];

        this.Debug(`Ping/Pong rtt ${rttStr} ms`);
    }

    OnMessageRepPing2(msg)
    {
        let ping2Time = msg["timeNow"];
        let rttMcu = ping2Time - this.ping1Time;
        this.ping1Time = ping2Time;

        this.Debug(`Ping/Pong MCU saw back-to-back ${rttMcu} us`);
    }
}
