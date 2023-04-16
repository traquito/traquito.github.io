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

export function ParseTimeToMs(timeStr)
{
    let timeStrIso = ParseDateTimeToIsoString(timeStr);
    
    let ms = Date.parse(timeStrIso);

    return ms;
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


export function SetDomValBySearchParam(dom, paramName)
{
    const params = new URLSearchParams(window.location.search);

    if (params.has(paramName))
    {
        let val = params.get(paramName);

        if (val != "null")
        {
            dom.value = val;
        }
    }
}

export function SetDomCheckedBySearchParam(dom, paramName)
{
    const params = new URLSearchParams(window.location.search);

    dom.checked = params.get(paramName) != "0";
}




export function MakeTable(dataTable, synthesizeRowCountColumn)
{
    // build table
    let table = document.createElement("table");

    // build header
    let thead = document.createElement("thead");
    let rowHeader = dataTable[0];
    let trHeader = document.createElement("tr");
    trHeader.classList.add("headerRow");

    if (synthesizeRowCountColumn)
    {
        let thRow = document.createElement("th");
        thRow.innerHTML = "row";
        trHeader.appendChild(thRow);
    }

    for (const colVal of rowHeader)
    {
        let th = document.createElement("th");
        th.innerHTML = colVal;

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
            tdRow.innerHTML = i;
            tr.appendChild(tdRow);
        }

        for (const colVal of dataTable[i])
        {
            let td = document.createElement("td");

            td.innerHTML = colVal;

            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    return table;
}

