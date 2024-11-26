<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Tracker Configuration GUI Howto - Traquito</title>
    
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-07H1M3KB40"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        gtag('config', 'G-07H1M3KB40');
        </script>

<link rel="stylesheet" type="text/css" href="/css/traquito.css">
<style>
</style>
  </head>
  <body>
    <div class="linkbar">
        <a href="/" target="_blank">Home</a> > <a href="/faq" target="_blank">FAQ</a> > Tracker Configuration GUI Howto
    </div>

    
    <section class="allcontent">

        <section class="content">
            <span class="heading">Tracker Configuration GUI Howto</span>
            
            <pre class="text">
The <a href="/tracker" target="_blank">Jetpack tracker</a> has a <a href="/trackergui" target="_blank">Configuration GUI</a> which allows easy configuration and basic testing of the tracker features.

The tracker must have had software loaded onto it before it can be configured.  See the Jetpack tracker page for details.

This page highlights the functionality of the Configuration GUI.
            </pre>
        </section>


        <section class="content">
            <span class="heading">Layout</span>
            
            <pre class="text">
The GUI is laid out in 3 sections:
<ul>
<li>Tracker Connection</li>
<li>Flight Configuration</li>
<li>Test</li>
</ul>
The highlighting in the below screenshot identifies each of those sections.

<img src="gui_layout.png">
            </pre>
        </section>


        <section class="content">
            <span class="heading">Tracker Connection</span>
            <pre class="text">
The Configuration GUI communicates with the tracker via USB connection.

To begin configuration, plug your tracker into the computer via USB.

Then, click the "Connect" button.
<img src="connection_1.png">

You will be presented with a dialog window allowing you to choose the tracker to configure.  Only trackers will be present in the list.

<b>Notice that the tracker name is not yet selected.  You must select it</b> by clicking on the name of the tracker.
<img src="connection_2_pre.png">

Select the tracker, then click the dialog "Connect" button.
<img src="connection_2.png">

You will now see the Status field is green, as well as hardware and software version information of the tracker.
<img src="connection_3.png">

You will also see a dialog reminding you to save your configuration when you're done.  You close it with the circled X.
<img src="connection_4.png">


You are now ready to use the rest of the GUI.
            </pre>
        </section>

        <section class="content">
            <span class="heading">Flight Configuration</span>
            <pre class="text">
The tracker will regularly transmit messages that you will later be able to see on a <a href="/search/spots/dashboard/?band=20m&channel=269&callsign=KD2KDD&limit=2000&dtGte=2023-05-08&dtLte=2023-06-01" target="_blank">dashboard</a>.

In order for this to work properly, the tracker needs 3 pieces of information:
<ul>
<li>The frequency band (usually 20m)</li>
<li>The <a href='/faq/channels' target="_blank">channel</a> (pick one someone else isn't using)</li>
<li>Your callsign</li>
</ul>
The channel and callsign input boxes initially have no configuration and so are colored red.

You set these parameters using the input boxes circled.
<img src="config_1.png">

When done, save your configuration.  (TEST is not a valid callsign of course).
<img src="config_2.png">

If you change a saved parameter, the input box will become highlighted in yellow as a visual indicator that you have unsaved changes.

Either save the configuration, or revert back to the saved configuration.
<img src="config_3.png">

Once you have saved your configuration, your tracker is ready to fly.  Disconnect the tracker from your computer.

You should do some window testing before launching it, though.
            </pre>
        </section>

        <section class="content">
            <span class="heading">Test</span>
            <pre class="text">
The Test section of the Configuration GUI is not required to be used.

The purpose of this section is to provide interactive controls to test the functions of the tracker.

<u>Voltage</u>
Voltage is NOT shown because when connected to USB, the tracker is receiving a constant 5v supply.  Not very useful to measure.


<u>Temperature</u>
The tracker measures and transmits the temperature as part of its telemetry.

Here you can see the current temperature, updated each second.
<img src="temp_1.png">


<u>Send WSPR Message</u>
This control allows you to send a Regular Type 1 WSPR message using your tracker.

You likely want to be able to <a href="/faq/receiving/" target="_blank">receive and decode</a> WSPR messages if you intend to use this functionality.

Be sure you have at least small antennas (eg 3 inches) soldered to the transmitter antenna pads.

You are able to input the 3 Type 1 WSPR fields of Callsign, Grid, and Power.

The band and channel frequency are determined using your saved values from Flight Configuration.
<img src="send_1.png">

When you click Send, you will see a dialog appear which indicates the tracker is transmitting a message.

This dialog will close by itself after the message is sent.
<img src="send_2.png">

WSPR messages must be sent only on even minutes, at 1 second past the minute.

When Jetpack is in Flight Mode, this is handled automatically by synchronizing with GPS time.

When in Configuration Mode (using this GUI), you should use your eyeballs to look at a clock and decide when to send.  <a href="https://time.is/" target="_blank">time.is</a> is useful for this.
<img src="send_3.png">


<u>GPS Monitor / Control</u>
The section here consists of
<ul>
<li>GPS reset control buttons</li>
<li>GPS time and lock status</li>
<li>Live scrolling NMEA messages from the GPS</li>
</ul>
<img src="gps_1.png">

The GPS "Reset Modes" refer to the linked-to GPS-software-controlled reset states.

The GPS "Power" gives you interactive control over how the GPS module itself is powered:
<ol>
<li>On, Battery On = main power supplied, battery supply also on</li>
<li>Off, Battery On = main power cut, battery supply on (should retain data for fast lock)</li>
<li>Off, Battery Off = main power cut, battery supply off, module is completely cold</li>
</ol>
For #1, this is how the tracker runs the GPS when searching for a lock.
For #2, this is how the tracker runs the GPS when locked, and waiting to transmit.
For #3, this is what the tracker does if the GPS malfunctions and needs a hard reset.
            </pre>
        </section>


        
    </section>

    <br/><br/><br/>
    <br/><br/><br/>
    <br/><br/><br/>
    <br/><br/><br/>
    <br/><br/><br/>



  </body>
</html>
