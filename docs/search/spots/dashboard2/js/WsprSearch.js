import * as utl from '/js/Utl.js';
import { Timeline } from '/js/Timeline.js';
import { WSPR } from '/js/WSPR.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { WsprCodecMaker } from '/pro/codec/WsprCodec.js';
import { QuerierWsprLive } from './QuerierWsprLive.js';



///////////////////////////////////////////////////////////////////////////
//
// WsprSearch class
//
// Handles the complete task of finding, filtering, and decoding
// of wspr messages in a given search window, according to
// the rules of Extended Telemetry.
//
// Fully asynchronous non-blocking callback-based interface.
//
///////////////////////////////////////////////////////////////////////////

export class WsprSearch
{
    constructor()
    {
        // timeline
        this.t = new Timeline();

        // query interface
        this.q = new QuerierWsprLive();

        // get a blank codec just for reading header fields
        this.codecMaker = new WsprCodecMaker();
        this.c = this.codecMaker.GetCodec();

        // keep track of data by time
        this.time__windowData = new Map();
        
        // event handler default registration
        this.SetOnSearchCompleteEventHandler(() => {});

        // debug
        this.debug = false;
    }
    
    SetDebug(tf)
    {
        this.debug = tf;

        this.t.SetCcGlobal(this.debug);
        this.t.SetLogOnEvent(this.debug);

        this.q.SetDebug(this.debug);
    }

    Debug(str)
    {
        if (this.debug)
        {
            console.log(str);
        }
    }

    SetOnSearchCompleteEventHandler(fn)
    {
        this.onSearchCompleteFn = fn;
    }

