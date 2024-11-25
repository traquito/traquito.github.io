#pragma once

#include <cstdint>
#include <string>
using namespace std;

#include "WSPRMessage.h"


class WSPRMessageU4B
: public WSPRMessage
{
public:

    // char 1 has to be 0, 1, or Q
    // char 2 has to be in range 0-9
    bool SetId13(const string id13)
    {
        bool retVal = false;

        if (id13.length() == 2)
        {
            char id1 = id13[0];
            char id3 = id13[1];

            if ((id1 == '0' || id1 == '1' || id1 == 'Q') &&
               ('0' <= id3 && id3 <= '9'))
            {
                id13_ = id13;

                Recalculate();

                retVal = true;
            }
        }

        return retVal;
    }

    string GetId13() const { return grid56_; }

    // both chars have to be in range A-X
    bool SetGrid56(const string grid56)
    {
        bool retVal = false;

        if (grid56.length() == 2)
        {
            char grid5 = grid56[0];
            char grid6 = grid56[1];

            if ('A' <= grid5 && grid5 <= 'X' &&
                'A' <= grid6 && grid6 <= 'X')
            {
                grid56_ = grid56;

                Recalculate();

                retVal = true;
            }
        }

        return retVal;
    }

    string GetGrid56() const { return grid56_; }

    // must be in range 0 to 21340
    void SetAltM(int32_t altM)
    {
        if (altM < 0)     { altM = 0;     }
        if (altM > 21340) { altM = 21340; }

        altM_ = altM;
    }

    uint32_t GetAltM() { return altM_; }

    // has to be in range -50 to 39 C
    void SetTempC(int8_t tempC)
    {
        if (tempC < -50) { tempC = -50; }
        if (tempC > 39)  { tempC =  39; }

        tempC_ = tempC;

        Recalculate();
    }

    int8_t GetTempC() const { return tempC_; }

    // has to be in range 3.00 to 4.95
    void SetVoltage(double voltage)
    {
        if (voltage < 3.00) { voltage = 3.00; }
        if (voltage > 4.95) { voltage = 4.95; }

        voltage_ = voltage;

        Recalculate();
    }

    double GetVoltage() const { return voltage_; }

    // has to be in range 0 to 82
    void SetSpeedKnots(uint8_t speedKnots)
    {
        if (speedKnots > 82) { speedKnots = 82; }

        speedKnots_ = speedKnots;

        Recalculate();
    }

    uint8_t GetSpeedKnots() const { return speedKnots_; }

    void SetGpsValid(bool gpsValid)
    {
        gpsValid_ = gpsValid;

        Recalculate();
    }

    bool GetGpsValid() const { return gpsValid_; }


private:

    static char EncodeBase36(uint8_t val)
    {
        char retVal;

        if (val < 10)
        {
            retVal = '0' + val;
        }
        else
        {
            retVal = 'A' + (val - 10);
        }

        return retVal;
    }

    static string EncodeCallsign(string id13, string grid56, uint32_t altM)
    {
        string callsign;

        // pick apart inputs
        char grid5 = grid56[0];
        char grid6 = grid56[1];

        // convert inputs into components of a big number
        uint8_t grid5Val = grid5 - 'A';
        uint8_t grid6Val = grid6 - 'A';

        uint16_t altFracM = round((double)altM / 20);

        // convert inputs into a big number
        uint32_t val = 0;

        val *=   24; val += grid5Val;
        val *=   24; val += grid6Val;
        val *= 1068; val += altFracM;

        // extract into altered dynamic base
        uint8_t id6Val = val % 26; val = val / 26;
        uint8_t id5Val = val % 26; val = val / 26;
        uint8_t id4Val = val % 26; val = val / 26;
        uint8_t id2Val = val % 36; val = val / 36;

        // convert to encoded callsign
        char id2 = EncodeBase36(id2Val);
        char id4 = 'A' + id4Val;
        char id5 = 'A' + id5Val;
        char id6 = 'A' + id6Val;
        
        callsign = string{ id13[0], id2, id13[1], id4, id5, id6 };

        return callsign;
    }

    static pair<string, uint8_t> EncodeGridPower(int8_t tempCIn, double voltageIn, uint8_t speedKnots, bool gpsValid)
    {
        // parse input presentations
        double tempC   = tempCIn;
        double voltage = voltageIn;

        // map input presentations onto input radix (numbers within their stated range of possibilities)
        uint8_t tempCNum      = tempC - -50;
        uint8_t voltageNum    = ((uint8_t)round(((voltage * 100) - 300) / 5) + 20) % 40;
        uint8_t speedKnotsNum = round((double)speedKnots / 2.0);
        uint8_t gpsValidNum   = gpsValid ? 1 : 0;

        // shift inputs into a big number
        uint32_t val = 0;

        val *= 90; val += tempCNum;
        val *= 40; val += voltageNum;
        val *= 42; val += speedKnotsNum;
        val *=  2; val += gpsValidNum;
        val *=  2; val += 1;                // standard telemetry

        // unshift big number into output radix values
        uint8_t powerVal = val % 19; val = val / 19;
        uint8_t g4Val    = val % 10; val = val / 10;
        uint8_t g3Val    = val % 10; val = val / 10;
        uint8_t g2Val    = val % 18; val = val / 18;
        uint8_t g1Val    = val % 18; val = val / 18;

        // map output radix to presentation
        char g1 = 'A' + g1Val;
        char g2 = 'A' + g2Val;
        char g3 = '0' + g3Val;
        char g4 = '0' + g4Val;

        // form results
        string  grid  = string{ g1, g2, g3, g4 };
        uint8_t power = WSPR::GetPowerDbmList()[powerVal];
        
        return { grid, power };
    }

    void Recalculate()
    {
        string callsign = EncodeCallsign(id13_, grid56_, altM_);

        auto [grid, power] = EncodeGridPower(tempC_, voltage_, speedKnots_, gpsValid_);

        // Now use the WSPRMessage public interface to set the underlying values
        // as external viewers of a WSPRMessage would know them.
        WSPRMessage::SetCallsign(callsign);
        WSPRMessage::SetGrid(grid);
        WSPRMessage::SetPowerDbm(power);
    }


private:

    string   id13_       = "00";
    string   grid56_     = "00";
    uint32_t altM_       = 0;
    int8_t   tempC_      = 0;
    double   voltage_    = 3.3;
    uint8_t  speedKnots_ = 0;
    bool     gpsValid_   = false;
};


