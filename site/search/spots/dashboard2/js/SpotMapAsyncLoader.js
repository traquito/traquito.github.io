

// loads the spot map module
// lets people get an event when that happens

// this is necessary because I want SpotMap
// - to know its own resources
// - be loadable as-is, and work via normal import {} from ...
//   - which is synchronous

// this module solves the problem of
// - wanting SpotMap to start loading as soon as humanly possible
//   on page load, by getting kicked off as early as construction
//   of objects, etc, not waiting for query results, or something
// - keeping an easily re-usable bit of code that doesn't require
//   boilerplate anywhere a map might want to get used


// map class relies on external libraries to load, so we want to do the work of loading
// asynchronously and immediately as soon as the library is imported.
let mapLoadPromise = import('./SpotMap.js');
let module = null;

// be the first to register for result, which is the loaded module
mapLoadPromise.then((result) => {
    module = result;
})


export class SpotMapAsyncLoader
{
    static async SetOnLoadCallback(fnOnLoad)
    {
        // any other caller will use this function, which will only fire after
        // our registered-first 'then', so we know the spot map will be loaded.
        mapLoadPromise.then(() => {
            fnOnLoad(module);
        });
    }
}

