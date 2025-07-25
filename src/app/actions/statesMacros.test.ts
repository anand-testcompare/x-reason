import { createActor } from 'xstate';
import { v4 as uuidv4 } from 'uuid';

import { machineMacro, IContext, IEvent } from './statesMacros'; // Adjust the import path

describe('machineMacro', () => {
  const mockSteps = new Map();

  beforeAll(() => {
    mockSteps.set('step1', {id: 'step1', func: jest.fn().mockResolvedValue({
      step1Log: {
        message: 'Step 1 completed',
      }
    })});
    mockSteps.set('step2', {id: 'step2', func: jest.fn().mockResolvedValue({
      step2Log: {
        message: 'Step 2 completed',
      }
    })});
    mockSteps.set('pauseStep', {id: 'pauseStep', type: 'pause', func: jest.fn().mockResolvedValue({
      step3Log: {
        message: 'Step 3 completed',
      }
    })});
    mockSteps.set('resumeStep', {id: 'resumeStep', func: jest.fn().mockResolvedValue({
      step4Log: {
        message: 'Step 4 completed',
      }
    })});
    mockSteps.set('step5', {id: 'step5', func: jest.fn().mockResolvedValue({
      step5Log: {
        message: 'Step 5 completed',
      }
    })});
  });

  it('should pause and resume the state machine', async () => {
    return new Promise((resolve, reject) => {
      const testMachine = machineMacro(mockSteps);
      const id = uuidv4();
      
      // Create actor with initial context
      const machineExecution = createActor(testMachine, {
        input: {
          status: 0,
          requestId: id,
          stack: [],
        }
      });

      // Subscribe to state changes
      machineExecution.subscribe((state) => {
        const stateNode = testMachine.getStateNodeById(state.value as string);
        const type = stateNode?.config?.meta?.type;
        console.log(`onTransition state.value: ${state.value}`);
        // console.log(`onTransition state.meta.type: ${type}`);
        state.context.stack?.push(state.value as string);
        switch (state.value) {
          case "success":
            // TODO logging
            // console.log(JSON.stringify(state.context));
            expect(JSON.stringify(state.context)).toBe(JSON.stringify({status:0,requestId:id,stack:["step1","step2","pauseStep","resumeStep","step5","success"],step1Log:{message:"Step 1 completed"},step2Log:{message:"Step 2 completed"},step4Log:{message:"Step 4 completed"},step5Log:{message:"Step 5 completed"}}))
            expect(mockSteps.get('resumeStep').func).toHaveBeenCalled();
            expect(state.context.stack?.length).toBe(6);
            resolve(state.context);
            break;
          case "failure":
            // TODO error reporting
            reject(state.context);
            break;
          default:
            //console.log(`state.meta.type === 'pause': ${type === 'pause'}`)
            if (type === 'pause') {
              // Introduce a delay before resuming execution
              setTimeout(() => {
                machineExecution.send({ type: 'RESUME_EXECUTION' });
              }, 1); // Delay of 1 millisecond
            }
        }
      });

      machineExecution.start();
    });
  });
});
