
let DEBUG = false;

function Gather(str)
{
    if (DEBUG)
    {
        console.log(str);
    }

    return str + "\n";
}


export class WSPREncoded
{
    static EnableDebug()  { DEBUG = true;  }
    static DisableDebug() { DEBUG = false; }

    static DBM_POWER_LIST = [
        0,  3,  7,
        10, 13, 17,
        20, 23, 27,
        30, 33, 37,
        40, 43, 47,
        50, 53, 57,
        60
    ];

    static EncodeNumToPower(num)
    {
        if (num < 0 || WSPREncoded.DBM_POWER_LIST.length - 1 < num)
        {
            num = 0;
        }

        return WSPREncoded.DBM_POWER_LIST[num];
    }

    static DecodePowerToNum(power)
    {
        let powerVal = WSPREncoded.DBM_POWER_LIST.indexOf(power);
            powerVal = (powerVal == -1) ? 0 : powerVal;

        return powerVal;
    }

    static EncodeBase36(val)
    {
        let retVal;

        if (val < 10)
        {
            retVal = String.fromCharCode("0".charCodeAt(0) + val);
        }
        else
        {
            retVal = String.fromCharCode("A".charCodeAt(0) + (val - 10));
        }

        return retVal;
    }

    static DecodeBase36(c)
    {
        let retVal = 0;

        let cVal = c.charCodeAt(0);

        let aVal = "A".charCodeAt(0);
        let zVal = "Z".charCodeAt(0);
        let zeroVal = "0".charCodeAt(0);

        if (aVal <= cVal && cVal <= zVal)
        {
            retVal = 10 + (cVal - aVal);
        }
        else
        {
            retVal = cVal - zeroVal;
        }

        return retVal;
    }

    static DecodeMaidenheadToDeg(grid)
    {
        grid = grid.toUpperCase();

        let lat = 0;
        let lng = 0;

        if (grid.length >= 2)
        {
            let g1 = grid.charAt(0);
            let g2 = grid.charAt(1);

            lng += (g1.charCodeAt(0) - "A".charCodeAt(0)) * 200000;
            lat += (g2.charCodeAt(0) - "A".charCodeAt(0)) * 100000;
        }

        if (grid.length >= 4)
        {
            let g3 = grid.charAt(2);
            let g4 = grid.charAt(3);

            lng += (g3.charCodeAt(0) - "0".charCodeAt(0)) * 20000;
            lat += (g4.charCodeAt(0) - "0".charCodeAt(0)) * 10000;
        }

        if (grid.length >= 6)
        {
            let g5 = grid.charAt(4);
            let g6 = grid.charAt(5);

            lng += (g5.charCodeAt(0) - "A".charCodeAt(0)) * 834;
            lat += (g6.charCodeAt(0) - "A".charCodeAt(0)) * 417;
        }

        lng -= (180 * 10000);
        lat -= ( 90 * 10000);

        lng *= 100;
        lat *= 100;

        lng /= 1000000;
        lat /= 1000000;

        return [lat, lng];
    }

    // https://stackoverflow.com/questions/32806084/google-map-zoom-parameter-in-url-not-working
    static MakeGoogleMapsLink(lat, lng)
    {
        // approx zoom levels
        //  1: World
        //  5: Landmass/continent
        // 10: City
        // 15: Streets
        // 20: Buildings
        let zoom = 4;

        return `https://maps.google.com/?q=${lat},${lng}&ll=${lat},${lng}&z=${zoom}`;
    }

