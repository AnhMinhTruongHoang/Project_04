"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";
import type { Settings } from "react-slick";

import { Box, Button, Divider } from "@mui/material";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import Link from "next/link";
import Image from "next/image";

import { getUserHref } from "@/utils/actions/navigation";

interface IProps {
  data: ITrackTop[];
  title: string;
}

const MainSlider = ({ data = [], title }: IProps) => {
  const totalItems = data.length;
  const shouldUseSlider = totalItems > 5;

  const getTrackRouteKey = (track: ITrackTop) => {
    const slug = String(track.slug || "").trim();

    if (slug) {
      return slug;
    }

    const id = String(track.id || "").trim();

    if (id) {
      return id;
    }

    return String(track._id || "").trim();
  };

  const getTrackId = (track: ITrackTop) => {
    return String(track.id || track._id || track.slug || "").trim();
  };

  const getImageUrl = (imgUrl?: string | null) => {
    if (!imgUrl) {
      return "/default.png";
    }

    if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
      return imgUrl;
    }

    if (imgUrl.startsWith("/uploads/images/")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${imgUrl}`;
    }

    if (imgUrl.startsWith("/")) {
      return imgUrl;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/images/${imgUrl}`;
  };

  const getAudioUrl = (trackUrl?: string | null) => {
    if (!trackUrl) {
      return "";
    }

    if (trackUrl.startsWith("http://") || trackUrl.startsWith("https://")) {
      return trackUrl;
    }

    if (trackUrl.startsWith("/uploads/audio/")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${trackUrl}`;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/audio/${trackUrl}`;
  };

  const NextArrow = (arrowProps: any) => {
    return (
      <Button
        color="inherit"
        variant="contained"
        aria-label="Next tracks"
        onClick={arrowProps.onClick}
        sx={{
          position: "absolute",
          right: 25,
          top: "25%",
          zIndex: 2,
          minWidth: 35,
          width: 35,
          height: 35,
          borderRadius: "50%",
          color: "#ffffff",
          backgroundColor: "#111111",

          "&:hover": {
            backgroundColor: "#292929",
          },
        }}
      >
        <ChevronRightIcon />
      </Button>
    );
  };

  const PrevArrow = (arrowProps: any) => {
    return (
      <Button
        color="inherit"
        variant="contained"
        aria-label="Previous tracks"
        onClick={arrowProps.onClick}
        sx={{
          position: "absolute",
          left: 0,
          top: "25%",
          zIndex: 2,
          minWidth: 35,
          width: 35,
          height: 35,
          borderRadius: "50%",
          color: "#ffffff",
          backgroundColor: "#111111",

          "&:hover": {
            backgroundColor: "#292929",
          },
        }}
      >
        <ChevronLeftIcon />
      </Button>
    );
  };

  const settings: Settings = {
    infinite: totalItems > 5,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,

    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: totalItems > 3,
          dots: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: totalItems > 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: totalItems > 1,
        },
      },
    ],
  };

  const renderTrackItem = (track: ITrackTop) => {
    const trackId = getTrackId(track);
    const trackRouteKey = getTrackRouteKey(track);

    if (!trackRouteKey) {
      return null;
    }

    const audioUrl = getAudioUrl(track.trackUrl);

    const queryParams = new URLSearchParams();

    if (audioUrl) {
      queryParams.set("audio", audioUrl);
    }

    queryParams.set("autoplay", "1");

    const trackHref = `/track/${encodeURIComponent(
      trackRouteKey
    )}.html?${queryParams.toString()}`;

    const profileHref = getUserHref(track.uploader);

    const canOpenProfile = profileHref !== "#";

    return (
      <Box className="track" key={trackId || trackRouteKey}>
        <Link
          href={trackHref}
          style={{
            position: "relative",
            display: "block",
            width: "150px",
            height: "150px",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <Image
            alt={track.title || "Track image"}
            src={getImageUrl(track.imgUrl)}
            fill
            sizes="150px"
            style={{
              objectFit: "cover",
              borderRadius: 6,
            }}
          />
        </Link>

        <Link
          href={trackHref}
          style={{
            color: "inherit",
            fontSize: "14px",
            textDecoration: "none",
          }}
        >
          <Box
            component="div"
            title={track.title}
            sx={{
              width: 150,
              mt: 1.5,
              mb: 1,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",

              "&:hover": {
                color: "#ff7a2f",
              },
            }}
          >
            {track.title}
          </Box>
        </Link>

        <Link
          href={profileHref}
          onClick={(event) => {
            if (!canOpenProfile) {
              event.preventDefault();
            }
          }}
          style={{
            display: "block",
            width: "150px",
            marginBottom: "7px",
            color: "#a9a9a9",
            fontSize: "13px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: "none",
            cursor: canOpenProfile ? "pointer" : "default",
          }}
          title={track.uploader?.name || track.description || ""}
        >
          {track.uploader?.name || track.description || "Unknown uploader"}
        </Link>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        margin: "0 50px 28px",

        ".track": {
          width: 170,
          padding: "0 10px",
        },

        ".slick-track": {
          marginLeft: 0,
        },

        ".slick-slide": {
          width: "170px !important",
        },

        ".slick-disabled": {
          opacity: 0.35,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        component="h2"
        sx={{
          color: "#ffffff",
          fontSize: 22,
          fontWeight: 900,
          mb: 2,
        }}
      >
        {title}
      </Box>

      {totalItems === 0 ? (
        <Box
          sx={{
            py: 2,
            color: "#aaaaaa",
            fontSize: 14,
          }}
        >
          No tracks found
        </Box>
      ) : shouldUseSlider ? (
        <Slider {...settings}>
          {data.map((track) => renderTrackItem(track))}
        </Slider>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: "38px",
          }}
        >
          {data.map((track) => renderTrackItem(track))}
        </Box>
      )}

      <Divider
        sx={{
          mt: 3,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      />
    </Box>
  );
};

export default MainSlider;
