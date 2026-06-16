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

import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { sendRequest } from "@/utils/api";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";

type Props = {
  comments: ITrackComment[];
  accessToken?: string;
};

const getInitials = (name?: string, email?: string) => {
  const value = name?.trim() || email?.trim() || "User";
  const words = value.split(" ").filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return value.slice(0, 2).toUpperCase();
};

const formatMoment = (seconds = 0) => {
  const minutes = Math.floor(seconds / 60);
  const secondsRemainder = Math.round(seconds) % 60;
  const paddedSeconds = `0${secondsRemainder}`.slice(-2);

  return `${minutes}:${paddedSeconds}`;
};

const getTrackTitle = (comment: ITrackComment) => {
  const track = comment.track as any;

  if (typeof track === "object" && track !== null) {
    return track.title || "Unknown track";
  }

  return "Unknown track";
};

const getTrackCategory = (comment: ITrackComment) => {
  const track = comment.track as any;

  if (typeof track === "object" && track !== null) {
    return track.category || "";
  }

  return "";
};

const CommentsTable = ({ comments, accessToken }: Props) => {
  const router = useRouter();

  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const filteredComments = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return comments;

    return comments.filter((comment) => {
      return [
        comment.content,
        comment.user?.name,
        comment.user?.email,
        getTrackTitle(comment),
        getTrackCategory(comment),
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [comments, searchValue]);

  const revalidateComments = async () => {
    await sendRequest<IBackendRes<any>>({
      url: "/api/revalidate",
      method: "POST",
      queryParams: {
        tag: "dashboard-comments",
        secret: "justArandomString",
      },
    });
  };

  const handleDeleteComment = async (comment: ITrackComment) => {
    const isConfirm = window.confirm(
      `Are you sure you want to delete this comment?`
    );

    if (!isConfirm) return;

    setDeletingId(comment._id);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/comments/${comment._id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setDeletingId("");

    if (res?.data || res?.statusCode === 200) {
      await revalidateComments();
      router.refresh();
      return;
    }

    alert(res?.message || "Delete comment failed.");
  };

  const columns: GridColDef<ITrackComment>[] = [
    {
      field: "content",
      headerName: "Comment",
      flex: 1.5,
      minWidth: 300,
      sortable: true,
      renderCell: (params) => {
        const comment = params.row;

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
              <CommentRoundedIcon />
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={comment.content}
                sx={{
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {comment.content || "Empty comment"}
              </Typography>

              <Typography
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                At {formatMoment(comment.moment)}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "user",
      headerName: "User",
      flex: 1,
      minWidth: 230,
      valueGetter: (params) =>
        params.row.user?.name || params.row.user?.email || "Unknown",
      renderCell: (params) => {
        const user = params.row.user;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#ff5500",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {getInitials(user?.name, user?.email)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={user?.name}
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "Social user"}
              </Typography>

              <Typography
                title={user?.email}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.email || ""}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "track",
      headerName: "Track",
      flex: 1,
      minWidth: 220,
      valueGetter: (params) => getTrackTitle(params.row),
      renderCell: (params) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            title={getTrackTitle(params.row)}
            sx={{
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {getTrackTitle(params.row)}
          </Typography>

          {getTrackCategory(params.row) && (
            <Typography
              title={getTrackCategory(params.row)}
              sx={{
                color: "#8f8f8f",
                fontSize: 12,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {getTrackCategory(params.row)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "moment",
      headerName: "Moment",
      width: 110,
      align: "center",
      headerAlign: "center",
      valueFormatter: (params) => formatMoment(Number(params.value || 0)),
      renderCell: (params) => (
        <Chip
          label={formatMoment(params.row.moment)}
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
            fontWeight: 900,
          }}
        />
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
      width: 100,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const comment = params.row;

        return (
          <Tooltip title="Delete comment">
            <IconButton
              onClick={() => handleDeleteComment(comment)}
              disabled={deletingId === comment._id}
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
          rows={filteredComments}
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
    </Box>
  );
};

export default CommentsTable;
