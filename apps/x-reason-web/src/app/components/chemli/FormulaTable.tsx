"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Trash2, Plus, Undo, Redo } from "lucide-react";

export interface IFormula {
  title?: string;
  industry?: string;
  phases?: IPhase;
  table?: string[][];
  metadata: IFormulaMetadata;
  "Manufacturing Procedure"?: string;
  "Marketing Claims"?: string;
}

export interface IFormulaMetadata {
  title?: string;
  description?: string;
  productImage?: string;
  permalink?: string;
}

export interface IRenderFormulaProps {
  className: string;
  table: IFormula;
}

export interface IPhaseStep {
  [key: string]: string;
}

export interface IPhase {
  [key: string]: IPhaseStep[];
}

function deepEquals(table1: string[][], table2: string[][]) {
  if (table1.length != table2.length) {
    return false;
  }

  for (let i = 0; i < table1.length; i++) {
    if (table1[i].length !== table2[i].length) {
      return false;
    }
    for (let j = 0; j < table1[i].length; j++) {
      if (table1[i][j] !== table2[i][j]) {
        return false;
      }
    }
  }
  return true;
}

function deepCopy(table: string[][]) {
  const newTable = [];
  newTable.push(...table.map((row: string[]) => row.map((v) => v)));
  return newTable;
}

