"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { ReasonDemoActionTypes, useReasonDemoStore, useReasonDemoDispatch } from "@/app/context/ReasoningDemoContext";

// Create a new item or update an existing item in localStorage
const saveToLocalStorage = (key: string, value: any) => {
    localStorage.setItem(`x-reason-${key}`, value);
};

// Read an item from localStorage
const readFromLocalStorage = (key: string) => {
    const item = localStorage.getItem(key);
    const parts = item?.split('@@');
    const states = parts?.[0] ? JSON.parse(parts[0]) : undefined;
    const solution = parts?.[1];
    return { states, solution };
};

// Delete an item from localStorage
const deleteFromLocalStorage = (key: string) => {
    localStorage.removeItem(key);
};

// Get all keys from localStorage with x-reason prefix
const getAllReasonKeys = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('x-reason-')) {
            keys.push(key.replace('x-reason-', ''));
        }
    }
    return keys;
};

const LocalStorage = () => {
    const { states, solution } = useReasonDemoStore();
    const dispatch = useReasonDemoDispatch();
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [name, setName] = useState('');
    const [availableKeys, setAvailableKeys] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string | undefined>();

    useEffect(() => {
        setAvailableKeys(getAllReasonKeys());
    }, []);

    const handleSave = () => {
        if (!states || !solution) {
            console.warn('No states or solution to save');
            return;
        }
        
        console.log('Saving solution:', { name, states, solution });
        saveToLocalStorage(name, `${JSON.stringify(states)}@@${solution}`);
        setAvailableKeys(getAllReasonKeys());
        setIsSaveDialogOpen(false);
        setName(''); // Clear the name field
    };

    const handleDelete = () => {
        if (selectedKey) {
            deleteFromLocalStorage(`x-reason-${selectedKey}`);
            setAvailableKeys(getAllReasonKeys());
            setIsDeleteDialogOpen(false);
        }
    };

    const handleSelectKey = (key: string) => {
        setSelectedKey(key);
    };

    const handleLoad = () => {
        if (selectedKey) {
            console.log('Loading solution:', selectedKey);
            const { states: loadedStates, solution: loadedSolution } = readFromLocalStorage(`x-reason-${selectedKey}`);
            console.log('Loaded data:', { loadedStates, loadedSolution });
            
            dispatch({
                type: ReasonDemoActionTypes.SET_STATE,
                value: {
                    states: loadedStates,
                    solution: loadedSolution,
                    currentState: undefined,
                    context: undefined,
                    event: undefined,
                }
            });
            
            // Temporary feedback - in a real app you might want a toast notification
            console.log(`✅ Solution "${selectedKey}" loaded successfully!`);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2 w-full">
                <Button 
                    variant="default" 
                    onClick={() => setIsSaveDialogOpen(true)}
                    className="w-full text-xs"
                    size="sm"
                >
                    Save Solution
                </Button>
                <Button 
                    variant="destructive" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="w-full text-xs border border-red-300"
                    size="sm"
                >
                    Delete Solution
                </Button>
                <Button 
                    variant="secondary" 
                    onClick={handleLoad}
                    className="w-full text-xs"
                    size="sm"
                    disabled={!selectedKey}
                    title={!selectedKey ? "Select a solution first" : `Load solution: ${selectedKey}`}
                >
                    Load Solution
                </Button>
            </div>

            <div>
                <h4 className="text-sm font-semibold mb-2">Available Solutions</h4>
                <select 
                    value={selectedKey || ''} 
                    onChange={(e) => handleSelectKey(e.target.value)}
                    className="w-full p-2 border rounded text-xs"
                >
                    <option value="">Select a solution</option>
                    {availableKeys.map(key => (
                        <option key={key} value={key}>{key}</option>
                    ))}
                </select>
                {availableKeys.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">({availableKeys.length} available)</p>
                )}
            </div>

            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900 border shadow-lg">
                    <DialogHeader className="space-y-3 pb-4">
                        <DialogTitle className="text-xl font-bold text-black dark:text-white">
                            Save Solution
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-700 dark:text-gray-200">
                            Give your solution a memorable name so you can easily find it later.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-base font-semibold text-black dark:text-white">
                                Solution Name
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g. User Registration Flow v1"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full text-black dark:text-white bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-end space-x-2 pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsSaveDialogOpen(false)}
                            className="text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            onClick={handleSave}
                            disabled={!name.trim()}
                            className="text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-200"
                        >
                            Save Solution
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900 border shadow-lg">
                    <DialogHeader className="space-y-3 pb-4">
                        <DialogTitle className="text-xl font-bold text-black dark:text-white">
                            Delete Solution
                        </DialogTitle>
                        <DialogDescription className="text-base text-gray-700 dark:text-gray-200">
                            Are you sure you want to delete this solution? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end space-x-2 pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="text-black dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button" 
                            variant="destructive" 
                            onClick={handleDelete}
                            className="text-white bg-red-600 hover:bg-red-700 border border-red-400"
                        >
                            Delete Solution
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LocalStorage;
