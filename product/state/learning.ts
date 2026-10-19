import type {JourneyProgress} from './learningJourney'
import type {TourProgress} from './guidedTour'
export type LearningState = { enabled: boolean; completed: string[]; dismissed: string[]; journey?:JourneyProgress; tour?:TourProgress }
export function initialLearning(isNew: boolean): LearningState { return { enabled: isNew, completed: [], dismissed: [] } }
export function finishLearning(state: LearningState, topic: string): LearningState { return state.completed.includes(topic)?state:{ ...state, completed: [...state.completed, topic] } }
export function dismissLearning(state: LearningState, topic: string): LearningState { return { ...state, dismissed: [...new Set([...state.dismissed, topic])] } }
export function showLearning(state: LearningState, topic: string, replay: string | null): boolean { return replay === topic || (!replay && state.enabled && !state.completed.includes(topic) && !state.dismissed.includes(topic)) }

/** An optimistic render is not proof that browser storage accepted the change. */
export function savedLearningTopics<T>(raw:string|null,value:T,topics:string[]):string[]{return raw===JSON.stringify(value)?topics:[]}
