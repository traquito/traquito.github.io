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
                this.OnRadioPowerStateChange(val);
            },
        });

        // set initial state
        this.OnDisconnected();
    }

    OnRadioPowerStateChange(on)
    {
        this.conn.Send({
            type: "REQ_RADIO_SET_POWER",
            on: on,
        });
        
        Event.OnEvent({type: "radioPower", on: on });
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "pre-disconnect": this.OnPreDisconnect(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "msg":
            switch (evt.msg.type) {
                case "REP_RADIO_SET_POWER": this.OnMsgRepSetPower(evt.msg); break;
            }
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
        // click the radio button on
        this.di.radioPower.SetValueAndTriggerIfChanged(true);
    }

    OnMsgRepSetPower(msg)
    {
        this.Enable();

        this.di.radioPower.SetValueAndTriggerIfChanged(msg.on == true);
    }

    OnPreDisconnect()
    {
        this.conn.Send({
            type: "REQ_RADIO_SET_POWER",
            on: false,
        });
    }

    OnDisconnected()
    {
        this.Disable();
        this.SetValueToDefault();
    }
}