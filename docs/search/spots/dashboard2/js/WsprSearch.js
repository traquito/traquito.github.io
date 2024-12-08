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

        this.time__windowData = new Map();
        
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
            this.t.Global().Event("Query Slot 0 RegularType1 Start");
            return this.q.SearchRegularType1(band, slot0Min, callsign, gte, lte);
        }, () => {
            this.t.Global().Event("Query Slot 0 RegularType1 Complete");
        });
        
        // search in slot 0 for Extended Telemetry messages
        let pSlot0Tel = this.RunWrap(() => {
            this.t.Global().Event("Query Slot 0 Telemetry Start");
            return this.q.SearchTelemetry(band, slot0Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Global().Event("Query Slot 0 Telemetry Complete");
        });
        
        // search in slot 1 for Extended Telemetry messages
        // the telemetry search for Basic vs Extended is exactly the same,
        // decoding will determine which is which
        let pSlot1Tel = this.RunWrap(() => {
            this.t.Global().Event("Query Slot 1 Telemetry Start");
            return this.q.SearchTelemetry(band, slot1Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Global().Event("Query Slot 1 Telemetry Complete");
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

        console.log(this.time__windowData);

        this.Decode();
        this.FingerprintFilter();

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
    //     slotDataList[slotIdx].resultGroupList: [
    //         {
    //             type: "regular/telemetry"
    //             
    //             // the unique data
    //             result: { callsign, grid4, powerDbm}
    //
    //             // all the results with the same data, but different rx, freq, etc
    //             resultList: [{}, ...]
    //
    //             // decoded (only for telemetry)
    //             decodeDetails: {
    //                 type: "basic/extended"   // basic is default
    //
    //                 decodeOk: true/false     // only applies to basic/extended
    //                 reasonDetails: {
    //                     reason: ""
    //                 }
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
    //                 extended: [obj]
    //             }
    //
    //             // audit and status of fingerprinting
    //             fingerprintDetails: {
    //                 // tells you the state of fingerprint matching this entry
    //                 // candidate    - no status yet
    //                 // disqualified - illegal presence due to bad telemetry, or that telemetry shouldn't be there
    //                 // matched      - this 
    //                 // rejected     - 
    //                 // (possible that none are selected)
    //                 matchState: "candidate -> disqualified/matched/rejected"    // candidate is default
    //                 
    //                 // the reason why it was/wasn't a match
    //                 reasonDetails: {
    //                     reason: ""
    //
    //                     // content not sure yet. iterations? freq distance, etc?
    //                     // could include detail of a multi-pass operation to match up
    //                     // could include exclusion of Extended in favor of Regular
    //                     // etc
    //                 }
    //             }
    //         },
    //         ...
    //     ],
    //     slot1TelemetryGroupList: [...],
    //     ...
    //     
    // }

    // represents a given 10-minute window.
    // has data object for each of the 5 slots.
    CreateWindow()
    {
        let obj = {
            slotDataList: [],
        };

        for (let i = 0; i < 5; ++i)
        {
            obj.slotDataList.push({
                resultGroupList: [],
            });

            // just for looking at
            obj[`slot${i}ResultGroupList`] = obj.slotDataList[i].resultGroupList;
        }

        return obj;
    }

    CreateResultGroup()
    {
        return {
            type: "regular",

            result: {
                callsign: "",
                grid4   : "",
                powerDbm: "",
            },
            resultList: [],

            decodeDetails: {
                type: "basic",

                decodeOk: true,
                decodeDetails: {
                    reason: "",
                },
            },

            fingerprintDetails: {
                matchState: "candidate",

                reasonDetails: {
                    reason: "",
                },
            },
        };
    }
    
    ForEachResultGroup(fn)
    {
        for (let [time, windowData] of this.time__windowData)
        {
            for (let slotData of windowData.slotDataList)
            {
                for (let resultGroup of slotData.resultGroupList)
                {
                    fn(resultGroup);
                }
            }
        }
    }
    
    HandleSlotResults(slot, type, resultList)
    {
        this.CombineAndGroup(slot, type, resultList);
    }

    CombineAndGroup(slot, type, resultList)
    {
        let minuteOffset = slot * 2;

        this.t.Global().Event(`Combine ${slot} ${type} Start`);

        // collect into different time buckets
        let timeSlot0UsedSet = new Set();
        for (const result of resultList)
        {
            // based on the slot the results are from, what would the time be for slot0?
            let msThis    = utl.ParseTimeToMs(result.time);
            let slot0Ms   = (msThis - (minuteOffset * 60 * 1000));
            let slot0Time = utl.MakeDateTimeFromMs(slot0Ms);

            // keep track of the times that actually were seen for this dataset
            timeSlot0UsedSet.add(slot0Time);

            // look up window based on slot 0 time
            if (this.time__windowData.has(slot0Time) == false)
            {
                // not found, init entry
                let windowData = this.CreateWindow();

                windowData.time = slot0Time;
                
                this.time__windowData.set(slot0Time, windowData);
            }
            
            // get handle to entry
            let windowData = this.time__windowData.get(slot0Time);

            // create temporary place to hold slot results associated with time
            // without creating another hash table. pure convenience.
            if (windowData.tmpResultList == undefined)
            {
                windowData.tmpResultList = [];
            }

            // store result in appropriate bin
            windowData.tmpResultList.push(result);
        }

        // create result groups
        let Group = (resultGroupList, resultList) => {
            let key__resultGroup = new Map();

            for (const result of resultList)
            {
                let key = `${result.callsign}_${result.grid4}_${result.powerDbm}`;

                if (key__resultGroup.has(key) == false)
                {
                    let resultGroup = this.CreateResultGroup();

                    resultGroup.type = type;

                    resultGroup.result.callsign = result.callsign;
                    resultGroup.result.grid4    = result.grid4;
                    resultGroup.result.powerDbm = result.powerDbm;

                    key__resultGroup.set(key, resultGroup);
                }

                let resultGroup = key__resultGroup.get(key);

                resultGroup.resultList.push(result);
            }

            // get keys in sorted order for nicer storage
            let keyList = Array.from(key__resultGroup.keys()).sort();

            // store the object that has been built up
            for (const key of keyList)
            {
                resultGroupList.push(key__resultGroup.get(key));
            }
        };

        for (const timeSlot0 of timeSlot0UsedSet)
        {
            let windowData = this.time__windowData.get(timeSlot0);

            let slotData = windowData.slotDataList[slot];
            let resultGroupList = slotData.resultGroupList;

            Group(resultGroupList, windowData.tmpResultList);
            
            // destroy temporary list
            delete windowData.tmpResultList;
        }

        this.t.Global().Event(`Combine ${slot} ${type} End`);
    };

    Decode()
    {
        this.t.Global().Event(`Decode Start`);

        let count = 0;

        this.ForEachResultGroup(resultGroup => {
            if (resultGroup.type != "regular")
            {
                ++count;

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
        
                    resultGroup.decodeDetails.type     = "basic";
                    resultGroup.decodeDetails.decodeOk = true;

                    resultGroup.basic = decSpot;
                }
                else
                {
                    // use blank codec to read headers
                    this.c.Reset();

                    this.c.SetCall(result.callsign);
                    this.c.SetGrid(result.grid4);
                    this.c.SetPowerDbm(result.powerDbm);

                    this.c.Decode();

                    // ensure zero
                    this.c.GetHdrRESERVEDEnum();
                    
                    // check slot now?
                    // what to do if bad?
                    this.c.GetHdrSlotEnum();
                    
                    // check type to know how to decode
                    this.c.GetHdrTypeEnum();

                    resultGroup.decodeDetails.type = "extended";
                    // resultGroup.decodeDetails.decodeOk = true;   // ???
                }
            }
        });

        this.t.Global().Event(`Decode End (${count} decoded)`);
    }


    FingerprintAlgorithm_AnchorBySlot0(resultGroupListList)
    {
        // Disqualify Bad Telemetry Stage
        // - Disqualify any results which are telemetry and failed decode
        for (let resultGroupList of resultGroupListList)
        {
            for (let resultGroup of resultGroupList)
            {
                if (resultGroup.type                   == "telemetry" &&
                    resultGroup.decodeDetails.decodeOk == false)
                {
                    let fd = resultGroup.fingerprintDetails;
    
                    fd.matchState = "disqualified";
                    fd.reasonDetails.reason =
                        `Bad Telemetry (${fd.decodeDetails.reasonDetails.reason})`;
                }
            }
        }

        // Set up some helper functions
        let DisqualifyBasicTelemetry = (resultGroupList) => {
            for (let resultGroup of resultGroupList)
            {
                if (resultGroup.fingerprintDetails.matchState == "candidate")
                {
                    if (resultGroup.type == "telemetry")
                    {
                        if (resultGroup.decodeDetails.type == "basic")
                        {
                            fd.matchState = "disqualified";
                            fd.reasonDetails.reason = `Basic Telemetry not supported in this slot`;
                        }
                    }
                }
            }
        };

        let IsCandidate = (resultGroup) => {
            return resultGroup.fingerprintDetails.matchState == "candidate";
        }

        let CandidateFilter = (resultGroupList) => {
            let resultGroupListIsCandidate = [];

            for (let resultGroup of resultGroupList)
            {
                if (IsCandidate(resultGroup))
                {
                    resultGroupListIsCandidate.push(resultGroup);
                }
            }

            return resultGroupListIsCandidate;
        };



        // Slot 0 Selection Stage
        // - Slot 0 - can have Regular Type 1 or Extended Telemetry
        // - If there is Regular, prefer it over Extended
        let slot0ResultGroupList = resultGroupListList[0];

        // First, disqualify any Basic Telemetry, if any
        DisqualifyBasicTelemetry(slot0ResultGroupList);

        // Look at what we see
        let regularFoundCount = 0;
        let extTelemetryFound = 0;
        for (let resultGroup of CandidateFilter(slot0ResultGroupList))
        {
            if (resultGroup.type == "regular")
            {
                ++regularFoundCount;
            }
            else if (resultGroup.type == "telemetry")
            {
                ++extTelemetryFound;
            }
        }

        // See what we found
        if (regularFoundCount == 0)
        {
            if (extTelemetryFound == 0)
            {
            }
            else if (extTelemetryFound == 1)
            {

            }
            else
            {

            }
        }
        else if (regularFoundCount == 1)
        {
            // ok this is our guy

            // mark all others in this group as not rejected
        }
        else
        {
            // fatal ambiguity

            // mark all as rejected
                // regulars can be noted as the cause
                // telemetry can be noted as rejected due to regular existing
        }










        // slot 1 - can have Basic Telemetry or Extended Telemetry
        // how to decide/eliminate?


        // now work through which?/all slots
        // I think better to start with the tightest freq match and go from there?
        // what about where there are multiple candidates? is there a weighting?
        // break it all out, be super clear

        

    }

    FingerprintFilter()
    {
        this.t.Global().Event(`FingerprintFilter Start`);

        // for a given window of time, get all the slots data, and hand off to
        // the algorithm that does window-by-window fingerprint processing
        for (let [time, windowData] of this.time__windowData)
        {
            let resultGroupListList = [];

            for (let slotData of windowData.slotDataList)
            {
                for (let resultGroup of slotData.resultGroupList)
                {
                    resultGroupListList.push(resultGroup);
                }
            }

            this.FingerprintAlgorithm(resultGroupListList);
        }

        this.t.Global().Event(`FingerprintFilter End`);
    }


    FingerprintFilter()
    {






        for (let [time, data] of this.time__windowData)
        {
            let groupList = data.slot0RegularAndTelemetryGroupList;

            // first pass, is there a regular message in there?
            let regularFound = false;
            for (let group of groupList)
            {
                if (group.decoded == undefined)
                {
                    // not decoded, therefore it's regular telemetry, therefore we prefer
                    // this over others
                    regularFound = true;

                    group.fingerprintDetails.matched = true;
                    group.fingerprintDetails.reasonDetails.reason = "RegularType1 Found";

                    break;
                }
            }

            if (regularFound)
            {
                // go explain why the rest were not selected

                for (let group of groupList)
                {
                    if (group.fingerprintDetails.matched == false)
                    {
                        group.fingerprintDetails.reasonDetails.reason = "RegularType1 Found";
                    }
                }
            }
            else
            {

            }
        }


    }


















    async RunWrap(fnRun, fnOnFinish)
    {
        let result = await fnRun();

        fnOnFinish();

        return result;
    }
}
