import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { TabularData } from '../../../../js/TabularData.js';


class ColumnBuilderRegularType1
{
    GetType()
    {
        return "RegularType1";
    }

    Match(msg)
    {
        return msg.IsRegular();
    }

    GetColNameList()
    {
        return [
            "RegCallsign",
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
    GetType()
    {
        return "BasicTelemetry";
    }

    Match(msg)
    {
        return msg.IsTelemetryBasic();
    }

    GetColNameList()
    {
        return [
            "EncCallsign",
            "EncGrid",
            "EncPower",

            "GpsIsValid",
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

    BuildDataTable(wsprSearch)
    {
        // find the set of column builders that apply to this dataset
        let cbSetNotSeen = new Set([
            new ColumnBuilderRegularType1(),
            new ColumnBuilderTelemetryBasic(),
        ])

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

        // add metadata
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

        // this.DebugTable(td.GetDataTable());

        return td;
    }
}

