"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Stack,
  Typography,
} from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PublishRoundedIcon from "@mui/icons-material/PublishRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

import { useCallback, useEffect, useState } from "react";

import {
  archiveArtistMembershipPostApi,
  deleteArtistMembershipPostApi,
  getMyArtistMembershipPostsApi,
  publishArtistMembershipPostApi,
} from "@/utils/api";

import { useToast } from "@/utils/toast";
import ProfileMembershipEditPostDialog from "./profile-membership-edit-post-dialog";

const PAGE_SIZE = 10;

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getPostTypeLabel = (type?: ArtistMembershipPostType) => {
  switch (type) {
    case "TEXT":
      return "Text";

    case "IMAGE":
      return "Image";

    case "POLL":
      return "Poll";

    case "TRACK_PREVIEW":
      return "Track preview";

    default:
      return "Post";
  }
};

const getPostTypeIcon = (type?: ArtistMembershipPostType) => {
  switch (type) {
    case "IMAGE":
      return <ImageRoundedIcon />;

    case "POLL":
      return <PollRoundedIcon />;

    case "TRACK_PREVIEW":
      return <GraphicEqRoundedIcon />;

    default:
      return <ArticleRoundedIcon />;
  }
};

const getStatusStyle = (status?: ArtistMembershipPostStatus) => {
  switch (status) {
    case "PUBLISHED":
      return {
        color: "#75DA8C",
        bgcolor: "rgba(45,180,85,0.10)",
        borderColor: "rgba(70,200,100,0.22)",
      };

    case "DRAFT":
      return {
        color: "#E3B366",
        bgcolor: "rgba(225,165,70,0.10)",
        borderColor: "rgba(225,165,70,0.22)",
      };

    case "ARCHIVED":
      return {
        color: "#999999",
        bgcolor: "#202020",
        borderColor: "rgba(255,255,255,0.10)",
      };

    default:
      return {
        color: "#999999",
        bgcolor: "#202020",
        borderColor: "rgba(255,255,255,0.10)",
      };
  }
};

