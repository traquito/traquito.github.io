---
icon: material/code-array
---

# User Defined Telemetry API

## API for Extended Telemetry - User Defined

### Overview

!!! warning "Read the documentation carefully"
    This library is flexible. So flexible, in fact, that you may use it incorrectly.


!!! info "Background"
    A core feature of Extended Telemetry is that data is sent structured, and that well-known enumerated types can be added over time.

    However, prototyping and experimentation by developers is key.

    So, baked into Extended Telemetry is a well-known "User-Defined" message type, which only stipulates that the data not clash with all other Extended Telemetry.
    
    No other structure is defined, and transmitters are free to send what they want, when they want.

    This library makes that work.


!!! info "API Background"
    This library makes sending structured encoded data easy by providing an API which lets you:

    - Define the data you want to send
    - Then extract the encoded form of that data
        - Without ever seeing the internals

    It "just works" when used correctly.


!!! info "Gotchas"
    - This is a template class, where you specify the number of fields you want to encode
        - The library has return values which indicate if you overflow, or other errors, but you have to actually check them
    - There is a limited 29.178 bits of encodable space in the message
        - The compaction scheme is very efficient, but you can run out without realizing if you don't check the return codes on the API functions
    - The instantiated memory size of of the codec is proportional to the number of fields in the template parameter
        - Baseline of around 300 bytes
        - Plus each new field is an additional 56 bytes
            - 5 fields is nearly 600 bytes.
            - 10 fields is nearly 900 bytes.
    - Accessing fields is done by a c-string field name
        - It is easy to typo these, and the compiler will have no way of warning you
        - A best practice is to set up a set of a `const char *fieldNameLabel` variables and use them everywhere as field name so you don't mess it up
    - Not checking return values (as stated above)
    - Changing the encoding of a message later (totally fine), just be aware that:
        - Any previously-sent messages can only be decoded using the schema that was in use when they were sent

!!! success "You can decode any messages you create online, also, at the [Extended Telemetry playground](../../extended/playground/README.md)"

### API Guide

!!! quote "API Guide"
    ```c++ linenums="1"
    /////////////////////////////////////////////////////////////////
    // This is a template class, you must specify the number of
    // fields you intend to work with.
    //
    // The maximum theoretical number of fields is 29 1-bit fields.
    //
    // The total bitspace to configure fields within is 29.178 bits.
    /////////////////////////////////////////////////////////////////
    template <uint8_t FIELD_COUNT = 29>
    class WsprMessageTelemetryExtendedUserDefined
    {
    public

        // Reset field values, but not field definitions
        void Reset();


        // Reset field definitions and values
        void ResetEverything();


        /////////////////////////////////////////////////////////////////
        // User-Defined Field Definitions, Setters, Getters
        /////////////////////////////////////////////////////////////////

        // Set up this object to know about named fields with a given
        // numeric range and resolution (step size)
        //
        // Values will be clamped between lowValue - highValue, inclusive.
        // Negative, zero, positive, and decimal values are all supported.
        // 
        // See Set() for details on rounding.
        //
        // The initial value of a defined field will be the specified lowValue
        //
        // Returns true if field is accepted
        // Returns false if field is rejected
        //
        // A field will be rejected due to:
        // - The template-specified number of fields have already been configured
        // - The field name is a nullptr
        // - The field already exists
        // - lowValue, highValue, or stepSize is too precise (more than 3 decimal places of precision)
        // - lowValue >= highValue
        // - stepSize <= 0
        // - The stepSize does not evenly divide the range between lowValue and highValue
        // - The field size exceeds the sum total capacity of 29.178 bits along with other fields
        //   or by itself
        bool DefineField(const char *fieldName,
                         double      lowValue,
                         double      highValue,
                         double      stepSize);


        // Set the value of a configured field.
        //
        // The value parameter is a double to make accepting a wide range
        // of values easily settable, even if you do not intend to use
        // a floating point number.
        //
        // A value that is set is retained internally at that precise value,
        // and will be returned at that value with a subsequent Get().
        // 
        // When a field is encoded, the encoded wspr data will contain the
        // encoded value, which itself is rounded to the precision specified
        // in the field definition.
        //
        // Returns true on success.
        // Returns false on error.
        //
        // An error will occur when:
        // - The field is not defined
        bool Set(const char *fieldName, double value);


        // Get the value of a configured field.
        // 
        // When a field is Set() then Get(), the value which was Set()
        // will be returned by Get().
        //
        // When a Decode() operation occurs, the decoded values are overwritten
        // onto the field values, and will become the new value which is
        // returned by Get().
        //
        // Returns the field value on success.
        // Returns NAN on error.
        // - You must use std::isnan() to check for NAN, you cannot compare via == NAN
        //
        // An error will occur when:
        // - The field is not defined
        double Get(const char *fieldName);


        /////////////////////////////////////////////////////////////////
        // User-Defined Field Definitions, Setters, Getters
        /////////////////////////////////////////////////////////////////

        // Read the default HdrTelemetryType, or, read the value
        // which was set from Decode().
        uint8_t GetHdrTelemetryType();


        // Read the default HdrRESERVED, or, read the value
        // which was set from Decode().
        uint8_t GetHdrRESERVED();


        // Set the Extended Telemetry HdrSlot value.
        //
        // This field associates the encoded telemetry with the sender.
        //
        // In a given repeating 10-minute cycle, starting on the
        // start minute, which is the 0th minute, the slots are defined
        // as:
        // - start minute = slot 0
        // - +2 min       = slot 1
        // - +4 min       = slot 2
        // - +6 min       = slot 3
        // - +8 min       = slot 4
        void SetHdrSlot(uint8_t val);


        // Read the default HdrSlot, the previously SetHdrSlot() slot number,
        // or, read the slot number which was set from Decode().
        uint8_t GetHdrSlot();


        /////////////////////////////////////////////////////////////////
        // Encode / Decode
        /////////////////////////////////////////////////////////////////

        // Encode the values of the defined fields into a set of
        // encoded WSPR Type 1 message fields (callsign, grid4, powerDbm).
        // This overwrites the Type 1 message fields.
        //
        // The functions GetCallsign(), GetGrid4(), and GetPowerDbm() will
        // subsequently return the encoded values for those fields.
        void Encode();


        // Decode the values of the WSPR Type 1 message fields that were
        // set by using SetCallsign(), SetGrid4(), and SetPowerDbm().
        // This overwrites every defined field value and header field value.
        //
        // Returns true on success.
        // Returns false on error.
        //
        // An error will occur when:
        // - The HdrTelemetryType is not ExtendedTelemetry
        // - The HdrRESERVED is not 0
        //
        // Even when Decode returns an error, Get() will still return the
        // field and header values which were decoded.
        //
        // The decoded field values are stored internally and are retrieved
        // by using Get().
        bool Decode()
    };
    ```


