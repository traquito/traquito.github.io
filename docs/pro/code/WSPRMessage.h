#pragma once

#include <string.h>

#include "WSPR.h"


class WSPRMessage
{
public:

    bool SetCallsign(const string callsign)
    {
        bool retVal = false;

        if (WSPR::CallsignIsValid(callsign))
        {
            callsign_ = callsign;

            retVal = true;
        }

        return retVal;
    }

    string GetCallsign() const { return callsign_; }
    
    bool SetGrid(const string grid)
    {
        bool retVal = false;

        if (WSPR::Grid4IsValid(grid))
        {
            grid_ = grid;

            retVal = true;
        }

        return retVal;
    }

    string GetGrid() const { return grid_; }

    bool SetPowerDbm(uint8_t powerDbm)
    {
        bool retVal = false;

        // check values
        if (WSPR::PowerDbmInSet(powerDbm))
        {
            powerDbm_ = powerDbm;

            retVal = true;
        }

        return retVal;
    }

    uint8_t GetPowerDbm() const { return powerDbm_; }
    

private:

    string  callsign_ = "0A0AAA";
    string  grid_     = "AA00";
    uint8_t powerDbm_ = 0;
};