export default function FormulaTable(props: IRenderFormulaProps) {
  // local states
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState([] as string[][][]);
  const [redoStack, setRedoStack] = useState([] as string[][][]);
  const [tableData, setTableData] = useState<string[][]>([]);
  const activeFormula = props.table;
  const _formulaIsLoading = false;

  const tableReference: any = useRef(null);

  useEffect(() => {
    if (activeFormula?.table) {
      setTableData(deepCopy(activeFormula.table));
    }
  }, [activeFormula?.table]);

  const formula: IFormula = activeFormula ?? ({} as IFormula);

  if (!tableData || tableData.length === 0) {
    return <div>No table data available</div>;
  }
  
  const headers = tableData[0];
  const phaseIndex = headers.indexOf("phase");
  const dataRows = tableData.slice(1);

  // we only want to allow adding rows and columns whenever a single row or single column is selected
  const disableNewRowOperations = selectedRow === null;
  const disableNewColumnOperations = selectedCol === null;
  const disableDeleteRowOperations = selectedRow === null;
  const disableDeleteColOperations = selectedCol === null;

  function updateTableData(newData: string[][], oldData?: string[][], resetRedoStack?: boolean) {
    if (resetRedoStack === undefined) {
      resetRedoStack = true;
    }
    
    if (oldData && !deepEquals(oldData, newData)) {
      setUndoStack(prev => [...prev, oldData]);
      if (resetRedoStack) {
        setRedoStack([]);
      }
    }
    
    setTableData(newData);
    // Update the original formula if it exists
    if (formula.table) {
      formula.table = newData;
    }
  }

  function undo() {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, tableData]);
      setUndoStack(prev => prev.slice(0, -1));
      updateTableData(lastState, undefined, false);
    }
  }

  function redo() {
    if (redoStack.length > 0) {
      const oldTable = tableData;
      const nextState = redoStack[redoStack.length - 1];
      setRedoStack(prev => prev.slice(0, -1));
      updateTableData(nextState, oldTable, false);
    }
  }

  function _clearCell(rowIndex: number, colIndex: number): void {
    const oldTable = deepCopy(tableData);
    const newTable = deepCopy(tableData);
    newTable[rowIndex][colIndex] = "";
    updateTableData(newTable, oldTable);
  }

  function deleteRow() {
    if (selectedRow !== null && selectedRow > 0) { // Don't delete header row
      const oldTable = deepCopy(tableData);
      const newTable = deepCopy(tableData);
      newTable.splice(selectedRow, 1);
      updateTableData(newTable, oldTable);
      setSelectedRow(null);
    }
  }

  function deleteColumn() {
    if (selectedCol !== null) {
      const oldTable = deepCopy(tableData);
      const newTable = deepCopy(tableData);
      for (let i = 0; i < newTable.length; i++) {
        newTable[i].splice(selectedCol, 1);
      }
      updateTableData(newTable, oldTable);
      setSelectedCol(null);
    }
  }

  function newRow(offset: number) {
    if (selectedRow !== null) {
      const oldTable = deepCopy(tableData);
      const newTable = deepCopy(tableData);
      const index = selectedRow + offset;
      const newRowData = new Array(tableData[0].length).fill("");
      newTable.splice(index, 0, newRowData);
      updateTableData(newTable, oldTable);
    }
  }

  function newColumn(offset: number) {
    if (selectedCol !== null) {
      const oldTable = deepCopy(tableData);
      const newTable = deepCopy(tableData);
      const index = selectedCol + offset;
      for (let i = 0; i < newTable.length; i++) {
        newTable[i].splice(index, 0, "");
      }
      updateTableData(newTable, oldTable);
    }
  }

  function updateCellValue(rowIndex: number, columnIndex: number, value: string) {
    const oldTable = deepCopy(tableData);
    const newTable = deepCopy(tableData);
    newTable[rowIndex][columnIndex] = value;
    updateTableData(newTable, oldTable);
  }

  function getPhaseColor(phase: string, isEven: boolean) {
    const colorMap: { [key: string]: string } = {
      'a': isEven ? 'bg-red-50' : 'bg-red-100',
      'b': isEven ? 'bg-blue-50' : 'bg-blue-100',
      'c': isEven ? 'bg-green-50' : 'bg-green-100',
      'd': isEven ? 'bg-yellow-50' : 'bg-yellow-100',
    };
    return colorMap[phase?.toLowerCase()] || (isEven ? 'bg-gray-50' : 'bg-white');
  }

  return (
    <TooltipProvider>
      <Card className={props.className} data-testid="formulaTable">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{formula.title || "Formula Table"}</span>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={deleteRow} disabled={disableDeleteRowOperations} className="border-red-300 hover:border-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete selected row</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={deleteColumn} disabled={disableDeleteColOperations} className="border-red-300 hover:border-red-400">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete selected column</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={undo} disabled={undoStack.length === 0}>
                    <Undo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={redo} disabled={redoStack.length === 0}>
                    <Redo className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => newRow(1)} disabled={disableNewRowOperations}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add row</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => newColumn(1)} disabled={disableNewColumnOperations}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add column</TooltipContent>
              </Tooltip>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div ref={tableReference} className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead 
                      key={index} 
                      className={`cursor-pointer ${selectedCol === index ? 'bg-blue-100' : ''}`}
                      onClick={() => setSelectedCol(selectedCol === index ? null : index)}
                    >
                      <Input
                        value={header}
                        onChange={(e) => updateCellValue(0, index, e.target.value)}
                        className="border-none bg-transparent font-medium"
                      />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataRows.map((row, rowIndex) => {
                  const actualRowIndex = rowIndex + 1;
                  const phase = phaseIndex >= 0 ? row[phaseIndex] : '';
                  const isEven = rowIndex % 2 === 0;
                  
                  return (
                    <TableRow 
                      key={rowIndex}
                      className={`cursor-pointer ${selectedRow === actualRowIndex ? 'bg-blue-100' : getPhaseColor(phase, isEven)}`}
                      onClick={() => setSelectedRow(selectedRow === actualRowIndex ? null : actualRowIndex)}
                    >
                      {row.map((cell, colIndex) => (
                        <TableCell key={colIndex}>
                          <Input
                            value={cell}
                            onChange={(e) => updateCellValue(actualRowIndex, colIndex, e.target.value)}
                            className="border-none bg-transparent"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {formula["Manufacturing Procedure"] && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Manufacturing Procedure</h4>
              <p className="text-sm text-gray-600">{formula["Manufacturing Procedure"]}</p>
            </div>
          )}
          
          {formula["Marketing Claims"] && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Marketing Claims</h4>
              <ul className="text-sm text-gray-600">
                {Array.isArray(formula["Marketing Claims"]) 
                  ? formula["Marketing Claims"].map((claim: string, index: number) => (
                      <li key={index}>• {claim}</li>
                    ))
                  : <li>• {formula["Marketing Claims"]}</li>
                }
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
