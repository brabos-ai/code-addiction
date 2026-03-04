# TanStack Table

TanStack Table is a headless UI library for building powerful tables and datagrids in TypeScript/JavaScript applications. It provides comprehensive logic, state management, and APIs for table functionality without prescribing any markup, styles, or pre-built components. This approach allows developers to maintain full control over their table's appearance while leveraging battle-tested data processing capabilities for sorting, filtering, pagination, grouping, and more.

The library supports multiple frameworks including React, Vue, Solid, Svelte, Qwik, Angular, and Lit, as well as vanilla JavaScript. It's designed to handle large datasets efficiently—capable of processing tens of thousands of rows client-side with excellent performance. TanStack Table separates concerns between data manipulation and presentation, making it ideal for teams that need customized table implementations or are working within existing design systems.

## Installation

Install the framework-specific adapter for your project.

```bash
# React
npm install @tanstack/react-table

# Vue
npm install @tanstack/vue-table

# Solid
npm install @tanstack/solid-table

# Svelte
npm install @tanstack/svelte-table

# Angular
npm install @tanstack/angular-table

# Qwik
npm install @tanstack/qwik-table

# Lit
npm install @tanstack/lit-table

# Vanilla JS (no framework)
npm install @tanstack/table-core
```

## Creating a Basic Table

Define your data type, columns, and create a table instance.

```tsx
import { useReactTable, getCoreRowModel, createColumnHelper } from '@tanstack/react-table'

type User = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  progress: number
}

const data: User[] = [
  {
    firstName: "Tanner",
    lastName: "Linsley",
    age: 33,
    visits: 100,
    progress: 50,
    status: "Married"
  },
  {
    firstName: "Kevin",
    lastName: "Vandy",
    age: 27,
    visits: 200,
    progress: 100,
    status: "Single"
  }
]

const columnHelper = createColumnHelper<User>()

const columns = [
  columnHelper.accessor('firstName', {
    header: 'First Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('lastName', {
    header: 'Last Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('visits', {
    header: 'Visits',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('progress', {
    header: 'Progress',
    cell: info => `${info.getValue()}%`,
  }),
]

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
})

// Render the table
return (
  <table>
    <thead>
      {table.getHeaderGroups().map(headerGroup => (
        <tr key={headerGroup.id}>
          {headerGroup.headers.map(header => (
            <th key={header.id}>
              {header.isPlaceholder ? null : header.column.columnDef.header}
            </th>
          ))}
        </tr>
      ))}
    </thead>
    <tbody>
      {table.getRowModel().rows.map(row => (
        <tr key={row.id}>
          {row.getVisibleCells().map(cell => (
            <td key={cell.id}>
              {cell.renderValue()}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
```

## Column Definitions with Accessor Functions

Use accessor functions to transform or compute values from row data.

```tsx
import { createColumnHelper } from '@tanstack/react-table'

type Person = {
  firstName: string
  lastName: string
  age: number
  visits: number
  status: string
  profile: {
    bio: string
    avatar: string
  }
}

const columnHelper = createColumnHelper<Person>()

const columns = [
  // Computed accessor - concatenate first and last name
  columnHelper.accessor(row => `${row.firstName} ${row.lastName}`, {
    id: 'fullName',
    header: 'Full Name',
    cell: info => info.getValue(),
  }),

  // Deep key access with dot notation
  columnHelper.accessor('profile.bio', {
    header: 'Biography',
    cell: info => info.getValue(),
  }),

  // Custom cell rendering with row data
  columnHelper.accessor('age', {
    header: 'Age',
    cell: props => (
      <span style={{ color: props.getValue() > 30 ? 'red' : 'green' }}>
        {props.getValue()} years old
      </span>
    ),
  }),

  // Display column (no data accessor)
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: props => (
      <button onClick={() => console.log('Edit', props.row.original)}>
        Edit
      </button>
    ),
  }),

  // Group column
  columnHelper.group({
    header: 'Profile Info',
    columns: [
      columnHelper.accessor('visits', {
        header: 'Visits',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
      }),
    ],
  }),
]
```

