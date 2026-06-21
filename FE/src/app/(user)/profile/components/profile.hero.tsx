import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CameraAltRoundedIcon from "@mui/icons-material/CameraAltRounded";
import { Avatar } from "@mui/material";
import { getUserAvatarUrl } from "@/utils/actions/getAvatar";

type Props = {
  user: Partial<IUser> | null;
  trackCount: number;
};

const ProfileHero = ({ user }: Props) => {
  const displayName = user?.name || user?.email || "User";
  const subName = user?.email || user?.address || "Sound Clone user";

  ///get Al avatar
  const getInitials = (name?: string, email?: string) => {
    const value = name?.trim() || email?.trim() || "User";

    const words = value.split(" ").filter(Boolean);

    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    return value.slice(0, 2).toUpperCase();
  };

  return (
    <Box
      sx={{
        height: { xs: 260, md: 300 },
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #3b4a47 0%, #55523d 45%, #6b5d3f 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Button
        startIcon={<CameraAltRoundedIcon />}
        sx={{
          position: "absolute",
          top: 24,
          right: 32,
          height: 38,
          px: 2.2,
          borderRadius: "4px",
          color: "#ffffff",
          backgroundColor: "#050505",
          fontWeight: 900,
          fontSize: 13,
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#111111",
          },
        }}
      >
        Upload header image
      </Button>

      <Box
        sx={{
          position: "absolute",
          left: { xs: 24, md: 34 },
          bottom: { xs: 28, md: 42 },
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Avatar
          src={getUserAvatarUrl(user) || undefined}
          alt={displayName}
          sx={{
            width: { xs: 140, md: 190 },
            height: { xs: 140, md: 190 },
            bgcolor: "#ff5500",
            color: "#ffffff",
            fontWeight: 900,
            fontSize: { xs: 42, md: 58 },
            border: "4px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
          }}
        >
          {!getUserAvatarUrl(user) && getInitials(user?.name, user?.email)}
        </Avatar>

        <Box>
          <Typography
            component="h1"
            sx={{
              display: "inline-block",
              px: 1,
              py: 0.4,
              backgroundColor: "rgba(0,0,0,0.72)",
              color: "#ffffff",
              fontSize: { xs: 26, md: 34 },
              fontWeight: 900,
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            {displayName}
          </Typography>

          <Box />

          <Typography
            sx={{
              display: "inline-block",
              px: 1,
              py: 0.4,
              backgroundColor: "rgba(0,0,0,0.72)",
              color: "#cfcfcf",
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
            }}
          >
            {subName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfileHero;
