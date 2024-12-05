---
icon: material/chart-box-outline
---

# Basic Telemetry

## Overview

This page describes the Basic Telemetry encoded WSPR message.

The goal is to document the encoding process and idiosyncrasies involved in processing these messages.


## Message Fields

!!! info "Fields of Basic Telemetry"
    | FieldName        | Unit    | LowValue | HighValue | StepSize | \# Values |
    |------------------|---------|----------|-----------|----------|-----------|
    | Grid5            | Char    | 0        | 23        | 1        | 24        |
    | Grid6            | Char    | 0        | 23        | 1        | 24        |
    | Altitude         | Meters  | 0        | 21,340    | 20       | 1068      |
    | Temperature      | Celsius | \-50     | 39        | 1        | 90        |
    | Voltage          | Volts   | 2        | 3.95      | 0.05     | 40        |
    | Speed            | Knots   | 0        | 82        | 2        | 42        |
    | IsGpsValid       | Bool    | 0        | 1         | 1        | 2         |
    | HdrTelemetryType | Enum    | 0        | 1         | 1        | 2         |


### Grid5 and Grid6

!!! info "Grid5 and Grid6"
    These fields extend the resolution of the 4-char [Grid](https://en.wikipedia.org/wiki/Maidenhead_Locator_System){:target="_blank"} of the [WSPR Type 1 Message](../README.md#type-1-message-format).

    A 4-char grid has a location resolution of 70 x 140 miles.<br/>
    A 6-char grid has a location resolution of 3 x 3 miles.

    By appending the 2 additional grid characters to the 4-char grid from the Type 1 message, you form a 6-char grid.

    Their values encode the range `A-X`.


### Altitude

!!! info "Altitude"
    Typically determined through a GPS lock.

    See [Rollover](#rollover)


### Temperature

!!! info "Temperature"
    See [Rollover](#rollover)


### Voltage

!!! info "Voltage"
    The measurement of the input voltage to the tracker.

    Useful for observing the performance of the (typically) solar panels powering the device.

    See [Rollover](#rollover)

### Speed

!!! info "Speed"
    Typically determined through a GPS lock.

    See [Rollover](#rollover)


### IsGpsValid

!!! info "IsGpsValid"
    The Basic Telemetry message encodes values which are derived from:
    
    - A GPS device
    - Other sensors
        - ie for Voltage, Temperature

    If a GPS lock is not obtained, but other measurements are, and a Basic Telemetry message is to be sent, a `false` value can be provided to indicate that the GPS-derived values in the Basic Telemetry message are not valid.



### HdrTelemetryType

!!! info "HdrTelemetryType"
    Specified to be the value `1 = Standard`.


## Additional Encoding Details

### Callsign Characters 1 and 3

!!! note "Callsign characters 1 and 3 are not used for data encoding"
    Basic Telemetry is encoded into the [Type 1 Message Format](../README.md#type-1-message-format), except for the Callsign characters 1 and 3.

    See [Channels](../channels/README.md) for details on use of characters 1 and 3.


### Rollover

!!! info "Rollover is specified for fields"
    - Altitude
    - Temperature
    - Voltage
    - Speed


!!! info "Rollover Explained"
    Take Temperature, with a range of `-50 - 39` (90 values).

    Recall that we compact that range into 90 index values in the range `0-89`.

    To calculate the index, we `value - -50`.<br/>
    So the index of -50 is `-50 - -50 = 0`.<br/>
    And the index of -45 is `-45 - -50 = 5`.<br/>
    And the index of 39 is `39 - -50 = 89`.

    What happens if the measured temperature exceeds 39 degrees? Say 45 degrees.

    The calculation of the index would then be `45 - -50 = 95`.<br/>
    However, the index value of 95 exceeds the range of index values.<br/>
    So Rollover says, take the modulus of the index value.

    So the Rollover index calculation is actually `(value - -50) % 90`.<br/>
    So, the index of 45 is `(45 - -50) % 90 = 5`.

    We see now that both -45 and 45 have an index of `5`.


!!! example "Rollover Tradeoffs"
    Rollover has pros and cons.

    We saw the calculated index of temperature for both -45 and 45 = `5`.

    Pros:

    - Measurements are not in fact limited to a specific range, but the entire number line.

    Cons:

    - Measurements, after transmission, can not be deterministically decoded to a definite value.
        - ie Is the temperature really -45 or 45? How can you tell for certain? (you can't)


### Two Separate Encodes

The `big number` encoding, and subsequent conversion to WSPR Message, described previously, is specified to occur twice, on different sets of telemetry, to make up the full sets of WSPR fields.

!!! info "Encode Groups"
    | Telemetry                                                             | WSPR Field     |
    |-----------------------------------------------------------------------|----------------|
    | Grid5<br/>Grid6<br/>Altitude                                          | Callsign       |
    | Temperature<br/>Voltage<br/>Speed<br/>IsGpsValid<br/>HdrTelemetryType | Grid<br/>Power |


## Schedule Details

!!! info "See [Channels](../channels/README.md) for details on when it is appropriate to send this message."


## Traquito-specific Behavior

### Field Behavior

!!! info "Traquito Field Behavior"
    | Field       | Notes                                                                                                                                                                      |
    |-------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
    | Temperature | Traquito uses the onboard RP2040 temperature sensor for this measurement.                                                                                                  |
    | Voltage     | Traquito samples the voltage during high-load conditions (when the TX module is running) in order to get a worst-case sag value for voltage.                               |
    | IsGpsValid  | Traquito does not implement IsGpsValid=`false` functionality. Instead, a GPS lock is a requirement for sending a Basic Telemetry message, and IsGpsValid is always `true`. |

### Rollover Behavior (None)

Traquito clamps values and does not implement rollover.

!!! example
    If the temperature exceeds the top value of 39 (say 45), Traquito clamps to 39 and transmits 39.

This applies to upper and lower bounds.


### Voltage

Traquito further modifies the behavior of the Voltage Field beyond not implementing Rollover.

!!! note "Due to rollover, the Voltage range is specified as a continuous sequence of 1.95v ranges"
    - 2.0 volts to 3.95 volts, and
    - 4.0 volts to 5.95 volts, and
    - 6.0 volts to 7.95 volts, ...

Traquito instead selects the voltage range of 3.0v to 4.95v and clamps to that range.

!!! note "Traquito Web also limits to this voltage range"
    As a result, any tracker implementing Rollover will see their telemetry within this range.


## Code

See [Programming Library](../code/README.md) for implementation.
