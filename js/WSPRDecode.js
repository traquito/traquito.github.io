
function Gather(str)
{
    console.log(str);
    return str + "\n";
}


export class WSPRDecode
{
    static DBM_POWER_LIST = [
        0,  3,  7,
        10, 13, 17,
        20, 23, 27,
        30, 33, 37,
        40, 43, 47,
        50, 53, 57,
        60
    ];




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

    static DecodeCall(call)
    {
        let retVal = "";

        // break call down
        // 6 characters, we know the 1st and 3rd are for ID, which we know,
        // so we ignore for now.  Get the other 4.
        let id2 = call.charAt(1);
        let id4 = call.charAt(3);
        let id5 = call.charAt(4);
        let id6 = call.charAt(5);

        // convert to values which are offset from 'A'
        let id2Val = WSPRDecode.DecodeBase36(id2);
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
        let altFracM = 0;
        let altM     = 0;
        let grid6    = 0;
        let grid6Val = 0;
        let grid5    = 0;
        let grid5Val = 0;

        // unsure if altitude worked
        altFracM = val % 1068; val = Math.floor(val / 1068);
        grid6Val = val %   24; val = Math.floor(val /   24);
        grid5Val = val %   24; val = Math.floor(val /   24);

        altM = altFracM * 20;
        grid6 = String.fromCharCode(grid6Val + "A".charCodeAt(0));
        grid5 = String.fromCharCode(grid5Val + "A".charCodeAt(0));

        // console.log(`${altFracM}(${altM}) ${grid5Val}(${grid5}) ${grid6Val}(${grid6})`);
        retVal += Gather(`grid ....${grid5}${grid6} ; altM ${altM}`);
        retVal += Gather("-----------");

        return retVal;
    }

