---
icon: material/chart-box-plus-outline
---

# Extended Telemetry

## Overview

!!! info "This is a proposal for the structure and behavior of Extended Telemetry"
    The goal is to define an enhancement to the current scheme by:

    - Retaining full backward-compatibility
    - Clearly defining new features and implementation specifics
    - Creating a code implementation meant to be used across trackers for common data encoding
    - Being open to community development and shared investment

!!! success "Improvements with the Extended Telemetry scheme"
    - 16 New Telemetry Message Types
        - Including user-defined
        - Future growth path beyond 16 messages
    - Send up to 4 Extended Telemetry messages per 10-min window
        - Use of Basic Telemetry message optional
        - No rigid send sequence
        - No clash potential with other senders
    - Wider support of field ranges via use of single `big number`
        - Single field size max of 29.5 bits
    - Defined clamping behavior
    - Defined rounding behavior
    - Extensible already-defined message types


## Improvements

### 16 New Telemetry Message Types

!!! info "Types"
    - 14 Enumerated types, to be defined and standardized
        - eg a GPS stats message
    - 1 User-Defined type, for testing
    - 1 RESERVED type

!!! info "See [Message Fields (Per-Type)](#message-fields-per-type) for more details"


### Send up to 4 Extended Telemetry messages per 10-min window

#### Use of Basic Telemetry message optional

Extended Telemetry can be sent during the time slot the Basic Telemetry is currently sent in.

This allows for more Extended Telemetry messages to be sent during a given 10-min window.

!!! info "See [Time Slot Behavior](#time-slot-behavior) for more details"

#### No rigid send sequence

There are different types of Extended Telemetry messages. They can be sent in any order, at any time.

!!! info "See [Time Slot Behavior](#time-slot-behavior) for more details"

#### No clash potential with other senders

Additional data in each Extended Telemetry message identifies the message as being yours.

!!! info "See [HdrSlot](#hdrslot) for more more details"

!!! info "See [Time Slot Behavior](#time-slot-behavior) for more details"

### Wider support of field ranges via use of single `big number`

Basic Telemetry segments its `big number` encoding process into two operations, targeting specific fields in the WSPR message.

Extended Telemetry uses a different encoding algorithm that ultimately allows encoded fields to span all the fields of the WSPR message, up to and including a single encoded field of size 29.5 bits.

!!! info "See [Additional Encoding Details](#additional-encoding-details) for more details"

### Defined Clamping Behavior

No Rollover. All values clamped before encoding.

### Defined Rounding Behavior

Field index values shall be rounded to the closest index value in range when being calculated.

### Extensible Message Types

If a message can support 5 fields, but you define 1, you can add 4 additional fields later on and the values in the 1st field remain readable in historical data.

!!! info "See [Additional Encoding Details](#additional-encoding-details) for more details."


## Message Structure

!!! info "The structure of Extended Telemetry messages falls into two categories"
    - Header fields (common structure to all Extended Telemetry messages)
    - Message fields (distinct structure to each HdrType of Extended Telemetry message)

### Header Fields (Common)

!!! note "Header fields specified in unpack order (ie, unpack from `big number` order)."

!!! info "Header Fields common to all Extended Telemetry message types"
    | FieldName        | Unit | LowValue | HighValue | StepSize | # Values |
    |------------------|------|----------|-----------|----------|----------|
    | HdrTelemetryType | Enum | 0        | 1         | 1        | 2        |
    | HdrRESERVED      | Enum | 0        | 3         | 1        | 4        |
    | HdrSlot          | Enum | 0        | 3         | 1        | 4        |
    | HdrType          | Enum | 0        | 15        | 1        | 16       |


#### HdrTelemetryType

!!! info "HdrTelemetryType"
    Defined as `0 = Extended Telemetry`.

#### HdrRESERVED

!!! info "HdrRESERVED"
    Must be set to `0b00`.

#### HdrSlot

!!! info "HdrSlot"
    Set default value to be `0b00`.

    Used to identify this Extended Telemetry message as tied back to the sender of the Type 1 message.

    This field can take 4 possible values `0-3`.

    These values correspond to the 4 time slots that follow the Type 1 message in a given 10-min window.

    If an Extended Telemetry message is sent in the first slot after the Type 1 message, where the Basic Telemetry message is currently sent, this is slot 0.

    Each subsequent slot has an incrementally larger number.
    

!!! tip "See [Time Slot Behavior](#time-slot-behavior) for more details"


#### HdrType

