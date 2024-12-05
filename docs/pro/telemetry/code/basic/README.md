---
icon: material/code-array
---

# Basic Telemetry API

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

