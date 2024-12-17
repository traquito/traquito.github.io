import { Base } from '../../search/spots/dashboard2/js/Base.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { WsprCodecMaker } from './WsprCodec.js';


class WsprCodecUiEncodeDecodeBase
extends Base
{
    constructor()
    {
        super();

        this.onClickCb = () => {};

        this.codecMaker = new WsprCodecMaker();
        this.codecMaker.SetDebug(true);
        this.fieldDef = "";

        this.#MakeUI();
        this.#Style();
        this.#SetupEvents();
    }

    GetUI()
    {
        return this.ui;
    }

    SetBannerText(val)
    {
        this.banner.innerHTML = val;
    }

    SetInputText(val)
    {
        this.textInput.value = val;
    }

    GetInputText()
    {
        return this.textInput.value;
    }

    SetButtonText(val)
    {
        this.button.innerHTML = val;
    }

    SetOnClickCallback(fn)
    {
        this.onClickCb = fn;
    }

    SetFieldDefinition(fieldDef)
    {
        this.fieldDef = fieldDef;
        this.codecMaker.SetCodecDefFragment("MyMessageType", this.fieldDef);
    }

    DoWork()
    {
        // virtual
    }

    #SetupEvents()
    {
        this.button.addEventListener('click', () => {
            this.onClickCb();
        });
    }

    #Style()
    {
        this.actionContainer.style.display = "inline-flex";

        this.textInput.style.textTransform = "uppercase";
        this.textInput.style.resize = "both";
        this.textInput.style.height = "300px";
        this.textInput.style.minWidth = "280px";

        this.textOutput.style.resize = "both";
        this.textOutput.style.height = "300px";
        this.textOutput.style.minWidth = "420px";
    }

    #MakeUI()
    {
        // main container
        this.ui = document.createElement("div");

        // banner
        this.banner = document.createElement('div');

        // container for input/button/output
        this.actionContainer = document.createElement('div');

        // input
        this.textInput = document.createElement("textarea");
        this.textInput.spellcheck = false;

        // button
        this.button = document.createElement('button');

        // output
        this.textOutput = document.createElement("textarea");
        this.textOutput.spellcheck = false;
        this.textOutput.disabled = true;
        this.textOutput.readonly = true;

        // assemble
        this.actionContainer.appendChild(this.textInput);
        this.actionContainer.appendChild(this.button);
        this.actionContainer.appendChild(this.textOutput);

        this.ui.appendChild(this.banner);
        this.ui.appendChild(this.actionContainer);

        return this.ui;
    }
}



/////////////////////////////////////////////////////////////////////
// Decode
/////////////////////////////////////////////////////////////////////

