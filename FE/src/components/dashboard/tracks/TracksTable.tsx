"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { convertSlugUrl, getAudioUrl, sendRequest } from "@/utils/api";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";
import { useToast } from "@/utils/toast";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

type Props = {
  tracks: ITrackTop[];
  accessToken?: string;
};

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const TracksTable = ({ tracks, accessToken }: Props) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const toast = useToast();
  const [confirmTrack, setConfirmTrack] = useState<ITrackTop | null>(null);

  const filteredTracks = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return tracks;

    return tracks.filter((track) => {
      return [
        track.title,
        track.description,
        track.category,
        track.uploader?.name,
        track.uploader?.email,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [tracks, searchValue]);

  const deleteTrack = async (track: ITrackTop) => {
    const trackId = getItemId(track);

    setDeletingId(trackId);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/${trackId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setDeletingId("");

    if (res?.data || res?.statusCode === 200) {
      toast.success("Delete track successfully.");
      router.refresh();
      return;
    }

    toast.error(res?.message || "Delete track failed.");
  };

  const handleDeleteTrack = (track: ITrackTop) => {
    const trackId = getItemId(track);

    if (!trackId) {
      toast.error("Track not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setConfirmTrack(track);
  };

  const columns: GridColDef<ITrackTop>[] = [
    {
      field: "title",
      headerName: "Track",
      flex: 1.4,
      minWidth: 260,
      sortable: true,
      renderCell: (params) => {
        const track = params.row;

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
              <MusicNoteRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={track.title}
                sx={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.title}
              </Typography>

              <Typography
                title={track.description}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {track.description || "No description"}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row.category || "Unknown"}
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
      field: "uploader",
      headerName: "Uploader",
      width: 220,
      valueGetter: (params) =>
        params.row.uploader?.name || params.row.uploader?.email || "Unknown",
      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {params.row.uploader?.name || "Unknown"}
          </Typography>

          <Typography
            sx={{
              color: "#8f8f8f",
              fontSize: 12,
              fontWeight: 700,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {params.row.uploader?.email || ""}
          </Typography>
        </Box>
      ),
    },
    {
      field: "countPlay",
      headerName: "Plays",
      width: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "countLike",
      headerName: "Likes",
      width: 100,
      align: "center",
      headerAlign: "center",
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
        const track = params.row;
        const trackId = getItemId(track);

        const trackSlug =
          (track as any).slug || `${convertSlugUrl(track.title)}-${trackId}`;

        const href = `/track/${trackSlug}.html?audio=${encodeURIComponent(
          getAudioUrl(track.trackUrl)
        )}&autoplay=1`;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Tooltip title="Open track">
              <IconButton
                component={Link}
                href={href}
                target="_blank"
                size="small"
                sx={{
                  color: "#9a9a9a",
                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.08)",
                  },
                }}
              >
                <OpenInNewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete track">
              <IconButton
                onClick={() => handleDeleteTrack(track)}
                disabled={deletingId === getItemId(track)}
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
          rows={filteredTracks}
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
        open={!!confirmTrack}
        onClose={() => setConfirmTrack(null)}
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
        <DialogTitle sx={{ fontWeight: 900 }}>Delete track?</DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#bdbdbd", fontSize: 14 }}>
            Are you sure you want to delete{" "}
            <Box component="span" sx={{ color: "#ffffff", fontWeight: 900 }}>
              {confirmTrack?.title}
            </Box>
            ?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmTrack(null)}
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
              const selectedTrack = confirmTrack;
              setConfirmTrack(null);

              if (selectedTrack) {
                await deleteTrack(selectedTrack);
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

export default TracksTable;
