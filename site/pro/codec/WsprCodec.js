import { WSPREncoded } from '/js/WSPREncoded.js';
import { StrAccumulator } from '/js/Utl.js';


export class WsprCodecMaker
{
    constructor()
    {
        this.debug = false;

        this.codec = "";
        this.json = {};
        this.errList = [];

        this.SetCodecDefFragment("MyMessageType", "");
    }

    SetDebug(debug)
    {
        this.debug = debug;
    }

    GetFieldBitsAvailable()
    {
        // calculate and return, the number is an unfortunately irrational, so not easy
        // to just hard code and keep as a well-known number

        // from the 
        const BITS_ENCODABLE = 38.5;

        let bitsHdrType          = this.GetField("HdrType").Bits;
        let bitsHdrSlot          = this.GetField("HdrSlot").Bits;
        let bitsHdrRESERVED      = this.GetField("HdrRESERVED").Bits;
        let bitsHdrTelemetryType = this.GetField("HdrTelemetryType").Bits;

        // 29.17807190511264...
        let bitsAvail = BITS_ENCODABLE - (bitsHdrType + bitsHdrSlot + bitsHdrRESERVED + bitsHdrTelemetryType);

        // hmm, actually, to keep exact parity with the c++ code, let's simply hard-code this
        // value. there is a microscopic loss of available bits (dwarfed by not using spaces in callsign),
        // and in the event we ever need it, the number can be calculated/enlarged, and the change is
        // backward compatible.
        bitsAvail = 29.178;

        return bitsAvail;
    }

    // allow setting just name and fields, don't worry about object structure
    SetCodecDefFragment(msgName, codecFragment)
    {
        let finalFieldFragment = `
        { "name": "HdrSlot",          "unit": "Enum", "lowValue": 0, "highValue":  4, "stepSize": 1 },
        { "name": "HdrType",          "unit": "Enum", "lowValue": 0, "highValue": 15, "stepSize": 1 },
        { "name": "HdrRESERVED",      "unit": "Enum", "lowValue": 0, "highValue":  3, "stepSize": 1 },
        { "name": "HdrTelemetryType", "unit": "Enum", "lowValue": 0, "highValue":  1, "stepSize": 1 }
        `;

        // assumes the input's codeFragment ends with a comma if there are fields
        let codec = `
{
    "name": "${msgName}",
    "fieldList": [
${codecFragment} ${finalFieldFragment}]
}`;
        let ok = this.SetCodecDef(codec);

        return ok;
    }

    SetCodecDef(codec)
    {
        this.codec = codec;

        let ok = this.ParseCodecDef(this.codec);

        if (ok)
        {
            this.Calculate();
        }

        return ok;
    }

    GetErrList()
    {
        return this.errList;
    }

    ResetErrList()
    {
        this.errList = [];
    }

    AddErr(err)
    {
        this.errList.push(err);

        if (this.debug)
        {
            console.log(err);
        }
    }