!!! info ""
    Set default value to be `0b0000`.

    This field is set to the value of the enumerated type of Extended Telemetry message.

    Extended Telemetry messages need to be defined and assigned a number to be used in this field in order for receivers to know how to decode the telemetry within.

    | HdrType | Type         | Notes                                                                  |
    |---------|--------------|------------------------------------------------------------------------|
    | 0       | User-Defined | No defined structure beyond header. Useful for testing, one-offs, etc. |
    | ...     |              |                                                                        |
    | 15      | RESERVED     | Reserved for future use.                                               |




### Message Fields (Per-Type)

The goal is to have an enumerated list of well-defined Extended Telemetry messages which can be implemented consistently across trackers.

For each Enumerated Extended Telemetry message type, there would be a set of defined Message Fields specific to that message.


#### Example Enumerated Message Types

!!! example "Here is a hypothetical example of how a list of enumerated types could be captured and grown."
    | HdrType | Type              | Notes                                                                  |
    |---------|-------------------|------------------------------------------------------------------------|
    | 0       | User-Defined      | No defined structure beyond header. Useful for testing, one-offs, etc. |
    | 1       | Basic Telemetry 2 | Extended ranges and higher-res version of Basic Telemetry.             |
    | 2       | GPS Stats         | Capture stats about GPS behavior or conditions.                        |
    | ...     |                   |                                                                        |
    | 15      | RESERVED          | Reserved for future use.                                               |



#### Example Message - GPS Stats

!!! note "This is just a hypothetical example for illustration purposes."

!!! example "GPS Stats Extended Telemetry message Field Definitions."
    | Field      | Unit  | LowValue | HighValue | StepSize | # Values |
    |------------|-------|----------|-----------|----------|----------|
    | SatsUSA    | Count | 0        | 128       | 4        | 33       |
    | SatsChina  | Count | 0        | 128       | 4        | 33       |
    | SatsRussia | Count | 0        | 128       | 4        | 33       |
    | SatsEU     | Count | 0        | 128       | 4        | 33       |
    | SatsIndia  | Count | 0        | 128       | 4        | 33       |
    | hdop       | Value | 0        | 10        | 2        | 6        |

!!! info "Analysis."
        Encodable Bits Available: 29.50
        Encodable Bits Used     : 27.81 ( 94.26 %)
        Encodable Bits Remaining:  1.69 (  5.74 %)
        
        Field         # Values    # Bits    % Used
        ------------------------------------------
        SatsUSA             33      5.04     17.10
        SatsChina           33      5.04     17.10
        SatsRussia          33      5.04     17.10
        SatsEU              33      5.04     17.10
        SatsIndia           33      5.04     17.10
        hdop                 6      2.58      8.76



#### Defining New Extended Telemetry Message Types

!!! tip "Use the <a href="/pro/codec/?codec=%7B%20%22name%22%3A%20%22SatsUSA%22%2C%20%20%20%20%20%20%22unit%22%3A%20%22Count%22%2C%20%20%22lowValue%22%3A%20%20%200%2C%20%22highValue%22%3A%20128%2C%20%20%20%20%22stepSize%22%3A%204%20%7D%2C%0A%7B%20%22name%22%3A%20%22SatsChina%22%2C%20%20%20%20%22unit%22%3A%20%22Count%22%2C%20%20%22lowValue%22%3A%20%20%200%2C%20%22highValue%22%3A%20128%2C%20%20%20%20%22stepSize%22%3A%204%20%7D%2C%0A%7B%20%22name%22%3A%20%22SatsRussia%22%2C%20%20%20%22unit%22%3A%20%22Count%22%2C%20%20%22lowValue%22%3A%20%20%200%2C%20%22highValue%22%3A%20128%2C%20%20%20%20%22stepSize%22%3A%204%20%7D%2C%0A%7B%20%22name%22%3A%20%22SatsEU%22%2C%20%20%20%20%20%20%20%22unit%22%3A%20%22Count%22%2C%20%20%22lowValue%22%3A%20%20%200%2C%20%22highValue%22%3A%20128%2C%20%20%20%20%22stepSize%22%3A%204%20%7D%2C%0A%7B%20%22name%22%3A%20%22SatsIndia%22%2C%20%20%20%20%22unit%22%3A%20%22Count%22%2C%20%20%22lowValue%22%3A%20%20%200%2C%20%22highValue%22%3A%20128%2C%20%20%20%20%22stepSize%22%3A%204%20%7D%2C%0A%7B%20%22name%22%3A%20%22hdop%22%2C%20%20%20%20%20%20%20%20%20%22unit%22%3A%20%22Count%22%2C%20%20%22lowValue%22%3A%20%20%200%2C%20%22highValue%22%3A%20%2010%2C%20%20%20%20%22stepSize%22%3A%202%20%7D%2C&decode=&encode=" target="_blank">Extended Telemetry playground</a> to try new message structures."


