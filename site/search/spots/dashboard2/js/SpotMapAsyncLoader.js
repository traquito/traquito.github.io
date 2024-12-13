

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
// - 
