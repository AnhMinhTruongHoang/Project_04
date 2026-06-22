"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { sendRequest } from "@/utils/api";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";
import { useToast } from "@/utils/toast";
import { getUserAvatarUrl } from "@/utils/actions/getAvatar";

type Props = {
  users: IUser[];
  accessToken?: string;
};

type EditUserState = {
  _id: string;
  name: string;
  email: string;
  age: string | number;
  gender: string;
  address: string;
  role: string;
};

const getInitials = (name?: string, email?: string) => {
  const value = name?.trim() || email?.trim() || "User";
  const words = value.split(" ").filter(Boolean);
  const toast = useToast();
  const [confirmUser, setConfirmUser] = useState<IUser | null>(null);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const UsersTable = ({ users, accessToken }: Props) => {
  const router = useRouter();
  const toast = useToast();
  const [confirmUser, setConfirmUser] = useState<IUser | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState<EditUserState | null>(null);

  const filteredUsers = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return [
        user.name,
        user.email,
        user.role,
        user.type,
        user.gender,
        user.address,
        user.following,
        user.followers,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [users, searchValue]);

  const revalidateUsers = async () => {
    await sendRequest<IBackendRes<any>>({
      url: "/api/revalidate",
      method: "POST",
      queryParams: {
        tag: "dashboard-users",
        secret: "justArandomString",
      },
    });
  };

  const handleOpenEdit = (user: IUser) => {
    setEditUser({
      _id: getItemId(user),
      name: user.name || "",
      email: user.email || "",
      age: user.age || "",
      gender: user.gender || "",
      address: user.address || "",
      role: user.role || "USER",
    });

    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    if (saving) return;
    setOpenEdit(false);
    setEditUser(null);
  };

  const handleSaveUser = async () => {
    if (!editUser?._id) {
      alert("User not found.");
      return;
    }

    if (!accessToken) {
      alert("Please login first.");
      return;
    }

    setSaving(true);

    const res = await sendRequest<IBackendRes<IUser>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
      method: "PATCH",
      body: {
        id: editUser._id,
        _id: editUser._id,
        name: editUser.name,
        email: editUser.email,
        age: editUser.age ? Number(editUser.age) : undefined,
        gender: editUser.gender,
        address: editUser.address,
        role: editUser.role,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setSaving(false);

    if (res?.data || res?.statusCode === 200) {
      await revalidateUsers();
      setOpenEdit(false);
      setEditUser(null);
      router.refresh();
      return;
    }

    alert(res?.message || "Update user failed.");
  };

  const deleteUser = async (user: IUser) => {
    const userId = getItemId(user);

    setDeletingId(userId);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setDeletingId("");

    if (res?.data || res?.statusCode === 200) {
      toast.success("Delete user successfully.");

      await revalidateUsers();
      router.refresh();
      return;
    }

    toast.error(res?.message || "Delete user failed.");
  };

  const handleDeleteUser = (user: IUser) => {
    const userId = getItemId(user);

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setConfirmUser(user);
  };

  const columns: GridColDef<IUser>[] = [
    {
      field: "name",
      headerName: "User",
      flex: 1.3,
      minWidth: 260,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
            <Avatar
              sx={{
                width: 42,
                height: 42,
                bgcolor: "#ff5500",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {getInitials(user.name, user.email)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={user.name}
                sx={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name || (
                  <span style={{ color: "green" }}>Social user</span>
                )}
              </Typography>

              <Typography
                title={user.email}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.role || "USER"}
          size="small"
          sx={{
            color: params.row.role === "ADMIN" ? "#ffffff" : "#d7d7d7",
            backgroundColor:
              params.row.role === "ADMIN"
                ? "rgba(255,85,0,0.3)"
                : "rgba(255,255,255,0.08)",
            fontWeight: 900,
          }}
        />
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.type || "SYSTEM"}
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
            fontWeight: 800,
          }}
        />
      ),
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 120,
    },
    {
      field: "address",
      headerName: "Address",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "following",
      headerName: "following",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const user = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Edit user">
              <IconButton
                onClick={() => handleOpenEdit(user)}
                size="small"
                sx={{
                  color: "#9a9a9a",
                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete user">
              <IconButton
                onClick={() => handleDeleteUser(user)}
                disabled={deletingId === getItemId(user)}
                size="small"
                sx={{
                  color: "#ff5a5a",
                  "&:hover": {
                    backgroundColor: "rgba(255,90,90,0.12)",
                  },
                }}
              >
                <DeleteRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box>
      <DashboardTableToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      <Box
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.08)",

          "& .MuiDataGrid-root": {
            border: "none",
            color: "#ffffff",
            backgroundColor: "#111314",
          },

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 900,
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            color: "#ffffff",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255,255,255,0.035)",
          },

          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#181A1B",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
          },

          "& .MuiTablePagination-root": {
            color: "#ffffff",
          },

          "& .MuiSvgIcon-root": {
            color: "inherit",
          },

          "& .MuiDataGrid-overlay": {
            backgroundColor: "#111314",
            color: "#9a9a9a",
            fontWeight: 800,
          },
        }}
      >
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => getItemId(row)}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0,
              },
            },
          }}
        />
      </Box>

      <Dialog
        open={openEdit}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: "#111314",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center",
          }}
        >
          Edit user
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 1.2,
              mb: 5,
              mt: 5,
            }}
          >
            <Avatar
              src={getUserAvatarUrl(editUser) || undefined}
              sx={{
                width: 70,
                height: 70,
                bgcolor: "#ff5500",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 22,
              }}
            >
              {!getUserAvatarUrl(editUser) &&
                getInitials(editUser?.name, editUser?.email)}
            </Avatar>

            <Box>
              <Typography sx={{ color: "#ffffff", fontWeight: 900 }}>
                {editUser?.name || "Social user"}
              </Typography>

              <Typography sx={{ color: "#9a9a9a", fontSize: 13 }}>
                {editUser?.email}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Name"
              value={editUser?.name || ""}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev ? { ...prev, name: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              label="Email"
              value={editUser?.email || ""}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev ? { ...prev, email: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              label="Age"
              value={editUser?.age || ""}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev ? { ...prev, age: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              select
              label="Gender"
              value={editUser?.gender || ""}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev ? { ...prev, gender: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            >
              <MenuItem value="MALE">Male</MenuItem>
              <MenuItem value="FEMALE">Female</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </TextField>

            <TextField
              label="Address"
              value={editUser?.address || ""}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev ? { ...prev, address: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            />

            <TextField
              select
              label="Role"
              value={editUser?.role || "USER"}
              onChange={(e) =>
                setEditUser((prev) =>
                  prev ? { ...prev, role: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            >
              <MenuItem value="USER">USER</MenuItem>
              <MenuItem value="ADMIN">ADMIN</MenuItem>
            </TextField>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Button
            onClick={handleCloseEdit}
            disabled={saving}
            sx={{
              color: "#d7d7d7",
              textTransform: "none",
              fontWeight: 900,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSaveUser}
            disabled={saving}
            sx={{
              px: 2.2,
              borderRadius: "999px",
              backgroundColor: "#ff5500",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 900,
              "&:hover": {
                backgroundColor: "#ff6a1a",
              },
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!confirmUser}
        onClose={() => setConfirmUser(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: 380,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete user?</DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#bdbdbd", fontSize: 14 }}>
            Are you sure you want to delete{" "}
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 900 }}>
              {confirmUser?.name || confirmUser?.email}
            </Box>
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmUser(null)}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={async () => {
              const selectedUser = confirmUser;
              setConfirmUser(null);

              if (selectedUser) {
                await deleteUser(selectedUser);
              }
            }}
            sx={{
              backgroundColor: "#ff4d4f",
              color: "#ffffff",
              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ff2f32",
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const darkTextFieldSx = {
  "& .MuiInputLabel-root": {
    color: "#9a9a9a",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ff5500",
  },

  "& .MuiOutlinedInput-root": {
    color: "#ffffff",
    backgroundColor: "#0f1111",
    borderRadius: 2,
    fontWeight: 700,

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.24)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#ff5500",
    },
  },

  "& .MuiSelect-icon": {
    color: "#ffffff",
  },
};

export default UsersTable;
