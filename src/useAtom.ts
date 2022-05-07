import { Context, createContext, useCallback, useContext } from 'react'

type AnyAtomValue = unknown

type Revision = number

type ReadDependencies = Map<AnyAtom, Revision>

type AtomState<Value = AnyAtomValue> = {
    d: ReadDependencies
    v: Value
}

type AnyAtom = Atom<AnyAtomValue>

const READ_ATOM = 'r'

// const WRITE_ATOM = 'w'

const createStore = () => {
    const committedAtomStateMap = new WeakMap<AnyAtom, AtomState>()

    const getAtomState = <Value>(
        atom: Atom<Value>
    ): AtomState<Value> | undefined => {
        return committedAtomStateMap.get(atom) as AtomState<Value> | undefined
    }

    const readAtomState = <Value>(atom: Atom<Value>) => {
        return getAtomState(atom)
    }

    const readAtom = <Value>(readingAtom: Atom<Value>) => {
        return readAtomState(readingAtom)
    }

    // const writeAtom = () => {}

    return {
        [READ_ATOM]: readAtom,
        // [WRITE_ATOM]: writeAtom,
    }
}

type Store = ReturnType<typeof createStore>

type ScopeContainer = {
    s: Store
}

type ScopeContext = Context<ScopeContainer>

let scopeContext: ScopeContext

const createScopeContext = () => {
    return {
        s: createStore(),
    }
}

const getScopeContext = () => {
    if (!scopeContext) {
        scopeContext = createContext(createScopeContext())
    }
    return scopeContext
}

type Getter = {
    <Value>(atom: Atom<Value>): Value
}

// type WriteGetter = Getter
//
// type Setter = {
//     <Value, Result extends void>(
//         atom: WritableAtom<Value, undefined, Result>
//     ): Result
// }

type Read<Value> = (get: Getter) => Value

type Atom<Value> = {
    init: Value
    read: Read<Value>
}

// type Write<Update, Result extends void> = (
//     get: WriteGetter,
//     set: Setter,
//     update: Update
// ) => Result
//
// type WritableAtom<Value, Update, Result extends void> = Atom<Value> & {
//     write: Write<Update, Result>
// }

// type SetAtom<Update, Result extends void> = undefined extends Update
//     ? (update?: Update) => Result
//     : (update: Update) => Result

function useAtomValue<Value>(atom: Atom<Value>): Value {
    const ScopeContext = getScopeContext()
    const { s: store } = useContext(ScopeContext)

    const getAtomValue = useCallback(() => {
        const atomState = store[READ_ATOM](atom)
        if (atomState && 'v' in atomState) {
            return atomState.v
        }
        if ('init' in atom) {
            return atom.init
        }
        throw new Error('Atom not found')
    }, [atom, store])

    return getAtomValue()
}

// function useSetAtom<Value, Update, Result extends void>(
//     atom: WritableAtom<Value, Update, Result>
// ): SetAtom<Update, Result> {
//     // @ts-ignore
//     return atom
// }

export function useAtom<Value, Update, Result extends void>(atom: Atom<Value>) {
    return [useAtomValue(atom)]
}

let keyCount = 0

export function atom<Value>(read: Value) {
    const key = `atom${++keyCount}`
    const config = {
        toString: () => key,
    } as Atom<Value>
    config.init = read
    config.read = (get) => get(config)
    return config
}
