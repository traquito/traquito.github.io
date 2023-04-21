import * as autl from './AppUtl.js';
import { DomInput } from './DomInput.js';
import { Event } from './Event.js';


export class ConfigWsprController
{
    Configure(cfg)
    {
        this.dbg  = cfg.dbg;
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.band       = document.getElementById(cfg.idBand);
        this.dom.channel    = document.getElementById(cfg.idChannel);
        this.dom.callsign   = document.getElementById(cfg.idCallsign);
        this.dom.saveButton = document.getElementById(cfg.idSaveButton);

        // event handling
        this.dom.saveButton.addEventListener("click", e => {
            this.Disable();

            this.conn.Send({
                type: "REQ_SET_WSPR_CONFIG",
                band: this.dom.band.value.trim(),
                channel: this.dom.channel.value.trim(),
                callsign: this.di.callsign.GetValue(),
            });
        });

        // state keeping
        this.di = {};
        this.di.band = new DomInput({ dom: this.dom.band });
        this.di.channel = new DomInput({ dom: this.dom.channel });
        this.di.callsign = new DomInput({ dom: this.dom.callsign });

        // set initial state
        this.OnDisconnected();
    }

    Disable()
    {
        this.di.band.Disable();
        this.di.channel.Disable();
        this.di.callsign.Disable();
        this.dom.saveButton.disabled = true;
    }
    
    Enable()
    {
        this.di.band.Enable();
        this.di.channel.Enable();
        this.di.callsign.Enable();
        this.dom.saveButton.disabled = false;
    }

    SetValueToDefault()
    {
        this.di.band.SetValueToDefault();
        this.di.channel.SetValueToDefault();
        this.di.callsign.SetValueToDefault();
    }

    SaveValueBaseline()
    {
        this.di.band.SaveValueBaseline();
        this.di.channel.SaveValueBaseline();
        this.di.callsign.SaveValueBaseline();
    }
    
    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "msg":
                switch (evt.msg.type) {
                    case "REP_GET_WSPR_CONFIG": this.OnMessageRepGetConfig(evt.msg); break;
                    case "REP_SET_WSPR_CONFIG": this.OnMessageRepSetConfig(evt.msg); break;
                }
        }
    }

    OnConnected()
    {
        this.conn.Send({
            "type": "REQ_GET_WSPR_CONFIG",
        });
    }

    OnDisconnected()
    {
        this.Disable();

        this.SetValueToDefault();
    }

    OnMessageRepGetConfig(msg)
    {
        this.Enable();

        this.di.band.SetValueAsBaseline(msg["band"]);
        this.di.channel.SetValueAsBaseline(msg["channel"]);
        this.di.callsign.SetValueAsBaseline(msg["callsign"]);

        let callsignOk = msg["callsignOk"];

        if (callsignOk == false)
        {
            this.di.callsign.SetErrorState();
        }
    }

    OnMessageRepSetConfig(msg)
    {
        this.Enable();

        let ok = msg["ok"];
        let err = msg["err"];

        if (ok)
        {
            autl.ToastOk("Saved");

            this.SaveValueBaseline();
        }
        else
        {
            autl.ToastErr(`Could not save: "${err}"`);
            
            this.di.callsign.SetErrorState();
        }
    }
}
