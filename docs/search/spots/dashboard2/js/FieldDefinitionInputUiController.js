import * as utl from '/js/Utl.js';

import { DialogBox } from './DomWidgets.js';
import { StrAccumulator } from '/js/Utl.js';
import { WsprCodecMaker } from '../../../../pro/codec/WsprCodec.js';





async function saveToFile(text, suggestedName) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    URL.revokeObjectURL(url); // Clean up the object URL
}

async function loadFromFile() {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        // input.accept = 'text/plain'; // Optional: restrict file types
        input.accept = '.json';
        input.onchange = () => {
            const file = input.files[0];
            if (!file) {
                reject(new Error('No file selected'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); // Resolve with file contents
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsText(file); // Read file as text
        };
        input.click();
    });
}


export class FieldDefinitionInputUiController
{
    constructor()
    {
        this.codecMaker = new WsprCodecMaker();

        this.onApplyCbFn = () => {};
        
        this.namePrefix = "Field Definition Analysis";
        this.name = "";

        this.fileNamePart = "";

        this.ui = this.#MakeUI();

        this.#SetUpEvents();
        this.#SetInitialFieldDefValue();
    }

    SetDisplayName(name)
    {
        this.name = name;

        this.dialogBox.SetTitleBar(this.namePrefix + (this.name == "" ? "" : ` - ${this.name}`));
    }

    SetDownloadFileNamePart(fileNamePart)
    {
        this.fileNamePart = fileNamePart;
    }

    GetUI()
    {
        return this.ui;
    }

    SetOnApplyCallback(cb)
    {
        this.onApplyCbFn = cb;
    }

    GetFieldDefinition()
    {
        return this.fieldDefInput.value;
    }

    SetFieldDefinition(value)
    {
        this.fieldDefInput.value = value;

        this.#OnFieldDefInputChange();
    }

    #SetFieldDefWarnLight()
    {
        this.fieldDefInput.style.backgroundColor = "lightpink";
    }

    #SetFieldDefOkLight()
    {
        this.fieldDefInput.style.backgroundColor = "rgb(235, 255, 235)";
    }

    #SetUpEvents()
    {
        this.fieldDefInput.addEventListener('input', () => {
            this.#OnFieldDefInputChange();
        })

        this.applyButton.addEventListener('click', () => {
            this.onApplyCbFn(this.GetFieldDefinition());
        });

        this.uploadButton.addEventListener('click', () => {
            loadFromFile().then((str) => {
                this.SetFieldDefinition(str);
            });
        });

        this.downloadButton.addEventListener('click', () => {
            saveToFile(this.GetFieldDefinition(), `FieldDefinition_${this.fileNamePart}.json`);
        });

        this.analysisButton.addEventListener('click', () => {
            this.dialogBox.ToggleShowHide();
        });
    }

    #SetInitialFieldDefValue()
    {
        let f1 = `{ "name": "Altitude",  "unit": "Meters",   "lowValue": 0,  "highValue": 21340,  "stepSize": 20 },`
        let f2 = `{ "name": "SatsUSA",   "unit": "Count",    "lowValue": 0,  "highValue":    32,  "stepSize":  1 },`
        let f3 = `{ "name": "LockTime",  "unit": "Seconds",  "lowValue": 0,  "highValue":  1200,  "stepSize":  1 },`

        this.fieldDefInput.value  = ``;
        this.fieldDefInput.value += f1;
        this.fieldDefInput.value += '\n';
        this.fieldDefInput.value += f2;
        this.fieldDefInput.value += '\n';
        this.fieldDefInput.value += f3;
        this.fieldDefInput.value += '\n';
        this.fieldDefInput.value += '\n';
        this.fieldDefInput.value += '\n';

        this.#OnFieldDefInputChange();
    }

    #OnFieldDefInputChange()
    {
        // let ok = this.#CheckFieldDefOk();
        let ok = this.#ApplyFieldDefinition();

        if (ok)
        {
            this.#SetFieldDefOkLight();
        }
        else
        {
            this.#SetFieldDefWarnLight();
        }
    }

    #CheckFieldDefOk()
    {
        // support commenting out lines of codec spec
        let codecDefLineList = [];
        for (let line of this.fieldDefInput.value.split("\n"))
        {
            line = line.trim();

            if (line.substring(0, 2) != "//")
            {
                codecDefLineList.push(line);
            }
        }
        let codecDefStr = codecDefLineList.join("\n");

        let ok = this.codecMaker.SetCodecDefFragment("MyMessageType", codecDefStr);

        return ok;
    }

    #ApplyFieldDefinition()
    {
        let ok = this.#CheckFieldDefOk();

        ok &= this.#DoFieldDefinitionAnalysis(ok);

        return ok;
    }