## Client-Side Sorting

Enable sorting with built-in or custom sort functions.

```tsx
import { useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table'
import { useState } from 'react'

const [sorting, setSorting] = useState([])

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    sortingFn: 'alphanumeric', // Built-in: alphanumeric, alphanumericCaseSensitive, text, textCaseSensitive, datetime, basic
  },
  {
    accessorKey: 'age',
    header: 'Age',
    sortingFn: 'basic',
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortingFn: 'datetime',
  },
  {
    accessorKey: 'rank',
    header: 'Rank',
    // Custom sorting function
    sortingFn: (rowA, rowB, columnId) => {
      const a = rowA.getValue(columnId)
      const b = rowB.getValue(columnId)
      return a > b ? 1 : a < b ? -1 : 0
    },
    invertSorting: true, // Invert for ranking (1st is best)
  },
]

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: {
    sorting,
  },
  onSortingChange: setSorting,
  enableMultiSort: true, // Allow sorting by multiple columns
})

// Render sortable headers
return (
  <thead>
    {table.getHeaderGroups().map(headerGroup => (
      <tr key={headerGroup.id}>
        {headerGroup.headers.map(header => (
          <th key={header.id}>
            {header.isPlaceholder ? null : (
              <div
                onClick={header.column.getToggleSortingHandler()}
                style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
              >
                {header.column.columnDef.header}
                {{
                  asc: ' 🔼',
                  desc: ' 🔽',
                }[header.column.getIsSorted()] ?? null}
              </div>
            )}
          </th>
        ))}
      </tr>
    ))}
  </thead>
)
```

## Client-Side Filtering

Filter table data with built-in or custom filter functions.

```tsx
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table'
import { useState } from 'react'

const [columnFilters, setColumnFilters] = useState([])

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    filterFn: 'includesString', // Built-in: includesString, includesStringSensitive, equalsString, arrIncludes, inNumberRange
  },
  {
    accessorKey: 'age',
    header: 'Age',
    filterFn: 'inNumberRange',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    // Custom filter function
    filterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      return value.toLowerCase().includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    filterFn: 'arrIncludes', // For multi-select filters
  },
]

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  state: {
    columnFilters,
  },
  onColumnFiltersChange: setColumnFilters,
})

// Render filter inputs
return (
  <>
    <div>
      <input
        value={table.getColumn('name')?.getFilterValue() ?? ''}
        onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
        placeholder="Filter by name..."
      />
      <input
        type="number"
        value={table.getColumn('age')?.getFilterValue()?.[0] ?? ''}
        onChange={e => {
          const val = e.target.value
          table.getColumn('age')?.setFilterValue([val ? parseInt(val) : undefined, undefined])
        }}
        placeholder="Min age"
      />
      <button onClick={() => table.resetColumnFilters()}>
        Clear Filters
      </button>
    </div>
    <table>
      {/* Table rendering... */}
    </table>
    <div>Filtered rows: {table.getFilteredRowModel().rows.length}</div>
  </>
)
```

## Client-Side Pagination

Paginate data with built-in pagination controls.

```tsx
import { useReactTable, getCoreRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { useState } from 'react'

const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 10,
})

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  state: {
    pagination,
  },
  onPaginationChange: setPagination,
})

// Render pagination controls
return (
  <>
    <table>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td key={cell.id}>{cell.renderValue()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>

    <div>
      <button
        onClick={() => table.firstPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {'<<'}
      </button>
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {'<'}
      </button>
      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {'>'}
      </button>
      <button
        onClick={() => table.lastPage()}
        disabled={!table.getCanNextPage()}
      >
        {'>>'}
      </button>

      <span>
        Page {table.getState().pagination.pageIndex + 1} of{' '}
        {table.getPageCount()}
      </span>

      <select
        value={table.getState().pagination.pageSize}
        onChange={e => table.setPageSize(Number(e.target.value))}
      >
        {[10, 20, 30, 40, 50].map(pageSize => (
          <option key={pageSize} value={pageSize}>
            Show {pageSize}
          </option>
        ))}
      </select>

      <span>
        Showing {table.getRowModel().rows.length} of {data.length} rows
      </span>
    </div>
  </>
)
```

