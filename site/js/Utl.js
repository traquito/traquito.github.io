export class StrAccumulator
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

export function Commas(num)
{
    let ret = num;

    try {
        ret = parseInt(num).toLocaleString("en-US");
    } catch (e) {
        // nothing
    }

    return ret;
}

// take in any css color string (hex, rgb, name, etc)
// return array [r, g, b]
export function GetRgbFromColor(color)
{
    let d = document.createElement("div");

    d.style.color = color;

    
    document.body.appendChild(d);
    // comes out as "rgb(r, g, b)"
    let rgbStrColor = window.getComputedStyle(d).color;
    document.body.removeChild(d);

    // extract r, g, b
    let rgbArr = rgbStrColor.substring(4, rgbStrColor.length-1).replace(/ /g, '').split(',');

    rgbArr[0] = parseInt(rgbArr[0]);
    rgbArr[1] = parseInt(rgbArr[1]);
    rgbArr[2] = parseInt(rgbArr[2]);

    return rgbArr;
}



// num1 can be higher/lower/equal to num2
// pct is a decimal value, so 50 means 50%
// return a number that is pct between num1 and num2
export function PctBetween(pct, num1, num2)
{
    if (pct <   0) { pct =   0; }
    if (pct > 100) { pct = 100; }

    let min = Math.min(num1, num2);
    let max = Math.max(num1, num2);
    
    let diff = max - min;
    
    if (diff < 0)
    {
        diff = -diff;
    }
    
    let retVal = min + ((pct / 100) * diff);
    
    return retVal;
}


// returns a string of "rgb(r, g, b)"
export function ColorPctBetween(pct, colorStart, colorEnd, toInt = false)
{
    let rgbArrStart = GetRgbFromColor(colorStart);
    let rgbArrEnd   = GetRgbFromColor(colorEnd);

    let r = PctBetween(pct, rgbArrStart[0], rgbArrEnd[0]);
    let g = PctBetween(pct, rgbArrStart[1], rgbArrEnd[1]);
    let b = PctBetween(pct, rgbArrStart[2], rgbArrEnd[2]);

    if (toInt)
    {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
    }

    let retVal = `rgb(${r}, ${g}, ${b})`;

    return retVal;
}


export function Now()
{
    return Date.now();
}

export function DateYYYY()
{
    return `${(new Date()).getFullYear()}`;
}

export function DateMM()
{
    return String((new Date()).getMonth() + 1).padStart(2, '0');
}

export function DateDD()
{
    return String((new Date()).getDate()).padStart(2, '0');
}

export function TimeHH()
{
    return String((new Date()).getHours()).padStart(2, '0');
}

export function TimeMM()
{
    return String((new Date()).getMinutes()).padStart(2, '0');
}

export function TimeSS()
{
    return String((new Date()).getSeconds()).padStart(2, '0');
}

export function ValOrDefaultFn(str, fn)
{
    let retVal;
    
    if (str)
    {
        str = String(str).trim();
        
        if (str == "")
        {
            retVal = fn();
        }
        else
        {
            retVal = str;
        }
    }
    else
    {
        retVal = fn();
    }

    return retVal;
}

export function ValOrDefault(str, strDefault)
{
    let retVal;
    
    if (str)
    {
        str = String(str).trim();
        
        if (str == "")
        {
            retVal = strDefault;
        }
        else
        {
            retVal = str;
        }
    }
    else
    {
        retVal = strDefault;
    }

    return retVal;
}

