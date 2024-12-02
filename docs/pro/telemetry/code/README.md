---
icon: material/code-array
---

# Programming Library

## Overview

This page describes the C++ library which implements telemetry encoding and decoding functionality.

This is useful for writing a tracker, or other purposes.


## Library

!!! info "The [WsprEncoded](https://github.com/traquito/WsprEncoded){:target="_blank"} library implements the functionality described in:"
    - [WSPR Telemetry](../README.md)
        - [Basic Telemetry](../basic/README.md)
    - [Channel Map](../../../channelmap/README.md)
    

!!! success "The library is available in several forms"
    - Arduino Library via Arduino's Package Manager
    - Git submodule, built via CMake

!!! info "The library is designed to be widely compatible"
    - No dynamic memory allocations (no malloc, no new)
        - No STL containers which allocate memory, either
    - C++11 language version, so old compilers are supported


## Arduino

### Platform Compatibility

!!! success "Builds against a variety of platforms on Arduino"
    - RP2040
    - ... atmega328p?

### Library Manager Support


## API for Basic Telemetry

### Encoding

!!! example "Example minimal program"
    ```c++
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Configure band and channel
        const char *band    = "20m";
        uint16_t    channel = 123;

        // Get channel details
        WsprChannelMap::ChannelDetails cd = WsprChannelMap::GetChannelDetails(band, channel);

        // Create Basic Telemetry object
        WsprMessageTelemetryBasic tb;

        // Set telemetry fields
        tb.SetGrid56("XS");
        tb.SetAltitudeMeters(12360);
        tb.SetTemperatureCelsius(-28);
        tb.SetVoltageVolts(3.35);
        tb.SetSpeedKnots(72);
        tb.SetGpsIsValid(true);

        // Encode the data
        tb.SetId13(cd.id13);
        tb.Encode();

        // Extract the encoded telemetry
        cout << "Encoded data:" << endl;
        cout << "Callsign: "<< tb.GetCallsign() << endl;
        cout << "Grid4   : "<< tb.GetGrid4()    << endl;
        cout << "PowerDbm: "<< tb.GetPowerDbm() << endl;

        return 0;
    }
    ```

### Decoding


## API for Channel Map

!!! quote "ChannelDetails structure"
    ```c++
    struct ChannelDetails
    {
        const char   *band;
        uint16_t      channel;
        char          id1;
        char          id3;
        char          id13[3];
        uint8_t       min;
        uint8_t       lane;
        uint32_t      freq;
        uint32_t      freqDial;
    };
    ```


!!! example "Example minimal program"
    ```c++
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Configure band and channel
        const char *band    = "20m";
        uint16_t    channel = 123;

        // Get channel details
        WsprChannelMap::ChannelDetails cd = WsprChannelMap::GetChannelDetails(band, channel);

        // Examine the details
        cout << "Channel Details for band " << band << ", channel " << channel << ":" << endl;

        return 0;
    }
    ```