    async Search(band, channel, callsign, gte, lte)
    {
        this.t.Reset();
        this.t.Event("WsprSearch::Search Start");

        // Calculate slot details
        let cd = WSPR.GetChannelDetails(band, channel);

        let slot0Min = (cd.min + 0) % 10;
        let slot1Min = (cd.min + 2) % 10;
        let slot2Min = (cd.min + 4) % 10;
        let slot3Min = (cd.min + 6) % 10;
        let slot4Min = (cd.min + 8) % 10;

        // Build async search requests
        let promiseList = [];

        // Search in slot 0 for Regular Type 1 messages
        let pSlot0Reg = RunWrap(() => {
            this.t.Event("Query Slot 0 RegularType1 Start");
            return this.q.SearchRegularType1(band, slot0Min, callsign, gte, lte);
        }, () => {
            this.t.Event("Query Slot 0 RegularType1 Complete");
        });
        
        // Search in slot 0 for Extended Telemetry messages
        let pSlot0Tel = RunWrap(() => {
            this.t.Event("Query Slot 0 Telemetry Start");
            return this.q.SearchTelemetry(band, slot0Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Event("Query Slot 0 Telemetry Complete");
        });
        
        // Search in slot 1 for Extended Telemetry messages.
        // the telemetry search for Basic vs Extended is exactly the same,
        // decoding will determine which is which.
        let pSlot1Tel = RunWrap(() => {
            this.t.Event("Query Slot 1 Telemetry Start");
            return this.q.SearchTelemetry(band, slot1Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Event("Query Slot 1 Telemetry Complete");
        });
        
        // Search in slot 2 for Extended Telemetry messages
        // ...        
        
        // Search in slot 3 for Extended Telemetry messages
        // ...        
        
        // Search in slot 4 for Extended Telemetry messages
        // ...        

        // Make sure we handle results as they come in, without blocking
        pSlot0Reg.then(rxRecordList => this.HandleSlotResults(0, "regular",   rxRecordList));
        pSlot0Tel.then(rxRecordList => this.HandleSlotResults(0, "telemetry", rxRecordList));
        pSlot1Tel.then(rxRecordList => this.HandleSlotResults(1, "telemetry", rxRecordList));
        // ...
        // ...
        // ...
        
        // Wait for all results to be returned before moving on
        promiseList.push(pSlot0Reg);
        promiseList.push(pSlot0Tel);
        promiseList.push(pSlot1Tel);
        // ...
        // ...
        // ...

        await Promise.all(promiseList);

        // debug
        this.Debug(this.time__windowData);

        // End of data sourcing
        this.t.Event("WsprSearch::Query Results Complete");
        
        // Do data processing
        this.Decode();
        // this.FingerprintFilter();

        // End of search
        this.t.Event("WsprSearch::Search Complete");
        this.t.Report("WsprSearch");

        // Fire completed event
        this.onSearchCompleteFn();
    }





// private



    ///////////////////////////////////////////////////////////////////////////
    // Data Structures
    ///////////////////////////////////////////////////////////////////////////

    // Window Structure
    //
    // Represents a given 10-minute window.
    // Has data object for each of the 5 slots.
    CreateWindow()
    {
        let obj = {
            // the time associated with slot 0
            time: "",

            // message data for each of the 5 slots
            // (see definition below)
            slotDataList: [],
        };

        for (let i = 0; i < 5; ++i)
        {
            obj.slotDataList.push({
                msgList: [],
            });

            // (convenience member that aids in debugging)
            obj[`slot${i}msgList`] = obj.slotDataList[i].msgList;
        }

        return obj;
    }

    // Message structure
    //
    // Represents a message which was sent and ultimately received
    // by 1 or more reporting stations.
    CreateMsg()
    {
        return {
            // The type of message, regular or telemetry
            // (the specific type of telemetry is not specified here)
            type: "regular",

            // The fields of the wspr message
            fields: {
                callsign: "",
                grid4   : "",
                powerDbm: "",
            },

            // All the rx reports with the same wspr fields, but different rx freq, rx call, etc
            rxRecordList: [],

            // Details about Decode attempt and results.
            // Only has useful information when type = telemetry
            decodeDetails: {
                type: "basic",  // basic or extended

                decodeOk: true, // true or false
                decodeDetails: {
                    reason: "", // useful-to-human explanation of decodeOk
                },

                // actual decoded data, by type
                basic: {},      // the fields of a decoded basic message
                extended: {},   // the codec for the extended type(?)
            },

            // Details of Fingerprinting attempt and results
            fingerprintDetails: {
                // tells you the state of fingerprint matching this entry
                //
                // Initial State
                // - candidate    - no status yet
                //
                // Final State:
                // - disqualified - illegal presence due to bad telemetry, or that telemetry shouldn't be there
                // - matched      - id'd as     being the right message to use (ie it's     your data)
                // - rejected     - id'd as not being the right message to use (ie it's not your data)
                matchState: "candidate",

                // the reason why matchState
                reasonDetails: {
                    reason: "", // useful-to-human explanation of matchState
                },
            },
        };
    }

    ///////////////////////////////////////////////////////////////////////////
    // Data Structure Iterators
    ///////////////////////////////////////////////////////////////////////////
    
    // Iterate over every message, across all slots, across all times
    ForEachMsg(fn)
    {
        for (let [time, windowData] of this.time__windowData)
        {
            for (let slotData of windowData.slotDataList)
            {
                for (let msg of slotData.msgList)
                {
                    fn(msg);
                }
            }
        }
    }

    
    ///////////////////////////////////////////////////////////////////////////
    // Data Structure Filling
    ///////////////////////////////////////////////////////////////////////////

    // Regular rxRecord:
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
    // Telemetry rxRecord:
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
    // Store in local data structure
    HandleSlotResults(slot, type, rxRecordList)
    {
        this.Debug(`WsprSearch::HandleSlotResults ${slot} ${type} ${rxRecordList.length} records`);

        this.t.Event(`Combine ${slot} ${type} Start`);
        
        // collect into different time buckets
        let timeSlot0UsedSet = new Set();
        let minuteOffset = slot * 2;
        for (const rxRecord of rxRecordList)
        {
            // based on the slot the results are from, what would the time be for slot0?
            let msThis    = utl.ParseTimeToMs(rxRecord.time);
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
            if (windowData.tmpRxRecordList == undefined)
            {
                windowData.tmpRxRecordList = [];
            }

            // store rxRecord in appropriate bin
            windowData.tmpRxRecordList.push(rxRecord);
        }

        // create rxRecord groups
        let Group = (msgList, rxRecordList) => {
            let key__msg = new Map();

            for (const rxRecord of rxRecordList)
            {
                let key = `${rxRecord.callsign}_${rxRecord.grid4}_${rxRecord.powerDbm}`;

                if (key__msg.has(key) == false)
                {
                    let msg = this.CreateMsg();

                    msg.type = type;

                    msg.fields.callsign = rxRecord.callsign;
                    msg.fields.grid4    = rxRecord.grid4;
                    msg.fields.powerDbm = rxRecord.powerDbm;

                    key__msg.set(key, msg);
                }

                let msg = key__msg.get(key);

                msg.rxRecordList.push(rxRecord);
            }

            // get keys in sorted order for nicer storage
            let keyList = Array.from(key__msg.keys()).sort();

            // store the object that has been built up
            for (const key of keyList)
            {
                msgList.push(key__msg.get(key));
            }
        };

        for (const timeSlot0 of timeSlot0UsedSet)
        {
            let windowData = this.time__windowData.get(timeSlot0);

            let slotData = windowData.slotDataList[slot];
            let msgList = slotData.msgList;

            Group(msgList, windowData.tmpRxRecordList);
            
            // destroy temporary list
            delete windowData.tmpRxRecordList;
        }

        this.t.Event(`Combine ${slot} ${type} End`);
    };


    ///////////////////////////////////////////////////////////////////////////
    // Processing Pipeline - Decode
    ///////////////////////////////////////////////////////////////////////////

    Decode()
    {
        this.t.Event(`Decode Start`);

        let count = 0;

        this.ForEachMsg(msg => {
            if (msg.type != "regular")
            {
                ++count;

                let fields = msg.fields;

                let ret = WSPREncoded.DecodeU4BGridPower(fields.grid4, fields.powerDbm);
                if (ret.msgType == "standard")
                {
                    let [grid56, altitudeMeters] = WSPREncoded.DecodeU4BCall(fields.callsign);
                    let [temperatureCelsius, voltageVolts, speedKnots, gpsIsValid] = ret.data;
        
                    let decSpot = {
                        grid56,
                        altitudeMeters,
                        temperatureCelsius,
                        voltageVolts,
                        speedKnots,
                        gpsIsValid,
                    };
        
                    msg.decodeDetails.type     = "basic";
                    msg.decodeDetails.decodeOk = true;

                    msg.basic = decSpot;
                }
                else
                {
                    // use blank codec to read headers
                    this.c.Reset();

                    this.c.SetCall(fields.callsign);
                    this.c.SetGrid(fields.grid4);
                    this.c.SetPowerDbm(fields.powerDbm);

                    this.c.Decode();

                    // ensure zero
                    this.c.GetHdrRESERVEDEnum();
                    
                    // check slot now?
                    // what to do if bad?
                    this.c.GetHdrSlotEnum();
                    
                    // check type to know how to decode
                    this.c.GetHdrTypeEnum();

                    msg.decodeDetails.type = "extended";
                    // msg.decodeDetails.decodeOk = true;   // ???
                }
            }
        });

        this.t.Event(`Decode End (${count} decoded)`);
    }


    ///////////////////////////////////////////////////////////////////////////
    // Processing Pipeline - Fingerprint
    ///////////////////////////////////////////////////////////////////////////

    FingerprintAlgorithm_AnchorBySlot0(msgListList)
    {
        /////////////////////////////////////////////////////////////
        // Set up some helper functions.
        // Just meant to keep the higher-level logic cleaner to read.
        /////////////////////////////////////////////////////////////

        // Boolean that tells you if a msg is still classified as a Candidate
        let IsCandidate = (msg) => {
            return msg.fingerprintDetails.matchState == "candidate";
        }

        let IsTelemetry = (msg) => {
            return msg.type == "telemetry";
        }

        let IsBasicTelemetry = (msg) => {
            return IsTelemetry(msg) && msg.decodeDetails.type == "basic";
        }

        // return the subset of msgs within a list that are still Candidate status
        let CandidateFilter = (msgList) => {
            let msgListIsCandidate = [];

            for (let msg of msgList)
            {
                if (IsCandidate(msg))
                {
                    msgListIsCandidate.push(msg);
                }
            }

            return msgListIsCandidate;
        };

        // Disqualify any Candidate-status Basic Telemetry
        let DisqualifyCandidateBasicTelemetry = (msgList) => {
            for (let msg of CandidateFilter(msgList))
            {
                if (IsBasicTelemetry(msg))
                {
                    fd.matchState = "disqualified";
                    fd.reasonDetails.reason = `Basic Telemetry not supported in this slot`;
                }
            }
        };


        /////////////////////////////////////////////////////////////
        // Disqualify Bad Telemetry Stage
        // - Disqualify any results which are telemetry and failed
        //   decode
        //
        // Nothing should be disqualified yet, but we'll protect the
        // scan anyway for a degree of future proofing.
        /////////////////////////////////////////////////////////////

        for (let msgList of msgListList)
        {
            for (let msg of CandidateFilter(msgList))
            {
                if (msg.type == "telemetry" &&
                    msg.decodeDetails.decodeOk == false)
                {
                    let fd = msg.fingerprintDetails;
    
                    fd.matchState = "disqualified";
                    fd.reasonDetails.reason =
                        `Bad Telemetry (${fd.decodeDetails.reasonDetails.reason})`;
                }
            }
        }



        /////////////////////////////////////////////////////////////
        // Slot 0 Selection Stage
        // - Slot 0 - can have Regular Type 1 or Extended Telemetry
        // - If there is Regular, prefer it over Extended
        /////////////////////////////////////////////////////////////
        let slot0msgList = msgListList[0];

        // First, disqualify any Basic Telemetry, if any
        DisqualifyCandidateBasicTelemetry(slot0msgList);

        // Look at what we see
        let regularFoundCount = 0;
        let extTelemetryFound = 0;
        for (let msg of CandidateFilter(slot0msgList))
        {
            if (msg.type == "regular")
            {
                ++regularFoundCount;
            }
            else if (msg.type == "telemetry")
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









        /////////////////////////////////////////////////////////////
        // slot 1 - can have Basic Telemetry or Extended Telemetry
        // how to decide/eliminate?
        /////////////////////////////////////////////////////////////



        /////////////////////////////////////////////////////////////
        // now work through which?/all slots
        // I think better to start with the tightest freq match and go from there?
        // what about where there are multiple candidates? is there a weighting?
        // break it all out, be super clear
        /////////////////////////////////////////////////////////////

        

    }

    FingerprintFilter()
    {
        this.t.Event(`FingerprintFilter Start`);

        // for a given window of time, get all the slots data, and hand off to
        // the algorithm that does window-by-window fingerprint processing
        for (let [time, windowData] of this.time__windowData)
        {
            let msgListList = [];

            for (let slotData of windowData.slotDataList)
            {
                for (let msg of slotData.msgList)
                {
                    msgListList.push(msg);
                }
            }

            this.FingerprintAlgorithm(msgListList);
        }

        this.t.Event(`FingerprintFilter End`);
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
}


///////////////////////////////////////////////////////////////////////////
// Utility Functions
///////////////////////////////////////////////////////////////////////////

async function RunWrap(fnRun, fnOnFinish)
{
    let rxRecord = await fnRun();

    fnOnFinish();

    return rxRecord;
}

