export function Commas(num)
{
    let ret = num;

    try {
        ret = parseInt(num).toLocaleString("en-US");
    } catch (e) {
        // nothing
    }

    return ret;
}

// take in any css color string (hex, rgb, name, etc)
// return array [r, g, b]
export function GetRgbFromColor(color)
{
    let d = document.createElement("div");

    d.style.color = color;

    
    document.body.appendChild(d);
    // comes out as "rgb(r, g, b)"
    let rgbStrColor = window.getComputedStyle(d).color;
    document.body.removeChild(d);

    console.log(`got color ${color}`);
    console.log(`cvt color ${rgbStrColor}`);

    // extract r, g, b
    let rgbArr = rgbStrColor.substring(4, rgbStrColor.length-1).replace(/ /g, '').split(',');

    rgbArr[0] = parseInt(rgbArr[0]);
    rgbArr[1] = parseInt(rgbArr[1]);
    rgbArr[2] = parseInt(rgbArr[2]);

    return rgbArr;
}



// num1 can be higher/lower/equal to num2
// pct is a decimal value, so 50 means 50%
// return a number that is pct between num1 and num2
export function PctBetween(pct, num1, num2)
{
    if (pct <   0) { pct =   0; }
    if (pct > 100) { pct = 100; }

    let min = Math.min(num1, num2);
    let max = Math.max(num1, num2);
    
    let diff = max - min;
    
    if (diff < 0)
    {
        diff = -diff;
    }
    
    let retVal = min + ((pct / 100) * diff);
    
    console.log(`pct: ${pct}`);
    console.log(`min: ${min}`);
    console.log(`min: ${max}`);
    console.log(`diff ${diff}`);
    console.log(`retVal: ${retVal}`);

    return retVal;
}


// returns a string of "rgb(r, g, b)"
export function ColorPctBetween(pct, colorStart, colorEnd, toInt = false)
{
    let rgbArrStart = GetRgbFromColor(colorStart);
    let rgbArrEnd   = GetRgbFromColor(colorEnd);

    console.log(`rgbArrStart`);
    console.log(rgbArrStart);
    console.log(`rgbArrEnd`);
    console.log(rgbArrEnd);

    console.log(`end[0]: ${rgbArrEnd[0]}`);

    let r = PctBetween(pct, rgbArrStart[0], rgbArrEnd[0]);
    let g = PctBetween(pct, rgbArrStart[1], rgbArrEnd[1]);
    let b = PctBetween(pct, rgbArrStart[2], rgbArrEnd[2]);

    if (toInt)
    {
        r = Math.round(r);
        g = Math.round(g);
        b = Math.round(b);
    }

    let retVal = `rgb(${r}, ${g}, ${b})`;

    return retVal;
}

