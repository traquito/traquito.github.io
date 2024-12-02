---
icon: material/view-grid-compact
---

# Channels

## Overview

Channels are all about finding Telemetry messages later, by causing trackers to send them in ways that make their identification possible.

Identifying Telemetry messages means being able to associate them with Regular Type 1 messages sent at the start of the repeating 10-min window.

!!! info "See the [Channel Map Help](../../../channelmap/help/README.md) for a primer."


## Unique Identification

!!! danger "Telemetry messages are hard to find!"
    - Telemetry callsign fields do not have a predictable value
        - Nor do any of the other fields in the Telemetry WSPR message (grid and power)

!!! success "What you do know is sufficient given channel number specification"
    For a given channel number, you know:

    - The `id13` value encoded in the 1st and 3rd character of the callsign
    - The time slot the Telemetry will be sent in
    - The approximate frequency the Telemetry will be sent on


## Callsign Characters 1 and 3

Telemetry is encoded into the [Type 1 Message Format](../README.md#type-1-message-format), except for the Callsign characters 1 and 3.

That is because those characters are kept reserved for putting in unique data, the `id13` value, specified in the [Channel Map](../../channelmap/README.md).

The `id13` value are the columns `00` through `Q9` on the Channel Map, associated with a given channel.

The `id13` value is used by splitting into two characters, then the 1st character is dropped into the Telemetry callsign character 1, and the 2nd character is dropped into the Telemetry callsign character 3.

This differentiates Telemetry sharing a given frequency or time slot.

!!! example "Channel 248 has `id13` of `12`."
    That means the encoded callsign of the telemetry starts out blank, such as<br/>
    \_ _ _ _ _ _

    Then the channel lookup tells us the `id13` value is `12`, so callsign becomes<br/>
    1 _ 2 _ _ _

    From there, the rest of the callsign fields are encoded-into, leaving the `id13` values in place<br/>
    1 ? 2 ? ? ?


## Time Slot

The Channel Map specifies, by channel, the minute the Telemetry should be sent on.

This differentiates Telemetry sharing a given `id13` value.

!!! info "See the Channel Map [Schedule](../../../channelmap/help/README.md#schedule) more details."


## Frequency

Within a given band, the Channel Map specifies, by channel, the frequency the Regular and Telemetry messages should be sent on.

This differentiates Telemetry sharing a given `id13` value.

!!! danger "Many WSPR receivers have poorly calibrated receivers"
    This leads to erroneous reports of received frequency, which challenges the work of identifying Telemetry as being associated with a given Regular message.

!!! success ""Fingerprinting" helps overcome this issue"
    Finding Regular messages for a given callsign is trivial.

    It is also trivial to find the reported frequency of that Regular message.

    Fingerprinting is the technique of looking for Telemetry messages which match the reported frequency of the Regular message, not simply the notional target frequency specified by the Channel Map (which may be mis-reported).