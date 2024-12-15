



export class CollapsableTitleBox
{
    constructor()
    {
        this.ui = this.#MakeUI();
        this.#SetUpEvents();
    }

    GetUI()
    {
        return this.ui;
    }

    SetTitle(title)
    {
        this.titleBar.innerHTML = title;
    }

    GetContentContainer()
    {
        return this.box;
    }

    SetMinWidth(minWidth)
    {
        this.ui.style.minWidth = minWidth;
    }

    ToggleShowHide()
    {
        if (this.box.style.display === 'none')
        {
            this.Show();
        }
        else
        {
            this.Hide();
        }
    }

    Show()
    {
        this.box.style.display = 'flex';
    }

    Hide()
    {
        this.box.style.display = 'none';
    }

    #SetUpEvents()
    {
        this.titleBar.addEventListener('click', () => {
            this.ToggleShowHide();
        });
    }

    #MakeUI()
    {
        // entire structure
        this.ui = document.createElement('div');
        this.ui.style.boxSizing = "border-box";
        this.ui.style.border = "1px solid grey";

        // user reads this, click to hide/unhide
        this.titleBar = document.createElement('div');
        this.titleBar.style.boxSizing = "border-box";
        this.titleBar.style.padding = "3px";
        this.titleBar.style.backgroundColor = "rgb(240, 240, 240)";
        // this.titleBar.style.backgroundColor = "rgb(200, 200, 255)";
        this.titleBar.style.userSelect = "none";
        this.titleBar.style.cursor = "pointer";
        this.titleBar.innerHTML = "Title Bar";

        // user content goes here
        this.box = document.createElement('div');
        this.box.style.boxSizing = "border-box";
        this.box.style.padding = "5px";
        this.box.style.boxShadow = "1px 1px 5px #555 inset";
        this.box.style.overflowX = "auto";
        this.box.style.overflowY = "auto";
        this.box.style.display = 'none';    // initially hidden
        
        // pack
        this.ui.appendChild(this.titleBar);
        this.ui.appendChild(this.box);

        return this.ui;
    }
}

