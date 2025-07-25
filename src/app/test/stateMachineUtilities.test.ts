/**
 * State Machine Utilities tests based on Palantir patterns
 */

import { StateMachineUtilities, StateConfig } from '../utils/stateMachineUtilities';

describe('StateMachineUtilities', () => {
  const sampleStates: StateConfig[] = [
    {
      id: 'start',
      transitions: [
        { on: 'NEXT', target: 'processing' }
      ]
    },
    {
      id: 'processing',
      transitions: [
        { on: 'SUCCESS', target: 'success' },
        { on: 'ERROR', target: 'failure' }
      ]
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

  describe('generateUniqueStateIds', () => {
    it('should generate unique IDs for non-protected states', () => {
      const { states, idMap } = StateMachineUtilities.generateUniqueStateIds(sampleStates);
      
      expect(states).toHaveLength(4);
      expect(idMap.start).toMatch(/^start_[a-f0-9]{8}$/);
      expect(idMap.processing).toMatch(/^processing_[a-f0-9]{8}$/);
      expect(idMap.success).toBe('success'); // Protected state
      expect(idMap.failure).toBe('failure'); // Protected state
    });

    it('should preserve protected state names', () => {
      const protectedStates: StateConfig[] = [
        { id: 'success', type: 'final' },
        { id: 'failure', type: 'final' },
        { id: 'pause' },
        { id: 'error' }
      ];
      
      const { states, idMap } = StateMachineUtilities.generateUniqueStateIds(protectedStates);
      
      expect(idMap.success).toBe('success');
      expect(idMap.failure).toBe('failure');
      expect(idMap.pause).toBe('pause');
      expect(idMap.error).toBe('error');
    });

    it('should update transition targets with new IDs', () => {
      const { states } = StateMachineUtilities.generateUniqueStateIds(sampleStates);
      
      const startState = states.find(s => s.id.startsWith('start_'));
      const processingState = states.find(s => s.id.startsWith('processing_'));
      
      expect(startState?.transitions?.[0].target).toMatch(/^processing_[a-f0-9]{8}$/);
      expect(processingState?.transitions?.[0].target).toBe('success');
      expect(processingState?.transitions?.[1].target).toBe('failure');
    });

    it('should handle nested states', () => {
      const nestedStates: StateConfig[] = [
        {
          id: 'parent',
          states: [
            {
              id: 'child1',
              transitions: [{ on: 'NEXT', target: 'child2' }]
            },
            {
              id: 'child2',
              type: 'final'
            }
          ]
        }
      ];
      
      const { states, idMap } = StateMachineUtilities.generateUniqueStateIds(nestedStates);
      
      expect(idMap.parent).toMatch(/^parent_[a-f0-9]{8}$/);
      expect(idMap.child1).toMatch(/^child1_[a-f0-9]{8}$/);
      expect(idMap.child2).toMatch(/^child2_[a-f0-9]{8}$/);
      
      const parentState = states[0];
      const childState = parentState.states?.[0];
      expect(childState?.transitions?.[0].target).toMatch(/^child2_[a-f0-9]{8}$/);
    });
  });

  describe('validateStateConfig', () => {
    it('should validate correct state configuration', () => {
      const { isValid, errors } = StateMachineUtilities.validateStateConfig(sampleStates);
      
      expect(isValid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate state IDs', () => {
      const duplicateStates: StateConfig[] = [
        { id: 'state1' },
        { id: 'state1' }, // Duplicate
        { id: 'state2' }
      ];
      
      const { isValid, errors } = StateMachineUtilities.validateStateConfig(duplicateStates);
      
      expect(isValid).toBe(false);
      expect(errors).toContain('Duplicate state ID found: state1');
    });

    it('should detect invalid transitions', () => {
      const invalidStates: StateConfig[] = [
        {
          id: 'state1',
          transitions: [
            { on: 'EVENT', target: '' }, // Missing target
            { on: '', target: 'state2' }  // Missing event
          ]
        }
      ];
      
      const { isValid, errors } = StateMachineUtilities.validateStateConfig(invalidStates);
      
      expect(isValid).toBe(false);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate nested states', () => {
      const nestedStates: StateConfig[] = [
        {
          id: 'parent',
          states: [
            { id: 'child1' },
            { id: 'child1' } // Duplicate in nested
          ]
        }
      ];
      
      const { isValid, errors } = StateMachineUtilities.validateStateConfig(nestedStates);
      
      expect(isValid).toBe(false);
      expect(errors).toContain('parent.Duplicate state ID found: child1');
    });
  });

  describe('findUnreachableStates', () => {
    it('should find states with no incoming transitions', () => {
      const unreachableStates: StateConfig[] = [
        {
          id: 'start',
          transitions: [{ on: 'NEXT', target: 'middle' }]
        },
        {
          id: 'middle',
          transitions: [{ on: 'FINISH', target: 'end' }]
        },
        {
          id: 'end',
          type: 'final'
        },
        {
          id: 'orphan' // No transitions pointing to this state
        }
      ];
      
      const unreachable = StateMachineUtilities.findUnreachableStates(unreachableStates);
      
      expect(unreachable).toContain('orphan');
      expect(unreachable).not.toContain('start'); // First state is always reachable
      expect(unreachable).not.toContain('middle');
      expect(unreachable).not.toContain('end');
    });

    it('should handle onDone transitions', () => {
      const statesWithOnDone: StateConfig[] = [
        {
          id: 'start',
          onDone: 'cleanup'
        },
        {
          id: 'cleanup',
          type: 'final'
        }
      ];
      
      const unreachable = StateMachineUtilities.findUnreachableStates(statesWithOnDone);
      
      expect(unreachable).not.toContain('cleanup');
    });
  });

  describe('optimizeStateMachine', () => {
    it('should remove unreachable states', () => {
      const statesWithUnreachable: StateConfig[] = [
        {
          id: 'start',
          transitions: [{ on: 'NEXT', target: 'end' }]
        },
        {
          id: 'end',
          type: 'final'
        },
        {
          id: 'unreachable'
        }
      ];
      
      const optimized = StateMachineUtilities.optimizeStateMachine(statesWithUnreachable);
      
      expect(optimized).toHaveLength(2);
      expect(optimized.map(s => s.id)).not.toContain('unreachable');
    });

    it('should preserve reachable states', () => {
      const optimized = StateMachineUtilities.optimizeStateMachine(sampleStates);
      
      expect(optimized).toHaveLength(4);
      expect(optimized.map(s => s.id)).toEqual(['start', 'processing', 'success', 'failure']);
    });
  });

  describe('toXStateMachine', () => {
    it('should convert to XState machine definition', () => {
      const machine = StateMachineUtilities.toXStateMachine(sampleStates);
      
      expect(machine).toHaveProperty('id', 'generatedMachine');
      expect(machine).toHaveProperty('initial');
      expect(machine).toHaveProperty('states');
      expect(machine).toHaveProperty('context', {});
      expect(machine).toHaveProperty('predictableActionArguments', true);
    });

    it('should set custom initial state', () => {
      const machine = StateMachineUtilities.toXStateMachine(sampleStates, 'processing');
      
      expect(machine.initial).toBe('processing');
    });

    it('should handle empty states array', () => {
      const machine = StateMachineUtilities.toXStateMachine([]);
      
      expect(machine.initial).toBe('start');
      expect(machine.states).toEqual({});
    });
  });

  describe('logStateMachineMetrics', () => {
    it('should log comprehensive metrics', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      StateMachineUtilities.logStateMachineMetrics(sampleStates, 'test-req-metrics');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📊 METRICS')
      );
      
      consoleSpy.mockRestore();
    });

    it('should calculate correct metrics', () => {
      const complexStates: StateConfig[] = [
        {
          id: 'state1',
          type: 'parallel',
          transitions: [{ on: 'EVENT1', target: 'state2' }]
        },
        {
          id: 'state2',
          type: 'final',
          transitions: [{ on: 'EVENT2', target: 'state3' }]
        },
        {
          id: 'state3',
          states: [{ id: 'nested' }]
        }
      ];
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      StateMachineUtilities.logStateMachineMetrics(complexStates, 'test-req-complex');
      
      const logCall = consoleSpy.mock.calls[2][0]; // The metrics are in the 3rd call
      expect(logCall).toContain('totalStates');
      expect(logCall).toContain('totalTransitions');
      expect(logCall).toContain('parallelStates');
      expect(logCall).toContain('finalStates');
      expect(logCall).toContain('nestedStates');
      
      consoleSpy.mockRestore();
    });
  });
});