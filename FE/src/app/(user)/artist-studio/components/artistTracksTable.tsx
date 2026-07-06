"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InputBase from "@mui/material/InputBase";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import SortRoundedIcon from "@mui/icons-material/SortRounded";
import type { StudioTrack } from "../../../../utils/actions/artistStudioData";

type Props = {
  tracks: StudioTrack[];
};

const ArtistTracksTable = ({ tracks }: Props) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: { xs: "100%", sm: 300 },
              height: 34,
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.18)",
              display: "flex",
              alignItems: "center",
              px: 1.5,
              color: "#8B949E",
            }}
          >
            <SearchRoundedIcon sx={{ fontSize: 18, mr: 1 }} />

            <InputBase
              placeholder="Search tracks"
              sx={{
                color: "#ffffff",
                fontSize: 13,
                flex: 1,
                "& input::placeholder": {
                  color: "#8B949E",
                  opacity: 1,
                },
              }}
            />
          </Box>

          <FilterButton label="Public" />
          <FilterButton label="Private" />
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-between", md: "flex-end" },
            gap: 2,
          }}
        >
          <Typography sx={{ color: "#ffffff", fontSize: 13, fontWeight: 950 }}>
            {tracks.length} track
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
            <SortRoundedIcon sx={{ color: "#8B949E", fontSize: 18 }} />
            <Typography
              sx={{ color: "#ffffff", fontSize: 13, fontWeight: 950 }}
            >
              Date
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.18)",
          display: "grid",
          gridTemplateColumns: {
            xs: "42px 1fr 42px",
            md: "42px 1fr 100px 120px 160px 100px 42px",
          },
          alignItems: "center",
          pb: 1.2,
          color: "#ffffff",
          fontSize: 11,
          fontWeight: 950,
        }}
      >
        <Box>
          <Checkbox
            size="small"
            sx={{
              color: "#ffffff",
              p: 0,
              "&.Mui-checked": {
                color: "#FF5500",
              },
            }}
          />
        </Box>

        <Typography sx={headerSx}>Tracks</Typography>
        <Typography sx={{ ...headerSx, display: { xs: "none", md: "block" } }}>
          Duration
        </Typography>
        <Typography sx={{ ...headerSx, display: { xs: "none", md: "block" } }}>
          Date
        </Typography>
        <Typography sx={{ ...headerSx, display: { xs: "none", md: "block" } }}>
          Engagements
        </Typography>
        <Typography sx={{ ...headerSx, display: { xs: "none", md: "block" } }}>
          Plays
        </Typography>
        <Box />
      </Box>

      {tracks.map((track) => (
        <Box
          key={track.id}
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            display: "grid",
            gridTemplateColumns: {
              xs: "42px 1fr 42px",
              md: "42px 1fr 100px 120px 160px 100px 42px",
            },
            alignItems: "center",
            py: 2,
            minHeight: 94,
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            {track.status === "removed" ? (
              <WarningRoundedIcon sx={{ color: "#ffffff", fontSize: 22 }} />
            ) : (
              <Checkbox
                size="small"
                sx={{
                  color: "#ffffff",
                  p: 0,
                  "&.Mui-checked": {
                    color: "#FF5500",
                  },
                }}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "2px",
                background: track.coverGradient,
                border: "1px solid rgba(255,255,255,0.12)",
                flexShrink: 0,
              }}
            />

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 950,
                  lineHeight: 1.35,
                }}
              >
                {track.title}
              </Typography>

              <Typography
                noWrap
                sx={{
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 950,
                  lineHeight: 1.35,
                }}
              >
                {track.fileName}
              </Typography>

              {track.notice && (
                <Typography
                  sx={{
                    color: "#ff3040",
                    fontSize: 12,
                    fontWeight: 900,
                    mt: 0.5,
                  }}
                >
                  {track.notice}
                </Typography>
              )}

              <Typography
                sx={{
                  color: "#3b82f6",
                  fontSize: 12,
                  fontWeight: 800,
                  mt: 0.3,
                }}
              >
                Learn more
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ ...cellSx, display: { xs: "none", md: "block" } }}>
            {track.duration}
          </Typography>

          <Typography sx={{ ...cellSx, display: { xs: "none", md: "block" } }}>
            {track.date}
          </Typography>

          <Typography sx={{ ...cellSx, display: { xs: "none", md: "block" } }}>
            {track.engagements}
          </Typography>

          <Typography sx={{ ...cellSx, display: { xs: "none", md: "block" } }}>
            {track.plays}
          </Typography>

          <MoreVertRoundedIcon
            sx={{
              color: "#ffffff",
              justifySelf: "end",
              cursor: "pointer",
            }}
          />
        </Box>
      ))}
    </Box>
  );
};

const FilterButton = ({ label }: { label: string }) => {
  return (
    <Button
      sx={{
        height: 32,
        px: 2.2,
        borderRadius: "999px",
        color: "#ffffff",
        border: "1px solid rgba(255,255,255,0.24)",
        textTransform: "none",
        fontSize: 12,
        fontWeight: 900,
        display: { xs: "none", sm: "inline-flex" },
        "&:hover": {
          background: "rgba(255,255,255,0.06)",
          borderColor: "#ffffff",
        },
      }}
    >
      {label}
    </Button>
  );
};

const headerSx = {
  color: "#ffffff",
  fontSize: 11,
  fontWeight: 950,
  textTransform: "uppercase",
};

const cellSx = {
  color: "#D1D5DB",
  fontSize: 13,
  fontWeight: 800,
};

export default ArtistTracksTable;
