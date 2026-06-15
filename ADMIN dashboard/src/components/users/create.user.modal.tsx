
import { Modal, Input, notification, Select, Form, InputNumber } from 'antd';
const { Option } = Select;

interface IProps {
    access_token: string;
    getData: any;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (v: boolean) => void;
}

const CreateUserModal = (props: IProps) => {

    const {
        access_token, getData,
        isCreateModalOpen, setIsCreateModalOpen
    } = props;

    const [form] = Form.useForm();

    const handleCloseCreateModal = () => {
        form.resetFields()
        setIsCreateModalOpen(false);

    }

    const onFinish = async (values: any) => {
        console.log('Success:', values);
        const { name, email, password, age, gender, role, address } = values;

        const data = { name, email, password, age, gender, role, address };
        const res = await fetch(
            "http://localhost:8000/api/v1/users",
            {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            })

        const d = await res.json();
        if (d.data) {
            //success
            await getData();
            notification.success({
                message: "Tạo mới user thành công.",
            })
            handleCloseCreateModal();
        } else {
            ///
            notification.error({
                message: "Có lỗi xảy ra",
                description: JSON.stringify(d.message)
            })
        }
    };

    return (
        <Modal
            title="Add new user"
            open={isCreateModalOpen}
            onOk={() => form.submit()}
            onCancel={() => handleCloseCreateModal()}
            maskClosable={false}
        >
            <Form
                name="basic"
                onFinish={onFinish}
                layout="vertical"
                form={form}
            >
                <Form.Item
                    style={{ marginBottom: 5 }}
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: 'Please input your name!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: 5 }}
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Please input your email!' }]}
                >
                    <Input type='email' />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: 5 }}
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Please input your password!' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    style={{ marginBottom: 5 }}
                    label="Age"
                    name="age"
                    rules={[{ required: true, message: 'Please input your age!' }]}
                >
                    <InputNumber
                        style={{ width: "100%" }}
                    />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: 5 }}
                    label="Address"
                    name="address"
                    rules={[{ required: true, message: 'Please input your address!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: 5 }}
                    name="gender" label="Gender" rules={[{ required: true }]}>
                    <Select
                        placeholder="Select a option and change input text above"
                        // onChange={onGenderChange}
                        allowClear
                    >
                        <Option value="MALE">male</Option>
                        <Option value="FEMALE">female</Option>
                        <Option value="OTHER">other</Option>
                    </Select>
                </Form.Item>

                <Form.Item
                    style={{ marginBottom: 5 }}
                    name="role" label="Role" rules={[{ required: true }]}>
                    <Select
                        placeholder="Select a option and change input text above"
                        // onChange={onGenderChange}
                        allowClear
                    >

                        <Option value="USER">User</Option>
                        <Option value="ADMIN">Admin</Option>
                    </Select>
                </Form.Item>
            </Form>


            {/* <div>
                <label>Name:</label>
                <Input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                />
            </div>
            <div>
                <label>Email:</label>
                <Input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>
            <div>
                <label>Password:</label>
                <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </div>
            <div>
                <label>Age:</label>
                <Input
                    value={age}
                    onChange={(event) => setAge(event.target.value)}
                />
            </div>
            <div>
                <label>Gender:</label>
                <Input
                    value={gender}
                    onChange={(event) => setGender(event.target.value)}
                />
            </div>

            <div>
                <label>Address:</label>
                <Input
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                />
            </div>

            <div>
                <label>Role:</label>
                <Input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                />
            </div> */}
        </Modal>
    )
}

export default CreateUserModal;