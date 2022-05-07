import React from 'react'
import { atom, useAtom } from './useAtom'

const countAtom = atom(0)

function App() {
    const [count] = useAtom(countAtom)

    return (
        <div className="App">
            <p>Count: {count}</p>
        </div>
    )
}

export default App