## Additional Encoding Details

### Packing `big number`

Messages are packed into the `big number` in reverse order from their definition. Header fields are packed in reverse order from their description above.

!!! example "Illustration using the GPS Stats message above"
    The GPS Stats message defines:

    - SatsUSA
    - SatsChina
    - SatsRussia
    - SatsEU
    - SatsIndia
    - hdop

    The header fields are:

    - HdrTelemetryType
    - HdrRESERVED
    - HdrSlot
    - HdrType

    The packing into `big number` is in this order:

    - hdop
    - SatsIndia
    - SatsEU
    - SatsRussia
    - SatsChina
    - SatsUSA
    - HdrType
    - HdrSlot
    - HdrRESERVED
    - HdrTelemetryType

### Callsign Characters 1 and 3

!!! note "Callsign characters 1 and 3 are not used for data encoding"
    Extended Telemetry is encoded into the [Type 1 Message Format](../README.md#type-1-message-format), except for the Callsign characters 1 and 3.

    See [Channels](../channels/README.md) for details on use of characters 1 and 3.


## Time Slot Behavior

Extended Telemetry operates within the established 10-min window.

Below is a description of how the Extended Telemetry changes the message types sent within the 10-min window in a backward-compatible way.


### 10-Minute Schedule Framework

This is the current pattern for when to send the Type 1 message in a repeating 10-min window.

| start minute   | + 2 min | + 4 min | + 6 min | + 8 min |
|----------------|---------|---------|---------|---------|
| Regular Type 1 | -       | -       | -       | -       |


### Including Basic Telemetry

This is the current pattern for when to send the Basic Telemetry message in relation to the Type 1 message in a repeating 10-min window.

| start minute   | + 2 min         | + 4 min | + 6 min | + 8 min |
|----------------|-----------------|---------|---------|---------|
| Regular Type 1 | Basic Telemetry | -       | -       | -       |


### Including Basic and/or Extended Telemetry

The `[Ext Telemetry]` notation means that an Extended Telemetry message can be sent in that slot, but is not required to be.

!!! note "Any HdrType type of Extended Telemetry can be sent at any time `[Ext Telemetry]` is specified."

#### Including Basic and Extended Telemetry

| start minute   | + 2 min         | + 4 min           | + 6 min           | + 8 min           |
|----------------|-----------------|-------------------|-------------------|-------------------|
| Regular Type 1 | Basic Telemetry | \[Ext Telemetry\] | \[Ext Telemetry\] | \[Ext Telemetry\] |

#### Replacing Basic with Extended Telemetry

| start minute   | + 2 min           | + 4 min           | + 6 min           | + 8 min           |
|----------------|-------------------|-------------------|-------------------|-------------------|
| Regular Type 1 | \[Ext Telemetry\] | \[Ext Telemetry\] | \[Ext Telemetry\] | \[Ext Telemetry\] |


### Extended Telemetry Schedule Specifics

!!! info "Extended Telemetry slot rules"
    Extended Telemetry:

    - Can be sent in any slot other than the start minute
    - Does not always have to be sent in the same slot
    - Can replace Basic Telemetry sometimes and other times not
    - Can NOT send the same HdrType Extended Telemetry message more than once in a 10-min window

!!! example "These are all valid send sequences"
    | start minute   | + 2 min         | + 4 min       | + 6 min       | + 8 min       |
    |----------------|-----------------|---------------|---------------|---------------|
    | Regular Type 1 | Basic Telemetry | -             | -             | -             |
    | Regular Type 1 | Basic Telemetry | Ext Telemetry | -             | -             |
    | Regular Type 1 | Basic Telemetry | -             | Ext Telemetry | -             |
    | Regular Type 1 | Basic Telemetry | Ext Telemetry | Ext Telemetry | Ext Telemetry |
    | Regular Type 1 | Ext Telemetry   | -             | -             | -             |
    | Regular Type 1 | Ext Telemetry   | -             | Ext Telemetry | -             |
    | Regular Type 1 | Ext Telemetry   | Ext Telemetry | Ext Telemetry | Ext Telemetry |
    | Regular Type 1 | -               | -             | -             | -             |
    | Regular Type 1 | -               | -             | -             | Ext Telemetry |



## Code

See [Programming Library](../code/README.md#programming-library) for implementation.


