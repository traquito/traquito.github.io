import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { TabularData } from '../../../../js/TabularData.js';


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

    GetDataTable(wsprSearch)
    {
        let msgRegSeen      = false;
        let msgTelBasicSeen = false;

        // first pass, examine data from each window to determine the superset
        // of all columns that will be required to be populated.
        wsprSearch.ForEachWindow((time, slotMsgList) => {
            // search across every slot
            for (const msg of slotMsgList)
            {
                if (msg)
                {
                    if      (msg.IsRegular())        { msgRegSeen      = true; }
                    else if (msg.IsTelemetryBasic()) { msgTelBasicSeen = true; }
                }
            }
        });

        // build list of headers needed for the table
        let colHeaderList = [
            "DateTimeUtc",
            "DateTimeLocal",
        ];

        if (msgRegSeen)
        {
            colHeaderList.push(...[
                "RegCall",
                "RegGrid",
                "RegPower",
            ]);
        }

        if (msgTelBasicSeen)
        {
            colHeaderList.push(...[
                "EncCall",
                "EncGrid",
                "EncPower",
            ]);
        }

        let td = new TabularData([colHeaderList]);
        

        wsprSearch.ForEachWindow((time, slotMsgList) => {
            let row = td.AddRow();

            // fill out time columns
            td.Set(row, "DateTimeUtc", time);
            td.Set(row, "DateTimeLocal", utl.ConvertUtcToLocal(time));


            // slot0
            let msgSlot0 = slotMsgList[0];
            
            // maybe fill out reg
            if (msgRegSeen && msgSlot0)
            {
                td.Set(row, "RegCall",  msgSlot0.fields.callsign);
                td.Set(row, "RegGrid",  msgSlot0.fields.grid4);
                td.Set(row, "RegPower", msgSlot0.fields.powerDbm);
            }

            // slot 1
            let msgSlot1 = slotMsgList[1];

            // maybe fill out basic telemetry
            if (msgTelBasicSeen && msgSlot1 && msgSlot1.IsTelemetryBasic())
            {
                td.Set(row, "EncCall",  msgSlot1.fields.callsign);
                td.Set(row, "EncGrid",  msgSlot1.fields.grid4);
                td.Set(row, "EncPower", msgSlot1.fields.powerDbm);
            }
        });

        console.table(td.GetDataTable());

        return td;
    }
}

