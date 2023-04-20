
/////////////////////////////////////////////////////////////////////
// ConnectController
/////////////////////////////////////////////////////////////////////

export class ConnectController
{
    Configure(cfg)
    {
        this.dbg  = cfg.dbg;
        this.conn = cfg.conn;

        this.dom = {};
        this.dom.status     = document.getElementById(cfg.idStatus);
        this.dom.connect    = document.getElementById(cfg.idConnect);
        this.dom.disconnect = document.getElementById(cfg.idDisconnect);

        this.dom.connect.onclick = e => {
            this.conn.Connect();
        };
        this.dom.disconnect.onclick = e => {
            this.conn.Disconnect();
        };
        
        // Set up some styles
        this.SetDisconnectedStyle();
    }

    OnConnected()
    {
        this.dbg.Debug("App Connected")

        this.dom.status.innerHTML = "Connected";
        this.dom.status.style.backgroundColor = "green";

        this.dom.connect.disabled = true;
        this.dom.disconnect.disabled = false;
    }

    OnDisconnected()
    {
        this.dbg.Debug("App Disconnected")

        this.SetDisconnectedStyle();
    }

    SetDisconnectedStyle()
    {
        this.dom.status.innerHTML = "Disconnected";
        this.dom.status.style.backgroundColor = "red";
        this.dom.connect.disabled = false;
        this.dom.disconnect.disabled = true;
    }

    SetErrorStyle()
    {
        this.dom.status.innerHTML = "Error";
        this.dom.status.style.backgroundColor = "yellow";
    }
}