const ProfileMembershipManagePostsDialog = ({
  open,
  accessToken,
  onClose,
  onChanged,
}: IProfileMembershipManagePostsDialogProps) => {
  const toast = useToast();

  const [posts, setPosts] = useState<IArtistMembershipPost[]>([]);

  const [current, setCurrent] = useState(1);

  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(false);

  const [processingPostId, setProcessingPostId] = useState<string | null>(null);

  const [deletePost, setDeletePost] = useState<IArtistMembershipPost | null>(
    null
  );

  const [editPost, setEditPost] = useState<IArtistMembershipPost | null>(null);

  /*
   * =========================
   * LOAD MEMBERSHIP POSTS
   * =========================
   */
  const loadPosts = useCallback(
    async (page = current) => {
      if (!open || !accessToken) {
        return;
      }

      setLoading(true);

      try {
        const response = await getMyArtistMembershipPostsApi(
          accessToken,
          page,
          PAGE_SIZE
        );

        const data = response?.data;

        const items = data?.items;

        setPosts(Array.isArray(items) ? items : []);

        setCurrent(Number(data?.current || page));

        setTotal(Number(data?.total || 0));

        setTotalPages(Number(data?.totalPages || 0));
      } catch (requestError) {
        console.error("Cannot load membership posts:", requestError);

        toast.error(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load membership posts."
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, current, open, toast]
  );

  /*
   * =========================
   * INITIAL LOAD
   * =========================
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrent(1);

    void loadPosts(1);
  }, [open]);

  /*
   * =========================
   * PUBLISH POST
   * =========================
   */
  const handlePublishPost = async (post: IArtistMembershipPost) => {
    if (!accessToken || processingPostId) {
      return;
    }

    setProcessingPostId(post.id);

    try {
      const response = await publishArtistMembershipPostApi(
        post.id,
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to publish the post.");
      }

      toast.success("Post published successfully.");

      await loadPosts(current);

      onChanged?.();
    } catch (requestError) {
      console.error("Cannot publish membership post:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to publish the post."
      );
    } finally {
      setProcessingPostId(null);
    }
  };

  /*
   * =========================
   * ARCHIVE POST
   * =========================
   */
  const handleArchivePost = async (post: IArtistMembershipPost) => {
    if (!accessToken || processingPostId) {
      return;
    }

    setProcessingPostId(post.id);

    try {
      const response = await archiveArtistMembershipPostApi(
        post.id,
        accessToken
      );

      if (!response?.data) {
        throw new Error(response?.message || "Unable to archive the post.");
      }

      toast.success("Post archived successfully.");

      await loadPosts(current);

      onChanged?.();
    } catch (requestError) {
      console.error("Cannot archive membership post:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to archive the post."
      );
    } finally {
      setProcessingPostId(null);
    }
  };

  /*
   * =========================
   * CONFIRM DELETE POST
   * =========================
   */
  const handleConfirmDelete = async () => {
    if (!accessToken || !deletePost || processingPostId) {
      return;
    }

    const postId = deletePost.id;

    setProcessingPostId(postId);

    try {
      await deleteArtistMembershipPostApi(postId, accessToken);

      toast.success("Post deleted successfully.");

      setDeletePost(null);

      /*
       * Nếu xóa item cuối cùng
       * của page hiện tại, quay lại
       * page trước.
       */
      const nextPage =
        posts.length === 1 && current > 1 ? current - 1 : current;

      await loadPosts(nextPage);

      onChanged?.();
    } catch (requestError) {
      console.error("Cannot delete membership post:", requestError);

      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Unable to delete the post."
      );
    } finally {
      setProcessingPostId(null);
    }
  };

  return (
    <>
      {/* MANAGE MEMBERSHIP POSTS DIALOG */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        PaperProps={{
          sx: {
            bgcolor: "#101010",

            backgroundImage:
              "linear-gradient(180deg, rgba(255,85,0,0.045), transparent 180px)",

            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.10)",

            borderRadius: {
              xs: 2,
              sm: 3,
            },

            boxShadow: "0 30px 100px rgba(0,0,0,0.78)",
          },
        }}
      >
        {/* MANAGE POSTS HEADER */}
        <DialogTitle
          sx={{
            p: 0,

            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              minHeight: 74,

              px: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: {
                    xs: 18,
                    sm: 20,
                  },

                  fontWeight: 900,
                }}
              >
                Manage posts
              </Typography>

              <Typography
                sx={{
                  mt: 0.25,

                  color: "#7F7F7F",

                  fontSize: 12,
                }}
              >
                Manage your membership community content
              </Typography>
            </Box>

            <IconButton
              aria-label="Close"
              onClick={onClose}
              sx={{
                color: "#999999",

                "&:hover": {
                  color: "#FFFFFF",
                  bgcolor: "#242424",
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          {/* POSTS SUMMARY */}
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
              mb: 2.5,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",

                  fontSize: 17,
                  fontWeight: 900,
                }}
              >
                Your posts
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,

                  color: "#777777",

                  fontSize: 12.5,
                }}
              >
                {total} {total === 1 ? "post" : "posts"}
              </Typography>
            </Box>

            <Button
              disabled={loading}
              startIcon={
                loading ? (
                  <CircularProgress
                    size={15}
                    thickness={5}
                    sx={{
                      color: "inherit",
                    }}
                  />
                ) : (
                  <RefreshRoundedIcon />
                )
              }
              onClick={() => {
                void loadPosts(current);
              }}
              sx={{
                minHeight: 40,

                color: "#C5C5C5",

                bgcolor: "#1D1D1D",

                border: "1px solid rgba(255,255,255,0.10)",

                borderRadius: 2,

                fontWeight: 800,
                textTransform: "none",

                "&:hover": {
                  color: "#FFFFFF",

                  bgcolor: "#252525",
                },
              }}
            >
              Refresh
            </Button>
          </Stack>

          {/* POSTS LOADING */}
          {loading && posts.length === 0 ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1.5}
              sx={{
                minHeight: 280,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#FF5500",
                }}
              />

              <Typography
                sx={{
                  color: "#777777",

                  fontSize: 13,
                }}
              >
                Loading posts...
              </Typography>
            </Stack>
          ) : posts.length === 0 ? (
            /* EMPTY POSTS */
            <Box
              sx={{
                py: 6,
                px: 2,

                textAlign: "center",

                bgcolor: "#151515",

                border: "1px dashed rgba(255,255,255,0.13)",

                borderRadius: 3,
              }}
            >
              <ArticleRoundedIcon
                sx={{
                  color: "#555555",

                  fontSize: 44,
                }}
              />

              <Typography
                sx={{
                  mt: 1,

                  color: "#FFFFFF",

                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                No membership posts yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "#777777",

                  fontSize: 13,
                }}
              >
                Your membership posts will appear here.
              </Typography>
            </Box>
          ) : (
            /* MEMBERSHIP POSTS */
            <Stack spacing={1.5}>
              {posts.map((post) => {
                const statusStyle = getStatusStyle(post.status);

                const processing = processingPostId === post.id;

                return (
                  <Box
                    key={post.id}
                    sx={{
                      p: {
                        xs: 1.75,
                        sm: 2,
                      },

                      bgcolor: "#151515",

                      border: "1px solid rgba(255,255,255,0.08)",

                      borderRadius: 2.5,

                      transition:
                        "border-color 0.2s ease, background-color 0.2s ease",

                      "&:hover": {
                        bgcolor: "#181818",

                        borderColor: "rgba(255,255,255,0.14)",
                      },
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        md: "row",
                      }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      {/* POST INFORMATION */}
                      <Stack direction="row" spacing={1.3} minWidth={0}>
                        <Box
                          sx={{
                            width: 42,
                            height: 42,

                            flexShrink: 0,

                            display: "grid",

                            placeItems: "center",

                            color: "#FF6A1A",

                            bgcolor: "rgba(255,85,0,0.10)",

                            borderRadius: 2,

                            "& svg": {
                              fontSize: 22,
                            },
                          }}
                        >
                          {getPostTypeIcon(post.type)}
                        </Box>

                        <Box minWidth={0}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            gap={0.75}
                          >
                            <Typography
                              sx={{
                                color: "#FFFFFF",

                                fontSize: 14,

                                fontWeight: 850,
                              }}
                            >
                              {getPostTypeLabel(post.type)}
                            </Typography>

                            <Chip
                              size="small"
                              label={post.status || "Unknown"}
                              sx={{
                                height: 23,

                                color: statusStyle.color,

                                bgcolor: statusStyle.bgcolor,

                                border: `1px solid ${statusStyle.borderColor}`,

                                fontSize: 10.5,

                                fontWeight: 850,
                              }}
                            />

                            <Chip
                              size="small"
                              label={
                                post.visibility === "TIER_ONLY"
                                  ? "Specific plan"
                                  : post.visibility === "MEMBERS_ONLY"
                                  ? "Members only"
                                  : "Public"
                              }
                              sx={{
                                height: 23,

                                color: "#A7A7A7",

                                bgcolor: "#202020",

                                border: "1px solid rgba(255,255,255,0.08)",

                                fontSize: 10.5,

                                fontWeight: 750,
                              }}
                            />
                          </Stack>

                          {post.content && (
                            <Typography
                              sx={{
                                mt: 0.8,

                                maxWidth: 540,

                                color: "#B5B5B5",

                                fontSize: 13,

                                lineHeight: 1.55,

                                display: "-webkit-box",

                                WebkitLineClamp: 2,

                                WebkitBoxOrient: "vertical",

                                overflow: "hidden",

                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {post.content}
                            </Typography>
                          )}

                          <Typography
                            sx={{
                              mt: 0.8,

                              color: "#656565",

                              fontSize: 11.5,
                            }}
                          >
                            Created {formatDate(post.createdAt)}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* POST ACTIONS */}
                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        spacing={0.8}
                        sx={{
                          flexShrink: 0,

                          alignSelf: {
                            xs: "stretch",
                            md: "center",
                          },
                        }}
                      >
                        {/* EDIT POST */}
                        <Button
                          disabled={processing}
                          startIcon={<EditRoundedIcon />}
                          onClick={() => {
                            setEditPost(post);
                          }}
                          sx={{
                            minHeight: 38,

                            color: "#D7D7D7",
                            bgcolor: "#222222",

                            border: "1px solid rgba(255,255,255,0.08)",

                            borderRadius: 2,

                            fontWeight: 800,
                            textTransform: "none",

                            "&:hover": {
                              color: "#FFFFFF",
                              bgcolor: "#2B2B2B",
                              borderColor: "rgba(255,255,255,0.16)",
                            },
                          }}
                        >
                          Edit
                        </Button>

                        {/* PUBLISH DRAFT */}
                        {post.status === "DRAFT" && (
                          <Button
                            disabled={processing}
                            startIcon={
                              processing ? (
                                <CircularProgress
                                  size={14}
                                  thickness={5}
                                  sx={{
                                    color: "inherit",
                                  }}
                                />
                              ) : (
                                <PublishRoundedIcon />
                              )
                            }
                            onClick={() => {
                              void handlePublishPost(post);
                            }}
                            sx={{
                              minHeight: 38,

                              color: "#7DDD91",

                              bgcolor: "rgba(60,190,90,0.07)",

                              border: "1px solid rgba(75,200,100,0.15)",

                              borderRadius: 2,

                              fontWeight: 800,

                              textTransform: "none",

                              "&:hover": {
                                bgcolor: "rgba(60,190,90,0.12)",
                              },
                            }}
                          >
                            Publish
                          </Button>
                        )}

                        {/* ARCHIVE POST */}
                        {post.status !== "ARCHIVED" && (
                          <Button
                            disabled={processing}
                            startIcon={<Inventory2OutlinedIcon />}
                            onClick={() => {
                              void handleArchivePost(post);
                            }}
                            sx={{
                              minHeight: 38,

                              color: "#B5B5B5",

                              bgcolor: "#222222",

                              borderRadius: 2,

                              fontWeight: 800,

                              textTransform: "none",

                              "&:hover": {
                                color: "#FFFFFF",

                                bgcolor: "#2B2B2B",
                              },
                            }}
                          >
                            Archive
                          </Button>
                        )}

                        {/* DELETE POST */}
                        <Button
                          disabled={processing}
                          startIcon={<DeleteOutlineRoundedIcon />}
                          onClick={() => {
                            setDeletePost(post);
                          }}
                          sx={{
                            minHeight: 38,

                            color: "#D98D8D",

                            bgcolor: "rgba(255,80,80,0.05)",

                            borderRadius: 2,

                            fontWeight: 800,

                            textTransform: "none",

                            "&:hover": {
                              color: "#FFAAAA",

                              bgcolor: "rgba(255,80,80,0.10)",
                            },
                          }}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {/* POSTS PAGINATION */}
          {totalPages > 1 && (
            <Stack
              alignItems="center"
              sx={{
                mt: 3,
              }}
            >
              <Pagination
                page={current}
                count={totalPages}
                disabled={loading}
                onChange={(_, page) => {
                  setCurrent(page);

                  void loadPosts(page);
                }}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#AAAAAA",

                    borderColor: "rgba(255,255,255,0.12)",
                  },

                  "& .MuiPaginationItem-root:hover": {
                    bgcolor: "#242424",

                    color: "#FFFFFF",
                  },

                  "& .Mui-selected": {
                    bgcolor: "#FF5500 !important",

                    color: "#FFFFFF",
                  },
                }}
              />
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MEMBERSHIP POST DIALOG */}
      <ProfileMembershipEditPostDialog
        open={Boolean(editPost)}
        post={editPost}
        accessToken={accessToken}
        onClose={() => {
          setEditPost(null);
        }}
        onUpdated={() => {
          setEditPost(null);

          void loadPosts(current);

          onChanged?.();
        }}
      />

      {/* DELETE POST CONFIRMATION */}
      <Dialog
        open={Boolean(deletePost)}
        onClose={() => {
          if (!processingPostId) {
            setDeletePost(null);
          }
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#121212",

            backgroundImage: "none",

            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.10)",

            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#FFFFFF",

            fontWeight: 900,
          }}
        >
          Delete post?
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#A7A7A7",

              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            This post will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            disabled={Boolean(processingPostId)}
            onClick={() => {
              setDeletePost(null);
            }}
            sx={{
              color: "#B0B0B0",

              fontWeight: 800,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={Boolean(processingPostId)}
            onClick={() => {
              void handleConfirmDelete();
            }}
            startIcon={
              processingPostId ? (
                <CircularProgress
                  size={15}
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
              color: "#FFFFFF",

              bgcolor: "#C83F3F",

              borderRadius: 2,

              fontWeight: 850,
              textTransform: "none",

              boxShadow: "none",

              "&:hover": {
                bgcolor: "#D94A4A",

                boxShadow: "none",
              },
            }}
          >
            {processingPostId ? "Deleting..." : "Delete post"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileMembershipManagePostsDialog;
