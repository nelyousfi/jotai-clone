import React from 'react'
import { atom, useAtom } from './useAtom'

const countAtom = atom(0)

function App() {
    const [count, setCount] = useAtom(countAtom)

    return (
        <div className="App">
            <p>Count: {count}</p>
            <button onClick={() => setCount((c) => c + 1)}>Increment</button>
        </div>
    )
}

export default App
