import { useState } from "react";
import InputTodo from "./todo/input.todo"
import { Button, Result } from "antd";

const EricComponent = () => {
  return (
    <div>
      i'm eric
    </div>
  )
}

function App() {

  const [count, setCount] = useState(10)
  const name = "Hỏi Dân IT";
  const age = 25;
  const info = {
    gender: "male",
    address: "ha noi"
  }

  const [listTodo, setListTodo] = useState(
    ["todo 1", "todo 2", "todo 3", "todo 4", "todo 5", "todo 6"]
  )


  const handleTest = (name: string) => {
    alert(`handle test with name = ${name}`)
  }

  // mounting:=  born: phase
  return (
    <div>
      <Result
        status="success"
        title="Admin Dự án Clone SoundCloud"
        subTitle="Build with React Vite (Typescript) & Ant Design"
      />
    </div>
  )
}

export default App
