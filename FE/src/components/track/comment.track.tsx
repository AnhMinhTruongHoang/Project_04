"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Avatar,
  Box,
  Button,
  IconButton,
  Popover,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddReactionRoundedIcon from "@mui/icons-material/AddReactionRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import WaveSurfer from "wavesurfer.js";

import { sendRequest } from "@/utils/api";
import { useHasMounted } from "@/utils/customHook";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getAvatar";
import { getUserHref } from "@/utils/actions/navigation";

dayjs.extend(relativeTime);

interface IProps {
  track: ITrackTop | null;
  comments?: ITrackComment[];
  wavesurfer?: WaveSurfer | null;
}

const getTrackId = (track?: any) => {
  return track?._id || track?.id || "";
};

const isArtist = (user?: any) => {
  return String(user?.type || "").toUpperCase() === "ARTIST";
};

const getUserName = (user?: any) => {
  if (!user) return "User";

  if (typeof user === "string") {
    if (user.includes("@")) return user.split("@")[0];
    return "User";
  }

  const email = String(user?.email || "").trim();
  const username = String(user?.username || "").trim();
  const fullName = String(user?.fullName || "").trim();
  const displayName = String(user?.displayName || "").trim();
  const name = String(user?.name || "").trim();

  const isBadName = (value: string) => {
    const lower = value.toLowerCase();

    return (
      !value ||
      lower === "user" ||
      lower === "social user" ||
      lower === "unknown" ||
      lower === "unknown user"
    );
  };

  if (!isBadName(fullName)) return fullName;
  if (!isBadName(displayName)) return displayName;

  if (!isBadName(name)) {
    return name.includes("@") ? name.split("@")[0] : name;
  }

  if (email) return email.split("@")[0];

  if (username) {
    return username.includes("@") ? username.split("@")[0] : username;
  }

  return "User";
};

const getUserEmail = (user?: any) => {
  if (!user) return "";

  if (typeof user === "string") {
    return user.includes("@") ? user : "";
  }

  return user?.email || user?.username || "";
};

const getCommentUser = (comment?: any) => {
  const rawUser =
    comment?.user ||
    comment?.createdBy ||
    comment?.author ||
    comment?.created_by ||
    comment?.userInfo ||
    comment?.account ||
    comment?.owner ||
    {};

  if (typeof rawUser === "string") {
    return {
      _id: rawUser,
      id: rawUser,
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
      avatarUrl: comment?.userAvatar || comment?.avatarUrl || comment?.avatar,
    };
  }

  return {
    ...rawUser,
    _id:
      rawUser?._id ||
      rawUser?.id ||
      comment?.userId ||
      comment?.createdById ||
      comment?.authorId,
    id:
      rawUser?.id ||
      rawUser?._id ||
      comment?.userId ||
      comment?.createdById ||
      comment?.authorId,
    name:
      rawUser?.name ||
      rawUser?.fullName ||
      rawUser?.displayName ||
      comment?.userName ||
      comment?.username ||
      comment?.name ||
      comment?.createdByName ||
      comment?.authorName,
    username:
      rawUser?.username ||
      comment?.username ||
      comment?.userEmail ||
      comment?.email ||
      comment?.createdByEmail ||
      comment?.authorEmail,
    email:
      rawUser?.email ||
      comment?.userEmail ||
      comment?.email ||
      comment?.createdByEmail ||
      comment?.authorEmail,
    avatarUrl:
      rawUser?.avatarUrl ||
      rawUser?.avatar ||
      rawUser?.image ||
      comment?.userAvatar ||
      comment?.avatarUrl ||
      comment?.avatar,
    type: rawUser?.type || comment?.userType || comment?.type,
  };
};

const getTrackUploader = (track?: any) => {
  return (
    track?.uploader ||
    track?.user ||
    track?.artist ||
    track?.createdBy || {
      _id: track?.uploaderId,
      id: track?.uploaderId,
      name: track?.description,
    }
  );
};

const CommentTrack = ({ comments = [], track, wavesurfer = null }: IProps) => {
  const router = useRouter();
  const hasMounted = useHasMounted();

  const [yourComment, setYourComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState<HTMLElement | null>(null);

  const { data: session } = useSession();
  const sessionAny = session as any;

  const accessToken =
    sessionAny?.access_token ||
    sessionAny?.accessToken ||
    sessionAny?.user?.access_token ||
    sessionAny?.user?.accessToken ||
    "";

  const isLoggedIn = Boolean(accessToken || session?.user);
  const openEmojiPicker = Boolean(emojiAnchorEl);

  const commentEmojis = [
    "🔥",
    "😍",
    "😂",
    "🎧",
    "❤️",
    "👏",
    "😮",
    "💯",
    "😎",
    "🥹",
    "🤯",
    "🙌",
    "💥",
    "🎵",
    "🎶",
    "🖤",
  ];

  const trackId = getTrackId(track);

  const uploader = getTrackUploader(track);
  const uploaderName = getUserName(uploader);
  const uploaderEmail = getUserEmail(uploader);
  const uploaderAvatarUrl = getUserAvatarUrl(uploader);
  const uploaderHref = getUserHref(uploader);
  const canOpenUploaderProfile = uploaderHref !== "#";
  const uploaderIsArtist = isArtist(uploader);

  const handleOpenEmojiPicker = (event: MouseEvent<HTMLElement>) => {
    setEmojiAnchorEl(event.currentTarget);
  };

  const handleCloseEmojiPicker = () => {
    setEmojiAnchorEl(null);
  };

  const handleAddEmoji = (emoji: string) => {
    setYourComment((prev) => `${prev}${emoji}`);
    handleCloseEmojiPicker();
  };

  const handleSubmit = async () => {
    if (!yourComment.trim()) return;
    if (!trackId) return;

    if (!accessToken) {
      console.log("Missing access token in session:", session);
      return;
    }

    try {
      setSubmitting(true);

      const res = await sendRequest<IBackendRes<ITrackComment>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/${trackId}/comments`,
        method: "POST",
        body: {
          content: yourComment.trim(),
          moment: Math.round(wavesurfer?.getCurrentTime() ?? 0),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res.data) {
        setYourComment("");

        await sendRequest<IBackendRes<any>>({
          url: `/api/revalidate`,
          method: "POST",
          queryParams: {
            tag: "track-comment",
            secret: "justArandomString",
          },
        });

        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        mt: 6,
        pb: 6,
        color: "#ffffff",
      }}
    >
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <ChatBubbleRoundedIcon sx={{ color: "#ff5500", fontSize: 22 }} />

        <Typography
          sx={{
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 900,
          }}
        >
          Comments
        </Typography>

        <Typography
          sx={{
            color: "#8f8f8f",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {comments.length}
        </Typography>
      </Box>

      {isLoggedIn && (
        <Box
          sx={{
            mb: 4,
            p: 2,
            borderRadius: 3,
            backgroundColor: "#111314",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-end",
              gap: 1.2,
            }}
          >
            <TextField
              value={yourComment}
              onChange={(e) => setYourComment(e.target.value)}
              fullWidth
              placeholder="Write a comment..."
              variant="standard"
              multiline
              maxRows={4}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              sx={{
                "& .MuiInputBase-root": {
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                },

                "& .MuiInputBase-input::placeholder": {
                  color: "#8f8f8f",
                  opacity: 1,
                },

                "& .MuiInput-underline:before": {
                  borderBottomColor: "rgba(255,255,255,0.12)",
                },

                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "rgba(255,255,255,0.28)",
                },

                "& .MuiInput-underline:after": {
                  borderBottomColor: "#ff5500",
                },
              }}
            />

            <Tooltip title="Add emoji">
              <IconButton
                onClick={handleOpenEmojiPicker}
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2,
                  color: openEmojiPicker ? "#ff5500" : "#cfcfcf",
                  backgroundColor: openEmojiPicker
                    ? "rgba(255,85,0,0.16)"
                    : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  flexShrink: 0,
                  "&:hover": {
                    color: "#ff5500",
                    backgroundColor: "rgba(255,85,0,0.18)",
                    borderColor: "rgba(255,85,0,0.35)",
                  },
                }}
              >
                <AddReactionRoundedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Button
              onClick={handleSubmit}
              disabled={!yourComment.trim() || submitting}
              variant="contained"
              sx={{
                minWidth: 44,
                width: 44,
                height: 38,
                borderRadius: 2,
                backgroundColor: "#ff5500",
                color: "#ffffff",
                boxShadow: "none",
                flexShrink: 0,
                "&:hover": {
                  backgroundColor: "#ff6a1f",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "#6f6f6f",
                },
              }}
            >
              <SendRoundedIcon sx={{ fontSize: 18 }} />
            </Button>
          </Box>

          <Popover
            open={openEmojiPicker}
            anchorEl={emojiAnchorEl}
            onClose={handleCloseEmojiPicker}
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "center",
            }}
            PaperProps={{
              sx: {
                mt: -1,
                p: 1,
                width: 214,
                borderRadius: 3,
                backgroundColor: "#181A1B",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
              },
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 0.6,
              }}
            >
              {commentEmojis.map((emoji) => (
                <IconButton
                  key={emoji}
                  onClick={() => handleAddEmoji(emoji)}
                  sx={{
                    width: 44,
                    height: 40,
                    borderRadius: 2,
                    fontSize: 20,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    "&:hover": {
                      backgroundColor: "rgba(255,85,0,0.18)",
                      borderColor: "rgba(255,85,0,0.35)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Popover>
        </Box>
      )}

      {!isLoggedIn && (
        <Box
          sx={{
            mb: 4,
            p: 2.2,
            borderRadius: 3,
            backgroundColor: "#111314",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#9a9a9a",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Login to write a comment.
        </Box>
      )}

      <Box
        sx={{
          display: "flex",
          gap: 3,
          alignItems: "flex-start",
        }}
      >
        <Box
          sx={{
            width: 190,
            flexShrink: 0,
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            alignItems: "center",
            position: "sticky",
            top: 90,
            p: 2,
            borderRadius: 4,
            background:
              "linear-gradient(180deg, rgba(255,85,0,0.08), rgba(255,255,255,0.025))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box
            component={Link}
            href={uploaderHref}
            onClick={(event) => {
              if (!canOpenUploaderProfile) {
                event.preventDefault();
              }
            }}
            sx={{
              textDecoration: "none",
              cursor: canOpenUploaderProfile ? "pointer" : "default",
            }}
          >
            <Avatar
              src={uploaderAvatarUrl}
              alt={uploaderName}
              sx={{
                width: 132,
                height: 132,
                bgcolor: "#ff5500",
                color: "#ffffff",
                fontSize: 38,
                fontWeight: 900,
                cursor: canOpenUploaderProfile ? "pointer" : "default",
                border: "3px solid rgba(255,85,0,0.45)",
                boxShadow: "0 0 34px rgba(255,85,0,0.18)",
                mb: 1.5,
                transition: "0.2s ease",
                "&:hover": canOpenUploaderProfile
                  ? {
                      transform: "scale(1.035)",
                      boxShadow: "0 0 42px rgba(255,85,0,0.28)",
                    }
                  : {},
              }}
            >
              {getInitials(uploaderName, uploaderEmail)}
            </Avatar>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              width: 150,
              justifyContent: "center",
            }}
          >
            <Typography
              component={Link}
              href={uploaderHref}
              onClick={(event) => {
                if (!canOpenUploaderProfile) {
                  event.preventDefault();
                }
              }}
              title={uploaderName}
              sx={{
                color: "#ffffff",
                fontSize: 15,
                fontWeight: 900,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "center",
                textDecoration: "none",
                cursor: canOpenUploaderProfile ? "pointer" : "default",
                "&:hover": canOpenUploaderProfile
                  ? {
                      color: "#ff5500",
                    }
                  : {},
              }}
            >
              {uploaderName}
            </Typography>

            {uploaderIsArtist && (
              <VerifiedRoundedIcon
                sx={{
                  fontSize: 16,
                  color: "#4da3ff",
                  flexShrink: 0,
                }}
              />
            )}
          </Box>

          {uploaderEmail && (
            <Typography
              title={uploaderEmail}
              sx={{
                width: 150,
                color: "#9a9a9a",
                fontSize: 12,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                textAlign: "center",
                mt: 0.5,
              }}
            >
              {uploaderEmail}
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            borderRadius: 4,
            backgroundColor: "#101213",
            border: "1px solid rgba(255,255,255,0.07)",
            overflow: "hidden",
          }}
        >
          {comments?.length ? (
            comments.map((comment) => {
              const user = getCommentUser(comment);
              const commentName = getUserName(user);
              const commentEmail = getUserEmail(user);
              const commentAvatarUrl = getUserAvatarUrl(user);
              const commentUserHref = getUserHref(user);
              const canOpenCommentProfile = commentUserHref !== "#";
              const commentUserIsArtist = isArtist(user);

              return (
                <Box
                  key={comment._id || (comment as any).id}
                  sx={{
                    display: "flex",
                    gap: 1.4,
                    alignItems: "flex-start",
                    minWidth: 0,
                    py: 1.8,
                    px: { xs: 1.4, md: 2 },
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    transition: "0.18s ease",

                    "&:last-of-type": {
                      borderBottom: "none",
                    },

                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.035)",
                    },
                  }}
                >
                  <Box
                    component={Link}
                    href={commentUserHref}
                    onClick={(event) => {
                      if (!canOpenCommentProfile) {
                        event.preventDefault();
                      }
                    }}
                    sx={{
                      textDecoration: "none",
                      flexShrink: 0,
                      cursor: canOpenCommentProfile ? "pointer" : "default",
                    }}
                  >
                    <Avatar
                      src={commentAvatarUrl}
                      alt={commentName}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: "#ff5500",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 900,
                        border: "1px solid rgba(255,255,255,0.14)",
                        cursor: canOpenCommentProfile ? "pointer" : "default",
                      }}
                    >
                      {getInitials(commentName, commentEmail)}
                    </Avatar>
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.7,
                        flexWrap: "wrap",
                        mb: 0.5,
                      }}
                    >
                      <Typography
                        component={Link}
                        href={commentUserHref}
                        onClick={(event) => {
                          if (!canOpenCommentProfile) {
                            event.preventDefault();
                          }
                        }}
                        title={commentName}
                        sx={{
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 900,
                          lineHeight: 1.4,
                          textDecoration: "none",
                          cursor: canOpenCommentProfile ? "pointer" : "default",
                          "&:hover": canOpenCommentProfile
                            ? {
                                color: "#ff5500",
                              }
                            : {},
                        }}
                      >
                        {commentName}
                      </Typography>

                      {commentUserIsArtist && (
                        <VerifiedRoundedIcon
                          sx={{
                            fontSize: 15,
                            color: "#4da3ff",
                            flexShrink: 0,
                          }}
                        />
                      )}

                      {hasMounted && comment.createdAt && (
                        <Typography
                          sx={{
                            color: "#8f8f8f",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {dayjs(comment.createdAt).fromNow()}
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      sx={{
                        color: "#d6d6d6",
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 1.55,
                        wordBreak: "break-word",
                      }}
                    >
                      {(comment as any).content ||
                        (comment as any).comment ||
                        ""}
                    </Typography>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                py: 6,
                px: 2,
                textAlign: "center",
                color: "#8f8f8f",
                backgroundColor: "#111314",
                fontWeight: 800,
              }}
            >
              No comments yet.
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CommentTrack;
