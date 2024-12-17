import * as utl from '/js/Utl.js';

import { DialogBox } from './DomWidgets.js';
import { StrAccumulator } from '/js/Utl.js';
import { WsprCodecMaker } from '../../../../pro/codec/WsprCodec.js';





export class FieldDefinitionInputUiController
{
    constructor()
    {
        this.codecMaker = new WsprCodecMaker();

        this.onApplyCbFn = () => {};
        this.onErrCbFn = () => {};

        this.ok = true;
        this.cachedLastFieldDefApplied = "";
        
        this.namePrefix = "Field Definition Analysis";
        this.name = "";

        this.fileNamePart = "";

        this.ui = this.#MakeUI();

        this.#SetUpEvents();
        this.#ShowExampleValue();
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

    SetModeNoPopup()
    {
        // remove show/hide button
        this.ui.removeChild(this.analysisButton);

        // remove dialog box
        this.ui.removeChild(this.dialogBox.GetUI());

        // insert analysis
        this.codecAnalysis.style.marginTop = "3px";
        this.ui.append(this.codecAnalysis);

        return this.ui;
    }

    SetOnApplyCallback(cb)
    {
        this.onApplyCbFn = cb;
    }

    GetOnApplyCallback()
    {
        return this.onApplyCbFn;
    }

    SetOnErrStateChangeCallback(cb)
    {
        this.onErrCbFn = cb;
    }

    GetFieldDefinition()
    {
        return this.cachedLastFieldDefApplied;
    }

    GetFieldDefinitionRaw()
    {
        return this.fieldDefInput.value;
    }

    SetFieldDefinition(value, markApplied)
    {
        markApplied = markApplied ?? true;

        this.fieldDefInput.value = value;

        this.#OnFieldDefInputChange();

        if (this.ok)
        {
            if (markApplied)
            {
                this.cachedLastFieldDefApplied = value;
                this.#MarkFieldDefApplied();
                this.#SetStateApplied();
            }
        }
        else
        {
            // it's bad, so indicate that whatever the prior applied value
            // was is still in effect
            this.#DisableApplyButton();
        }

        this.onErrCbFn(this.ok);

        return this.ok;
    }

    #SetUpEvents()
    {
        this.fieldDefInput.addEventListener('input', () => {
            this.#OnFieldDefInputChange();
        })

        this.applyButton.addEventListener('click', () => {
            if (this.ok)
            {
                this.cachedLastFieldDefApplied = this.GetFieldDefinitionRaw();
                
                this.#MarkFieldDefApplied();
                this.#SetStateApplied();

                this.onApplyCbFn();
            }
        });

        this.restoreButton.addEventListener('click', () => {
            this.SetFieldDefinition(this.cachedLastFieldDefApplied, false);
        });

        this.showExampleButton.addEventListener('click', () => {
            this.#ShowExampleValue();
            this.#OnFieldDefInputChange();
        });

        this.uploadButton.addEventListener('click', () => {
            utl.LoadFromFile(".json").then((str) => {
                this.SetFieldDefinition(str, false);
            });
        });

        this.downloadButton.addEventListener('click', () => {
            let fileName = `FieldDefinition`;
            if (this.fileNamePart != "")
            {
                fileName += `_`;
                fileName += this.fileNamePart;
            }
            fileName += `.json`;

            utl.SaveToFile(this.GetFieldDefinitionRaw(), fileName);
        });

        this.analysisButton.addEventListener('click', () => {
            this.dialogBox.ToggleShowHide();
        });

        utl.GiveHotkeysVSCode(this.fieldDefInput, () => {
            this.applyButton.click();
        });
    }

    GetExampleValue()
    {
        let fieldDefRowList = [
            `// example values, modify then apply\n`,
            `{ "name": "Altitude",   "unit": "Meters",   "lowValue": 0,    "highValue": 21340,    "stepSize": 20   },`,
            `{ "name": "SatsUSA",    "unit": "Count",    "lowValue": 0,    "highValue":    32,    "stepSize":  4   },`,
            `{ "name": "LockTime",   "unit": "Seconds",  "lowValue": 0,    "highValue":   120,    "stepSize":  2   },`,
            `{ "name": "ADC1",       "unit": "Volts",    "lowValue": 2.5,  "highValue":     5.5,  "stepSize":  0.2 },`,
            `{ "name": "RawNumber",  "unit": "Value",    "lowValue": 0,    "highValue":    99,    "stepSize":  3   },`,
        ];

        let str = ``;
        let sep = "";
        for (let fieldDefRow of fieldDefRowList)
        {
            str += sep;
            str += fieldDefRow;

            sep = "\n";
        }

        return str;
    }

    #ShowExampleValue()
    {
        this.SetFieldDefinition(this.GetExampleValue(), false);
    }

    #OnFieldDefInputChange()
    {
        this.ok = this.#ApplyFieldDefinition();

        // handle setting the validity state
        if (this.ok)
        {
            this.#MarkFieldDefValid();

            // handle setting the applied state
            // (this can override the field def coloring)
            if (this.GetFieldDefinitionRaw() == this.cachedLastFieldDefApplied)
            {
                this.#SetStateApplied();
            }
            else
            {
                this.#SetStateNotApplied();
            }    
        }
        else
        {
            this.#MarkFieldDefInvalid();
            this.#DisableApplyButton();
        }

        this.onErrCbFn(this.ok);

        return this.ok;
    }

    #MarkFieldDefValid()
    {
        this.fieldDefInput.style.backgroundColor = "rgb(235, 255, 235)";
        this.restoreButton.disabled = false;
    }

    #MarkFieldDefInvalid()
    {
        this.fieldDefInput.style.backgroundColor = "lightpink";
        this.restoreButton.disabled = false;
    }

    #MarkFieldDefApplied()
    {
        this.fieldDefInput.style.backgroundColor = "white";
        this.restoreButton.disabled = true;
    }

    #DisableApplyButton()
    {
        this.applyButton.disabled = true;
    }

    #SetStateApplied()
    {
        this.#DisableApplyButton();
        this.restoreButton.disabled = false;

        this.#MarkFieldDefApplied();
    }

    #SetStateNotApplied()
    {
        this.applyButton.disabled = false;
    }

    #CheckFieldDefOk()
    {
        let ok = this.codecMaker.SetCodecDefFragment("MyMessageType", this.fieldDefInput.value);

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
            const fieldList = this.codecMaker.GetCodecInstance().GetFieldList();

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

        // make restore last button
        this.restoreButton = document.createElement('button');
        this.restoreButton.innerHTML = "Restore Last Applied";
        ui.appendChild(this.restoreButton);

        ui.appendChild(document.createTextNode(' '));

        // make show example button
        this.showExampleButton = document.createElement('button');
        this.showExampleButton.innerHTML = "Show Example";
        ui.appendChild(this.showExampleButton);

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




