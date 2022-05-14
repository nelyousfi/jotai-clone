import { useReducer } from 'react'

type Atom<Value> = {
    init: Value
    read: Read<Value>
    toString: () => string
}

type WritableAtom<Value, Update, Result> = Atom<Value> & {
    write: Write<Update, Result>
}

type Getter = <Value>(atom: Atom<Value>) => Value

type Setter = <Value, Result>(atom: Atom<Value>, result: Result) => Result

type Read<Value> = (getter: Getter) => Value

type Write<Update, Result> = (
    get: Getter,
    set: Setter,
    update: Update
) => Result

let keyCount = 0
function atom<Value, Update, Result>(
    read: Value | Read<Value>,
    write?: Write<Update, Result>
) {
    const key = `atom${++keyCount}`
    const config = {
        toString: () => key,
    } as WritableAtom<Value, Update, Result>
    if (typeof read === 'function') {
        config.read = read as Read<Value>
    } else {
        config.init = read
        config.read = (get) => get(config)
        config.write = (get, set, update) =>
            set(
                config,
                typeof update === 'function' ? update(get(config)) : update
            )
    }
    if (write) {
        config.write = write
    }
    return config
}

const store: Map<string, Atom<any>> = new Map()

function getter<Value>(atom: Atom<Value>) {
    const key = atom.toString()
    let value = store.get(key)
    if (value === undefined) {
        value = atom.init
    }
    return value
}

function setter<Value, Result>(atom: Atom<Value>, result: Result) {
    store.set(atom.toString(), result)
}

const useAtom = <Value, Update, Result>(
    atom: WritableAtom<Value, Update, Result>
) => {
    const [, rerender] = useReducer((x) => x + 1, 0)

    return [
        atom.read(getter),
        (update: Update) => {
            atom.write(getter, setter, update)
            rerender()
        },
    ]
}

const countAtom = atom(0)

const incrementCountAtomInternal = atom(
    (get) => get(countAtom),
    (get, set) => {
        set(countAtom, get(countAtom) + 1)
    }
)

const incrementCountAtomExternalFunction = atom(
    (get) => get(countAtom),
    (get, set, update: (value: number) => number) => {
        set(countAtom, update(get(countAtom)))
    }
)

const incrementCountAtomExternalValue = atom(
    (get) => get(countAtom),
    (get, set, update: (value: number) => number) => {
        set(countAtom, update)
    }
)

const App = () => {
    const [countValue] = useAtom(countAtom)

    const [incrementCountInternalValue, incrementCountInternal] = useAtom(
        incrementCountAtomInternal
    )

    const [
        incrementCountExternalFunctionValue,
        incrementCountExternalFunction,
    ] = useAtom(incrementCountAtomExternalFunction)

    const [incrementCountExternalValueValue, incrementCountExternalValue] =
        useAtom(incrementCountAtomExternalValue)

    return (
        <div>
            <p>incrementCountInternalValue: {incrementCountInternalValue}</p>
            <p>
                incrementCountExternalFunctionValue:{' '}
                {incrementCountExternalFunctionValue}
            </p>
            <p>
                incrementCountExternalValueValue:{' '}
                {incrementCountExternalValueValue}
            </p>
            <p>count: {countValue}</p>
            <button
                onClick={() => {
                    incrementCountInternal()
                }}
            >
                incrementCountInternalValue
            </button>
            <button
                onClick={() => {
                    incrementCountExternalFunction((v: number) => v + 2)
                }}
            >
                incrementCountExternalFunction
            </button>
            <button
                onClick={() => {
                    incrementCountExternalValue(0)
                }}
            >
                incrementCountExternalValueValue
            </button>
        </div>
    )
}

export default App
