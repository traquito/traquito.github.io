import * as utl from '/js/Utl.js';
import { Timeline } from '/js/Timeline.js';
import { WSPR } from '/js/WSPR.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { WsprCodecMaker } from '/pro/codec/WsprCodec.js';
import { QuerierWsprLive } from './QuerierWsprLive.js';


export class WsprSearch
{
    constructor()
    {
        this.t = new Timeline();
        this.q = new QuerierWsprLive();

        // get a blank codec just for reading header fields
        this.codecMaker = new WsprCodecMaker();
        this.c = this.codecMaker.GetCodec();

        this.dt__data = new Map();
        
        this.SetOnSearchCompleteEventHandler(() => {});

        // debug
        this.t.Global().SetLogOnEvent(true);
    }

    SetOnSearchCompleteEventHandler(fn)
    {
        this.onSearchCompleteFn = fn;
    }

    async Search(band, channel, callsign, gte, lte)
    {
        console.log(`search ${band} ${channel} ${callsign} ${gte} ${lte} `);

        this.t.Global().Reset();
        this.t.Global().Event("WsprSearch::Search start");

        let cd = WSPR.GetChannelDetails(band, channel);


//debug
this.q.SetDebug(true);


        // calculate slot details
        let slot0Min = (cd.min + 0) % 10;
        let slot1Min = (cd.min + 2) % 10;
        let slot2Min = (cd.min + 4) % 10;
        let slot3Min = (cd.min + 6) % 10;
        let slot4Min = (cd.min + 8) % 10;

        // build async search requests
        let promiseList = [];

        // search in slot 0 for Regular Type 1 messages
        let pSlot0Reg = this.RunWrap(() => {
            return this.q.SearchRegularType1(band, slot0Min, callsign, gte, lte);
        }, () => {
            this.t.Global().Event("Query Slot 0 RegularType1 complete");
        });
        
        // search in slot 0 for Extended Telemetry messages
        let pSlot0Tel = this.RunWrap(() => {
            return this.q.SearchTelemetry(band, slot0Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Global().Event("Query Slot 0 Telemetry complete");
        });
        
        // search in slot 1 for Extended Telemetry messages
        // the telemetry search for Basic vs Extended is exactly the same,
        // decoding will determine which is which
        let pSlot1Tel = this.RunWrap(() => {
            return this.q.SearchTelemetry(band, slot1Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Global().Event("Query Slot 1 Telemetry complete");
        });
        

        // search in slot 2 for Extended Telemetry messages
        
        // search in slot 3 for Extended Telemetry messages
        
        // search in slot 4 for Extended Telemetry messages
        


        // make sure we handle results as they come in
        pSlot0Reg.then(result => this.HandleSlotResults(0, "regular",   result));
        pSlot0Tel.then(result => this.HandleSlotResults(0, "telemetry", result));
        pSlot1Tel.then(result => this.HandleSlotResults(1, "telemetry", result));
        
        // wait for all results to be returned before moving on
        promiseList.push(pSlot0Reg);
        promiseList.push(pSlot0Tel);
        promiseList.push(pSlot1Tel);
        let resultList = await Promise.all(promiseList);

        // collect results

        this.t.Global().Event("WsprSearch::Search complete");

        console.log(this.dt__data);

        this.t.Global().Report("WsprSearch");

        // fire completed event
        this.onSearchCompleteFn();
    }





// private



    // Regular object:
    // {
    //     "time"      : "2024-10-22 15:04:00",
    //     "min"       : 4,
    //     "callsign"  : "KD2KDD",
    //     "grid4"     : "FN20",
    //     "gridRaw"   : "FN20",
    //     "powerDbm"  : 13,
    //     "rxCallsign": "AC0G",
    //     "rxGrid"    : "EM38ww",
    //     "frequency" : 14097036
    // }
    //
    // Telemetry object:
    // {
    //     "time"      : "2024-10-22 15:06:00",
    //     "id1"       : "1",
    //     "id3"       : "2",
    //     "min"       : 6,
    //     "callsign"  : "1Y2QQJ",
    //     "grid4"     : "OC04",
    //     "powerDbm"  : 37,
    //     "rxCallsign": "AB4EJ",
    //     "rxGrid"    : "EM63fj",
    //     "frequency" : 14097036
    // }
    //
    //
    // Combine to form, by time:
    //
    // {
    //     // the time associated with slot 0
    //     time: "..."
    //
    //     // the raw data
    //     slot0RegularList
    //     slot0TelemetryList
    //     slot1TelemetryList
    //     ...
    //
    //     // now grouped by data actual wspr triplet.
    //     // no need to do this for regular, per-se, because it's already unique,
    //     // but why not, just to keep the structures the same
    //     slot0RegularGroupList
    //     slot0TelemetryGroupList
    //     slot1TelemetryGroupList: [
    //         {
    //             // the unique data
    //             result: { callsign, grid4, powerDbm}
    //
    //             // all the results with the same data, but different rx, freq, etc
    //             resultList: [{}, ...]
    //
    //             // decoded (only for telemetry)
    //             decoded: {
    //                 type: "basic/extended"
    //
    //                 // for basic, just the fields
    //                 basic = {
    //                     grid56
    //                     altitudeMeters
    //                     temperatureCelsius
    //                     voltageVolts
    //                     speedKnots
    //                     gpsIsValid
    //                 }
    //
    //                 // for extended, the codec object itself
    //                 .extended: [obj]
    //             }
    //         }
    //     ]
    //     ...
    //     
    // }


    CreateStructure()
    {
        return {
            time: "",

            slot0RegularList  : [],
            slot0TelemetryList: [],
            slot1TelemetryList: [],
            slot2TelemetryList: [],
            slot3TelemetryList: [],
            slot4TelemetryList: [],

            slot0RegularGroupList  : [],
            slot0TelemetryGroupList: [],
            slot1TelemetryGroupList: [],
            slot2TelemetryGroupList: [],
            slot3TelemetryGroupList: [],
            slot4TelemetryGroupList: [],
        };
    }

    HandleSlotResults(slot, type, resultList)
    {
        // work out property names

        let resultListName      = ``;
        let resultGroupListName = ``;

        resultListName      += `slot${slot}`;
        resultGroupListName += `slot${slot}`;

        if (type == "regular")
        {
            resultListName      += `Regular`;
            resultGroupListName += `RegularGroup`;
        }
        else
        {
            resultListName      += `Telemetry`;
            resultGroupListName += `TelemetryGroup`;
        }

        resultListName      += `List`;
        resultGroupListName += `List`;

        // Get the list of times affected by adding this dataset
        let minuteOffset = slot * 2;
        let timeList =
            this.CombineAndGroup(resultListName,
                                 resultGroupListName,
                                 resultList,
                                 minuteOffset);
        
        // Decode as long as we're sitting around waiting for results to come in
        if (type != "regular")
        {
            this.Decode(slot, timeList, resultGroupListName);
        }
    }

    CombineAndGroup(resultListName, resultGroupListName, resultList, minuteOffset)
    {
        this.t.Global().Event(`Combine ${resultListName}, ${minuteOffset}`);
        console.log(resultList);

        // collect into different time buckets
        let timeSlot0UsedSet = new Set();
        for (const result of resultList)
        {
            // adjust time to match slot 0
            let msThis    = utl.ParseTimeToMs(result.time);
            let msSlot0   = (msThis - (minuteOffset * 60 * 1000));
            let timeSlot0 = utl.MakeDateTimeFromMs(msSlot0);


// debug
if (timeSlot0 != "2023-11-16 17:14:00")
{
    // continue;
}

            // keep track of the times that actually were seen for this dataset
            timeSlot0UsedSet.add(timeSlot0);

            // look up data based on slot 0 time
            if (this.dt__data.has(timeSlot0) == false)
            {
                // not found, init entry
                let data = this.CreateStructure();

                data.time = timeSlot0;

                this.dt__data.set(timeSlot0, data);
            }

            // get handle to entry
            let data = this.dt__data.get(timeSlot0);

            // store result in appropriate bin
            data[resultListName].push(result);
        }

        // arrange each bucket by unique data
        let Group = (storageObj, resultGroupListName, resultList) => {
            let key__data = new Map();

            for (const result of resultList)
            {
                let key = `${result.callsign}_${result.grid4}_${result.powerDbm}`;

                if (key__data.has(key) == false)
                {
                    key__data.set(key, {
                        result: {
                            callsign: result.callsign,
                            grid4   : result.grid4,
                            powerDbm: result.powerDbm,
                        },

                        resultList: [],
                    });
                }

                let data = key__data.get(key);

                data.resultList.push(result);
            }

            // get keys in sorted order for nicer storage
            let keyList = Array.from(key__data.keys()).sort();

            // store the object that has been built up
            storageObj[resultGroupListName] = [];
            for (const key of keyList)
            {
                storageObj[resultGroupListName].push(key__data.get(key));
            }
        };

        for (const timeSlot0 of timeSlot0UsedSet)
        {
            let data = this.dt__data.get(timeSlot0);

            Group(data, resultGroupListName, data[resultListName]);
        }

        // return time list
        let timeList = Array.from(timeSlot0UsedSet.keys());

        return timeList;
    };


    Decode(slot, timeList, resultGroupListName)
    {
        this.t.Global().Event(`Decode start ${resultGroupListName}`);

        for (const time of timeList)
        {
            let data = this.dt__data.get(time);

            for (let resultGroup of data[resultGroupListName])
            {
                let result = resultGroup.result;

                let ret = WSPREncoded.DecodeU4BGridPower(result.grid4, result.powerDbm);
                if (ret.msgType == "standard")
                {
                    let [grid56, altitudeMeters] = WSPREncoded.DecodeU4BCall(result.callsign);
                    let [temperatureCelsius, voltageVolts, speedKnots, gpsIsValid] = ret.data;
        
                    let decSpot = {
                        grid56,
                        altitudeMeters,
                        temperatureCelsius,
                        voltageVolts,
                        speedKnots,
                        gpsIsValid,
                    };
        
                    resultGroup.decoded = {
                        type: "basic",
                        basic: decSpot,
                    };
                }
                else
                {
                    // use blank codec to read headers
                    c.Reset();

                    c.SetCall(result.callsign);
                    c.SetGrid(result.grid4);
                    c.SetPowerDbm(result.powerDbm);

                    c.Decode();

                    // ensure zero
                    c.GetHdrRESERVEDEnum();
                    
                    // check slot now?
                    // what to do if bad?
                    c.GetHdrSlotEnum();
                    
                    // check type to know how to decode
                    c.GetHdrTypeEnum();

                    



                    resultGroup.decoded = {
                        type: "extended",
                    };
                }
            }
        }

        this.t.Global().Event(`Decode end`);
    }

    // filter out
    FilterBadTelemetryBySlotMismatch()
    {

    }

    FilterByFingerprint()
    {

    }


















    async RunWrap(fnRun, fnOnFinish)
    {
        let result = await fnRun();

        fnOnFinish();

        return result;
    }
}
