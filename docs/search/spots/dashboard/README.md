<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Spot Search Dashboard - Traquito</title>


        <script src="/js/sorttable.js"></script>
<!-- https://github.com/apvarun/toastify-js/blob/master/README.md -->
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/toastify-js"></script>
<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">


<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-07H1M3KB40"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-07H1M3KB40');
</script>

        <script type='module'>
import * as autl from '/trackergui/js/AppUtl.js';
import { TabularData } from '/js/TabularData.js';
import * as utl from '/js/Utl.js';
import { SpotSearchRegular, SpotSearchCombined } from '/js/SpotSearch.js';
import { WSPR } from '/js/WSPR.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { GreatCircle } from '/js/GreatCircle.js';
import { Timeline } from '/js/Timeline.js';


class RadioCheckbox
{
    constructor(name)
    {
        this.fn = () => {};
        this.val = null;

        this.domInputList = document.getElementsByName(name);

        for (const domInput of this.domInputList)
        {
            domInput.addEventListener("change", e => {
                // update cached value
                this.val = domInput.value;

                // store value
                localStorage.setItem(name, this.val);

                // fire event
                this.fn(this.val);
            });

            if (domInput.checked)
            {
                // update cached value
                this.val = domInput.value;
            }
        }

        // check if value in local storage
        if (localStorage.getItem(name) != null)
        {
            this.val = localStorage.getItem(name);
        }

        // ensure a cached value
        if (this.val != null)
        {
            // store value
            localStorage.setItem(name, this.val);

            // ensure correct radio button is checked
            for (let domInput of this.domInputList)
            {
                if (domInput.value == this.val)
                {
                    domInput.checked = true;
                }
            }
        }
    }

    SetOnChangeCallback(fn)
    {
        this.fn = fn;

        // synthesize callback to bootstrap functionality
        this.fn(this.val);
    }
}


