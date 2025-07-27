import { createActor } from "xstate";
import { StateConfig, programV1, Context, MachineEvent, Task } from "./";

describe("Testing Programmer", () => {
  let activeActors: any[] = [];

  afterEach(() => {
    // Clean up any active actors to prevent memory leaks
    activeActors.forEach(actor => {
      if (actor && typeof actor.stop === 'function') {
        actor.stop();
      }
    });
    activeActors = [];
  });

  test("Test programV1 can create a basic state machine", () => {
    const stateConfigArray: StateConfig[] = [
      {
        id: "initial",
        transitions: [{ on: "CONTINUE", target: "success" }],
      },
      {
        id: "success",
        type: "final",
      },
    ];

    const sampleCatalog = new Map<string, Task>([
      [
        "initial",
        {
          description: "Initial test state",
          implementation: () => {
            // Simple synchronous implementation
          },
        },
      ],
    ]);

    const machine = programV1(stateConfigArray, sampleCatalog);
    expect(machine).toBeDefined();
    expect(machine.config).toBeDefined();
    expect(machine.config.states).toBeDefined();
    expect(machine.config.initial).toBe("initial");
  });

  test("Test programV1 handles final states correctly", () => {
    const stateConfigArray: StateConfig[] = [
      {
        id: "testState",
        transitions: [{ on: "CONTINUE", target: "final" }],
      },
      {
        id: "final",
        type: "final",
      },
    ];

    const sampleCatalog = new Map<string, Task>([
      [
        "testState",
        {
          description: "Test state",
          implementation: () => {
            // Simple implementation
          },
        },
      ],
    ]);

    const machine = programV1(stateConfigArray, sampleCatalog);
    expect(machine.config.states?.final?.type).toBe("final");
  });

  test("Test programV1 throws error for missing task implementation", () => {
    const stateConfigArray: StateConfig[] = [
      {
        id: "missingTask",
        transitions: [{ on: "CONTINUE", target: "success" }],
      },
      {
        id: "success",
        type: "final",
      },
    ];

    const emptyCatalog = new Map<string, Task>();

    expect(() => {
      programV1(stateConfigArray, emptyCatalog);
    }).toThrow("function implementation for state: missingTask not found");
  });

  test("Test simple state machine execution without memory leaks", async () => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Test timed out after 10 seconds"));
      }, 10000);

      const stateConfigArray: StateConfig[] = [
        {
          id: "task1",
          transitions: [{ on: "CONTINUE", target: "task2" }],
        },
        {
          id: "task2",
          transitions: [{ on: "CONTINUE", target: "success" }],
        },
        {
          id: "success",
          type: "final",
        },
        {
          id: "failure",
          type: "final",
        },
      ];

      let machineExecution: any;

      const sampleCatalog = new Map<string, Task>([
        [
          "task1",
          {
            description: "First task",
            implementation: (_context: Context, _event?: MachineEvent) => {
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { task1: "Task 1 completed" },
                });
              }, 10);
            },
          },
        ],
        [
          "task2",
          {
            description: "Second task",
            implementation: (_context: Context, _event?: MachineEvent) => {
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { task2: "Task 2 completed" },
                });
              }, 10);
            },
          },
        ],
      ]);

      const result = programV1(stateConfigArray, sampleCatalog);
      machineExecution = createActor(result);
      activeActors.push(machineExecution);

      machineExecution.subscribe((state: any) => {
        switch (state.value) {
          case "success":
            expect(state.context).toMatchObject({
              status: 0,
              task1: "Task 1 completed",
              task2: "Task 2 completed",
            });
            expect(state.context.requestId).toBeDefined();
            clearTimeout(timeoutId);
            resolve();
            break;
          case "failure":
            clearTimeout(timeoutId);
            reject(new Error("Test failed: " + JSON.stringify(state.context)));
            break;
        }
      });

      machineExecution.start();
    });
  });

  test("Debug parallel state configuration", () => {
    const stateConfigArray: StateConfig[] = [
      {
        id: "parallelTasks",
        type: "parallel",
        states: [
          {
            id: "Task1",
            transitions: [{ on: "CONTINUE", target: "success" }],
          },
          {
            id: "Task2",  
            transitions: [{ on: "CONTINUE", target: "success" }],
          },
        ],
        onDone: "success",
      },
      {
        id: "success",
        type: "final",
      },
    ];

    const sampleCatalog = new Map<string, Task>([
      [
        "Task1",
        {
          description: "Parallel task 1",
          implementation: () => {},
        },
      ],
      [
        "Task2",
        {
          description: "Parallel task 2", 
          implementation: () => {},
        },
      ],
    ]);

    // Test machine creation and log the configuration
    const machine = programV1(stateConfigArray, sampleCatalog);
    console.log("Machine config:", JSON.stringify(machine.config, null, 2));
    expect(machine).toBeDefined();
    expect(machine.config.states?.parallelTasks?.type).toBe("parallel");
  });

  test("Test simple parallel execution", async () => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Test timed out after 5 seconds"));
      }, 5000);

      const stateConfigArray: StateConfig[] = [
        {
          id: "parallelTasks",
          type: "parallel",
          states: [
            {
              id: "Task1",
              transitions: [{ on: "CONTINUE", target: "success" }],
            },
            {
              id: "Task2",  
              transitions: [{ on: "CONTINUE", target: "success" }],
            },
          ],
          onDone: "success",
        },
        {
          id: "success",
          type: "final",
        },
      ];

      let machineExecution: any;

      const sampleCatalog = new Map<string, Task>([
        [
          "Task1",
          {
            description: "Parallel task 1",
            implementation: () => {
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { Task1: "Task 1 done" },
                });
              }, 20);
            },
          },
        ],
        [
          "Task2",
          {
            description: "Parallel task 2", 
            implementation: () => {
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { Task2: "Task 2 done" },
                });
              }, 30);
            },
          },
        ],
      ]);

      const result = programV1(stateConfigArray, sampleCatalog);
      machineExecution = createActor(result);
      activeActors.push(machineExecution);

      machineExecution.subscribe((state: any) => {
        switch (state.value) {
          case "success":
            // Check that both parallel tasks completed
            expect(state.context).toMatchObject({
              Task1: "Task 1 done",
              Task2: "Task 2 done",
            });
            clearTimeout(timeoutId);
            resolve();
            break;
          case "failure":
            clearTimeout(timeoutId);
            reject(new Error("Test failed"));
            break;
        }
      });

      machineExecution.start();
    });
  });

  test("Test parallel state creation (config only, no execution)", () => {
    const stateConfigArray: StateConfig[] = [
      {
        id: "parallelTasks",
        type: "parallel",
        states: [
          {
            id: "Task1",
            transitions: [{ on: "CONTINUE", target: "success" }],
          },
          {
            id: "Task2",  
            transitions: [{ on: "CONTINUE", target: "success" }],
          },
        ],
        onDone: "success",
      },
      {
        id: "success",
        type: "final",
      },
    ];

    const sampleCatalog = new Map<string, Task>([
      [
        "Task1",
        {
          description: "Parallel task 1",
          implementation: () => {},
        },
      ],
      [
        "Task2",
        {
          description: "Parallel task 2", 
          implementation: () => {},
        },
      ],
    ]);

    // Just test that the machine can be created without memory issues
    const machine = programV1(stateConfigArray, sampleCatalog);
    expect(machine).toBeDefined();
    expect(machine.config.states?.parallelTasks?.type).toBe("parallel");
  });

  test("Test parallel state execution with onDone transition", async () => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Test timed out after 15 seconds"));
      }, 15000);

      const stateConfigArray: StateConfig[] = [
        {
          id: "InitialState",
          transitions: [
            { on: "CONTINUE", target: "parallelChecks" },
            { on: "ERROR", target: "failure" },
          ],
        },
        {
          id: "parallelChecks",
          type: "parallel",
          states: [
            {
              id: "RegulatoryCheck",
              transitions: [
                { on: "CONTINUE", target: "success" },
                { on: "ERROR", target: "failure" },
              ],
            },
            {
              id: "ConcentrationEstimation",
              transitions: [
                { on: "CONTINUE", target: "success" },
                { on: "ERROR", target: "failure" },
              ],
            },
          ],
          onDone: "FinalState",
        },
        {
          id: "FinalState",
          transitions: [
            { on: "CONTINUE", target: "success" },
            { on: "ERROR", target: "failure" },
          ],
        },
        {
          id: "success",
          type: "final",
        },
        {
          id: "failure",
          type: "final",
        },
      ];

      let machineExecution: any;
      const executionOrder: string[] = [];
      const startTimes: { [key: string]: number } = {};
      const endTimes: { [key: string]: number } = {};

      const sampleCatalog = new Map<string, Task>([
        [
          "InitialState",
          {
            description: "Initial state that triggers parallel execution",
            implementation: (_context: Context, _event?: MachineEvent) => {
              executionOrder.push("InitialState");
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { InitialState: "Initial state completed" },
                });
              }, 10);
            },
          },
        ],
        [
          "RegulatoryCheck",
          {
            description: "Regulatory compliance check",
            implementation: (_context: Context, _event?: MachineEvent) => {
              executionOrder.push("RegulatoryCheck_start");
              startTimes.RegulatoryCheck = Date.now();
              setTimeout(() => {
                endTimes.RegulatoryCheck = Date.now();
                executionOrder.push("RegulatoryCheck_end");
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { RegulatoryCheck: "No regulatory issues found" },
                });
              }, 50);
            },
          },
        ],
        [
          "ConcentrationEstimation",
          {
            description: "Concentration estimation check",
            implementation: (_context: Context, _event?: MachineEvent) => {
              executionOrder.push("ConcentrationEstimation_start");
              startTimes.ConcentrationEstimation = Date.now();
              setTimeout(() => {
                endTimes.ConcentrationEstimation = Date.now();
                executionOrder.push("ConcentrationEstimation_end");
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { ConcentrationEstimation: ["30-31%", "40-45%"] },
                });
              }, 75);
            },
          },
        ],
        [
          "FinalState",
          {
            description: "Final state after parallel completion",
            implementation: (_context: Context, _event?: MachineEvent) => {
              executionOrder.push("FinalState");
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { FinalState: "All checks completed" },
                });
              }, 10);
            },
          },
        ],
      ]);

      const result = programV1(stateConfigArray, sampleCatalog);
      machineExecution = createActor(result);
      activeActors.push(machineExecution);

      machineExecution.subscribe((state: any) => {
        switch (state.value) {
          case "success":
            // Verify parallel execution occurred
            expect(executionOrder).toContain("RegulatoryCheck_start");
            expect(executionOrder).toContain("ConcentrationEstimation_start");
            expect(executionOrder).toContain("FinalState");
            
            // Verify parallel tasks started around the same time (within reasonable margin)
            const timeDiff = Math.abs(startTimes.RegulatoryCheck - startTimes.ConcentrationEstimation);
            expect(timeDiff).toBeLessThan(50); // Should start within 50ms of each other

            // Verify context contains results from both parallel tasks
            expect(state.context).toMatchObject({
              status: 0,
              InitialState: "Initial state completed",
              RegulatoryCheck: "No regulatory issues found",
              ConcentrationEstimation: ["30-31%", "40-45%"],
              FinalState: "All checks completed",
            });
            
            clearTimeout(timeoutId);
            resolve();
            break;
          case "failure":
            clearTimeout(timeoutId);
            reject(new Error("Test failed: " + JSON.stringify(state.context)));
            break;
        }
      });

      machineExecution.start();
    });
  });

  test("Test parallel execution timing to verify concurrency", async () => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Test timed out after 15 seconds"));
      }, 15000);

      const stateConfigArray: StateConfig[] = [
        {
          id: "parallelTasks",
          type: "parallel",
          states: [
            {
              id: "SlowTask",
              transitions: [
                { on: "CONTINUE", target: "success" },
                { on: "ERROR", target: "failure" },
              ],
            },
            {
              id: "FastTask",
              transitions: [
                { on: "CONTINUE", target: "success" },
                { on: "ERROR", target: "failure" },
              ],
            },
          ],
          onDone: "success",
        },
        {
          id: "success",
          type: "final",
        },
        {
          id: "failure",
          type: "final",
        },
      ];

      let machineExecution: any;
      const startTime = Date.now();
      let slowTaskStart = 0;
      let fastTaskStart = 0;
      let slowTaskEnd = 0;
      let fastTaskEnd = 0;

      const sampleCatalog = new Map<string, Task>([
        [
          "SlowTask",
          {
            description: "A task that takes 100ms to complete",
            implementation: (_context: Context, _event?: MachineEvent) => {
              slowTaskStart = Date.now();
              setTimeout(() => {
                slowTaskEnd = Date.now();
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { SlowTask: "Slow task completed" },
                });
              }, 100);
            },
          },
        ],
        [
          "FastTask",
          {
            description: "A task that takes 30ms to complete",
            implementation: (_context: Context, _event?: MachineEvent) => {
              fastTaskStart = Date.now();
              setTimeout(() => {
                fastTaskEnd = Date.now();
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { FastTask: "Fast task completed" },
                });
              }, 30);
            },
          },
        ],
      ]);

      const result = programV1(stateConfigArray, sampleCatalog);
      machineExecution = createActor(result);
      activeActors.push(machineExecution);

      machineExecution.subscribe((state: any) => {
        switch (state.value) {
          case "success":
            const totalTime = Date.now() - startTime;
            
            // Verify both tasks started around the same time (parallel execution)
            const startTimeDiff = Math.abs(slowTaskStart - fastTaskStart);
            expect(startTimeDiff).toBeLessThan(50); // Should start within 50ms
            
            // Verify fast task finished before slow task (if truly parallel)
            expect(fastTaskEnd).toBeLessThan(slowTaskEnd);
            
            // Verify total execution time is closer to the slow task time than the sum
            // If sequential: ~130ms (100 + 30), if parallel: ~100ms (max of both)
            expect(totalTime).toBeLessThan(150); // Should be much less than sequential
            expect(totalTime).toBeGreaterThan(90); // But at least as long as the slowest task
            
            // Verify context contains results from both tasks
            expect(state.context).toMatchObject({
              SlowTask: "Slow task completed",
              FastTask: "Fast task completed",
            });
            
            clearTimeout(timeoutId);
            resolve();
            break;
          case "failure":
            clearTimeout(timeoutId);
            reject(new Error("Test failed: " + JSON.stringify(state.context)));
            break;
        }
      });

      machineExecution.start();
    });
  });

  test("Test parallel state error handling", async () => {
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Test timed out after 15 seconds"));
      }, 15000);

      const stateConfigArray: StateConfig[] = [
        {
          id: "parallelWithError",
          type: "parallel",
          states: [
            {
              id: "SuccessfulTask",
              transitions: [
                { on: "CONTINUE", target: "success" },
                { on: "ERROR", target: "failure" },
              ],
            },
            {
              id: "FailingTask",
              transitions: [
                { on: "CONTINUE", target: "success" },
                { on: "ERROR", target: "failure" },
              ],
            },
          ],
          onDone: "success",
        },
        {
          id: "success",
          type: "final",
        },
        {
          id: "failure",
          type: "final",
        },
      ];

      let machineExecution: any;

      const sampleCatalog = new Map<string, Task>([
        [
          "SuccessfulTask",
          {
            description: "A task that succeeds",
            implementation: (_context: Context, _event?: MachineEvent) => {
              setTimeout(() => {
                machineExecution.send({
                  type: "CONTINUE",
                  payload: { SuccessfulTask: "Task succeeded" },
                });
              }, 30);
            },
          },
        ],
        [
          "FailingTask",
          {
            description: "A task that fails",
            implementation: (_context: Context, _event?: MachineEvent) => {
              setTimeout(() => {
                machineExecution.send({
                  type: "ERROR",
                  payload: { FailingTask: "Task failed", status: -1 },
                });
              }, 50);
            },
          },
        ],
      ]);

      const result = programV1(stateConfigArray, sampleCatalog);
      machineExecution = createActor(result);
      activeActors.push(machineExecution);

      machineExecution.subscribe((state: any) => {
        switch (state.value) {
          case "success":
            // This shouldn't happen with one failing task
            clearTimeout(timeoutId);
            reject(new Error("Expected failure but got success"));
            break;
          case "failure":
            // Verify that failure was handled correctly
            expect(state.context).toMatchObject({
              status: -1,
              FailingTask: "Task failed",
            });
            clearTimeout(timeoutId);
            resolve();
            break;
        }
      });

      machineExecution.start();
    });
  });
});