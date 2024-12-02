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

### API Guide

!!! quote "API Guide"
    ```c++ linenums="1"

    // Setter functions return:
    // - true  when value passed is not clamped, modified, or rejected
    // - false when value passed is     clamped, modified, or rejected

    class WsprMessageTelemetryBasic
    {
    public:

        /////////////////////////////////////////
        // Setters / Getters for Telemetry
        /////////////////////////////////////////

        bool        SetGrid56(const char *grid56);
        const char *GetGrid56() const;

        bool        SetAltitudeMeters(int32_t altitudeMeters);
        uint16_t    GetAltitudeMeters() const;

        bool        SetTemperatureCelsius(int32_t temperatureCelsius);
        int8_t      GetTemperatureCelsius() const;

        bool        SetVoltageVolts(double voltageVolts);
        double      GetVoltageVolts() const;

        bool        SetSpeedKnots(int32_t speedKnots);
        uint8_t     GetSpeedKnots() const;

        bool        SetGpsIsValid(bool gpsValid);
        bool        GetGpsIsValid() const;


        /////////////////////////////////////////
        // Setters / Getters for Encode / Decode
        /////////////////////////////////////////

        bool        SetCallsign(const char *callsign);
        const char *GetCallsign() const;
        
        bool        SetGrid4(const char *grid4);
        const char *GetGrid4() const;
        
        bool        SetPowerDbm(uint8_t powerDbm);
        uint8_t     GetPowerDbm() const;


        // Special Channel Map input into Encoding
        bool        SetId13(const char *id13);
        const char *GetId13() const;


        /////////////////////////////////////////
        // Encode / Decode
        /////////////////////////////////////////

        void Encode();
        bool Decode();  // return true on successful decode, false otherwise


        /////////////////////////////////////////
        // Reset the object to initial values
        /////////////////////////////////////////

        void Reset();
    };
    ```



### Encoding Example

!!! example "Example minimal program"
    ```c++ linenums="1" title="main.cpp"
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Create Basic Telemetry object
        WsprMessageTelemetryBasic tb;

        // Set telemetry fields
        tb.SetGrid56("XS");
        tb.SetAltitudeMeters(12360);
        tb.SetTemperatureCelsius(-28);
        tb.SetVoltageVolts(3.35);
        tb.SetSpeedKnots(72);
        tb.SetGpsIsValid(true);

        // Configure band and channel
        const char *band    = "20m";
        uint16_t    channel = 123;

        // Get channel details
        WsprChannelMap::ChannelDetails cd = WsprChannelMap::GetChannelDetails(band, channel);

        // Encode the data
        tb.SetId13(cd.id13);
        tb.Encode();

        // Extract the encoded WSPR fields
        cout << "Encoded data" << endl;
        cout << "------------" << endl;
        cout << "Callsign: "<< tb.GetCallsign() << endl;
        cout << "Grid4   : "<< tb.GetGrid4()    << endl;
        cout << "PowerDbm: "<< tb.GetPowerDbm() << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Encoded data
    ------------
    Callsign: 
    Grid4   : 
    PowerDbm: 
    ```



### Decoding Example

!!! example "Example minimal program"
    ```c++ linenums="1" title="main.cpp"
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Create Basic Telemetry object
        WsprMessageTelemetryBasic tb;

        // Set encoded fields
        tb.SetCallsign("");
        tb.SetGrid4(...);
        tb.SetPowerDbm(...);

        // Decode the data
        tb.Decode();

        // Extract the decoded telemetry
        cout << "Decoded data" << endl;
        cout << "------------" << endl;
        cout << "Grid56            : "<< tb.GetGrid56()             << endl;
        cout << "AltitudeMeters    : "<< tb.GetAltitudeMeters()     << endl;
        cout << "TemperatureCelsius: "<< tb.GetTemperatureCelsius() << endl;
        cout << "VoltageVolts      : "<< tb.GetVoltageVolts()       << endl;
        cout << "SpeedKnots        : "<< tb.GetSpeedKnots()         << endl;
        cout << "GpsIsValid        : "<< tb.GetGpsIsValid()         << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Decoded data
    ------------
    Grid56            : 
    AltitudeMeters    : 
    TemperatureCelsius: 
    VoltageVolts      : 
    SpeedKnots        : 
    GpsIsValid        : 
    ```





## API for Channel Map

### API Guide

!!! quote "API Guide"
    ```c++ linenums="1"
    struct ChannelDetails
    {
        char     id13[3];   // id13 column header value (null terminated c-string)
        uint8_t  min;       // start minute (0, 2, 4, 6, 8)
        uint32_t freq;      // target frequency, in Hz
    };

    class WsprChannelMap
    {
    public:

        // For a given band and channel, get the channel details
        static ChannelDetails GetChannelDetails(const char *band, uint16_t channel);
    };
    ```

### Minimal Example Program

!!! example "Example minimal program"
    ```c++ linenums="1" title="main.cpp" 
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
        cout << "Channel Details for band " << band << ", channel " << channel << endl;
        cout << "id13: " << cd.id13 << endl;
        cout << "min : " << cd.min  << endl;
        cout << "freq: " << cd.freq << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Channel details for band 20m, channel 123
    id13: 
    min : 
    freq: 
    ```
