"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Pagination,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { useCallback, useEffect, useState } from "react";

import {
  getArtistMembershipPostsApi,
  voteArtistMembershipPollApi,
} from "@/utils/api";

import ProfileMembershipPostCard from "./profile-membership-post-card";

const PAGE_SIZE = 10;

const ProfileMembershipFeed = ({
  artistId,
  accessToken,
  refreshKey = 0,
  onPlayTrack,
  onOpenComments,
  onJoinMembership,
  onRequireLogin,
}: IProfileMembershipFeedProps) => {
  const [posts, setPosts] = useState<IArtistMembershipPost[]>([]);

  const [current, setCurrent] = useState(1);

  const [total, setTotal] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [votingOptionId, setVotingOptionId] = useState<string | null>(null);

  /*
   * =========================
   * LOAD COMMUNITY FEED
   * =========================
   */
  const loadPosts = useCallback(
    async (showFullLoading = true) => {
      if (!artistId?.trim()) {
        setPosts([]);
        setTotal(0);
        setTotalPages(0);
        setLoading(false);

        return;
      }

      if (showFullLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);

      try {
        const response = await getArtistMembershipPostsApi(
          artistId,
          accessToken,
          {
            current,
            pageSize: PAGE_SIZE,
          }
        );

        const data = response?.data;

        if (!data) {
          throw new Error(
            response?.message || "Unable to load membership posts."
          );
        }

        setPosts(Array.isArray(data.items) ? data.items : []);

        setTotal(Number(data.total || 0));

        setTotalPages(Number(data.totalPages || 0));
      } catch (requestError) {
        console.error("Cannot load membership posts:", requestError);

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load membership posts."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, artistId, current]
  );

  /*
   * =========================
   * RESET PAGE WHEN ARTIST CHANGES
   * =========================
   */
  useEffect(() => {
    setCurrent(1);
  }, [artistId]);

  /*
   * =========================
   * FETCH FEED
   * =========================
   */
  useEffect(() => {
    void loadPosts(true);
  }, [loadPosts, refreshKey]);

  /*
   * =========================
   * VOTE POLL
   * =========================
   */
  const handleVote = async (postId: string, optionId: string) => {
    if (!accessToken) {
      onRequireLogin?.();

      setError("Vui lòng đăng nhập để bình chọn.");

      return;
    }

    if (votingOptionId) {
      return;
    }

    setError(null);
    setVotingOptionId(optionId);

    try {
      const response = await voteArtistMembershipPollApi(
        postId,
        {
          optionId,
        },
        accessToken
      );

      const updatedPost = response?.data;

      if (!updatedPost) {
        throw new Error(
          response?.message || "Không thể lưu lựa chọn bình chọn."
        );
      }

      /*
       * API vote có thể chỉ trả phần dữ liệu Poll.
       * Merge với post hiện tại để giữ:
       *
       * commentCount
       * locked
       * imageUrl
       * track
       */
      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                ...updatedPost,

                poll: updatedPost.poll ?? post.poll,

                commentCount: updatedPost.commentCount ?? post.commentCount,
              }
            : post
        )
      );
    } catch (requestError) {
      console.error("Cannot vote membership poll:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể lưu lựa chọn bình chọn."
      );
    } finally {
      setVotingOptionId(null);
    }
  };

  /*
   * =========================
   * LOADING STATE
   * =========================
   */
  if (loading) {
    return (
      <Stack spacing={2}>
        {Array.from({
          length: 3,
        }).map((_, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              overflow: "hidden",

              p: {
                xs: 1.75,
                sm: 2.25,
              },

              bgcolor: "#111111",

              border: "1px solid #292929",

              borderRadius: {
                xs: 2.5,
                sm: 3,
              },
            }}
          >
            {/* POST HEADER SKELETON */}
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{
                  bgcolor: "#242424",
                }}
              />

              <Box
                sx={{
                  flex: 1,
                }}
              >
                <Skeleton
                  width="38%"
                  height={22}
                  sx={{
                    bgcolor: "#242424",
                  }}
                />

                <Skeleton
                  width="24%"
                  height={18}
                  sx={{
                    bgcolor: "#202020",
                  }}
                />
              </Box>
            </Stack>

            {/* POST CONTENT SKELETON */}
            <Stack
              spacing={0.5}
              sx={{
                mt: 2,
              }}
            >
              <Skeleton
                width="94%"
                height={21}
                sx={{
                  bgcolor: "#242424",
                }}
              />

              <Skeleton
                width="82%"
                height={21}
                sx={{
                  bgcolor: "#242424",
                }}
              />

              <Skeleton
                width="58%"
                height={21}
                sx={{
                  bgcolor: "#242424",
                }}
              />
            </Stack>

            <Skeleton
              variant="rounded"
              width="100%"
              height={120}
              sx={{
                mt: 2,

                bgcolor: "#1C1C1C",
                borderRadius: 2,
              }}
            />
          </Paper>
        ))}
      </Stack>
    );
  }

  return (
    <Stack
      spacing={2}
      sx={{
        width: "100%",
        minWidth: 0,
      }}
    >
      {/* FEED HEADER */}
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
        spacing={1.25}
      >
        <Box minWidth={0}>
          <Typography
            sx={{
              color: "#FFFFFF",

              fontSize: {
                xs: 18,
                sm: 20,
              },

              fontWeight: 900,
              lineHeight: 1.3,
            }}
          >
            Members-only post
          </Typography>

          <Typography
            sx={{
              mt: 0.4,

              color: "#858585",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {total > 0
              ? `${total} posts from the artist`
              : "Exclusive content from the artist"}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          disabled={refreshing}
          onClick={() => {
            void loadPosts(false);
          }}
          startIcon={
            refreshing ? (
              <CircularProgress
                size={16}
                thickness={5}
                sx={{
                  color: "inherit",
                }}
              />
            ) : (
              <RefreshRoundedIcon />
            )
          }
          sx={{
            minHeight: 40,

            alignSelf: {
              xs: "flex-start",
              sm: "center",
            },

            px: 1.5,

            color: "#BDBDBD",

            borderColor: "#3A3A3A",
            borderRadius: 2,

            fontSize: 13,
            fontWeight: 700,

            textTransform: "none",

            "&:hover": {
              color: "#FFFFFF",

              bgcolor: "#1A1A1A",
              borderColor: "#555555",
            },

            "&.Mui-disabled": {
              color: "#676767",
              borderColor: "#303030",
            },
          }}
        >
          Refresh
        </Button>
      </Stack>

      {/* FEED ERROR */}
      {error && (
        <Alert
          severity="error"
          onClose={() => {
            setError(null);
          }}
          sx={{
            color: "#FFD7D7",
            bgcolor: "#251313",

            border: "1px solid #663333",

            borderRadius: 2,

            "& .MuiAlert-icon": {
              color: "#FF7676",
            },

            "& .MuiAlert-action": {
              color: "#FFD7D7",
            },
          }}
        >
          {error}
        </Alert>
      )}

      {/* EMPTY FEED */}
      {posts.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            px: {
              xs: 2,
              sm: 3,
            },

            py: {
              xs: 4,
              sm: 5,
            },

            textAlign: "center",

            bgcolor: "#111111",

            border: "1px dashed #353535",

            borderRadius: 3,
          }}
        >
          <Box
            sx={{
              width: 58,
              height: 58,

              mx: "auto",
              mb: 1.5,

              display: "grid",
              placeItems: "center",

              color: "#FF5500",

              bgcolor: "rgba(255, 85, 0, 0.1)",

              border: "1px solid rgba(255, 85, 0, 0.25)",

              borderRadius: "50%",
            }}
          >
            <WorkspacePremiumRoundedIcon
              sx={{
                fontSize: 29,
              }}
            />
          </Box>

          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            No member posts available.
          </Typography>

          <Typography
            sx={{
              maxWidth: 460,

              mx: "auto",
              mt: 0.75,

              color: "#898989",
              fontSize: 13,
              lineHeight: 1.65,
            }}
          >
            No member posts available. Exclusive articles, photos, polls, and
            previews will be displayed here.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* MEMBERSHIP POSTS */}
          <Stack spacing={2}>
            {posts.map((post) => (
              <ProfileMembershipPostCard
                key={post.id}
                post={post}
                votingOptionId={votingOptionId}
                onVote={handleVote}
                onPlayTrack={onPlayTrack}
                onOpenComments={onOpenComments}
                onJoinMembership={onJoinMembership}
              />
            ))}
          </Stack>

          {/* FEED PAGINATION */}
          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",

                pt: 1,
                pb: 0.5,

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

                    borderColor: "#3A3A3A",

                    bgcolor: "#151515",

                    fontWeight: 700,

                    "&:hover": {
                      color: "#FFFFFF",

                      bgcolor: "#242424",
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
        </>
      )}
    </Stack>
  );
};

export default ProfileMembershipFeed;
