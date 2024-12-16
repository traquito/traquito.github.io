
export class TabularData
{
    constructor(dataTable)
    {
        this.dataTable = dataTable;

        this.col__idx = new Map();

        this.col__metaData = new Map();
        this.row__metaData = new WeakMap();

        this.#CacheHeaderLocations();
    }

    // create a new set of rows with copies of the values
    // duplicate the metadata.
    //   metadata row keys will be new (objects), values will be copied
    //   metadata col keys will be copied (strings), values will be copied
    Clone()
    {
        // prepare new objects
        let dataTableNew = [];
        let tdNew = new TabularData(dataTableNew);

        // make new rows, with copies of data (including header)
        for (let rowCur of this.dataTable)
        {
            let rowNew = [... rowCur];

            dataTableNew.push(rowNew);

            // copy any row meta data if any
            if (this.row__metaData.has(rowCur))
            {
                tdNew.row__metaData.set(rowNew, this.row__metaData.get(rowCur));
            }
        }

        // col meta data by big copy, keys are strings, so ok to do
        // without tying to some object
        tdNew.col__metaData = new Map(this.col__metaData);

        // update internal data structure
        tdNew.#CacheHeaderLocations();

        return tdNew;
    }

    // will only set the col metadata if it's a real column.
    // this data is destroyed if the column is destroyed.
    SetColMetaData(col, metaData)
    {
        let idx = this.Idx(col);
        if (idx != undefined)
        {
            this.col__metaData.set(col, metaData);
        }
    }

    // for valid columns, return metadata, creating if needed.
    // for invalid columns, undefined
    GetColMetaData(col)
    {
        let retVal = undefined;

        let idx = this.Idx(col);
        if (idx != undefined)
        {
            if (this.col__metaData.has(col) == false)
            {
                this.col__metaData.set(col, {});
            }

            retVal = this.col__metaData.get(col);
        }

        return retVal;
    }

    // will set the row metadata if an object or idx in range,
    // discard if numerically out of range.
    // all row metadata survives rows being moved around.
    // this data is destroyed if the row is destroyed.
    SetRowMetaData(row, metaData)
    {
        row = this.#GetRow(row);
        if (row != undefined)
        {
            this.row__metaData.set(row, metaData);
        }
    }

    // will get the row metadata if an object or idx in range, creating if needed,
    // undefined if numerically out of range.
    GetRowMetaData(row)
    {
        let retVal = undefined;

        row = this.#GetRow(row);
        if (row != undefined)
        {
            if (this.row__metaData.has(row) == false)
            {
                this.row__metaData.set(row, {});
            }

            retVal = this.row__metaData.get(row);
        }

        return retVal;
    }

    GetDataTable()
    {
        return this.dataTable;
    }

    GetHeaderList()
    {
        let retVal = [];

        if (this.dataTable.length)
        {
            // prevent caller from modifying column names directly
            retVal = [... this.dataTable[0]];
        }

        return retVal;
    }

    GetColCount()
    {
        return this.GetHeaderList().length;
    }

    // return the number of data rows
    Length()
    {
        let retVal = 0;

        if (this.dataTable.length)
        {
            retVal = this.dataTable.length - 1;
        }

        return retVal;
    }

    #CacheHeaderLocations()
    {
        if (this.dataTable && this.dataTable.length)
        {
            this.col__idx = new Map();

            const headerRow = this.dataTable[0];
    
            for (let i = 0; i < headerRow.length; ++i)
            {
                const col = headerRow[i];
    
                this.col__idx.set(col, i);
            }
        }
    }

    Idx(col)
    {
        // undefined if no present
        return this.col__idx.get(col);
    }

    // if given a row (array) object, return that object.
    // if given a numeric index, return the row in the table at that logical index.
    #GetRow(row)
    {
        if (row == undefined || row == null) { return undefined; }

        let retVal = undefined;

        if (typeof row == "object")
        {
            retVal = row;
        }
        else
        {
            if (row + 1 < this.dataTable.length)
            {
                retVal = this.dataTable[row + 1];
            }
        }

        return retVal;
    }

    // if given a row (array) object, return the value in the specified column.
    // if given a numeric index, return the value in the specified column.
    Get(row, col)
    {
        let retVal = undefined;

        row = this.#GetRow(row);
        if (row)
        {
            retVal = row[this.Idx(col)];
        }

        return retVal;
    }

    // if given a row (array) object, return the value in the specified column.
    // if given a numeric index, return the value in the specified column.
    Set(row, col, val)
    {
        if (typeof row == "object")
        {
            row[this.Idx(col)] = val;
        }
        else
        {
            this.dataTable[row + 1][this.Idx(col)] = val;
        }
    }