    static EncodeU4BCall(id1, id3, grid56, altM)
    {
        let retVal = "";

        // pick apart inputs
        let grid5 = grid56.substring(0, 1);
        let grid6 = grid56.substring(1);

        // convert inputs into components of a big number
        let grid5Val = grid5.charCodeAt(0) - "A".charCodeAt(0);
        let grid6Val = grid6.charCodeAt(0) - "A".charCodeAt(0);

        let altFracM = Math.round(altM / 20);

        retVal += Gather(`grid5Val(${grid5Val}), grid6Val(${grid6Val}), altFracM(${altFracM})`);
        
        // convert inputs into a big number
        let val = 0;
        
        val *=   24; val += grid5Val;
        val *=   24; val += grid6Val;
        val *= 1068; val += altFracM;
        
        retVal += Gather(`val(${val})`);
        
        // extract into altered dynamic base
        let id6Val = val % 26; val = Math.floor(val / 26);
        let id5Val = val % 26; val = Math.floor(val / 26);
        let id4Val = val % 26; val = Math.floor(val / 26);
        let id2Val = val % 36; val = Math.floor(val / 36);

        retVal += Gather(`id2Val(${id2Val}), id4Val(${id4Val}), id5Val(${id5Val}), id6Val(${id6Val})`);

        // convert to encoded callsign
        let id2 = WSPREncoded.EncodeBase36(id2Val);
        let id4 = String.fromCharCode("A".charCodeAt(0) + id4Val);
        let id5 = String.fromCharCode("A".charCodeAt(0) + id5Val);
        let id6 = String.fromCharCode("A".charCodeAt(0) + id6Val);
        let call = id1 + id2 + id3 + id4 + id5 + id6;

        retVal += Gather(`id1(${id1}), id2(${id2}), id3(${id3}), id4(${id4}), id5(${id5}), id6(${id6})`);
        retVal += Gather(`${call}`);

        retVal = call;

        return retVal;
    }

    static DecodeU4BCall(call)
    {
        let retVal = "";

        // break call down
        let id2 = call.charAt(1);
        let id4 = call.charAt(3);
        let id5 = call.charAt(4);
        let id6 = call.charAt(5);

        // convert to values which are offset from 'A'
        let id2Val = WSPREncoded.DecodeBase36(id2);
        let id4Val = id4.charCodeAt(0) - "A".charCodeAt(0);
        let id5Val = id5.charCodeAt(0) - "A".charCodeAt(0);
        let id6Val = id6.charCodeAt(0) - "A".charCodeAt(0);

        retVal += Gather(`id2Val(${id2Val}), id4Val(${id4Val}), id5Val(${id5Val}), id6Val(${id6Val})`);

        // integer value to use to decode
        let val = 0;

        // combine values into single integer
        val *= 36; val += id2Val;
        val *= 26; val += id4Val;   // spaces aren't used, so 26 not 27
        val *= 26; val += id5Val;   // spaces aren't used, so 26 not 27
        val *= 26; val += id6Val;   // spaces aren't used, so 26 not 27

        retVal += Gather(`val ${val}`);

        // extract values
        let altFracM = val % 1068; val = Math.floor(val / 1068);
        let grid6Val = val %   24; val = Math.floor(val /   24);
        let grid5Val = val %   24; val = Math.floor(val /   24);

        let altM = altFracM * 20;
        let grid6 = String.fromCharCode(grid6Val + "A".charCodeAt(0));
        let grid5 = String.fromCharCode(grid5Val + "A".charCodeAt(0));
        let grid56 = grid5 + grid6;

        retVal += Gather(`grid ....${grid56} ; altM ${altM}`);
        retVal += Gather("-----------");

        retVal = [grid56, altM];

        return retVal;
    }

