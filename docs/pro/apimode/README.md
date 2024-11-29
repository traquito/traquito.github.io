---
icon: material/api
---
# API Mode

## API Mode Overview

The [Jetpack](../../tracker/README.md) tracker is designed to run software that handles configuration and flight.
That software switches between those modes without user intervention.

**API Mode works differently than this.**

!!! info "Uses cases for API Mode"
    - Testing the GPS in various situations
    - Standalone dedicated WSPR transmitter
    - Anything else where users want to control what happens instead of the software

If the above applies to you, read on.

!!! warning "This software IS NOT suitable for use as a pico balloon tracker."
    It is only meant to be used when operating the Jetpack hardware by remote control (via API).

!!! warning "This software will not enter Configuration Mode or Flight Mode like the tracker software."

!!! info "API Mode behavior"
    - The program takes no action on its own, it is idle
    - The radio is defaulted to being turned off
    - The GPS is default enabled, and all NMEA sentences are default enabled
    - The program will respond to JSON API messages

            

## API Mode Software Downloads

| Tracker Software | Description |
| --- | --- |
| TraquitoJetpackAPIMode.2023-07-07.uf2 | Released 2023-07-07 |
| TraquitoJetpackAPIMode.2023-07-10.uf2 | Released 2023-07-10 |
| [TraquitoJetpackAPIMode.2023-07-11.uf2](TraquitoJetpackAPIMode.2023-07-11.uf2) | Released 2023-07-11 |

              

## API Documentation

[API Documentation](./TraquitoJetpackAPI.html){:target="_blank"}
  

## Demonstration of API Mode:

- [GPS Lock Tester](./gps/README.md) - Repeatedly lock and re-lock indefinitely, showing durations

            

## Projects using API Mode:

- [NMEA2TCP](https://github.com/SteveRan/NMEA2TCP) - Lets you use u-blox u-center with Traquito in API Mode

