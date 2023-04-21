import * as autl from './AppUtl.js';
import { Event } from './Event.js';

export class ConfigCalibrationController
{
    Configure(cfg)
    {
        this.dbg  = cfg.dbg;
        this.conn = cfg.conn;

        Event.AddHandler(this);

        this.dom = {};
        this.dom.freq       = document.getElementById(cfg.idFreq);
        this.dom.correction = document.getElementById(cfg.idCorrection);

        // state keeping
        this.ds = {};
        this.ds.freq = new autl.DomState({
            dom: this.dom.freq,
        });
        this.ds.correction = new autl.DomState({
            dom: this.dom.correction,
        });

        // set initial state
        this.OnDisconnected();
    }

    Disable()
    {
        this.ds.correction.Disable();
    }
    
    Enable()
    {
        this.ds.correction.Enable();
    }

    SetValueToDefault()
    {
        this.ds.freq.SetValueToDefault();
        this.ds.correction.SetValueToDefault();
    }

    SaveValueBaseline()
    {
        this.ds.correction.SaveValueBaseline();
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "msg":
                switch (evt.msg.type) {
                    case "REP_GET_CALIBRATION_CONFIG": this.OnMessageRepGetCalibration(evt.msg); break;
                    case "REP_SET_CALIBRATION_CONFIG": this.OnMessageRepSetCalibration(evt.msg); break;
                }
        }
    }

    OnConnected()
    {
        this.conn.Send({
            "type": "REQ_GET_CALIBRATION_CONFIG",
        });
    }

    OnDisconnected()
    {
        this.Disable();

        this.SetValueToDefault();
    }

    OnMessageRepGetCalibration(msg)
    {
        this.Enable();

        // this.ds.freq.SetValueAsBaseline(msg["band"]);
        this.ds.correction.SetValueAsBaseline(msg["correction"]);

        let correctionOk = msg["correctionOk"];

        if (correctionOk == false)
        {
            this.ds.correction.SetErrorState();
        }
    }

    OnMessageRepSetCalibration(msg)
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
            ToastErr(`Could not save: "${err}"`);
            
            this.ds.correction.SetErrorState();
        }
    }
}