    static EncodeU4BGridPower(tempC, voltage, speedKnots, gpsValid)
    {
        // parse input presentations
        tempC      = parseFloat(tempC);
        voltage    = parseFloat(voltage);
        speedKnots = parseFloat(speedKnots);
        gpsValid   = parseInt(gpsValid);

        let retVal = "";

        // map input presentations onto input radix (numbers within their stated range of possibilities)
        let tempCNum      = tempC - -50;
        let voltageNum    = Math.round(((voltage * 100) - 300) / 5);
        let speedKnotsNum = Math.round(speedKnots / 2.0);
        let gpsValidNum   = gpsValid;

        retVal += Gather(`tempCNum(${tempCNum}), voltageNum(${voltageNum}), speedKnotsNum,(${speedKnotsNum}), gpsValidNum(${gpsValidNum})`);

        // shift inputs into a big number
        let val = 0;

        val *= 90; val += tempCNum;
        val *= 40; val += voltageNum;
        val *= 42; val += speedKnotsNum;
        val *=  2; val += gpsValidNum;
        val *=  2; val += 1;                // standard telemetry

        retVal += Gather(`val(${val})`);
        
        // unshift big number into output radix values
        let powerVal = val % 19; val = Math.floor(val / 19);
        let g4Val    = val % 10; val = Math.floor(val / 10);
        let g3Val    = val % 10; val = Math.floor(val / 10);
        let g2Val    = val % 18; val = Math.floor(val / 18);
        let g1Val    = val % 18; val = Math.floor(val / 18);

        retVal += Gather(`grid1Val(${g1Val}), grid2Val(${g2Val}), grid3Val(${g3Val}), grid4Val(${g4Val})`);
        retVal += Gather(`powerVal(${powerVal})`);

        // map output radix to presentation
        let g1 = String.fromCharCode("A".charCodeAt(0) + g1Val);
        let g2 = String.fromCharCode("A".charCodeAt(0) + g2Val);
        let g3 = String.fromCharCode("0".charCodeAt(0) + g3Val);
        let g4 = String.fromCharCode("0".charCodeAt(0) + g4Val);
        let grid = g1 + g2 + g3 + g4;
        let power = WSPREncoded.EncodeNumToPower(powerVal);
        
        retVal += Gather(`grid(${grid}), g1(${g1}), g2(${g2}), g3(${g3}), g4(${g4})`);
        retVal += Gather(`power(${power})`);

        retVal += Gather(`${grid} ${power}`);
        
        retVal = [grid, power];

        return retVal;
    }

    static DecodeU4BGridPower(grid, power)
    {
        let debug = "";

        power = parseInt(power);

        let g1 = grid.charAt(0);
        let g2 = grid.charAt(1);
        let g3 = grid.charAt(2);
        let g4 = grid.charAt(3);

        let g1Val = g1.charCodeAt(0) - "A".charCodeAt(0);
        let g2Val = g2.charCodeAt(0) - "A".charCodeAt(0);
        let g3Val = g3.charCodeAt(0) - "0".charCodeAt(0);
        let g4Val = g4.charCodeAt(0) - "0".charCodeAt(0);
        let powerVal = WSPREncoded.DecodePowerToNum(power);

        let val = 0;
        
        val *= 18; val += g1Val;
        val *= 18; val += g2Val;
        val *= 10; val += g3Val;
        val *= 10; val += g4Val;
        val *= 19; val += powerVal;

        debug += Gather(`val(${val})`);

        let telemetryId   = val %  2 ; val = Math.floor(val /  2);
        let bit2          = val %  2 ; val = Math.floor(val /  2);
        let speedKnotsNum = val % 42 ; val = Math.floor(val / 42);
        let voltageNum    = val % 40 ; val = Math.floor(val / 40);
        let tempCNum      = val % 90 ; val = Math.floor(val / 90);

        let retVal;
        if (telemetryId == 0)
        {
            let msgType       = "extra";
            let extraTelemSeq = bit2 == 0 ? "first" : "second";

            retVal = {
                msgType: "extra",
                msgSeq : extraTelemSeq,
            };
        }
        else
        {
            let msgType  = "standard";
            let gpsValid = bit2;
            
            let tempC      = -50 + tempCNum;
            let voltage    = 3.0 + (voltageNum * 0.05);
            let speedKnots = speedKnotsNum * 2;
            let speedKph   = speedKnots * 1.852;
    
            debug += Gather(`tempCNum(${tempCNum}), tempC(${tempC})`);
            debug += Gather(`voltageNum(${voltageNum}), voltage(${voltage})`);
            debug += Gather(`speedKnotsNum(${speedKnotsNum}), speedKnots(${speedKnots}), speedKph(${speedKph})`);
            debug += Gather(`gpsValid(${gpsValid})`);

            debug += Gather(`${tempC}, ${voltage}, ${speedKnots}, ${gpsValid}`);
    
            retVal = {
                msgType: msgType,
                data   : [tempC, voltage, speedKnots, gpsValid],
            };
        }

        retVal.debug = debug;

        return retVal;
    }
}


