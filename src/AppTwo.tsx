import React from 'react'
import { useAtom } from 'jotai'

type Getter<Value> = (atom: Atom<Value>) => Value

type Setter<Value> = (atom: Atom<Value>, newValue: Value) => void

type Atom<Value> = {
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

function useAtomValue<Value>(atom: Atom<Value>): Value {
    return atom.init
}

const countAtom = atom(0)
const ageAtom = atom(30)

function App() {
    const [count, setCount] = useAtom(countAtom)
    const age = useAtomValue(ageAtom)

    return (
        <div className="App">
            <p>Count: {count}</p>
            <button onClick={() => setCount((c) => c + 1)}>Increment</button>
            <p>age: {age}</p>
        </div>
    )
}

export default App
