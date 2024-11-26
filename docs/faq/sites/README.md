# WSPR Site Relationships

## Data Flow

There are a number of different websites that have WSPR data presented on them.

The diagram below clarifies the flow of information from the root database of all WSPR data (wsprnet), to how it is presented on some of those sites, and the relationships between the sites.

The Traquito website uses data in two ways:

*   [ChannelMap](/channelmap/) looks for channel researvations from qrp-labs and lu7aa, and overlays observed spots from wspr.rocks
*   [Spot Search](/search/spots/dashboard/?band=20m&channel=269&callsign=KD2KDD&limit=2000&dtGte=2023-05-08&dtLte=2023-06-01) (maps, graphs, data table) uses data from wspr.rocks

The image below is best effort (ie not a comprehensive nor authoritative list).

Click to enlarge.            

[![](wspr_site_relationships.png)](wspr_site_relationships.png)  
  

!!! info "Site links"
    - [https://www.wsprnet.org/drupal/](https://www.wsprnet.org/drupal/)
    - [https://wspr.live/](https://wspr.live/), [http://wspr.rocks/](http://wspr.rocks/)
    - [https://qrp-labs.com/](https://qrp-labs.com/)
    - [http://lu7aa.org/wsprset.asp](http://lu7aa.org/wsprset.asp)
    - [https://www.aprs-is.net/](https://www.aprs-is.net/)
    - [https://aprs.fi/](https://aprs.fi/)
    - [https://amateur.sondehub.org/](https://amateur.sondehub.org/)