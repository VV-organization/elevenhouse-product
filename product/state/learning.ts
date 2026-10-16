export type LearningState = { enabled: boolean; completed: string[]; dismissed: string[] }
export function initialLearning(isNew: boolean): LearningState { return { enabled: isNew, completed: [], dismissed: [] } }
export function finishLearning(state: LearningState, topic: string): LearningState { return { ...state, completed: [...new Set([...state.completed, topic])] } }
export function dismissLearning(state: LearningState, topic: string): LearningState { return { ...state, dismissed: [...new Set([...state.dismissed, topic])] } }
export function showLearning(state: LearningState, topic: string, replay: string | null): boolean { return replay === topic || (!replay && state.enabled && !state.completed.includes(topic) && !state.dismissed.includes(topic)) }
