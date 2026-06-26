"use client";

import { sendRequest } from "@/utils/api";
import { Avatar, Box, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import WaveSurfer from "wavesurfer.js";
import relativeTime from "dayjs/plugin/relativeTime";
import { useHasMounted } from "@/utils/customHook";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getAvatar";

dayjs.extend(relativeTime);

interface IProps {
  track: ITrackTop | null;
  comments?: ITrackComment[];
  wavesurfer?: WaveSurfer | null;
}

const getTrackId = (track?: any) => {
  return track?._id || track?.id || "";
};

const getUserName = (user?: any) => {
  if (!user) return "User";

  if (typeof user === "string") {
    return user.includes("@") ? user.split("@")[0] : user;
  }

  const name =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    user?.username ||
    user?.email ||
    "";

  const cleanName = String(name).trim();

  const isBadName =
    !cleanName ||
    cleanName.toLowerCase() === "user" ||
    cleanName.toLowerCase() === "social user" ||
    cleanName.toLowerCase() === "unknown";

  if (isBadName) return "User";

  if (cleanName.includes("@")) {
    return cleanName.split("@")[0];
  }

  return cleanName;
};

const getUserEmail = (user?: any) => {
  if (!user || typeof user === "string") return "";

  return user?.email || user?.username || "";
};

const getCommentUser = (comment?: any) => {
  return (
    comment?.user ||
    comment?.createdBy ||
    comment?.author ||
    comment?.created_by ||
    comment?.userInfo ||
    comment?.account ||
    comment?.owner || {
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
      avatar: comment?.userAvatar || comment?.avatar || comment?.avatarUrl,
    }
  );
};

const getTrackUploader = (track?: any) => {
  return (
    track?.uploader || track?.user || track?.artist || track?.createdBy || null
  );
};

const CommentTrack = (props: IProps) => {
  const router = useRouter();
  const hasMounted = useHasMounted();

  const { comments = [], track, wavesurfer = null } = props;
  const [yourComment, setYourComment] = useState("");
  const { data: session } = useSession();

  const sessionAny = session as any;

  const accessToken =
    sessionAny?.access_token ||
    sessionAny?.accessToken ||
    sessionAny?.user?.access_token ||
    sessionAny?.user?.accessToken ||
    "";

  const isLoggedIn = Boolean(accessToken || session?.user);

  const trackId = getTrackId(track);

  const uploader = getTrackUploader(track);
  const uploaderName = getUserName(uploader);
  const uploaderEmail = getUserEmail(uploader);
  const uploaderAvatarUrl = getUserAvatarUrl(uploader);

  const handleSubmit = async () => {
    if (!yourComment.trim()) return;
    if (!trackId) return;

    if (!accessToken) {
      console.log("Missing access token in session:", session);
      return;
    }

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
  };

  return (
    <Box
      sx={{
        mt: 6,
        pb: 10,
        color: "#ffffff",
      }}
    >
      <Box sx={{ mb: 4 }}>
        {isLoggedIn && (
          <TextField
            value={yourComment}
            onChange={(e) => setYourComment(e.target.value)}
            fullWidth
            label="Comments"
            placeholder="Write a comment..."
            variant="standard"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            sx={{
              input: {
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 700,
              },

              label: {
                color: "#8f8f8f",
                fontWeight: 700,
              },

              "& label.Mui-focused": {
                color: "#ff5500",
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
        )}
      </Box>

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
          }}
        >
          <Avatar
            src={uploaderAvatarUrl}
            alt={uploaderName}
            sx={{
              width: 150,
              height: 150,
              bgcolor: "#ff5500",
              color: "#ffffff",
              fontSize: 42,
              fontWeight: 900,
              border: "3px solid rgba(255,85,0,0.45)",
              boxShadow: "0 0 34px rgba(255,85,0,0.2)",
              mb: 1.5,
            }}
          >
            {getInitials(uploaderName, uploaderEmail)}
          </Avatar>

          <Typography
            title={uploaderName}
            sx={{
              width: 150,
              color: "#ffffff",
              fontSize: 15,
              fontWeight: 900,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {uploaderName}
          </Typography>

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
                mt: 0.4,
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
          }}
        >
          {comments?.length ? (
            comments.map((comment) => {
              const user = getCommentUser(comment);
              const commentName = getUserName(user);
              const commentEmail = getUserEmail(user);
              const commentAvatarUrl = getUserAvatarUrl(user);

              return (
                <Box
                  key={comment._id || (comment as any).id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    py: 1.6,
                    px: 1.2,
                    borderBottom: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 2,
                    transition: "0.18s ease",

                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.035)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.4,
                      alignItems: "flex-start",
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Avatar
                      src={commentAvatarUrl}
                      alt={commentName}
                      sx={{
                        width: 42,
                        height: 42,
                        bgcolor: "#ff5500",
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 900,
                        flexShrink: 0,
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {getInitials(commentName, commentEmail)}
                    </Avatar>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                          flexWrap: "wrap",
                          mb: 0.4,
                        }}
                      >
                        <Typography
                          title={commentName}
                          sx={{
                            color: "#ffffff",
                            fontSize: 13,
                            fontWeight: 900,
                            lineHeight: 1.4,
                          }}
                        >
                          {commentName}
                        </Typography>

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
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {(comment as any).content ||
                          (comment as any).comment ||
                          ""}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box
              sx={{
                py: 4,
                textAlign: "center",
                color: "#8f8f8f",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 2,
                backgroundColor: "#111314",
                fontWeight: 700,
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
