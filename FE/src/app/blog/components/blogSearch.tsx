import { FormControl, InputAdornment, OutlinedInput } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

export default function Search() {
  return (
    <FormControl
      sx={{
        width: { xs: "100%", md: "25ch" },
      }}
      variant="outlined"
    >
      <OutlinedInput
        size="small"
        id="search"
        placeholder="Search..."
        startAdornment={
          <InputAdornment position="start">
            <SearchRoundedIcon
              fontSize="small"
              sx={{
                color: "#8b949e",
              }}
            />
          </InputAdornment>
        }
        inputProps={{
          "aria-label": "search",
        }}
        sx={{
          flexGrow: 1,
          height: 40,
          color: "#ffffff",
          bgcolor: "#111318",
          borderRadius: "10px",
          fontWeight: 700,

          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.12)",
          },

          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.28)",
          },

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#00ffe0",
          },

          "& input::placeholder": {
            color: "#8b949e",
            opacity: 1,
          },
        }}
      />
    </FormControl>
  );
}
