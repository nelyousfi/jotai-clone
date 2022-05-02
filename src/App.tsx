import React, { Suspense } from 'react'
import { atom, useAtom } from 'jotai'

const countAtom = atom(0)
const doubleCountAtom = atom((get) => get(countAtom) * 2)
const urlAtom = atom('https://jsonplaceholder.typicode.com/todos/1')
const fetchUrlAtom = atom(async (get) => {
    const response = await fetch(get(urlAtom))
    return await response.json()
})
const decrementCountAtom = atom(
    (get) => get(countAtom),
    (get, set) => set(countAtom, get(countAtom) - 1)
)
const multiplyCountAtom = atom(null, (get, set, by: number) =>
    set(countAtom, get(countAtom) * by)
)
const todoAtom = atom(undefined)
const fetchTodoAtom = atom(
    (get) => get(todoAtom),
    async (get, set) => {
        const response = await fetch(
            'https://jsonplaceholder.typicode.com/todos/1'
        )
        set(todoAtom, await response.json())
    }
)

function Counter() {
    const [count, setCount] = useAtom(countAtom)
    const [, decrementCount] = useAtom(decrementCountAtom)
    const [doubleCount] = useAtom(doubleCountAtom)
    const [, multiplyCount] = useAtom(multiplyCountAtom)

    return (
        <div>
            <p>{count}</p>
            <p>{doubleCount}</p>
            <button onClick={() => setCount((c) => c + 1)}>increment</button>
            <button onClick={() => decrementCount()}>decrement</button>
            <button onClick={() => multiplyCount(10)}>multiply</button>
        </div>
    )
}

function Status() {
    const [json] = useAtom(fetchUrlAtom)

    return <div>{JSON.stringify(json, undefined, 2)}</div>
}

function App() {
    const [todo, fetchTodo] = useAtom(fetchTodoAtom)

    return (
        <div className="App">
            <Counter />
            <p style={{ color: 'red' }}>{JSON.stringify(todo, null, 2)}</p>
            <button onClick={fetchTodo}>Fetch Todo</button>
            <Suspense fallback={<p>Loading ...</p>}>
                <Status />
            </Suspense>
        </div>
    )
}

export default App
