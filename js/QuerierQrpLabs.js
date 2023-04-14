
// https://www.qrp-labs.com/track/tracking.html

const CORS_PROXY_BASE = 'https://corsproxy.io/?';
const QUERY_URL_BASE = 'https://www.qrp-labs.com/track/';
const QUERY_URL_PAGE = 'tracking.html';

export class QuerierQrpLabs
{
    // attempt to return a table (no header) of:
    // - flight name
    // - flight track url
    // - callsign
    // - channel
    // - last heard
    // - altitude
    async GetChannelData()
    {
        let url = CORS_PROXY_BASE + QUERY_URL_BASE + QUERY_URL_PAGE;

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

                if (tableList.length == 1)
                {
                    let table = tableList[0];

                    let trList = table.getElementsByTagName("tr");

                    for (let i = 1; i < trList.length; ++i)
                    {
                        let tr = trList[i];
                        let tdList = tr.getElementsByTagName("td");

                        let valList = [];

                        for (let j = 0; j < tdList.length; ++j)
                        {
                            let td = tdList[j];

                            if (j == 0)
                            {
                                // turn the first column into two
                                // - name
                                // - link
                                let name = td.textContent;
                                let link = QUERY_URL_BASE + td.childNodes[0].getAttribute("href");
                                
                                valList.push(name);
                                valList.push(link);
                            }
                            else
                            {
                                let val = td.innerHTML;
                                
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





