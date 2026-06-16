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
        mb: 3,
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
      }}
    >
      <Box>
        <Typography
          component="h1"
          sx={{
            color: "#ffffff",
            fontSize: { xs: 28, md: 36 },
            fontWeight: 900,
            lineHeight: 1.1,
            mb: 0.8,
          }}
        >
          {title}
        </Typography>

        {description && (
          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {actionText && (
        <Button
          startIcon={actionIcon}
          onClick={onAction}
          sx={{
            height: 40,
            px: 2,
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
