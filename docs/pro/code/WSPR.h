#pragma once

#include <algorithm>
#include <cctype>
#include <cstdint>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;



class WSPR
{
private:

    // trim from end of string (right)
    static std::string& RTrim(std::string& s, string t = " \t\n\r\f\v")
    {
        s.erase(s.find_last_not_of(t.c_str()) + 1);
        return s;
    }

    // trim from beginning of string (left)
    static std::string& LTrim(std::string& s, string t = " \t\n\r\f\v")
    {
        s.erase(0, s.find_first_not_of(t.c_str()));
        return s;
    }

    // trim from both ends of string (right then left)
    static std::string& Trim(std::string& s, string t = " \t\n\r\f\v")
    {
        return LTrim(RTrim(s, t), t);
    }

    static string& ToUpper(string &s)
    {
        for (char &c : s)
        {
            c = toupper(c);
        }

        return s;
    }

    // positive values mean rotate right
    // negative values mean rotate left
    // zero results in no rotation
    static vector<uint8_t> &Rotate(vector<uint8_t> &valList, int count)
    {
        if (count > 0)
        {
            count = count % valList.size();
            rotate(valList.begin(), valList.begin() + (valList.size() - count), valList.end());
        }
        else
        {
            count = -count;
            count = count % valList.size();

            rotate(valList.begin(), valList.begin() +  count, valList.end());
        }

        return valList;
    }


private:

    static const uint8_t CALLSIGN_LEN_MAX = 6;
    static const uint8_t CALLSIGN_LEN_MIN = 4;
    static const uint8_t GRID4_LEN = 4;

    struct BandData
    {
        string band;
        uint32_t freq;
    };

