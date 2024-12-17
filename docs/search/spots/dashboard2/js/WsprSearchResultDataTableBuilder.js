import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { TabularData } from '../../../../js/TabularData.js';

import { WSPREncoded } from '/js/WSPREncoded.js';
import { GreatCircle } from '/js/GreatCircle.js';


class ColumnBuilderRegularType1
{
    Match(msg)
    {
        return msg.IsRegular();
    }

    GetColNameList()
    {
        return [
            "RegCall",
            "RegGrid",
            "RegPower",
        ];
    }

    GetColMetaDataList()
    {
        return [
            {}, // callsign
            {}, // grid4
            {}, // powerDbm
        ];
    }

    GetValList(msg)
    {
        return [
            msg.fields.callsign,
            msg.fields.grid4,
            msg.fields.powerDbm,
        ];
    }
}

class ColumnBuilderTelemetryBasic
{
    Match(msg)
    {
        return msg.IsTelemetryBasic();
    }

    GetColNameList()
    {
        return [
            "EncCall",
            "EncGrid",
            "EncPower",

            "GpsValid",
            "Grid56",
            "Knots",
            
            "AltM",
            "TempC",
            "KPH",
            
            "AltFt",
            "TempF",
            "MPH",

            "Voltage",
        ];
    }

    GetColMetaDataList()
    {
        return [
            {}, // callsign
            {}, // grid4
            {}, // powerDbm

            {}, // gpsIsValid
            {}, // grid56
            { rangeMin: 0, rangeMax: 82, }, // speedKnots

            { rangeMin:   0, rangeMax: 21340,                    }, // altM
            { rangeMin: -50, rangeMax:    39,                    }, // tempC
            { rangeMin:   0, rangeMax: utl.KnotsToKph_Round(82), }, // kph
            
            { rangeMin: 0,                   rangeMax: utl.MtoFt_Round(21340),   }, // altFt
            { rangeMin: utl.CtoF_Round(-50), rangeMax: utl.CtoF_Round(39),       }, // tempF
            { rangeMin: 0,                   rangeMax: utl.KnotsToMph_Round(82), }, // mph

            { rangeMin: 3, rangeMax: 4.95, }, // voltage
        ];
    }

    GetValList(msg)
    {
        let kph = utl.KnotsToKph_Round(msg.decodeDetails.basic.speedKnots);

        let altFt = utl.MtoFt_Round(msg.decodeDetails.basic.altitudeMeters);
        let tempF = utl.CtoF_Round(msg.decodeDetails.basic.temperatureCelsius);
        let mph   = utl.KnotsToMph_Round(msg.decodeDetails.basic.speedKnots);

        return [
            msg.fields.callsign,
            msg.fields.grid4,
            msg.fields.powerDbm,

            msg.decodeDetails.basic.gpsIsValid,
            msg.decodeDetails.basic.grid56,
            msg.decodeDetails.basic.speedKnots,

            msg.decodeDetails.basic.altitudeMeters,
            msg.decodeDetails.basic.temperatureCelsius,
            kph,

            altFt,
            tempF,
            mph,

            msg.decodeDetails.basic.voltageVolts,
        ];
    }
}

class ColumnBuilderTelemetryExtendedUserDefined
{
    constructor(slot, codecMaker)
    {
        this.slot = slot;
        this.codec = codecMaker.GetCodecInstance();

        // precompile header list
        this.colNameList = [];
        this.colNameList.push(`slot${this.slot}.EncMsg`)

        for (let field of this.codec.GetFieldList())
        {
            let colName = `slot${this.slot}.${field.name}${field.unit}`;

            this.colNameList.push(colName);
        }
    }

    Match(msg)
    {
        let retVal = msg.IsExtendedTelemetryUserDefined() &&
                     msg.GetCodec().GetHdrSlotEnum() == this.slot;

        return retVal;
    }

    GetColNameList()
    {
        return this.colNameList;
    }

    GetColMetaDataList()
    {
        let metaDataList = [];

        metaDataList.push({});

        for (let field of this.codec.GetFieldList())
        {
            let metaData = {
                rangeMin: this.codec[`Get${field.name}${field.unit}LowValue`](),
                rangeMax: this.codec[`Get${field.name}${field.unit}HighValue`](),
            };

            metaDataList.push(metaData);
        }

        return metaDataList;
    }

    GetValList(msg)
    {
        let codec = msg.GetCodec();

        let valList = [];

        valList.push(`${msg.fields.callsign} ${msg.fields.grid4} ${msg.fields.powerDbm}`)

        for (let field of codec.GetFieldList())
        {
            let val = codec[`Get${field.name}${field.unit}`]();

            valList.push(val);
        }

        return valList;
    }
}