### Encoding Example

!!! example "Example [minimal program](https://github.com/traquito/WsprEncoded/blob/main/test/app/TestAppEncodeUserDefinedSimple.cpp){:target="_blank"}"
    ```c++ linenums="1" title="TestAppEncodeUserDefinedSimple.cpp"
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Create User-Defined Telemetry object for the number of
        // fields you want, maximum of 29 1-bit fields possible.
        WsprMessageTelemetryExtendedUserDefined<5> codecGpsMsg;

        /////////////////////////////////////////////////////////////////
        // Define telemetry fields
        /////////////////////////////////////////////////////////////////

        // Define counts of GPS satellites for each constellation type.
        // Values will be clamped between 0 - 128 inclusive.
        // Resolution will be in increments of 4.
        codecGpsMsg.DefineField("SatCountUSA",    0, 128, 4);
        codecGpsMsg.DefineField("SatCountChina",  0, 128, 4);
        codecGpsMsg.DefineField("SatCountRussia", 0, 128, 4);

        // Define a metric for GPS lock times, in seconds.
        // Values will be clamped between 0 - 30 inclusive.
        // Resolution will be in increments of 0.5.
        codecGpsMsg.DefineField("LockTimeSecs",    0, 30, 0.5);
        codecGpsMsg.DefineField("LockTimeSecsAvg", 0, 30, 0.5);


        /////////////////////////////////////////////////////////////////
        // Set fields (based on GPS data sourced elsewhere)
        /////////////////////////////////////////////////////////////////

        codecGpsMsg.Set("SatCountUSA",    12);
        codecGpsMsg.Set("SatCountChina",  10);      // rounded to 12   into encoded data on Encode()
        codecGpsMsg.Set("SatCountRussia",  0);

        codecGpsMsg.Set("LockTimeSecs",    10.74);  // rounded to 10.5 into encoded data on Encode()
        codecGpsMsg.Set("LockTimeSecsAvg", 12.76);  // rounded to 13   into encoded data on Encode()


        /////////////////////////////////////////////////////////////////
        // Look up channel details for use in encoding
        /////////////////////////////////////////////////////////////////

        // Configure band and channel
        const char *band    = "20m";
        uint16_t    channel = 123;

        // Get channel details
        WsprChannelMap::ChannelDetails cd = WsprChannelMap::GetChannelDetails(band, channel);


        /////////////////////////////////////////////////////////////////
        // Take note of which transmission slot you will send in
        // for use in encoding
        /////////////////////////////////////////////////////////////////

        // this is just an example, you will need to know this based on
        // the behavior of your tracker
        uint8_t slot = 2;


        /////////////////////////////////////////////////////////////////
        // Encode the data in preparation to transmit
        /////////////////////////////////////////////////////////////////

        codecGpsMsg.SetId13(cd.id13);   // "06"
        codecGpsMsg.SetHdrSlot(slot);
        codecGpsMsg.Encode();


        /////////////////////////////////////////////////////////////////
        // Extract the now-encoded WSPR message fields
        /////////////////////////////////////////////////////////////////

        const char *callsign = codecGpsMsg.GetCallsign();   // "036KVF"
        const char *grid4    = codecGpsMsg.GetGrid4();      // "PP73"
        int         powerDbm = codecGpsMsg.GetPowerDbm();   // 30

        cout << "Encoded data"          << endl;
        cout << "------------"          << endl;
        cout << "Callsign: "<< callsign << endl;
        cout << "Grid4   : "<< grid4    << endl;
        cout << "PowerDbm: "<< powerDbm << endl;

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Encoded data
    ------------
    Callsign: 036KVF
    Grid4   : PP73
    PowerDbm: 30
    ```



