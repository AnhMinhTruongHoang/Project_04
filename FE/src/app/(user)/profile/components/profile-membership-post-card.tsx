"use client";

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
} from "@mui/material";

import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

const formatMembershipPostDate = (value?: string | null) => {
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

const formatPreviewDuration = (value?: number | null) => {
  if (!value || value <= 0) {
    return "Listen to full track";
  }

  const minutes = Math.floor(value / 60);

  const seconds = value % 60;

  if (minutes <= 0) {
    return `${seconds} seconds`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const getPostTypeLabel = (type: ArtistMembershipPostType) => {
  switch (type) {
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

const getPostTypeIcon = (type: ArtistMembershipPostType) => {
  switch (type) {
    case "IMAGE":
      return (
        <ImageOutlinedIcon
          sx={{
            fontSize: 16,
          }}
        />
      );

    case "POLL":
      return (
        <BarChartRoundedIcon
          sx={{
            fontSize: 16,
          }}
        />
      );

    case "TRACK_PREVIEW":
      return (
        <PlayArrowRoundedIcon
          sx={{
            fontSize: 17,
          }}
        />
      );

    default:
      return (
        <TextSnippetOutlinedIcon
          sx={{
            fontSize: 16,
          }}
        />
      );
  }
};

const ProfileMembershipPostCard = ({
  post,
  votingOptionId,
  onVote,
  onPlayTrack,
  onOpenComments,
  onJoinMembership,
}: IProfileMembershipPostCardProps) => {
  const isVoting = Boolean(votingOptionId);

  const isLocked = Boolean(post.locked);

  const visibilityLabel =
    post.visibility === "PUBLIC"
      ? "Public"
      : post.visibility === "TIER_ONLY"
      ? post.requiredPlanName || "Membership plan"
      : "Members only";

  const visibilityColor =
    post.visibility === "PUBLIC"
      ? "#4CAF50"
      : post.visibility === "TIER_ONLY"
      ? post.requiredBadgeColor || "#A78BFA"
      : "#FF5500";

  const handleVote = async (optionId: string) => {
    if (isVoting || isLocked || !onVote) {
      return;
    }

    await onVote(post.id, optionId);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        minWidth: 0,

        overflow: "hidden",

        bgcolor: "#111111",

        border: "1px solid #292929",

        borderRadius: {
          xs: 2.5,
          sm: 3,
        },

        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.22)",
      }}
    >
      {/* POST HEADER */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1.5}
        sx={{
          px: {
            xs: 1.75,
            sm: 2.25,
          },

          pt: {
            xs: 1.75,
            sm: 2.25,
          },

          pb: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} minWidth={0}>
          <Avatar
            sx={{
              width: 40,
              height: 40,

              bgcolor: alpha(visibilityColor, 0.16),

              color: visibilityColor,

              border: `1px solid ${alpha(visibilityColor, 0.34)}`,
            }}
          >
            <WorkspacePremiumRoundedIcon
              sx={{
                fontSize: 21,
              }}
            />
          </Avatar>

          <Box minWidth={0}>
            <Typography
              sx={{
                color: "#FFFFFF",

                fontSize: 14,
                fontWeight: 800,

                lineHeight: 1.3,

                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              Membership post
            </Typography>

            <Typography
              sx={{
                mt: 0.25,

                color: "#858585",
                fontSize: 12,
                lineHeight: 1.4,
              }}
            >
              {formatMembershipPostDate(post.publishedAt || post.createdAt)}
            </Typography>
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          justifyContent="flex-end"
          useFlexGap
        >
          <Chip
            size="small"
            icon={getPostTypeIcon(post.type)}
            label={getPostTypeLabel(post.type)}
            sx={{
              height: 26,

              color: "#C7C7C7",
              bgcolor: "#202020",

              border: "1px solid #343434",

              "& .MuiChip-icon": {
                color: "#A5A5A5",
              },

              "& .MuiChip-label": {
                px: 1,
                fontSize: 11,
                fontWeight: 700,
              },
            }}
          />

          <Chip
            size="small"
            icon={
              post.visibility === "PUBLIC" ? (
                <PublicRoundedIcon />
              ) : (
                <LockRoundedIcon />
              )
            }
            label={visibilityLabel}
            sx={{
              height: 26,

              color: visibilityColor,

              bgcolor: alpha(visibilityColor, 0.12),

              border: `1px solid ${alpha(visibilityColor, 0.32)}`,

              "& .MuiChip-icon": {
                color: visibilityColor,
              },

              "& .MuiChip-label": {
                px: 1,

                maxWidth: {
                  xs: 110,
                  sm: 180,
                },

                overflow: "hidden",
                textOverflow: "ellipsis",

                fontSize: 11,
                fontWeight: 700,
              },
            }}
          />
        </Stack>
      </Stack>

      {/* LOCKED MEMBERSHIP CONTENT */}
      {isLocked ? (
        <Box
          sx={{
            mx: {
              xs: 1.75,
              sm: 2.25,
            },

            mb: 2,

            px: {
              xs: 2,
              sm: 3,
            },

            py: {
              xs: 3,
              sm: 4,
            },

            textAlign: "center",

            borderRadius: 2.5,

            bgcolor: alpha(visibilityColor, 0.06),

            border: `1px solid ${alpha(visibilityColor, 0.22)}`,
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,

              mx: "auto",
              mb: 1.5,

              display: "grid",
              placeItems: "center",

              borderRadius: "50%",

              bgcolor: alpha(visibilityColor, 0.14),

              color: visibilityColor,
            }}
          >
            <LockRoundedIcon />
          </Box>

          <Typography
            sx={{
              color: "#FFFFFF",
              fontSize: 17,
              fontWeight: 800,
            }}
          >
            Membership content only.
          </Typography>

          <Typography
            sx={{
              mt: 0.75,

              color: "#A5A5A5",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {post.lockReason === "TIER_REQUIRED"
              ? `You need to join the ${
                  post.requiredPlanName || "required membership plan"
                } to view this content.`
              : "Join membership to unlock posts, images, and exclusive listening previews."}
          </Typography>

          <Button
            variant="contained"
            startIcon={<WorkspacePremiumRoundedIcon />}
            onClick={() => {
              onJoinMembership?.(post);
            }}
            sx={{
              mt: 2,

              minHeight: 42,

              borderRadius: 2,

              px: 2.25,

              color: "#FFFFFF",
              bgcolor: visibilityColor,

              fontWeight: 800,
              textTransform: "none",

              boxShadow: "none",

              "&:hover": {
                bgcolor: alpha(visibilityColor, 0.84),

                boxShadow: "none",
              },
            }}
          >
            Join membership
          </Button>
        </Box>
      ) : (
        <>
          {/* POST TEXT CONTENT */}
          {post.content && (
            <Typography
              sx={{
                px: {
                  xs: 1.75,
                  sm: 2.25,
                },

                pb: 1.75,

                color: "#E3E3E3",

                fontSize: {
                  xs: 14,
                  sm: 15,
                },

                lineHeight: 1.7,

                whiteSpace: "pre-wrap",

                overflowWrap: "anywhere",
              }}
            >
              {post.content}
            </Typography>
          )}

          {/* IMAGE POST */}
          {post.type === "IMAGE" && post.imageUrl && (
            <Box
              component="img"
              src={post.imageUrl}
              alt={post.content || "Community post"}
              loading="lazy"
              sx={{
                display: "block",

                width: "100%",
                maxHeight: 680,

                objectFit: "cover",

                bgcolor: "#080808",

                borderTop: "1px solid #242424",

                borderBottom: "1px solid #242424",
              }}
            />
          )}

          {/* TRACK PREVIEW POST */}
          {post.type === "TRACK_PREVIEW" && post.track && (
            <Box
              sx={{
                mx: {
                  xs: 1.75,
                  sm: 2.25,
                },

                mb: 2,

                p: 1.5,

                borderRadius: 2.5,

                bgcolor: "#191919",

                border: "1px solid #303030",
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  component="img"
                  src={post.track.imgUrl || "/images/default-track.png"}
                  alt={post.track.title}
                  sx={{
                    width: {
                      xs: 64,
                      sm: 76,
                    },

                    height: {
                      xs: 64,
                      sm: 76,
                    },

                    flexShrink: 0,

                    objectFit: "cover",
                    borderRadius: 2,

                    bgcolor: "#252525",
                  }}
                />

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      color: "#FFFFFF",

                      fontSize: {
                        xs: 14,
                        sm: 16,
                      },

                      fontWeight: 800,

                      overflow: "hidden",

                      textOverflow: "ellipsis",

                      whiteSpace: "nowrap",
                    }}
                  >
                    {post.track.title}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,

                      color: "#8F8F8F",

                      fontSize: 12,
                    }}
                  >
                    Play test ·{" "}
                    {formatPreviewDuration(post.track.previewDurationSeconds)}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  onClick={() => {
                    if (post.track) {
                      onPlayTrack?.(post.track, post);
                    }
                  }}
                  startIcon={<PlayArrowRoundedIcon />}
                  sx={{
                    minWidth: {
                      xs: 44,
                      sm: 112,
                    },

                    minHeight: 42,

                    px: {
                      xs: 1,
                      sm: 2,
                    },

                    borderRadius: 2,

                    color: "#FFFFFF",
                    bgcolor: "#FF5500",

                    fontWeight: 800,
                    textTransform: "none",

                    boxShadow: "none",

                    "&:hover": {
                      bgcolor: "#E64D00",

                      boxShadow: "none",
                    },

                    "& .MuiButton-startIcon": {
                      mr: {
                        xs: 0,
                        sm: 1,
                      },
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: {
                        xs: "none",
                        sm: "inline",
                      },
                    }}
                  >
                    Play
                  </Box>
                </Button>
              </Stack>
            </Box>
          )}

          {/* POLL POST */}
          {post.type === "POLL" && post.poll && (
            <Box
              sx={{
                px: {
                  xs: 1.75,
                  sm: 2.25,
                },

                pb: 2,
              }}
            >
              {!post.content && post.poll.question && (
                <Typography
                  sx={{
                    mb: 1.5,

                    color: "#FFFFFF",

                    fontSize: {
                      xs: 15,
                      sm: 17,
                    },

                    fontWeight: 800,
                    lineHeight: 1.5,
                  }}
                >
                  {post.poll.question}
                </Typography>
              )}

              <Stack spacing={1.1}>
                {post.poll.options.map((option) => {
                  const isSelected = Boolean(option.selected);

                  const isCurrentVoting = votingOptionId === option.id;

                  return (
                    <Button
                      key={option.id}
                      fullWidth
                      disabled={isVoting}
                      onClick={() => handleVote(option.id)}
                      sx={{
                        position: "relative",

                        overflow: "hidden",

                        minHeight: 50,

                        px: 1.5,
                        py: 1,

                        justifyContent: "space-between",

                        borderRadius: 2,

                        color: isSelected ? "#FFFFFF" : "#D7D7D7",

                        bgcolor: isSelected
                          ? alpha("#FF5500", 0.14)
                          : "#181818",

                        border: isSelected
                          ? `1px solid ${alpha("#FF5500", 0.72)}`
                          : "1px solid #333333",

                        textTransform: "none",

                        "&:hover": {
                          bgcolor: alpha("#FF5500", 0.1),

                          borderColor: alpha("#FF5500", 0.6),
                        },

                        "&.Mui-disabled": {
                          color: "#8A8A8A",
                        },
                      }}
                    >
                      {/* POLL PROGRESS BACKGROUND */}
                      <LinearProgress
                        variant="determinate"
                        value={option.percentage || 0}
                        sx={{
                          position: "absolute",

                          inset: 0,

                          width: "100%",
                          height: "100%",

                          bgcolor: "transparent",

                          opacity: 0.18,

                          "& .MuiLinearProgress-bar": {
                            bgcolor: isSelected ? "#FF5500" : "#777777",
                          },
                        }}
                      />

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        minWidth={0}
                        sx={{
                          position: "relative",

                          zIndex: 1,
                        }}
                      >
                        {isSelected && (
                          <CheckCircleRoundedIcon
                            sx={{
                              flexShrink: 0,

                              color: "#FF5500",

                              fontSize: 19,
                            }}
                          />
                        )}

                        <Typography
                          sx={{
                            color: "inherit",

                            fontSize: 13,
                            fontWeight: isSelected ? 800 : 600,

                            textAlign: "left",

                            overflow: "hidden",

                            textOverflow: "ellipsis",
                          }}
                        >
                          {option.text}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        sx={{
                          position: "relative",

                          zIndex: 1,

                          flexShrink: 0,
                        }}
                      >
                        {isCurrentVoting && (
                          <CircularProgress
                            size={15}
                            thickness={5}
                            sx={{
                              color: "#FF5500",
                            }}
                          />
                        )}

                        <Typography
                          sx={{
                            color: "#B7B7B7",

                            fontSize: 12,
                            fontWeight: 800,
                          }}
                        >
                          {Number(option.percentage || 0).toFixed(1)}%
                        </Typography>
                      </Stack>
                    </Button>
                  );
                })}
              </Stack>

              <Typography
                sx={{
                  mt: 1.25,

                  color: "#777777",
                  fontSize: 12,
                }}
              >
                {post.poll.totalVotes || 0} VOTES
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* POST FOOTER */}
      <Divider
        sx={{
          borderColor: "#292929",
        }}
      />

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{
          px: {
            xs: 1.25,
            sm: 1.75,
          },

          py: 1,
        }}
      >
        <Button
          disabled={!post.allowComments || isLocked}
          onClick={() => {
            onOpenComments?.(post);
          }}
          startIcon={<ChatBubbleOutlineRoundedIcon />}
          sx={{
            minHeight: 38,

            px: 1.25,

            color: "#AFAFAF",

            borderRadius: 2,

            fontSize: 13,
            fontWeight: 700,

            textTransform: "none",

            "&:hover": {
              color: "#FFFFFF",
              bgcolor: "#1D1D1D",
            },

            "&.Mui-disabled": {
              color: "#5E5E5E",
            },
          }}
        >
          {post.allowComments
            ? `${post.commentCount || 0} comments`
            : "Comments disabled"}
        </Button>

        {post.status !== "PUBLISHED" && (
          <Chip
            size="small"
            label={post.status === "DRAFT" ? "Draft" : "Archived"}
            sx={{
              color: "#A5A5A5",
              bgcolor: "#202020",

              border: "1px solid #343434",

              fontSize: 11,
              fontWeight: 700,
            }}
          />
        )}
      </Stack>
    </Paper>
  );
};

export default ProfileMembershipPostCard;
