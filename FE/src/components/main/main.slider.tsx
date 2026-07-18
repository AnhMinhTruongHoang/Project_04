"use client";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Slider from "react-slick";

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

  /* ========================================
     TRACK HELPERS
  ======================================== */

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

  /* ========================================
     NEXT ARROW - DESKTOP ONLY
  ======================================== */

  const NextArrow = (arrowProps: any) => {
    return (
      <Button
        color="inherit"
        variant="contained"
        aria-label="Next tracks"
        onClick={arrowProps.onClick}
        sx={{
          display: {
            xs: "none",
            md: "flex",
          },

          position: "absolute",

          right: 8,
          top: 58,

          zIndex: 5,

          minWidth: 35,

          width: 35,
          height: 35,

          p: 0,

          alignItems: "center",
          justifyContent: "center",

          borderRadius: "50%",

          color: "#ffffff",

          backgroundColor: "rgba(17,17,17,0.94)",

          boxShadow: "0 5px 18px rgba(0,0,0,0.35)",

          "&:hover": {
            backgroundColor: "#292929",
          },
        }}
      >
        <ChevronRightIcon />
      </Button>
    );
  };

  /* ========================================
     PREVIOUS ARROW - DESKTOP ONLY
  ======================================== */

  const PrevArrow = (arrowProps: any) => {
    return (
      <Button
        color="inherit"
        variant="contained"
        aria-label="Previous tracks"
        onClick={arrowProps.onClick}
        sx={{
          display: {
            xs: "none",
            md: "flex",
          },

          position: "absolute",

          left: 0,
          top: 58,

          zIndex: 5,

          minWidth: 35,

          width: 35,
          height: 35,

          p: 0,

          alignItems: "center",
          justifyContent: "center",

          borderRadius: "50%",

          color: "#ffffff",

          backgroundColor: "rgba(17,17,17,0.94)",

          boxShadow: "0 5px 18px rgba(0,0,0,0.35)",

          "&:hover": {
            backgroundColor: "#292929",
          },
        }}
      >
        <ChevronLeftIcon />
      </Button>
    );
  };

  /* ========================================
     SLIDER SETTINGS
  ======================================== */

  const settings = {
    infinite: totalItems > 5,

    speed: 450,

    slidesToShow: 5,

    slidesToScroll: 1,

    nextArrow: <NextArrow />,

    prevArrow: <PrevArrow />,

    dots: false,

    arrows: true,

    swipe: true,

    swipeToSlide: true,

    touchMove: true,

    draggable: true,

    responsive: [
      {
        breakpoint: 1200,

        settings: {
          slidesToShow: 4,

          slidesToScroll: 1,

          infinite: totalItems > 4,
        },
      },

      {
        breakpoint: 900,

        settings: {
          slidesToShow: 3,

          slidesToScroll: 1,

          infinite: totalItems > 3,
        },
      },

      {
        breakpoint: 600,

        settings: {
          slidesToShow: 2.35,

          slidesToScroll: 1,

          infinite: false,

          arrows: false,

          swipe: true,

          swipeToSlide: true,

          touchMove: true,

          draggable: true,
        },
      },

      {
        breakpoint: 420,

        settings: {
          slidesToShow: 2.15,

          slidesToScroll: 1,

          infinite: false,

          arrows: false,

          swipe: true,

          swipeToSlide: true,

          touchMove: true,

          draggable: true,
        },
      },
    ],
  };

  /* ========================================
     TRACK ITEM
  ======================================== */

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
      <Box
        className="track"
        key={trackId || trackRouteKey}
        sx={{
          width: "100%",

          minWidth: 0,

          px: {
            xs: 0.6,
            sm: 0.75,
            md: 1,
          },
        }}
      >
        {/* TRACK COVER */}
        <Box
          component={Link}
          href={trackHref}
          sx={{
            position: "relative",

            display: "block",

            width: "100%",

            aspectRatio: "1 / 1",

            overflow: "hidden",

            color: "inherit",

            textDecoration: "none",

            borderRadius: {
              xs: "5px",
              md: "6px",
            },

            backgroundColor: "#111111",

            "& img": {
              transition: "transform 0.2s ease, opacity 0.2s ease",
            },

            "&:hover img": {
              transform: "scale(1.035)",

              opacity: 0.9,
            },
          }}
        >
          <Image
            alt={track.title || "Track image"}
            src={getImageUrl(track.imgUrl)}
            fill
            sizes="(max-width: 420px) 42vw, (max-width: 600px) 40vw, (max-width: 900px) 30vw, 150px"
            style={{
              objectFit: "cover",
            }}
          />
        </Box>

        {/* TRACK TITLE */}
        <Box
          component={Link}
          href={trackHref}
          title={track.title}
          sx={{
            display: "block",

            width: "100%",

            mt: {
              xs: 0.9,
              md: 1.4,
            },

            color: "#ffffff",

            fontSize: {
              xs: 12,
              sm: 12.5,
              md: 14,
            },

            lineHeight: {
              xs: "17px",
              md: "20px",
            },

            fontWeight: 800,

            whiteSpace: "nowrap",

            overflow: "hidden",

            textOverflow: "ellipsis",

            textDecoration: "none",

            "&:hover": {
              color: "#ff7a2f",
            },
          }}
        >
          {track.title}
        </Box>

        {/* ARTIST */}
        <Box
          component={Link}
          href={profileHref}
          onClick={(event) => {
            if (!canOpenProfile) {
              event.preventDefault();
            }
          }}
          title={track.uploader?.name || track.description || ""}
          sx={{
            display: "block",

            width: "100%",

            mt: 0.3,

            mb: {
              xs: 0.5,
              md: 0.8,
            },

            color: "#a9a9a9",

            fontSize: {
              xs: 10.5,
              sm: 11,
              md: 13,
            },

            lineHeight: {
              xs: "16px",
              md: "18px",
            },

            fontWeight: 600,

            whiteSpace: "nowrap",

            overflow: "hidden",

            textOverflow: "ellipsis",

            textDecoration: "none",

            cursor: canOpenProfile ? "pointer" : "default",

            "&:hover": canOpenProfile
              ? {
                  color: "#ffffff",
                }
              : {},
          }}
        >
          {track.uploader?.name || track.description || "Unknown uploader"}
        </Box>
      </Box>
    );
  };

  /* ========================================
     VIEW
  ======================================== */

  return (
    <Box
      sx={{
        mb: {
          xs: 3,
          md: 3.5,
        },

        mx: {
          xs: 0,
          sm: 1.5,
          md: "50px",
        },

        overflow: "hidden",

        /* REACT SLICK */
        ".slick-slider": {
          position: "relative",
        },

        ".slick-track": {
          marginLeft: "0 !important",

          display: "flex",

          alignItems: "flex-start",
        },

        ".slick-list": {
          overflow: {
            xs: "visible",
            md: "hidden",
          },
        },

        /*
         * Không ép width fixed cho slick-slide.
         * React Slick tự tính theo slidesToShow.
         */
        ".slick-slide": {
          minWidth: 0,

          height: "auto",
        },

        ".slick-slide > div": {
          height: "100%",
        },

        ".slick-disabled": {
          opacity: 0.35,

          pointerEvents: "none",
        },
      }}
    >
      {/* SECTION TITLE */}
      <Box
        component="h2"
        sx={{
          px: {
            xs: 1.5,
            sm: 1,
            md: 0,
          },

          m: 0,

          mb: {
            xs: 1.5,
            md: 2,
          },

          color: "#ffffff",

          fontSize: {
            xs: 18,
            sm: 20,
            md: 22,
          },

          lineHeight: {
            xs: "25px",
            md: "30px",
          },

          fontWeight: 900,

          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </Box>

      {/* EMPTY STATE */}
      {totalItems === 0 ? (
        <Box
          sx={{
            px: {
              xs: 1.5,
              md: 0,
            },

            py: 2,

            color: "#aaaaaa",

            fontSize: 14,
          }}
        >
          No tracks found
        </Box>
      ) : shouldUseSlider ? (
        /* ========================================
           TRACK SLIDER
        ======================================== */
        <Box
          sx={{
            px: {
              xs: 1,
              md: 0,
            },

            pr: {
              xs: 0,
              md: 0,
            },
          }}
        >
          <Slider {...settings}>
            {data.map((track) => renderTrackItem(track))}
          </Slider>
        </Box>
      ) : (
        /* ========================================
           NON-SLIDER TRACK LIST
           Mobile vẫn cuộn ngang
        ======================================== */
        <Box
          sx={{
            display: "flex",

            flexWrap: {
              xs: "nowrap",
              md: "wrap",
            },

            alignItems: "flex-start",

            gap: {
              xs: 0,
              md: "18px",
              lg: "38px",
            },

            px: {
              xs: 1,
              md: 0,
            },

            overflowX: {
              xs: "auto",
              md: "visible",
            },

            overflowY: "hidden",

            scrollSnapType: {
              xs: "x proximity",
              md: "none",
            },

            WebkitOverflowScrolling: "touch",

            scrollbarWidth: "none",

            overscrollBehaviorX: "contain",

            "&::-webkit-scrollbar": {
              display: "none",
            },

            "& > .track": {
              flex: {
                xs: "0 0 43%",
                sm: "0 0 30%",
                md: "0 0 170px",
              },

              scrollSnapAlign: "start",
            },
          }}
        >
          {data.map((track) => renderTrackItem(track))}
        </Box>
      )}

      {/* SECTION DIVIDER */}
      <Divider
        sx={{
          mt: {
            xs: 2.5,
            md: 3,
          },

          mx: {
            xs: 1.5,
            md: 0,
          },

          borderColor: "rgba(255,255,255,0.1)",
        }}
      />
    </Box>
  );
};

export default MainSlider;
