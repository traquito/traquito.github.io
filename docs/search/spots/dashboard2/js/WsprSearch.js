import * as utl from '/js/Utl.js';

import { CandidateFilterByBadTelemetry } from './CandidateFilterByBadTelemetry.js';
import { CandidateFilterBySpec } from './CandidateFilterBySpec.js';
import { QuerierWsprLive } from './QuerierWsprLive.js';
import { Timeline } from '/js/Timeline.js';
import { WSPR } from '/js/WSPR.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { WsprCodecMaker } from '/pro/codec/WsprCodec.js';
import { WsprMessageCandidate } from './WsprMessageCandidate.js';



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
            this.t.Event("WsprSearch::Search Query Slot 0 RegularType1 Start");
            return this.q.SearchRegularType1(band, slot0Min, callsign, gte, lte);
        }, () => {
            this.t.Event("WsprSearch::Search Query Slot 0 RegularType1 Complete");
        });
        
        // Search in slot 0 for Extended Telemetry messages
        let pSlot0Tel = RunWrap(() => {
            this.t.Event("WsprSearch::Search Query Slot 0 Telemetry Start");
            return this.q.SearchTelemetry(band, slot0Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Event("WsprSearch::Search Query Slot 0 Telemetry Complete");
        });
        
        // Search in slot 1 for Extended Telemetry messages.
        // the telemetry search for Basic vs Extended is exactly the same,
        // decoding will determine which is which.
        let pSlot1Tel = RunWrap(() => {
            this.t.Event("WsprSearch::Search Query Slot 1 Telemetry Start");
            return this.q.SearchTelemetry(band, slot1Min, cd.id1, cd.id3, gte, lte);
        }, () => {
            this.t.Event("WsprSearch::Search Query Slot 1 Telemetry Complete");
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
        this.CandidateFilter();

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

    ForEachWindowMsgListList(fn)
    {
        for (let [time, windowData] of this.time__windowData)
        {
            let msgListList = [];

            for (let slotData of windowData.slotDataList)
            {
                msgListList.push(slotData.msgList);
            }

            fn(msgListList);
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

        this.t.Event(`WsprSearch::HandleSlotResults Start ${slot} ${type}`);
        
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
                    let msg = new WsprMessageCandidate();

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

        this.t.Event(`WsprSearch::HandleSlotResults End ${slot} ${type}`);
    };


    ///////////////////////////////////////////////////////////////////////////
    // Decode
    ///////////////////////////////////////////////////////////////////////////

    Decode()
    {
        this.t.Event(`WsprSearch::Decode Start`);

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
                    // msg.decodeDetails.decodeAudit.note = "explain failure";

                }
            }
        });

        this.t.Event(`WsprSearch::Decode End (${count} decoded)`);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Candidate Filter
    ///////////////////////////////////////////////////////////////////////////

    CandidateFilter()
    {
        this.t.Event(`WsprSearch::CandidateFilter Start`);

        // get list of filters to run
        let candidateFilterList = [
            new CandidateFilterByBadTelemetry(this.t),
            new CandidateFilterBySpec(this.t),
        ];

        // create ForEach object
        let forEachAble = {
            ForEach: (fn) => {
                this.ForEachWindowMsgListList(fn);
            },
        };

        // run filters
        for (let candidateFilter of candidateFilterList)
        {
            candidateFilter.SetDebug(this.debug);

            candidateFilter.Filter(forEachAble);
        }

        this.t.Event(`WsprSearch::CandidateFilter End`);
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