    ParseCodecDef(codec)
    {
        let ok = true;

        if (this.debug)
        {
            console.log(codec);
        }

        this.ResetErrList();

        try
        {
            this.json = JSON.parse(codec);

            // validate basic structure
            if ("name" in this.json == false)
            {
                ok = false;
                this.AddErr(`No "name" property for codec`);
            }
            else if ("fieldList" in this.json == false)
            {
                ok = false;
                this.AddErr(`No "fieldList" property for codec`);
            }
            else
            {
                for (const field of this.json.fieldList)
                {
                    if ("name" in field == false)
                    {
                        ok = false;
                        this.AddErr(`No "name" property in field`);
                    }
                    else
                    {
                        // check the right fields exist
                        const propList = [
                            "unit",
                            "lowValue",
                            "highValue",
                            "stepSize",
                        ];

                        for (const prop of propList)
                        {
                            if (prop in field == false)
                            {
                                ok = false;
                                this.AddErr(`No "${prop}"" property in field(${field.name})`);
                            }
                        }

                        // check the fields logically make sense
                        if (ok)
                        {
                            // check numeric consistency
                            if (field.lowValue >= field.highValue)
                            {
                                ok = false;
                                this.AddErr(`Field(${field.name}) lowValue(${field.lowValue}) must be less than highValue(${field.highValue})`);
                            }
                        }

                        if (ok)
                        {
                            // check numeric consistency
                            if (field.stepSize <= 0)
                            {
                                ok = false;
                                this.AddErr(`Field(${field.name}) stepSize(${field.stepSize}) must be positive`);
                            }
                        }
                        
                        if (ok)
                        {
                            // is there a whole-number number of divisions of the low-to-high
                            // range when incremented by the step size?

                            let stepCount = (field.highValue - field.lowValue) / field.stepSize;

                            if (Number.isInteger(stepCount) == false)
                            {
                                ok = false;

                                let err = `Field(${field.name}) stepSize(${field.stepSize}) does not evenly divide the low(${field.lowValue})-to-high(${field.highValue}) range.`

                                // help break it down (whole integer only for now)
                                let factorList = [];

                                if (Number.isInteger(field.lowValue) &&
                                    Number.isInteger(field.highValue))
                                {
                                    for (let stepSize = 1; stepSize < ((field.highValue - field.lowValue) / 2); ++stepSize)
                                    {
                                        let stepCountNew = (field.highValue - field.lowValue) / stepSize;

                                        if (Number.isInteger(stepCountNew))
                                        {
                                            factorList.push(stepSize);
                                        }
                                    }

                                    if (factorList.length)
                                    {
                                        err += `\n`
                                        err += `    Whole integer steps are: ${factorList.join(", ")}.`;
                                    }
                                }

                                this.AddErr(err);
                            }
                        }
                    }
                }
            }
        }
        catch (e)
        {
            ok = false;
            this.AddErr(e);
        }

        return ok;
    }

    GetLastErr()
    {
        return this.lastErr;
    }

    Calculate()
    {
        // lazy for now
        let bitsLast = 0;
        let bitsSum = 0;
        for (let field of this.json.fieldList)
        {
            field.NumValues = ((field.highValue - field.lowValue) / field.stepSize) + 1;
            field.Bits      = Math.log2(field.NumValues);
            field.BitsSum   = field.Bits + bitsSum;

            bitsLast = field.Bits;
            bitsSum = bitsSum + field.Bits;
        }

        if (this.debug)
        {
            console.table(this.json.fieldList);
        }
    }

    GetField(fieldName)
    {
        let retVal = null;

        for (let field of this.json.fieldList)
        {
            if (field.name == fieldName)
            {
                retVal = field;

                break;
            }
        }

        return retVal;
    }

    GetCodec()
    {
        let c = this.GenerateCodecClassDef();
        if (this.debug)
        {
            console.log(c);
        }

        const MyClassDef = new Function('', `return ${c};`);
        const MyClass = MyClassDef();
        let d = new MyClass();

        d.SetWsprEncoded(WSPREncoded);

        return d;
    }

