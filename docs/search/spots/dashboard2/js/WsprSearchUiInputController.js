import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import {
    CollapsableTitleBox,
    DialogBox
} from './DomWidgets.js';
import { FieldDefinitionInputUiController } from './FieldDefinitionInputUiController.js';
import { WSPR } from '/js/WSPR.js';


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
            this.fdiList = [];

            this.ui = this.#MakeUI();

            this.cfg.container.appendChild(this.ui);

            // A user initiates this, so causing url serialization and
            // a history entry makes sense
            this.buttonInput.addEventListener('click', () => {
                let ok = this.#ValidateInputs();

                if (ok)
                {
                    this.Emit("REQ_URL_GET");

                    this.#Search();
                }
            });
        }
    }

    GetBand() { return this.bandSelect.value; }
    SetBand(val) { this.bandSelect.value = val; }

    GetChannel() { return this.channelInput.value; }
    SetChannel(val) { this.channelInput.value = val; }

    GetCallsign() { return this.callsignInput.value.toUpperCase(); }
    SetCallsign(val) { this.callsignInput.value = val }

    GetGte() { return this.gteInput.value; }
    SetGte(val) { this.gteInput.value = val; }

    GetLte() { return this.#ConvertLte(this.lteInput.value); }
    GetLteRaw() { return this.lteInput.value; }
    SetLte(val) { this.lteInput.value = val; }
    #ConvertLte(lte)
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
            case "ON_URL_SET": this.#OnUrlSet(evt); break;
            case "ON_URL_GET": this.#OnUrlGet(evt); break;
            case "SEARCH_COMPLETE": this.#OnSearchComplete(); break;
        }
    }

    #OnUrlSet(evt)
    {
        this.SetBand(WSPR.GetDefaultBandIfNotValid(evt.Get("band", "20m")));
        this.SetChannel(WSPR.GetDefaultChannelIfNotValid(evt.Get("channel", "")));
        this.SetCallsign(evt.Get("callsign", ""));
        this.SetGte(evt.Get("dtGte", ""));
        this.SetLte(evt.Get("dtLte", ""));

        for (let slot = 0; slot < 5; ++slot)
        {
            // set what could be a blank field
            this.fdiList[slot].SetFieldDefinition(evt.Get(`slot${slot}FieldDef`, ""));

            // trigger logic elsewhere to update display of slot header
            this.fdiList[slot].GetOnApplyCallback()(false);
        }

        this.#ValidateInputsAndMaybeSearch();
    }

    #OnUrlGet(evt)
    {
        evt.Set("band", this.GetBand());
        evt.Set("channel", this.GetChannel());
        evt.Set("callsign", this.GetCallsign());
        evt.Set("dtGte", this.GetGte());
        evt.Set("dtLte", this.GetLteRaw());

        for (let slot = 0; slot < 5; ++slot)
        {
            evt.Set(`slot${slot}FieldDef`, this.fdiList[slot].GetFieldDefinition());
        }
    }

    #ValidateInputs()
    {
        let ok = true;

        if (this.GetCallsign() == "")
        {
            ok = false;
            this.callsignInput.style.backgroundColor = "pink";
        }
        else
        {
            this.callsignInput.style.backgroundColor = "white";
            this.callsignInput.style.backgroundColor = "";
        }

        if (this.GetGte() == "")
        {
            ok = false;
            this.gteInput.style.backgroundColor = "pink";
        }
        else
        {
            this.gteInput.style.backgroundColor = "";
        }

        if (this.GetGte() != "" && this.GetLteRaw() != "")
        {
            const d1 = Date.parse(this.GetGte());
            const d2 = Date.parse(this.GetLteRaw());

            if (d2 < d1)
            {
                ok = false;

                this.gteInput.style.backgroundColor = "pink";
                this.lteInput.style.backgroundColor = "pink";
            }
            else
            {
                this.lteInput.style.backgroundColor = "";
            }
        }
        else
        {
            this.lteInput.style.backgroundColor = "";
        }

        return ok;
    }

    #Search()
    {
        let fieldDefinitionList = [];
        for (let fdi of this.fdiList)
        {
            fieldDefinitionList.push(fdi.GetFieldDefinition());
        }

        this.Emit({
            type: "SEARCH_REQUESTED",
            fieldDefinitionList,
        });

        this.#OnSearchStart();
    }

    #ValidateInputsAndMaybeSearch()
    {
        let ok = this.#ValidateInputs();

        if (ok)
        {
            this.#Search();
        }

        return ok;
    }

    #OnSearchStart()
    {
        this.spinner.style.animationPlayState = "running";
    }

    #OnSearchComplete()
    {
        this.spinner.style.animationPlayState = "paused";
    }

    #SubmitOnEnter(e)
    {
        if (e.key === "Enter")
        {
            e.preventDefault();
            this.buttonInput.click();
        }
    }

    #NoSpaces(e)
    {
        let retVal = true;

        if (e.which === 32)
        {
            e.preventDefault();
            retVal = false;
        }

        return retVal;
    }

    #MakeConfigurationButtonInput()
    {
        let button = document.createElement('button');
        button.innerHTML = "⚙️";
        button.style.padding = '1px';

        let container = document.createElement('span');
        container.appendChild(button);

        // activate dialog box
        let dialogBox = new DialogBox();
        document.body.appendChild(dialogBox.GetUI());

        dialogBox.SetTitleBar("⚙️ UserDefined Field Definition Configuration");
        button.addEventListener('click', () => {
            dialogBox.ToggleShowHide();
        });

        // get place to put dialog box contents
        let dbContainer = dialogBox.GetContentContainer();
        // stack inputs
        dbContainer.style.display = "flex";
        dbContainer.style.flexDirection = "column";
        dbContainer.style.gap = "2px";
        dbContainer.style.maxHeight = "700px";
 
        // build interface for all slots
        for (let slot = 0; slot < 5; ++slot)
        {
            // make a collapsing title box for each input
            let titleBox = new CollapsableTitleBox();
            titleBox.SetTitle(`Slot ${slot}`)
            let titleBoxUi = titleBox.GetUI();
            let titleBoxContainer = titleBox.GetContentContainer();
            titleBox.SetMinWidth('813px');

            // get a field definition input to put in the title box
            let fdi = new FieldDefinitionInputUiController();
            this.fdiList.push(fdi);
            let fdiUi = fdi.GetUI();
            fdi.SetDisplayName(`Slot${slot}`);
            fdi.SetDownloadFileNamePart(`Slot${slot}`);

            let suffix = "";
            
            // set field def
            fdi.SetOnApplyCallback((preventUrlGet) => {
                // console.log(`slot ${slot} field def updated`);
                let fieldDef = fdi.GetFieldDefinition();
                // console.log(fieldDef);

                suffix = fieldDef == "" ? "" : " (set)";

                titleBox.SetTitle(`Slot ${slot}${suffix}`)

                // trigger url update unless asked not to (eg by simulated call)
                if (preventUrlGet !== false)
                {
                    this.Emit("REQ_URL_GET");
                }
            });

            fdi.SetOnErrStateChangeCallback((ok) => {
                if (ok == false)
                {
                    titleBox.SetTitle(`Slot ${slot} (err)`);
                }
                else
                {
                    titleBox.SetTitle(`Slot ${slot}${suffix}`)
                }
            });

            // pack the field def input into the title box
            titleBoxContainer.appendChild(fdiUi);

            // pack the titleBox into the dialog box
            dbContainer.appendChild(titleBoxUi);
        }

        return [container, button];
    }

    #MakeBandInput()
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

    #MakeChannelInput()
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

        input.addEventListener("keypress", e => this.#SubmitOnEnter(e));
        input.addEventListener("keydown", e => this.#NoSpaces(e));

        return [container, input];
    }

    #MakeCallsignInput()
    {
        let input = document.createElement('input');
        input.title       = "callsign";
        input.placeholder = "callsign";
        input.size        = "7";

        input.style.textTransform = "uppercase";

        let label = document.createElement('label');
        label.innerHTML = "Callsign ";
        label.appendChild(input);

        let container = document.createElement('span');
        container.title = input.title;
        container.appendChild(label);

        input.addEventListener("keypress", e => this.#SubmitOnEnter(e));
        input.addEventListener("keydown", e => this.#NoSpaces(e));

        return [container, input];
    }

    #MakeSearchButtonInput()
    {
        let button = document.createElement('button');
        button.innerHTML = "search";

        return [button, button];
    }

    #MakeSpinner()
    {
        // Create the main spinner container
        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'spinner-container';

        // Create the spinner element
        const spinner = document.createElement('div');
        spinner.className = 'spinner';

        // Append spinner to the container
        spinnerContainer.appendChild(spinner);

        // Add CSS styles dynamically
        const style = document.createElement('style');
        style.textContent = `
            .spinner-container {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                position: relative;
                width: 12px;
                height: 12px;
            }
            .spinner {
                width: 9px;
                height: 9px;
                border: 2px solid #f3f3f3; /* Light gray */
                border-top: 2px solid #3498db; /* Blue */
                border-radius: 50%;
                animation: spin 1.5s linear infinite;
            }
            @keyframes spin {
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            }
        `;
        document.head.appendChild(style);

        // Return the spinner container
        return [spinnerContainer, spinner];
    }

    #MakeGteInput()
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

        input.addEventListener("keypress", e => this.#SubmitOnEnter(e));
        input.addEventListener("keydown", e => this.#NoSpaces(e));

        return [container, input];
    }

    #MakeLteInput()
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

        input.addEventListener("keypress", e => this.#SubmitOnEnter(e));
        input.addEventListener("keydown", e => this.#NoSpaces(e));

        return [container, input];
    }

    #MakeUI()
    {
        this.domContainer = document.createElement('span');

        // create
        let [buttonConfigContainer,    buttonConfig]    = this.#MakeConfigurationButtonInput();
        let [bandSelectInputContainer, bandSelectInput] = this.#MakeBandInput();
        let [channelInputContainer,    channelInput]    = this.#MakeChannelInput();
        let [callsignInputContainer,   callsignInput]   = this.#MakeCallsignInput();
        let [buttonInputContainer,     buttonInput]     = this.#MakeSearchButtonInput();
        let [spinnerContainer,         spinner]         = this.#MakeSpinner();
        let [gteInputContainer,        gteInput]        = this.#MakeGteInput();
        let [lteInputContainer,        lteInput]        = this.#MakeLteInput();

        // keep the spinner paused to start
        spinner.style.animationPlayState = "paused";

        // assemble
        let container = document.createElement('span');

        container.appendChild(buttonConfigContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(bandSelectInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(channelInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(callsignInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(buttonInputContainer);
        container.appendChild(document.createTextNode(" "));
        
        container.appendChild(spinnerContainer);
        container.appendChild(document.createTextNode(" "));

        container.appendChild(gteInputContainer);
        container.appendChild(document.createTextNode(" "));
        container.appendChild(lteInputContainer);

        // capture
        this.buttonConfig  = buttonConfig;
        this.bandSelect    = bandSelectInput;
        this.channelInput  = channelInput;
        this.callsignInput = callsignInput;
        this.buttonInput   = buttonInput;
        this.spinner       = spinner;
        this.gteInput      = gteInput;
        this.lteInput      = lteInput;
        
        this.ui = container;

        return this.ui;
    }
}