    // idx of data, not including header
    DeleteRowList(idxList)
    {
        // put in descending order so we don't need to recalculate indices after each delete
        idxList.sort((a, b) => (a - b));
        idxList.reverse();

        for (let idx of idxList)
        {
            this.DeleteRow(idx);
        }
    }

    // idx of data, not including header
    DeleteRow(idx)
    {
        this.dataTable.splice(idx + 1, 1);
    }

    // create a new row, with empty values.
    // row will have the same number of elements as the header.
    // the row is returned to the caller and is appropriate for use with
    // the Get() and Set() API.
    AddRow()
    {
        let row = new Array(this.GetColCount());

        this.dataTable.push(row);

        return row;
    }

    RenameColumn(colOld, colNew)
    {
        this.dataTable[0][this.Idx(colOld)] = colNew;

        this.#CacheHeaderLocations();

        if (colOld != colNew)
        {
            this.col__metaData.set(colNew, this.col__metaData.get(colOld));
            this.col__metaData.delete(colOld);
        }
    }

    DeleteColumn(col)
    {
        let idx = this.Idx(col);

        if (idx != undefined)
        {
            for (let row of this.dataTable)
            {
                row.splice(idx, 1);
            }
        }

        this.#CacheHeaderLocations();

        this.col__metaData.delete(col);
    }

    DeleteColumnList(colList)
    {
        for (let col of colList)
        {
            this.DeleteColumn(col);
        }
    }

    DeleteEmptyColumns()
    {
        let colList = [];

        for (let i = 0; i < this.dataTable[0].length; ++i)
        {
            let col = this.dataTable[0][i];

            let allBlank = true;

            for (let j = 1; j < this.dataTable.length; ++j)
            {
                let val = this.dataTable[j][i];

                if (val != "" && val != null)
                {
                    allBlank = false;
                }
            }

            if (allBlank)
            {
                colList.push(col);
            }
        }

        this.DeleteColumnList(colList);
    }

    MakeDataTableFromRowList(rowList)
    {
        let dataTable = [[... this.dataTable[0]]];

        for (let row of rowList)
        {
            dataTable.push([... row]);
        }

        return dataTable;
    }

    MakeDataTableFromRow(row)
    {
        return this.MakeDataTableFromRowList([row]);
    }

    Extract(headerList)
    {
        const headerRow = this.dataTable[0];
        let idxList = [];

        for (const header of headerList)
        {
            let idx = headerRow.indexOf(header);

            idxList.push(idx);
        }

        // build new data table
        let dataTableNew = [];
        for (const row of this.dataTable)
        {
            let rowNew = [];

            for (const idx of idxList)
            {
                rowNew.push(row[idx]);
            }

            dataTableNew.push(rowNew);
        }

        return dataTableNew;
    }

    ExtractDataOnly(headerList)
    {
        let dataTable = this.Extract(headerList);

        return dataTable.slice(1);
    }

    DeepCopy()
    {
        return this.Extract(this.dataTable[0]);
    }

    ForEach(fnEachRow, reverseOrder)
    {
        if (reverseOrder == undefined) { reverseOrder = false; }

        if (reverseOrder == false)
        {
            for (let i = 1; i < this.dataTable.length; ++i)
            {
                let row = this.dataTable[i];
    
                fnEachRow(row, i - 1);
            }
        }
        else
        {
            for (let i = this.dataTable.length - 1; i >= 1; --i)
            {
                let row = this.dataTable[i];
    
                fnEachRow(row, i - 1);
            }
        }
    }

    AppendGeneratedColumns(colHeaderList, fnEachRow, reverseOrder)
    {
        if (reverseOrder == undefined) { reverseOrder = false; }

        this.dataTable[0].push(... colHeaderList);

        if (reverseOrder == false)
        {
            for (let i = 1; i < this.dataTable.length; ++i)
            {
                let row = this.dataTable[i];
    
                row.push(... fnEachRow(row));
            }
        }
        else
        {
            for (let i = this.dataTable.length - 1; i >= 1; --i)
            {
                let row = this.dataTable[i];
    
                row.push(... fnEachRow(row));
            }
        }

        this.#CacheHeaderLocations();
    }

    PrependGeneratedColumns(colHeaderList, fnEachRow, reverseOrder)
    {
        if (reverseOrder == undefined) { reverseOrder = false; }

        this.dataTable[0].unshift(... colHeaderList);

        if (reverseOrder == false)
        {
            for (let i = 1; i < this.dataTable.length; ++i)
            {
                let row = this.dataTable[i];
    
                row.unshift(... fnEachRow(row));
            }
        }
        else
        {
            for (let i = this.dataTable.length - 1; i >= 1; --i)
            {
                let row = this.dataTable[i];
    
                row.unshift(... fnEachRow(row));
            }
        }

        this.#CacheHeaderLocations();
    }

