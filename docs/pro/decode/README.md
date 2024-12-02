---
icon: material/air-filter

hide:
  - toc
---

# Decode/Encode Basic Telemetry

<html>
    <head>
</script>

        <script src="/js/sorttable.js"></script>
        <script type='module'>
import * as utl from '/js/Utl.js';
import { WSPREncoded } from '/js/WSPREncoded.js';


export class App
{
    constructor()
    {
        this.domEncode = document.getElementById("encode");
        this.domDoEncode = document.getElementById("doEncode");
        this.domResultEncode = document.getElementById("resultEncode");

        this.domDecode = document.getElementById("decode");
        this.domDoDecode = document.getElementById("doDecode");
        this.domResultDecode = document.getElementById("resultDecode");
        

        // override the query default if one exists in the url
        this.OnUrlChange();

        window.addEventListener("popstate", (event) => {
            this.OnUrlChange();
        });

        this.domDoDecode.onclick = e => {
            this.DoQuery();
        };

        this.domDoEncode.onclick = this.domDoDecode.onclick;
    }

    OnUrlChange()
    {
        utl.SetDomValBySearchParam(this.domEncode, "encode", this.domEncode.value.toUpperCase());
        utl.SetDomValBySearchParam(this.domDecode, "decode", this.domDecode.value.toUpperCase());

        this.DoQuery();
    }
    
    DoQuery()
    {
        WSPREncoded.EnableDebug();

        // update the url with the query so it can be bookmarked or just refereshed
        let encode = this.domEncode.value.toUpperCase();
        let decode = this.domDecode.value.toUpperCase();
        
        let encodeEncoded = encodeURIComponent(encode);
        let decodeEncoded = encodeURIComponent(decode);
        let newWindowUrl = `${location.pathname}?decode=${decodeEncoded}&encode=${encodeEncoded}`;
        history.pushState({}, "", newWindowUrl);

        this.DoQueryEncode(encode);
        this.DoQueryDecode(decode);
    }

    DoQueryEncode(query)
    {
        // process and output
        this.domResultEncode.innerHTML = "";

        let lineList = query.split("\n");
        for (let line of lineList)
        {
            let linePartList = line.trim().split(/\s+/);
            
            if (linePartList.length == 7)
            {
                let id13       = linePartList[0];
                let gridIn     = linePartList[1];
                let altM       = linePartList[2];
                let tempC      = linePartList[3];
                let voltage    = linePartList[4];
                let speedKnots = linePartList[5];
                let gpsValid   = linePartList[6];

                let id1   = id13.substring(0, 1);
                let id3   = id13.substring(1);
                let grid5 = gridIn.substring(4, 5);
                let grid6 = gridIn.substring(5);

                let gridIn56 = grid5 + grid6;
                
                console.log(`${gridIn}, ${gridIn56}, ${altM}`);

                this.domResultEncode.innerHTML += `===============================\n`;
                this.domResultEncode.innerHTML += `${id13} ${gridIn} ${altM} ${tempC} ${voltage} ${speedKnots} ${gpsValid}` + `\n`;
                this.domResultEncode.innerHTML += `===============================\n`;

                let call = WSPREncoded.EncodeU4BCall(id1, id3, gridIn56, altM);
                let [grid, power] = WSPREncoded.EncodeU4BGridPower(tempC, voltage, speedKnots, gpsValid);

                this.domResultEncode.innerHTML += `${call} ${grid} ${power}` + `\n`;
                this.domResultEncode.innerHTML += `call : ${call}`  + `\n`;
                this.domResultEncode.innerHTML += `grid : ${grid}`  + `\n`;
                this.domResultEncode.innerHTML += `power: ${power}` + `\n`;
                this.domResultEncode.innerHTML += `\n`;
            }
            else
            {
                if (linePartList[0] != "")
                {
                    this.domResultEncode.innerHTML += `==========================\n`;
                    this.domResultEncode.innerHTML += `Skipping invalid line "${line}"\n`;
                    this.domResultEncode.innerHTML += `==========================\n`;
                    this.domResultEncode.innerHTML += `\n`;
                }
            }
        }
    }

