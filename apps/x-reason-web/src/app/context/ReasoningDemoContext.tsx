"use client";
import { ActionType, makeStore, factory } from "@/app/utils";
import { MachineEvent, Context, StateConfig, Task, Prompt } from "@/app/api/reasoning";
import { chemliFunctionCatalog, chemliToolsCatalog, chemliMetaData } from "./chemli";
import { regieFunctionCatalog, regieToolsCatalog, regieMetaData } from "@/app/api/regie/context";
import {
    programmer as chemliProgrammer,
    solver as chemliSolver,
    evaluate as chemliEvaluate,
    regieProgrammer,
    regieSolver,
    regieEvaluate,
} from "@/app/api/reasoning/prompts";
import { Factory } from "@/app/utils/factory";

export type ReasonContextType = {
    callback?: (_event: MachineEvent) => void,
    query?: string,
    solution?: string,
    states?: StateConfig[],
    currentState?: string,
    context?: Context,
    event?: MachineEvent,
    functions?: Map<string, Task>;
    factory: Factory<Context, {
        programmer: Prompt,
        solver: Prompt,
        evaluate: Prompt,
        getMetadata: () => { title: string, description: string },
        getFunctionCatalog: (dispatch: (action: ActionType) => void) => Map<string, Task>,
        getToolsCatalog: () => Map<string, { description: string }>
    }>;
    [key: string]: unknown;
};

const appInitialState: ReasonContextType = {
    callback: (_event: MachineEvent) => console.log("default callback called"),
    states: [],
    context: {
        requestId: "",
        status: 0
    },
    factory: factory({
        chemli: (_context: Context) => {
            return {
                programmer: chemliProgrammer,
                solver: chemliSolver,
                evaluate: chemliEvaluate,
                getFunctionCatalog: chemliFunctionCatalog,
                getToolsCatalog: chemliToolsCatalog,
                getMetadata: chemliMetaData,
            };
        },
        regie: (_context: Context) => {
            // TODO
            return {
                programmer: regieProgrammer,
                solver: regieSolver,
                evaluate: regieEvaluate,
                getFunctionCatalog: regieFunctionCatalog,
                getToolsCatalog: regieToolsCatalog,
                getMetadata: regieMetaData,
            };
        },
    }) as Factory<Context, {
        programmer: Prompt,
        solver: Prompt,
        evaluate: Prompt,
        getMetadata: () => { title: string, description: string },
        getFunctionCatalog: (dispatch: (action: ActionType) => void) => Map<string, Task>,
        getToolsCatalog: () => Map<string, { description: string }>
    }>,
}

export enum ReasonDemoActionTypes {
    SET_STATE = "setFormula",
};

export enum EngineTypes {
    CHEMLI = "chemli",
    REGIE = "regie",
};

const appReducer = (state: ReasonContextType, action: ActionType): ReasonContextType => {
    switch (action.type) {
        case ReasonDemoActionTypes.SET_STATE: // example for specific handlers
        default: {
            return {
                ...state,
                ...action.value,
            };
        }
    }
};

const [Provider, useDispatch, useStore] = makeStore<ReasonContextType, ActionType>(appInitialState, appReducer);

export { Provider as ReasonDemoProvider, useDispatch as useReasonDemoDispatch, useStore as useReasonDemoStore };
