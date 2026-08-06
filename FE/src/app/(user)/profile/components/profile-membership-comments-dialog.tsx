"use client";

import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";

import { alpha, useTheme } from "@mui/material/styles";

import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { useCallback, useEffect, useState } from "react";

import {
  createArtistMembershipCommentApi,
  deleteArtistMembershipCommentApi,
  getArtistMembershipCommentRepliesApi,
  getArtistMembershipPostCommentsApi,
  updateArtistMembershipCommentApi,
} from "@/utils/api";

const PAGE_SIZE = 10;

const formatCommentDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",

    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getAuthorDisplayName = (author: IArtistMembershipCommentAuthor) => {
  return (
    author.name?.trim() || author.username?.trim() || "Người dùng SoundClone"
  );
};

const ProfileMembershipCommentsDialog = ({
  open,
  post,
  accessToken,
  onClose,
  onCommentChanged,
  onRequireLogin,
}: IProfileMembershipCommentsDialogProps) => {
  const theme = useTheme();

  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [comments, setComments] = useState<IArtistMembershipPostComment[]>([]);

  const [repliesByCommentId, setRepliesByCommentId] = useState<
    Record<string, IArtistMembershipPostComment[]>
  >({});

  const [openedRepliesByCommentId, setOpenedRepliesByCommentId] = useState<
    Record<string, boolean>
  >({});

  const [loadingRepliesByCommentId, setLoadingRepliesByCommentId] = useState<
    Record<string, boolean>
  >({});

  const [current, setCurrent] = useState(1);

  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [actionCommentId, setActionCommentId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [commentContent, setCommentContent] = useState("");

  const [replyingCommentId, setReplyingCommentId] = useState<string | null>(
    null
  );

  const [replyContent, setReplyContent] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");

  /*
   * =========================
   * RESET DIALOG STATE
   * =========================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrent(1);
    setComments([]);

    setRepliesByCommentId({});

    setOpenedRepliesByCommentId({});

    setLoadingRepliesByCommentId({});

    setCommentContent("");
    setReplyContent("");
    setEditContent("");

    setReplyingCommentId(null);

    setEditingCommentId(null);

    setActionCommentId(null);

    setError(null);
  }, [open, post?.id]);

  /*
   * =========================
   * LOAD ROOT COMMENTS
   * =========================
   */
  const loadComments = useCallback(
    async (showLoading = true) => {
      if (!open || !post?.id) {
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await getArtistMembershipPostCommentsApi(
          post.id,
          accessToken,
          {
            current,
            pageSize: PAGE_SIZE,
          }
        );

        const data = response?.data;

        if (!data) {
          throw new Error(response?.message || "Không thể tải bình luận.");
        }

        setComments(Array.isArray(data.items) ? data.items : []);

        setTotal(Number(data.total || 0));

        setTotalPages(Number(data.totalPages || 0));
      } catch (requestError) {
        console.error("Cannot load membership comments:", requestError);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải bình luận."
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, current, open, post?.id]
  );

  useEffect(() => {
    void loadComments(true);
  }, [loadComments]);

  /*
   * =========================
   * NOTIFY FEED REFRESH
   * =========================
   */
  const notifyCommentChanged = () => {
    if (!post?.id) {
      return;
    }

    onCommentChanged?.(post.id);
  };

  /*
   * =========================
   * LOAD COMMENT REPLIES
   * =========================
   */
  const loadReplies = async (commentId: string) => {
    if (!post?.id) {
      return;
    }

    setLoadingRepliesByCommentId((previous) => ({
      ...previous,
      [commentId]: true,
    }));

    setError(null);

    try {
      const response = await getArtistMembershipCommentRepliesApi(
        post.id,
        commentId,
        accessToken
      );

      setRepliesByCommentId((previous) => ({
        ...previous,

        [commentId]: Array.isArray(response?.data) ? response.data : [],
      }));
    } catch (requestError) {
      console.error("Cannot load membership comment replies:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải phản hồi."
      );
    } finally {
      setLoadingRepliesByCommentId((previous) => ({
        ...previous,
        [commentId]: false,
      }));
    }
  };

  /*
   * =========================
   * TOGGLE REPLIES
   * =========================
   */
  const handleToggleReplies = async (comment: IArtistMembershipPostComment) => {
    const currentlyOpen = Boolean(openedRepliesByCommentId[comment.id]);

    if (currentlyOpen) {
      setOpenedRepliesByCommentId((previous) => ({
        ...previous,
        [comment.id]: false,
      }));

      return;
    }

    setOpenedRepliesByCommentId((previous) => ({
      ...previous,
      [comment.id]: true,
    }));

    if (repliesByCommentId[comment.id] === undefined) {
      await loadReplies(comment.id);
    }
  };

  /*
   * =========================
   * REQUIRE AUTHENTICATION
   * =========================
   */
  const ensureAuthenticated = () => {
    if (accessToken) {
      return true;
    }

    setError("Vui lòng đăng nhập để bình luận.");

    onRequireLogin?.();

    return false;
  };

  /*
   * =========================
   * CREATE ROOT COMMENT
   * =========================
   */
  const handleCreateComment = async () => {
    if (!post?.id || !ensureAuthenticated()) {
      return;
    }

    const normalizedContent = commentContent.trim();

    if (!normalizedContent) {
      setError("Vui lòng nhập nội dung bình luận.");

      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await createArtistMembershipCommentApi(
        post.id,
        {
          content: normalizedContent,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Không thể tạo bình luận.");
      }

      setCommentContent("");

      /*
       * Tải lại trang đầu để comment
       * mới xuất hiện ở đầu danh sách.
       */
      if (current !== 1) {
        setCurrent(1);
      } else {
        await loadComments(false);
      }

      notifyCommentChanged();
    } catch (requestError) {
      console.error("Cannot create membership comment:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tạo bình luận."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * =========================
   * CREATE REPLY
   * =========================
   */
  const handleCreateReply = async (parentCommentId: string) => {
    if (!post?.id || !ensureAuthenticated()) {
      return;
    }

    const normalizedContent = replyContent.trim();

    if (!normalizedContent) {
      setError("Vui lòng nhập nội dung phản hồi.");

      return;
    }

    setActionCommentId(parentCommentId);

    setError(null);

    try {
      const response = await createArtistMembershipCommentApi(
        post.id,
        {
          content: normalizedContent,

          parentCommentId,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Không thể tạo phản hồi.");
      }

      setReplyContent("");

      setReplyingCommentId(null);

      setOpenedRepliesByCommentId((previous) => ({
        ...previous,

        [parentCommentId]: true,
      }));

      await Promise.all([loadComments(false), loadReplies(parentCommentId)]);

      notifyCommentChanged();
    } catch (requestError) {
      console.error("Cannot create membership reply:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tạo phản hồi."
      );
    } finally {
      setActionCommentId(null);
    }
  };

  /*
   * =========================
   * START EDIT COMMENT
   * =========================
   */
  const handleStartEdit = (comment: IArtistMembershipPostComment) => {
    setEditingCommentId(comment.id);

    setEditContent(comment.content || "");

    setReplyingCommentId(null);

    setReplyContent("");
    setError(null);
  };

  /*
   * =========================
   * SAVE EDIT COMMENT
   * =========================
   */
  const handleSaveEdit = async (comment: IArtistMembershipPostComment) => {
    if (!post?.id || !ensureAuthenticated()) {
      return;
    }

    const normalizedContent = editContent.trim();

    if (!normalizedContent) {
      setError("Nội dung bình luận không được để trống.");

      return;
    }

    setActionCommentId(comment.id);

    setError(null);

    try {
      const response = await updateArtistMembershipCommentApi(
        post.id,
        comment.id,
        {
          content: normalizedContent,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Không thể cập nhật bình luận.");
      }

      setEditingCommentId(null);

      setEditContent("");

      if (comment.parentCommentId) {
        await loadReplies(comment.parentCommentId);
      } else {
        await loadComments(false);
      }
    } catch (requestError) {
      console.error("Cannot update membership comment:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể cập nhật bình luận."
      );
    } finally {
      setActionCommentId(null);
    }
  };

  /*
   * =========================
   * DELETE COMMENT
   * =========================
   */
  const handleDeleteComment = async (comment: IArtistMembershipPostComment) => {
    if (!post?.id || !ensureAuthenticated()) {
      return;
    }

    const confirmed = window.confirm("Bạn có chắc muốn xóa bình luận này?");

    if (!confirmed) {
      return;
    }

    setActionCommentId(comment.id);

    setError(null);

    try {
      const response = await deleteArtistMembershipCommentApi(
        post.id,
        comment.id,
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Không thể xóa bình luận.");
      }

      if (comment.parentCommentId) {
        await Promise.all([
          loadComments(false),

          loadReplies(comment.parentCommentId),
        ]);
      } else {
        await loadComments(false);
      }

      notifyCommentChanged();
    } catch (requestError) {
      console.error("Cannot delete membership comment:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể xóa bình luận."
      );
    } finally {
      setActionCommentId(null);
    }
  };

  /*
   * =========================
   * COMMENT ITEM
   * =========================
   */
  const renderComment = (
    comment: IArtistMembershipPostComment,
    isReply = false
  ) => {
    const isDeleted = Boolean(comment.deleted);

    const isEditing = editingCommentId === comment.id;

    const isReplying = replyingCommentId === comment.id;

    const isActionLoading = actionCommentId === comment.id;

    const replies = repliesByCommentId[comment.id] || [];

    const repliesOpen = Boolean(openedRepliesByCommentId[comment.id]);

    const repliesLoading = Boolean(loadingRepliesByCommentId[comment.id]);

    const isArtist = comment.author.type === "ARTIST";

    return (
      <Box
        key={comment.id}
        sx={{
          width: "100%",
          minWidth: 0,

          pl: isReply
            ? {
                xs: 1.5,
                sm: 3,
              }
            : 0,
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          {/* COMMENT AUTHOR AVATAR */}
          <Avatar
            src={comment.author.avatarUrl || undefined}
            alt={getAuthorDisplayName(comment.author)}
            sx={{
              width: isReply ? 32 : 38,

              height: isReply ? 32 : 38,

              flexShrink: 0,

              bgcolor: isArtist ? alpha("#FF5500", 0.18) : "#292929",

              color: isArtist ? "#FF7A33" : "#C8C8C8",

              border: isArtist
                ? "1px solid rgba(255, 85, 0, 0.36)"
                : "1px solid #3A3A3A",
            }}
          >
            {isArtist && (
              <WorkspacePremiumRoundedIcon
                sx={{
                  fontSize: isReply ? 17 : 20,
                }}
              />
            )}
          </Avatar>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                px: {
                  xs: 1.25,
                  sm: 1.5,
                },

                py: 1.1,

                bgcolor: isDeleted ? "#151515" : "#1B1B1B",

                border: "1px solid #303030",

                borderRadius: 2,
              }}
            >
              {/* COMMENT AUTHOR */}
              <Stack
                direction="row"
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                columnGap={0.75}
                rowGap={0.35}
              >
                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: 13,
                    fontWeight: 800,

                    overflow: "hidden",

                    textOverflow: "ellipsis",

                    whiteSpace: "nowrap",
                  }}
                >
                  {getAuthorDisplayName(comment.author)}
                </Typography>

                {isArtist && (
                  <Typography
                    component="span"
                    sx={{
                      px: 0.75,
                      py: 0.15,

                      color: "#FF7A33",

                      bgcolor: "rgba(255, 85, 0, 0.11)",

                      border: "1px solid rgba(255, 85, 0, 0.28)",

                      borderRadius: 999,

                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    Nghệ sĩ
                  </Typography>
                )}

                <Typography
                  component="span"
                  sx={{
                    color: "#747474",

                    fontSize: 11,
                  }}
                >
                  {formatCommentDate(comment.createdAt)}
                </Typography>

                {comment.edited && !isDeleted && (
                  <Typography
                    component="span"
                    sx={{
                      color: "#747474",

                      fontSize: 11,
                      fontStyle: "italic",
                    }}
                  >
                    Đã chỉnh sửa
                  </Typography>
                )}
              </Stack>

              {/* EDIT COMMENT FORM */}
              {isEditing ? (
                <Stack
                  spacing={1}
                  sx={{
                    mt: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={7}
                    value={editContent}
                    disabled={isActionLoading}
                    onChange={(event) => {
                      setEditContent(event.target.value);
                    }}
                    inputProps={{
                      maxLength: 2000,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        color: "#FFFFFF",

                        bgcolor: "#111111",

                        borderRadius: 2,

                        "& fieldset": {
                          borderColor: "#3A3A3A",
                        },

                        "&:hover fieldset": {
                          borderColor: "#555555",
                        },

                        "&.Mui-focused fieldset": {
                          borderColor: "#FF5500",
                        },
                      },
                    }}
                  />

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      disabled={isActionLoading}
                      onClick={() => {
                        setEditingCommentId(null);

                        setEditContent("");
                      }}
                      startIcon={<CancelRoundedIcon />}
                      sx={{
                        color: "#A5A5A5",

                        textTransform: "none",
                      }}
                    >
                      Hủy
                    </Button>

                    <Button
                      variant="contained"
                      disabled={isActionLoading || !editContent.trim()}
                      onClick={() => {
                        void handleSaveEdit(comment);
                      }}
                      startIcon={
                        isActionLoading ? (
                          <CircularProgress
                            size={15}
                            thickness={5}
                            sx={{
                              color: "inherit",
                            }}
                          />
                        ) : (
                          <SaveRoundedIcon />
                        )
                      }
                      sx={{
                        color: "#FFFFFF",

                        bgcolor: "#FF5500",

                        fontWeight: 800,
                        textTransform: "none",

                        boxShadow: "none",

                        "&:hover": {
                          bgcolor: "#E64D00",

                          boxShadow: "none",
                        },
                      }}
                    >
                      Lưu
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Typography
                  sx={{
                    mt: 0.6,

                    color: isDeleted ? "#777777" : "#D7D7D7",

                    fontSize: 13,
                    lineHeight: 1.65,

                    whiteSpace: "pre-wrap",

                    overflowWrap: "anywhere",

                    fontStyle: isDeleted ? "italic" : "normal",
                  }}
                >
                  {isDeleted ? "Bình luận đã bị xóa." : comment.content}
                </Typography>
              )}
            </Paper>

            {/* COMMENT ACTIONS */}
            {!isEditing && (
              <Stack
                direction="row"
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
                columnGap={0.25}
                rowGap={0.25}
                sx={{
                  mt: 0.35,
                }}
              >
                {!isDeleted && !isReply && (
                  <Button
                    size="small"
                    disabled={isActionLoading}
                    onClick={() => {
                      if (!ensureAuthenticated()) {
                        return;
                      }

                      setReplyingCommentId(comment.id);

                      setReplyContent("");

                      setEditingCommentId(null);
                    }}
                    startIcon={<ReplyRoundedIcon />}
                    sx={{
                      minHeight: 32,

                      color: "#8F8F8F",

                      fontSize: 12,
                      fontWeight: 700,

                      textTransform: "none",

                      "&:hover": {
                        color: "#FFFFFF",

                        bgcolor: "#1C1C1C",
                      },
                    }}
                  >
                    Phản hồi
                  </Button>
                )}

                {!isDeleted && comment.canEdit && (
                  <Button
                    size="small"
                    disabled={isActionLoading}
                    onClick={() => {
                      handleStartEdit(comment);
                    }}
                    startIcon={<EditRoundedIcon />}
                    sx={{
                      minHeight: 32,

                      color: "#8F8F8F",

                      fontSize: 12,
                      fontWeight: 700,

                      textTransform: "none",

                      "&:hover": {
                        color: "#FFFFFF",

                        bgcolor: "#1C1C1C",
                      },
                    }}
                  >
                    Sửa
                  </Button>
                )}

                {!isDeleted && comment.canDelete && (
                  <Button
                    size="small"
                    disabled={isActionLoading}
                    onClick={() => {
                      void handleDeleteComment(comment);
                    }}
                    startIcon={
                      isActionLoading ? (
                        <CircularProgress
                          size={14}
                          thickness={5}
                          sx={{
                            color: "inherit",
                          }}
                        />
                      ) : (
                        <DeleteOutlineRoundedIcon />
                      )
                    }
                    sx={{
                      minHeight: 32,

                      color: "#B77575",

                      fontSize: 12,
                      fontWeight: 700,

                      textTransform: "none",

                      "&:hover": {
                        color: "#FF8D8D",

                        bgcolor: "rgba(255, 90, 90, 0.08)",
                      },
                    }}
                  >
                    Xóa
                  </Button>
                )}

                {!isReply && comment.replyCount > 0 && (
                  <Button
                    size="small"
                    disabled={repliesLoading}
                    onClick={() => {
                      void handleToggleReplies(comment);
                    }}
                    startIcon={
                      repliesLoading ? (
                        <CircularProgress
                          size={14}
                          thickness={5}
                          sx={{
                            color: "inherit",
                          }}
                        />
                      ) : repliesOpen ? (
                        <ExpandLessRoundedIcon />
                      ) : (
                        <ExpandMoreRoundedIcon />
                      )
                    }
                    sx={{
                      minHeight: 32,

                      color: "#FF7A33",

                      fontSize: 12,
                      fontWeight: 800,

                      textTransform: "none",

                      "&:hover": {
                        bgcolor: "rgba(255, 85, 0, 0.08)",
                      },
                    }}
                  >
                    {repliesOpen
                      ? "Ẩn phản hồi"
                      : `${comment.replyCount} phản hồi`}
                  </Button>
                )}
              </Stack>
            )}

            {/* REPLY COMPOSER */}
            {isReplying && !isDeleted && (
              <Paper
                elevation={0}
                sx={{
                  mt: 1,

                  p: 1.25,

                  bgcolor: "#161616",

                  border: "1px solid #303030",

                  borderRadius: 2,
                }}
              >
                <TextField
                  autoFocus
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={6}
                  value={replyContent}
                  disabled={isActionLoading}
                  placeholder="Viết phản hồi..."
                  onChange={(event) => {
                    setReplyContent(event.target.value);
                  }}
                  inputProps={{
                    maxLength: 2000,
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#FFFFFF",

                      bgcolor: "#101010",

                      borderRadius: 2,

                      "& fieldset": {
                        borderColor: "#383838",
                      },

                      "&:hover fieldset": {
                        borderColor: "#555555",
                      },

                      "&.Mui-focused fieldset": {
                        borderColor: "#FF5500",
                      },
                    },

                    "& textarea::placeholder": {
                      color: "#707070",

                      opacity: 1,
                    },
                  }}
                />

                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="flex-end"
                  sx={{
                    mt: 1,
                  }}
                >
                  <Button
                    disabled={isActionLoading}
                    onClick={() => {
                      setReplyingCommentId(null);

                      setReplyContent("");
                    }}
                    sx={{
                      color: "#A5A5A5",

                      textTransform: "none",
                    }}
                  >
                    Hủy
                  </Button>

                  <Button
                    variant="contained"
                    disabled={isActionLoading || !replyContent.trim()}
                    onClick={() => {
                      void handleCreateReply(comment.id);
                    }}
                    startIcon={
                      isActionLoading ? (
                        <CircularProgress
                          size={15}
                          thickness={5}
                          sx={{
                            color: "inherit",
                          }}
                        />
                      ) : (
                        <SendRoundedIcon />
                      )
                    }
                    sx={{
                      color: "#FFFFFF",

                      bgcolor: "#FF5500",

                      fontWeight: 800,
                      textTransform: "none",

                      boxShadow: "none",

                      "&:hover": {
                        bgcolor: "#E64D00",

                        boxShadow: "none",
                      },
                    }}
                  >
                    Gửi
                  </Button>
                </Stack>
              </Paper>
            )}

            {/* REPLIES */}
            {!isReply && repliesOpen && (
              <Stack
                spacing={1.25}
                sx={{
                  mt: 1.25,
                }}
              >
                {repliesLoading ? (
                  <>
                    <Skeleton
                      variant="rounded"
                      height={72}
                      sx={{
                        bgcolor: "#202020",

                        borderRadius: 2,
                      }}
                    />

                    <Skeleton
                      variant="rounded"
                      height={72}
                      sx={{
                        bgcolor: "#202020",

                        borderRadius: 2,
                      }}
                    />
                  </>
                ) : replies.length > 0 ? (
                  replies.map((reply) => renderComment(reply, true))
                ) : (
                  <Typography
                    sx={{
                      pl: 2,

                      color: "#717171",

                      fontSize: 12,
                      fontStyle: "italic",
                    }}
                  >
                    Chưa có phản hồi.
                  </Typography>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          overflow: "hidden",

          bgcolor: "#0F0F0F",

          backgroundImage: "none",

          border: fullScreen ? "none" : "1px solid #303030",

          borderRadius: fullScreen ? 0 : 3,

          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.58)",
        },
      }}
    >
      {/* DIALOG HEADER */}
      <DialogTitle
        sx={{
          p: 0,

          bgcolor: "#121212",

          borderBottom: "1px solid #292929",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{
            minHeight: 64,

            px: {
              xs: 1.5,
              sm: 2.25,
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1.25}
            alignItems="center"
            minWidth={0}
          >
            <Box
              sx={{
                width: 38,
                height: 38,

                flexShrink: 0,

                display: "grid",
                placeItems: "center",

                color: "#FF6A1A",

                bgcolor: "rgba(255, 85, 0, 0.12)",

                border: "1px solid rgba(255, 85, 0, 0.28)",

                borderRadius: 2,
              }}
            >
              <ChatBubbleOutlineRoundedIcon />
            </Box>

            <Box minWidth={0}>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: {
                    xs: 16,
                    sm: 18,
                  },

                  fontWeight: 900,

                  overflow: "hidden",

                  textOverflow: "ellipsis",

                  whiteSpace: "nowrap",
                }}
              >
                Bình luận
              </Typography>

              <Typography
                sx={{
                  color: "#7F7F7F",

                  fontSize: 12,
                }}
              >
                {total} bình luận
              </Typography>
            </Box>
          </Stack>

          <IconButton
            onClick={onClose}
            sx={{
              color: "#A5A5A5",

              "&:hover": {
                color: "#FFFFFF",

                bgcolor: "#252525",
              },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,

          bgcolor: "#0F0F0F",
        }}
      >
        <Box
          sx={{
            px: {
              xs: 1.5,
              sm: 2.25,
            },

            py: 2,
          }}
        >
          {/* ERROR MESSAGE */}
          {error && (
            <Alert
              severity="error"
              onClose={() => {
                setError(null);
              }}
              sx={{
                mb: 2,

                color: "#FFD3D3",

                bgcolor: "#261313",

                border: "1px solid #633232",

                borderRadius: 2,

                "& .MuiAlert-icon": {
                  color: "#FF7878",
                },

                "& .MuiAlert-action": {
                  color: "#FFD3D3",
                },
              }}
            >
              {error}
            </Alert>
          )}

          {/* COMMENTS DISABLED */}
          {post && !post.allowComments && (
            <Alert
              severity="info"
              sx={{
                mb: 2,

                color: "#CFCFCF",

                bgcolor: "#171717",

                border: "1px solid #353535",

                borderRadius: 2,

                "& .MuiAlert-icon": {
                  color: "#8D8D8D",
                },
              }}
            >
              Nghệ sĩ đã tắt bình luận cho bài đăng này.
            </Alert>
          )}

          {/* CREATE ROOT COMMENT */}
          {post?.allowComments && (
            <Paper
              elevation={0}
              sx={{
                mb: 2.25,

                p: {
                  xs: 1.25,
                  sm: 1.5,
                },

                bgcolor: "#161616",

                border: "1px solid #303030",

                borderRadius: 2.5,
              }}
            >
              <TextField
                fullWidth
                multiline
                minRows={2}
                maxRows={7}
                value={commentContent}
                disabled={submitting}
                placeholder={
                  accessToken
                    ? "Viết bình luận..."
                    : "Đăng nhập để bình luận..."
                }
                onFocus={() => {
                  if (!accessToken) {
                    onRequireLogin?.();
                  }
                }}
                onChange={(event) => {
                  setCommentContent(event.target.value);
                }}
                inputProps={{
                  maxLength: 2000,
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    color: "#FFFFFF",

                    bgcolor: "#101010",

                    borderRadius: 2,

                    "& fieldset": {
                      borderColor: "#3A3A3A",
                    },

                    "&:hover fieldset": {
                      borderColor: "#555555",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#FF5500",
                    },
                  },

                  "& textarea::placeholder": {
                    color: "#707070",

                    opacity: 1,
                  },
                }}
              />

              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{
                  mt: 1,
                }}
              >
                <Typography
                  sx={{
                    color: "#666666",

                    fontSize: 11,
                  }}
                >
                  {commentContent.length}
                  /2000
                </Typography>

                <Button
                  variant="contained"
                  disabled={submitting || !commentContent.trim()}
                  onClick={() => {
                    void handleCreateComment();
                  }}
                  startIcon={
                    submitting ? (
                      <CircularProgress
                        size={16}
                        thickness={5}
                        sx={{
                          color: "inherit",
                        }}
                      />
                    ) : (
                      <SendRoundedIcon />
                    )
                  }
                  sx={{
                    minHeight: 40,

                    px: 1.75,

                    color: "#FFFFFF",
                    bgcolor: "#FF5500",

                    borderRadius: 2,

                    fontWeight: 800,
                    textTransform: "none",

                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#E64D00",

                      boxShadow: "none",
                    },

                    "&.Mui-disabled": {
                      color: "#747474",

                      bgcolor: "#282828",
                    },
                  }}
                >
                  Gửi bình luận
                </Button>
              </Stack>
            </Paper>
          )}

          <Divider
            sx={{
              mb: 2,

              borderColor: "#292929",
            }}
          />

          {/* COMMENTS LOADING */}
          {loading ? (
            <Stack spacing={2}>
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <Stack key={index} direction="row" spacing={1.25}>
                  <Skeleton
                    variant="circular"
                    width={38}
                    height={38}
                    sx={{
                      bgcolor: "#222222",
                    }}
                  />

                  <Skeleton
                    variant="rounded"
                    height={84}
                    sx={{
                      flex: 1,

                      bgcolor: "#1D1D1D",

                      borderRadius: 2,
                    }}
                  />
                </Stack>
              ))}
            </Stack>
          ) : comments.length === 0 ? (
            /* EMPTY COMMENTS */
            <Box
              sx={{
                py: {
                  xs: 4,
                  sm: 5,
                },

                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 56,
                  height: 56,

                  mx: "auto",
                  mb: 1.5,

                  display: "grid",
                  placeItems: "center",

                  color: "#777777",

                  bgcolor: "#191919",

                  border: "1px solid #303030",

                  borderRadius: "50%",
                }}
              >
                <ChatBubbleOutlineRoundedIcon
                  sx={{
                    fontSize: 27,
                  }}
                />
              </Box>

              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 16,
                  fontWeight: 800,
                }}
              >
                Chưa có bình luận
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "#777777",

                  fontSize: 13,
                }}
              >
                Hãy là người đầu tiên chia sẻ ý kiến.
              </Typography>
            </Box>
          ) : (
            /* COMMENT LIST */
            <Stack spacing={2}>
              {comments.map((comment) => renderComment(comment))}
            </Stack>
          )}

          {/* COMMENT PAGINATION */}
          {!loading && totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",

                pt: 3,
                pb: 1,

                overflowX: "auto",
              }}
            >
              <Pagination
                page={current}
                count={totalPages}
                siblingCount={0}
                boundaryCount={1}
                onChange={(_event, nextPage) => {
                  setCurrent(nextPage);
                }}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#B5B5B5",

                    bgcolor: "#171717",

                    borderColor: "#3A3A3A",

                    fontWeight: 700,

                    "&:hover": {
                      color: "#FFFFFF",

                      bgcolor: "#252525",
                    },

                    "&.Mui-selected": {
                      color: "#FFFFFF",

                      bgcolor: "#FF5500",

                      "&:hover": {
                        bgcolor: "#E64D00",
                      },
                    },
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileMembershipCommentsDialog;
