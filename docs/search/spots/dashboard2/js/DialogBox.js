
export class DialogBox
{
    constructor()
    {
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.lastPosition = { top: '50px', left: '50px' };

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
            this.floatingWindow.style.top = this.lastPosition.top;
            this.floatingWindow.style.left = this.lastPosition.left;
            this.floatingWindow.style.display = 'flex';
        }
        else
        {
            this.floatingWindow.style.display = 'none';
        }
    }







    #MakeFloatingWindowFrame()
    {
        this.floatingWindow = document.createElement('div');

        this.floatingWindow.style.boxSizing = "border-box";

        this.floatingWindow.style.position = 'fixed';
        this.floatingWindow.style.top = '50px';
        this.floatingWindow.style.left = '50px';
        this.floatingWindow.style.width = '350px';
        this.floatingWindow.style.height = '250px';

        this.floatingWindow.style.backgroundColor = '#f0f0f0';

        this.floatingWindow.style.border = '1px solid black';
        this.floatingWindow.style.borderRadius = '5px';

        this.floatingWindow.style.boxShadow = '2px 2px 8px black';

        this.floatingWindow.style.padding = '0px';

        this.floatingWindow.style.display = 'none'; // Initially hidden
        this.floatingWindow.style.zIndex = 1;

        this.floatingWindow.style.resize = "both";
        this.floatingWindow.style.overflow = "hidden";

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
        this.titleBar.style.backgroundColor = '#f0f0f0';
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
        closeButton.addEventListener('mouseover', () => {
            closeButton.style.backgroundColor = "red";
        });
        closeButton.addEventListener('mouseout', () => {
            closeButton.style.backgroundColor = "rgba(0,0,0,0";
        });
        closeButton.addEventListener('click', () => {
            // Save the last position
            this.lastPosition.top = this.floatingWindow.style.top;
            this.lastPosition.left = this.floatingWindow.style.left;
            this.floatingWindow.style.display = 'none';
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

        return dom;
    }

    #EnableDrag()
    {
        this.titleBar.addEventListener('mousedown', (e) => {
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

        // this.frameBody.appendChild(document.createTextNode('Dialog Box Content.'));

        this.#EnableDrag();

        return this.floatingWindow;
    }
}

