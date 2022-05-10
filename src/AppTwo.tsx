import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from 'react'
import { useSetAtom } from 'jotai'

type Getter<Value> = (atom: Atom<Value>) => Value

type Setter<Value> = (atom: Atom<Value>, newValue: Value) => void

type Atom<Value = unknown> = {
    toString: () => string
    init: Value
    read: (get: Getter<Value>) => Value
    write: (
        get: Getter<Value>,
        set: Setter<Value>,
        update: (oldValue: Value) => Value
    ) => void
}

let keyCount = 0

function atom<Value>(initialValue: Value): Atom<Value> {
    const config = {
        toString: () => `atom${++keyCount}`,
        init: initialValue,
        read: (get) => get(config),
        write: (get, set, update) => set(config, update(get(config))),
    } as Atom<Value>
    return config
}

type AtomState<Value = unknown> = {
    v: Value
}

type Mounted = {
    listeners: Set<() => void>
}

const createStore = () => {
    const committedAtomStateMap = new WeakMap<Atom, AtomState>()
    const mountedMap = new WeakMap<Atom, Mounted>()

    function getAtomState<Value>(
        atom: Atom<Value>
    ): AtomState<Value> | undefined {
        const atomState = committedAtomStateMap.get(atom as Atom) as
            | AtomState<Value>
            | undefined
        if (atomState) {
            return atomState
        }
        const initAtomState = {
            v: atom.init,
        }
        committedAtomStateMap.set(atom as Atom, initAtomState)
        return initAtomState
    }

    function readAtomState<Value>(atom: Atom<Value>): AtomState<Value> {
        const atomState = getAtomState(atom)
        if (atomState) {
            return atomState
        }
        throw new Error('No atom found!')
    }

    function readAtom<Value>(atom: Atom<Value>): AtomState<Value> {
        return readAtomState(atom)
    }

    function writeAtom() {}

    function mountAtom<Value>(atom: Atom<Value>): Mounted {
        const mounted = {
            listeners: new Set<() => {}>(),
        }
        mountedMap.set(atom as Atom, mounted)
        return mounted
    }

    function addAtom<Value>(atom: Atom<Value>) {
        let mounted = mountedMap.get(atom as Atom)
        if (!mounted) {
            mounted = mountAtom(atom)
        }
        return mounted
    }

    function deleteAtom<Value>(atom: Atom<Value>) {
        mountedMap.delete(atom as Atom)
    }

    function subscribeAtom<Value>(
        atom: Atom<Value>,
        callback: () => void
    ): () => void {
        const mounted = addAtom(atom)
        if (!mounted) {
            throw new Error('No atom found!')
        }
        mounted.listeners.add(callback)
        return () => {
            mounted.listeners.delete(callback)
            deleteAtom(atom)
        }
    }

    return {
        r: readAtom,
        w: writeAtom,
        s: subscribeAtom,
    }
}

const ScopeContext = createContext({
    s: createStore(),
})

function useAtomValue<Value>(atom: Atom<Value>): Value {
    const { s: store } = useContext(ScopeContext)

    const getAtomValue = useCallback(() => {
        const atomState = store['r'](atom)
        if ('v' in atomState) {
            return atomState.v
        }
        throw new Error('no atom value')
    }, [atom, store])

    const [value, renderIfChanged] = useReducer(
        (prevValue) => {
            const nextValue = getAtomValue()
            if (Object.is(prevValue, nextValue)) {
                return prevValue
            }
            return nextValue
        },
        undefined,
        () => {
            return undefined
        }
    )

    useEffect(() => {
        const unsubscribe = store['s'](atom, renderIfChanged)
        renderIfChanged()
        return unsubscribe
    }, [atom, store])

    return value
}

function useAtom<Value, Update, Result>(atom: Atom<Value>): [any, any] {
    return [useAtomValue(atom), useSetAtom(atom)]
}

const countAtom = atom(0)
const ageAtom = atom(30)

function App() {
    const [count, setCount] = useAtom(countAtom)
    const age = useAtomValue(ageAtom)

    return (
        <div className="App">
            <p>Count: {count}</p>
            <button onClick={() => setCount((c: any) => c + 1)}>
                Increment
            </button>
            <p>age: {age}</p>
        </div>
    )
}

export default App
