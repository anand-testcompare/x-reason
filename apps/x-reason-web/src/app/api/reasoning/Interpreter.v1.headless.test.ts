import { headlessInterpreter } from '.';
import { MachineEvent, Context, StateConfig, Task } from '.';

describe('headlessInterpreter', () => {
    const mockDispatch = jest.fn();

    const mockStates: StateConfig[] = [
        {
            id: 'mockTask',
            transitions: [{ on: 'CONTINUE', target: 'nextState' }],
        },
        {
            id: 'nextState',
            transitions: [{ on: 'CONTINUE', target: 'success' }],
        },
        {
            id: 'success',
            type: 'final'
        },
        {
            id: 'failure',
            type: 'final'
        }
    ];

    const mockFunctions = new Map<string, Task>([
        [
            'mockTask',
            {
                description:
                    'mockTask',
                // this is an example of a visual state that requires user interaction
                implementation: (_context: Context, _event?: MachineEvent) => {
                    console.log('mockTask implementation called');
                },
            },
        ],
        [
            'nextState',
            {
                description:
                    'nextState',
                // this is an example of a visual state that requires user interaction
                implementation: (_context: Context, _event?: MachineEvent) => {
                    console.log('nextState implementation called');
                },
            },
        ],
    ]);

    beforeEach(() => {
        mockDispatch.mockClear();
    });

    it('should initialize and transition states correctly', () => {
        const { done, start, send } = headlessInterpreter(mockStates, mockFunctions, mockDispatch);

        start();

        expect(mockDispatch).toHaveBeenCalledTimes(1);

        // Get the actual dispatched value to check state format
        const firstCall = mockDispatch.mock.calls[0][0];
        expect(firstCall.type).toBe('SET_STATE');
        expect(firstCall.value.currentState.value).toMatch(/^mockTask/);
        expect(firstCall.value.currentState.context.requestId).toBe('test');
        expect(firstCall.value.currentState.context.status).toBe(0);
        expect(firstCall.value.currentState.context.stack[0]).toMatch(/^mockTask/);

        expect(done()).toBe(false);
        // Simulate the transition
        send({ type: 'CONTINUE' });

        expect(mockDispatch).toHaveBeenCalledTimes(2);

        const secondCall = mockDispatch.mock.calls[1][0];
        expect(secondCall.type).toBe('SET_STATE');
        expect(secondCall.value.currentState.value).toMatch(/^nextState/);
        expect(secondCall.value.currentState.context.requestId).toBe('test');
        expect(secondCall.value.currentState.context.status).toBe(0);
        expect(secondCall.value.currentState.context.stack.length).toBe(2);
        expect(secondCall.value.currentState.context.stack[0]).toMatch(/^mockTask/);
        expect(secondCall.value.currentState.context.stack[1]).toMatch(/^nextState/);

        send({ type: 'CONTINUE' });

        expect(done()).toBe(true);

    });

    it('should hydrate from the serialized state', () => {
        const { serialize, stop, start } = headlessInterpreter(mockStates, mockFunctions, mockDispatch);

        start();

        const currentState = mockDispatch.mock.calls[0][0].value.currentState;
        const serializedState = serialize(currentState);

        stop();

        mockDispatch.mockClear();

        // Parse and restore the serialized state
        const restoredState = JSON.parse(serializedState);

        const { done, serialize: _serializeNew, stop: stopNew, send, start: startNew } = headlessInterpreter(
            mockStates,
            mockFunctions,
            mockDispatch,
            undefined,
            restoredState
        );

        startNew();

        expect(mockDispatch).toHaveBeenCalledTimes(1);

        const firstCall = mockDispatch.mock.calls[0][0];
        expect(firstCall.type).toBe('SET_STATE');
        expect(firstCall.value.currentState.value).toMatch(/^mockTask/);
        expect(firstCall.value.currentState.context.requestId).toBe('test');
        expect(firstCall.value.currentState.context.status).toBe(0);
        expect(firstCall.value.currentState.context.stack[0]).toMatch(/^mockTask/);

        // Simulate the transition
        send({ type: 'CONTINUE' });

        expect(mockDispatch).toHaveBeenCalledTimes(2);

        const secondCall = mockDispatch.mock.calls[1][0];
        expect(secondCall.type).toBe('SET_STATE');
        expect(secondCall.value.currentState.value).toMatch(/^nextState/);
        expect(secondCall.value.currentState.context.requestId).toBe('test');
        expect(secondCall.value.currentState.context.status).toBe(0);
        expect(secondCall.value.currentState.context.stack.length).toBe(2);

        send({ type: 'CONTINUE' });

        expect(done()).toBe(true);

        stopNew();
    });
});