## Server-Side Pagination

Implement pagination with backend API integration.

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useState, useEffect } from 'react'

const [pagination, setPagination] = useState({
  pageIndex: 0,
  pageSize: 10,
})
const [data, setData] = useState([])
const [rowCount, setRowCount] = useState(0)

// Fetch data when pagination changes
useEffect(() => {
  const fetchData = async () => {
    const response = await fetch(
      `/api/users?page=${pagination.pageIndex}&size=${pagination.pageSize}`
    )
    const json = await response.json()
    setData(json.data)
    setRowCount(json.totalRows)
  }
  fetchData()
}, [pagination])

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true, // Disable client-side pagination
  rowCount, // Provide total row count from server
  state: {
    pagination,
  },
  onPaginationChange: setPagination,
})

// Same pagination UI as client-side example
```

## Row Selection

Enable single or multi-row selection with checkboxes.

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useState } from 'react'

const [rowSelection, setRowSelection] = useState({})

const columns = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllRowsSelected()}
        indeterminate={table.getIsSomeRowsSelected()}
        onChange={table.getToggleAllRowsSelectedHandler()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  },
  // ... other columns
]

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  enableRowSelection: true, // Enable for all rows
  // enableRowSelection: row => row.original.age > 18, // Conditional enabling
  enableMultiRowSelection: true,
  state: {
    rowSelection,
  },
  onRowSelectionChange: setRowSelection,
  getRowId: row => row.id, // Use custom row ID
})

// Access selected rows
const selectedRows = table.getSelectedRowModel().rows
console.log('Selected:', selectedRows.map(row => row.original))

// Render controls
return (
  <>
    <div>
      <button onClick={() => table.toggleAllRowsSelected(true)}>
        Select All
      </button>
      <button onClick={() => table.resetRowSelection()}>
        Clear Selection
      </button>
      <span>
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} rows selected
      </span>
    </div>
    <table>{/* Table rendering... */}</table>
  </>
)
```

## Server-Side Filtering and Sorting

Combine server-side operations with controlled state.

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useState, useEffect } from 'react'

const [sorting, setSorting] = useState([])
const [columnFilters, setColumnFilters] = useState([])
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
const [data, setData] = useState([])
const [rowCount, setRowCount] = useState(0)

useEffect(() => {
  const fetchData = async () => {
    const params = new URLSearchParams()
    params.append('page', pagination.pageIndex.toString())
    params.append('size', pagination.pageSize.toString())

    sorting.forEach(sort => {
      params.append('sort', `${sort.id}:${sort.desc ? 'desc' : 'asc'}`)
    })

    columnFilters.forEach(filter => {
      params.append(`filter[${filter.id}]`, filter.value)
    })

    const response = await fetch(`/api/users?${params}`)
    const json = await response.json()

    setData(json.data)
    setRowCount(json.totalRows)
  }

  fetchData()
}, [sorting, columnFilters, pagination])

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  manualSorting: true,
  manualFiltering: true,
  manualPagination: true,
  rowCount,
  state: {
    sorting,
    columnFilters,
    pagination,
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onPaginationChange: setPagination,
})
```

## Accessing Row Data and Values

Work with row objects and cell values in different ways.

```tsx
const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

// Get all rows
const allRows = table.getRowModel().rows

// Get specific row by ID
const row = table.getRow('user-123')

// Access original data
const originalData = row.original
console.log(originalData.firstName) // Direct property access

// Get processed cell values (respects accessor transformations)
const firstName = row.getValue('firstName')
const fullName = row.getValue('fullName') // If using computed accessor