    inline static vector<BandData> bandDataList_ = {
        { "2190m",        136'000 },
        { "630m",         474'200 },
        { "160m",       1'836'600 },
        { "80m",        3'568'600 },
        { "60m",        5'287'200 },
        { "40m",        7'038'600 },
        { "30m",       10'138'700 },
        { "20m",       14'095'600 },
        { "17m",       18'104'600 },
        { "15m",       21'094'600 },
        { "12m",       24'924'600 },
        { "10m",       28'124'600 },
        { "6m",        50'293'000 },
        { "4m",        70'091'000 },
        { "2m",       144'489'000 },
        { "70cm",     432'300'000 },
        { "23cm",   1'296'500'000 },
    };

    inline static const vector<uint8_t> powerDbmList_ = {
         0,  3,  7,
        10, 13, 17,
        20, 23, 27,
        30, 33, 37,
        40, 43, 47,
        50, 53, 57,
        60
    };


public:

    static const vector<uint8_t> &GetPowerDbmList()
    {
        return powerDbmList_;
    }

    static bool PowerDbmInSet(uint8_t powerDbmIn)
    {
        bool retVal = false;

        for (uint8_t powerDbm : GetPowerDbmList())
        {
            if (powerDbmIn == powerDbm)
            {
                retVal = true;

                break;
            }
        }

        return retVal;
    }

    static uint32_t GetDialFreqFromBandStr(string bandStr)
    {
        bandStr = GetDefaultBandIfNotValid(bandStr);

        uint32_t dialFreq = 0;
        for (const auto &bandData : bandDataList_)
        {
            if (bandData.band == bandStr)
            {
                dialFreq = bandData.freq;

                break;
            }
        }

        return dialFreq;
    }

    static string GetDefaultBandIfNotValid(string bandStr)
    {
        string retVal = "20m";

        for (const auto &bandData : bandDataList_)
        {
            if (bandData.band == bandStr)
            {
                retVal = bandData.band;

                break;
            }
        }

        return retVal;
    }

    static uint16_t GetDefaultChannelIfNotValid(uint16_t channel)
    {
        uint16_t retVal = 0;

        if (0 <= channel && channel <= 599)
        {
            retVal = channel;
        }

        return retVal;
    }

    static bool CallsignIsValid(const string callsign)
    {
        bool retVal = false;

        string cs = callsign;
        Trim(cs);
        ToUpper(cs);

        if (cs == callsign &&
            CALLSIGN_LEN_MIN <= cs.length() && cs.length() <= CALLSIGN_LEN_MAX)
        {
            retVal = true;
        }

        return retVal;
    }

    static bool Grid4IsValid(const string grid)
    {
        bool retVal = false;

        if (grid.length() == GRID4_LEN)
        {
            char g1 = grid[0];
            char g2 = grid[1];
            char g3 = grid[2];
            char g4 = grid[3];

            if ('A' <= g1 && g1 <= 'R' &&
                'A' <= g2 && g2 <= 'R' &&
                '0' <= g3 && g3 <= '9' &&
                '0' <= g4 && g4 <= '9')
            {
                retVal = true;
            }
        }

        return retVal;
    }

    // minute list, some bands are defined as rotation from 20m
    static vector<uint8_t> GetMinuteListForBand(string band)
    {
        band = GetDefaultBandIfNotValid(band);

        // get index into list (guaranteed to be found)
        uint8_t idx = 0;
        for (const auto &bandData : bandDataList_)
        {
            if (bandData.band == band)
            {
                break;
            }

            ++idx;
        }

        // rotation is modded place within this list
        vector<uint8_t> rotationList = { 4, 2, 0, 3, 1 };
        uint8_t rotation = rotationList[idx % 5];

        vector<uint8_t> minuteList = { 8, 0, 2, 4, 6 };
        minuteList = Rotate(minuteList, rotation);

        return minuteList;
    }

    struct ChannelDetails
    {
        string   band     = "20m";
        uint16_t channel  = 0;
        char     id1      = '0';
        char     id3      ='0';
        string   id13     = "00";
        uint8_t  min      = 8;
        uint8_t  lane     = 1;
        uint32_t freq     = 14'097'020ULL;
        uint32_t freqDial = 14'095'600ULL;
    };

    static ChannelDetails GetChannelDetails(string bandStr, uint16_t channelIn)
    {
        bandStr = GetDefaultBandIfNotValid(bandStr);
        channelIn = GetDefaultChannelIfNotValid(channelIn);

        vector<char> id1List = { '0', '1', 'Q' };
        vector<char> id3List = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9' };

        uint32_t dialFreq = GetDialFreqFromBandStr(bandStr);

        uint32_t freqTxLow = dialFreq + 1500 - 100;
        uint32_t freqTxHigh = dialFreq + 1500 + 100;
        uint32_t freqTxWindow = freqTxHigh - freqTxLow;

        uint8_t freqBandCount = 5;
        uint8_t bandSizeHz = freqTxWindow / freqBandCount;

        vector<uint8_t> freqBandList = { 1, 2, 4, 5 };    // skip middle band 3, but really label as 1,2,3,4

        vector<uint8_t> minuteList = GetMinuteListForBand(bandStr);

        uint8_t rowCount = 0;
        for (auto freqBand : freqBandList)
        {
            // figure out the frequency
            uint8_t freqBandLow    = (freqBand - 1) * bandSizeHz;
            uint8_t freqBandHigh   = freqBandLow + bandSizeHz;
            uint8_t freqBandCenter = (freqBandHigh + freqBandLow) / 2;

            uint8_t rowsPerCol = freqBandCount * freqBandList.size();

            for (auto minute : minuteList)
            {
                uint8_t freqBandLabel = freqBand;
                if (freqBandLabel >= 4) { freqBandLabel = freqBandLabel - 1; }
                
                for (char id1 : id1List)
                {
                    uint8_t  colCount = 0;
                    uint16_t id1Offset = 0;
                    if (id1 == '1') { id1Offset = 200; }
                    if (id1 == 'Q') { id1Offset = 400; }

                    for (char id3 : id3List)
                    {
                        uint16_t channel = id1Offset + (colCount * rowsPerCol) + rowCount;

                        if (channel == channelIn)
                        {
                            return {
                                .band     = bandStr,
                                .channel  = channel,
                                .id1      = id1,
                                .id3      = id3,
                                .id13     = string{} + id1 + id3,
                                .min      = minute,
                                .lane     = freqBandLabel,
                                .freq     = freqTxLow + freqBandCenter,
                                .freqDial = dialFreq,
                            };
                        }

                        ++colCount;
                    }
                }

                ++rowCount;
            }
        }

        return {};
    }
};