// Adapter to the WsprSearch results.
// Extracts data from the results where unambiguous.
// Enriches with maximum value add
//   Including decoding, unit converting, etc
// 
export class WsprSearchResultDataTableBuilder
extends Base
{
    constructor()
    {
        super();
    }

    SetDebug(tf)
    {
        super.SetDebug(tf);

        this.t.SetCcGlobal(tf);
    }

    BuildDataTable(wsprSearch)
    {
        this.t.Reset();
        this.t.Event(`WsprSearchResultDataTableBuilder::BuildTable Start`);

        let codecMakerList = wsprSearch.GetCodecMakerList();

        // find the set of column builders that apply to this dataset
        let cbSetNotSeen = new Set([
            new ColumnBuilderRegularType1(),
            new ColumnBuilderTelemetryBasic(),
        ]);

        for (let slot = 0; slot < 5; ++slot)
        {
            cbSetNotSeen.add(new ColumnBuilderTelemetryExtendedUserDefined(slot, codecMakerList[slot]));
        }

        let cbSetSeen = new Set()

        wsprSearch.ForEachWindow((time, slotMsgList) => {
            let retVal = true;

            // search across every slot
            for (const msg of slotMsgList)
            {
                if (msg)
                {
                    for (const cb of cbSetNotSeen)
                    {
                        if (cb.Match(msg))
                        {
                            cbSetSeen.add(cb);
                            cbSetNotSeen.delete(cb);
                        }
                    }
                }

                // no need to keep looking if every supported builder is known already
                if (cbSetNotSeen.size == 0)
                {
                    retVal = false;

                    break;
                }
            }

            return retVal;
        });


        // build data table
        let colNameList = [];
        colNameList.push(... [
            "DateTimeUtc",
            "DateTimeLocal",
        ]);

        for (const cb of cbSetSeen)
        {
            colNameList.push(... cb.GetColNameList());
        }

        let td = new TabularData([colNameList]);

        // populate data table
        wsprSearch.ForEachWindow((time, slotMsgList) => {
            let row = td.AddRow();

            // fill out time columns
            td.Set(row, "DateTimeUtc", time);
            td.Set(row, "DateTimeLocal", utl.ConvertUtcToLocal(time));

            // only let a column builder run once per window
            let cbSetUse = new Set(cbSetSeen);

            for (const msg of slotMsgList)
            {
                if (msg)
                {
                    for (const cb of cbSetUse)
                    {
                        if (cb.Match(msg))
                        {
                            let colNameList = cb.GetColNameList();
                            let valList     = cb.GetValList(msg)
    
                            for (let i = 0; i < colNameList.length; ++i)
                            {
                                td.Set(row, colNameList[i], valList[i]);
                            }
    
                            // only let a column builder run once per window
                            cbSetUse.delete(cb);
    
                            break;
                        }
                    }
    
                    // if all column builders have run, nothing left to do for this window
                    if (cbSetUse.size == 0)
                    {
                        break;
                    }
                }
            }
        });

        // add column metadata
        for (const cb of cbSetSeen)
        {
            // these must be the same length
            let colNameList  = cb.GetColNameList();
            let metaDataList = cb.GetColMetaDataList();

            for (let i = 0; i < colNameList.length; ++i)
            {
                let colName     = colNameList[i];
                let colMetaData = metaDataList[i];

                td.SetColMetaData(colName, colMetaData);
            }
        }

        // add row metadata
        let idx = 0;
        wsprSearch.ForEachWindow((time, slotMsgList) => {
            td.SetRowMetaData(idx, {
                time,
                slotMsgList,
            });
            ++idx;
        });


        this.SynthesizeData(td);

        this.t.Event(`WsprSearchResultDataTableBuilder::BuildTable End`);

        return td;
    }

    SynthesizeData(td)
    {
        this.ShortenTime(td);
        this.SynthesizeGrid(td);
        this.SynthesizeDistance(td);
        this.SynthesizeSpeedGPS(td);
    }

    ShortenTime(td)
    {
        td.GenerateModifiedColumn([
            "DateTimeUtc"
        ], row => {
            let retVal = [
                td.Get(row, "DateTimeUtc").substr(0, 16),
            ];

            return retVal;
        });

        td.GenerateModifiedColumn([
            "DateTimeLocal"
        ], row => {
            let retVal = [
                td.Get(row, "DateTimeLocal").substr(0, 16),
            ];

            return retVal;
        });
    }

    SynthesizeGrid(td)
    {
        // columns needed, make no changes if not available
        let idxGpsValid = td.Idx("GpsValid");
        let idxRegGrid = td.Idx("RegGrid");
        let idxGrid56 = td.Idx("Grid56");

        if (idxGpsValid == undefined ||
            idxRegGrid == undefined  ||
            idxGrid56 == undefined)
        {
            return;
        }

        // synthesize grid
        td.AppendGeneratedColumns([
            "Grid"
        ], row => {
            let retVal = [null];

            let gpsValid = td.Get(row, "GpsValid");

            if (gpsValid)
            {
                let grid4 = td.Get(row, "RegGrid");
                let grid56 = td.Get(row, "Grid56");
    
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
                grid = td.Get(i, "Grid");

                if (grid != null)
                {
                    break;
                }
            }

            return grid;
        };

        // fill in the gaps, oldest to newest
        let idx = td.Length() - 1;
        let gridPrior = null;
        td.GenerateModifiedColumn([
            "Grid"
        ], row => {
            let gridThis = td.Get(row, "Grid");
            let regGrid = td.Get(row, "RegGrid")
            
            let retVal = [gridThis];
            
            // if we have an empty cell, check if promoting grid4 makes sense
            if (gridThis == null && regGrid != null)
            {
                let grid4    = regGrid.substr(0, 4);
                let gridNext = GetNextGrid(td, idx);

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
                if (gridThis)
                {
                    gridPrior = gridThis.substr(0, 4);
                }
                else
                {
                    gridPrior = gridThis;
                }
            }

            --idx;

            return retVal;
        }, true);

        // check the end
        if (td.Length())
        {
            let gridLatest = td.Get(0, "Grid");
            if (gridLatest == null)
            {
                let grid4 = td.Get(0, "RegGrid");
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

                        let spotTimeMs = utl.ParseTimeToMs(td.Get(0, "DateTimeLocal"));
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
                    td.Set(0, "Grid", grid4);
                }
            }
        }
    }

    SynthesizeDistance(td)
    {
        if (td.Idx("Grid") == undefined) { return; }

        // synthesize distance traveled
        let gridLast = null;
        td.AppendGeneratedColumns([
            "DistKm", "DistMi"
        ], row => {
            let retVal = [null, null];

            let grid = td.Get(row, "Grid");

            if (grid != null)
            {
                if (gridLast != null)
                {
                    let [lat1, lng1] = WSPREncoded.DecodeMaidenheadToDeg(gridLast);
                    let [lat2, lng2] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let km = GreatCircle.distance(lat1, lng1, lat2, lng2, "KM");
                    let mi = GreatCircle.distance(lat1, lng1, lat2, lng2, "MI");

                    retVal = [Math.round(km), Math.round(mi)];
                }

                gridLast = grid;
            }
    
            return retVal;
        }, true);
    }

    SynthesizeSpeedGPS(td)
    {
        if (td.Idx("Grid") == undefined) { return; }

        // synthesize speed derived from GPS distance traveled
        let rowLast = null;
        td.AppendGeneratedColumns([
            "GpsKPH", "GpsMPH"
        ], row => {
            let retVal = [null, null];

            let grid = td.Get(row, "Grid");

            if (grid != null && grid.length == 6)
            {
                if (rowLast != null)
                {
                    let gridLast = td.Get(rowLast, "Grid");

                    let [lat1, lng1] = WSPREncoded.DecodeMaidenheadToDeg(gridLast);
                    let [lat2, lng2] = WSPREncoded.DecodeMaidenheadToDeg(grid);

                    let km = GreatCircle.distance(lat1, lng1, lat2, lng2, "KM");

                    let msNow  = utl.ParseTimeToMs(td.Get(row, "DateTimeLocal"));
                    let msLast = utl.ParseTimeToMs(td.Get(rowLast, "DateTimeLocal"));

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
            let mphThis = td.Get(row, col);
            let mph = null;

            if (mphThis != null)
            {
                let mphList = [mphThis];

                let mphPrev = td.Get(idx - 1, col);
                let mphPrevOk = false;
                if (mphPrev != undefined && mphPrev != null && isNaN(mphPrev) == false)
                {
                    mphList.push(mphPrev);
                    mphPrevOk = true;
                }

                let mphNext = td.Get(idx + 1, col);
                let mphNextOk = false;
                if (mphNext != undefined && mphNext != null && isNaN(mphNext) == false)
                {
                    mphList.push(mphNext);
                    mphNextOk = true;
                }

                if (mphPrevOk)
                {
                    let mphPrevPrev = td.Get(idx - 2, col);
                    if (mphPrevPrev != undefined && mphPrevPrev != null && isNaN(mphPrevPrev) == false)
                    {
                        mphList.push(mphPrevPrev);
                    }
                }

                if (mphNextOk)
                {
                    let mphNextNext = td.Get(idx + 2, col);
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

        td.GenerateModifiedColumn([
            "GpsMPH"
        ], (row, idx) => FnAverage(row, idx, "GpsMPH"), true);

        td.GenerateModifiedColumn([
            "GpsKPH"
        ], (row, idx) => FnAverage(row, idx, "GpsKPH"), true);
    }
}

