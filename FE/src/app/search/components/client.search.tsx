"use client";

import { convertSlugUrl, sendRequest } from "@/utils/api";
import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import { Typography } from "@mui/material";

type Props = {
  query?: string;
};

const DEFAULT_IMAGE = "/audio/SC.png";

const getTrackImage = (imgUrl?: string) => {
  if (!imgUrl) return DEFAULT_IMAGE;

  if (imgUrl.startsWith("http")) return imgUrl;

  if (imgUrl.startsWith("/")) return imgUrl;

  return `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/${imgUrl}`;
};

const ClientSearch = ({ query = "" }: Props) => {
  const [tracks, setTracks] = useState<ITrackTop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (keyword: string) => {
    try {
      setLoading(true);

      const res = await sendRequest<IBackendRes<IModelPaginate<ITrackTop>>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/tracks/search`,
        method: "POST",
        body: {
          current: 1,
          pageSize: 10,
          title: keyword,
        },
      });

      setTracks(res?.data?.result ?? []);
    } catch (error) {
      console.log("SEARCH TRACK ERROR:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = query
      ? `"${query}" trên SoundCloud Clone`
      : "Tìm kiếm - SoundCloud Clone";

    if (query) {
      fetchData(query);
    } else {
      setTracks([]);
    }
  }, [query]);

  if (!query) {
    return <div>Vui lòng nhập từ khóa tìm kiếm</div>;
  }

  if (loading) {
    return <div>Đang tìm kiếm...</div>;
  }

  if (!tracks.length) {
    return <div>Không tồn tại kết quả tìm kiếm</div>;
  }

  return (
    <Box>
      <div>
        Kết quả tìm kiếm cho từ khóa: <b>{query}</b>
      </div>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {tracks.map((track) => {
          const imageSrc = getTrackImage(track?.imgUrl);

          return (
            <div key={track._id}>
              <Box sx={{ display: "flex", width: "100%", gap: "20px" }}>
                <img
                  src={imageSrc}
                  alt="avatar track"
                  height={50}
                  width={50}
                  style={{
                    borderRadius: "3px",
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_IMAGE;
                  }}
                />

                <Typography sx={{ py: 2 }}>
                  <Link
                    style={{ textDecoration: "none", color: "unset" }}
                    href={`/track/${convertSlugUrl(track.title)}-${
                      track._id
                    }.html?audio=${track.trackUrl || "/audio/DemoS.mp3"}`}
                  >
                    {track.title}
                  </Link>
                </Typography>
              </Box>
            </div>
          );
        })}
      </Box>
    </Box>
  );
};

export default ClientSearch;