    GenerateModifiedColumn(colHeaderList, fnEachRow, reverseOrder)
    {
        if (reverseOrder == undefined) { reverseOrder = false; }
        
        let col = colHeaderList[0];

        let rowList = [];

        if (reverseOrder == false)
        {
            // build new values
            for (let i = 1; i < this.dataTable.length; ++i)
            {
                let row = this.dataTable[i];
    
                let rowNew = fnEachRow(row, i - 1);

                rowList.push(rowNew[0]);
            }
            
            // update table
            for (let i = 1; i < this.dataTable.length; ++i)
            {
                let row = this.dataTable[i];

                row[this.Idx(col)] = rowList[i - 1];
            }
        }
        else
        {
            for (let i = this.dataTable.length - 1; i >= 1; --i)
            {
                let row = this.dataTable[i];
    
                let rowNew = fnEachRow(row, i - 1);
    
                // row[this.Idx(col)] = rowNew[0];
                rowList.push(rowNew[0]);
            }

            for (let i = this.dataTable.length - 1; i >= 1; --i)
            {
                let row = this.dataTable[i];

                row[this.Idx(col)] = rowList[rowList.length - i];
            }
        }
    }

    // rearranges columns, leaving row objects intact (in-place operation).
    // specified columns which don't exist will start to exist, and undefined values
    // will be present in the cells.
    SetColumnOrder(colList)
    {
        let colListNewSet = new Set(colList);
        let colListOldSet = new Set(this.GetHeaderList());

        // figure out which old columns are no longer present
        let colListDelSet = colListOldSet.difference(colListNewSet);

        // modify each row, in place, to have only the column values
        for (let i = 1; i < this.dataTable.length; ++i)
        {
            let row = this.#GetRow(i - 1);

            // build a new row of values.
            // undefined for any invalid columns.
            let rowNew = [];
            for (let col of colList)
            {
                rowNew.push(this.Get(row, col));
            }

            // wipe out contents of existing row, but keep row object
            row.length = 0;

            // add new values into the row, in order
            row.push(... rowNew);
        }

        // update headers in place
        this.dataTable[0].length = 0;
        this.dataTable[0].push(... colList);

        // delete metadata from destroyed columns
        for (let col of colList)
        {
            this.col__metaData.delete(col);
        }

        // update column index
        this.#CacheHeaderLocations();
    }

    // Will put specified columns in the front, in this order, if they exist.
    // Columns not specified will retain their order.
    PrioritizeColumnOrder(colHeaderList)
    {
        // get reference of existing columns
        let remainingColSet = new Set(this.GetHeaderList());

        // get list of existing priority columns
        let priorityColSet = new Set();
        for (let col of colHeaderList)
        {
            if (remainingColSet.has(col))
            {
                remainingColSet.delete(col);
                priorityColSet.add(col);
            }
        }

        // now we have two lists of columns:
        // - priorityColSet  - existing columns in the order specified
        // - remainingColSet - every other existing column other than priority column set,
        //                     in original order

        // now arrange columns
        let colHeaderListNew = [... priorityColSet.values(), ... remainingColSet.values()];

        this.SetColumnOrder(colHeaderListNew);
    }

    FillUp(col, defaultVal)
    {
        defaultVal = defaultVal | "";

        let idx = this.Idx(col);

        for (let i = this.dataTable.length - 1; i >= 1; --i)
        {
            const row = this.dataTable[i];

            let val = row[idx];

            if (val == null)
            {
                if (i == this.dataTable.length - 1)
                {
                    val = defaultVal;
                }
                else
                {
                    val = this.dataTable[i + 1][idx];
                }

                row[idx] = val;
            }
        }
    }

    FillDown(col, defaultVal, reverseOrder)
    {
        defaultVal = defaultVal | "";

        let idx = this.Idx(col);

        for (let i = 1; i < this.dataTable.length; ++i)
        {
            const row = this.dataTable[i];

            let val = row[idx];

            if (val == null)
            {
                if (i == 1)
                {
                    val = defaultVal;
                }
                else
                {
                    val = this.dataTable[i - 1][idx];
                }

                row[idx] = val;
            }
        }
    }

    GetDataForCol(col)
    {
        let valList = [];

        if (this.dataTable && this.dataTable.length && this.Idx(col) != undefined)
        {
            for (let i = 0; i < this.Length(); ++i)
            {
                valList.push(this.Get(i, col));
            }
        }

        return valList;
    }

    Reverse()
    {
        // reverse the whole things
        this.dataTable.reverse();

        // swap the header (now at the bottom) to the top
        this.dataTable.unshift(this.dataTable.pop());
    }
}

