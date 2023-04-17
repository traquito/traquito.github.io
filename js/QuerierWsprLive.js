import { WSPR } from './WSPR.js';

// https://wspr.live/
// http://wspr.rocks/livequeries/

const QUERY_URL_BASE = 'https://db1.wspr.live/?query=';

export class QuerierWsprLive
{
    constructor()
    {
    }

    async DoQuery(query)
    {
        let url = QUERY_URL_BASE + encodeURIComponent(query) + " FORMAT JSONCompact";

        let retVal = {
            "queryRequest": {
                "query": query,
                "queryUrl": url,
            },
            "queryReply" : {},
            "err": "",
        };
        
        try {
            let response = await fetch(url);

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
        band = WSPR.GetDefaultBandIfNotValid(band);

        let dialFreq = WSPR.GetDialFreqFromBandStr(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = this.GetDbEnumValForBand(band);

        let query = `
select
    round(avg(frequency)) as freqAvg
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toMinute(time) % 10 as min
  , toInt8((freqAvg - ${freqFloor}) / 40) + 1 as lane
  , count(*) as count
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand}
  and match(tx_sign,'^[01Q].[0-9]') = 1

group by (id1, id3, min)
order by (id1, id3, lane, min)
`;

        return query;
    }

    async GetPossibleBalloonTelemetryU4B(band, timeStart, timeEnd)
    {
        let query = this.GetPossibleBalloonTelemetryU4BQuery(band, timeStart, timeEnd);
        
        return this.DoQueryReturnDataTable(query);
    }

    GetEncodedTelemetryQuery(band, id1, id3, min, lane, timeStart, timeEnd, limit)
    {
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
  and lane = ${lane}
  and length(callsign) = 6
  and length(grid) = 4

order by (time) desc
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetEncodedTelemetry(band, id1, id3, min, lane, timeStart, timeEnd, limit)
    {
        let query = this.GetEncodedTelemetryQuery(band, id1, id3, min, lane, timeStart, timeEnd, limit);
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }


    GetRegularTelemetryQuery(band, callsign, min, lane, timeStart, timeEnd, limit)
    {
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
  , tx_loc as grid
  , power
from wspr.rx

where
      time between '${timeStart}' and '${timeEnd}'
  and band = ${dbBand} /* ${band} */
  and min = ${min}
  and lane = ${lane}
  and callsign = '${callsign}'

order by (time) desc
${limit ? ("limit " + limit) : ""}

`;

        return query;
    }

    async GetRegularTelemetry(band, callsign, min, lane, timeStart, timeEnd, limit)
    {
        let query = this.GetRegularTelemetryQuery(band, callsign, min, lane, timeStart, timeEnd, limit)
        
        return this.DoQueryReturnDataTableWithHeader(query);
    }


}





