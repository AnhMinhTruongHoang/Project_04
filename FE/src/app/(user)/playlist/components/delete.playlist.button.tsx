"use client";

import { MouseEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import { deletePlaylistApi, revalidateApi } from "@/utils/api";
import { useToast } from "@/utils/toast";

interface Props {
  playlistId: string;
  playlistTitle?: string;
}

const DeletePlaylistButton = ({ playlistId, playlistTitle }: Props) => {
  const router = useRouter();
  const toast = useToast();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token;

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (loading) return;

    if (!accessToken) {
      toast.error("Please login first.");
      return;
    }

    if (!playlistId) {
      toast.error("Playlist not found.");
      return;
    }

    const accepted = window.confirm(
      `Delete playlist "${playlistTitle || "Untitled playlist"}"?`
    );

    if (!accepted) return;

    try {
      setLoading(true);

      const response = await deletePlaylistApi(playlistId, accessToken);

      const statusCode = Number(response?.statusCode || 200);

      if (response?.error || statusCode >= 400) {
        toast.error(response?.message || "Delete playlist failed.");
        return;
      }

      await revalidateApi("playlist-by-user");

      toast.success("Playlist deleted.");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Delete playlist failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Delete playlist">
      <span>
        <IconButton
          disabled={loading}
          onClick={handleDelete}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          sx={{
            width: 36,
            height: 36,
            color: "#b8b8b8",
            border: "1px solid rgba(255,255,255,0.1)",

            "&:hover": {
              color: "#ff4d4f",
              borderColor: "rgba(255,77,79,0.45)",
              backgroundColor: "rgba(255,77,79,0.1)",
            },

            "&.Mui-disabled": {
              color: "#666666",
            },
          }}
        >
          {loading ? (
            <CircularProgress size={18} sx={{ color: "#ff5500" }} />
          ) : (
            <DeleteOutlineRoundedIcon fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default DeletePlaylistButton;
