import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

type Props = {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
};

const DashboardStatCard = ({ title, value, description, icon }: Props) => {
  return (
    <Box
      sx={{
        p: 2.2,
        borderRadius: 3,
        backgroundColor: "#111314",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 50px rgba(0,0,0,0.2)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography
            sx={{
              color: "#9a9a9a",
              fontSize: 13,
              fontWeight: 900,
              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>

          {description && (
            <Typography
              sx={{
                color: "#8f8f8f",
                fontSize: 12,
                fontWeight: 700,
                mt: 1,
              }}
            >
              {description}
            </Typography>
          )}
        </Box>

        {icon && (
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              backgroundColor: "rgba(255,85,0,0.14)",
              color: "#ff5500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              "& .MuiSvgIcon-root": {
                fontSize: 24,
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DashboardStatCard;
