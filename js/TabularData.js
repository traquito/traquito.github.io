
// basically a table where the first row is the column headers

export class TabularData
{
    constructor(dataTable)
    {
        this.dataTable = dataTable;

        this.col__idx = new Map();

        this.CacheHeaderLocations();
    }

    CacheHeaderLocations()
    {
        const headerRow = this.dataTable[0];

        for (let i = 0; i < headerRow.length; ++i)
        {
            const col = headerRow[i];

            this.col__idx.set(col, i);
        }
    }

    Idx(col)
    {
        return this.col__idx.get(col);
    }

    Get(row, col)
    {
        return row[this.Idx(col)];
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

    AppendGeneratedColumns(colHeaderList, fnEachRow)
    {
        this.dataTable[0].push(... colHeaderList);

        for (let i = 1; i < this.dataTable.length; ++i)
        {
            let row = this.dataTable[i];

            row.push(... fnEachRow(row));
        }

        this.CacheHeaderLocations();
    }

    GenerateModifiedColumn(colHeaderList, fnEachRow)
    {
        let col = colHeaderList[0];

        for (let i = 1; i < this.dataTable.length; ++i)
        {
            let row = this.dataTable[i];

            let rowNew = fnEachRow(row);

            row[this.Idx(col)] = rowNew[0];
        }
    }

    MakeNewDataTable(colHeaderList, fnEachRow)
    {
        let dataTable = [];
        dataTable.push(colHeaderList);

        for (let i = 1; i < this.dataTable.length; ++i)
        {
            dataTable.push(fnEachRow(this.dataTable[i]));
        }

        return dataTable;
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

    MakeSeriesList()
    {
        let seriesList = [];
    
        for (let i = 0; i < this.dataTable[0].length; ++i)
        {
            let series = [];
    
            for (let j = 1; j < this.dataTable.length; ++j)
            {
                series.push(this.dataTable[j][i]);
            }
    
            seriesList.push(series);
        }
    
        return seriesList;
    }
}

