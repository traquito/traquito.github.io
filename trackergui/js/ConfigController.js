import * as utl from '/js/Utl.js';
import { WSPR } from '/js/WSPR.js';
import * as autl from './AppUtl.js';
import { DomInput, DomInputGroup } from './DomInput.js';
import { Event } from './Event.js';
import { WorkAccumulator } from './WorkAccumulator.js';


export class ConfigController
{
    Configure(cfg)
    {
        this.dbg  = cfg.dbg;
        this.conn = cfg.conn;
        this.accum = new WorkAccumulator(1, 60);    // based on observations of data loss

        Event.AddHandler(this);

        this.dom = {};
        this.dom.band       = document.getElementById(cfg.idBand);
        this.dom.channel    = document.getElementById(cfg.idChannel);
        this.dom.callsign   = document.getElementById(cfg.idCallsign);
        this.dom.saveButton = document.getElementById(cfg.idSaveButton);
        this.dom.restoreButton = document.getElementById(cfg.idRestoreButton);
        this.dom.defaultButton = document.getElementById(cfg.idDefaultButton);
        this.dom.freq = document.getElementById(cfg.idFreq);
        this.dom.correctionNumber = document.getElementById(cfg.idCorrectionNumber);
        this.dom.correctionRange = document.getElementById(cfg.idCorrectionRange);

        this.callsignEverSeenGood = false;
        this.firstConfigSeen = true;

        // event handling
        this.dom.saveButton.addEventListener("click", e => {
            if (this.Validate(true))
            {
                this.Disable();
    
                this.conn.Send({
                    type: "REQ_SET_CONFIG",
                    band: this.dom.band.value.trim(),
                    channel: this.dom.channel.value.trim(),
                    callsign: this.di.callsign.GetValue().toUpperCase(),
                    correction: this.di.correction.GetValue(),
                });
            }
        });
        this.dom.restoreButton.addEventListener("click", e => {
            if (this.callsignEverSeenGood)
            {
                this.GetCleanConfig();
            }
            else
            {
                autl.ToastWarn("Please save successfully first");
            }
        });
        this.dom.defaultButton.addEventListener("click", e => {
            this.SetValueToDefaultAndCheck();
            this.OnChange();
        });

        autl.ScrollableNumber(this.dom.correctionNumber);
        autl.ScrollableNumber(this.dom.correctionRange);

        // state keeping
        this.di = {};
        this.di.band = new DomInput({
            dom: this.dom.band,
            fnOnChange: val => {
                this.OnFrequencyKnown();
                this.OnChange();
            }
        });
        this.di.channel = new DomInput({
            dom: this.dom.channel,
            fnOnChange: val => { 
                this.OnFrequencyKnown();
                this.OnChange();
            }
        });
        this.di.callsign = new DomInput({ dom: this.dom.callsign });

        this.di.freq = new DomInput({
            dom: this.dom.freq,
            log: true,
        });

        this.di.correction =
            new DomInputGroup([
                this.dom.correctionNumber,
                this.dom.correctionRange
            ], val => {
                this.accum.Queue(() => {
                    this.OnChange();
                });
            });


        // set initial state
        this.OnDisconnected();
    }

    Disable()
    {
        this.di.band.Disable();
        this.di.channel.Disable();
        this.di.callsign.Disable();
        this.dom.saveButton.disabled = true;
        this.dom.restoreButton.disabled = true;
        this.dom.defaultButton.disabled = true;
        this.di.freq.Disable();
        this.di.correction.Disable();

        this.accum.Clear();
    }
    
    Enable()
    {
        this.di.band.Enable();
        this.di.channel.Enable();
        this.di.callsign.Enable();
        this.dom.saveButton.disabled = false;
        this.dom.restoreButton.disabled = false;
        this.dom.defaultButton.disabled = false;
        this.di.freq.Enable();
        this.di.correction.Enable();
    }

    SetValueToDefault()
    {
        this.di.band.SetValueToDefault();
        this.di.channel.SetValueToDefault();
        this.di.callsign.SetValueToDefault();
        this.di.freq.SetValueToDefault();
        this.di.correction.SetValueToDefault();
    }

