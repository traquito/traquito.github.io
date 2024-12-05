---
icon: material/code-array
---

# WSPR Telemetry API

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

!!! note "API Overview"

    | What                                                        | Description                                                                              |
    |-------------------------------------------------------------|------------------------------------------------------------------------------------------|
    | [TelemetryBasic](./basic/README.md) API                     | Encode and Decode Basic Telemetry.<br/>(eg altitude, voltage, etc)                       |
    | [TelemetryExtendedUserDefined](./userdefined/README.md) API | Encode and Decode arbitrary telemetry.<br/>Use the API to define fields, encode, decode. |
    | [ChannelMap](./basic/README.md) API                         | Look up Channel Map details by band and channel.<br/>(id13, start minute, and frequency) |


## Arduino

!!! info "See the [Arduino](./arduino/README.md) page for details."


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
