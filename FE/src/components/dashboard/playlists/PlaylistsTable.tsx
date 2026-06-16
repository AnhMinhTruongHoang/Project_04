"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";

import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { sendRequest } from "@/utils/api";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";

type Props = {
  playlists: IPlaylist[];
  accessToken?: string;
};

type EditPlaylistState = {
  _id: string;
  title: string;
  isPublic: boolean;
  tracks: string[];
};

const getOwnerName = (playlist: IPlaylist) => {
  const user = playlist.user as any;

  if (typeof user === "object" && user !== null) {
    return user.name || user.email || "Unknown";
  }

  return "Unknown";
};

const getOwnerEmail = (playlist: IPlaylist) => {
  const user = playlist.user as any;

  if (typeof user === "object" && user !== null) {
    return user.email || "";
  }

  return "";
};

const getTrackIds = (tracks: any[] = []) => {
  return tracks
    .map((track) => {
      if (typeof track === "string") return track;
      if (typeof track === "object" && track !== null) return track._id;
      return "";
    })
    .filter(Boolean);
};

const getTrackCount = (playlist: IPlaylist) => {
  if (!Array.isArray(playlist.tracks)) return 0;
  return playlist.tracks.length;
};

const PlaylistsTable = ({ playlists, accessToken }: Props) => {
  const router = useRouter();

  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editPlaylist, setEditPlaylist] = useState<EditPlaylistState | null>(
    null
  );

  const filteredPlaylists = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return playlists;

    return playlists.filter((playlist) => {
      return [playlist.title, getOwnerName(playlist), getOwnerEmail(playlist)]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [playlists, searchValue]);

  const revalidatePlaylists = async () => {
    await sendRequest<IBackendRes<any>>({
      url: "/api/revalidate",
      method: "POST",
      queryParams: {
        tag: "dashboard-playlists",
        secret: "justArandomString",
      },
    });
  };

  const handleOpenEdit = (playlist: IPlaylist) => {
    setEditPlaylist({
      _id: playlist._id,
      title: playlist.title || "",
      isPublic: !!playlist.isPublic,
      tracks: getTrackIds(playlist.tracks as any[]),
    });

    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    if (saving) return;
    setOpenEdit(false);
    setEditPlaylist(null);
  };

  const handleSavePlaylist = async () => {
    if (!editPlaylist?._id) return;

    setSaving(true);

    const res = await sendRequest<IBackendRes<IPlaylist>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists`,
      method: "PATCH",
      body: {
        id: editPlaylist._id,
        title: editPlaylist.title,
        isPublic: editPlaylist.isPublic,
        tracks: editPlaylist.tracks,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setSaving(false);

    if (res?.data || res?.statusCode === 200) {
      await revalidatePlaylists();
      setOpenEdit(false);
      setEditPlaylist(null);
      router.refresh();
      return;
    }

    alert(res?.message || "Update playlist failed.");
  };

  const handleDeletePlaylist = async (playlist: IPlaylist) => {
    const isConfirm = window.confirm(
      `Are you sure you want to delete "${playlist.title}"?`
    );

    if (!isConfirm) return;

    setDeletingId(playlist._id);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/playlists/${playlist._id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setDeletingId("");

    if (res?.data || res?.statusCode === 200) {
      await revalidatePlaylists();
      router.refresh();
      return;
    }

    alert(res?.message || "Delete playlist failed.");
  };

  const columns: GridColDef<IPlaylist>[] = [
    {
      field: "title",
      headerName: "Playlist",
      flex: 1.3,
      minWidth: 260,
      sortable: true,
      renderCell: (params) => {
        const playlist = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                backgroundColor: "rgba(255,85,0,0.14)",
                color: "#ff5500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <QueueMusicRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={playlist.title}
                sx={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {playlist.title || "Untitled playlist"}
              </Typography>

              <Typography
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {getTrackCount(playlist)} tracks
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "isPublic",
      headerName: "Visibility",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.isPublic ? "Public" : "Private"}
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: params.row.isPublic
              ? "rgba(34,197,94,0.25)"
              : "rgba(255,255,255,0.08)",
            fontWeight: 900,
          }}
        />
      ),
    },
    {
      field: "tracks",
      headerName: "Tracks",
      width: 110,
      align: "center",
      headerAlign: "center",
      valueGetter: (params) => getTrackCount(params.row),
    },
    {
      field: "owner",
      headerName: "Owner",
      flex: 1,
      minWidth: 220,
      valueGetter: (params) => getOwnerName(params.row),
      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            title={getOwnerName(params.row)}
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getOwnerName(params.row)}
          </Typography>

          <Typography
            title={getOwnerEmail(params.row)}
            sx={{
              color: "#8f8f8f",
              fontSize: 12,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getOwnerEmail(params.row)}
          </Typography>
        </Box>
      ),
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
        const playlist = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Edit playlist">
              <IconButton
                onClick={() => handleOpenEdit(playlist)}
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

            <Tooltip title="Delete playlist">
              <IconButton
                onClick={() => handleDeletePlaylist(playlist)}
                disabled={deletingId === playlist._id}
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
          rows={filteredPlaylists}
          columns={columns}
          getRowId={(row) => row._id}
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
          }}
        >
          Edit playlist
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField
              label="Title"
              value={editPlaylist?.title || ""}
              onChange={(e) =>
                setEditPlaylist((prev) =>
                  prev ? { ...prev, title: e.target.value } : prev
                )
              }
              fullWidth
              sx={darkTextFieldSx}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={!!editPlaylist?.isPublic}
                  onChange={(e) =>
                    setEditPlaylist((prev) =>
                      prev ? { ...prev, isPublic: e.target.checked } : prev
                    )
                  }
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#ff5500",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#ff5500",
                    },
                  }}
                />
              }
              label={editPlaylist?.isPublic ? "Public" : "Private"}
              sx={{
                color: "#ffffff",
                fontWeight: 800,
                m: 0,
              }}
            />

            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                backgroundColor: "#0f1111",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Typography
                sx={{
                  color: "#9a9a9a",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Tracks in playlist
              </Typography>

              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: 900,
                  mt: 0.5,
                }}
              >
                {editPlaylist?.tracks?.length || 0}
              </Typography>
            </Box>
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
            onClick={handleSavePlaylist}
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
};

export default PlaylistsTable;
