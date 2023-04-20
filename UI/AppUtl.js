
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


/////////////////////////////////////////////////////////////////////
// DomState
/////////////////////////////////////////////////////////////////////

export class DomState
{
    constructor(cfg)
    {
        this.dom = cfg.dom;

        this.defaultValue = cfg.defaultValue == undefined ? this.dom.defaultValue : cfg.defaultValue;

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

            return retVal;;
        });

        this.dom.addEventListener("input", () => {
            if (this.GetBaselineValue() != this.GetValue())
            {
                this.SetChangedState();
            }
            else
            {
                this.UnsetChangedState();
            }
        });
    }

    GetValue()
    {
        return this.dom.value;
    }

    SetValueAsBaseline(val)
    {
        this.dom.value = val;

        this.SaveValueBaseline();
    }

    SaveValueBaseline()
    {
        this.baseline = this.dom.value;

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
        this.dom.value = this.defaultValue;
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
