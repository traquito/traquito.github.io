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


export class WsprCodec
{
    constructor()
    {
        this.codec = "";
        this.json = {};

        this.SetCodecFragment("MyMessageType", "");
    }

    // allow setting just name and fields, don't worry about object structure
    SetCodecFragment(msgName, codecFragment)
    {
        let finalFieldFragment = `
        { "name": "HdrType",         "type": "Int", "unit": "Enum", "lowValue": 0, "highValue": 15, "stepSize": 1 },
        { "name": "HdrSlot",         "type": "Int", "unit": "Enum", "lowValue": 0, "highValue":  3, "stepSize": 1 },
        { "name": "HdrRESERVED",     "type": "Int", "unit": "Enum", "lowValue": 0, "highValue":  3, "stepSize": 1 },
        { "name": "HdrTelemetryStd", "type": "Int", "unit": "Enum", "lowValue": 0, "highValue":  1, "stepSize": 1 }
        `;

        // assumes the input's codeFragment ends with a comma if there are fields
        let codec = `
{
    "name": "${msgName}",
    "fieldList": [
${codecFragment} ${finalFieldFragment}]
}`;
        let ok = this.SetCodec(codec);

        return ok;
    }

    SetCodec(codec)
    {
        this.codec = codec;

        let ok = this.ParseCodec(this.codec);

        if (ok)
        {
            this.Calculate();
        }

        return ok;
    }

    ParseCodec(codec)
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

        let e = this.GetCodecEncoder();
    }

    GetCodecEncoder()
    {
        let c = this.GenerateCodecEncoderClass();
        // console.log(c);

        const MyClassDef = new Function('', `return ${c};`);
        const MyClass = MyClassDef();
        let d = new MyClass();

        d.SetWsprEncoded(WSPREncoded);

        return d;
    }

    GenerateCodecEncoderClass()
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

        // Reset
        a.IncrIndent();
        a.A(`Reset()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.call  = "0A0AAA";`);
            a.A(`this.grid  = "AA00";`);
            a.A(`this.power = 0;`);
            a.A(``);
            a.A(`this.wsprEncoded = null;`);
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

        // Hack to get WSPREncoded into this object
        a.IncrIndent();
        a.A(`SetWsprEncoded(wsprEncoded)`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`this.wsprEncoded = wsprEncoded;`);
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
                a.A(``);
                a.A(`this.Encode();`);

                a.DecrIndent();
            a.A(`}`);
            a.DecrIndent();

            a.A(` `);

            // Getter
            a.IncrIndent();
            a.A(`Get${field.name}${field.unit}(inputVal)`);
            a.A(`{`);
                a.IncrIndent();

                a.A(`return this.${field.name};`);

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
                a.A(`val *= ${field.NumValues}; val += this.Get${field.name}${field.unit}();`);
            }

            a.A(``);

            a.A(`// encode into power`);
            a.A(`let powerVal = val % 19; val = Math.floor(val / 19);`);
            a.A(`let power = this.wsprEncoded.EncodeNumToPower(powerVal);`);
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
            a.A(`let call = " " + id2 + " " + id4 + id5 + id6;`);
            a.A(``);
            a.A(`this.call  = call;`);
            a.A(`this.grid  = grid;`);
            a.A(`this.power = power;`);
            a.A(``);
            a.A(`console.table(this.GetCallGridPower())`);

            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(``);

        // GetCallGridPower
        a.IncrIndent();
        a.A(`GetCallGridPower()`);
        a.A(`{`);
            a.IncrIndent();
            a.A(`return [this.call, this.grid, this.power];`);
            a.DecrIndent();
        a.A(`}`);
        a.DecrIndent();

        a.A(`}`);

        let c = a.Get();

        return c;
    }
}

