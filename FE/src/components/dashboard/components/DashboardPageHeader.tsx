import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

type Props = {
  title: string;
  description?: string;
  actionText?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
};

const DashboardPageHeader = ({
  title,
  description,
  actionText,
  actionIcon,
  onAction,
}: Props) => {
  return (
    <Box
      sx={{
        /* DASHBOARD PAGE HEADER */
        mb: {
          xs: 2.5,
          md: 3,
        },

        display: "flex",

        flexDirection: {
          xs: "column",
          sm: actionText ? "row" : "column",
        },

        alignItems: {
          xs: "center",
          sm: actionText ? "center" : "center",
        },

        justifyContent: "center",

        gap: 2,

        width: "100%",

        textAlign: "center",
      }}
    >
      {/* HEADER TITLE + DESCRIPTION */}
      <Box
        sx={{
          flex: actionText ? 1 : "unset",

          width: {
            xs: "100%",
            sm: actionText ? "auto" : "100%",
          },

          display: "flex",

          flexDirection: "column",

          alignItems: "center",

          justifyContent: "center",

          textAlign: "center",
        }}
      >
        {/* PAGE TITLE */}
        <Typography
          component="h1"
          sx={{
            m: 0,

            color: "#ffffff",

            fontSize: {
              xs: 24,
              sm: 28,
              md: 36,
            },

            fontWeight: 900,

            lineHeight: 1.15,

            textAlign: "center",

            mb: description ? 0.8 : 0,
          }}
        >
          {title}
        </Typography>

        {/* PAGE DESCRIPTION */}
        {description && (
          <Typography
            sx={{
              maxWidth: 620,

              px: {
                xs: 1,
                sm: 0,
              },

              color: "#9a9a9a",

              fontSize: {
                xs: 11.5,
                sm: 13,
                md: 14,
              },

              fontWeight: 700,

              lineHeight: 1.6,

              textAlign: "center",
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {/* HEADER ACTION */}
      {actionText && (
        <Button
          startIcon={actionIcon}
          onClick={onAction}
          sx={{
            height: 40,

            width: {
              xs: "100%",
              sm: "auto",
            },

            maxWidth: {
              xs: 320,
              sm: "none",
            },

            px: 2,

            flexShrink: 0,

            borderRadius: "999px",

            backgroundColor: "#ff5500",

            color: "#ffffff",

            textTransform: "none",

            fontSize: 14,

            fontWeight: 900,

            whiteSpace: "nowrap",

            boxShadow: "0 12px 28px rgba(255,85,0,0.22)",

            "&:hover": {
              backgroundColor: "#ff6a1a",

              boxShadow: "0 14px 34px rgba(255,85,0,0.28)",
            },
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default DashboardPageHeader;
