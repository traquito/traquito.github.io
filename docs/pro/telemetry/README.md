---
icon: material/chart-box-multiple-outline
---

# WSPR Telemetry

## Overview

Trackers are able to send a useful amount of telemetry data despite the extremely minimal data-transfer abilities of the WSPR protocol.

This is accomplished by disguising the telemetry data as other types of data.

This process is Encoding.


## Transmission Problem

!!! info "The WSPR protocol defines only 3 message types, amounting to 50 bits of data each"
    - Type 1: <callsign\> <grid\> <power\>
    - Type 2: <callsign_long\> <power\>
    - Type 3: <callsign_hash\> <grid_long\> <power\>

These messages do not directly support arbitrary telemetry transfer.


## Solution - Encoding

Encoding is the process of taking telemetry, eg Altitude, and changing it into a form which can be transmitted through the WSPR protocol.

The encoded data is then sent as a WSPR Message, received, and Decoded, which results in the receiver acquiring the previously-encoded telemetry.

!!! note "For technical reasons, the WSPR Type 1 message is used for this purpose."


## Telemetry Field Packing

The specific encoding/decoding technique relies on multiple different techniques, applied sequentially.

The encoding process takes place in multiple stages. Decoding reverses those operations in the opposite sequence.

The subsections below walk through these stages.

The processes described below only introduce the techniques applied in encoding, and do not spell out the precise technical specifics required to encode or decode.


### Measurement Compaction Stage

!!! question "In what ways are measurements of Altitude and Voltage the same as one another?"
    They both have:

    - Units
    - Measurement resolution
    - Ranges you can expect to measure within

!!! example "Altitude measurement definition example"
    Let's define measuring Altitude to be deciding:

    - Units = Meters
    - Resolution = 20m
    - Range = 0 to 100m

    With this definition, you know you have `6` possible measurements `(0, 20, 40, 60, 80, 100)`.

!!! example "Compaction example"
    The computer representation of the Altitude value `100` takes `7` bits, 14% of your bit budget.

    Consider instead using an index into that list of possible measurements:


    |     |     |     |     |     |     |     |
    | --- | --- | --- | --- | --- | --- | --- |
    | index | `0` |  `1` |  `2` |  `3` |  `4` |   `5` |
    | value | `0` | `20` | `40` | `60` | `80` | `100` |

    By transmitting instead the index, now the highest value you would need to transmit is `5`, taking `3` bits, which takes 6% of your bit budget.

    14% to 6% is a good savings.

    The reverse of the above, for decoding a value, is hopefully clear.


### Conversion to `big number` Stage

The following packing operation saves space at the expense of clarity, which works great if you never have to look at it.

!!! example "Packing values into a `big number`, and restoring them after"
    Let's say there are two index numbers, A and B.

    A has a range of 0-20 (range of 21 values), and a value of 15.<br/>
    B has a range of 0-6 (range of 7 values), and a value of 4.

    Can we combine them into a single number C? (yes)

    C = 0

    C = C * 21  // multiply by # of values A can take<br/>
    C = C + A   // add A

    C = C * 7   // multiply by # of values B can take<br/>
    C = C + B   // add B

    C now equals 109.
    
    If we only have C, have we lost the values of A and B? (no).<br/>
    We can get them back if we know:

    - The range of values of A and B
    - The order that we combined A and B together

    Let's extract A's value into AA and B's value into BB to prove it.<br/>
    But we have to do the operations in reverse.

    BB = C % 7 // get the remainder after dividing by # of values B can take<br/>
    C = C / 7  // divide away from C the # of values B can take

    AA = C % 20 // get the remainder after dividing by # of values A can take<br/>
    C = C / 20  // divide away from C the # of values A can take

    AA now equals A (which is 15).<br/>
    BB now equals B (which is 4).

    You can give A and B any value in their range and this process will work.

The above allows you to combine any arbitrary number of values, of different ranges, into a single `big number`.


### Converting the `big number` into a WSPR Message Stage

#### Type 1 Message Format

To encode our telemetry into a WSPR message, we first need to look at our target message format.

!!! info "WSPR Type 1 Message Format"
    | Type 1 Field | Legal Values | \# Values |
    | --- | --- | --- |
    | Callsign 1 | 0,1,Q | 3   |
    | Callsign 2 | 0-9,A-Z | 36  |
    | Callsign 3 | 0-9 | 10  | 
    | Callsign 4 | A-Z,space | 27  |
    | Callsign 5 | A-Z,space | 27  |
    | Callsign 6 | A-Z,space | 27  |
    | Grid 1 | A-R | 18  | 
    | Grid 2 | A-R | 18  | 
    | Grid 3 | 0-9 | 10  | 
    | Grid 4 | 0-9 | 10  | 
    | Power | ... | 19  |

!!! note "Note the definition of field `Grid 2` and `Grid 3`"
    We see `Grid 2` has `18` values we can use, in the range `A-R`.<br/>
    We see `Grid 3` has `10` values we can use, in the range `0-9`.


#### Converting to WSPR Message

!!! example "Converting the `big number` into a WSPR message"
    We saw above that C was able to be restored back into A and B's original values. This was done by knowing the original range of values of A and B.

    We can instead, for transmission, encode C into the fields of the WSPR message.

    Remember the fields `Grid 2` with range of `A-R` (18 values) and `Grid 3` with range of `0-9` (10 values).

    The A range of 0-21 (22 values) cannot fit in `Grid 2` or `Grid 3` alone.

    Using only our `big number` C value of 109, we can spread A and B across `Grid 2` and `Grid 3` in a way where the values of the input A and B are preserved.

    By knowing the range of `Grid 2` and `Grid 3` we can map to them. G2 is short for `Grid 2` and G3 is short for `Grid 3`.

    G2 = C % 18 // get the remainder after dividing by # of values `Grid 2` can take<br/>
    C = C / 18 // divide away from C the # of values `Grid 2` can take

    G3 = C % 10 // get the remainder after dividing by # of values `Grid 3` can take<br/>
    C = C / 10 // divide away from C the # of values `Grid 3` can take

    G2 and G3 now are index values into their range of values.<br/>
    G2 now equals 1 (letter `B`)<br/>
    G3 now equals 6 (number `6`).

    If we only have the WSPR Message fields `Grid 2` and `Grid 3`, can we restore the value of C?<br/>(yes, with the same technique as we did to restore A and B).

    Let's extract `Grid 2` and `Grid 3`'s values into CC to prove it.

    This is performed in the mathematically reverse order of the operations to get here.

    CC = 0

    CC = CC * 10    // multiply by the number of values `Grid 3` can take<br/>
    CC = CC + G3    // add the `Grid 2` value

    CC = CC * 18    // multiply by the number of values `Grid 2` can take<br/>
    CC = CC + G2    // add the `Grid 3` value

    CC now equals C (which is 109).<br/>
    We have recovered our `big number`, which means A and B can be restored (decoded) as well.



### Telemetry Encoding Sequence

```mermaid
graph LR

Measure[Telemetry<br/>Measurements] --> MC[Measurement<br/>Compaction]
MC --> BN[Big<br/>Number]
BN --> WSPR[Convert<br/>to WSPR]
WSPR --> Send
```


## Basic Telemetry



## Extended Telemetry


