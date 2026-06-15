"use client";

import { fetchDefaultImages, sendRequest } from "@/utils/api";
import { Box, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import WaveSurfer from "wavesurfer.js";
import relativeTime from "dayjs/plugin/relativeTime";
import { useHasMounted } from "@/utils/customHook";
import Image from "next/image";

dayjs.extend(relativeTime);

interface IProps {
  comments: ITrackComment[];
  track: ITrackTop | null;
  wavesurfer: WaveSurfer | null;
}

const CommentTrack = (props: IProps) => {
  const router = useRouter();
  const hasMounted = useHasMounted();

  const { comments, track, wavesurfer } = props;
  const [yourComment, setYourComment] = useState("");
  const { data: session } = useSession();

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secondsRemainder = Math.round(seconds) % 60;
    const paddedSeconds = `0${secondsRemainder}`.slice(-2);
    return `${minutes}:${paddedSeconds}`;
  };

  const handleSubmit = async () => {
    if (!yourComment.trim()) return;

    const res = await sendRequest<IBackendRes<ITrackComment>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/comments`,
      method: "POST",
      body: {
        content: yourComment,
        moment: Math.round(wavesurfer?.getCurrentTime() ?? 0),
        track: track?._id,
      },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
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

  const handleJumpTrack = (moment: number) => {
    if (wavesurfer) {
      const duration = wavesurfer.getDuration();
      wavesurfer.seekTo(moment / duration);
      wavesurfer.play();
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
      {/* Comment input */}
      <Box sx={{ mb: 4 }}>
        {session?.user && (
          <TextField
            value={yourComment}
            onChange={(e) => setYourComment(e.target.value)}
            fullWidth
            label="Comments"
            variant="standard"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSubmit();
              }
            }}
            sx={{
              input: {
                color: "#ffffff",
                fontSize: 14,
              },

              label: {
                color: "#8f8f8f",
                fontWeight: 600,
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
        {/* Left user */}
        <Box
          sx={{
            width: 190,
            flexShrink: 0,
            display: { xs: "none", md: "block" },
          }}
        >
          <Box
            sx={{
              width: 150,
              height: 150,
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid rgba(255,85,0,0.45)",
              boxShadow: "0 0 30px rgba(255,85,0,0.14)",
              backgroundColor: "#111",
              mb: 1.5,
            }}
          >
            <Image
              alt="avatar comment"
              src={fetchDefaultImages(track?.uploader?.type!)}
              height={150}
              width={150}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
            />
          </Box>

          <Typography
            title={track?.uploader?.email}
            sx={{
              width: 150,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}
          >
            {track?.uploader?.email}
          </Typography>
        </Box>

        {/* Right comments */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          {comments?.length ? (
            comments.map((comment) => {
              return (
                <Box
                  key={comment._id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    py: 1.4,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",

                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.025)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.4,
                      alignItems: "flex-start",
                      minWidth: 0,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <Image
                        alt="comments"
                        width={40}
                        height={40}
                        src={fetchDefaultImages(comment.user.type)}
                        style={{
                          objectFit: "cover",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    </Box>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          color: "#ffffff",
                          fontSize: 13,
                          fontWeight: 800,
                          lineHeight: 1.4,
                        }}
                      >
                        {comment?.user?.name ?? comment?.user?.email}{" "}
                        <Box
                          component="span"
                          sx={{
                            color: "#9b9b9b",
                            fontWeight: 600,
                          }}
                        >
                          at
                        </Box>{" "}
                        <Box
                          component="span"
                          onClick={() => handleJumpTrack(comment.moment)}
                          sx={{
                            color: "#ff5500",
                            cursor: "pointer",
                            fontWeight: 900,

                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {formatTime(comment.moment)}
                        </Box>
                      </Typography>

                      <Typography
                        sx={{
                          color: "#e7e7e7",
                          fontSize: 14,
                          lineHeight: 1.5,
                          mt: 0.5,
                          wordBreak: "break-word",
                        }}
                      >
                        {comment.content}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      color: "#8f8f8f",
                      fontSize: 12,
                      whiteSpace: "nowrap",
                      pt: 0.3,
                    }}
                  >
                    {hasMounted && dayjs(comment.createdAt).fromNow()}
                  </Typography>
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
              }}
            >
              Chưa có bình luận nào.
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default CommentTrack;