export class App
{
    constructor()
    {
        this.tdAttrSet = new Set();

        this.domBand = document.getElementById("band");
        this.domChannel = document.getElementById("channel");
        this.domCallsign = document.getElementById("callsign");
        this.domDtGte = document.getElementById("dtGte");
        this.domDtLte = document.getElementById("dtLte");
        this.domGo = document.getElementById("go");
        this.domAutoRefresh = document.getElementById("autoRefresh");
        this.domAutoRefreshLabel = document.getElementById("autoRefreshLabel");
        this.domUpdateMsg = document.getElementById("updateMsg");
        this.domUpdateNext = document.getElementById("updateNext");
        this.domLatestAge = document.getElementById("latestAge");
        this.domQueryLinkRegular = document.getElementById("queryLinkRegular");
        this.domQueryLinkEncoded = document.getElementById("queryLinkEncoded");
        this.domStatus = document.getElementById("status");
        this.domTargetTableCombined = document.getElementById("targetTableCombined");
        this.rcCols = new RadioCheckbox("colsVisible");
        this.rcUnits = new RadioCheckbox("units");
        this.domDownloadCombined = document.getElementById("downloadCombined");
        this.domDownloadKmlAlt = document.getElementById("downloadKmlAlt");
        this.domDownloadKmlNoAlt = document.getElementById("downloadKmlNoAlt");
        this.domCopyCombined = document.getElementById("copyCombined");
        
        // make page params available
        utl.SetDomValBySearchParam(this.domBand, "band", this.GetBand());
        utl.SetDomValBySearchParam(this.domChannel, "channel", this.GetChannel());
        utl.SetDomValBySearchParam(this.domCallsign, "callsign", this.GetCallsign());
        utl.SetDomValBySearchParam(this.domDtGte, "dtGte", this.domDtGte.value.trim());
        utl.SetDomValBySearchParam(this.domDtLte, "dtLte", this.domDtLte.value.trim());
        this.debug = utl.GetSearchParam("debug", false);

        // keep state
        this.t = new Timeline();
        this.t.Event("App");

        // prevent spaces in callsign
        this.domCallsign.addEventListener("keydown", (e) => {
            let retVal = true;

            if (e.which === 32)
            {
                e.preventDefault();
                retVal = false;
            }

            return retVal;
        });

        this.domGo.onclick = e => {
            this.OnFormChange();
        };

        // make pressing enter the same as clicking the search button
        let SubmitOnEnter = e => {
            if (event.key === "Enter") {
                e.preventDefault();
                this.domGo.onclick();
            }
        };
        this.domChannel.addEventListener("keypress", SubmitOnEnter);
        this.domCallsign.addEventListener("keypress", SubmitOnEnter);
        this.domDtGte.addEventListener("keypress", SubmitOnEnter);
        this.domDtLte.addEventListener("keypress", SubmitOnEnter);

        let FnClassHideShow = (colClassList, show) => {
            let ss = document.styleSheets[2];
            let cssRuleList = [...ss.cssRules];

            for (let colClass of colClassList)
            {
                let cssRule = cssRuleList.find(r => r.selectorText == colClass)
                if (cssRule)
                {
                    if (show)
                    {
                        cssRule.style.display = "table-cell";
                    }
                    else
                    {
                        cssRule.style.display = "none";
                    }
                }
            }
        };

        this.rcCols.SetOnChangeCallback(val => {
            const colClassList = [
                ".DateTimeUtc_col",
                ".EncCall_col",
                ".EncGrid_col",
                ".EncPower_col",
                ".GpsValid_col",
                ".Grid56_col",
                ".AltMRaw_col",
                ".Knots_col",
            ];

            FnClassHideShow(colClassList, val == "yes");
        });

        this.rcUnits.SetOnChangeCallback(val => {
            const colClassListMetric = [
                ".AltM_col",
                ".TempC_col",
                ".KPH_col",
                ".GpsKPH_col",
                ".DistKm_col",
            ];

            const colClassListImperial = [
                ".AltFt_col",
                ".TempF_col",
                ".MPH_col",
                ".GpsMPH_col",
                ".DistMi_col",
            ];

            FnClassHideShow(colClassListMetric,   val == "both" || val == "metric");
            FnClassHideShow(colClassListImperial, val == "both" || val == "imperial");
        });

        // copy / download
        let FilenamePrefix = () => {
            return `${this.GetBand()}_${this.GetChannelPadded()}_${this.GetCallsign()}_${this.GetTimeStart()}_${this.GetTimeEndRaw()}`;
        };
        this.domDownloadCombined.onclick = e => {
            utl.DownloadCsv(
                utl.MakeFilename(`${FilenamePrefix()}.csv`),
                                 utl.TableToCsv(this.GetTargetTableCombined()));
        };
        let kmlFilenameWithAlt = `${FilenamePrefix()}_with_altitude.kml`;
        this.domDownloadKmlAlt.onclick = e => {
            utl.DownloadKml(
                utl.MakeFilename(kmlFilenameWithAlt),
                                 this.ToKml(this.GetTargetTableCombined(), kmlFilenameWithAlt, true));
        };
        let kmlFilenameNoAlt = `${FilenamePrefix()}_no_altitude.kml`;
        this.domDownloadKmlNoAlt.onclick = e => {
            utl.DownloadKml(
                utl.MakeFilename(kmlFilenameNoAlt),
                                 this.ToKml(this.GetTargetTableCombined(), kmlFilenameNoAlt));
        };
        this.domCopyCombined.onclick = e => {
            utl.CopyElementToClipboard("targetTableCombined");
            autl.ToastOk("Copied");
        };

        // define the list of iframes and map to what data to send them
        this.ifInfoList = [
            {
                id: "graphAltitude",
                type: "timeSeries",
                fn: from => this.OnGraphAltitude(from),
            },
            {
                id: "graphSpeed",
                type: "timeSeries",
                fn: from => this.OnGraphSpeed(from),
            },
            {
                id: "graphTemperature",
                type: "timeSeries",
                fn: from => this.OnGraphTemperature(from),
            },
            {
                id: "graphVoltage",
                type: "timeSeries",
                fn: from => this.OnGraphVoltage(from),
            },
            {
                id: "graphMap",
                type: "map",
                fn: from => this.OnGraphMap(from),
            },
            {
                id: "graphScatterMulti",
                type: "scatter",
                fn: from => this.OnGraphScatterMulti(from),
            },
            {
                id: "graphBarMulti",
                type: "timeSeriesBar",
                fn: from => this.OnGraphBarMulti(from),
            },
        ];

        this.ifWin__cb = new Map();
        for (let ifInfo of this.ifInfoList)
        {
            let ifWin = document.getElementById(ifInfo.id).contentWindow;
            this.ifWin__cb.set(ifWin, ifInfo.fn);
        }

        this.dataReady = false;
        this.dataReadyHandlerList = [];

        window.addEventListener("message", e => {
            if (e.data.type == "REQ_DATA")
            {
                let from = e.source;
    
                if (this.ifWin__cb.has(from))
                {
                    if (this.dataReady)
                    {
                        this.ifWin__cb.get(from)(from);
                    }
    
                    this.dataReadyHandlerList.push(() => {
                        this.ifWin__cb.get(from)(from);
                    });
                }
            }
            else if (e.data.type == "ON_CLICK")
            {
                this.MoveMap(e.data.ts);
            }
            else if (e.data.type == "JUMP_TO_DATA")
            {
                let ts = e.data.ts;
                document.getElementById(ts).scrollIntoView();
                window.scrollBy(0, -this.rowHeight);
            }
        });

        this.fnNextTimerId = null;
        this.fnUpdateNext = (justNext) => {
            let dt = utl.MakeDateTimeFromMs(utl.Now()).substr(0, 16);
            let dtJustTime = dt.substr(11, 16);

            if (justNext != true)
            {
                this.domUpdateMsg.innerHTML = `Updated ${dtJustTime}`;
            }

            let nextTimeoutMs = this.GetNextTimeoutMs(true);
            nextTimeoutMs += 30000 - 6000;
            let next = utl.MsToDurationStrMinutes(nextTimeoutMs);

            // cancel any pending timeout
            if (this.fnNextTimerId)
            {
                clearTimeout(this.fnNextTimerId);
                this.fnNextTimerId = null;
            }

            // if close to timeout, wait for the next page refresh to drive
            // the next update, otherwise update now
            if (next.charAt(0) != "0")
            {
                this.domUpdateNext.innerHTML = `next in ${next}`;
    
                // schedule now to align to 60 second intervals to when last called
                this.fnNextTimerId = setTimeout(() => {
                    this.fnUpdateNext(true);
                }, 60000);
            }
            else
            {
                this.domUpdateNext.innerHTML = `next < 1 min`;
            }
        };

        this.fnAgeTimerId = null;
        this.fnUpdateAge = () => {
            // Calculate age of freshest data
            if (this.td.Length() >= 1)
            {
                let dtLast = this.td.Get(0, "DateTimeLocal");
                let msLast = utl.ParseTimeToMs(dtLast);
                let msNow  = utl.Now();

                let msDiff = msNow - msLast;

                // discount by how purposefully late we check it
                let msLateOnPurpose;
                if (this.GetChannel() == "")
                {
                    msLateOnPurpose = (2 * 60 * 1000) + // 5 min late
                                      (     7 * 1000) + // 7 sec padding
                                      (     5 * 1000);  // 5 sec jitter (up to)
                }
                else
                {
                    msLateOnPurpose = (5 * 60 * 1000) + // 5 min late
                                      (     7 * 1000) + // 7 sec padding
                                      (     5 * 1000);  // 5 sec jitter (up to)
                }

                if (msLateOnPurpose < msDiff)
                {
                    msDiff -= msLateOnPurpose;
                }
                else
                {
                    msDiff = 0;
                }

                let latestAgeStr = `Since last seen: ${utl.DurationStrTrim(utl.MsToDurationStrDaysHoursMinutes(msDiff))}`;

                this.domLatestAge.innerHTML = latestAgeStr;
            }
            else
            {
                let latestAgeStr = `Since last seen: [none found]`;

                this.domLatestAge.innerHTML = latestAgeStr;
            }

            // in embed mode, announce latest age
            window.parent.postMessage({
                type: "ON_LATEST_AGE",
                ageStr: this.domLatestAge.innerHTML,
            }, "*");

            // cancel any pending timeout
            if (this.fnAgeTimerId)
            {
                clearTimeout(this.fnAgeTimerId);
                this.fnAgeTimerId = null;
            }

            let now = Date.now();
            let msToNextMinute = 60000 - (now % 60000);

            // schedule now to align to 60 second intervals to when last called
            this.fnAgeTimerId = setTimeout(() => {
                this.fnUpdateAge();
            }, msToNextMinute);
        };

        // Set up highlighting for latest spot
        this.domLatestAge.addEventListener('pointerenter', e => {
            document.getElementById("graphMap").contentWindow.postMessage({
                type: "HIGHLIGHT_LATEST",
            }, "*");
        });
        this.domLatestAge.addEventListener('pointerleave', e => {
            document.getElementById("graphMap").contentWindow.postMessage({
                type: "UN_HIGHLIGHT_LATEST",
            }, "*");
        });

        // create queriers
        this.ssr = new SpotSearchRegular();
        this.ssc = new SpotSearchCombined();

        // begin
        this.OnPageLoad();

        // auto-refresh
        this.SetUpAutoRefresh();
    }

