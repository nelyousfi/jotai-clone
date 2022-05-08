import {
    Context,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useReducer,
} from 'react'

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

    return {
        [READ_ATOM]: readAtom,
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

type WriteGetter = Getter

type Setter = {
    <Value, Result extends void>(
        atom: WritableAtom<Value, undefined, Result>
    ): Result
}

type Read<Value> = (get: Getter) => Value

type Atom<Value> = {
    toString: () => string
    read: Read<Value>
}

type Write<Update, Result extends void> = (
    get: WriteGetter,
    set: Setter,
    update: Update
) => Result

type WritableAtom<Value, Update, Result extends void = void> = Atom<Value> & {
    write: Write<Update, Result>
}

type SetAtom<Update, Result extends void> = undefined extends Update
    ? (update?: Update) => Result
    : (update: Update) => Result

function useAtomValue<Value>(atom: Atom<Value>): Value {
    const ScopeContext = getScopeContext()
    const { s: store } = useContext(ScopeContext)

    const getAtomValue = useCallback(() => {
        const atomState = store[READ_ATOM](atom)
        if (atomState && 'v' in atomState) {
            return atomState.v
        }
        throw new Error('Atom not found')
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
            return getAtomValue()
        }
    )

    useEffect(() => {
        const unsubscribe = store[SUBSCRIBE_ATOM](atom)
        renderIfChanged()
        return unsubscribe
    }, [atom, store])

    useEffect(() => {
        store[COMMIT_ATOM](atom)
    })

    return getAtomValue()
}

function useSetAtom<Value, Update, Result extends void>(
    atom: WritableAtom<Value, Update, Result>
): SetAtom<Update, Result> {
    console.log(`setting atom ${atom}`)
    // @ts-ignore
    return atom
}

export function useAtom<Value, Update, Result extends void>(
    atom: Atom<Value> | WritableAtom<Value, Update, Result>
): [Value, SetAtom<Update, Result>] {
    return [
        useAtomValue(atom),
        useSetAtom(atom as WritableAtom<Value, Update, Result>),
    ]
}

let keyCount = 0

type SetStateAction<Value> = Value | ((prev: Value) => Value)

type PrimitiveAtom<Value> = WritableAtom<Value, SetStateAction<Value>>

type WithInitialValue<Value> = {
    init: Value
}

export function atom<Value>(
    initialValue: Value
): PrimitiveAtom<Value> & WithInitialValue<Value> {
    return {
        toString: () => {
            return `atom${++keyCount}`
        },
        init: initialValue,
        read: () => initialValue,
        write: () => {},
    }
}