    DoQueryDecode(query)
    {
        // process and output
        this.domResultDecode.innerHTML = "";

        let lineList = query.split("\n");
        for (let line of lineList)
        {
            let linePartList = line.trim().split(/\s+/);
            
            if (linePartList.length == 3)
            {
                let call  = linePartList[0];
                let grid  = linePartList[1];
                let power = linePartList[2];
                
                console.log(`${call}, ${grid}, ${power}`);

                this.domResultDecode.innerHTML += `==========================\n`;
                this.domResultDecode.innerHTML += `${call} ${grid} ${power}` + `\n`;
                this.domResultDecode.innerHTML += `==========================\n`;

                let ret = WSPREncoded.DecodeU4BGridPower(grid, power);
                
                if (ret.msgType == "standard")
                {
                    let [grid56, altM] = WSPREncoded.DecodeU4BCall(call);
                    let [tempC, voltage, speedKnots, gpsValid] = ret.data;

                    let id1 = call.substring(0, 1);
                    let id3 = call.substring(2, 3);
                    
                    this.domResultDecode.innerHTML += `${id1}${id3} ....${grid56} ${altM} ${tempC} ${voltage} ${speedKnots} ${gpsValid}`   + `\n`;
                    this.domResultDecode.innerHTML += `grid      : ....${grid56}`   + `\n`;
                    this.domResultDecode.innerHTML += `altM      : ${altM}`         + `\n`;
                    this.domResultDecode.innerHTML += `tempC     : ${tempC}`        + `\n`;
                    this.domResultDecode.innerHTML += `voltage   : ${voltage}`      + `\n`;
                    this.domResultDecode.innerHTML += `speedKnots: ${speedKnots}`   + `\n`;
                    this.domResultDecode.innerHTML += `gpsValid  : ${gpsValid}`     + `\n`;
                }
                else
                {
                    this.domResultDecode.innerHTML += `type : ${ret.msgType}\t- non-standardized telemetry` + `\n`;
                    this.domResultDecode.innerHTML += `seq  : ${ret.msgSeq}\t- first or second in series`  + `\n`;
                }

                this.domResultDecode.innerHTML += `\n`;
            }
            else
            {
                if (linePartList[0] != "")
                {
                    this.domResultDecode.innerHTML += `==========================\n`;
                    this.domResultDecode.innerHTML += `Skipping invalid line "${line}"\n`;
                    this.domResultDecode.innerHTML += `==========================\n`;
                    this.domResultDecode.innerHTML += `\n`;
                }
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    let app = new App();
});

</script>

<!-- overrides -->
<link rel="stylesheet" href="/css/mkdocs.css">

<style>
section {
    display: inline-flex;
}

textarea {
    resize: both;
    height: 300px;
    min-width: 300px;
}

dfn {
    display: inline-block;
    min-width: 130px;
}

.heading {
    font-size: 1.3em;
}

#decode, #encode {
    text-transform: uppercase;
}
</style>

    </head>
    <body>
        <div class="page">
        <span class="heading">
            Decode: call, grid, power
        </span>
        <br/>
        <section>
            <textarea id="decode" spellcheck="false">
1Y4PAS HK08 10
QX7DGS JQ97 33
0X2FDM MI65 27

</textarea>
            <button id="doDecode" class="button_not_styled">Click<br/>to<br/>Decode</button>
            <textarea id="resultDecode" spellcheck="false" readonly disabled></textarea>
        </section>

        <br/>
        <br/>

        <details>
        <summary>Field Definitions</summary>
        <br/>
        id13 - The two characters of the column your channel is in.<br/>
        <br/>
        See <a href="/pro/telemetry/basic/#message-fields" target="_blank">Message Fields</a> for details on other fields.<br/>
        <br/>
        </details>

        <br>
        <span class="heading">
            Encode: id13, 6-char maidenhead, altitudeMeters, tempC, voltage, speedKnots, gpsValid
        </span>
        <br>
        <section>
            <textarea id="encode" spellcheck="false">
14 FN20XR 1000 -12 4.95  0 1
Q7 FN20WR 3000   0 3.18 10 0
02 FN20WS 7000  13 3.00 60 1

</textarea>
            <button id="doEncode" class="button_not_styled">Click<br/>to<br/>Encode</button>
            <textarea id="resultEncode" spellcheck="false" readonly disabled></textarea>
        </section>
        <br/>
        <br/>

        <br/>
        <br/>
        <button onclick="window.location = window.location.href.split('?')[0]" class="button_not_styled">Restore Defaults</button>
        <br/>
    </div>
    </body>
</html>
