import { useEffect, useState } from 'react';
import { Table, Button, notification, Popconfirm, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';


export interface IComments {
    "_id": string;
    "content": string;
    "moment": number;
    "user": {
        "_id": string;
        "email": string;
        "name": string;
        "role": string;
        "type": string;
    },
    "track": {
        "_id": string;
        "title": string;
        "description": string;
        "trackUrl": string;
    },
    "isDeleted": boolean;
    "createdAt": string;
    "updatedAt": string;
}

const CommentsTable = () => {

    const [listComments, setListComments] = useState([]);

    const access_token = localStorage.getItem("access_token") as string;


    const [meta, setMeta] = useState({
        current: 1,
        pageSize: 5,
        pages: 0,
        total: 0
    })

    useEffect(() => {
        //update
        getData()
    }, [])

    //Promise
    const getData = async () => {

        const res = await fetch(
            `http://localhost:8000/api/v1/comments?current=${meta.current}&pageSize=${meta.pageSize}`,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
            })

        const d = await res.json();
        if (!d.data) {
            notification.error({
                message: JSON.stringify(d.message)
            })
        }
        setListComments(d.data.result)
        setMeta({
            current: d.data.meta.current,
            pageSize: d.data.meta.pageSize,
            pages: d.data.meta.pages,
            total: d.data.meta.total
        })
    }

    const confirm = async (comment: IComments) => {
        const res = await fetch(
            `http://localhost:8000/api/v1/comments/${comment._id}`,
            {
                method: "DELETE",
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
            })

        const d = await res.json();
        if (d.data) {
            notification.success({
                message: "Xóa track thành công."
            })
            await getData();
        } else {
            notification.error({
                message: JSON.stringify(d.message)
            })
        }
    };

    const columns: ColumnsType<IComments> = [
        {
            dataIndex: '_id',
            title: "STT",
            render: (value, record, index) => {
                return (
                    <>{((meta.current - 1) * meta.pageSize) + index + 1}</>
                )
            }
        },

        {
            title: 'Content',
            dataIndex: 'content',
        },
        {
            title: 'Track',
            dataIndex: ["track", "title"],
        },
        {
            title: 'User',
            dataIndex: ["user", "email"]
        },

        {
            title: 'Actions',
            render: (value, record) => {

                return (
                    <div>
                        <Popconfirm
                            title="Delete the user"
                            description={`Are you sure to delete this track. name = ${record.content}?`}
                            onConfirm={() => confirm(record)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button
                                style={{ marginLeft: 20 }}
                                danger>
                                Delete
                            </Button>
                        </Popconfirm>
                    </div>)
            }
        }
    ]


    const handleOnChange = async (page: number, pageSize: number) => {
        const res = await fetch(
            `http://localhost:8000/api/v1/comments?current=${page}&pageSize=${pageSize}`,
            {
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    "Content-Type": "application/json",
                },
            })

        const d = await res.json();
        if (!d.data) {
            notification.error({
                message: JSON.stringify(d.message)
            })
        }
        setListComments(d.data.result)
        setMeta({
            current: d.data.meta.current,
            pageSize: d.data.meta.pageSize,
            pages: d.data.meta.pages,
            total: d.data.meta.total
        })
    }

    return (
        <div>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <h2>Table Comments</h2>
            </div>

            <Table
                columns={columns}
                dataSource={listComments}
                rowKey={"_id"}
                pagination={{
                    current: meta.current,
                    pageSize: meta.pageSize,
                    total: meta.total,
                    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    onChange: (page: number, pageSize: number) => handleOnChange(page, pageSize),
                    showSizeChanger: true
                }}
            />

        </div>
    )
}

export default CommentsTable;