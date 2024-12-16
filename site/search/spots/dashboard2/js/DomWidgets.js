

class ZIndexHelper
{
    constructor()
    {
        this.objDataList = [];
    }

    // objects register to have a given property set to the zIndex to make them
    // the top-most at this time, and later in the future
    RegisterForTop(obj, prop)
    {
        this.objDataList.push({
            obj,
            prop,
        });

        this.#AnnounceAll();

        return this.objDataList.length;
    }

    // request immediate top level
    RequestTop(obj)
    {
        // find its current location
        let idxFound = -1;
        for (let zIndex = 0; zIndex < this.objDataList.length; ++zIndex)
        {
            let objData = this.objDataList[zIndex];

            if (objData.obj == obj)
            {
                idxFound = zIndex;
            }
        }

        if (idxFound != -1)
        {
            // hold temporarily
            let objData = this.objDataList[idxFound];

            // delete its location, effectively compacting list
            this.objDataList.splice(idxFound, 1);

            // re-insert
            this.objDataList.push(objData);

            // announce re-index
            this.#AnnounceAll();
        }
    }

    #AnnounceAll()
    {
        for (let zIndex = 0; zIndex < this.objDataList.length; ++zIndex)
        {
            let objData = this.objDataList[zIndex];

            objData.obj[objData.prop] = zIndex;
        }
    }
}



export class DialogBox
{
    static #zIndexHelper = new ZIndexHelper();

    constructor()
    {
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;

        this.ui = this.#MakeUI();
    }

    GetUI()
    {
        return this.ui;
    }

    SetTitleBar(title)
    {
        this.titleBar.innerHTML = title;
    }

    GetContentContainer()
    {
        return this.frameBody;
    }

    ToggleShowHide()
    {
        if (this.floatingWindow.style.display === 'none')
        {
            this.#Show();
        }
        else
        {
            this.#Hide();
        }
    }

    #Show()
    {
        const STEP_SIZE_PIXELS = 50;

        let zIndex = DialogBox.#zIndexHelper.RegisterForTop(this.floatingWindow.style, "zIndex");

        if (this.floatingWindow.style.top  == "50px" &&
            this.floatingWindow.style.left == "50px")
        {
            this.floatingWindow.style.top  = `${STEP_SIZE_PIXELS * zIndex}px`;
            this.floatingWindow.style.left = `${STEP_SIZE_PIXELS * zIndex}px`;
        }

        this.floatingWindow.style.display = 'flex';
}

    #Hide()
    {
        DialogBox.#zIndexHelper.RequestTop(this.floatingWindow.style);

        this.floatingWindow.style.display = 'none';
    }

    #MakeFloatingWindowFrame()
    {
        this.floatingWindow = document.createElement('div');

        this.floatingWindow.style.boxSizing = "border-box";

        this.floatingWindow.style.position = 'fixed';
        this.floatingWindow.style.top = '50px';
        this.floatingWindow.style.left = '50px';

        this.floatingWindow.style.backgroundColor = '#f0f0f0';

        this.floatingWindow.style.border = '1px solid black';
        this.floatingWindow.style.borderRadius = '5px';

        this.floatingWindow.style.boxShadow = '2px 2px 8px black';

        this.floatingWindow.style.padding = '0px';

        this.floatingWindow.style.display = 'none'; // Initially hidden
        this.floatingWindow.style.zIndex = 1;

        this.floatingWindow.style.flexDirection = "column";


        return this.floatingWindow;
    }

    #MakeTopRow()
    {
        // create top row
        this.topRow = document.createElement('div');
        this.topRow.style.boxSizing = "border-box";

        this.topRow.style.borderBottom = "1px solid black";
        this.topRow.style.borderTopRightRadius = "5px";
        this.topRow.style.borderTopLeftRadius = "5px";
        this.topRow.style.display = "flex";
        this.topRow.style.backgroundColor = "#ff323254";
        
        // top row - title bar
        this.titleBar = document.createElement('div');
        this.titleBar.style.boxSizing = "border-box";

        this.titleBar.style.flexGrow = "1";
        this.titleBar.style.borderRight = "1px solid black";
        this.titleBar.style.borderTopLeftRadius = "5px";

        this.titleBar.style.padding = "3px";
        this.titleBar.style.backgroundColor = 'rgb(255, 255, 200)';
        this.titleBar.style.cursor = 'move'; // Indicate draggable behavior
        this.titleBar.innerHTML = "Dialog Box";
        this.topRow.appendChild(this.titleBar);

        // top row - close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        // closeButton.style.cursor = 'pointer';
        closeButton.style.border = 'none';
        closeButton.style.backgroundColor = 'rgba(0,0,0,0)';    // transparent

        this.topRow.appendChild(closeButton);

        // Close button event handling
        closeButton.addEventListener('click', () => {
            this.#Hide();
        });

        return this.topRow;
    }

    #MakeBody()
    {
        let dom = document.createElement('div');
        dom.style.boxSizing = "border-box";
        dom.style.padding = "3px";
        dom.style.width = "100%";
        dom.style.flexGrow = "1";
        dom.style.backgroundColor = "rgb(210, 210, 210)";

        // only show scrollbars if necessary
        // (eg someone manually resizes dialog smaller than content minimum size)
        dom.style.overflowX = "auto";
        dom.style.overflowY = "auto";

        // don't scroll the page, just the div
        let ScrollJustThis = dom => {
            dom.addEventListener('wheel', (e) => {
                const hasVerticalScrollbar = dom.scrollHeight > dom.clientHeight;
                
                if (hasVerticalScrollbar)
                {
                    e.stopPropagation();
                }
                else
                {
                    e.preventDefault();
                }
            });
        };

        ScrollJustThis(dom)

        return dom;
    }

    #EnableDrag()
    {
        this.floatingWindow.addEventListener('mousedown', (e) => {
            e.stopPropagation();

            DialogBox.#zIndexHelper.RequestTop(this.floatingWindow.style);
        });

        this.titleBar.addEventListener('mousedown', (e) => {
            e.stopPropagation();

            DialogBox.#zIndexHelper.RequestTop(this.floatingWindow.style);

            this.isDragging = true;
            this.offsetX = e.clientX - this.floatingWindow.getBoundingClientRect().left;
            this.offsetY = e.clientY - this.floatingWindow.getBoundingClientRect().top;
            document.body.style.userSelect = 'none'; // Prevent text selection during drag
        });

        // Drag the window
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const top = `${e.clientY - this.offsetY}px`;
                const left = `${e.clientX - this.offsetX}px`;
                this.floatingWindow.style.top = top;
                this.floatingWindow.style.left = left;
            }
        });

        // Stop dragging
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                document.body.style.userSelect = ''; // Re-enable text selection
            }
        });
    }

    #MakeUI()
    {
        let frame = this.#MakeFloatingWindowFrame();
        let frameTopRow = this.#MakeTopRow();
        this.frameBody = this.#MakeBody();

        this.frameBody.marginTop = "2px";

        frame.appendChild(frameTopRow);
        frame.appendChild(this.frameBody);

        // don't let the page scroll when you hover the popup
        // (scrollable content section handled separately)
        frame.addEventListener('wheel', (e) => {
            e.preventDefault();
        });

        this.#EnableDrag();

        return this.floatingWindow;
    }
}



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