### Decoding Example

!!! example "Example [minimal program](https://github.com/traquito/WsprEncoded/blob/main/test/app/TestAppDecodeUserDefinedSimple.cpp){:target="_blank"}"
    ```c++ linenums="1" title="TestAppDecodeUserDefinedSimple.cpp"
    #include <cstdint>
    #include <iostream>
    using namespace std;

    #include "WsprEncoded.h"


    int main()
    {
        // Create User-Defined Telemetry object for the number of
        // fields you want, maximum of 29 1-bit fields possible.
        WsprMessageTelemetryExtendedUserDefined<5> codecGpsMsg;

        /////////////////////////////////////////////////////////////////
        // Define telemetry fields
        /////////////////////////////////////////////////////////////////

        // Define counts of GPS satellites for each constellation type.
        // Values will be clamped between 0 - 128 inclusive.
        // Resolution will be in increments of 4.
        codecGpsMsg.DefineField("SatCountUSA",    0, 128, 4);
        codecGpsMsg.DefineField("SatCountChina",  0, 128, 4);
        codecGpsMsg.DefineField("SatCountRussia", 0, 128, 4);

        // Define a metric for GPS lock times, in seconds.
        // Values will be clamped between 0 - 30 inclusive.
        // Resolution will be in increments of 0.5.
        codecGpsMsg.DefineField("LockTimeSecs",    0, 30, 0.5);
        codecGpsMsg.DefineField("LockTimeSecsAvg", 0, 30, 0.5);


        /////////////////////////////////////////////////////////////////
        // Get encoded WSPR message fields (sourced elsewhere)
        /////////////////////////////////////////////////////////////////

        codecGpsMsg.SetCallsign("036KVF");
        codecGpsMsg.SetGrid4("PP73");
        codecGpsMsg.SetPowerDbm(30);


        /////////////////////////////////////////////////////////////////
        // Decode
        /////////////////////////////////////////////////////////////////

        codecGpsMsg.Decode();


        /////////////////////////////////////////////////////////////////
        // Extract the now-decoded WSPR message fields
        /////////////////////////////////////////////////////////////////

        int satCountUsa    = codecGpsMsg.Get("SatCountUSA");
        int satCountChina  = codecGpsMsg.Get("SatCountChina");
        int satCountRussia = codecGpsMsg.Get("SatCountRussia");

        double lockTimeSecs    = codecGpsMsg.Get("LockTimeSecs");
        double lockTimeSecsAvg = codecGpsMsg.Get("LockTimeSecsAvg");

        cout << "Encoded data"                         << endl;
        cout << "------------"                         << endl;
        cout << "satCountUsa    : " << satCountUsa     << endl; // 12
        cout << "satCountChina  : " << satCountChina   << endl; // 12
        cout << "satCountRussia : " << satCountRussia  << endl; // 0
        cout << "lockTimeSecs   : " << lockTimeSecs    << endl; // 10.5
        cout << "lockTimeSecsAvg: " << lockTimeSecsAvg << endl; // 13

        return 0;
    }
    ```

!!! quote "Output"
    ```
    Encoded data
    ------------
    satCountUsa    : 12
    satCountChina  : 12
    satCountRussia : 0
    lockTimeSecs   : 10.5
    lockTimeSecsAvg: 13
    ```

