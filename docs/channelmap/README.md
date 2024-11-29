---
icon: material/view-grid-compact

hide:
  - toc
---

# Channel Map

<html>
    <head>

        <script type='module'>
import * as utl from '/js/Utl.js';
import { WSPR } from '/js/WSPR.js';
import { QuerierWsprLive } from '/js/QuerierWsprLive.js';
import { QuerierQrpLabs } from '/js/QuerierQrpLabs.js';
import { QuerierLu7aa } from '/js/QuerierLu7aa.js';

export class App
{
    constructor()
    {
        this.tdAttrSet = new Set();

        this.wspr = new QuerierWsprLive();
        this.qrp  = new QuerierQrpLabs();
        this.lu7aa  = new QuerierLu7aa();

        this.domBand = document.getElementById("band");
        this.domLookbackDays = document.getElementById("lookbackDays");
        this.domGo = document.getElementById("go");
        this.domQueryLink = document.getElementById("queryLink");
        this.domDoQueryWsprLive = document.getElementById("doQueryWsprLive");
        this.domDoQueryQrpLabs = document.getElementById("doQueryQrpLabs");
        this.domDoQueryLu7aa = document.getElementById("doQueryLu7aa");
        this.domStatus = document.getElementById("status");

        this.domBand.onchange = e => {
            this.OnFormChange();
        };

        this.doLookback = () => {
            let lookbackDays = this.GetLookbackDays();

            if (lookbackDays == 0)
            {
                lookbackDays = 30;
            }

            this.domLookbackDays = lookbackDays;

            this.OnFormChange();
        };

        this.domGo.onclick = e => {
            this.OnFormChange();
        };

        this.domDoQueryWsprLive.onclick = e => {
            this.OnFormChange();
        };

        this.domDoQueryQrpLabs.onclick = e => {
            this.OnFormChange();
        };

        this.domDoQueryLu7aa.onclick = e => {
            this.OnFormChange();
        };

        this.OnPageLoad();
    }

    GetBand()
    {
        return this.domBand.value;
    }

    GetDateStart()
    {
        return utl.MakeDateFromMs(
            Date.now() - 
            (this.GetLookbackDays() * 24 * 60 * 60 * 1000)
        );
    }
    
    GetDateEndDisplay()
    {
        return utl.MakeDateFromMs(Date.now());
    }

    GetDateEndQuery()
    {
        return utl.MakeDateFromMs(
            Date.now() +
            (1 * 24 * 60 * 60 * 1000));
    }

    GetDoQueryWsprLive()
    {
        return this.domDoQueryWsprLive.checked;
    }

    GetDoQueryQrpLabs()
    {
        return this.domDoQueryQrpLabs.checked;
    }

    GetDoQueryLu7aa()
    {
        return this.domDoQueryLu7aa.checked;
    }

    SetStatus(status)
    {
        this.domStatus.innerHTML = status;
    }

    SetQueryLink(query)
    {
        let urlMaker = new URL(`/pro/query/`, window.location);
        urlMaker.searchParams.set("query", query);

        this.domQueryLink.href = urlMaker.href;
    }

    OnFormChange()
    {
        // load up the url
        let url = new URL(window.location);

        url.searchParams.set("band", this.GetBand());
        url.searchParams.set("lookbackDays", this.domLookbackDays.value);
        url.searchParams.set("doQueryWsprLive", this.domDoQueryWsprLive.checked ? "1" : "0");
        url.searchParams.set("doQueryQrpLabs", this.domDoQueryQrpLabs.checked ? "1" : "0");
        url.searchParams.set("doQueryLu7aa", this.domDoQueryLu7aa.checked ? "1" : "0");

        if (this.GetLookbackDays() != 0)
        {
            window.location = url.href;
        }
    }

