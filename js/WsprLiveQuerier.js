
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

    async GetPossibleBalloonTelemetryU4B()
    {



        let query = `
select
    round(avg(frequency)) as freqAvg
  , substring(tx_sign, 1, 1) as id1
  , substring(tx_sign, 3, 1) as id3
  , round((freqAvg - 14097000) / 40)+1 as freqBand
  , toMinute(time) % 10 as min
from wspr.rx

where
      time >= '2023-04-01'
  and band = 14
  and match(tx_sign,'^[01Q].[0-9]') = 1

group by (id1, id3, min)
order by (id1, id3, freqBand, min)
`;

        return this.DoQueryReturnDataTable(query);
    }


    async GetBalloonDataThisMonth()
    {
        let query = `
select
      tx_sign
    , time
    , frequency

from wspr.rx

where
        time >= '2023-04-01'
    and band = 14
    and match(tx_sign,'^[01Q].[0-9]') = 1

order by time
`;

        return this.DoQuery(query);
    }


}





