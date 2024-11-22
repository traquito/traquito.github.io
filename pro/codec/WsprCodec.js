import { WSPREncoded } from '/js/WSPREncoded.js';


class Accumulator
{
    constructor()
    {
        this.str = ``;
        this.indent = 0;
    }

    A(appendStr)
    {
        this.str = `${this.str}${" ".repeat(this.indent)}${appendStr}\n`;
    }

    IncrIndent()
    {
        this.indent += 4;
    }

    DecrIndent()
    {
        this.indent -= 4;
    }

    Get()
    {
        return this.str;
    }
}


export class WsprCodecMaker
{
    constructor()
    {
        this.codec = "";
        this.json = {};

        this.SetCodecDefFragment("MyMessageType", "");
    }

    // allow setting just name and fields, don't worry about object structure
    SetCodecDefFragment(msgName, codecFragment)
    {
        let finalFieldFragment = `
        { "name": "HdrType",          "type": "Int", "unit": "Enum", "lowValue": 0, "highValue": 15, "stepSize": 1 },
        { "name": "HdrSlot",          "type": "Int", "unit": "Enum", "lowValue": 0, "highValue":  3, "stepSize": 1 },
        { "name": "HdrRESERVED",      "type": "Int", "unit": "Enum", "lowValue": 0, "highValue":  3, "stepSize": 1 },
        { "name": "HdrTelemetryType", "type": "Int", "unit": "Enum", "lowValue": 0, "highValue":  1, "stepSize": 1 }
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

    ParseCodecDef(codec)
    {
        let ok = true;

        console.log(codec);

        try
        {
            this.json = JSON.parse(codec);

            // validate basic structure
            if ("name" in this.json == false)
            {
                ok = false;
                console.log(`No "name" property for codec`);
            }
            else if ("fieldList" in this.json == false)
            {
                ok = false;
                console.log(`No "fieldList" property for codec`);
            }
            else
            {
                for (const field of this.json.fieldList)
                {
                    if ("name" in field == false)
                    {
                        ok = false;
                        console.log(`No "name" property in field`);
                    }
                    else if ("type" in field == false)
                    {
                        ok = false;
                        console.log(`No "type" property in field(${field.name})`);
                    }
                    else if (field.type == "Int" || field.type == "Float")
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
                                console.log(`No "${prop}"" property in field(${field.name})`);
                            }
                        }

                        // check the fields logically make sense
                        if (ok)
                        {
                            // is there a whole-number number of divisions of the low-to-high
                            // range when incremented by the step size?

                            let stepCount = (field.highValue - field.lowValue) / field.stepSize;

                            if (Number.isInteger(stepCount) == false)
                            {
                                ok = false;
                                console.log(`field(${field.name}) stepSize(${field.stepSize}) does not evenly divide the low(${field.lowValue})-to-high(${field.highValue}) range`);
                            }

                            // check numeric consistency
                            if (field.lowValue >= field.highValue)
                            {
                                ok = false;
                                console.log(`field(${field.name}) lowValue(${field.lowValue}) must be less than highValue(${field.highValue})`);
                            }
                        }
                    }
                    else
                    {
                        ok = false;
                        console.log(`"type" property(${field.type}) in field(${field.name}) unrecognized"`);
                    }
                }
            }
        }
        catch (e)
        {
            console.log(e);
        }

        return ok;
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

        console.table(this.json.fieldList);
    }

    GetCodec()
    {
        let c = this.GenerateCodecClassDef();
        console.log(c);

        const MyClassDef = new Function('', `return ${c};`);
        const MyClass = MyClassDef();
        let d = new MyClass();

        d.SetWsprEncoded(WSPREncoded);

        return d;
    }

    GenerateCodecClassDef()
    {
        let a = new Accumulator();

        a.A(`class ${this.json.name}Encoder`);
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
                if (field.type == "Int")
                {
                    a.A(`this.${field.name} = 0;`);
                }
                else if (field.type == "Float")
                {
                    a.A(`this.${field.name} = 0.0;`);
                }
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
                // a.A(`console.log("  Set this.${field.name} = " + val.toString());`);
                // a.A(``);
                // a.A(`this.Encode();`);

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
                // a.A(`console.log("Get${field.name}${field.unit}Number(" + this.Get${field.name}${field.unit}() + ") == " + ` + "`${retVal}`)");
                a.A(`retVal = Math.round(retVal);`);
                // a.A(`console.log("Get${field.name}${field.unit}Number() == " + ` + "`${retVal}`)");
                a.A(``);
                a.A(`return retVal;`);

                a.DecrIndent();
            a.A(`}`);
            a.DecrIndent();
        }

        a.A(` `);

        // Encode
        a.IncrIndent();
        a.A(`Encode()`);
        a.A(`{`);
            a.IncrIndent();

            a.A(`let val = 0;`);
            a.A(``);

            a.A(`// combine field values`);
            for (let field of this.json.fieldList)
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
            // a.A(``);
            // a.A(`console.table(this.GetCallGridPower())`);

            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // Decode
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

            let fieldListReversed = this.json.fieldList.toReversed();
            for (let field of fieldListReversed)
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