    OnPageLoad()
    {
        utl.SetDomValBySearchParam(this.domBand, "band", this.GetBand());
        utl.SetDomValBySearchParam(this.domLookbackDays, "lookbackDays", 30);
        utl.SetDomCheckedBySearchParam(this.domDoQueryWsprLive, "doQueryWsprLive", this.GetDoQueryWsprLive());
        utl.SetDomCheckedBySearchParam(this.domDoQueryQrpLabs, "doQueryQrpLabs", this.GetDoQueryQrpLabs());
        utl.SetDomCheckedBySearchParam(this.domDoQueryLu7aa, "doQueryLu7aa", this.GetDoQueryLu7aa());

        if (this.GetLookbackDays() == 0)
        {
            this.doLookback();
        }

        this.PopulateTable();
        this.PopulateLegend();
    }

    GetLookbackDays()
    {
        let retVal = parseInt(this.domLookbackDays.value);

        if (isNaN(retVal))
        {
            retVal = 0;
        }

        return retVal;
    }

    PopulateLegend()
    {
        let lBalloon = document.getElementById("legendBalloon");
        let lTracked = document.getElementById("legendTracked");
        let lBoth = document.getElementById("legendBoth");

        lBalloon.style.backgroundColor = "rgb(255,255,178)";
        lTracked.style.backgroundColor = "rgb(255,191,191)";;
        lBoth.style.background = "linear-gradient(90deg, rgba(255,255,0,1) 0%, rgba(255,140,140,1) 100%)";

        lBalloon.innerHTML = "Coded Telem seen";
        lTracked.innerHTML = "Channel Tracked";
        lBoth.innerHTML = "Both";
    }