export function ParseDateTimeToIsoString(timeStr)
{
    timeStr = timeStr.trim();
    let timePartArr = timeStr.trim().split(" ");
    
    let YYYY, MM, DD;
    let hh, mm, ss;

    if (timePartArr.length >= 1)
    {
        let date = timePartArr[0];
    
        let datePartList = date.split("-");
    
        if (datePartList.length >= 1) { YYYY = datePartList[0]; }
        if (datePartList.length >= 2) { MM = datePartList[1].padStart(2, '0'); } else { MM = "01"; }
        if (datePartList.length >= 3) { DD = datePartList[2].padStart(2, '0'); } else { DD = "01"; }
    }

    if (timePartArr.length >= 2)
    {
        let time = timePartArr[1];

        let timePartList = time.split(":");

        if (timePartList.length >= 1) { hh = timePartList[0].padStart(2, '0'); } else { hh = "00"; }
        if (timePartList.length >= 2) { mm = timePartList[1].padStart(2, '0'); } else { mm = "00"; }
        if (timePartList.length >= 3) { ss = timePartList[2].padStart(2, '0'); } else { ss = "00"; }
    }

    YYYY = ValOrDefault(YYYY, DateYYYY());
    MM   = ValOrDefault(MM, "01");
    DD   = ValOrDefault(DD, "00");
    hh   = ValOrDefault(hh, "00");
    mm   = ValOrDefault(mm, "00");
    ss   = ValOrDefault(ss, "00");

    let timeStrIso = `${YYYY}-${MM}-${DD}T${hh}:${mm}:${ss}`;

    return timeStrIso;
}

export function ConvertUtcToLocal(timeStr)
{
    let isoStr = ParseDateTimeToIsoString(timeStr);

    isoStr += "Z";

    let ms = (new Date(isoStr)).getTime();

    let localTimeStr = MakeDateTimeFromMs(ms);

    return localTimeStr;
}

export function ConvertLocalToUtc(timeStr)
{
    // we have a local time, what is that in UTC?
    // it is as different to us as we are from it

    // first, get the local time in ms
    let isoStr = ParseDateTimeToIsoString(timeStr);
    let msLocal = (new Date(isoStr)).getTime();

    // next, get that same local time in ms, but pretend we're in UTC
    let isoStrUtc = isoStr + "Z";
    let msUtcTmp = (new Date(isoStrUtc)).getTime();

    // look at the difference
    let msDiff = msUtcTmp - msLocal;

    // calculate
    let msUtc = msLocal - msDiff;
    
    // convert to str
    let utcTimeStr = MakeDateTimeFromMs(msUtc);

    return utcTimeStr;
}

export function ParseTimeToMs(timeStr)
{
    let timeStrIso = ParseDateTimeToIsoString(timeStr);
    
    let ms = Date.parse(timeStrIso);

    return ms;
}

export function MsDiff(time1, time2)
{
    let msTime1 = ParseTimeToMs(time1);
    let msTime2 = ParseTimeToMs(time2);

    return msTime1 - msTime2;
}

export function MsUntil(timeStr)
{
    let msNow = Now();
    let msThen = ParseTimeToMs(timeStr);
    let msUntil = msThen - msNow;

    if (timeStr == "")
    {
        msUntil = 0;
    }

    return msUntil;
}

export function MsUntilDate(dateStr)
{
    let msNow = ParseTimeToMs(MakeDateFromMs(Now()));
    let msThen = ParseTimeToMs(dateStr);
    let msUntil = msThen - msNow;

    if (dateStr == "")
    {
        msUntil = 0;
    }

    return msUntil;
}

export function DateTimeValid(timeStr)
{
    return isNaN(ParseTimeToMs(timeStr)) == false;
}

export function MakeDateTimeFromDateTime(timeStr)
{
    let timeStrIso = ParseDateTimeToIsoString(timeStr);

    // drop the T
    let partList = timeStrIso.split("T");

    let timeStrIsoNoT = `${partList[0]} ${partList[1]}`;

    return timeStrIsoNoT;
}

export function MakeDateFrom(timeStr)
{
    let dateTime = MakeDateTimeFromDateTime(timeStr);

    return dateTime.split(" ")[0];
}

