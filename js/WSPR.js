

export class WSPR
{
    static bandFreqList_ = [
        ["2190m",      136000],
        ["630m",       474200],
        ["160m",      1836600],
        ["80m",       3568600],
        ["60m",       5287200],
        ["40m",       7038600],
        ["30m",      10138700],
        ["20m",      14095600],
        ["17m",      18104600],
        ["15m",      21094600],
        ["12m",      24924600],
        ["10m",      28124600],
        ["6m",       50293000],
        ["4m",       70091000],
        ["2m",      144489000],
        ["70cm",    432300000],
        ["23cm",   1296500000],
    ];

    static GetDialFreqFromBandStr(bandStr)
    {
        bandStr = WSPR.GetDefaultBandIfNotValid(bandStr);

        let bandStr__dialFreq = new Map(WSPR.bandFreqList_);
        let dialFreq = bandStr__dialFreq.get(bandStr);

        return dialFreq;
    }

    static GetDefaultBandIfNotValid(bandStr)
    {
        let bandStr__dialFreq = new Map(WSPR.bandFreqList_);

        if (bandStr__dialFreq.has(bandStr) == false)
        {
            bandStr = "20m";
        }

        return bandStr;
    }
}





