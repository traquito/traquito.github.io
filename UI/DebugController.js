
/////////////////////////////////////////////////////////////////////
// DebugController
/////////////////////////////////////////////////////////////////////

export class DebugController
{
    Configure(cfg)
    {
        this.conn = cfg.conn;

        this.dom = {};
        this.dom.form   = document.getElementById(cfg.idForm);
        this.dom.input  = document.getElementById(cfg.idInput);
        this.dom.output = document.getElementById(cfg.idOutput);

        // have the form just leave you alone and fill it out in peace
        this.dom.form.autocomplete = 'off';

        // Change form behavior to simply give me a notice of hitting enter
        this.dom.form.onsubmit = (event) => {
            if (event) { event.preventDefault(); }

            let input = this.dom.input.value.trim();
            this.dom.input.value = "";

            this.conn.SendShellCmd(input);

            return false;
        };

        // set initial state
        this.OnDisconnected();
    }

    OnConnected()
    {
        this.dom.input.disabled = false;
    }

    OnDisconnected()
    {
        this.dom.input.disabled = true;
    }

    Debug(str)
    {
        let sep = "";
        this.dom.output.value += sep;
        sep = "\n";
        this.dom.output.value += str;
        this.dom.output.value += sep;
        this.dom.output.value += sep;
        this.dom.output.scrollTop = this.dom.output.scrollHeight;
    }
}
