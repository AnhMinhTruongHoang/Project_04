"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import CommentRoundedIcon from "@mui/icons-material/CommentRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { sendRequest } from "@/utils/api";
import DashboardTableToolbar from "../components/DashboardTableToolbar";
import { useToast } from "@/utils/toast";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getImages";

type Props = {
  comments: ITrackComment[];
  accessToken?: string;
};

const CommentsTable = ({ comments, accessToken }: Props) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [confirmComment, setConfirmComment] = useState<ITrackComment | null>(
    null
  );

  const toast = useToast();

  const getItemId = (item?: any) => {
    return item?._id || item?.id || "";
  };

  const getCommentUser = (comment?: any) => {
    return (
      comment?.user ||
      comment?.createdBy ||
      comment?.author ||
      comment?.created_by ||
      comment?.userInfo ||
      comment?.account || {
        name:
          comment?.userName ||
          comment?.username ||
          comment?.name ||
          comment?.createdByName ||
          comment?.authorName,
        email:
          comment?.userEmail ||
          comment?.email ||
          comment?.createdByEmail ||
          comment?.authorEmail,
        avatarUrl:
          comment?.userAvatarUrl ||
          comment?.avatarUrl ||
          comment?.userAvatar ||
          comment?.avatar ||
          comment?.image ||
          comment?.picture,
      }
    );
  };

  const getUserName = (user?: any) => {
    if (!user) return "User";

    if (typeof user === "string") {
      return user.includes("@") ? user.split("@")[0] : user;
    }

    const value =
      user?.name ||
      user?.fullName ||
      user?.displayName ||
      user?.username ||
      user?.email ||
      "User";

    const cleanValue = String(value).trim();

    if (!cleanValue) return "User";

    if (cleanValue.includes("@")) {
      return cleanValue.split("@")[0];
    }

    return cleanValue;
  };

  const getUserEmail = (user?: any) => {
    if (!user || typeof user === "string") return "";

    return user?.email || "";
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

  const filteredComments = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return comments;

    return comments.filter((comment) => {
      const user = getCommentUser(comment);

      return [
        comment.content,
        getUserName(user),
        getUserEmail(user),
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

  const deleteComment = async (comment: ITrackComment) => {
    const commentId = getItemId(comment);

    setDeletingId(commentId);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/comments/${commentId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setDeletingId("");

    if (res?.data || res?.statusCode === 200) {
      toast.success("Delete comment successfully.");

      await revalidateComments();
      router.refresh();
      return;
    }

    toast.error(res?.message || "Delete comment failed.");
  };

  const handleDeleteComment = (comment: ITrackComment) => {
    const commentId = getItemId(comment);

    if (!commentId) {
      toast.error("Comment not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    setConfirmComment(comment);
  };

  const columns: GridColDef<ITrackComment>[] = [
    {
      field: "content",
      headerName: "Comment",
      flex: 1.6,
      minWidth: 330,
      sortable: true,
      renderCell: (params) => {
        const comment = params.row;

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.4,
                background:
                  "linear-gradient(135deg, rgba(255,85,0,0.24), rgba(255,85,0,0.08))",
                color: "#ff5500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid rgba(255,85,0,0.28)",
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
                  lineHeight: 1.35,
                }}
              >
                {comment.content || "Empty comment"}
              </Typography>

              <Typography
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  mt: 0.3,
                }}
              >
                {comment.createdAt
                  ? `Posted ${dayjs(comment.createdAt).format("DD/MM/YYYY")}`
                  : "User comment"}
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
      minWidth: 240,
      valueGetter: (params) => {
        const user = getCommentUser(params.row);
        return getUserName(user) || getUserEmail(user) || "Unknown";
      },
      renderCell: (params) => {
        const user = getCommentUser(params.row);
        const userName = getUserName(user);
        const userEmail = getUserEmail(user);
        const userAvatarUrl = getUserAvatarUrl(user);

        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar
              src={userAvatarUrl}
              alt={userName}
              sx={{
                width: 38,
                height: 38,
                bgcolor: "#ff5500",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 13,
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              {getInitials(userName, userEmail)}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                title={userName}
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  lineHeight: 1.35,
                }}
              >
                {userName || "User"}
              </Typography>

              <Typography
                title={userEmail}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  mt: 0.2,
                }}
              >
                {userEmail}
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
      minWidth: 230,
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
              lineHeight: 1.35,
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
                mt: 0.25,
              }}
            >
              {getTrackCategory(params.row)}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 155,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
      renderCell: (params) => (
        <Typography
          sx={{
            color: "#d7d7d7",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {params.row.createdAt
            ? dayjs(params.row.createdAt).format("DD/MM/YYYY")
            : ""}
        </Typography>
      ),
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
              disabled={deletingId === getItemId(comment)}
              size="small"
              sx={{
                color: "#ff5a5a",
                border: "1px solid rgba(255,90,90,0.18)",
                backgroundColor: "rgba(255,90,90,0.06)",

                "&:hover": {
                  backgroundColor: "rgba(255,90,90,0.14)",
                  borderColor: "rgba(255,90,90,0.32)",
                },

                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.25)",
                  borderColor: "rgba(255,255,255,0.08)",
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
          borderRadius: 4,
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(17,19,20,0.98))",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",

          "& .MuiDataGrid-sortIcon": {
            color: "#ffffff",
            opacity: 1,
          },

          "& .MuiDataGrid-menuIconButton": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-menuIconButton:hover": {
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-iconSeparator": {
            color: "rgba(255,255,255,0.35)",
          },

          "& .MuiDataGrid-columnHeader .MuiIconButton-root": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon": {
            color: "#63e6a6",
          },

          "& .MuiDataGrid-root": {
            border: "none",
            color: "#ffffff",
            backgroundColor: "transparent",
          },

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#1f2224",
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeader": {
            outline: "none !important",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 900,
            letterSpacing: "0.02em",
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(255,255,255,0.055)",
            color: "#ffffff",
            outline: "none !important",
          },

          "& .MuiDataGrid-row": {
            transition: "0.16s ease",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255,85,0,0.06)",
          },

          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#1a1d1f",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
          },

          "& .MuiTablePagination-root": {
            color: "#ffffff",
          },

          "& .MuiTablePagination-selectIcon": {
            color: "#ffffff",
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
        open={!!confirmComment}
        onClose={() => setConfirmComment(null)}
        PaperProps={{
          sx: {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            minWidth: 360,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Delete comment?</DialogTitle>

        <DialogContent>
          <Typography sx={{ color: "#bdbdbd", fontSize: 14 }}>
            Are you sure you want to delete this comment?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmComment(null)}
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
              const selectedComment = confirmComment;
              setConfirmComment(null);

              if (selectedComment) {
                await deleteComment(selectedComment);
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

export default CommentsTable;
