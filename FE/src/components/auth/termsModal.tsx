"use client";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

interface TermsModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  onAgree?: () => void;
}

const TermsModal = ({
  isModalOpen,
  setIsModalOpen,
  onAgree,
}: TermsModalProps) => {
  const handleAgree = () => {
    onAgree?.();
    setIsModalOpen(false);
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background:
            "linear-gradient(180deg, rgba(24,26,27,0.98), rgba(12,14,15,0.98))",
          color: "#FFFFFF",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: { xs: 20, sm: 24 },
          color: "#FFFFFF",
          pb: 1,
        }}
      >
        Terms of Service & Privacy Policy
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          borderColor: "rgba(255,255,255,0.12)",
          px: { xs: 2.5, sm: 4 },
          py: 3,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography
            component="h3"
            sx={{
              fontSize: 18,
              fontWeight: 900,
              color: "#FF7A00",
            }}
          >
            1. Terms of Service
          </Typography>

          <Typography sx={{ color: "#B8B8B8", lineHeight: 1.8 }}>
            By creating an account and using this music streaming platform, you
            agree to use the service responsibly and follow all applicable
            rules. You must not upload, share, or distribute content that
            violates copyright, contains harmful material, or infringes the
            rights of other users, artists, or third parties.
          </Typography>

          <Typography sx={{ color: "#B8B8B8", lineHeight: 1.8 }}>
            <Box component="span" sx={{ color: "#FFFFFF", fontWeight: 800 }}>
              User responsibility:
            </Box>{" "}
            You are responsible for keeping your account secure, providing
            accurate information, and ensuring that any music, images, comments,
            or playlists you upload or create are legal and appropriate.
          </Typography>

          <Typography sx={{ color: "#B8B8B8", lineHeight: 1.8 }}>
            We may remove content or restrict accounts that are used for spam,
            abuse, copyright infringement, or any activity that affects the
            safety and experience of other users.
          </Typography>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1 }} />

          <Typography
            component="h3"
            sx={{
              fontSize: 18,
              fontWeight: 900,
              color: "#00FFE0",
            }}
          >
            2. Privacy Policy
          </Typography>

          <Typography sx={{ color: "#B8B8B8", lineHeight: 1.8 }}>
            We respect your privacy and are committed to protecting your
            personal information. The data you provide, such as your name,
            email, age, gender, and address, is used only to create and manage
            your account, improve your experience, and support platform
            features.
          </Typography>

          <Typography sx={{ color: "#B8B8B8", lineHeight: 1.8 }}>
            <Box component="span" sx={{ color: "#FFFFFF", fontWeight: 800 }}>
              Music activity:
            </Box>{" "}
            We may store information related to your uploaded tracks, liked
            songs, playlists, comments, and play history to provide music
            features such as recommendations, track details, and user libraries.
          </Typography>

          <Typography sx={{ color: "#B8B8B8", lineHeight: 1.8 }}>
            We do not sell your personal information. Your data will not be
            shared with third parties unless required by law or necessary to
            operate and secure the service.
          </Typography>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", my: 1 }} />

          <Typography
            sx={{
              color: "#8B949E",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            By continuing to use this platform, you confirm that you have read
            and agree to our Terms of Service and Privacy Policy.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2.5, sm: 4 },
          py: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={() => setIsModalOpen(false)}
          sx={{
            color: "#B8B8B8",
            textTransform: "none",
            fontWeight: 700,
            "&:hover": {
              color: "#FFFFFF",
              background: "rgba(255,255,255,0.08)",
            },
          }}
        >
          Close
        </Button>

        <Button
          variant="contained"
          onClick={handleAgree}
          sx={{
            px: 3,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 900,
            color: "#FFFFFF",
            background: "linear-gradient(135deg, #FF4D00, #FF7A00)",
            boxShadow: "0 12px 28px rgba(255,77,0,0.28)",
            "&:hover": {
              background: "linear-gradient(135deg, #FF6A00, #FF9100)",
              boxShadow: "0 16px 34px rgba(255,77,0,0.35)",
            },
          }}
        >
          I Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsModal;
