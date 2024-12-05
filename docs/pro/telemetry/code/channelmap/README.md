---
icon: material/code-array
---

# Channel Map API

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

