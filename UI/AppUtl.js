
/////////////////////////////////////////////////////////////////////
// Misc
/////////////////////////////////////////////////////////////////////

export function ToastOk(str)
{
    Toastify({
        text: str ? str : "OK",
        duration: 2000,
        position: "center",
        style: {
            background: "green",
        },
        offset: {
            y: 50,
        },
    }).showToast();
}

export function ToastErr(str)
{
    Toastify({
        text: str ? str : "Err",
        duration: 2000,
        position: "center",
        style: {
            background: "red",
        },
        offset: {
            y: 50,
        },
    }).showToast();
}

export function Commas(num)
{
    let ret = num;

    try {
        ret = parseInt(num).toLocaleString("en-US");
    } catch (e) {
        // nothing
    }

    return ret;
}



/////////////////////////////////////////////////////////////////////
// DomState
/////////////////////////////////////////////////////////////////////

export class DomState
{
    constructor(cfg)
    {
        this.cfg = cfg;

        this.dom = cfg.dom;

        // default value
        this.propDefaultValue = "defaultValue";
        if (this.dom.type == "select-one") { this.propDefaultValue = "value"; }
        if (this.dom.type == "checkbox") { this.propDefaultValue = "checked"; }
        if (this.cfg.propDefaultValue) { this.propDefaultValue = this.cfg.propDefaultValue; }
        this.defaultValue = this.dom[this.propDefaultValue];

        // value
        this.propValue = "value";
        if (this.dom.type == "checkbox")
        {
            this.propValue = "checked";
        }
        if (this.cfg.propValue)
        {
            this.propValue = this.cfg.propValue;
        }

        // other
        this.baseline = this.SaveValueBaseline();

        this.error   = false;   // higher precidence over changed
        this.changed = false;

        // prevent spaces
        this.dom.addEventListener("keydown", (e) => {
            let retVal = true;

            if (e.which === 32)
            {
                e.preventDefault();
                retVal = false;
            }

            return retVal;
        });

        let event = "input";
        if (this.dom.type == "checkbox")
        {
            event = "change";
        }

        this.dom.addEventListener(event, () => {
            if (this.GetBaselineValue() != this.GetValue())
            {
                this.SetChangedState();
            }
            else
            {
                this.UnsetChangedState();
            }

            let val = this.GetValue();

            if (this.cfg.logOnChange)
            {
                console.log(`change to ${val}`);
            }

            if (this.cfg.fnOnChange)
            {
                this.cfg.fnOnChange(val);
            }
        });
    }

    GetValue()
    {
        return this.dom[this.propValue];
    }

    SetValue(val)
    {
        this.dom[this.propValue] = val;
    }

    SetValueAsBaseline(val)
    {
        this.SetValue(val);

        this.SaveValueBaseline();
    }

    SaveValueBaseline()
    {
        this.baseline = this.GetValue();

        this.UnsetErrorState();
        this.UnsetChangedState();

        return this.baseline;
    }

    GetBaselineValue()
    {
        return this.baseline;
    }

    SetValueToDefault()
    {
        this.UnsetErrorState();
        this.UnsetChangedState();
        this.SetValue(this.defaultValue);
    }

    SetErrorState()
    {
        this.error = true;

        this.dom.style.background = "#FFAAAA";
    }

    UnsetErrorState()
    {
        this.error = false;

        if (this.changed == false)
        {
            this.dom.style.background = "";
        }
        else
        {
            this.SetChangedState();
        }
    }

    SetChangedState()
    {
        this.changed = true;

        if (this.error == false)
        {
            this.dom.style.background = "yellow";
        }
    }

    UnsetChangedState()
    {
        if (this.error == false)
        {
            this.dom.style.background = "";
        }
    }

    GetDefaultValue()
    {
        return this.defaultValue;
    }

    Disable()
    {
        this.dom.disabled = true;
    }
    
    Enable()
    {
        this.dom.disabled = false;
    }
}
