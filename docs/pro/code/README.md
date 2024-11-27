<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>C++ Code U4B - Traquito</title>
    
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-07H1M3KB40"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        
        gtag('config', 'G-07H1M3KB40');
        </script>
<script>
  function resizeIframe(obj) {
    obj.style.height = obj.contentWindow.document.documentElement.scrollHeight + 100 + 'px';
  }
</script>
<link rel="stylesheet" type="text/css" href="/css/traquito.css">
<style>
</style>
  </head>
  <body>
    <div class="linkbar">
        <a href="/" target="_blank">Home</a> > <a href="/pro" target="_blank">Pro Tools</a> > C++ Code U4B
    </div>

    <section class="allcontent">

        <section class="content">
            <span class="heading">U4B Protocol</span>
            <pre class="text">
As described in the <a href="/faq/channels" target="_blank">FAQ</a> about Channels and U4B protocol, the <a href="/tracker" target="_blank">Jetpack</a> tracker implements the U4B protocol. 

Implementing U4B protocol consists of:
<ul>
<li>Scheduling (as described in the FAQ)</li>
<li>Encoding of actual data (eg temperature, altitude, etc) into a WSPR message (callsign, grid, power)</li>
</ul>

This page makes available the source code used to do the above for those who might also want to build a U4B tracker, or who are just curious.
            </pre>
        </section>

        <section class="content">
            <span class="heading">C++ Code</span>
            <pre class="text">
There are 3 files available:
<ul>
<li><a href="WSPR.h" target="_blank">WSPR.h</a></li>
<li><a href="WSPRMessage.h" target="_blank">WSPRMessage.h</a></li>
<li><a href="WSPRMessageU4B.h" target="_blank">WSPRMessageU4B.h</a></li>
</ul>
            </pre>
        </section>

        <section class="content">
            <span class="heading">WSPR.h</span>
            <pre class="text">
WSPR.h gives you:
<ul>
<li>Details about WSPR bands and frequencies</li>
<li>U4B Channel Details</li>
</ul>
Imagine you want to operate on the 20m band on channel 368.

For that, you need to know:
<ul>
<li>The id13 value for encoded transmission (18 in this case)</li>
<li>The minute you should transmit the regular message (4 in this case)</li>
<li>The frequency you should transmit on (14,097,060 in this case)</li>
</ul>
<img src="channelmap.png">

Usage:
<div class="code">string   band    = "20m";
uint16_t channel = 368;

ChannelDetails cd = WSPR::GetChannelDetails(band, channel);

// cd.id1  == '1'
// cd.id3  == '8'
// cd.id13 == "18"
// cd.min  == 4
// cd.freq == 14'097'060
</div>
        </pre>
        </section>

        <section class="content">
            <span class="heading">WSPRMessage.h and WSPRMessageU4B.h</span>
            <pre class="text">
U4B message encoding is handled by WSPRMessage.h and WSPRMessageU4B.h.

Normal WSPR Type 1 messages consist of a callsign, grid, and power fields.

The U4B encoded data (altitude, temperature, etc) are encoded into valid forms of the WSPR Type 1 fields.

So, if you can transmit a Type 1 message, you can transmit a U4B encoded message also, because it's those same 3 fields, but with encoded data.

The way to use the code above to accomplish this is:
- WSPRMessage is a class which lets you set/get callsign, grid, and power
- WSPRMessageU4B is a class which:
  - inherits WSPRMessage interface
  - allows you to set all the U4B fields (altitude, temp, etc)
    - each time you set a field, the new encoded callsign, grid, power are made available
- you can then:
  - extract the encoded callsign, grid, power
  - transmit those encoded fields the same way as your normal wspr message

Usage:
<div class="code">WSPRMessageU4B msgU4b;

msgU4b.SetId13("Q5");
msgU4b.SetGrid56("JM");
msgU4b.SetAltM(5120);
msgU4b.SetTempC(-5);
msgU4b.SetVoltage(3.25);
msgU4b.SetSpeedKnots(25);
msgU4b.SetGpsValid(true);

string  callsign = msU4b.GetCallsign();
string  grid4    = msgU4b.GetGrid();
uint8_t pwrDbm   = msgU4b.GetPowerDbm();

// callsign == "QD5WPK"
// grid4    == "IR39"
// pwrDbm   == 47
</div>

Note -- You can input any value you want to the API.  However, the code will clamp within min/max range, and subsequently snap values to align.

For example, above, speed was set to 25 knots.  If you decode that, you'll see 26 knots.  That's because there is a granularity minimum of 2 knots for speed.

You can see the field definitions on the decode page (linked below).
            </pre>
        </section>

        <section class="content">
            <span class="heading">Validation</span>
            <pre class="text">
You can use the online <a href="/pro/decode" target="_blank">decoder</a> to validate that your program is operating as expected.
            </pre>
        </section>

        <section class="content">
            <span class="heading">Questions / Support</span>
            <pre class="text">
This code is provided as-is and may not work at all.

Please post to the forum if any issues.
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
