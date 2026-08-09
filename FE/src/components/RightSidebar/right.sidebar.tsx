import { Box } from "@mui/material";
import ArtistTools from "./artistTools";
import SuggestedArtists from "./suggestedArtists";
import ListeningHistory from "./listening.history";
import SidebarFooter from "./sidebar.footer";

const RightSidebar = () => {
  return (
    <Box
      component="aside"
      sx={{
        width: {
          xs: "100%",
          lg: 330,
        },

        flexShrink: 0,

        backgroundColor: "#181A1B",
        color: "#ffffff",

        /* MOBILE SEPARATOR */
        borderTop: {
          xs: "1px solid rgba(255,255,255,0.08)",
          lg: "none",
        },

        /* DESKTOP SIDEBAR BORDER */
        borderLeft: {
          xs: "none",
          lg: "1px solid rgba(255,255,255,0.06)",
        },

        px: {
          xs: 2,
          sm: 2.5,
          lg: 2,
        },

        pt: {
          xs: 3,
          lg: 2,
        },

        pb: {
          xs: 3,
          lg: 2,
        },

        display: "block",
      }}
    >
      {/* MOBILE / DESKTOP ARTIST TOOLS */}
      <ArtistTools />

      {/* SUGGESTED ARTISTS */}
      <SuggestedArtists />

      {/* LISTENING HISTORY */}
      <ListeningHistory />

      {/* SIDEBAR FOOTER */}
      <SidebarFooter />
    </Box>
  );
};

export default RightSidebar;
