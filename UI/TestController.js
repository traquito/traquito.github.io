import * as autl from './AppUtl.js';
import { Event } from './Event.js';


export class TestController
{
    Configure(cfg)
    {
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.callsign = document.getElementById(cfg.idCallsign);
        this.dom.grid4 = document.getElementById(cfg.idGrid4);
        this.dom.power = document.getElementById(cfg.idPower);
        this.dom.sendButton = document.getElementById(cfg.idSendButton);

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
                callsign: this.dom.callsign.value.trim(),
                grid: this.dom.grid4.value.trim(),
                power: this.dom.power.value.trim(),
            });
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
            }
        }
    }

    Enable()
    {
        this.dom.callsign.disabled = false;
        this.dom.grid4.disabled = false;
        this.dom.power.disabled = false;
        this.dom.sendButton.disabled = false;
    }

    Disable()
    {
        this.dom.callsign.disabled = true;
        this.dom.grid4.disabled = true;
        this.dom.power.disabled = true;
        this.dom.sendButton.disabled = true;
    }

    OnConnected()
    {
        this.Enable();
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
}
