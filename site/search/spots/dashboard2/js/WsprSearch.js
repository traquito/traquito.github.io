import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { CandidateFilterByBadTelemetry } from './CandidateFilterByBadTelemetry.js';
import { CandidateFilterBySpec } from './CandidateFilterBySpec.js';
import { CandidateFilterByFingerprinting } from './CandidateFilterByFingerprinting.js';
import { QuerierWsprLive } from './QuerierWsprLive.js';
import { Timeline } from '/js/Timeline.js';
import { WSPR } from '/js/WSPR.js';
import { WsprCodecMaker } from '/pro/codec/WsprCodec.js';
import { WSPREncoded } from '/js/WSPREncoded.js';
import { WsprMessageCandidate, CandidateOnlyFilter } from './WsprMessageCandidate.js';



class Stats
{
    constructor()
    {
        // query stats
            // duration
            // row count
        this.query = {
            slot0Regular: {
                durationMs: 0,
                rowCount: 0,
                uniqueMsgCount: 0,
            },
            slot0Telemetry: {
                durationMs: 0,
                rowCount: 0,
                uniqueMsgCount: 0,
            },
            slot1Telemetry: {
                durationMs: 0,
                rowCount: 0,
                uniqueMsgCount: 0,
            },
            slot2Telemetry: {
                durationMs: 0,
                rowCount: 0,
                uniqueMsgCount: 0,
            },
            slot3Telemetry: {
                durationMs: 0,
                rowCount: 0,
                uniqueMsgCount: 0,
            },
            slot4Telemetry: {
                durationMs: 0,
                rowCount: 0,
                uniqueMsgCount: 0,
            },
        };

        // processing stats
            // duration
            // elimination per stage
        this.processing = {
            decodeMs: 0,
            filterMs: 0,
            searchTotalMs: 0,
            statsGatherMs: 0,
        };
        
        // result stats
            // good results
            // ambiguous results
        this.results = {
            windowCount: 0,

            slot0: {
                // relative to windowCount, what pct, in these slots, have any data?
                haveAnyMsgsPct: 0,

                // relative to 100% that do have data
                noCandidatePct: 0,
                oneCandidatePct: 0,
                multiCandidatePct: 0,
            },
            // ... for slot1-4 also
        };
    }
}


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
extends Base
{
    constructor()
    {
        super();

        // stats
        this.stats = new Stats();

        // query interface
        this.q = new QuerierWsprLive();

        // get a blank codec just for reading header fields
        this.codecMaker = new WsprCodecMaker();
        this.c = this.codecMaker.GetCodec();

        // keep track of data by time
        this.time__windowData = new Map();
        
        // event handler registration
        this.onSearchCompleteFnList = [];

        // field definition list
        this.fieldDefinitionList = new Array(5).fill("");
    }
    
    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.t.SetCcGlobal(tf);
    }

    Reset()
    {
        this.t.Reset();
        this.time__windowData = new Map();
    }

    AddOnSearchCompleteEventHandler(fn)
    {
        this.onSearchCompleteFnList.push(fn);
    }

    SetFieldDefinitionList(fieldDefinitionList)
    {
        this.fieldDefinitionList = fieldDefinitionList;
    }

    async Search(band, channel, callsign, gte, lte)
    {
        this.Reset();
        let t1 = this.t.Event("WsprSearch::Search Start");

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
        let pSlot0Reg = (async () => {
            let t1 = this.t.Event("WsprSearch::Search Query Slot 0 RegularType1 Start");
            let p = await this.q.SearchRegularType1(band, slot0Min, callsign, gte, lte);
            let t2 = this.t.Event("WsprSearch::Search Query Slot 0 RegularType1 Complete");

            this.stats.query.slot0Regular.durationMs = Math.round(t2 - t1);

            return p;
        })();

        // Search in slot 0 for Extended Telemetry messages
        let pSlot0Tel = (async () => {
            let t1 = this.t.Event("WsprSearch::Search Query Slot 0 Telemetry Start");
            let p = await this.q.SearchTelemetry(band, slot0Min, cd.id1, cd.id3, gte, lte);
            let t2 = this.t.Event("WsprSearch::Search Query Slot 0 Telemetry Complete");

            this.stats.query.slot0Telemetry.durationMs = Math.round(t2 - t1);

            return p;
        })();
        
        // Search in slot 1 for Extended Telemetry messages.
        // the telemetry search for Basic vs Extended is exactly the same,
        // decoding will determine which is which.
        let pSlot1Tel = (async () => {
            let t1 = this.t.Event("WsprSearch::Search Query Slot 1 Telemetry Start");
            let p = await this.q.SearchTelemetry(band, slot1Min, cd.id1, cd.id3, gte, lte);
            let t2 = this.t.Event("WsprSearch::Search Query Slot 1 Telemetry Complete");

            this.stats.query.slot1Telemetry.durationMs = Math.round(t2 - t1);

            return p;
        })();
        
        // Search in slot 2 for Extended Telemetry messages
        let pSlot2Tel = (async () => {
            let t1 = this.t.Event("WsprSearch::Search Query Slot 2 Telemetry Start");
            let p = await this.q.SearchTelemetry(band, slot2Min, cd.id1, cd.id3, gte, lte);
            let t2 = this.t.Event("WsprSearch::Search Query Slot 2 Telemetry Complete");

            this.stats.query.slot2Telemetry.durationMs = Math.round(t2 - t1);

            return p;
        })();
        
        // Search in slot 3 for Extended Telemetry messages
        let pSlot3Tel = (async () => {
            let t1 = this.t.Event("WsprSearch::Search Query Slot 3 Telemetry Start");
            let p = await this.q.SearchTelemetry(band, slot3Min, cd.id1, cd.id3, gte, lte);
            let t2 = this.t.Event("WsprSearch::Search Query Slot 3 Telemetry Complete");

            this.stats.query.slot3Telemetry.durationMs = Math.round(t2 - t1);

            return p;
        })();
        
        // Search in slot 4 for Extended Telemetry messages
        let pSlot4Tel = (async () => {
            let t1 = this.t.Event("WsprSearch::Search Query Slot 4 Telemetry Start");
            let p = await this.q.SearchTelemetry(band, slot4Min, cd.id1, cd.id3, gte, lte);
            let t2 = this.t.Event("WsprSearch::Search Query Slot 4 Telemetry Complete");

            this.stats.query.slot4Telemetry.durationMs = Math.round(t2 - t1);

            return p;
        })();

        // Make sure we handle results as they come in, without blocking
        pSlot0Reg.then(rxRecordList => {
            this.stats.query.slot0Regular.rowCount = rxRecordList.length;
            this.HandleSlotResults(0, "regular",   rxRecordList);
        });
        pSlot0Tel.then(rxRecordList => {
            this.stats.query.slot0Telemetry.rowCount = rxRecordList.length;
            this.HandleSlotResults(0, "telemetry", rxRecordList);
        });
        pSlot1Tel.then(rxRecordList => {
            this.stats.query.slot1Telemetry.rowCount = rxRecordList.length;
            this.HandleSlotResults(1, "telemetry", rxRecordList);
        });
        pSlot2Tel.then(rxRecordList => {
            this.stats.query.slot2Telemetry.rowCount = rxRecordList.length;
            this.HandleSlotResults(2, "telemetry", rxRecordList);
        });
        pSlot3Tel.then(rxRecordList => {
            this.stats.query.slot3Telemetry.rowCount = rxRecordList.length;
            this.HandleSlotResults(3, "telemetry", rxRecordList);
        });
        pSlot4Tel.then(rxRecordList => {
            this.stats.query.slot4Telemetry.rowCount = rxRecordList.length;
            this.HandleSlotResults(4, "telemetry", rxRecordList);
        });
        
        // Wait for all results to be returned before moving on
        promiseList.push(pSlot0Reg);
        promiseList.push(pSlot0Tel);
        promiseList.push(pSlot1Tel);
        promiseList.push(pSlot2Tel);
        promiseList.push(pSlot3Tel);
        promiseList.push(pSlot4Tel);

        await Promise.all(promiseList);
        
        // End of data sourcing
        this.t.Event("WsprSearch::Query Results Complete");
        
        // Do data processing
        this.Decode();
        this.CandidateFilter();
        
        // optimize internal data structure for later use
        this.OptimizeDataStructures();

        // debug
        this.Debug(this.time__windowData);
        
        // End of search
        let t2 = this.t.Event("WsprSearch::Search Complete");
        
        // stats
        this.stats.processing.searchTotalMs = Math.round(t2 - t1);
        this.GatherStats();
        this.Debug(this.stats);

        // Fire completed event
        for (let fn of this.onSearchCompleteFnList)
        {
            fn();
        }
    }

    GetStats()
    {
        return this.stats;
    }

    // Allow iteration of every 10-minute window, in time-ascending order.
    // 
    // The function argument is called back with:
    // - time        - time of window
    // - slotMsgList - a single-dimensional array of messages, where the index
    //                 corresponds to the slot it was from.
    //                 each msg will either be a msg, or null if not present.
    //
    // The msgList is constructed by extracting single-candidate entries
    // from the slot in the wider dataset, where available.
    //
    // Windows where no slot has a single-candidate entry will not be
    // iterated here.
    //
    // Callback functions which return false immediately stop iteration.
    ForEachWindow(fn)
    {
        for (const [time, windowData] of this.time__windowData)
        {
            let msgListList = [];

            for (let slotData of windowData.slotDataList)
            {
                msgListList.push(slotData.msgList);
            }
    
            const [ok, slotMsgList] =
                this.GetMsgListListWithOnlySingleCandidateEntries(msgListList);
            
            if (ok)
            {
                let retVal = fn(time, slotMsgList);

                if (retVal == false)
                {
                    break;
                }
            }
        }
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
    // Data Structure Iterator Utility Functions
    ///////////////////////////////////////////////////////////////////////////

    // A msgListList has, in each slot, a collection of messages that
    // can be candidates or rejected.
    //
    // This function returns a tuple:
    // - ok 
    //     - true if the returned set has at least one slot with a 
    //       single candidate message.
    // - slotMsgList
    //     - the now-filtered list. in each slot is either:
    //         - null
    //         - a single msg, which was the only candidate msg
    //           in the slot to begin with.
    //           (this therefore excludes slots with 0 or 2+ candidates)
    //           (as in, we think this message is ours)
    //
    // This is expected to be the common form of extracted data.
    GetMsgListListWithOnlySingleCandidateEntries(msgListList)
    {
        let atLeastOne  = false;
        let slotMsgList = [];

        for (const msgList of msgListList)
        {
            const msgListFiltered = CandidateOnlyFilter(msgList);

            if (msgListFiltered.length == 1)
            {
                atLeastOne = true;

                slotMsgList.push(msgListFiltered[0]);
            }
            else
            {
                slotMsgList.push(null);
            }
        }

        return [atLeastOne, slotMsgList];
    }

    
    ///////////////////////////////////////////////////////////////////////////
    // Data Structure Filling
    ///////////////////////////////////////////////////////////////////////////

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
        let t1 = this.t.Event(`WsprSearch::Decode Start`);

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

                    msg.decodeDetails.basic = decSpot;
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

        let t2 = this.t.Event(`WsprSearch::Decode End (${count} decoded)`);

        this.stats.processing.decodeMs = Math.round(t2 - t1);
    }

    ///////////////////////////////////////////////////////////////////////////
    // Candidate Filter
    ///////////////////////////////////////////////////////////////////////////

    CandidateFilter()
    {
        let t1 = this.t.Event(`WsprSearch::CandidateFilter Start`);

        // get list of filters to run
        let candidateFilterList = [
            new CandidateFilterByBadTelemetry(this.t),
            new CandidateFilterBySpec(this.t),
            new CandidateFilterByFingerprinting(this.t),
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

        let t2 = this.t.Event(`WsprSearch::CandidateFilter End`);

        this.stats.processing.filterMs = Math.round(t2 - t1);
    }


    ///////////////////////////////////////////////////////////////////////////
    // Optimizing
    ///////////////////////////////////////////////////////////////////////////

    OptimizeDataStructures()
    {
        // put time key in reverse-time-order

        let keyList = Array.from(this.time__windowData.keys());

        keyList.sort();
        keyList.reverse();

        let time__windowData2 = new Map();

        for (let key of keyList)
        {
            time__windowData2.set(key, this.time__windowData.get(key));
        }

        this.time__windowData = time__windowData2;
    }


    ///////////////////////////////////////////////////////////////////////////
    // Stats Gathering
    ///////////////////////////////////////////////////////////////////////////

    GatherStats()
    {
        let t1 = this.t.Event(`WsprSearch::GatherStats Start`);

        this.GatherQueryStats();
        this.GatherResultsStats();

        let t2 = this.t.Event(`WsprSearch::GatherStats End`);

        // calculate processing stat
        this.stats.processing.statsGatherMs = Math.round(t2 - t1);
    }

    GatherQueryStats()
    {
        // calculate query stats
        let GetUnique = (slot, type) => {
            let count = 0;

            this.ForEachWindowMsgListList(msgListList => {
                for (let msg of msgListList[slot])
                {
                    count += msg.IsType(type) ? 1 : 0;
                }
            });

            return count;
        };

        this.stats.query.slot0Regular.uniqueMsgCount   = GetUnique(0, "regular");
        this.stats.query.slot0Telemetry.uniqueMsgCount = GetUnique(0, "telemetry");
        this.stats.query.slot1Telemetry.uniqueMsgCount = GetUnique(1, "telemetry");
        this.stats.query.slot2Telemetry.uniqueMsgCount = GetUnique(2, "telemetry");
        this.stats.query.slot3Telemetry.uniqueMsgCount = GetUnique(3, "telemetry");
        this.stats.query.slot4Telemetry.uniqueMsgCount = GetUnique(4, "telemetry");
    }

    GatherResultsStats()
    {
        // calculate results stats
        this.stats.results.windowCount = this.time__windowData.size;

        let GetResultsSlotStats = (slot) => {
            let haveAnyMsgsCount = 0;

            let noCandidateCount = 0;
            let oneCandidateCount = 0;
            let multiCandidateCount = 0;

            this.ForEachWindowMsgListList(msgListList => {
                let msgList = msgListList[slot];

                haveAnyMsgsCount += msgList.length ? 1 : 0;

                let msgCandidateList = CandidateOnlyFilter(msgList);

                noCandidateCount    += msgCandidateList.length == 0 ? 1 : 0;
                oneCandidateCount   += msgCandidateList.length == 1 ? 1 : 0;
                multiCandidateCount += msgCandidateList.length >  1 ? 1 : 0;
            });

            // total count with data is the sum of each of these, since only one gets
            // incremented per-window
            let totalCount = noCandidateCount + oneCandidateCount + multiCandidateCount;

            let haveAnyMsgsPct    = Math.round(haveAnyMsgsCount / this.stats.results.windowCount * 100);
            let noCandidatePct    = Math.round(noCandidateCount / totalCount * 100);
            let oneCandidatePct   = Math.round(oneCandidateCount / totalCount * 100);
            let multiCandidatePct = Math.round(multiCandidateCount / totalCount * 100);

            return {
                haveAnyMsgsPct,
                noCandidatePct,
                oneCandidatePct,
                multiCandidatePct,
            };
        };

        this.stats.results.slot0 = GetResultsSlotStats(0);
        this.stats.results.slot1 = GetResultsSlotStats(1);
        this.stats.results.slot2 = GetResultsSlotStats(2);
        this.stats.results.slot3 = GetResultsSlotStats(3);
        this.stats.results.slot4 = GetResultsSlotStats(4);
    }
}



