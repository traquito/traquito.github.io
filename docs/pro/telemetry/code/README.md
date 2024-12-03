---
icon: material/code-array
---

# Programming Library

## Overview

This page describes the [WsprEncoded](https://github.com/traquito/WsprEncoded){:target="_blank"} C++ header-only library which implements telemetry encoding and decoding functionality.

This is useful for writing a tracker, or other purposes.


## Library

!!! info "The [WsprEncoded](https://github.com/traquito/WsprEncoded){:target="_blank"} library implements the functionality described in:"
    - [WSPR Telemetry](../README.md)
        - [Basic Telemetry](../basic/README.md)
    - [Channel Map](../../../channelmap/README.md)

!!! success "The library is available in several forms"
    - Arduino Library via Arduino's Package Manager
    - CMake integration
        - Git submodules, FetchContent, direct

!!! info "The library is designed to be widely compatible"
    - No dynamic memory allocations (no malloc, no new)
        - No STL containers which allocate memory, either
    - C++11 language version, so old compilers are supported
        - Header-only implementation

## API Overview

!!! note "There are two major classes"

    | What                                  | Description                                                                              |
    |---------------------------------------|------------------------------------------------------------------------------------------|
    | The `WsprMessageTelemetryBasic` class | Encode and Decode Basic Telemetry.<br/>(eg altitude, voltage, etc)                       |
    | The `WsprChannelMap` class            | Look up Channel Map details by band and channel.<br/>(id13, start minute, and frequency) |



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

        // 'A' through 'X' for each char
        bool        SetGrid56(const char *grid56);
        const char *GetGrid56() const;

        // 0 through 21,340, steps of 20
        bool        SetAltitudeMeters(int32_t altitudeMeters);
        uint16_t    GetAltitudeMeters() const;

        // -50 through 39
        bool        SetTemperatureCelsius(int32_t temperatureCelsius);
        int8_t      GetTemperatureCelsius() const;

        // 3.0v through 4.95v, steps of 0.05v
        bool        SetVoltageVolts(double voltageVolts);
        double      GetVoltageVolts() const;

        // 0 through 82, steps of 2
        bool        SetSpeedKnots(int32_t speedKnots);
        uint8_t     GetSpeedKnots() const;

        bool        SetGpsIsValid(bool gpsValid);
        bool        GetGpsIsValid() const;


        /////////////////////////////////////////
        // Setters / Getters for Encode / Decode
        /////////////////////////////////////////

        bool        SetCallsign(const char *callsign);
        const char *GetCallsign() const;
        
        // 'A' through 'X' for chars 1 and 2
        // '0' through '9' for chars 3 and 4
        bool        SetGrid4(const char *grid4);
        const char *GetGrid4() const;
        
        // 0,  3,  7, 10, 13, 17, 20, 23, 27, 30, 33, 37, 40, 43, 47, 50, 53, 57, 60
        bool        SetPowerDbm(uint8_t powerDbm);
        uint8_t     GetPowerDbm() const;


        // Special Channel Map input into Encoding
        // 00 through 09, 10 through 19, Q0 through Q9
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

!!! example "Example [minimal program](https://github.com/traquito/WsprEncoded/blob/main/test/app/TestAppEncodeSimple.cpp){:target="_blank"}"
    ```c++ linenums="1" title="TestAppEncodeSimple.cpp"
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
        cout << "Callsign: "<< tb.GetCallsign()      << endl;
        cout << "Grid4   : "<< tb.GetGrid4()         << endl;
        cout << "PowerDbm: "<< (int)tb.GetPowerDbm() << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Encoded data
    ------------
    Callsign: 0Y6RLQ
    Grid4   : EI27
    PowerDbm: 33
    ```



### Decoding Example

!!! example "Example [minimal program](https://github.com/traquito/WsprEncoded/blob/main/test/app/TestAppDecodeSimple.cpp){:target="_blank"}"
    ```c++ linenums="1" title="TestAppDecodeSimple.cpp"
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Create Basic Telemetry object
        WsprMessageTelemetryBasic tb;

        // Set encoded fields
        tb.SetCallsign("0Y6RLQ");
        tb.SetGrid4("EI27");
        tb.SetPowerDbm(33);

        // Decode the data
        tb.Decode();

        // Extract the decoded telemetry
        cout << "Decoded data" << endl;
        cout << "------------" << endl;
        cout << "Grid56            : "<< tb.GetGrid56()                  << endl;
        cout << "AltitudeMeters    : "<< tb.GetAltitudeMeters()          << endl;
        cout << "TemperatureCelsius: "<< (int)tb.GetTemperatureCelsius() << endl;
        cout << "VoltageVolts      : "<< tb.GetVoltageVolts()            << endl;
        cout << "SpeedKnots        : "<< (int)tb.GetSpeedKnots()         << endl;
        cout << "GpsIsValid        : "<< tb.GetGpsIsValid()              << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Decoded data
    ------------
    Grid56            : XS
    AltitudeMeters    : 12360
    TemperatureCelsius: -28
    VoltageVolts      : 3.35
    SpeedKnots        : 72
    GpsIsValid        : 1
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

!!! example "Example [minimal program](https://github.com/traquito/WsprEncoded/blob/main/test/app/TestAppChannelMapSimple.cpp){:target="_blank"}"
    ```c++ linenums="1" title="TestAppChannelMapSimple.cpp"
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
        cout << "id13: " << cd.id13      << endl;
        cout << "min : " << (int)cd.min  << endl;
        cout << "freq: " << cd.freq      << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Channel Details for band 20m, channel 123
    id13: 06
    min : 4
    freq: 14097020
    ```


## Arduino

### Platform Compatibility

!!! success "Works on old and new IDE"
    | Platform   | IDE 1.8.19 | IDE 2.3.3 |
    |------------|------------|-----------|
    | RP2040     | Yes        | Yes       |
    | Atmega328p | No         | No        |

!!! note "Atmega328p is limited by the Arduino IDE itself"
    The Atmega328p can be programmed by C++20 and beyond, it is simply the compiler Arduino comes with which is the holdup.

    There are other ways to build code for Atmega328p, perhaps worth a try!

### Library Manager Support

!!! example "Install the library, and build its example code"
    ![](arduino_library_manager.png)


### Example program

!!! example "Example [program](https://github.com/traquito/WsprEncoded/blob/main/examples/WsprEncodedTest/WsprEncodedTest.ino){:target="_blank"}"
    ```c++ linenums="1" title="WsprEncodedTest.ino" 
    #include "WsprEncoded.h"

    /////////////////////////////////////////////////////////////////////
    // Testing Channel Detail Lookup
    /////////////////////////////////////////////////////////////////////

    void ReportChannelDetails(const char *band, uint16_t channel)
    {
        // Report the requested band and channel
        Serial.print("[Channel details for band ");
        Serial.print(band);
        Serial.print(", channel ");
        Serial.print(channel);
        Serial.print("]");
        Serial.println();

        // Look up channel details by band and channel
        WsprChannelMap::ChannelDetails cd = WsprChannelMap::GetChannelDetails(band, channel);

        // Report the channel details for the given band and channel    
        Serial.print("id1 : "); Serial.println(cd.id1);
        Serial.print("id3 : "); Serial.println(cd.id3);
        Serial.print("id13: "); Serial.println(cd.id13);
        Serial.print("min : "); Serial.println(cd.min);
        Serial.print("freq: "); Serial.println(cd.freq);
        Serial.println();
    }

    void TestLookupChannelDetails()
    {
        const char *band    = "20m";
        uint16_t    channel = 368;

        ReportChannelDetails(band, channel);
        Serial.println();
    }


    /////////////////////////////////////////////////////////////////////
    // Testing Message Encoding
    /////////////////////////////////////////////////////////////////////

    void ReportEncodeBasicTelemetry(const char *id13,
                                    const char *grid56,
                                    int32_t     altitudeMeters,
                                    int8_t      temperatureCelsius,
                                    double      voltageVolts,
                                    uint8_t     speedKnots,
                                    bool        gpsIsValid)
    {
        // Create the message encoder
        WsprMessageTelemetryBasic msg;

        // Set the telemetry fields
        msg.SetGrid56(grid56);
        msg.SetAltitudeMeters(altitudeMeters);
        msg.SetTemperatureCelsius(temperatureCelsius);
        msg.SetVoltageVolts(voltageVolts);
        msg.SetSpeedKnots(speedKnots);
        msg.SetGpsIsValid(gpsIsValid);

        // Set Encoding parameter
        msg.SetId13(id13);

        // Report the parameters passed, and if they got automatically clamped
        Serial.println("Encoded WSPR BasicTelemetry Type1 Message for:");
        Serial.print("id13      : input as  : "); Serial.println(id13);
        Serial.print("          : clamped to: "); Serial.println(msg.GetId13());
        Serial.print("grid56    : input as  : "); Serial.println(grid56);
        Serial.print("          : clamped to: "); Serial.println(msg.GetGrid56());
        Serial.print("altM      : input as  : "); Serial.println(altitudeMeters);
        Serial.print("          : clamped to: "); Serial.println(msg.GetAltitudeMeters());
        Serial.print("tempC     : input as  : "); Serial.println(temperatureCelsius);
        Serial.print("          : clamped to: "); Serial.println(msg.GetTemperatureCelsius());
        Serial.print("voltage   : input as  : "); Serial.println(voltageVolts);
        Serial.print("          : clamped to: "); Serial.println(msg.GetVoltageVolts());
        Serial.print("speedKnots: input as  : "); Serial.println(speedKnots);
        Serial.print("          : clamped to: "); Serial.println(msg.GetSpeedKnots());
        Serial.print("gpsValid  : input as  : "); Serial.println(gpsIsValid);
        Serial.print("          : clamped to: "); Serial.println(msg.GetGpsIsValid());
        Serial.println();

        // Do encoding
        msg.Encode();

        // Extract the WSPR Type1 Message fields from the encoder
        const char *callsign = msg.GetCallsign();
        const char *grid4    = msg.GetGrid4();
        uint8_t     powerDbm = msg.GetPowerDbm();

        // Report what the Type1 Message fields are
        Serial.print("callsign: "); Serial.println(callsign);
        Serial.print("grid4   : "); Serial.println(grid4);
        Serial.print("pwrDbm  : "); Serial.println(powerDbm);
        Serial.println();

        // Give a URL to check decoding at
        std::string url = "";
        url += "https://traquito.github.io/pro/decode/";
        url += "?decode=";
        url += callsign;
        url += "%20";
        url += grid4;
        url += "%20";
        url += std::to_string(powerDbm);
        url += "&encode=";

        Serial.print("Check decoding at: "); Serial.println(url.c_str());
        Serial.println();
    }

    void TestEncodeBasicTelemetry_NonClampedValues()
    {
        const char *id13               = "Q5";
        const char *grid56             = "JM";
        int32_t     altitudeMeters     = 5120;
        int8_t      temperatureCelsius = -5;
        double      voltageVolts       = 3.25;
        uint8_t     speedKnots         = 25;
        bool        gpsIsValid         = true;

        Serial.println("[Testing Non-Clamped Encoded Values]");
        ReportEncodeBasicTelemetry(id13, grid56, altitudeMeters, temperatureCelsius, voltageVolts, speedKnots, gpsIsValid);
    }

    void TestEncodeBasicTelemetry_ClampedValues()
    {
        const char *id13               = "Q5";
        const char *grid56             = "JM";
        int32_t     altitudeMeters     = 25000;
        int8_t      temperatureCelsius = 45;
        double      voltageVolts       = 5.6;
        uint8_t     speedKnots         = 96;
        bool        gpsIsValid         = true;

        Serial.println("[Testing Clamped Encoded Values]");
        ReportEncodeBasicTelemetry(id13, grid56, altitudeMeters, temperatureCelsius, voltageVolts, speedKnots, gpsIsValid);
    }

    void TestEncodeBasicTelemetry()
    {
        TestEncodeBasicTelemetry_NonClampedValues();
        Serial.println();
        
        TestEncodeBasicTelemetry_ClampedValues();
        Serial.println();
    }


    /////////////////////////////////////////////////////////////////////
    // Setup and Loop logic
    /////////////////////////////////////////////////////////////////////

    void setup()
    {
        Serial.begin(9600);
    }

    void loop()
    {
        Serial.println("--------------");
        Serial.println("Start of tests");
        Serial.println("--------------");
        Serial.println();

        TestLookupChannelDetails();
        TestEncodeBasicTelemetry();

        Serial.println();

        delay(5000);
    }
    ```

!!! quote "Output"
    ```
    --------------
    Start of tests
    --------------

    [Channel details for band 20m, channel 368]
    id1 : 1
    id3 : 8
    id13: 18
    min : 4
    freq: 14097060

    [Testing Non-Clamped Encoded Values]
    Encoded WSPR BasicTelemetry Type1 Message for:
    id13      : input as  : Q5
              : clamped to: Q5
    grid56    : input as  : JM
              : clamped to: JM
    altM      : input as  : 5120
              : clamped to: 5120
    tempC     : input as  : -5
              : clamped to: -5
    voltage   : input as  : 3.25
              : clamped to: 3.25
    speedKnots: input as  : 25
              : clamped to: 25
    gpsValid  : input as  : 1
              : clamped to: 1

    callsign: QD5WPK
    grid4   : IR39
    pwrDbm  : 47

    Check decoding at: https://traquito.github.io/pro/decode/?decode=QD5WPK%20IR39%2047&encode=


    [Testing Clamped Encoded Values]
    Encoded WSPR BasicTelemetry Type1 Message for:
    id13      : input as  : Q5
              : clamped to: Q5
    grid56    : input as  : JM
              : clamped to: JM
    altM      : input as  : 25000
              : clamped to: 21340
    tempC     : input as  : 45
              : clamped to: 39
    voltage   : input as  : 5.60
              : clamped to: 4.95
    speedKnots: input as  : 96
              : clamped to: 82
    gpsValid  : input as  : 1
              : clamped to: 1

    callsign: QD5XUP
    grid4   : RK54
    pwrDbm  : 43

    Check decoding at: https://traquito.github.io/pro/decode/?decode=QD5XUP%20RK54%2043&encode=
    ```



## CMake Integration

### Using CMake FetchContent

!!! note "Coming soon"


### Using Git Submodules

!!! note "Coming soon"


### From Outside Your Project

!!! example "Integrate WsprEncoded library from outside your build tree"
    Reference the library from your project.<br/>
    (The below assumes the WsprEncoded folder is at the same directory level as your project).

    ```cmake title="CMakeLists.txt"
    add_executable(YourExecutable main.cpp)
    target_link_libraries(YourExecutable libWsprEncoded)

    add_subdirectory(../WsprEncoded WSPR_ENCODED)
    ```
