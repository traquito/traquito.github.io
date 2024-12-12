import * as utl from '/js/Utl.js';

import { WSPR } from '/js/WSPR.js';
import { Base } from './Base.js';


// todo
// - make hitting enter on input fields trigger search
// - all caps inputs
// - validate and prevent bad input formats
//
// grey out until told complete?



export class WsprSearchUiInputController
extends Base
{
    constructor(cfg)
    {
        super();

        this.cfg = cfg;

        this.ok = this.cfg.container;

        if (this.ok)
        {
            this.ui = this.MakeUI();

            this.cfg.container.appendChild(this.ui);

            // A user initiates this, so causing url serialization and
            // a history entry makes sense
            this.buttonInput.addEventListener('click', () => {
                this.Emit("REQ_URL_GET");

                this.ValidateInputsAndMaybeSearch();
            });
        }
    }

    GetBand() { return this.bandSelect.value; }
    SetBand(val) { this.bandSelect.value = val; }

    GetChannel() { return this.channelInput.value; }
    SetChannel(val) { this.channelInput.value = val; }

    GetCallsign() { return this.callsignInput.value; }
    SetCallsign(val) { this.callsignInput.value = val }

    GetGte() { return this.gteInput.value; }
    SetGte(val) { this.gteInput.value = val; }

    GetLte() { return this.ConvertLte(this.lteInput.value); }
    GetLteRaw() { return this.lteInput.value; }
    SetLte(val) { this.lteInput.value = val; }
    ConvertLte(lte)
    {
        // let the end time (date) be inclusive
        // so if you have 2023-04-28 as the end date, everything for the entire
        // day should be considered.
        // since the querying system wants a cutoff date (lte datetime), we
        // just shift the date of today forward by an entire day, changing it from
        // a cutoff of today at morning midnight to tomorrow at morning midnight.
        // throw in an extra hour for daylight savings time scenarios

        let retVal = lte;
        if (lte != "")
        {
            let ms = utl.ParseTimeToMs(lte);
            ms += (25 * 60 * 60 * 1000);
    
            retVal = utl.MakeDateFromMs(ms);
        }

        return retVal;
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "ON_URL_SET": this.OnUrlSetSet(evt); break;
            case "ON_URL_GET": this.OnUrlSetGet(evt); break;
        }
    }

    OnUrlSetSet(evt)
    {
        this.SetBand(WSPR.GetDefaultBandIfNotValid(evt.Get("band", "20m")));
        this.SetChannel(WSPR.GetDefaultChannelIfNotValid(evt.Get("channel", "")));
        this.SetCallsign(evt.Get("callsign", ""));
        this.SetGte(evt.Get("dtGte", ""));
        this.SetLte(evt.Get("dtLte", ""));

        this.ValidateInputsAndMaybeSearch();
    }

    OnUrlSetGet(evt)
    {
        evt.Set("band", this.GetBand());
        evt.Set("channel", this.GetChannel());
        evt.Set("callsign", this.GetCallsign());
        evt.Set("dtGte", this.GetGte());
        evt.Set("dtLte", this.GetLteRaw());
    }

    ValidateInputsAndMaybeSearch()
    {
        if (1)
        {
            this.Emit("SEARCH_REQUESTED");
        }
    }

    MakeBandInput()
    {
        let bandList = [
            "2190m",
            "630m",
            "160m",
            "80m",
            "60m",
            "40m",
            "30m",
            "20m",
            "17m",
            "15m",
            "12m",
            "10m",
            "6m",
            "4m",
            "2m",
            "70cm",
            "23cm",
        ];

        let select = document.createElement('select');

        for (let band of bandList)
        {
            let option = document.createElement('option');

            option.value = band;

            if (band == "2190m")
            {
                option.innerHTML = `${band} (HF)`;
            }
            else if (band == "630m")
            {
                option.innerHTML = `${band} (MF)`;
            }
            else
            {
                option.innerHTML = band;
            }

            select.appendChild(option);
        }
        select.value = "20m";

        let label = document.createElement('label');
        label.innerHTML = "Band ";
        label.appendChild(select);

        let container = document.createElement('span');
        container.appendChild(label);

        return [container, select];
    }

    MakeChannelInput()
    {
        let input = document.createElement('input');
        input.type  = "number";
        input.min   = 0;
        input.max   = 599;
        input.title = "Optional, use if you have a Channel-aware tracker"

        let label = document.createElement('label');
        label.innerHTML = "Channel ";
        label.appendChild(input);

        let container = document.createElement('span');
        container.title = input.title;
        container.appendChild(label);

        return [container, input];
    }

    MakeCallsignInput()
    {
        let input = document.createElement('input');
        input.title       = "callsign";
        input.placeholder = "callsign";
        input.size        = "7";

        let label = document.createElement('label');
        label.innerHTML = "Callsign ";
        label.appendChild(input);

        let container = document.createElement('span');
        container.title = input.title;
        container.appendChild(label);

        return [container, input];
    }

    MakeSearchButtonInput()
    {
        let button = document.createElement('button');
        button.innerHTML = "search";

        return [button, button];
    }

    MakeGteInput()
    {
        let input = document.createElement('input');
        input.placeholder = "YYYY-MM-DD";
        input.required    = true;
        input.title       = "Start date (required)"
        input.pattern     = "\d{4}-\d{2}-\d{2}";
        input.spellcheck  = false;
        input.size        = "10";
        input.maxLength   = "10";

        let label = document.createElement('label');
        label.innerHTML = "Start ";
        label.appendChild(input);

        let container = document.createElement('span');
        container.title = input.title;
        container.appendChild(label);

        return [container, input];
    }

    MakeLteInput()
    {
        let input = document.createElement('input');
        input.placeholder = "YYYY-MM-DD";
        input.required    = true;
        input.title       = "End date (optional)"
        input.pattern     = "\d{4}-\d{2}-\d{2}";
        input.spellcheck  = false;
        input.size        = "10";
        input.maxLength   = "10";

        let label = document.createElement('label');
        label.innerHTML = "End ";
        label.appendChild(input);

        let container = document.createElement('span');
        container.title = input.title;
        container.appendChild(label);

        return [container, input];
    }

    MakeUI()
    {
        this.domContainer = document.createElement('span');

        // create
        let [bandSelectInputContainer, bandSelectInput] = this.MakeBandInput();
        let [channelInputContainer,    channelInput]    = this.MakeChannelInput();
        let [callsignInputContainer,   callsignInput]   = this.MakeCallsignInput();
        let [buttonInputContainer,     buttonInput]     = this.MakeSearchButtonInput();
        let [gteInputContainer,        gteInput]        = this.MakeGteInput();
        let [lteInputContainer,        lteInput]        = this.MakeLteInput();

        // assemble
        let container = document.createElement('span');

        container.appendChild(bandSelectInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(channelInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(callsignInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(buttonInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(gteInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(lteInputContainer);

        // capture
        this.bandSelect    = bandSelectInput;
        this.channelInput  = channelInput;
        this.callsignInput = callsignInput;
        this.buttonInput   = buttonInput;
        this.gteInput      = gteInput;
        this.lteInput      = lteInput;
        
        this.ui = container;

        return this.ui;
    }
}