export function MakeDateTimeFromMs(ms)
{
    let dt = new Date(ms);

    let YYYY = dt.getFullYear();
    let MM   = String((dt.getMonth() + 1)).padStart(2, '0')
    let DD   = String(dt.getDate()).padStart(2, '0')
    let hh   = String(dt.getHours()).padStart(2, '0')
    let mm   = String(dt.getMinutes()).padStart(2, '0')
    let ss   = String(dt.getSeconds()).padStart(2, '0')

    let dateTime = `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;

    return dateTime;
}

export function MakeDateFromMs(ms)
{
    let dateTime = MakeDateTimeFromMs(ms);

    return dateTime.split(" ")[0];
}

// only return the non-zero elements
// eg 3 days, 0 hours, 5 mins = 3 days, 0 hours, 5 mins
// eg 0 days, 0 hours, 5 mins = 5 mins
// eg 0 days, 0 hours, 0 mins = 0 mins
export function DurationStrTrim(str)
{
    let partList = str.split(",");
    let partListNew = [];

    let keepRemaining = false;
    for (let i = 0; i < partList.length; ++i)
    {
        let part = partList[i].trim();

        if (keepRemaining)
        {
            partListNew.push(partList[i]);
        }
        else if (part.charAt(0) != "0")
        {
            partListNew.push(partList[i]);
            keepRemaining = true;
        }
        else
        {
            // do nothing, drop
        }
    }

    if (partListNew.length == 0)
    {
        partListNew.push(partList[partList.length - 1]);
    }

    return partListNew.join(",").trim();
}

export function MsToDurationStrDaysHoursMinutes(ms)
{
    let full = MsToDurationStrDaysHoursMinutesSeconds(ms);

    return full.split(",").slice(0, 3).join(",").trim();
}

export function MsToDurationStrMinutes(ms)
{
    let full = MsToDurationStrDaysHoursMinutesSeconds(ms);

    return full.split(",").slice(2, 3).join(",").trim();
}

export function MsToDurationStrDaysHoursMinutesSeconds(ms)
{
    let val = ms;
    
    // ignore ms
    val = Math.floor(val / 1000);

    // how many days?
    let days = Math.floor(val / (24 * 60 * 60));
    val -= days * (24 * 60 * 60);

    // how many hours?
    let hours = Math.floor(val / (60 * 60));
    val -= hours * (60 * 60);

    // how many minutes?
    let mins = Math.floor(val / 60);
    val -= mins * 60;

    // how many seconds?
    let secs = val;

    let duration = "";
    duration += `${days}` + (days == 1 ? " day" : " days");
    duration += ", ";
    duration += `${hours}` + (hours == 1 ? " hour" : " hours");
    duration += ", ";
    duration += `${mins}` + (mins == 1 ? " min" : " mins");
    duration += ", ";
    duration += `${secs}` + (secs == 1 ? " sec" : " secs");

    return duration;
}


export function Rotate(arr, count)
{
    let retVal = [... arr];

    if (count > 0)
    {
        while (count)
        {
            retVal.unshift(retVal.pop());

            --count;
        }
    }
    else if (count < 0)
    {
        count = -count;

        while (count)
        {
            retVal.push(retVal.shift());

            --count;
        }
    }

    return retVal;
}

export function ListIntersectionUnique(leftList, rightList)
{
    let retVal = [];

    if (leftList.length == 0)
    {
        retVal = rightList;
    }
    else if (rightList.length == 0)
    {
        retVal = leftList;
    }
    else
    {
        let m = new Map();
    
        for (const left of leftList)
        {
            m.set(left, 1);
        }
    
        for (const right of rightList)
        {
            if (m.has(right))
            {
                m.set(right, 2);
            }
        }
    
        for (let [key, val] of m)
        {
            if (val == 2)
            {
                retVal.push(key);
            }
        }
    }


    retVal.sort();

    return retVal;
}


export function GetSearchParam(paramName, defaultValue)
{
    let retVal = defaultValue;
    const params = new URLSearchParams(window.location.search);

    if (params.has(paramName))
    {
        let val = params.get(paramName);

        if (val != "null" && val != undefined && val != "undefined")
        {
            retVal = val.trim();
        }
    }

    return retVal;
}

export function SetDomValBySearchParam(dom, paramName, defaultValue)
{
    const params = new URLSearchParams(window.location.search);

    dom.value = GetSearchParam(paramName, defaultValue);
}

export function SetDomCheckedBySearchParam(dom, paramName)
{
    const params = new URLSearchParams(window.location.search);

    dom.checked = params.get(paramName) != "0";
}


export function StrToCssClassName(col)
{
    return col.replace(/[.\s]/g, '_');
};

export function MakeTable(dataTable, synthesizeRowCountColumn)
{
    // build table
    let table = document.createElement("table");

    let rowHeader = dataTable[0];

    // build column group which allows styling to affect the entire column if desired
    // https://stackoverflow.com/questions/27234480/can-i-color-table-columns-using-css-without-coloring-individual-cells
    let colgroup = document.createElement("colgroup");
    if (synthesizeRowCountColumn)
    {
        let col = document.createElement("col");
        col.classList.add(StrToCssClassName("row_col"));
        colgroup.appendChild(col);
    }

    for (const colVal of rowHeader)
    {
        let col = document.createElement("col");
        try
        {
            col.classList.add(StrToCssClassName(`${colVal}_col`));
        }
        catch (e)
        {
        }
        colgroup.appendChild(col);
    }

    table.appendChild(colgroup);
    

    // build header
    let thead = document.createElement("thead");
    let trHeader = document.createElement("tr");
    trHeader.classList.add(StrToCssClassName("headerRow"));

    if (synthesizeRowCountColumn)
    {
        let thRow = document.createElement("th");
        thRow.innerHTML = "row";
        thRow.classList.add(StrToCssClassName("row_col"));
        thRow.classList.add(StrToCssClassName(`row_hdr`));
        trHeader.appendChild(thRow);
    }

    for (const colVal of rowHeader)
    {
        let th = document.createElement("th");
        th.innerHTML = colVal;
        
        try
        {
            th.classList.add(StrToCssClassName(`${colVal}_col`));
            th.classList.add(StrToCssClassName(`${colVal}_hdr`));
        }
        catch (e)
        {
        }

        trHeader.appendChild(th);
    }

    thead.appendChild(trHeader);
    table.appendChild(thead);
    

    // build body
    let tbody = document.createElement("tbody");
    for (let i = 1; i < dataTable.length; ++i)
    {
        let tr = document.createElement("tr");

        if (synthesizeRowCountColumn)
        {
            let tdRow = document.createElement("td");
            tdRow.classList.add(StrToCssClassName("row_col"));
            tdRow.classList.add(StrToCssClassName("row_data"));
            tdRow.innerHTML = i;
            tr.appendChild(tdRow);
        }

        let idx = 0;
        for (const colVal of dataTable[i])
        {
            let td = document.createElement("td");
            
            try
            {
                td.classList.add(StrToCssClassName(`${dataTable[0][idx]}_col`));
                td.classList.add(StrToCssClassName(`${dataTable[0][idx]}_data`));
            }
            catch (e)
            {
            }
    
            ++idx;
            td.innerHTML = colVal ?? "";

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}

export function MakeTableTransposed(dataTable)
{
    // build table
    let table = document.createElement("table");

    for (let i = 0; i < dataTable[0].length; ++i)
    {
        let tr = document.createElement("tr");
        
        let th = document.createElement("th");
        
        let col = dataTable[0][i];
        th.innerHTML = col;

        tr.appendChild(th);

        for (let j = 1; j < dataTable.length; ++j)
        {
            let val = dataTable[j][i];

            let td = document.createElement("td");
            td.innerHTML = val;

            tr.appendChild(td);
        }

        table.appendChild(tr);
    }

    return table;
}


export function SleepAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function CopyElementToClipboard(id)
{
    let dom = document.getElementById(id);
    let range = document.createRange();
    range.selectNode(dom);
    window.getSelection().addRange(range);
    document.execCommand('copy');
    let tmp = document.createElement("div");
    document.body.appendChild(tmp);
    range.selectNode(tmp);
    window.getSelection().addRange(range);
}

export function TableToCsv(table)
{
    let retVal = "";

    let trList = table.getElementsByTagName("tr");
    
    // gather header
    for (let row = 0; row < 1 && row < trList.length; ++row)
    {
        let tr = trList[row];

        let valList = [];
        let thList = tr.getElementsByTagName("th");

        for (const th of thList)
        {
            valList.push(`"${th.textContent}"`);
        }

        let csvRow = valList.join(",");
        retVal += csvRow + "\n";
    }

    // gather body
    for (let row = 1; row < trList.length; ++row)
    {
        const tr = trList[row];

        let valList = [];
        let tdList = tr.getElementsByTagName("td");

        for (const td of tdList)
        {
            valList.push(`"${td.textContent}"`);
        }

        let csvRow = valList.join(",");
        retVal += csvRow + "\n";
    }

    return retVal;
}

export function Download(filename, format, data)
{
    let href = format + "," + encodeURIComponent(data);

    let a = document.createElement('a');
    a.setAttribute("href", href);
    a.setAttribute("download", filename);

    document.body.appendChild(a); // required for firefox
    
    a.click();
    a.remove();
}

export function DownloadCsv(filename, data)
{
    let format = "data:text/csv;charset=utf-8";
    
    Download(filename, format, data);
}

export function DownloadKml(filename, data)
{
    let format = "data:application/vnd.google-earth.kml+xml;charset=utf-8";
    
    Download(filename, format, data);
}

export function MakeLink(url, label)
{
    return `<a href="${url}" target="_blank">${label}</a>`;
};


export function MakeFilename(str)
{
    return str.replace(/ /g, "_").replace(/:/g, "");
}

export function CtoF(tempC)
{
    return (tempC * (9/5) + 32);
}

export function CtoF_Round(tempC)
{
    return Math.round((tempC * (9/5) + 32));
}

export function KnotsToKph(knots)
{
    return knots * 1.852;
}

export function KnotsToKph_Round(knots)
{
    return Math.round(KnotsToKph(knots));
}

export function KnotsToMph(knots)
{
    return knots * 1.15078;
}

export function KnotsToMph_Round(knots)
{
    return Math.round(KnotsToMph(knots));
}

export function MtoFt(meters)
{
    return meters * 3.28084;
}

export function MtoFt_Round(meters)
{
    return Math.round(MtoFt(meters));
}



// https://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-deep-clone-an-object-in-javascript/50937561
// spiced up with structuredClone
//
// basically, recursively copy one object into another
// if member is another object, recurse into it
// append elements where they don't exist
// overwrite non-object members
//
// essentially, overlaying a copy of values from one object onto another
// composition
export function StructuredOverlay(obj, vals)
{
    let setVals = function (obj, vals) {
        if (obj && vals) {
            for (let x in vals) {
                if (vals.hasOwnProperty(x)) {
                    if (obj[x] && typeof vals[x] === 'object') {
                        obj[x] = setVals(obj[x], vals[x]);
                    } else {
                        obj[x] = structuredClone(vals[x]);
                    }
                }
            }
        }
        return obj;
    };

    setVals(obj, vals);
}



// thanks chatgpt
export async function SaveToFile(text, suggestedName) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = suggestedName;
    anchor.click();
    URL.revokeObjectURL(url); // Clean up the object URL
}

// thanks chatgpt
// eg acceptType ".json" or "text/plain"
export async function LoadFromFile(acceptType) {
    return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        if (acceptType)
        {
            input.accept = acceptType;
        }
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


export function GiveHotkeysVSCode(dom, onSaveCb)
{
    const handler = new DomHotkeyHandler(dom, onSaveCb);
}

// thanks chatgpt for the structure but the implementation needed near rewrite
class DomHotkeyHandler {
    constructor(dom, onSaveCb) {

        this.dom = dom;
        this.onSaveCb = onSaveCb == undefined ? () => {} : onSaveCb;
        this.undoStack = [];
        this.lastInputWasUndoable = false;

        this.init();
    }

    // Initialize the event listener
    init() {
        this.dom.addEventListener("keydown", (event) => {
            if (event.ctrlKey && event.key.toLowerCase() === "z") {
                if (this.lastInputWasUndoable)
                {
                    this.undo();
                    this.lastInputWasUndoable = true;
                    event.preventDefault();
                    this.dom.dispatchEvent(new Event('input'));
                }
            } else if (event.ctrlKey && event.key === "/") {
                this.toggleComment();
                this.lastInputWasUndoable = true;
                event.preventDefault();
                this.dom.dispatchEvent(new Event('input'));
            } else if (event.shiftKey && event.altKey && event.key === "ArrowUp") {
                this.duplicateLineUp();
                this.lastInputWasUndoable = true;
                event.preventDefault();
                this.dom.dispatchEvent(new Event('input'));
            } else if (event.shiftKey && event.altKey && event.key === "ArrowDown") {
                this.duplicateLineDown();
                this.lastInputWasUndoable = true;
                event.preventDefault();
                this.dom.dispatchEvent(new Event('input'));
            } else if (event.altKey && event.key === "ArrowUp") {
                this.swapLineUp();
                this.lastInputWasUndoable = true;
                event.preventDefault();
                this.dom.dispatchEvent(new Event('input'));
            } else if (event.altKey && event.key === "ArrowDown") {
                this.swapLineDown();
                this.lastInputWasUndoable = true;
                event.preventDefault();
                this.dom.dispatchEvent(new Event('input'));
            } else if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "k") {
                this.deleteLine();
                this.lastInputWasUndoable = true;
                event.preventDefault();
                this.dom.dispatchEvent(new Event('input'));
            } else if (event.ctrlKey && event.key.toLowerCase() === "s") {
                event.preventDefault();
                this.lastInputWasUndoable = true;
                this.dom.dispatchEvent(new Event('input'));
                this.onSaveCb();
            } else {
                this.lastInputWasUndoable = false;
            }
        });
    }

    // Save the current state to undo stack
    saveState() {
        this.undoStack.push({
            value: this.dom.value,
            selectionStart: this.dom.selectionStart,
            selectionEnd: this.dom.selectionEnd,
        });
    }

    // Restore the last saved state
    undo() {
        const lastState = this.undoStack.pop();
        if (lastState) {
            this.dom.value = lastState.value;
            this.dom.setSelectionRange(lastState.selectionStart, lastState.selectionEnd);
        }
    }

    // Get current line details
    getLineDetails() {
        const value = this.dom.value;
        const lines = value.split("\n");
        const cursorPos = this.dom.selectionStart;

        let charCount = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (cursorPos <= charCount + line.length) {
                return {
                    lines,
                    lineIndex: i,
                    lineText: line,
                    lineStart: charCount,
                    relativeCursor: cursorPos - charCount,
                };
            }
            charCount += line.length + 1;
        }
        return { lines: [], lineIndex: -1, lineText: "", lineStart: 0, relativeCursor: 0 };
    }

    // Ctrl + /
    toggleComment() {
        this.saveState();
        const { lines, lineIndex, lineText, lineStart, relativeCursor } = this.getLineDetails();
        if (lineIndex === -1) return;

        const isCommented = lineText.trim().startsWith("//");
        const cursorOffset = isCommented ? -3 : 3;

        if (isCommented) {
            lines[lineIndex] = lineText.replace(/^(\s*)\/\/\s?/, "$1");
        } else {
            lines[lineIndex] = lineText.replace(/^(\s*)/, "$1// ");
        }

        this.dom.value = lines.join("\n");
        this.dom.setSelectionRange(lineStart + relativeCursor + cursorOffset, lineStart + relativeCursor + cursorOffset);
    }

    // Shift + Alt + Up
    duplicateLineUp() {
        this.saveState();
        const { lines, lineIndex, lineText, lineStart, relativeCursor } = this.getLineDetails();
        lines.splice(lineIndex, 0, lineText);
        this.dom.value = lines.join("\n");

        this.dom.setSelectionRange(lineStart + relativeCursor, lineStart + relativeCursor);
    }

    // Shift + Alt + Down
    duplicateLineDown() {
        this.saveState();
        const { lines, lineIndex, lineText, lineStart, relativeCursor } = this.getLineDetails();
        lines.splice(lineIndex + 1, 0, lineText);
        this.dom.value = lines.join("\n");

        this.dom.setSelectionRange(lineStart + lineText.length + relativeCursor + 1, lineStart + lineText.length + relativeCursor + 1);
    }

    // Alt + Up
    swapLineUp() {
        this.saveState();
        const { lines, lineIndex, lineText, lineStart, relativeCursor } = this.getLineDetails();
        if (lineIndex > 0) {
            // calc new cursor index
            let cursorIdx = lineStart - lines[lineIndex - 1].length - 1 + relativeCursor;

            // swap lines
            [lines[lineIndex - 1], lines[lineIndex]] = [lines[lineIndex], lines[lineIndex - 1]];

            this.dom.value = lines.join("\n");
            this.dom.setSelectionRange(cursorIdx, cursorIdx);
        }
    }

    // Alt + Down
    swapLineDown() {
        this.saveState();
        const { lines, lineIndex, lineText, lineStart, relativeCursor } = this.getLineDetails();
        if (lineIndex < lines.length - 1) {
            // calc new cursor index
            let cursorIdx = lineStart + lines[lineIndex + 1].length + 1 + relativeCursor;

            // swap lines
            [lines[lineIndex], lines[lineIndex + 1]] = [lines[lineIndex + 1], lines[lineIndex]];

            this.dom.value = lines.join("\n");
            this.dom.setSelectionRange(cursorIdx, cursorIdx);
        }
    }

    // Ctrl + Shift + K
    deleteLine() {
        this.saveState();
        const { lines, lineIndex, lineText, lineStart, relativeCursor } = this.getLineDetails();

        let lineIndexNew = 0;
        if (lineIndex < lines.length - 1)
        {
            // you are not the last line (perhaps only line)
            // you will be replaced by the line that follows if there is one
            lineIndexNew = lineIndex + 1;
        }
        else
        {
            // you are the last line (perhaps only line)
            // you will be replaced by the line that precedes you if there is one
            lineIndexNew = lineIndex - 1;
        }

        let cursorIdx = 0;
        if (lines.length == 1)
        {
            // you are the only line, no replacement coming
            // default index here
        }
        else
        {
            // the replacement line exists and will take your place
            let lineTextNew = lines[lineIndexNew];

            // the replacement line may be shorter than you, so at a maximum
            // go to the end of it to keep your place.
            let relativeCursorNew = Math.min(relativeCursor, lineTextNew.length);

            // is your replacement above or below you?
            if (lineIndexNew < lineIndex)
            {
                // above
                cursorIdx = lineStart - lineTextNew.length - 1 + relativeCursorNew;
            }
            else
            {
                // below
                cursorIdx = lineStart + relativeCursorNew;
            }
        }

        lines.splice(lineIndex, 1);
        this.dom.value = lines.join("\n");

        this.dom.setSelectionRange(cursorIdx, cursorIdx);
    }
}
