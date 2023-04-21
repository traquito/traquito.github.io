import { DomInput } from './DomInput.js';
import { Event } from './Event.js';

export class RadioController
{
    Configure(cfg)
    {
        this.dbg  = cfg.dbg;
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.radioPower = document.getElementById(cfg.idRadioPower);

        // state keeping
        this.di = {};
        this.di.radioPower = new DomInput({
            dom: this.dom.radioPower,
            fnOnChange: val => {
                console.log(`radio power on/off now: ${val}`);
            },
        });

        // set initial state
        this.OnDisconnected();
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "pre-disconnect": this.OnPreDisconnect(); break;
            case "disconnected": this.OnDisconnected(); break;
        }
    }

    Enable()
    {
        this.di.radioPower.Enable();
    }

    Disable()
    {
        this.di.radioPower.Disable();
    }

    SetValueToDefault()
    {
        this.di.radioPower.SetValueToDefault();
    }

    OnConnected()
    {
        this.Enable();
    }

    OnPreDisconnect()
    {
        console.log("pre-disconnect");
    }

    OnDisconnected()
    {
        this.Disable();
        this.SetValueToDefault();
    }
}