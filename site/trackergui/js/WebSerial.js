
// https://developer.chrome.com/articles/serial/
//
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
// https://developer.mozilla.org/en-US/docs/Web/API/Serial
// https://developer.mozilla.org/en-US/docs/Web/API/SerialPort
// 
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map

export class WebSerial
{
    constructor(filterList)
    {
        // serial members
        this.port = null;
        this.portLast = null;
        this.reader = null;
        this.writer = null;

        this.filterList = filterList;

        // Keep realtime list of ports on the system
        this.systemPortList = new Map();
        this.MonitorSystemPorts();

        // callbacks
        this.fnOnConnected = () => {};
        this.fnOnConnectFail = () => {};
        this.fnOnDisconnected = () => {};
        this.fnOnLine = () => {};
    }

    SetOnConnectedCallback(fn)
    {
        this.fnOnConnected = fn;
    }

    SetOnConnectFailCallback(fn)
    {
        this.fnOnConnectFail = fn;
    }

    SetOnDisconnectedCallback(fn)
    {
        this.fnOnDisconnected = fn;
    }

    SetOnLineCallback(fn)
    {
        this.fnOnLine = fn;
    }

    SetLogEnable(logEnable)
    {
        this.logEnable = logEnable;
    }

    async Connect()
    {
        let retVal = true;

        try {
            let portLastTmp = this.portLast;

            let options = {
                filters: this.filterList,
            };

            let port = await navigator.serial.requestPort(options);

            if (port)
            {
                this.portLast = port;
                retVal = await this.ReConnect();
            }
            else
            {
                this.portLast = portLastTmp;
                retVal = false;
            }
        } catch (e) {
            this.logEnable && console.log("ERR: Unable to connect for some reason: ", e);
            
            retVal = false;
        }

        return retVal;
    }

    // only works if you haven't unplugged the device between disconnect/reconnect
    async ReConnect()
    {
        let retVal = false;

        if (this.portLast)
        {
            retVal = await this.ReConnectInternal();
        }
        else
        {
            this.logEnable && console.log("ERR: Tried to ReConnect when never connected before");
        }

        return retVal;
    }

    async ReConnectInternal()
    {
        await this.Disconnect();

        let retVal = true;

        this.port = this.portLast;

        try
        {
            // could have waited for event, but will await instead
            await this.port.open({ baudRate: 115200 });

            // log some info
            const { usbProductId, usbVendorId } = this.port.getInfo();
            this.logEnable && console.log(`INF: Opened port prod(${usbProductId}), vend(${usbVendorId})`);
            this.logEnable && console.log(this.port);

            // set up IO
            this.SetUpReader();
            this.SetUpWriter();

            // call event handlers
            this.OnConnect();
        } catch (e) {
            this.logEnable && console.log("ERR: Unable to re-connect for some reason: ", e);

            this.fnOnConnectFail(e);

            this.port = null;

            retVal = false;
        }

        return retVal;
    }

    Send(msg)
    {
        let retVal = true;

        if (this.writer)
        {
            this.writer.write(msg);
            this.writer.write("\n");
        }
        else
        {
            retVal = false;
        }

        return retVal;
    }

    async Disconnect()
    {
        if (this.port)
        {
            // await this.reader.releaseLock();

            this.keepReading = false;
            try { await this.reader.cancel(); } catch (e) { }
            
            this.writer.close();
            await this.writableStreamClosed;
            
            await this.port.close();
            this.port = null;

            this.OnDisconnect();
        }
    }

    /////////////////////////////////////////////////////////////////
    // Private
    /////////////////////////////////////////////////////////////////

    async SetUpReader()
    {
        let buf = "";

        let synthDisconnect = false;
        
        this.keepReading = true;
        while (this.port.readable && this.keepReading)
        {
            this.reader = this.port.readable.getReader();

            try {
                // Listen to data coming from the serial device.
                while (true) {
                    const { value, done } = await this.reader.read();
                    if (done) {
                        // Allow the serial port to be closed later.
                        this.logEnable && console.log("INF: Serial port closed");
                        break;
                    }
                    
                    // value is a Uint8Array.
                    let str = new TextDecoder().decode(value);
                    
                    // remove non-ascii and non-newline
                    str = str.replace(/[^\x20-\x7E\x0A]/g, '');
                    
                    // take out char by char, looking for complete lines ending in \n
                    for (const char of str)
                    {
                        if (char == '\n')
                        {
                            // whole line found, pass it up

                            // passing up asynchronously to escape the try/catch block, which
                            // otherwise covers pretty much the entire application
                            let bufHandle = buf;
                            setTimeout(() => { this.fnOnLine(bufHandle); }, 0);
                            // this.fnOnLine(buf);

                            buf = "";
                        }
                        else
                        {
                            buf += char;
                        }
                    }
                }
            } catch (e) {
                this.logEnable && console.log("INF: \"Non-fatal\" read error occurred: ", e);

                // yeah, I only see the "non-fatal" error when I disconnect the device from USB.
                // when that happens I trigger a disconnect event myself
                synthDisconnect = true;
            } finally {
                this.logEnable && console.log("INF: Releasing reader lock");
                this.reader.releaseLock();
            }
        }

        if (synthDisconnect)
        {
            this.Disconnect();
        }
    }

    async SetUpWriter()
    {
        this.textEncoder = new TextEncoderStream();
        this.writableStreamClosed = this.textEncoder.readable.pipeTo(this.port.writable);
        this.writer = this.textEncoder.writable.getWriter();
    }

    async OnConnect()
    {
        this.logEnable && console.log("WebSerial::OnConnect");

        this.fnOnConnected();
    }
    
    async OnDisconnect()
    {
        this.logEnable && console.log("WebSerial::OnDisconnect");

        this.port = null;
        this.reader = null;
        this.writer = null;

        this.fnOnDisconnected();
    }

    MonitorSystemPorts()
    {
        navigator.serial.addEventListener("connect", (e) => {
            // Connect to `e.target` or add it to a list of available ports.
            if (!this.systemPortList.get(e.target))
            {
                this.logEnable && console.log("INF: New system port connected");
                this.logEnable && console.log(this.systemPortList);
                this.logEnable && console.log(e.target);

                this.systemPortList.set(e.target, true);
            }
            else
            {
                this.logEnable && console.log("Got a connect event for a port we already know about");
                this.logEnable && console.log(this.systemPortList);
                this.logEnable && console.log(e.target);
            }
        });

        navigator.serial.addEventListener("disconnect", (e) => {
            // Remove `e.target` from the list of available ports.
            if (this.systemPortList.get(e.target))
            {
                this.logEnable && console.log("INF: system port disconnected");
                this.logEnable && console.log(this.systemPortList);
                this.logEnable && console.log(e.target);

                this.systemPortList.delete(e.target);
            }
            else
            {
                this.logEnable && console.log("ERR: Got a connect event for a port we already know about");
                this.logEnable && console.log(this.systemPortList);
                this.logEnable && console.log(e.target);
            }
        });

        navigator.serial.getPorts().then((systemPortList) => {
            // Initialize the list of available ports with `ports` on page load.

            this.logEnable && console.log("INF: Got system port list")
            for (const systemPort of systemPortList)
            {
                this.logEnable && console.log(systemPort);
                this.systemPortList.set(systemPort, true);
            }
            this.logEnable && console.log(this.systemPortList);
        });
    }
}





