"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

type Props = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  actionText?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
};

const DashboardTableToolbar = ({
  searchValue,
  onSearchChange,
  actionText,
  actionIcon,
  onAction,
}: Props) => {
  return (
    <Box
      sx={{
        mb: 2,
        p: 1.5,
        borderRadius: 3,
        backgroundColor: "#111314",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 1.5,
      }}
    >
      <TextField
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search..."
        size="small"
        InputProps={{
          startAdornment: (
            <SearchRoundedIcon
              sx={{
                mr: 1,
                color: "#8f8f8f",
                fontSize: 20,
              }}
            />
          ),
        }}
        sx={{
          width: { xs: "100%", sm: 320 },

          "& .MuiOutlinedInput-root": {
            height: 40,
            color: "#ffffff",
            borderRadius: "999px",
            backgroundColor: "#0f1111",
            fontSize: 14,
            fontWeight: 700,

            "& fieldset": {
              borderColor: "rgba(255,255,255,0.1)",
            },

            "&:hover fieldset": {
              borderColor: "rgba(255,255,255,0.24)",
            },

            "&.Mui-focused fieldset": {
              borderColor: "#ff5500",
            },
          },

          "& input::placeholder": {
            color: "#8f8f8f",
            opacity: 1,
          },
        }}
      />

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

            "&:hover": {
              backgroundColor: "#ff6a1a",
            },
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default DashboardTableToolbar;
