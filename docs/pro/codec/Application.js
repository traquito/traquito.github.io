import { Base } from '../../search/spots/dashboard2/js/Base.js';
import { FieldDefinitionInputUiController } from '../../search/spots/dashboard2/js/FieldDefinitionInputUiController.js';
import { 
    WsprCodecUiEncodeController,
    WsprCodecUiDecodeController
} from './WsprCodecUiEncodeController.js';


export class Application
extends Base
{
    constructor(cfg)
    {
        super();

        // cache config
        this.cfg = cfg;

        // get handles for dom elements
        this.fieldDefinitionInputContainer = document.getElementById(this.cfg.fieldDefinitionInputContainerId);
        this.encodeContainer = document.getElementById(this.cfg.encodeContainerId);
        this.decodeContainer = document.getElementById(this.cfg.decodeContainerId);

        // create field def input
        this.fdi = new FieldDefinitionInputUiController();

        // create decoder ui
        this.dc = new WsprCodecUiDecodeController();
        
        // create encoder ui
        this.ec = new WsprCodecUiEncodeController();

        // construct
        this.fdi.SetModeNoPopup();
        this.fieldDefinitionInputContainer.appendChild(this.fdi.GetUI());
        this.decodeContainer.appendChild(this.dc.GetUI());
        this.encodeContainer.appendChild(this.ec.GetUI());

        // event wiring
        let OnEvent = () => { this.#UpdateUrlAndMaybeDoWork(); }

        this.fdi.SetOnApplyCallback(OnEvent);
        this.dc.SetOnClickCallback(OnEvent);
        this.ec.SetOnClickCallback(OnEvent);
    }

    OnEvent(evt)
    {
        switch (evt.type) {
            case "ON_URL_SET": this.#OnUrlSet(evt); break;
            case "ON_URL_GET": this.#OnUrlGet(evt); break;
        }
    }

    #OnUrlSet(evt)
    {
        let fieldDef = evt.Get(`codec`);
        if (fieldDef != undefined)
        {
            this.fdi.SetFieldDefinition(fieldDef);
        }
        this.dc.SetInputText(evt.Get(`decode`, this.#GetDefaultDecodeText()));
        this.ec.SetInputText(evt.Get(`encode`, this.#GetDefaultEncodeText()));

        this.#MaybeDoWork();
    }

    #OnUrlGet(evt)
    {
        let fieldDef;
        if (this.fdi.ok == false)
        {
            fieldDef = this.fdi.GetFieldDefinitionRaw();
        }
        else
        {
            fieldDef = this.fdi.GetFieldDefinition();
        }

        evt.Set("codec", fieldDef);
        evt.Set("decode", this.dc.GetInputText());
        evt.Set("encode", this.ec.GetInputText());

        // allow blank url parameters
        evt.allowBlank = true;
    }

    #GetDefaultDecodeText()
    {
        return `010LZX GN27 10
010LZX GN27 13`;
    }

    #GetDefaultEncodeText()
    {
        return `00 2 1500 12 15 4.4 7`;
    }

    #UpdateUrlAndMaybeDoWork()
    {
        this.Emit("REQ_URL_GET");

        this.#MaybeDoWork();
    }

    #MaybeDoWork()
    {
        if (this.fdi.ok)
        {
            this.#DoWork();
        }
    }

    #DoWork()
    {
        this.dc.SetFieldDefinition(this.fdi.GetFieldDefinition());
        this.dc.DoWork();

        this.ec.SetFieldDefinition(this.fdi.GetFieldDefinition());
        this.ec.DoWork();
    }
    
    Run()
    {
        super.Run();
    }
}
