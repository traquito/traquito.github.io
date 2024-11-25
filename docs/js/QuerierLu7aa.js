
const CORS_PROXY_BASE = 'https://corsproxy.io/?';
const QUERY_URL = 'http://lu7aa.org/wsprset.asp';

export class QuerierLu7aa
{
    // attempt to return a table (no header) of:
    // - link
    // - call
    // - band
    // - id
    // - tslot
    // - detail
    // - launch date
    // - ssid
    // - tracker
    // - u4b channel
    // - freq hz
    // - days
    async GetChannelData()
    {
        let url = `${CORS_PROXY_BASE}${QUERY_URL}?ts=${Date.now()}`;

        let retVal = [];
        
        try {
            let response = await fetch(url);

            if (response.ok)
            {
                let reply = await response.text();

                // "parse" the html
                let div = document.createElement("div");
                div.innerHTML = reply;

                let tableList = div.getElementsByTagName("table");

                if (tableList.length >= 1)
                {
                    let table = tableList[0];

                    let trList = table.getElementsByTagName("tr");

                    // skip header and other misc stuff and get the data
                    for (let i = 3; i < trList.length; ++i)
                    {
                        let tr = trList[i];
                        let tdList = tr.getElementsByTagName("td");

                        // only getting u4b channel for now
                        let valList = [];
                        for (let j = 0; j < tdList.length; ++j)
                        {
                            let td = tdList[j];

                            let val = td.innerHTML;

                            if ([1].includes(j))
                            {
                                val = "";
                                let aList = td.getElementsByTagName("a");

                                if (aList.length)
                                {
                                    let a = aList[0];

                                    val = a.href;
                                }

                                valList.push(val);
                            }
                            else if ([2].includes(j))
                            {
                                valList.push(val.toUpperCase().split("-")[0]);
                            }
                            else if ([7].includes(j))
                            {
                                // strip out &nbsp; mayhem
                                // eg "2024&nbsp;&nbsp;08/25&nbsp;&nbsp;11:09:30&nbsp;"
                                //
                                // notably I see he's using 0-padded 2 digit numbers for
                                // both month and day (good)
                                
                                // turn nbsp into spaces
                                let val2 = val.replace(/&nbsp;/g, " ");
                                
                                // turn multiple spaces into one
                                val2 = val2.replace(/ +(?= )/g,'');
                                
                                // get rid of leading/trailing whitespace
                                val2 = val2.trim();

                                // will now look like 2024 08/25 11:09:30"

                                // get into yyyy-mm-dd hh:mm:ss format
                                
                                let partList = val2.split(" ");
                                let dt = `${partList[0]}-${partList[1]} ${partList[2]}`;
                                dt = dt.replace(/\//g, "-");

                                valList.push(dt);
                            }
                            else if ([10].includes(j))
                            {
                                // not all listings have u4b channel
                                if (isNaN(parseInt(val.trim())) == false)
                                {
                                    valList.push(String(parseInt(val.trim())));
                                }
                                else
                                {
                                    valList.push("");
                                }
                            }
                            else
                            {
                                valList.push(val);
                            }
                        }

                        retVal.push(valList);
                    }
                }
                else
                {
                    console.log(`ERR: Found ${tableList.length} table elements, quitting`);
                }
            }
        } catch (e) {
            console.log("ERR: Query: " + e);
        }

        return retVal;
    }
}