    static DecodeGridPower(grid, power)
    {
        let retVal = "";

        power = parseInt(power);

        let g1 = grid.charAt(0);
        let g2 = grid.charAt(1);
        let g3 = grid.charAt(2);
        let g4 = grid.charAt(3);

        let g1Val = g1.charCodeAt(0) - "A".charCodeAt(0);
        let g2Val = g2.charCodeAt(0) - "A".charCodeAt(0);
        let g3Val = g3.charCodeAt(0) - "0".charCodeAt(0);
        let g4Val = g4.charCodeAt(0) - "0".charCodeAt(0);
        let powerVal = WSPRDecode.DBM_POWER_LIST.indexOf(power);
            powerVal = (powerVal == -1) ? 0 : powerVal;

        let val = 0;

        val *= 18; val += g1Val;
        val *= 18; val += g2Val;
        val *= 10; val += g3Val;
        val *= 10; val += g4Val;
        val *= 19; val += powerVal;

        // decode
        let tempCNum      = val % 90 ; val = Math.floor(val / 90);
        let voltageNum    = val % 40 ; val = Math.floor(val / 40);
        let speedKnotsNum = val % 42 ; val = Math.floor(val / 42);
        let gpsValid      = val %  2 ; val = Math.floor(val /  2);
        let gpsMin8Sat    = val %  2 ; val = Math.floor(val /  2);

        let tempC      = -50 + tempCNum;
        let voltage    = 3.0 + (voltageNum * 0.05);
        let speedKnots = speedKnotsNum * 2;
        let speedKph   = speedKnots * 1.852;

        retVal += Gather(`tempCNum(${tempCNum}), tempC(${tempC})`);
        retVal += Gather(`voltageNum(${voltageNum}), voltage(${voltage})`);
        retVal += Gather(`speedKnotsNum(${speedKnotsNum}), speedKnots(${speedKnots}), speedKph(${speedKph})`);
        retVal += Gather(`gpsValid(${gpsValid}), gpsMin8Sat(${gpsMin8Sat})`);
        retVal += Gather("-----------");

        gpsMin8Sat    = val %  2 ; val = Math.floor(val /  2);
        gpsValid      = val %  2 ; val = Math.floor(val /  2);
        speedKnotsNum = val % 42 ; val = Math.floor(val / 42);
        voltageNum    = val % 40 ; val = Math.floor(val / 40);
        tempCNum      = val % 90 ; val = Math.floor(val / 90);

        tempC      = -50 + tempCNum;
        voltage    = 3.0 + (voltageNum * 0.05);
        speedKnots = speedKnotsNum * 2;
        speedKph   = speedKnots * 1.852;

        retVal += Gather(`tempCNum(${tempCNum}), tempC(${tempC})`);
        retVal += Gather(`voltageNum(${voltageNum}), voltage(${voltage})`);
        retVal += Gather(`speedKnotsNum(${speedKnotsNum}), speedKnots(${speedKnots}), speedKph(${speedKph})`);
        retVal += Gather(`gpsValid(${gpsValid}), gpsMin8Sat(${gpsMin8Sat})`);

        return retVal;
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

    static EncodeCall(grid56, altM)
    {
        let retVal = "";

        // pick apart inputs
        let grid5 = grid56.substring(0, 1);
        let grid6 = grid56.substring(1);

        // convert inputs into components of a big number
        let grid5Val = grid5.charCodeAt(0) - "A".charCodeAt(0);
        let grid6Val = grid6.charCodeAt(0) - "A".charCodeAt(0);

        let altFracM = Math.floor(altM / 20);

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
        let id1 = "0";  // or 1 or Q
        let id2 = WSPRDecode.EncodeBase36(id2Val);
        let id3 = "0";  // or 1-9
        let id4 = String.fromCharCode("A".charCodeAt(0) + id4Val);
        let id5 = String.fromCharCode("A".charCodeAt(0) + id5Val);
        let id6 = String.fromCharCode("A".charCodeAt(0) + id6Val);
        let call = id1 + id2 + id3 + id4 + id5 + id6;

        retVal += Gather(`id1(${id1}), id2(${id2}), id3(${id3}), id4(${id4}), id5(${id5}), id6(${id6})`);
        retVal += Gather(`${call}`);

        return retVal;
    }

    static EncodeGridPower(tempC, voltage, speedKnots, gpsValid, gpsMin8Sat)
    {
        tempC      = parseFloat(tempC);
        voltage    = parseFloat(voltage);
        speedKnots = parseFloat(speedKnots);
        gpsValid   = parseInt(gpsValid);
        gpsMin8Sat = parseInt(gpsMin8Sat);

        let retVal = "";

        // convert inputs into components of a big number
        let tempCVal      = Math.floor(1024 * ((tempC * 0.01) + 2.73) / 5);
            tempCVal      = Math.floor((tempCVal - 457) / 2);
        let voltageVal    = (1024 * voltage / 5);
            voltageVal    = Math.floor((voltageVal - 614) / 10);
        let speedKnotsVal = speedKnots;
        let gpsValidVal   = gpsValid;
        let gpsMin8SatVal = gpsMin8Sat;

        retVal += Gather(`tempCVal(${tempCVal}), voltageVal(${voltageVal}), speedKnotsVal(${speedKnotsVal}), gpsValidVal(${gpsValidVal}), gpsMin8SatVal(${gpsMin8SatVal})`);


        // convert inputs into a big number
        let val = 0;

        val *= 90; val += tempCVal;
        val *= 40; val += voltageVal;
        val *= 42; val += speedKnotsVal;
        val *=  2; val += gpsValidVal;
        val *=  2; val += gpsMin8SatVal;

        retVal += Gather(`val(${val})`);
        
        // convert into encoded values
        let powerVal = val % 19; val = Math.floor(val / 19);
        let grid4Val = val % 10; val = Math.floor(val / 10);
        let grid3Val = val % 10; val = Math.floor(val / 10);
        let grid2Val = val % 18; val = Math.floor(val / 18);
        let grid1Val = val % 18; val = Math.floor(val / 18);

        retVal += Gather(`grid1Val(${grid1Val}), grid2Val(${grid2Val}), grid3Val(${grid3Val}), grid4Val(${grid4Val})`);
        retVal += Gather(`powerVal(${powerVal})`);

        let grid1 = String.fromCharCode("A".charCodeAt(0) + grid1Val);
        let grid2 = String.fromCharCode("A".charCodeAt(0) + grid2Val);
        let grid3 = String.fromCharCode("0".charCodeAt(0) + grid3Val);
        let grid4 = String.fromCharCode("0".charCodeAt(0) + grid4Val);
        let grid = grid1 + grid2 + grid3 + grid4;
        let power = WSPRDecode.EncodeNumToPower(powerVal);
        
        retVal += Gather(`grid(${grid}), grid1(${grid1}), grid2(${grid2}), grid3(${grid3}), grid4(${grid4})`);
        retVal += Gather(`power(${power})`);

        retVal += Gather(`${grid} ${power}`);
        
        return retVal;
    }

    static EncodeNumToPower(num)
    {
        if (num < 0 || WSPRDecode.DBM_POWER_LIST.length - 1 < num)
        {
            num = 0;
        }

        return WSPRDecode.DBM_POWER_LIST[num];
    }
}


