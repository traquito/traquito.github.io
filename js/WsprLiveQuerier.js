
// https://wspr.live/
// http://wspr.rocks/livequeries/

const QUERY_URL_BASE = 'https://db1.wspr.live/?query=';

export class WsprLiveQuerier
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

    GetPossibleBalloonTelemetryU4BQuery(band, timeStart, timeEnd)
    {
        let band__dialFreq = new Map();
        band__dialFreq.set("2190m",      136000);
        band__dialFreq.set("630m",       474200);
        band__dialFreq.set("160m",      1836600);
        band__dialFreq.set("80m",       3568600);
        band__dialFreq.set("60m",       5287200);
        band__dialFreq.set("40m",       7038600);
        band__dialFreq.set("30m",      10138700);
        band__dialFreq.set("20m",      14095600);
        band__dialFreq.set("17m",      18104600);
        band__dialFreq.set("15m",      21094600);
        band__dialFreq.set("12m",      24924600);
        band__dialFreq.set("10m",      28124600);
        band__dialFreq.set("6m",       50293000);
        band__dialFreq.set("4m",       70091000);
        band__dialFreq.set("2m",      144489000);
        band__dialFreq.set("70cm",    432300000);
        band__dialFreq.set("23cm",   1296500000);

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

        if (band__dialFreq.has(band) == false)
        {
            band = "20m";
        }

        let dialFreq = band__dialFreq.get(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = band__dbBand.get(band);

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
}





