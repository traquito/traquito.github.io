
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

    GetPossibleBalloonTelemetryU4BQuery(band)
    {
        band = parseInt(band);

        let band__dialFreq = new Map();
        band__dialFreq.set(160,  1836600);
        band__dialFreq.set(80,   3592600);
        band__dialFreq.set(60,   5287200);
        band__dialFreq.set(40,   7038600);
        // band__dialFreq.set(32,  10138700);
        band__dialFreq.set(20,  14095600);
        band__dialFreq.set(17,  18104600);
        band__dialFreq.set(15,  21094600);
        band__dialFreq.set(12,  24924600);
        band__dialFreq.set(10,  28124600);
        band__dialFreq.set(6,   50293000);
        band__dialFreq.set(2,  144488500);

        let band__dbBand = new Map();
        band__dbBand.set(160,  1);
        band__dbBand.set(80,   3);
        band__dbBand.set(60,   5);
        band__dbBand.set(40,   7);
        // band__dbBand.set(32,  10138700);
        band__dbBand.set(20,  14);
        band__dbBand.set(17,  18);
        band__dbBand.set(15,  21);
        band__dbBand.set(12,  24);
        band__dbBand.set(10,  28);
        band__dbBand.set(6,   50);
        band__dbBand.set(2,  70);

        if (band__dialFreq.has(band) == false)
        {
            band = 20;
        }

        let dialFreq = band__dialFreq.get(band);
        let freqFloor = (dialFreq + 1500 - 100);

        let dbBand = band__dbBand.get(band);

        let query = `
select
    round(avg(frequency)) as freqAvg
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , toInt8((freqAvg - ${freqFloor}) / 40) + 1 as freqBand
  , toMinute(time) % 10 as min
  , count(*) as count
from wspr.rx

where
      time >= '2023-04-01'
  and band = ${dbBand}
  and match(tx_sign,'^[01Q].[0-9]') = 1

group by (id1, id3, min)
order by (id1, id3, freqBand, min)
`;

        return query;
    }

    async GetPossibleBalloonTelemetryU4B(band)
    {
        let query = this.GetPossibleBalloonTelemetryU4BQuery(band);
        
        return this.DoQueryReturnDataTable(query);
    }
}





