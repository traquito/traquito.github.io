
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

