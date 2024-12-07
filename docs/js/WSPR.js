import * as utl from './Utl.js';

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

    static GetDefaultChannelIfNotValid(channel)
    {
        channel = parseInt(channel);

        let retVal = 0;

        if (0 <= channel && channel <= 599)
        {
            retVal = channel;
        }

        return retVal;
    }

    // minute list, some bands are defined as rotation from 20m
    static GetMinuteListForBand(band)
    {
        band = WSPR.GetDefaultBandIfNotValid(band);

        // get index into list (guaranteed to be found)
        let idx = WSPR.bandFreqList_.findIndex(bandFreq => {
            return bandFreq[0] == band;
        });
        
        // rotation is modded place within this list
        let rotationList = [4, 2, 0, 3, 1];
        let rotation = rotationList[idx % 5];
        
        let minuteList = [8, 0, 2, 4, 6];
        minuteList = utl.Rotate(minuteList, rotation);

        return minuteList;
    }

    static band__channelDataMap = new Map();

    static GetChannelDetails(bandStr, channelIn)
    {
        bandStr = WSPR.GetDefaultBandIfNotValid(bandStr);
        channelIn = WSPR.GetDefaultChannelIfNotValid(channelIn);
        
        // lazy load
        if (WSPR.band__channelDataMap.has(bandStr) == false)
        {
            let channelDataMap = new Map();

            let id1List = ['0', '1', 'Q'];
            let id3List = [`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`];

            let dialFreq = WSPR.GetDialFreqFromBandStr(bandStr);
    
            let freqTxLow = dialFreq + 1500 - 100;
            let freqTxHigh = dialFreq + 1500 + 100;
            let freqTxWindow = freqTxHigh - freqTxLow;
    
            let freqBandCount = 5;
            let bandSizeHz = freqTxWindow / freqBandCount;
    
            let freqBandList = [1, 2, 4, 5];    // skip middle band 3, but really label as 1,2,3,4
    
            let minuteList = WSPR.GetMinuteListForBand(bandStr);
    
            let rowCount = 0;
            for (const freqBand of freqBandList)
            {
                // figure out the frequency
                let freqBandLow    = (freqBand - 1) * bandSizeHz;
                let freqBandHigh   = freqBandLow + bandSizeHz;
                let freqBandCenter = (freqBandHigh + freqBandLow) / 2;
    
                let rowsPerCol = freqBandCount * freqBandList.length;
    
                for (const minute of minuteList)
                {
                    let freqBandLabel = freqBand;
                    if (freqBandLabel >= 4) { freqBandLabel = freqBandLabel - 1; }
                    
                    for (const id1 of id1List)
                    {
                        let colCount = 0;
                        let id1Offset = 0;
                        if (id1 == `1`) { id1Offset = 200; }
                        if (id1 == 'Q') { id1Offset = 400; }
    
                        for (const id3 of id3List)
                        {
                            let channel = id1Offset + (colCount * rowsPerCol) + rowCount;

                            channelDataMap.set(channel, {
                                band : bandStr,
                                channel: channel,
                                id1: id1,
                                id3: id3,
                                id13: id1 + id3,
                                min: minute,
                                lane: freqBandLabel,
                                freqLow: freqTxLow + freqBandLow,
                                freq: freqTxLow + freqBandCenter,
                                freqHigh: freqTxLow + freqBandHigh,
                                freqDial: dialFreq,
                            });

                            ++colCount;
                        }
                    }
    
                    ++rowCount;
                }
            }
    
            WSPR.band__channelDataMap.set(bandStr, channelDataMap);
        }

        let channelDataMap = WSPR.band__channelDataMap.get(bandStr);
        let channelData = channelDataMap.get(channelIn);

        return channelData;
    }
}