    SetValueToDefaultAndCheck()
    {
        let callsignBefore = this.di.callsign.GetValue().toUpperCase();

        this.SetValueToDefault();

        // don't let the button click blank out callsign
        this.di.callsign.SetValue(callsignBefore);


        this.di.band.OnBaselineChangeCheck();
        this.di.channel.OnBaselineChangeCheck();
        this.di.callsign.OnBaselineChangeCheck();
        this.di.freq.OnBaselineChangeCheck();
        this.di.correction.OnBaselineChangeCheck();
    }

    SaveValueBaseline()
    {
        this.di.band.SaveValueBaseline();
        this.di.channel.SaveValueBaseline();
        this.di.callsign.SaveValueBaseline();
        this.di.freq.SaveValueBaseline();
        this.di.correction.SaveValueBaseline();
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
                    case "REP_GET_CONFIG": this.OnMessageRepGetConfig(evt.msg); break;
                    case "REP_SET_CONFIG": this.OnMessageRepSetConfig(evt.msg); break;
                }
        }
    }

    OnConnected()
    {
        this.firstConfigSeen = true;
        
        this.GetCleanConfig();
    }

    GetCleanConfig()
    {
        this.conn.Send({
            type: "REQ_RESTORE_CONFIG",
        });
        this.conn.Send({
            type: "REQ_GET_CONFIG",
        });
    }

    OnDisconnected()
    {
        this.Disable();

        this.SetValueToDefault();

        this.callsignEverSeenGood = false;
    }

    Validate(warnOnBlankChannel)
    {
        let retVal = false;

        let channel = this.di.channel.GetValue();

        if (channel == "")
        {
            if (warnOnBlankChannel)
            {
                autl.ToastErr("Invalid Channel");
            }
        }
        else if (channel < 0 || channel > 599)
        {
            autl.ToastErr("Invalid Channel");
        }
        else
        {
            retVal = true;
        }

        return retVal;
    }

    OnChange(val)
    {
        if (this.Validate())
        {
            this.conn.Send({
                type: "REQ_SET_CONFIG_TEMP",
                band: this.di.band.GetValue(),
                channel: this.di.channel.GetValue(),
                correction: this.di.correction.GetValue(),
            }, false);
        }
    }

    OnMessageRepGetConfig(msg)
    {
        this.Enable();

        this.di.band.SetValueAsBaseline(msg["band"]);
        this.di.channel.SetValueAsBaseline(msg["channel"]);
        this.di.callsign.SetValueAsBaseline(msg["callsign"]);
        this.di.correction.SetValueAsBaseline(msg["correction"]);

        if (msg["callsignOk"] != true)
        {
            this.di.channel.SetValueAsBaseline("");
            this.di.channel.SetErrorState();
            this.di.callsign.SetValueAsBaseline("");
            this.di.callsign.SetErrorState();
        }

        this.OnFrequencyKnown();

        this.di.freq.SetValueAsBaseline(this.di.freq.GetValue());

        this.OnChange();

        let callsignOk = msg["callsignOk"];

        if (callsignOk == false)
        {
            this.di.callsign.SetErrorState();

            if (this.firstConfigSeen)
            {
                setTimeout(() => {
                    autl.ToastDialog(
                        `You have a new tracker it seems!
                        
                        Please make sure to save when you're done
                        setting up WSPR and and SI5351 configuration.

                        Enjoy!
                        `
                    );
                }, 1700);
            }
        }
        else
        {
            this.callsignEverSeenGood = true;
        }

        this.firstConfigSeen = false;
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

            this.callsignEverSeenGood = true;
        }
        else
        {
            autl.ToastErr(`Could not save: "${err}"`);
            
            this.di.callsign.SetErrorState();
        }
    }

    OnFrequencyKnown()
    {
        let band = this.di.band.GetValue();
        let channel = this.di.channel.GetValue();

        let channelDetails = WSPR.GetChannelDetails(band, channel);

        let val = utl.Commas(channelDetails.freqDial) + " + 1,500Hz";

        this.di.freq.SetValue(val);
        this.di.freq.OnBaselineChangeCheck();
    }
}