    GenerateCodecClassDef()
    {
        let a = new StrAccumulator();

        a.A(`class ${this.json.name}Codec`);
        a.A(`{`);

        // Constructor
        a.IncrIndent();
        a.A(`constructor()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.Reset();`);
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // Application field list
        a.IncrIndent();
        a.A(`GetFieldList()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`return [`);
            a.IncrIndent();

            let sep = "";

            for (let field of this.json.fieldList)
            {
                if (field.name.substr(0, 3) != "Hdr")
                {
                    a.A(`${sep}${JSON.stringify(field)}`);

                    sep = ",";
                }
            }

            a.DecrIndent();
            a.A(`];`);
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // Reset
        a.IncrIndent();
        a.A(`Reset()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.call     = "0A0AAA";`);
            a.A(`this.grid     = "AA00";`);
            a.A(`this.powerDbm = 0;`);
            a.A(``);
            a.A(`this.id13 = "00";`);
            a.A(``);
            a.A(`if (this.wsprEncoded == undefined) { this.wsprEncoded = null; }`);
            a.A(``);
            for (let field of this.json.fieldList)
            {
                a.A(`this.${field.name} = ${field.lowValue};`);
            }
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(` `);

        // Hack to get WSPREncoded into this object
        a.IncrIndent();
        a.A(`SetWsprEncoded(wsprEncoded)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.wsprEncoded = wsprEncoded;`);
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(` `);

        // Set id13
        a.IncrIndent();
        a.A(`SetId13(id13)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.id13 = id13;`);
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(` `);

        // Get id13
        a.IncrIndent();
        a.A(`GetId13(id13)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`return this.id13;`);
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        // Setters / Getters
        for (let field of this.json.fieldList)
        {
            a.A(` `);

            // Setter
            a.IncrIndent();
            a.A(`Set${field.name}${field.unit}(inputVal)`);
            a.A(`{`);
                a.IncrIndent();

                a.A(`let val = inputVal ?? ${field.lowValue};`);
                a.A(``);
                a.A(`if (val < ${field.lowValue}) { val = ${field.lowValue}; }`);
                a.A(`else if (val > ${field.highValue}) { val = ${field.highValue}; }`);
                a.A(``);
                a.A(`this.${field.name} = val;`);

                a.DecrIndent();
            a.A(`}`);
            a.DecrIndent();

            a.A(` `);

            // Getter
            a.IncrIndent();
            a.A(`Get${field.name}${field.unit}()`);
            a.A(`{`);
                a.IncrIndent();

                a.A(`return this.${field.name};`);

                a.DecrIndent();
            a.A(`}`);
            a.DecrIndent();

            a.A(` `);

            // Encoded Number Getter
            a.IncrIndent();
            a.A(`Get${field.name}${field.unit}Number()`);
            a.A(`{`);
                a.IncrIndent();

                a.A(`let retVal = null;`);
                a.A(``);
                a.A(`retVal = ((this.Get${field.name}${field.unit}() - ${field.lowValue}) / ${field.stepSize});`);
                a.A(`retVal = Math.round(retVal);`);
                a.A(``);
                a.A(`return retVal;`);

                a.DecrIndent();
            a.A(`}`);
            a.DecrIndent();
        }

        a.A(` `);

        // Encode

        // arrange application fields in reverse order
        // but ensure the original order of header fields.
        // this allows decode to pull out the "first" application field
        // consistently, even if the fields after it
        // change, are added, or revmoed.
        // this isn't an expected feature, but a good feature as it protects
        // legacy data in the event of future change as much as possible.
        let fieldEncodeList = this.json.fieldList.slice();
        let fieldListApp = [];
        let fieldListHdr = [];
        for (const field of fieldEncodeList)
        {
            if (field.name.substr(0, 3) == "Hdr")
            {
                fieldListHdr.push(field);
            }
            else
            {
                fieldListApp.push(field);
            }
        }

        // reverse the application fields in-place
        fieldListApp.reverse();

        // re-make the field list
        fieldEncodeList = [];
        for (const field of fieldListApp)
        {
            fieldEncodeList.push(field);
        }
        for (const field of fieldListHdr)
        {
            fieldEncodeList.push(field);
        }

        a.IncrIndent();
        a.A(`Encode()`);
        a.A(`{`);
            a.IncrIndent();

            a.A(`let val = 0;`);
            a.A(``);

            a.A(`// combine field values`);
            for (let field of fieldEncodeList)
            {
                a.A(`val *= ${field.NumValues}; val += this.Get${field.name}${field.unit}Number();`);
            }

            a.A(``);

            a.A(`// encode into power`);
            a.A(`let powerVal = val % 19; val = Math.floor(val / 19);`);
            a.A(`let powerDbm = this.wsprEncoded.EncodeNumToPower(powerVal);`);
            a.A(``);
            a.A(`// encode into grid`);
            a.A(`let g4Val = val % 10; val = Math.floor(val / 10);`);
            a.A(`let g3Val = val % 10; val = Math.floor(val / 10);`);
            a.A(`let g2Val = val % 18; val = Math.floor(val / 18);`);
            a.A(`let g1Val = val % 18; val = Math.floor(val / 18);`);
            a.A(``);
            a.A(`let g1 = String.fromCharCode("A".charCodeAt(0) + g1Val);`);
            a.A(`let g2 = String.fromCharCode("A".charCodeAt(0) + g2Val);`);
            a.A(`let g3 = String.fromCharCode("0".charCodeAt(0) + g3Val);`);
            a.A(`let g4 = String.fromCharCode("0".charCodeAt(0) + g4Val);`);
            a.A(`let grid = g1 + g2 + g3 + g4;`);
            a.A(``);
            a.A(`// encode into callsign`);
            a.A(`let id6Val = val % 26; val = Math.floor(val / 26);`);
            a.A(`let id5Val = val % 26; val = Math.floor(val / 26);`);
            a.A(`let id4Val = val % 26; val = Math.floor(val / 26);`);
            a.A(`let id2Val = val % 36; val = Math.floor(val / 36);`);
            a.A(``);
            a.A(`let id2 = this.wsprEncoded.EncodeBase36(id2Val);`);
            a.A(`let id4 = String.fromCharCode("A".charCodeAt(0) + id4Val);`);
            a.A(`let id5 = String.fromCharCode("A".charCodeAt(0) + id5Val);`);
            a.A(`let id6 = String.fromCharCode("A".charCodeAt(0) + id6Val);`);
            a.A(`let call = this.id13.at(0) + id2 + this.id13.at(1) + id4 + id5 + id6;`);
            a.A(``);
            a.A(`// capture results`);
            a.A(`this.call     = call;`);
            a.A(`this.grid     = grid;`);
            a.A(`this.powerDbm = powerDbm;`);

            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // Decode

        // get an entire-list reversed copy of the encoded field order
        let fieldDecodeList = fieldEncodeList.toReversed();

        a.IncrIndent();
        a.A(`Decode()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`// pull in inputs`);
            a.A(`let call     = this.GetCall();`);
            a.A(`let grid     = this.GetGrid();`);
            a.A(`let powerDbm = this.GetPowerDbm();`);
            a.A(``);
            a.A(`// break call down`);
            a.A(`let id2Val = this.wsprEncoded.DecodeBase36(call.charAt(1));`);
            a.A(`let id4Val = call.charAt(3).charCodeAt(0) - "A".charCodeAt(0);`);
            a.A(`let id5Val = call.charAt(4).charCodeAt(0) - "A".charCodeAt(0);`);
            a.A(`let id6Val = call.charAt(5).charCodeAt(0) - "A".charCodeAt(0);`);
            a.A(``);
            a.A(`// break grid down`);
            a.A(`let g1Val = grid.charAt(0).charCodeAt(0) - "A".charCodeAt(0);`);
            a.A(`let g2Val = grid.charAt(1).charCodeAt(0) - "A".charCodeAt(0);`);
            a.A(`let g3Val = grid.charAt(2).charCodeAt(0) - "0".charCodeAt(0);`);
            a.A(`let g4Val = grid.charAt(3).charCodeAt(0) - "0".charCodeAt(0);`);
            a.A(``);
            a.A(`// break power down`);
            a.A(`let powerVal = this.wsprEncoded.DecodePowerToNum(powerDbm);`);
            a.A(``);
            a.A(`// combine values into single integer`);
            a.A(`let val = 0;`);
            a.A(`val *= 36; val += id2Val;`);
            a.A(`val *= 26; val += id4Val;   // spaces aren't used, so 26 not 27`);
            a.A(`val *= 26; val += id5Val;   // spaces aren't used, so 26 not 27`);
            a.A(`val *= 26; val += id6Val;   // spaces aren't used, so 26 not 27`);
            a.A(`val *= 18; val += g1Val;`);
            a.A(`val *= 18; val += g2Val;`);
            a.A(`val *= 10; val += g3Val;`);
            a.A(`val *= 10; val += g4Val;`);
            a.A(`val *= 19; val += powerVal;`);
            a.A(``);
            a.A(`// extract field values`);

            for (let field of fieldDecodeList)
            {
                a.A(`this.Set${field.name}${field.unit}(${field.lowValue} + ((val % ${field.NumValues}) * ${field.stepSize})); val = Math.floor(val / ${field.NumValues});`);
            }
            
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // SetCall
        a.IncrIndent();
        a.A(`SetCall(inputVal)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.call = inputVal;`)
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // GetCall
        a.IncrIndent();
        a.A(`GetCall()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`return this.call;`)
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // SetGrid
        a.IncrIndent();
        a.A(`SetGrid(inputVal)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.grid = inputVal;`)
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // GetGrid
        a.IncrIndent();
        a.A(`GetGrid()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`return this.grid;`)
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // SetPowerDbm
        a.IncrIndent();
        a.A(`SetPowerDbm(inputVal)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.powerDbm = inputVal;`)
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // GetPowerDbm
        a.IncrIndent();
        a.A(`GetPowerDbm()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`return parseInt(this.powerDbm);`)
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(`}`);

        let c = a.Get();

        return c;
    }
}

