
function Gather(str)
{
    console.log(str);
    return str + "\n";
}


export class WSPRDecode
{
    static DecodeBase36(c)
    {
        let retVal = 0;

        let cVal = c.charCodeAt(0);

        let aVal = "A".charCodeAt(0);
        let zVal = "Z".charCodeAt(0);
        let zeroVal = "0".charCodeAt(0);

        if (aVal <= cVal && cVal <= zVal)
        {
            retVal = cVal - aVal;
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

        // console.log(`${id2}(${id2Val}) + ${id4}(${id4Val}) + ${id5}(${id5Val}) + ${id6}(${id6Val})`);

        // integer value to use to decode
        let val = 0;

        // combine values into single integer
        val *= 36; val += id2Val;
        val *= 26; val += id4Val;   // spaces aren't used, so 26 not 27
        val *= 26; val += id5Val;   // spaces aren't used, so 26 not 27
        val *= 26; val += id6Val;   // spaces aren't used, so 26 not 27

        retVal += Gather(`val ${val}`);


        // extract values
        // let id2Out = 0;
        // let id4Out = 0;
        // let id5Out = 0;
        // let id6Out = 0;

        // id6Out = val % 26; val = Math.floor(val / 26);
        // id5Out = val % 26; val = Math.floor(val / 26);
        // id4Out = val % 26; val = Math.floor(val / 26);
        // id2Out = val % 36; val = Math.floor(val / 36);

        // console.log(`${id2}(${id2Out}) + ${id4}(${id4Out}) + ${id5}(${id5Out}) + ${id6}(${id6Out})`);

        // 576 for extra 2 maidenhead (24 apiece)
        // 1068 for altitude (in units of 1/20 meters)

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
        let powerVal = [ 0,  3,  7,
                        10, 13, 17,
                        20, 23, 27,
                        30, 33, 37,
                        40, 43, 47,
                        50, 53, 57,
                        60].indexOf(power);

        let val = 0;

        val *= 18; val += g1Val;
        val *= 18; val += g2Val;
        val *= 10; val += g3Val;
        val *= 10; val += g4Val;
        val *= 19; val += powerVal;

        let valCache = val;

        // decode
        let tempCNum      = 0;
        let tempC         = 0;
        let voltageNum    = 0;
        let voltage       = 0;
        let speedKnotsNum = 0;
        let speedKnots    = 0;
        let speedKmph     = 0;
        let gpsValid      = 0;
        let gpsMin8Sat    = 0;

        tempCNum      = val % 90 ; val = Math.floor(val / 90);
        voltageNum    = val % 40 ; val = Math.floor(val / 40);
        speedKnotsNum = val % 42 ; val = Math.floor(val / 42);
        gpsValid      = val %  2 ; val = Math.floor(val /  2);
        gpsMin8Sat    = val %  2 ; val = Math.floor(val /  2);

        tempC      = -50 + tempCNum;
        voltage    = 3.0 + (voltageNum * 0.05);
        speedKnots = speedKnotsNum * 2;
        speedKmph  = speedKnots * 1.852;

        retVal += Gather(`tempCNum(${tempCNum}), tempC(${tempC})`);
        retVal += Gather(`voltageNum(${voltageNum}), voltage(${voltage})`);
        retVal += Gather(`speedKnotsNum(${speedKnotsNum}), speedKnots(${speedKnots}), speedKmph(${speedKmph})`);
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
        speedKmph  = speedKnots * 1.852;

        retVal += Gather(`tempCNum(${tempCNum}), tempC(${tempC})`);
        retVal += Gather(`voltageNum(${voltageNum}), voltage(${voltage})`);
        retVal += Gather(`speedKnotsNum(${speedKnotsNum}), speedKnots(${speedKnots}), speedKmph(${speedKmph})`);
        retVal += Gather(`gpsValid(${gpsValid}), gpsMin8Sat(${gpsMin8Sat})`);


        return retVal;
    }
}


