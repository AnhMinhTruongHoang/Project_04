import { useState } from 'react';
// use => hook
//compile: dịch code: typescript => javascript (check type)
// run: chạy code
interface IProps {
    name: string;
    age: number;
    hoidanit: {
        gender: string;
        address: string
    }
    abc?: string; //optional
    ericFunction: (value: string) => void;
    listTodo: string[];
    setListTodo: (v: string[]) => void;
    children: React.ReactNode;
}


const InputTodo = (props: IProps) => {

    const { ericFunction, listTodo, setListTodo } = props;

    const [todo, setTodo] = useState("");

    const handleClick = () => {
        if (!todo) {
            alert("empty todo");
            return;
        }
        // alert("click me")
        setListTodo([...listTodo, todo]) //spread syntax
        setTodo("")
    }

    console.log(">>> ")
    return (
        <div style={{ border: "1px solid red" }}>
            <div>Add new todo</div>
            {props.children}
            <input
                value={todo}
                type="text"
                onChange={(event) => {
                    setTodo(event.target.value)
                    // console.log(event.target.value)
                }}
            />
            &nbsp; &nbsp;
            <button onClick={() => handleClick()}>Save</button>

        </div>
    )
}

export default InputTodo;