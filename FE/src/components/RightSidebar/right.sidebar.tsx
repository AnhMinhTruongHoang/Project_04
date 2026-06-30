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
        width: 330,
        flexShrink: 0,
        backgroundColor: "#181A1B",
        color: "#ffffff",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
        px: 2,
        py: 2,
        display: { xs: "none", lg: "block" },
      }}
    >
      <ArtistTools />
      <SuggestedArtists />
      <ListeningHistory />
      <SidebarFooter />
    </Box>
  );
};

export default RightSidebar;
