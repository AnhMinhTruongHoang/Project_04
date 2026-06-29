"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";
import { Settings } from "react-slick";
import { Box } from "@mui/material";
import Button from "@mui/material/Button/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Divider from "@mui/material/Divider";
import Link from "next/link";
import Image from "next/image";
import { convertSlugUrl } from "@/utils/api";
import { getUserHref } from "@/utils/actions/navigation";

interface IProps {
  data: ITrackTop[];
  title: string;
}

const MainSlider = (props: IProps) => {
  const { data = [], title } = props;

  const totalItems = data.length;
  const shouldUseSlider = totalItems > 5;

  const getTrackId = (track: ITrackTop) => {
    return (track as any)._id || (track as any).id;
  };

  const getImageUrl = (imgUrl?: string) => {
    if (!imgUrl) return "/default.png";

    if (imgUrl.startsWith("http")) {
      return imgUrl;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/images/${imgUrl}`;
  };

  const getAudioUrl = (trackUrl?: string) => {
    if (!trackUrl) return "";

    if (trackUrl.startsWith("http")) {
      return trackUrl;
    }

    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/audio/${trackUrl}`;
  };

  const NextArrow = (props: any) => {
    return (
      <Button
        color="inherit"
        variant="contained"
        onClick={props.onClick}
        sx={{
          position: "absolute",
          right: 25,
          top: "25%",
          zIndex: 2,
          minWidth: 30,
          width: 35,
          borderRadius: 5,
          backgroundColor: "black",
          "&:hover": {
            backgroundColor: "#222",
          },
        }}
      >
        <ChevronRightIcon />
      </Button>
    );
  };

  const PrevArrow = (props: any) => {
    return (
      <Button
        color="inherit"
        variant="contained"
        onClick={props.onClick}
        sx={{
          position: "absolute",
          left: 0,
          top: "25%",
          zIndex: 2,
          minWidth: 30,
          width: 35,
          borderRadius: 5,
          backgroundColor: "black",
          "&:hover": {
            backgroundColor: "#222",
          },
        }}
      >
        <ChevronLeftIcon />
      </Button>
    );
  };

  const settings: Settings = {
    infinite: true,
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
          infinite: true,
          dots: false,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
    ],
  };

  const renderTrackItem = (track: ITrackTop) => {
    const trackId = getTrackId(track);
    const audioUrl = getAudioUrl(track.trackUrl);

    const trackSlug =
      (track as any).slug || `${convertSlugUrl(track.title)}-${trackId}`;

    if (!trackSlug) return null;

    const trackHref = `/track/${trackSlug}.html?audio=${encodeURIComponent(
      audioUrl
    )}`;

    const profileHref = getUserHref((track as any).uploader);
    const canOpenProfile = profileHref !== "#";

    return (
      <div className="track" key={trackId || trackSlug}>
        <Link
          href={trackHref}
          style={{
            position: "relative",
            display: "block",
            height: "150px",
            width: "150px",
            textDecoration: "none",
            color: "unset",
          }}
        >
          <Image
            alt={track.title || "track image"}
            src={getImageUrl(track.imgUrl)}
            fill
            style={{
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        </Link>

        <Link
          style={{
            textDecoration: "none",
            color: "unset",
            fontSize: "14px",
          }}
          href={trackHref}
        >
          <div
            style={{
              margin: "12px 0 10px 0",
              fontWeight: 600,
              width: 150,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={track.title}
          >
            {track.title}
          </div>
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
            marginBottom: "7px",
            color: "#ccc",
            fontSize: "13px",
            width: 150,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            textDecoration: "none",
            cursor: canOpenProfile ? "pointer" : "default",
          }}
          title={track.description}
        >
          {track.description}
        </Link>
      </div>
    );
  };

  return (
    <Box
      sx={{
        margin: "0 50px 28px 50px",

        ".track": {
          padding: "0 10px",
          width: 170,
        },

        ".slick-track": {
          marginLeft: 0,
        },

        ".slick-slide": {
          width: "170px !important",
        },
      }}
    >
      <h2>{title}</h2>

      {totalItems === 0 ? (
        <Box
          sx={{
            color: "#aaa",
            py: 2,
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
            gap: "38px",
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}
        >
          {data.map((track) => renderTrackItem(track))}
        </Box>
      )}

      <Divider sx={{ mt: 3, borderColor: "#222" }} />
    </Box>
  );
};

export default MainSlider;
