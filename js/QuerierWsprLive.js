import * as utl from '/js/Utl.js';
import { WSPR } from './WSPR.js';

// https://wspr.live/
// http://wspr.rocks/livequeries/

const QUERY_URL_BASE = 'https://db1.wspr.live/';

export class QuerierWsprLive
{
    constructor()
    {
        this.autoConvertTimeToUtc = true;
    }

    async DoQuery(query)
    {
        // make actual wspr.live query url
        let urlWsprLiveMaker = new URL(QUERY_URL_BASE);
        urlWsprLiveMaker.searchParams.set("query", query);
        let urlWsprLive = urlWsprLiveMaker.href + " FORMAT JSONCompact";

        // make debug url
        let urlQueryTableMaker = new URL(`/pro/query/`, window.location);
        urlQueryTableMaker.searchParams.set("query", query);
        let urlQueryTable = urlQueryTableMaker.href;
        console.log(urlQueryTable);

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

    async DoQueryReturnDataTable(query)
    {
        return (await this.DoQuery(query)).queryReply.data;
    }

    async DoQueryReturnDataTableWithHeader(query)
    {
        let retVal = [];

        let ret = await this.DoQuery(query);

        if (ret.err == "")
        {
            retVal = this.QueryReturnToDataTable(ret);
        }

        return retVal;
    }

    QueryReturnToDataTable(queryReturn)
    {
        let retVal = [];

        if (queryReturn.err == "")
        {
            let meta = queryReturn.queryReply.meta;
            let headerRow = []
            for (const metaData of meta)
            {
                headerRow.push(metaData.name);
            }
            retVal.push(headerRow);
            
            let dataRowList = queryReturn.queryReply.data;
            for (const dataRow of dataRowList)
            {
                retVal.push(dataRow);
            }
        }

        return retVal;
    }

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

    GetPossibleBalloonTelemetryU4BQuery(band, timeStart, timeEnd)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select
    substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toMinute(time) % 10 as min
  , toInt8((frequency - ${freqFloor}) / 40) + 1 as lane
  , if(lane >= 4, lane - 1, if(lane = 3, 0, lane)) as laneLabel
  , count(*) as count
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand}
  and match(tx_sign,'^[01Q].[0-9]') = 1

group by (id1, id3, min, lane, laneLabel)
order by (id1, id3, laneLabel, min)
`;

        return query;
    }

    async GetPossibleBalloonTelemetryU4B(band, timeStart, timeEnd)
    {
        let query = this.GetPossibleBalloonTelemetryU4BQuery(band, timeStart, timeEnd);
        
        return this.DoQueryReturnDataTable(query);
    }

    // lane is the 1-4 value, not 1-5
    GetEncodedTelemetryQuery(band, id1, id3, min, lane, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select distinct on (time)
    time
  , frequency as freq
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toMinute(time) % 10 as min
  , toInt8((freq - ${freqFloor}) / 40) + 1 as lane
  , tx_sign as callsign
  , tx_loc as grid
  , power
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and id1 = '${id1}'
  and id3 = '${id3}'
  and min = ${min}
  and lane = ${lane >= 4 ? lane.toString() + " + 1" : lane}
  and length(callsign) = 6
  and length(grid) = 4

order by (time) asc
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetEncodedTelemetry(band, id1, id3, min, lane, timeStart, timeEnd, limit)
    {
        let query = this.GetEncodedTelemetryQuery(band, id1, id3, min, lane, timeStart, timeEnd, limit);
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }

    GetEncodedTelemetryNoLaneQuery(band, id1, id3, min, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select
    time
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toMinute(time) % 10 as min
  , tx_sign as callsign
  , tx_loc as grid
  , power
  , rx_sign
  , frequency
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and id1 = '${id1}'
  and id3 = '${id3}'
  and min = ${min}
  and length(callsign) = 6
  and length(grid) = 4

/* order by (time, rx_sign) asc */
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetEncodedTelemetryNoLane(band, id1, id3, min, timeStart, timeEnd, limit)
    {
        let query = this.GetEncodedTelemetryNoLaneQuery(band, id1, id3, min, timeStart, timeEnd, limit);
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }

    GetEncodedTelemetryFreqRangeQuery(band, id1, id3, min, freqLow, freqHigh, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select /* distinct on (time, frequency) */
    time
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toMinute(time) % 10 as min
  , tx_sign as callsign
  , tx_loc as grid
  , power
  , rx_sign
  , frequency
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and id1 = '${id1}'
  and id3 = '${id3}'
  and min = ${min}
  and length(callsign) = 6
  and length(grid) = 4
  and frequency >= ${freqLow}
  and frequency <= ${freqHigh}

/* order by (time, rx_sign) asc */
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetEncodedTelemetryFreqRange(band, id1, id3, min, freqLow, freqHigh, timeStart, timeEnd, limit)
    {
        let query = this.GetEncodedTelemetryFreqRangeQuery(band, id1, id3, min, freqLow, freqHigh, timeStart, timeEnd, limit);
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }

    // lane is the 1-4 value, not 1-5
    GetRegularTelemetryQuery(band, callsign, min, lane, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select distinct on (time)
    time
  , toMinute(time) % 10 as min
  , toInt8((frequency - ${freqFloor}) / 40) + 1 as lane
  , tx_sign as callsign
  , substring(tx_loc, 1, 4) as grid
  , tx_loc as gridRaw
  , power
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and min = ${min}
  and lane = ${lane >= 4 ? lane.toString() + " + 1" : lane}
  and callsign = '${callsign}'

order by (time) asc
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetRegularTelemetry(band, callsign, min, lane, timeStart, timeEnd, limit)
    {
        let query = this.GetRegularTelemetryQuery(band, callsign, min, lane, timeStart, timeEnd, limit)
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }

    GetRegularTelemetryNoLaneQuery(band, callsign, min, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select
    time
  , toMinute(time) % 10 as min
  , tx_sign as callsign
  , substring(tx_loc, 1, 4) as grid
  , tx_loc as gridRaw
  , power
  , rx_sign
  , frequency
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and min = ${min}
  and callsign = '${callsign}'

/* order by (time, rx_sign) asc */
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetRegularTelemetryNoLane(band, callsign, min, timeStart, timeEnd, limit)
    {
        let query = this.GetRegularTelemetryNoLaneQuery(band, callsign, min, timeStart, timeEnd, limit)
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }

    GetRegularTelemetryFreqRangeQuery(band, callsign, min, freqLow, freqHigh, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select /* distinct on (time, frequency) */
    time
  , toMinute(time) % 10 as min
  , tx_sign as callsign
  , substring(tx_loc, 1, 4) as grid
  , tx_loc as gridRaw
  , power
  , rx_sign
  , frequency
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and min = ${min}
  and callsign = '${callsign}'
  and frequency >= ${freqLow}
  and frequency <= ${freqHigh}

/* order by (time, rx_sign) asc */
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetRegularTelemetryFreqRange(band, callsign, min, freqLow, freqHigh, timeStart, timeEnd, limit)
    {
        let query = this.GetRegularTelemetryFreqRangeQuery(band, callsign, min, freqLow, freqHigh, timeStart, timeEnd, limit)
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }


    GetRegularTelemetryPlainQuery(band, callsign, timeStart, timeEnd, limit)
    {
        if (this.autoConvertTimeToUtc)
        {
            timeStart = utl.ConvertLocalToUtc(timeStart);
            timeEnd   = utl.ConvertLocalToUtc(timeEnd);
        }

        band = WSPR.GetDefaultBandIfNotValid(band);
        limit = (limit == undefined || limit < 1) ? 0 : limit;

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select distinct on (time)
    time
  , tx_sign as callsign
  , substring(tx_loc, 1, 4) as grid
  , tx_loc as gridRaw
  , power
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and callsign = '${callsign}'

order by (time) asc
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetRegularTelemetryPlain(band, callsign, timeStart, timeEnd, limit)
    {
        let query = this.GetRegularTelemetryPlainQuery(band, callsign, timeStart, timeEnd, limit)
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }


}