    #DoFieldDefinitionAnalysis(codecOk)
    {
        let retVal = true;

        if (codecOk)
        {
            // get field data
            const fieldList = this.codecMaker.GetCodec().GetFieldList();

            // calc max field length for formatting
            let maxFieldName = 5;
            for (let field of fieldList)
            {
                if (field.name.length > maxFieldName)
                {
                    maxFieldName = field.name.length;
                }
            }

            // analyze utilization
            let sumBits = 0;
            for (let field of fieldList)
            {
                sumBits += field.Bits;
            }

            // output
            const ENCODABLE_BITS = this.codecMaker.GetFieldBitsAvailable();
            let pctUsed = (sumBits * 100 / ENCODABLE_BITS);

            let pctUsedErr = "";
            
            if (sumBits > ENCODABLE_BITS)
            {
                retVal = false;

                pctUsedErr = "<---- OVERFLOW ERR";
            }

            let bitsRemaining = ENCODABLE_BITS - sumBits;

            if (bitsRemaining < 0) { bitsRemaining = 0; }
            let pctRemaining = (bitsRemaining * 100 / ENCODABLE_BITS);

            // put out to 3 decimal places because available bits is 29.1780... and so
            // no need to worry about rounding after the 29.178 portion, so just display
            // it and move on.

            let a = new StrAccumulator();
            a.A(`Encodable Bits Available: ${ENCODABLE_BITS.toFixed(3).padStart(6)}`);
            a.A(`Encodable Bits Used     : ${sumBits.toFixed(3).padStart(6)} (${pctUsed.toFixed(2).padStart(6)} %) ${pctUsedErr}`);
            a.A(`Encodable Bits Remaining: ${(bitsRemaining).toFixed(3).padStart(6)} (${pctRemaining.toFixed(2).padStart(6)} %)`);

            let PAD_VALUES = 9;
            let PAD_BITS   = 6;
            let PAD_AVAIL  = 8;

            let FnOutput = (name, numValues, numBits, pct) => {
                a.A(`${name.padEnd(maxFieldName)}   ${numValues.padStart(PAD_VALUES)}    ${numBits.padStart(PAD_BITS)}  ${pct.padStart(PAD_AVAIL)}`);
            }

            a.A(``);
            FnOutput("Field", "# Values", "# Bits", "% Used");
            a.A(`-`.repeat(maxFieldName) + `-`.repeat(PAD_VALUES) + `-`.repeat(PAD_BITS) + `-`.repeat(PAD_AVAIL) + `-`.repeat(9));
            for (let field of fieldList)
            {
                let pct = (field.Bits * 100 / ENCODABLE_BITS).toFixed(2);

                FnOutput(field.name, field.NumValues.toString(), field.Bits.toFixed(3).toString(), pct);
            }

            this.codecAnalysis.value = a.Get();

            // indicate any errors visually also
            if (sumBits > ENCODABLE_BITS)
            {
                this.fieldDefInput.style.backgroundColor = 'pink';
            }
            else
            {
                this.fieldDefInput.style.backgroundColor = 'white';
            }
        }
        else
        {
            retVal = false;

            let a = new StrAccumulator();
            a.A(`Codec definition invalid. (Make sure all rows have a trailing comma)`);
            a.A(``);
            for (let err of this.codecMaker.GetErrList())
            {
                a.A(err);
            }
            this.codecAnalysis.value = a.Get();

            this.fieldDefInput.style.backgroundColor = 'pink';
        }

        return retVal;
    }

    #MakeUI()
    {
        // main ui
        let ui = document.createElement('div');
        ui.style.boxSizing = "border-box";
        // ui.style.border = "3px solid red";
        
        // input for field definitions
        this.fieldDefInput = this.#MakeFieldDefInput();
        this.fieldDefInput.style.marginBottom = "3px";
        ui.appendChild(this.fieldDefInput);

        // make apply button
        this.applyButton = document.createElement('button');
        this.applyButton.innerHTML = "Apply";
        ui.appendChild(this.applyButton);

        ui.appendChild(document.createTextNode(' '));

        // button to upload a field def json file
        this.uploadButton = document.createElement('button');
        this.uploadButton.innerHTML = "From File";
        ui.appendChild(this.uploadButton);

        ui.appendChild(document.createTextNode(' '));

        // button to download the field def into a json file
        this.downloadButton = document.createElement('button');
        this.downloadButton.innerHTML = "To File";
        ui.appendChild(this.downloadButton);

        ui.appendChild(document.createTextNode(' '));

        // button to show/hide field def analysis
        this.analysisButton = document.createElement('button');
        this.analysisButton.innerHTML = "Show/Hide Analysis";
        ui.appendChild(this.analysisButton);

        // field def analysis
        this.codecAnalysis = this.#MakeCodecAnalysis();

        // dialog for showing field def analysis
        this.dialogBox = new DialogBox();
        ui.appendChild(this.dialogBox.GetUI());
        this.dialogBox.SetTitleBar(this.namePrefix + (this.name == "" ? "" : ` - ${this.name}`));
        this.dialogBox.GetContentContainer().appendChild(this.codecAnalysis);

        return ui;
    }

    #MakeFieldDefInput()
    {
        let dom = document.createElement('textarea');
        dom.style.boxSizing = "border-box";
        dom.spellcheck = false;
        dom.style.backgroundColor = "white";

        // I want it to take up a row by itself
        dom.style.display = "block";

        dom.style.minWidth = "800px";
        dom.style.minHeight = "150px";

        return dom;
    }

    #MakeCodecAnalysis()
    {
        let dom = document.createElement('textarea');
        dom.style.boxSizing = "border-box";
        dom.spellcheck = false;
        dom.readOnly = true;

        // I want it be disabled, but click events don't propagate, so just
        // simulate it as being that way.
        // dom.disabled = true;
        dom.style.cursor = "default";
        dom.style.backgroundColor = "rgb(234, 234, 234)";

        // make it so flex column container sees this as a whole row
        dom.style.display = "block";

        dom.style.minWidth = "500px";
        dom.style.minHeight = "225px";

        return dom;
    }
}




