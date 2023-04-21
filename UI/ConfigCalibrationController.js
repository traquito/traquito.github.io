import * as utl from '/js/Utl.js';
import * as autl from './AppUtl.js';
import { DomInput } from './DomInput.js';
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
        this.di = {};
        this.di.freq = new DomInput({
            dom: this.dom.freq,
            log: true,
        });
        this.di.correction = new DomInput({
            dom: this.dom.correction,
        });

        // set initial state
        this.OnDisconnected();
    }

    Disable()
    {
        this.di.correction.Disable();
    }
    
    Enable()
    {
        this.di.correction.Enable();
    }

    SetValueToDefault()
    {
        this.di.freq.SetValueToDefault();
        this.di.correction.SetValueToDefault();
    }

    SaveValueBaseline()
    {
        this.di.correction.SaveValueBaseline();
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "connected": this.OnConnected(); break;
            case "disconnected": this.OnDisconnected(); break;
            case "radioPower": this.OnRadio(evt.on); break;
            case "freqLane": this.OnFreqLane(evt.freq); break;
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

    OnMessageRepGetCalibration(msg)
    {
        this.di.correction.SetValueAsBaseline(msg["correction"]);

        let correctionOk = msg["correctionOk"];

        if (correctionOk == false)
        {
            this.di.correction.SetErrorState();
        }
    }

    OnRadio(on)
    {
        if (on) { this.Enable(); }
           else { this.Disable(); }
    }

    OnFreqLane(freq)
    {
        this.di.freq.SetValue(utl.Commas(freq));
    }

    OnDisconnected()
    {
        this.Disable();

        this.SetValueToDefault();
    }

    OnMessageRepSetCalibration(msg)
    {
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
            
            this.di.correction.SetErrorState();
        }
    }
}
