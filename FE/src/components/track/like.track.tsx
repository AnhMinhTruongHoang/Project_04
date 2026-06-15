"use client";
import Chip from "@mui/material/Chip";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useEffect, useState } from "react";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { handleLikeTrackAction } from "@/utils/actions/actions";
import { Box } from "@mui/material";

interface IProps {
  track: ITrackTop | null;
}
const LikeTrack = (props: IProps) => {
  const { track } = props;
  const { data: session } = useSession();
  const router = useRouter();

  const [trackLikes, setTrackLikes] = useState<ITrackLike[] | null>(null);

  const fetchData = async () => {
    if (session?.access_token) {
      const res2 = await sendRequest<IBackendRes<IModelPaginate<ITrackLike>>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/likes`,
        method: "GET",
        queryParams: {
          current: 1,
          pageSize: 100,
          sort: "-createdAt",
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (res2?.data?.result) setTrackLikes(res2?.data?.result);
    }
  };
  useEffect(() => {
    fetchData();
  }, [session]);

  const handleLikeTrack = async () => {
    const id = track?._id;
    const quantity = trackLikes?.some((t) => t._id === track?._id) ? -1 : 1;
    await handleLikeTrackAction(id, quantity);
    fetchData();
    router.refresh();
  };
  return (
    <Box
      sx={{
        mt: 2.5,
        mx: 1,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#ffffff",
      }}
    >
      <Chip
        onClick={() => handleLikeTrack()}
        size="medium"
        variant="outlined"
        clickable
        icon={<FavoriteIcon />}
        label="Like"
        sx={{
          height: 34,
          borderRadius: "5px",
          color: trackLikes?.some((t) => t._id === track?._id)
            ? "#ff5500"
            : "#cfcfcf",
          borderColor: trackLikes?.some((t) => t._id === track?._id)
            ? "#ff5500"
            : "rgba(255,255,255,0.22)",
          backgroundColor: trackLikes?.some((t) => t._id === track?._id)
            ? "rgba(255,85,0,0.08)"
            : "transparent",
          fontWeight: 800,

          "& .MuiChip-icon": {
            color: trackLikes?.some((t) => t._id === track?._id)
              ? "#ff5500"
              : "#9a9a9a",
          },

          "&:hover": {
            backgroundColor: trackLikes?.some((t) => t._id === track?._id)
              ? "rgba(255,85,0,0.14)"
              : "rgba(255,255,255,0.06)",
            borderColor: trackLikes?.some((t) => t._id === track?._id)
              ? "#ff5500"
              : "rgba(255,255,255,0.35)",
          },
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2.2,
          color: "#9a9a9a",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <Box
          component="span"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.4,
          }}
        >
          <PlayArrowIcon sx={{ fontSize: 20, color: "#9a9a9a" }} />
          {track?.countPlay}
        </Box>

        <Box
          component="span"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.4,
          }}
        >
          <FavoriteIcon sx={{ fontSize: 18, color: "#9a9a9a" }} />
          {track?.countLike}
        </Box>
      </Box>
    </Box>
  );
};

export default LikeTrack;
