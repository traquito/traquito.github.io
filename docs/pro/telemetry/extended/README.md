---
icon: material/chart-box-plus-outline
---

# Extended Telemetry

This is a proposal for the structure and behavior of Extended Telemetry.

!!! info "Goals"
    ...

!!! success "Improvements"
    more ...



## Message Structure




The slot identifier in the message also used



## Time Slot Behavior

### 10-Minute Schedule Framework

| start minute   | + 2 min | + 4 min | + 6 min | + 8 min |
|----------------|---------|---------|---------|---------|
| Regular Type 1 | -       | -       | -       | -       |


### Including Basic Telemetry

| start minute   | + 2 min         | + 4 min | + 6 min | + 8 min |
|----------------|-----------------|---------|---------|---------|
| Regular Type 1 | Basic Telemetry | -       | -       | -       |


### Including Basic and/or Extended Telemetry

The `[Ext Telemetry]` notation means that an Extended Telemetry message can be sent in that slot, but is not required to be.

#### Including Basic and Extended Telemetry

| start minute   | + 2 min         | + 4 min           | + 6 min           | + 8 min           |
|----------------|-----------------|-------------------|-------------------|-------------------|
| Regular Type 1 | Basic Telemetry | \[Ext Telemetry\] | \[Ext Telemetry\] | \[Ext Telemetry\] |

#### Replacing Basic with Extended Telemetry

| start minute   | + 2 min           | + 4 min           | + 6 min           | + 8 min           |
|----------------|-------------------|-------------------|-------------------|-------------------|
| Regular Type 1 | \[Ext Telemetry\] | \[Ext Telemetry\] | \[Ext Telemetry\] | \[Ext Telemetry\] |


### Extended Telemetry Schedule Specifics

Extended Telemetry Specifically:

- Extended Telemetry can be sent in any slot other than the start minute
- Extended Telemetry does not always have to be sent in the same slot
- Extended Telemetry can replace Basic Telemetry sometimes and other times not


These are all valid send sequences:

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


!!! warning "You cannot send the same type of Extended Telemetry message more than once in a 10 minute window"


## Matching up Telemetry

fingerprinting replaces frequency lane (though lane is still used aspirationally)

id13

time slot


## Traquito-Specific Behavior

Tracker doesn't try to ensure transmitting precisely within lane.

Web dashboard looks at the precise frequency of Type 1 and any telemetry.


### Extended Telemetry