// Render cell values (with fallback for undefined)
const renderedValue = row.renderValue('firstName')

// Access row metadata
console.log(row.id) // Row ID
console.log(row.index) // Row index in current model
console.log(row.depth) // Depth in tree (for nested rows)

// Get cells
const cells = row.getVisibleCells()
cells.forEach(cell => {
  console.log(cell.id) // Cell ID (row.id_column.id)
  console.log(cell.getValue()) // Cell value
  console.log(cell.renderValue()) // Rendered value
  console.log(cell.column.id) // Column ID
})

// Access nested/sub rows (if using expanding feature)
if (row.subRows.length > 0) {
  console.log('Has children:', row.subRows)
  console.log('Parent:', row.getParentRow())
}
```

## Controlling Table State

Manage table state externally or use initial state.

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'
import { useState } from 'react'

// Option 1: Controlled state (full control)
const [sorting, setSorting] = useState([])
const [columnFilters, setColumnFilters] = useState([])
const [columnVisibility, setColumnVisibility] = useState({})
const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  state: {
    sorting,
    columnFilters,
    columnVisibility,
    pagination,
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onColumnVisibilityChange: setColumnVisibility,
  onPaginationChange: setPagination,
})

// Access state
console.log(table.getState())

// Option 2: Initial state (no external control needed)
const table2 = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  initialState: {
    sorting: [{ id: 'name', desc: false }],
    columnFilters: [{ id: 'status', value: 'active' }],
    columnVisibility: { id: false },
    pagination: { pageIndex: 0, pageSize: 25 },
  },
})

// Reset to initial state
table2.resetSorting()
table2.resetColumnFilters()
table2.resetPagination()
```

## Custom Table Metadata

Pass custom data and functions to table context.

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table'

// Extend TableMeta type (in a .d.ts file or at top of file)
declare module '@tanstack/react-table' {
  interface TableMeta<TData> {
    updateData: (rowIndex: number, columnId: string, value: any) => void
    deleteRow: (rowIndex: number) => void
    locale: string
  }
}

const [data, setData] = useState([])

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  meta: {
    updateData: (rowIndex, columnId, value) => {
      setData(old =>
        old.map((row, index) => {
          if (index === rowIndex) {
            return {
              ...old[rowIndex],
              [columnId]: value,
            }
          }
          return row
        })
      )
    },
    deleteRow: (rowIndex) => {
      setData(old => old.filter((_, index) => index !== rowIndex))
    },
    locale: 'en-US',
  },
})

// Access meta in column definitions
const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row, column, getValue, table }) => {
      const initialValue = getValue()
      const [value, setValue] = useState(initialValue)

      const onBlur = () => {
        table.options.meta?.updateData(row.index, column.id, value)
      }

      return (
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={onBlur}
        />
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => (
      <button onClick={() => table.options.meta?.deleteRow(row.index)}>
        Delete
      </button>
    ),
  },
]
```

## Summary

TanStack Table provides a comprehensive solution for building feature-rich data tables in modern web applications. Its core strengths lie in type-safe data processing, flexible state management, and extensive customization options. The library excels at client-side operations for datasets up to tens of thousands of rows while also supporting manual server-side implementations for larger datasets. Common use cases include admin panels, data dashboards, content management systems, e-commerce product catalogs, and any application requiring sortable, filterable, paginated data displays.

The headless architecture makes TanStack Table framework-agnostic and highly portable. Integration patterns typically involve defining typed data structures, creating column definitions with accessor functions, instantiating framework-specific table hooks (like `useReactTable`), and connecting table APIs to UI components. The library's composable row models allow you to layer features like filtering, sorting, pagination, and grouping in any combination. State can be managed internally for simple use cases or controlled externally when coordinating with URL parameters, global state management, or backend APIs. This flexibility makes TanStack Table suitable for both rapid prototyping and production-grade enterprise applications.
