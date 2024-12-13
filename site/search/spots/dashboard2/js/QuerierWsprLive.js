import * as utl from '/js/Utl.js';

import { Base } from './Base.js';
import { WSPR } from '/js/WSPR.js';


const QUERY_URL_BASE = 'https://db1.wspr.live/';

export class QuerierWsprLive
extends Base
{
    constructor()
    {
        super();

        // database is in UTC, enabling this allows queriers to use the
        // time of day that makes sense to them, but search will be
        // performed in converted UTC
        this.autoConvertTimeToUtc = true;
    }

    async SearchRegularType1(band, callsign, timeStart, timeEnd, limit)
    {
        let query = this.GetSearchRegularType1Query(band, callsign, timeStart, timeEnd, limit)
        
        return this.DoQuery(query);
    }

    async SearchTelemetry(band, id1, id3, min, timeStart, timeEnd, limit)
    {
        let query = this.GetSearchTelemetryQuery(band, id1, id3, min, timeStart, timeEnd, limit);

        return this.DoQuery(query);
    }




// private:

    GetDbEnumValForBand(band)
    {
        band = WSPR.GetDefaultBandIfNotValid(band);

        let band__dbBand = new Map();

        band__dbBand.set("2190m",   -1);
        band__dbBand.set("630m",     0);
        band__dbBand.set("160m",     1);
        band__dbBand.set("80m",      3);
        band__dbBand.set("60m",      5);
        band__dbBand.set("40m",      7);
        band__dbBand.set("30m",     10);
        band__dbBand.set("20m",     14);
        band__dbBand.set("17m",     18);
        band__dbBand.set("15m",     21);
        band__dbBand.set("12m",     24);
        band__dbBand.set("10m",     28);
        band__dbBand.set("6m",      50);
        band__dbBand.set("4m",      70);
        band__dbBand.set("2m",     144);
        band__dbBand.set("70cm",   432);
        band__dbBand.set("23cm",  1296);

        let retVal = band__dbBand.get(band);

        return retVal;
    }

    async DoQueryRaw(query)
    {
        // make actual wspr.live query url
        let urlWsprLiveMaker = new URL(QUERY_URL_BASE);
        urlWsprLiveMaker.searchParams.set("query", query);
        let urlWsprLive = urlWsprLiveMaker.href + " FORMAT JSONCompact";

        // make debug url
        let urlQueryTableMaker = new URL(`/pro/query/`, window.location);
        urlQueryTableMaker.searchParams.set("query", query);
        let urlQueryTable = urlQueryTableMaker.href;

        this.Info(urlQueryTable);

        let retVal = {
            "queryRequest": {
                "query": query,
                "queryUrl": urlWsprLive,
            },
            "queryReply" : {},
            "err": "",
        };
        
        try {
            let response = await fetch(urlWsprLive);

            if (response.ok)
            {
                let queryReply = await response.json();

                retVal.queryReply = queryReply;
            }
            else
            {
                retVal.err = await response.text();
            }
        } catch (e) {
            console.log("ERR: Query: " + e);
        }

        return retVal;
    }

    async DoQuery(query)
    {
        let queryResultObj = await this.DoQueryRaw(query);

        let resultList = [];

        // check for errors
        if (queryResultObj.err == "")
        {
            // convert result to convenient object format

            // array of objects, eg:
            // [
            //     {
            //         name: "xxx",
            //         type: "Float64", // or whatever
            //     },
            //     {
            //         name: "yyy",
            //         type: "Float64", // or whatever
            //     }
            // ]
            //
            // These are the column headers of the data returned in a separate array
            let fieldMetaList = queryResultObj.queryReply.meta;

            // list of lists
            // 0 or more rows, each row containing the number of fields specified in metadata, eg
            // [
            //     [xxxVal, yyyVal],
            //     [xxxVal, yyyVal],
            // ]
            let dataRowList = queryResultObj.queryReply.data;

            // create a set of objects, each representing one row of results, eg:
            // [ 
            //     {
            //         xxx: xxxVal,
            //         yyy: yyyVal,
            //     },
            //     {
            //         xxx: xxxVal,
            //         yyy: yyyVal,
            //     },
            // ]
            for (let dataRow of dataRowList)
            {
                let result = {};

                for (let i = 0; i < fieldMetaList.length; ++i)
                {
                    result[fieldMetaList[i].name] = dataRow[i];
                }

                resultList.push(result);
            }
        }

        return resultList;
    }

    GetSearchRegularType1Query(band, min, callsign, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            if (timeEnd != "")
            {
                timeEnd = utl.ConvertLocalToUtc(timeEnd);
            }
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let timeCriteria = `time between '${timeStart}' and '${timeEnd}'`;
        if (timeEnd == "")
        {
            timeCriteria = `time >= '${timeStart}'`;
        }

        let query = `
select
    time
  , toMinute(time) % 10 as min
  , tx_sign as callsign
  , substring(tx_loc, 1, 4) as grid4
  , tx_loc as gridRaw
  , power as powerDbm
  , rx_sign as rxCallsign
  , rx_loc as rxGrid
  , frequency
from wspr.rx

where
      ${timeCriteria}
  and band = ${dbBand} /* ${band} */
  and min = ${min}
  and callsign = '${callsign}'

${this.debug ? ("order by (time, rxCallsign) asc") : "/* order by (time, rxCallsign) asc */"}
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }



    GetSearchTelemetryQuery(band, min, id1, id3, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);

            if (timeEnd != "")
            {
                timeEnd = utl.ConvertLocalToUtc(timeEnd);
            }
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let timeCriteria = `time between '${timeStart}' and '${timeEnd}'`;
        if (timeEnd == "")
        {
            timeCriteria = `time >= '${timeStart}'`;
        }

        let query = `
select
    time
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toMinute(time) % 10 as min
  , tx_sign as callsign
  , tx_loc as grid4
  , power as powerDbm
  , rx_sign as rxCallsign
  , rx_loc as rxGrid
  , frequency
from wspr.rx

where
      ${timeCriteria}
  and band = ${dbBand} /* ${band} */
  and id1 = '${id1}'
  and id3 = '${id3}'
  and min = ${min}
  and length(callsign) = 6
  and length(grid4) = 4

${this.debug ? ("order by (time, rxCallsign) asc") : "/* order by (time, rxCallsign) asc */"}
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }













}