export class WsprCodecUiDecodeController
extends WsprCodecUiEncodeDecodeBase
{
    constructor()
    {
        super();

        super.SetBannerText(`Decode: callsign, grid4, powerDbm`);
        super.SetButtonText("Click<br/>to<br/>Decode");
    }

    DoWork()
    {
        this.#DoDecode(this.textInput.value.toUpperCase());
    }

    #DoDecode(lineListStr)
    {
        let c = this.codecMaker.GetCodecInstance();
        const fieldList = c.GetFieldList();

        // process and output
        this.textOutput.value = "";

        let lineList = lineListStr.split("\n");
        for (let line of lineList)
        {
            let linePartList = line.trim().split(/\s+/);
            
            if (linePartList.length == 3)
            {
                let call     = linePartList[0];
                let grid     = linePartList[1];
                let powerDbm = linePartList[2];
                

                let ret = WSPREncoded.DecodeU4BGridPower(grid, powerDbm);
                
                if (ret.msgType == "standard")
                {
                    let [grid56, altM] = WSPREncoded.DecodeU4BCall(call);
                    let [tempC, voltage, speedKnots, gpsValid] = ret.data;

                    let id1 = call.substring(0, 1);
                    let id3 = call.substring(2, 3);

                    this.textOutput.value += `=====================================================\n`;
                    this.textOutput.value += `${call} ${grid} ${powerDbm}` + `\n`;
                    this.textOutput.value += `[BT: (id13: ${id1}${id3})]`  + `\n`;
                    this.textOutput.value += `=====================================================\n`;
    
                    this.textOutput.value += `grid      : ....${grid56}`   + `\n`;
                    this.textOutput.value += `altM      : ${altM}`         + `\n`;
                    this.textOutput.value += `tempC     : ${tempC}`        + `\n`;
                    this.textOutput.value += `voltage   : ${voltage}`      + `\n`;
                    this.textOutput.value += `speedKnots: ${speedKnots}`   + `\n`;
                    this.textOutput.value += `gpsValid  : ${gpsValid}`     + `\n`;
                }
                else
                {
                    c.Reset();

                    c.SetCall(call);
                    c.SetGrid(grid);
                    c.SetPowerDbm(powerDbm);

                    c.Decode();

                    // output identification fields
                    let id1 = call.substring(0, 1);
                    let id3 = call.substring(2, 3);
                    
                    this.textOutput.value += `=====================================================\n`;
                    this.textOutput.value += `${call} ${grid} ${powerDbm}` + `\n`;
                    this.textOutput.value += `[ET: (id13: ${id1}${id3}, HdrRESERVED ${c.GetHdrRESERVEDEnum()}, HdrSlot ${c.GetHdrSlotEnum()}, HdrType ${c.GetHdrTypeEnum()})]` + `\n`;
                    this.textOutput.value += `=====================================================\n`;
                    
                    // calculate field widths
                    let maxFieldName = 0;
                    for (let i = 0; i < fieldList.length; ++i)
                    {
                        let field = fieldList[i];

                        if (field.name.length > maxFieldName)
                        {
                            maxFieldName = field.name.length;
                        }
                    }

                    // output application fields
                    for (let i = 0; i < fieldList.length; ++i)
                    {
                        let field = fieldList[i];

                        let fn = `Get${field.name}${field.unit}`;
                        let val = c[fn](linePartList[i + 1]);

                        this.textOutput.value += `${field.name.padEnd(maxFieldName)}: ${val}` + `\n`;
                    }
                }

                this.textOutput.value += `\n`;
            }
            else
            {
                if (linePartList[0] != "")
                {
                    this.textOutput.value += `==========================\n`;
                    this.textOutput.value += `Skipping invalid line "${line}"\n`;
                    this.textOutput.value += `==========================\n`;
                    this.textOutput.value += `\n`;
                }
            }
        }
    }
}



/////////////////////////////////////////////////////////////////////
// Encode
/////////////////////////////////////////////////////////////////////

export class WsprCodecUiEncodeController
extends WsprCodecUiEncodeDecodeBase
{
    constructor()
    {
        super();

        super.SetButtonText("Click<br/>to<br/>Encode");

        this.#SetBannerToFieldList([]);
    }

    DoWork()
    {
        this.#DoEncode(this.textInput.value.toUpperCase());
    }

    #SetBannerToFieldList(fieldNameList)
    {
        let str = `Encode: id13, HdrSlot`

        if (fieldNameList.length)
        {
            str += ", ";
            str += fieldNameList.join(", ");
        }

        super.SetBannerText(str);
    }

    #DoEncode(lineStrList)
    {
        let c = this.codecMaker.GetCodecInstance();
        const fieldList = c.GetFieldList();

        let fieldNameList = [];
        for (let field of fieldList)
        {
            fieldNameList.push(`${field.name}${field.unit}`);
        }

        this.#SetBannerToFieldList(fieldNameList);


        // clear output
        this.textOutput.value = "";

        // pull in input lines
        let lineList = lineStrList.split("\n");
        for (let line of lineList)
        {
            line = line.trim();
            if (line == "") { continue; }

            let linePartList = line.trim().split(/\s+/);

            // make sure we have id13 and all fields
            if (linePartList.length == fieldList.length + 2)
            {
                c.Reset();

                // set id13
                c.SetId13(linePartList[0]);
                
                // set slot
                c.SetHdrSlotEnum(linePartList[1]);

                // set application fields
                for (let i = 0; i < fieldList.length; ++i)
                {
                    let field = fieldList[i];

                    let fn = `Set${field.name}${field.unit}`;
                    c[fn](linePartList[2 + i]);
                }

                // set header fields
                c.SetHdrTypeEnum(0);            // undefined structure
                c.SetHdrTelemetryTypeEnum(0);   // extended telemetry

                // pull out calculated values
                c.Encode();
                let call     = c.GetCall();
                let grid     = c.GetGrid();
                let powerDbm = c.GetPowerDbm();

                this.textOutput.value += `======================================`;
                this.textOutput.value += `\n`;
                this.textOutput.value += `${linePartList.join(" ")}`;
                this.textOutput.value += `\n`;
                this.textOutput.value += `======================================`;
                this.textOutput.value += `\n`;
                this.textOutput.value += `${call} ${grid} ${powerDbm}`;
                this.textOutput.value += `\n`;
                this.textOutput.value += `\n`;
            }
        }

    }
}