    MakeTableFor(band, id1List)
    {
        let id3List = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`];

        // the table
        let table = document.createElement(`table`);
        table.classList.add("mainTable");

        // create table header
        let colNameList = [];
        for (const id1 of id1List)
        {
            for (const id3 of id3List)
            {
                let colName = id1 + id3;

                colNameList.push(colName);
            }
        }

        colNameList.push(`min`)
        colNameList.push(`lane`);
        colNameList.push(`freq`);
        let trHeader = document.createElement(`tr`);
        for (const colName of colNameList)
        {
            let th = document.createElement(`th`);
            th.innerHTML = colName;

            trHeader.appendChild(th);
        }
        table.appendChild(trHeader);

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);

        let freqTxLow = dialFreq + 1500 - 100;
        let freqTxHigh = dialFreq + 1500 + 100;
        let freqTxWindow = freqTxHigh - freqTxLow;

        let freqBandCount = 5;
        let bandSizeHz = freqTxWindow / freqBandCount;

        let freqBandList = [1, 2, 4, 5];    // skip middle band 3, but really label as 1,2,3,4

        let minuteList = WSPR.GetMinuteListForBand(band);

        let rowCount = 0;
        for (const freqBand of freqBandList)
        {
            // figure out the frequency
            let freqBandLow    = (freqBand - 1) * bandSizeHz;
            let freqBandHigh   = freqBandLow + bandSizeHz;
            let freqBandCenter = (freqBandHigh + freqBandLow) / 2;

            let rowsPerCol = freqBandCount * freqBandList.length;

            for (const minute of minuteList)
            {
                let freqBandLabel = freqBand;
                if (freqBandLabel >= 4) { freqBandLabel = freqBandLabel - 1; }
                
                let tr = document.createElement(`tr`);
                
                for (const id1 of id1List)
                {
                    let colCount = 0;
                    let id1Offset = 0;
                    if (id1 == `1`) { id1Offset = 200; }
                    if (id1 == 'Q') { id1Offset = 400; }

                    for (const id3 of id3List)
                    {
                        let channel = id1Offset + (colCount * rowsPerCol) + rowCount;
                        
                        let td = document.createElement(`td`);
                        td.innerHTML = channel;

                        td.id = `channel-${channel}`;

                        this.GiveTdAttributes(td, {
                            id1: id1,
                            id3, id3,
                            channel, channel,
                            freqBand, freqBand,
                            freqBandLabel, freqBandLabel,
                            minute, minute,
                        });

                        let id3ListFirst = id3List[0];
                        let id3ListLast  = id3List[id3List.length - 1];

                        if (id3 == id3ListFirst)
                        {
                            td.classList.add(`id1ColFirst`);
                        }

                        if (id3 == id3ListLast)
                        {
                            td.classList.add(`id1ColLast`);
                        }

                        tr.appendChild(td);
    
                        ++colCount;
                    }
                }

                let tdMin = document.createElement(`td`);
                tdMin.innerHTML = minute;

                let tdFreq = document.createElement(`td`);
                tdFreq.innerHTML = utl.Commas(freqTxLow + freqBandCenter);

                let tdFreqBand = document.createElement(`td`);

                tdFreqBand.innerHTML = freqBandLabel;

                for (const td of [tdMin, tdFreqBand, tdFreq])
                {
                    td.classList.add(`freqBand-${freqBand}`);
                    td.classList.add(`freqBandLabel-${freqBandLabel}`);
                    tr.appendChild(td);
                }

                let minuteFirst = minuteList[0];
                let minuteLast  = minuteList[minuteList.length - 1];

                if (minute == minuteFirst)
                {
                    tr.classList.add("freqBandRowFirst");
                }

                if (minute == minuteLast)
                {
                    tr.classList.add("freqBandRowLast");
                }
                
                table.appendChild(tr);

                ++rowCount;
            }
        }

        return table;
    }

    TdHasBalloonTelemetry(td)
    {
        let attrs = this.GetTdAttributes(td);

        return attrs.count != undefined;
    }

    GiveTdAttributes(td, attrObj)
    {
        for (const [key, value] of Object.entries(attrObj))
        {
            td.setAttribute(`data-${key}`, value);

            this.tdAttrSet.add(key);
        }
    }

    GetTdAttributes(td)
    {
        let retVal = {};

        for (const attrName of this.tdAttrSet)
        {
            retVal[attrName] = td.getAttribute(`data-${attrName}`);
        }

        return retVal;
    }

    infoFrozen = false;
    OnClickTd()
    {
        this.infoFrozen = !this.infoFrozen;
    }

    MakeSpotSearchUrl(channel, callsign)
    {
        let url = new URL(`/search/spots/dashboard/`, window.location);

        url.searchParams.set("band", this.GetBand());
        url.searchParams.set("channel", channel);
        url.searchParams.set("callsign", callsign);

        return url.href;
    }

    OnTdChannelHover(td)
    {
        let attrs = this.GetTdAttributes(td);

        // decide how to transcribe attributes without enrichment
        let descValMap = {};

        // determine list of callsigns
        let callSet = new Set();
        if (attrs.qrpCallsign)
        {
            callSet.add(attrs.qrpCallsign.toUpperCase().split("-")[0]);
        }
        if (attrs.lu7aaCallsign)
        {
            callSet.add(attrs.lu7aaCallsign.toUpperCase().split("-")[0]);
        }

        let callList = Array.from(callSet);
        callList.sort();

        // make list of callsign searches
        let linkList = [];
        for (const call of callList)
        {
            let url = this.MakeSpotSearchUrl(attrs.channel, call);

            let link = `<a href="${url}" target="_blank">${call}</a>`;

            linkList.push(link);
        }

        // ensure there's a link even if no callsigns
        if (linkList.length == 0)
        {
            let url = this.MakeSpotSearchUrl(attrs.channel, "");

            let link = `<a href="${url}" target="_blank">search</a>`;

            linkList.push(link);
        }


        descValMap["Channel"] = attrs.channel;
        descValMap["Spot Search"] = linkList.join(" ");
        descValMap["Coded Telemetry Count"] = attrs.count ? attrs.count : 0;
        descValMap["QRP Tracking?"] = attrs.qrpTracking ? "yes" : "no";
        descValMap["QRP Callsign"] = attrs.qrpTracking ? attrs.qrpCallsign : "";
        descValMap["QRP Page"] = attrs.qrpTracking ? `<a target="_blank" href='${attrs.qrpUrl}'>${attrs.qrpFlightName}</a>` : "";
        descValMap["lu7aa Tracking?"] = attrs.lu7aaTracking ? "yes" : "no";
        descValMap["lu7aa Callsign"] = attrs.lu7aaTracking ? attrs.lu7aaCallsign : "";
        descValMap["lu7aa Page"] = attrs.lu7aaTracking ? `<a target="_blank" href='${attrs.lu7aaUrl}'>${attrs.lu7aaCallsign}</a>` : "";

        // construct and use table
        let table = document.createElement("table");
        for (let [desc, val] of Object.entries(descValMap))
        {
            let tr = document.createElement("tr");

            let tdDesc = document.createElement("th");
            let tdVal = document.createElement("td");

            if (val == undefined)
            {
                val = "";
            }

            tdDesc.innerHTML = desc;
            tdVal.innerHTML = val;

            tr.appendChild(tdDesc);
            tr.appendChild(tdVal);

            if (val != undefined)
            {
                table.appendChild(tr);
            }
        }

        if (!this.infoFrozen)
        {
            let info = document.getElementById("info");
            info.innerHTML = "";
            info.appendChild(table);
        }
    }

    MakeTable()
    {
        let id1List = [`0`, `1`, `Q`];

        let band = this.GetBand();
        let table = this.MakeTableFor(band, id1List);

        for (let td of table.getElementsByTagName("td"))
        {
            if (td.id.includes("channel-"))
            {
                td.onmouseover = e => {
                    this.OnTdChannelHover(td);
                };

                td.onclick = e => {
                    this.OnClickTd();
                    this.OnTdChannelHover(e.target);
                };

                let channel = td.id.split("-")[1];

                this.GiveTdAttributes(td, {
                    channel : channel,
                });
            }
        }

        document.getElementById(`channelTarget`).appendChild(table);

        this.tdList = table.getElementsByTagName(`td`);

        // force the mosueover event to happen to get the table to show up
        this.OnTdChannelHover(document.createElement("td"));
    }

    GetTdByKey(id1, id3, freqBandLabel, minute)
    {
        let retVal = null;

        for (const td of this.tdList)
        {
            let attrs = this.GetTdAttributes(td);

            if (attrs.id1 == id1 &&
                attrs.id3 == id3 &&
                attrs.freqBandLabel == freqBandLabel &&
                attrs.minute == minute)
            {
                retVal = td;
                break;
            }
        }

        return retVal;
    }

    GetTdByChannel(channel)
    {
        return document.getElementById(`channel-${channel}`);
    }

    SetQueryWsprLiveLink()
    {
        let band = this.GetBand();
        let timeStart = this.GetDateStart();
        let timeEnd = this.GetDateEndQuery();

        let query = this.wspr.GetPossibleBalloonTelemetryU4BQuery(band, timeStart, timeEnd);
        this.SetQueryLink(query);
    }

    async QueryWsprLive()
    {
        let band = this.GetBand();
        let timeStart = this.GetDateStart();
        let timeEnd = this.GetDateEndQuery();

        let dataTable = await this.wspr.GetPossibleBalloonTelemetryU4B(band, timeStart, timeEnd);

        console.log("got wspr data");

        // first pass - find highest value
        let max = 0;
        for (const rowData of dataTable)
        {
            let [id1, id3, minute, freqBand, freqBandLabel, count] = rowData;

            count = parseInt(count);

            if (count > max)
            {
                max = count;
            }
        }

        for (const rowData of dataTable)
        {
            let [id1, id3, minute, freqBand, freqBandLabel, count] = rowData;
            count = parseInt(count);

            // filter out bad data
            let useData = true;
            if (!([1, 2, 3, 4].includes(freqBandLabel))) { useData = false; }
            if ((minute % 2) != 0) { useData = false; }

            if (useData)
            {
                let minOfChannel = minute - 2;
                if (minOfChannel == -2) { minOfChannel = 8; }

                let td = this.GetTdByKey(id1, id3, freqBandLabel, minOfChannel);
                
                if (td)
                {
                    let pct = count / max * 100;
                    let pctClamp = pct;

                    // boost the color because hard to see
                    let pctMin = 0;

                    if (count >= 50)
                    {
                        pctMin = 10;
                    }
                    if (count >= 100)
                    {
                        pctMin = 20;
                    }
                    if (count >= 1000)
                    {
                        pctMin = 30;
                    }
                    if (count >= 10000)
                    {
                        pctMin = 40;
                    }

                    if (pct < pctMin)
                    {
                        pctClamp = pctMin;
                    }
                    else
                    {
                        pctClamp += pctMin;

                        if (pctClamp > 100)
                        {
                            pctClamp = 100;
                        }
                    }

                    // make the color math work
                    let pctColor = 100 - pctClamp;

                    if (pctMin != 0)
                    {
                        let rgbColor = utl.ColorPctBetween(pctColor, "white", "yellow");
                        td.style.backgroundColor = rgbColor;
                    }

                    this.GiveTdAttributes(td, {
                        count : utl.Commas(count),
                        pct: Math.round(pct),
                    });
                }
                else
                {
                    console.log(`looking for ${id1} ${id3} ${freqBand} ${freqBandLabel} ${minute}`);
                    console.log("ERR COULDN'T FIND");
                    console.log(rowData);
                }
            }
        }
    }

    async QueryQrpLabs()
    {
        let rowList = await this.qrp.GetChannelData();

        console.log("got qrp data");

        for (const row of rowList)
        {
            let [flightName, url, callsign, channel, lastHeard, altitude] = row;

            let td = this.GetTdByChannel(channel);

            if (td)
            {
                let pct = 25;
                let pctUse = 100 - pct;
                let rgbColor = utl.ColorPctBetween(pctUse, "white", "red");

                this.GiveTdAttributes(td, {
                    qrpFlightName : flightName,
                    qrpUrl: url,
                    qrpCallsign: callsign,
                    qrpTracking: true,
                });

                if (this.TdHasBalloonTelemetry(td) == false)
                {
                    td.style.background = rgbColor;
                }
                else
                {
                    td.style.background = "linear-gradient(90deg, rgba(255,255,0,1) 0%, rgba(255,191,191,1) 100%)";
                }
            }
            else
            {
                console.log(`Could not find td for channel ${channel}`);
            }
        }
    }

    async QueryLu7aa()
    {
        let rowList = await this.lu7aa.GetChannelData();

        console.log("got lu7aa data");

        for (const row of rowList)
        {
            let [rowNum, url, call, band, id, tslot, detail, launchDateTime, ssid, tracker, channel, freqHzStr, days] = row;

            if (band == this.GetBand() || band == "all")
            {
                let td = this.GetTdByChannel(channel);

                if (td)
                {
                    let pct = 25;
                    let pctUse = 100 - pct;
                    let rgbColor = utl.ColorPctBetween(pctUse, "white", "red");

                    this.GiveTdAttributes(td, {
                        lu7aaTracking: true,
                        lu7aaCallsign : call + "-" + ssid,
                        lu7aaUrl: url,
                    });

                    if (this.TdHasBalloonTelemetry(td) == false)
                    {
                        td.style.background = rgbColor;
                    }
                    else
                    {
                        td.style.background = "linear-gradient(90deg, rgba(255,255,0,1) 0%, rgba(255,191,191,1) 100%)";
                    }
                }
                else
                {
                    if (channel.trim() != "")
                    {
                        console.log(`Could not find td for channel "${channel}"`);
                    }
                }
            }
        }
    }

    async PopulateTable()
    {
        this.MakeTable();

        const params = new URLSearchParams(window.location.search);

        this.SetStatus("Loading...");
        
        this.SetQueryWsprLiveLink();
        if (this.GetDoQueryWsprLive())
        {
            this.SetStatus("Loading WsprLive...");
            await this.QueryWsprLive();
        }
        
        if (this.GetDoQueryQrpLabs())
        {
            this.SetStatus("Loading QRP Labs...");
            await this.QueryQrpLabs();
        }
        
        if (this.GetDoQueryLu7aa())
        {
            this.SetStatus("Loading lu7aa...");
            await this.QueryLu7aa();
        }

        this.SetStatus("Load complete");
    }
}

export let app = null;

window.addEventListener('DOMContentLoaded', (event) => {
    app = new App();
    window.app = app;
});

</script>

<!-- overrides -->
<link rel="stylesheet" href="/css/mkdocs.css">

<style>
table {
    border: 1px solid black;
    border-collapse: collapse;
}

th, td {
    border: 1px solid lightgrey;
    border-collapse: collapse;
}

th {
    min-width: 30px;
    background-color: lightblue;
    border: 1px solid black;
}

td {
    text-align: center;
}

.possibleBalloonTelemetry {
    background-color: yellow;
}

.id1ColLast {
    border-right: 2px solid black;
}

.freqBandRowFirst {
    border-top: 2px solid black;
}

.freqBandRowLast {
    border-bottom: 2px solid black;
}

/*
https://codepen.io/kevintcoughlin/pen/xVqyGV
*/

table {
    overflow: hidden;
    z-index: 1;
}

td, th, .row, .col {
    /* cursor: pointer; */
    position: relative;
}

td:hover::before,
.row:hover::before { 
    background-color: lightblue;
    content: '\00a0';  
    height: 100%;
    /* left: -5000px; */
    position: absolute;  
    top: 0;
    width: 10000px;   
    z-index: -1;        
}

td:hover::after,
.col:hover::after { 
    background-color: lightblue;
    content: '\00a0';  
    height: 10000px;    
    left: 0;
    position: absolute;  
    top: -5000px;
    width: 100%;
    z-index: -1;        
}

label {
    user-select: none;
}

#info td, #info th {
    min-width: 90px;
    text-align: left;
    padding-left: 5px;

    overflow: hidden;
}

.legendContainer {
    padding-top: 3px;
    padding-bottom: 7px;
}

.legend {
    border: 1px solid black;
    display: inline-block;
    min-width: 100px;
    text-align: center;
}

</style>

    </head>
    <body>
        <div class="page">

        Band
        <select id="band" class="select_not_styled">
            <option value="2190m">2190m (LF)</option>
            <option value="630m">630m (MF)</option>
            <option value="160m">160m</option>
            <option value="80m">80m</option>
            <option value="60m">60m</option>
            <option value="40m">40m</option>
            <option value="30m">30m</option>
            <option value="20m" selected>20m</option>
            <option value="17m">17m</option>
            <option value="15m">15m</option>
            <option value="12m">12m</option>
            <option value="10m">10m</option>
            <option value="6m">6m</option>
            <option value="4m">4m</option>
            <option value="2m">2m</option>
            <option value="70cm">70cm</option>
            <option value="23cm">23cm</option>
        </select>
        <label for='lookbackDays'>Telemetry Lookback Days </label><input class="input_not_styled" id='lookbackDays'  type="number" min="1" value="30" title="Lookback Days" style="width: 50px;">
        <button id="go" class="button_not_styled">search</button>
        <a id="queryLink" target="_blank" href="" style="display: none">(wspr.live data)</a>
        <a href="/faq/channels" target="_blank">[Help]</a>
        <br/>
        <label for='doQueryWsprLive'>query wspr.live </label><input id='doQueryWsprLive' type='checkbox' checked> |
        <label for='doQueryQrpLabs'>query qrp labs </label><input id='doQueryQrpLabs' type='checkbox' checked> |
        <label for='doQueryLu7aa'>query lu7aa </label><input id='doQueryLu7aa' type='checkbox' checked> |
        <span id="status"></span>
        <br/>
        <div id="channelTarget"></div>
        <div class="legendContainer">
            <div id='legendBalloon' class="legend"></div>
            <div id='legendTracked' class="legend"></div>
            <div id='legendBoth' class="legend"></div>
        </div>
        Click table to freeze/unfreeze info
        <br/>
        <div id="info"></div>
        <br/>
        <br/>
        <a target="_blank" href="https://www.qrp-labs.com/track/tracking.html">Hans' QRP Labs U4B Tracking</a>
        <br/>
        <a target="_blank" href="http://lu7aa.org/wsprset.asp">lu7aa tracking</a>
    </div>
    </body>
</html>