    ToKml(table, filename, withAlt)
    {
        let retVal = "";

        retVal += `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${filename}</name>
    <description>Your Flight</description>
    <Style id="yellowLineGreenPoly">
      <LineStyle>
        <color>7f00ffff</color>
        <width>4</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
      </PolyStyle>
    </Style>`;
            
        if (this.td.Length() >= 1)
        {
            let coordsLast = null;

            this.td.ForEach(row => {
                let grid = this.td.Get(row, "Grid");

                if (grid == undefined)
                {
                    grid = this.td.Get(row, "RegGrid");
                }
                
                if (grid)
                {
                    // cells are already linkified, etc, so extract plain text
                    grid = grid.match(/>(.*)</)[1];

                    let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let altM = this.td.Get(row, "AltM");

                    // kind of torn here
                    // absolute may cut through the earth with distant spots
                    // but clampToGround doesn't have the nice altitude projections
                    // let the user decide, default to clamp to ground to avoid cuts through earth
                    let altType = "clampToGround";
                    if (withAlt)
                    {
                        altType = "absolute";
                    }

                    if (altM == undefined)
                    {
                        altM = "0";
                        altType = "clampToGround";
                    }

                    // remove the comma character
                    altM = altM.replace(",", "");

                    let dtLocal = this.td.Get(row, "DateTimeLocal");

                    let coords = `${lng},${lat},${altM}\n`;

                    if (coordsLast)
                    {
                        retVal +=
`    <Placemark>
       <name>${dtLocal}</name>
       <description>${dtLocal}</description>
       <styleUrl>#yellowLineGreenPoly</styleUrl>
       <LineString>
         <extrude>1</extrude>
         <tessellate>1</tessellate>
         <altitudeMode>${altType}</altitudeMode>
         <coordinates>
`;
retVal += `           ` + coordsLast;
retVal += `           ` + coords;
retVal +=
`        </coordinates>
      </LineString>
    </Placemark>
`;

                    }

                    coordsLast = coords;
                }
            });
        }

        // add in north and south pole, and finish xml
        retVal += `
    <Placemark>
      <name>North Pole</name>
      <description>North Pole</description>
      <Point>
        <coordinates>0,90,0</coordinates>
      </Point>
    </Placemark>
    <Placemark>
      <name>South Pole</name>
      <description>South Pole</description>
      <Point>
        <coordinates>0,-90,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

        retVal += "\n";

        return retVal;
    }

    MoveMap(ts)
    {
        document.getElementById("graphMap").contentWindow.postMessage({
            type: "ON_CLICK",
            ts: ts,
        }, "*");
    }

    GetNextTimeoutMs(noMagic)
    {
        let cd = WSPR.GetChannelDetails(this.GetBand(), this.GetChannel());

        // duration until next {min} + 5
        let targetMin = cd.min + 5;
        if (targetMin > 9)
        {
            targetMin -= 10;
        }

        // `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`
        let dt = utl.MakeDateTimeFromMs(utl.Now());

        let minNow = dt.substr(15, 1);  // single digit

        // override for channel-less operation
        if (this.GetChannel() == "")
        {
            let evenMinNow = Math.floor(minNow / 2) * 2;

            targetMin = (evenMinNow + 2) % 10;
        }
        
        // calculate timeout
        let ms = null;
        if (minNow == targetMin)
        {
            ms = 10 * 60 * 1000;
        }
        else if (minNow < targetMin)
        {
            ms = (targetMin - minNow) * 60 * 1000;
        }
        else    // min > targetMin
        {
            ms = (10 - (minNow - targetMin)) * 60 * 1000;
        }

        // decrement by the amount of seconds passed by in this minute
        let secRaw = dt.substr(17, 2);
        let secNow = parseInt(secRaw, 10);  // only integer value

        ms -= (secNow * 1000);

        if (noMagic != true)
        {
            // add a little padding because it's not always exactly arrived by then
            ms += 7 * 1000;
        
            // add a little jitter so not all pages wake up and query at the same time
            let RAND_MAX = 5000;
            let randMs = Math.floor(Math.random() * RAND_MAX);
            ms += randMs;
        }
        
        if (this.GetDebug())
        {
            let rem = utl.MsToDurationStrDaysHoursMinutesSeconds(ms);
            console.log(`target min ${cd.min}+5=_${targetMin} from now ${minNow}:${secRaw}(${secNow}) -> ${ms} -> ${rem}`)
        }

        return ms;
    };

    SetUpAutoRefresh()
    {
        let cd = WSPR.GetChannelDetails(this.GetBand(), this.GetChannel());

        this.arManuallySet = false;

        let msUntil = utl.MsUntilDate(this.domDtLte.value);

        let timer = null;
        if (msUntil >= 0)
        {
            this.domAutoRefresh.checked = true;

            this.domAutoRefresh.title = `Auto-Refresh every 5 min after TX start min (${cd.min}+5=${cd.min + 5})`;
            if (this.GetChannel() == "")
            {
                this.domAutoRefresh.title = `Auto-Refresh every 2 min in channel-less mode`;
            }

            this.domAutoRefreshLabel.title = this.domAutoRefresh.title;


            let FnTimeout = () => {
                // console.log(`timeout ${this.arManuallySet}, ${this.domAutoRefresh.checked}`);

                if (this.arManuallySet == false || (this.arManuallySet == true && this.domAutoRefresh.checked))
                {
                    if (this.GetDebug())
                    {
                        console.log("doing on page load");
                    }
                    this.OnPageLoad();
                }

                let msUntil = utl.MsUntilDate(this.domDtLte.value);
                if (msUntil >= 0)
                {
                    timer = setTimeout(FnTimeout, this.GetNextTimeoutMs());
                }
                else
                {
                    this.domAutoRefresh.checked = false;

                    this.domAutoRefresh.disabled = true;
                    this.domAutoRefreshLabel.disabled = true;

                    this.domAutoRefresh.title = `Auto-Refresh disabled, end date is in the past`;
                    this.domAutoRefreshLabel.title = this.domAutoRefresh.title;
                }
            };
            
            timer = setTimeout(FnTimeout, this.GetNextTimeoutMs());
        }
        else
        {
            this.domAutoRefresh.checked = false;

            this.domAutoRefresh.disabled = true;
            this.domAutoRefreshLabel.disabled = true;

            this.domAutoRefresh.title = `Auto-Refresh disabled, end date is in the past`;
            this.domAutoRefreshLabel.title = this.domAutoRefresh.title;
        }

        this.domAutoRefresh.onchange = e => {
            this.arManuallySet = true;
        };
    }

    DataReady()
    {
        this.dataReady = true;

        for (let fn of this.dataReadyHandlerList)
        {
            fn();
        }
    }

    ValidateTime(input)
    {
        let retVal = true;

        if (utl.DateTimeValid(input.value) == false)
        {
            retVal = false;
            input.style.backgroundColor = "red";
        }

        return retVal;
    }

    ValidateTimeStart() { return this.ValidateTime(this.domDtGte); }
    ValidateTimeEnd() { return this.ValidateTime(this.domDtLte); }
    GetBand() { return this.domBand.value; }
    GetChannel() { return this.domChannel.value; }
    GetChannelPadded() { return ("000" + this.GetChannel()).slice(-3); }
    GetCallsign() { return this.domCallsign.value.trim().toUpperCase(); }
    GetId13() { return WSPR.GetChannelDetails(this.GetBand(), this.GetChannel()).id13; }
    GetId1() { return this.GetId13().substring(0, 1); }
    GetId3() { return this.GetId13().substring(1); }
    GetMinRegular() { return WSPR.GetChannelDetails(this.GetBand(), this.GetChannel()).min; }
    GetMinEncoded() { return (this.GetMinRegular() + 2) % 10; }
    GetLane() { return WSPR.GetChannelDetails(this.GetBand(), this.GetChannel()).lane; }
    GetTimeStart() { return utl.MakeDateFrom(this.domDtGte.value); }
    GetTimeEndRaw()
    {
        if (this.domDtLte.value != "")
        {
            return utl.MakeDateFrom(this.domDtLte.value);
        }
        else
        {
            return this.domDtLte.value.trim();
        }
    }
    GetDebug() { return this.debug != false; }
    GetTimeEnd()
    {
        // let the end time (date) be inclusive
        // so if you have 2023-04-28 as the end date, everything for the entire
        // day should be considered.
        // since the querying system wants a cutoff date (lte datetime), we
        // just shift the date of today forward by an entire day, changing it from
        // a cutoff of today at morning midnight to tomorrow at morning midnight.
        // throw in an extra hour for daylight savings time scenarios

        let retVal = this.domDtLte.value;
        if (this.domDtLte.value != "")
        {
            let ms = utl.ParseTimeToMs(this.domDtLte.value);
            ms += (25 * 60 * 60 * 1000);
    
            retVal = utl.MakeDateFromMs(ms);
        }

        return retVal;
    }
    SetStatus(status) { this.domStatus.innerHTML = status; }
    GetTargetTableCombined() { return this.domTargetTableCombined; }

    OnFormChange()
    {
        let url = new URL(window.location);

        url.searchParams.set("band", this.GetBand());
        url.searchParams.set("channel", this.GetChannel())
        url.searchParams.set("callsign", this.GetCallsign())
        url.searchParams.set("dtGte", this.domDtGte.value.trim());
        url.searchParams.set("dtLte", this.domDtLte.value.trim());

        if (this.ValidateTimeStart() && this.ValidateTimeEnd())
        {
            // Strip off any hash, which prevents search button working
            window.location = url.href.split("#")[0];
        }
    }

    OnPageLoad()
    {
        this.data = {
            distKm: 0,
            distMi: 0,
        };

        this.t.Reset();

        this.ssr.Reset();
        this.ssc.Reset();

        if (this.domDtGte.value.trim() == "")
        {
            let msNow = utl.Now();
            let msThen = msNow - (30 * 24 * 60 * 60 * 1000);

            this.domDtGte.value = utl.MakeDateFromMs(msThen);

            this.OnFormChange();
        }
        else
        {
            this.dataReady = false;

            if (this.QueryByChannelIsOkToDo())
            {
                this.t.Event("QueryStart");

                // load iframes (async)
                this.LoadMapIframe();
                this.LoadNonMapIframes();
                this.t.Event("LoadedIframes");

                if (this.GetDebug())
                {
                    this.ssc.EnableDebug();
                }

                this.ssc.SearchNew(
                    this.GetBand(),
                    this.GetChannel(),
                    this.GetCallsign(),
                    this.GetTimeStart(),
                    this.GetTimeEnd()
                ).then(() => {
                    this.t.Event("QueryReturn");
                    
                    // sync
                    this.PreprocessData();
                    this.t.Event("ProcessedData");
                    
                    // show data
                    this.ShowData();
                    this.t.Event("ShowedData");
                    
                    // indicate
                    this.DataReady();
                    this.t.Event("DataReady");
                    
                    if (this.GetDebug()) { this.t.Report(); }
                });
            }
            else if (this.QueryByCallsignIsOkToDo())
            {
                this.t.Event("QueryStart");

                // load iframes (async)
                this.LoadMapIframe();

                // only show the map
                this.RemoveNonMapIFrames();

                this.t.Event("LoadedIframes");

                this.ssr.SearchPlain(
                    this.GetBand(),
                    this.GetCallsign(),
                    this.GetTimeStart(),
                    this.GetTimeEnd()
                ).then(() => {
                    this.t.Event("QueryReturn");

                    // preprocess data
                    this.PreprocessDataPlain();
                    this.t.Event("ProcessedData");
                    
                    // show data
                    this.ShowData();
                    this.t.Event("ShowedData");
                    
                    // indicate
                    this.DataReady();
                    this.t.Event("DataReady");

                    if (this.GetDebug()) { this.t.Report(); }
                });
            }
            else
            {
                autl.ToastErr("Please fill out the search criteria!");
            }
        }

        this.ssr.Quiet();
        this.ssc.Quiet();
    }

    LoadNonMapIframes()
    {
        let ms = Date.now();
        for (const ifInfo of this.ifInfoList)
        {
            let dom = document.getElementById(ifInfo.id);

            if (ifInfo.type == "timeSeries")
            {
                if (dom.src == "")
                {
                    document.getElementById(ifInfo.id).src = `./ChartTimeSeries.html?ms=${ms}`;
                }
            }
            else if (ifInfo.type == "scatter")
            {
                if (dom.src == "")
                {
                    document.getElementById(ifInfo.id).src = `./ChartScatterPlotMultiSeries.html?ms=${ms}`;
                }
            }
            else if (ifInfo.type == "timeSeriesBar")
            {
                if (dom.src == "")
                {
                    document.getElementById(ifInfo.id).src = `./ChartTimeSeriesBar.html?ms=${ms}`;
                }
            }
        }
    }

    RemoveNonMapIFrames()
    {
        for (const ifInfo of this.ifInfoList)
        {
            if (ifInfo.type != "map")
            {
                let domEl = document.getElementById(ifInfo.id);

                if (domEl)
                {
                    domEl.parentNode.removeChild(domEl);
                }
            }
        }
    }

    LoadMapIframe()
    {
        let ms = Date.now();
        for (const ifInfo of this.ifInfoList)
        {
            if (ifInfo.type == "map")
            {
                let dom = document.getElementById(ifInfo.id);

                // only load if not yet set
                if (dom.src == "")
                {
                    document.getElementById(ifInfo.id).src = `./Map.html?ms=${ms}`;
                }
            }
        }
    }

    PreprocessDataEliminateOutliers(td)
    {
        // disable for everyone except this callsign for now, seems to be causing
        // more problems than solving
        if (td.Length())
        {
            let callsign = td.Get(0, "RegCall");

            if (callsign != "KD2KDD")
            {
                return;
            }
        }

        // eliminate outlier points which are implausibly far away
        let idxDeleteList = [];
        let gridLast = null;
        let timeLast = null;
        td.ForEach((row, idx) => {
            let retVal = [null, null];

            let time = td.Get(row, "DateTimeLocal");
            let grid = td.Get(row, "RegGrid");
            // when power == 0, this means it is a re-transmission of a prior spot
            // due to gps lock timeout.
            // this is traquito-specific behavior, but U4B never sends 0 power,
            // so will not conflict with existing spots.
            let power = td.Get(row, "RegPower");
            // when traquito sends GpsValid=0, this is the re-transmission.
            // when U4B sends GpsValid=0, it's garbage data.
            // both should be exempted from this logic
            let gpsValid = td.Get(row, "GpsValid");

            let updateLast = true;

            if (grid != null && power != "0" && (gpsValid == "1" || gpsValid == null))
            {
                if (gridLast != null)
                {
                    let [lat1, lng1] = WSPREncoded.DecodeMaidenheadToDeg(gridLast);
                    let [lat2, lng2] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let mi = GreatCircle.distance(lat1, lng1, lat2, lng2, "MI");

                    // if spots are nearby, just assume it's valid, no need to worry about speed
                    let MILES_THRESH = 1000;
                    if (mi > MILES_THRESH)
                    {
                        let spotTimeMs = utl.ParseTimeToMs(time);
                        let spotTimeLastMs = utl.ParseTimeToMs(timeLast);
                        let timeDiffMs = spotTimeMs - spotTimeLastMs;

                        // we now can calculate miles per millisecond
                        // we want miles per hour
                        // scale it
                        let mph = Math.round(mi / (timeDiffMs / (60 * 60 * 1000)));

                        let MPH_THRESH = 300;

                        if (mph > MPH_THRESH)
                        {
                            idxDeleteList.push(idx);

                            updateLast = false;

                            if (this.GetDebug())
                            {
                                console.log(`found row idx ${idx} with mph ${mph} > ${MPH_THRESH}`);
                                console.log(`${timeLast} / ${gridLast} -> [${mi}] -> ${time} / ${grid}`);
                                console.log(row);
                            }
                        }
                    }
                }

                if (updateLast)
                {
                    gridLast = grid;
                }
            }
            else
            {
                updateLast = false;
            }

            if (updateLast)
            {
                timeLast = time;
            }
        }, true);

        if (this.GetDebug())
        {
            console.log(`Deleting index list ${idxDeleteList}`);
        }

        td.DeleteRowList(idxDeleteList);
    }

    PreprocessData()
    {
        // need to decide if page will:
        // - use only complete rows
        // - use partial rows
        //
        // - and for table display, does that differ?
        //
        // - do you visually indicate?

        // get the data and manage through convenience interface
        this.dataTable = this.ssc.GetDataTable();
        this.td = new TabularData(this.dataTable);

        // early chop of bad rows
        this.PreprocessDataEliminateOutliers(this.td);

        // prepend map link column
        this.td.PrependGeneratedColumns([
            "Map"
        ], row => {
            return ["map"];
        }, true);

        // drop the unneeded EncTime column
        // it's defined to be the 2min mark after the spot
        // just wastes space in a table already quite wide
        this.td.DeleteColumn("EncTime")

        // add metadata
        this.td.AppendGeneratedColumns([
            "RegSeen", "EncSeen"
        ], row => {
            let dateTime = this.td.Get(row, "DateTimeUtc");
            let meta = this.ssc.GetMetadataAtDateTime(dateTime);

            let encSeen = "";
            if (meta.encCandidateList.length == 1)
            {
                encSeen = meta.encCandidateList[0].rxDetailsList.length;
            }
           
            let retVal = [
                meta.regRxDetailsList.length,
                encSeen,
            ];

            return retVal;
        });

        this.td.AppendGeneratedColumns([
            "AltM", "AltFt"
        ], row => {
            let retVal = [null, null];

            let gpsValid = this.td.Get(row, "GpsValid");

            if (gpsValid)
            {
                let altMGraph = this.td.Get(row, "AltMRaw");
                if (altMGraph != null)
                {
                    let altFt = utl.MtoFt_Round(altMGraph);
                    
                    retVal = [utl.Commas(altMGraph), utl.Commas(altFt)];
                }
            }

            return retVal;
        });

        // Preprocess Speed
        this.td.AppendGeneratedColumns([
            "KPH", "MPH"
        ], row => {
            let retVal = [null, null];

            let gpsValid = this.td.Get(row, "GpsValid");

            if (gpsValid)
            {
                let speedKnots = this.td.Get(row, "Knots");
                if (speedKnots != null)
                {
                    let speedKph = utl.KnotsToKph_Round(speedKnots);
                    let speedMph = utl.KnotsToMph_Round(speedKnots);
    
                    retVal = [speedKph, speedMph];
                }
            }

            return retVal;
        });

        // Preprocess Temperature
        this.td.AppendGeneratedColumns([
            "TempF"
        ], row => {
            let retVal = [null];
            
            let tempC = this.td.Get(row, "TempC");
            if (tempC != null)
            {
                let tempF = utl.CtoF_Round(tempC);

                retVal = [tempF];
            }

            return retVal;
        });

        // Preprocess Voltage


        // Final pass to jazz up the table presentation (data modified and not machine readable easily anymore)

        // synthesize grid
        this.td.AppendGeneratedColumns([
            "Grid"
        ], row => {
            let retVal = [null];

            let gpsValid = this.td.Get(row, "GpsValid");

            if (gpsValid)
            {
                let grid4 = this.td.Get(row, "RegGrid");
                let grid56 = this.td.Get(row, "Grid56");
    
                if (grid56 != null)
                {
                    let grid = grid4 + grid56;
    
                    retVal = [grid];
                }
            }

            return retVal;
        });


        // the above pass created an unambiguous high-res location if there was one.
        // now let's promote grid4 when appropriate.
        // criteria:
        // - starts a path
        // - ends a path if
        //   - the point is different from prior, and
        //   - the point is old enough that the encoded point should have arrived already
        //   - as in, it's a "better than nothing" point
        //   - want to avoid, for example, seeing a regular, but not _yet_ the encoded.  just wait
        // - fills a gap where the grid4 is different than the grid4 component of
        //   both neighbors

        // help to get the next grid, oldest to newest
        let GetNextGrid = (td, idx) => {
            let grid = null;

            let len = td.Length();

            for (let i = idx - 1; i >= 0; --i)
            {
                grid = this.td.Get(i, "Grid");

                if (grid != null)
                {
                    break;
                }
            }

            return grid;
        };

        // give voltage a fixed precision
        this.td.GenerateModifiedColumn([
            "Voltage"
        ], row => {
            let voltage = this.td.Get(row, "Voltage");
            
            let retVal = [voltage];
            
            // if we have an empty cell, check if promoting grid4 makes sense
            if (voltage != null)
            {
                retVal = [parseFloat(voltage).toFixed(2)];
            }

            return retVal;
        }, true);

        // fill in the gaps, oldest to newest
        let idx = this.td.Length() - 1;
        let gridPrior = null;
        this.td.GenerateModifiedColumn([
            "Grid"
        ], row => {
            let gridThis = this.td.Get(row, "Grid");
            
            let retVal = [gridThis];
            
            // if we have an empty cell, check if promoting grid4 makes sense
            if (gridThis == null)
            {
                let grid4    = this.td.Get(row, "RegGrid").substr(0, 4);
                let gridNext = GetNextGrid(this.td, idx);

                if (gridNext)
                {
                    gridNext = gridNext.substr(0, 4);
                }
                
                if (grid4 != gridPrior && grid4 != gridNext)
                {
                    // don't do the latest cell, there is special logic for that
                    if (idx != 0)
                    {
                        retVal = [grid4];

                        gridPrior = grid4;
                    }
                }
            }
            else
            {
                gridPrior = gridThis.substr(0, 4);
            }

            --idx;

            return retVal;
        }, true);

        // check the end
        if (this.td.Length())
        {
            let gridLatest = this.td.Get(0, "Grid");
            if (gridLatest == null)
            {
                let grid4 = this.td.Get(0, "RegGrid");
                let copyAcross = false;

                if (gridPrior == null)
                {
                    copyAcross = true;
                }
                else
                {
                    // check if it's even different in the first place
                    
                    if (grid4 != gridPrior)
                    {
                        // check if enough time has gone by to warrant showing it

                        let spotTimeMs = utl.ParseTimeToMs(this.td.Get(0, "DateTimeLocal"));
                        let timeNowMs  = Date.now();
                        let timeDiffMs = timeNowMs - spotTimeMs;

                        // threshold is 5 minutes for:
                        // 2 min for this message to have actually sent
                        // 2 min more for the telemetry message (the one we're really waiting for)
                        // 1 min for delays in propagation
                        let TIME_DIFF_THRESH = 5 * 60 * 1000;

                        if (timeDiffMs > TIME_DIFF_THRESH)
                        {
                            copyAcross = true;
                        }
                    }
                }

                if (copyAcross)
                {
                    this.td.Set(0, "Grid", grid4);
                }
            }
        }


        // synthesize distance traveled
        let gridLast = null;
        this.td.AppendGeneratedColumns([
            "DistKm", "DistMi"
        ], row => {
            let retVal = [null, null];

            let grid = this.td.Get(row, "Grid");

            if (grid != null)
            {
                if (gridLast != null)
                {
                    let [lat1, lng1] = WSPREncoded.DecodeMaidenheadToDeg(gridLast);
                    let [lat2, lng2] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let km = GreatCircle.distance(lat1, lng1, lat2, lng2, "KM");
                    let mi = GreatCircle.distance(lat1, lng1, lat2, lng2, "MI");

                    retVal = [utl.Commas(Math.round(km)), utl.Commas(Math.round(mi))];

                    this.data.distKm += km;
                    this.data.distMi += mi;
                }

                gridLast = grid;
            }
    
            return retVal;
        }, true);

        // synthesize speed derived from GPS distance traveled
        let rowLast = null;
        this.td.AppendGeneratedColumns([
            "GpsKPH", "GpsMPH"
        ], row => {
            let retVal = [null, null];

            let grid = this.td.Get(row, "Grid");

            if (grid != null && grid.length == 6)
            {
                if (rowLast != null)
                {
                    let gridLast = this.td.Get(rowLast, "Grid");

                    let [lat1, lng1] = WSPREncoded.DecodeMaidenheadToDeg(gridLast);
                    let [lat2, lng2] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let km = GreatCircle.distance(lat1, lng1, lat2, lng2, "KM");

                    let msNow  = utl.ParseTimeToMs(this.td.Get(row, "DateTimeLocal"));
                    let msLast = utl.ParseTimeToMs(this.td.Get(rowLast, "DateTimeLocal"));

                    let msDiff = msNow - msLast;

                    let MS_PER_10_MIN = 60 * 10 * 1000;
                    if (msDiff == MS_PER_10_MIN)
                    {
                        let MS_PER_HOUR = 60 * 60 * 1000;
    
                        let kph = km * MS_PER_HOUR / msDiff;
                        let mph = kph * 0.621371;
    
                        retVal = [Math.round(kph), Math.round(mph)];
                    }
                }

                rowLast = row;
            }
    
            return retVal;
        }, true);

        // do some averaging
        let FnAverage = (row, idx, col) => {
            let mphThis = this.td.Get(row, col);
            let mph = null;

            if (mphThis != null)
            {
                let mphList = [mphThis];

                let mphPrev = this.td.Get(idx - 1, col);
                let mphPrevOk = false;
                if (mphPrev != undefined && mphPrev != null && isNaN(mphPrev) == false)
                {
                    mphList.push(mphPrev);
                    mphPrevOk = true;
                }

                let mphNext = this.td.Get(idx + 1, col);
                let mphNextOk = false;
                if (mphNext != undefined && mphNext != null && isNaN(mphNext) == false)
                {
                    mphList.push(mphNext);
                    mphNextOk = true;
                }

                if (mphPrevOk)
                {
                    let mphPrevPrev = this.td.Get(idx - 2, col);
                    if (mphPrevPrev != undefined && mphPrevPrev != null && isNaN(mphPrevPrev) == false)
                    {
                        mphList.push(mphPrevPrev);
                    }
                }

                if (mphNextOk)
                {
                    let mphNextNext = this.td.Get(idx + 2, col);
                    if (mphNextNext != undefined && mphNextNext != null && isNaN(mphNextNext) == false)
                    {
                        mphList.push(mphNextNext);
                    }
                }

                if (mphList.length >= 3)
                {
                    let sum = 0;
                    for (let mph of mphList)
                    {
                        sum += mph;
                    }

                    mph = Math.round(sum / mphList.length);
                }
            }

            let retVal = [mph];

            return retVal;
        };

        this.td.GenerateModifiedColumn([
            "GpsMPH"
        ], (row, idx) => FnAverage(row, idx, "GpsMPH"), true);

        this.td.GenerateModifiedColumn([
            "GpsKPH"
        ], (row, idx) => FnAverage(row, idx, "GpsKPH"), true);


        // prettify AltM
        this.td.GenerateModifiedColumn([
            "AltMRaw"
        ], row => {
            let altM = this.td.Get(row, "AltMRaw");

            let retVal = [""];

            if (altM != null)
            {
                retVal = [utl.Commas(altM)];
            }

            return retVal;
        });

        // linkify grid
        this.td.GenerateModifiedColumn([
            "Grid"
        ], row => {
            let grid = this.td.Get(row, "Grid");

            let retVal = [""];

            if (grid)
            {
                let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                let gmUrl = WSPREncoded.MakeGoogleMapsLink(lat, lng);
                let gridLink = `<a href="${gmUrl}" target="_blank">${grid}</a>`;

                retVal = [gridLink];
            }

            return retVal;
        });


        // linkify grid4
        this.td.GenerateModifiedColumn([
            "RegGrid"
        ], row => {
            let grid4 = this.td.Get(row, "RegGrid");

            let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid4);

            let gmUrl = WSPREncoded.MakeGoogleMapsLink(lat, lng);
            let grid4Link = `<a href="${gmUrl}" target="_blank">${grid4}</a>`;

            let retVal = [grid4Link];

            return retVal;
        });

        // Explicitly rearrange columns and cache result
        this.td.SetColumnOrder([
            "Map",
            "DateTimeUtc", "DateTimeLocal",
            "RegSeen", "EncSeen",
            "RegCall", "RegGrid", "RegPower",
            "EncCall", "EncGrid", "EncPower",
            "GpsValid", "Grid56", "AltMRaw", "Knots",
            "Grid", "Voltage",
            "AltM",  "TempC", "KPH", "GpsKPH", "DistKm",
            "AltFt", "TempF", "MPH", "GpsMPH", "DistMi",
        ]);

        this.dataTable = this.td.GetDataTable();
    }

    PreprocessDataPlain()
    {
        // get the data and manage through convenience interface
        this.dataTable = this.ssr.GetDataTable();
        this.td = new TabularData(this.dataTable);

        // early chop of bad rows
        this.PreprocessDataEliminateOutliers(this.td);

        // prepend map link column
        this.td.PrependGeneratedColumns([
            "Map"
        ], row => {
            return ["map"];
        }, true);

        // Final pass to jazz up the table presentation (data modified and not machine readable easily anymore)

        // synthesize distance traveled
        let gridLast = null;
        this.td.AppendGeneratedColumns([
            "DistKm", "DistMi"
        ], row => {
            let retVal = [null, null];

            let grid = this.td.Get(row, "RegGrid");

            if (grid != null)
            {
                if (gridLast != null)
                {
                    let [lat1, lng1] = WSPREncoded.DecodeMaidenheadToDeg(gridLast);
                    let [lat2, lng2] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let km = GreatCircle.distance(lat1, lng1, lat2, lng2, "KM");
                    let mi = GreatCircle.distance(lat1, lng1, lat2, lng2, "MI");

                    retVal = [Math.round(km), Math.round(mi)];

                    this.data.distKm += km;
                    this.data.distMi += mi;
                }

                gridLast = grid;
            }
    
            return retVal;
        }, true);

        // linkify grid4
        this.td.GenerateModifiedColumn([
            "RegGrid"
        ], row => {
            let grid4 = this.td.Get(row, "RegGrid");

            let [lat, lng] = WSPREncoded.DecodeMaidenheadToDeg(grid4);

            let gmUrl = WSPREncoded.MakeGoogleMapsLink(lat, lng);
            let grid4Link = `<a href="${gmUrl}" target="_blank">${grid4}</a>`;

            let retVal = [grid4Link];

            return retVal;
        });
    }

    ShowData()
    {
        // show the same source data the graphs get

        // construct dom table
        let table = utl.MakeTable(this.dataTable);

        // give styling options
        table.classList.add("dataTable");

        // give top row stickiness
        table.childNodes[1].classList.add("headerRow");

        // make each table header its own class name
        table.childNodes[1].childNodes[0].childNodes.forEach(domTh => {
            domTh.classList.add(`${domTh.innerHTML}`);
        });

        // make sortable
        sorttable.makeSortable(table);

        // make map links work
        let idx = 0;
        for (let row of table.rows)
        {
            if (idx != 0)
            {
                let cell = row.cells[0];
    
                cell.classList.add("fakelink");
                
                let ts = row.cells[2].innerHTML;
                cell.id = ts;

                cell.addEventListener('click', () => {
                    window.scrollTo(0, 0);
                    this.MoveMap(ts);
                });
            }

            ++idx;
        }

        // insert
        let target = document.getElementById("targetTableCombined");

        target.innerHTML = "";
        target.appendChild(table);

        // observe height of row for scrolling offset
        this.rowHeight = table.rows[0].offsetHeight;

        // Calculate duration of flight
        let durationStr = "";
        if (this.td.Length() > 1)
        {
            let dtFirst = this.td.Get(this.td.Length() - 1, "DateTimeLocal");
            let dtLast = this.td.Get(0, "DateTimeLocal");
            
            let msFirst = utl.ParseTimeToMs(dtFirst);
            let msLast = utl.ParseTimeToMs(dtLast);
            
            let msDiff = msLast - msFirst;
            durationStr = utl.MsToDurationStrDaysHoursMinutes(msDiff);
        }

        // Show page update time
        this.fnUpdateNext();

        // Calculate age of freshest data
        this.fnUpdateAge();
        
        // Show some fun facts
        let status = 
        `
Distance Traveled Km: ${utl.Commas(Math.round(this.data.distKm))}
<br/>
Distance Traveled Mi: ${utl.Commas(Math.round(this.data.distMi))}
<br/>
<br/>
Spots: ${utl.Commas(this.dataTable.length - 1)}
<br/>
<br/>
Flight duration: ${durationStr}
<br/>
        `;
        this.SetStatus(status);
    }

    OnGraphAltitude(to)
    {
        this.t.Event("Altitude Start");

        // chop out just the columns we care about for this graph
        let dataTable = this.td.Extract(["DateTimeLocal", "AltM", "AltFt"]);

        // send off to get graphed
        to.postMessage({
            type: "REP_DATA_TWO_UNITS",
            dataTable: dataTable,
            details: {
                layout: {
                    yaxis: {
                        range: [0, 21340],
                    },
                    yaxis2: {
                        range: [utl.MtoFt(0), utl.MtoFt(21340)],
                    },
                },
            },
        }, "*");

        this.t.Event("Altitude End");
        if (this.GetDebug()) { this.t.Report(); }
    }

    OnGraphSpeed(to)
    {
        this.t.Event("Speed Start");

        // chop out just the columns we care about for this graph
        let dataTable = this.td.Extract(["DateTimeLocal", "KPH", "MPH", "GpsKPH", "GpsMPH"]);

        // send off to get graphed
        to.postMessage({
            type: "REP_DATA_TWO_UNITS",
            dataTable: dataTable,
            details: {
                layout: {
                    yaxis: {
                        range: [utl.KnotsToKph(0), utl.KnotsToKph(156.5)],
                    },
                    yaxis2: {
                        range: [utl.KnotsToMph(0), utl.KnotsToMph(156.5)],
                    },
                },
            },
        }, "*");

        this.t.Event("Speed End");
        if (this.GetDebug()) { this.t.Report(); }
    }

    OnGraphTemperature(to)
    {
        this.t.Event("Temperature Start");

        // chop out just the columns we care about for this graph
        let dataTable = this.td.Extract(["DateTimeLocal", "TempC", "TempF"]);

        // send off to get graphed
        to.postMessage({
            type: "REP_DATA_TWO_UNITS",
            dataTable: dataTable,
            details: {
                layout: {
                    yaxis: {
                        range: [-55, 45],
                    },
                    yaxis2: {
                        range: [utl.CtoF(-55), utl.CtoF(45)],
                    },
                },
            },
        }, "*");

        this.t.Event("Temperature End");
        if (this.GetDebug()) { this.t.Report(); }
    }

    OnGraphVoltage(to)
    {
        this.t.Event("Voltage Start");

        // chop out just the columns we care about for this graph
        let dataTable = this.td.Extract(["DateTimeLocal", "Voltage"]);

        // send off to get graphed
        to.postMessage({
            type: "REP_DATA",
            dataTable: dataTable,
            details: {
                layout: {
                    yaxis: {
                        range: [2.95, 5.0],
                    },
                },
            },
        }, "*");

        this.t.Event("Voltage End");
        if (this.GetDebug()) { this.t.Report(); }
    }

    OnGraphMap(to)
    {
        this.t.Event("Map Start");

        let dtMap = new TabularData(this.td.DeepCopy());

        // Add data to the table about who saw which spots (intersection only)
        dtMap.AppendGeneratedColumns([
            "SeenList"
        ], row => {
            let dateTime = this.td.Get(row, "DateTimeUtc");
            
            let regSeenList = [];
            let encSeenList = [];

            let meta = this.ssc.GetMetadataAtDateTime(dateTime);

            // not supporting channel-less for now
            if (meta)
            {
                for (const obj of meta.regRxDetailsList)
                {
                    let seen = `${obj.rxSign},${obj.rxLoc}`;
                    regSeenList.push(seen);
                }
                
                if (meta.encCandidateList.length == 1)
                {
                    for (const obj of meta.encCandidateList[0].rxDetailsList)
                    {
                        let seen = `${obj.rxSign},${obj.rxLoc}`;
                        encSeenList.push(seen);
                    }
                }
            }

            let seenList = utl.ListIntersectionUnique(regSeenList, encSeenList);

            let retVal = [seenList]

            return retVal;
        });
        
        dtMap.Reverse();
        
        // send off to get graphed
        to.postMessage({
            type: "REP_DATA",
            dataTable: dtMap.GetDataTable(),
        }, "*");

        this.t.Event("Map End");
        if (this.GetDebug()) { this.t.Report(); }
    }
    
    OnGraphScatterMulti(to)
    {
        this.t.Event("ScatterMulti Start");

        // chop out just the columns we care about for this graph
        let dataTable = this.td.Extract([
            "TempC",
            "Voltage",
            "AltM",
            "AltFt",
            "KPH",
            "MPH",
            "TempF",
            "RegSeen",
            "EncSeen",
        ]);

        // send off to get graphed
        to.postMessage({
            type: "REP_DATA",
            dataTable: dataTable,
        }, "*");

        this.t.Event("ScatterMulti End");
        if (this.GetDebug()) { this.t.Report(); }
    }

    OnGraphBarMulti(to)
    {
        this.t.Event("GraphBarMulti Start");

        let dataTable = this.td.GetDataTable();

        // send off to get graphed
        to.postMessage({
            type: "REP_DATA",
            dataTable: dataTable,
        }, "*");

        this.t.Event("GraphBarMulti End");
        if (this.GetDebug()) { this.t.Report(); }
    }


    QueryByChannelIsOkToDo()
    {
        let retVal =
            this.GetBand()      != "" && 
            this.GetChannel()   != "" &&
            this.GetCallsign()  != "" &&
            this.GetTimeStart() != "";

        return retVal;
    }

    QueryByCallsignIsOkToDo()
    {
        let retVal =
            this.GetBand()      != "" && 
            this.GetCallsign()  != "" &&
            this.GetTimeStart() != "";

        return retVal;
    }
}

export let app = null;

window.addEventListener('DOMContentLoaded', (event) => {
    app = new App();
    window.app = app;
});

</script>

<link rel="stylesheet" type="text/css" href="/css/traquito.css">

<style>

.whiteout {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    background: white;
}

iframe {
    border: 1px solid black;
    width: 600px;
    height: 300px;
    resize: both;
    overflow: hidden;
}


.map {
    width: 1210px;
    height: 550px;
    background: white;
}

.mapEmbed {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0px;
    left: 0px;
    border: 0px;
    resize: none;
    background: white;
    z-index: 5;
}

#graphContainer {
    width: 1212px;
}

.detailedGraph {
    width: 1210px;
    height: 400px;
}


table {
    border: 2px solid black;
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

th, td {
    text-align: center;
    padding: 2px;
}

.headerRow {
    top: 0;
    position: sticky;
}

.Map_col {
    border-left: 2px solid black;
    border-right: 2px solid black;
}

.DateTimeUtc_col {}

/* rx station */
.RegSeen, .EncSeen {
    background-color: rgb(255, 134, 255);
}

.RegSeen_col {
    border-left: 2px solid black;
}

/* style regular message columns */
.RegCall, .RegGrid, .RegPower {
    background-color: lightgreen;
}

.RegCall_col {
    border-left: 2px solid black;
}

.RegPower_col {
    border-right: 2px solid black;
}


.EncCall_col {}
.EncGrid_col {}
.EncPower_col {}

/* style encoded message columns */
.EncCall, .EncGrid, .EncPower {
    background-color: lightpink;
}

.EncCall_col {
    border-left: 2px solid black;
}

.EncPower_col {
    border-right: 2px solid black;
}

.GpsValid_col {}
.Grid56_col {}
.AltMRaw_col {}
.Knots_col {}



/* metadata */
.GpsValid, .Grid56, .AltMRaw, .Knots {
    background-color: lightpink;
}

.Knots_col {
    border-right: 2px solid black;
}

.Grid, .Voltage {
    background-color: khaki;
}

/* telemetry metric */
.AltM, .TempC, .KPH, .DistKm, .GpsKPH {
    /* background-color: lightseagreen; */
    background-color: paleturquoise
}

.AltM_col {
    border-left: 2px solid black;
}

.TempC_col {}
.KPH_col {}
.GpsKPH_col {}

.DistKm_col {
    border-right: 2px solid black;
}


/* telemetry imperial */
.AltFt, .TempF, .MPH, .DistMi, .GpsMPH {
    background-color: thistle;
}

.AltFt_col {
    border-left: 2px solid black;
}

.TempF_col {}
.MPH_col {}
.GpsMPH_col {}

.DistMi_col {
    border-right: 2px solid black;
}


#callsign {
    text-transform: uppercase;
}

.right {
    float: right;
}

.fakelink {
    cursor:pointer;
    color:blue;
    text-decoration:underline;
    user-select: none;
}

.dataTable tr:hover {
    background-color: rgb(215, 237, 255);
}

</style>

    </head>
    <body>
        <div id="whiteout" class="whiteout"></div>

        <div class="linkbar">
            <a href="/" target="_blank">Home</a> > <a href="/channelmap/" target="_blank">Channel Map</a> > Spot Search Dashboard
        </div>
        <label for='band'>Band </label>
        <select id="band" title="band">
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

        <label for='channel'><span title="Optional, use if you have a U4B Channel-aware tracker">Channel </span></label><input id="channel" type="number" value="" min="0" max="599" title="Optional, use if you have a U4B Channel-aware tracker">

        <label for='callsign'>Callsign </label><input id="callsign" title="callsign" placeholder="callsign" size="7"></input>

        <button id="go">search</button>

        <label for='dtGte'>Start </label><input id='dtGte' type='text' placeholder='YYYY-MM-DD' required title='Required start date' pattern="\d{4}-\d{2}-\d{2}" spellcheck='false' size="10" maxlength="10">
        <label for='dtLte'>End </label><input id='dtLte' type='text' placeholder='YYYY-MM-DD' title='Optional end date' pattern="\d{4}-\d{2}-\d{2}" spellcheck='false' size="10" maxlength="10">
        
        <input type="checkbox" id="autoRefresh" style="display: none"><label id="autoRefreshLabel" for='autoRefresh' style="display: none">Auto-Refresh</label>
        | <span id="updateMsg"></span>, <span id="updateNext"></span> | <span id="latestAge"></span>
        <br/>
        <br/>

        <iframe class="map" id="graphMap"></iframe>
        <div id="graphContainer">
            <iframe class="graph" id="graphAltitude" scrolling="no"></iframe><iframe class="graph right" id="graphSpeed" scrolling="no"></iframe>
            <br/>
            <iframe class="graph" id="graphTemperature" scrolling="no"></iframe><iframe class="graph right" id="graphVoltage" scrolling="no"></iframe>
            <br/>
            <details>
                <summary>Detailed Graphs (click to open)</summary>
                Scatter Plot:<br/>
                <iframe class="detailedGraph" id="graphScatterMulti" scrolling="no"></iframe>
                <br/>
                Counts:<br/>
                <iframe class="detailedGraph" id="graphBarMulti" scrolling="no"></iframe>
            </details>
        </div>

        <br/>
        <br/>
        <br/>
        <span id="status"></span>
        <br/>
        <br/>
        <br/>

        <details id="detailsDataTable">
            <summary>Data Table Controls (click to open)</summary>

            <table style="text-align: left;">
                <tr>
                    <td style="text-align: left;">Raw Columns</td>
                    <td style="text-align: left;">
                        <input type="radio" name="colsVisible" id="colsVisible_yes" value="yes" checked><label for="colsVisible_yes">Show</label>
                        <input type="radio" name="colsVisible" id="colsVisible_no"  value="no"><label for="colsVisible_no">Hide</label>
                    </td>
                </tr>
                <tr>
                    <td style="text-align: left;">Units</td>
                    <td style="text-align: left;">
                        <input type="radio" name="units" id="units_metric"   value="metric"><label for="units_metric">Metric</label>
                        <input type="radio" name="units" id="units_imperial" value="imperial"><label for="units_imperial">Imperial</label>
                        <input type="radio" name="units" id="units_both"     value="both" checked><label for="units_both">Both</label>
                    </td>
                </tr>
            </table>
            <br/>
        </details>
        
        (download 
        <a href="#" id="downloadCombined">csv</a> or
        <a href="#" id="downloadKmlAlt">kml w/ altitude</a> or
        <a href="#" id="downloadKmlNoAlt">kml no altitude</a>) or
        <a href="#" id="copyCombined">(copy to clipboard)</a>
        <div id="targetTableCombined"></div>
        
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>
        <br/>

    </body>

<script>
const params = new URLSearchParams(window.location.search);

if (params.has("embed") && params.get("embed") == "true")
{
    let el = document.getElementById("graphMap");
    el.classList.replace("map", "mapEmbed");

    // no need to get rid of whiteout, map will display over it
}
else
{
    // get rid of whiteout
    document.body.removeChild(document.getElementById("whiteout"));
}
</script>
</html>
