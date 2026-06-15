

const EricComponent = () => {

    const name = "Hỏi Dân IT";
    const age = 26;

    const info = {
        name: "Eric",
        age: 26
    }

    const arr = [1, 2, 3, true, { name: "Eric" }]
    const test = undefined;
    //jsx : html + js => 1 block
    return (
        <div>
            <h1 style={
                {
                    borderRadius: "5px",
                    border: "1px solid green",
                    color: "red"
                }
            }>Hello : {test}</h1>
            {/* <img
                src="https://i.imgur.com/yXOvdOSs.jpg"
                alt="Hedy Lamarr"
                className="photo"
            /> */}
            <ul>
                <li>Invent new traffic lights  </li>
                <li>Rehearse a movie scene </li>
                <li>Improve the spectrum technology </li>
            </ul>
        </div>
    )
}

export default EricComponent;