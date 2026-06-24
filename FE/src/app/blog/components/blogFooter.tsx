import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import SitemarkIcon from "./SitemarkIcon";
import TwitterIcon from "@mui/icons-material/Twitter";

function Copyright() {
  return (
    <Typography variant="body2" sx={{ color: "#a7a7a7", mt: 1 }}>
      {"Copyright © "}
      <Link href="https://mui.com/" sx={{ color: "#a7a7a7" }}>
        Sitemark
      </Link>
      &nbsp;
      {new Date().getFullYear()}
    </Typography>
  );
}

export default function BlogFooter() {
  return (
    <React.Fragment>
      <Divider />
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: { xs: 4, sm: 8 },
          py: { xs: 8, sm: 10 },
          textAlign: { sm: "center", md: "left" },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: { xs: "100%", sm: "60%" },
            }}
          >
            <Box sx={{ width: { xs: "100%", sm: "60%" } }}>
              <SitemarkIcon />
              <Typography
                variant="body2"
                gutterBottom
                sx={{ fontWeight: 600, mt: 2 }}
              >
                Join the newsletter
              </Typography>

              <Typography variant="body2" sx={{ color: "#a7a7a7", mb: 2 }}>
                Subscribe for weekly updates. No spams ever!
              </Typography>

              <Stack direction="row" spacing={1} useFlexGap>
                <TextField
                  id="email-newsletter"
                  hiddenLabel
                  size="small"
                  variant="outlined"
                  fullWidth
                  placeholder="Your email address"
                  inputProps={{
                    autoComplete: "off",
                    "aria-label": "Enter your email address",
                  }}
                  sx={{
                    width: "250px",

                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#111318",
                      color: "#ffffff",
                      borderRadius: "10px",

                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.18)",
                      },

                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.35)",
                      },

                      "&.Mui-focused fieldset": {
                        borderColor: "#00ffe0",
                      },
                    },

                    "& input::placeholder": {
                      color: "#8b949e",
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  sx={{ flexShrink: 0 }}
                >
                  Subscribe
                </Button>
              </Stack>
            </Box>
          </Box>
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
              Product
            </Typography>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Features
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Testimonials
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Highlights
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Pricing
            </Link>
            <Link variant="body2" sx={{ color: "#a7a7a7" }}>
              FAQs
            </Link>
          </Box>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
              Company
            </Typography>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              About us
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Careers
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Press
            </Link>
          </Box>

          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: "medium" }}>
              Legal
            </Typography>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Terms
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Privacy
            </Link>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Contact
            </Link>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            pt: { xs: 4, sm: 8 },
            width: "100%",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <div>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Privacy Policy
            </Link>
            <Typography sx={{ display: "inline", mx: 0.5, opacity: 0.5 }}>
              &nbsp;•&nbsp;
            </Typography>
            <Link variant="body2" href="#" sx={{ color: "#a7a7a7" }}>
              Terms of Service
            </Link>
            <Copyright />
          </div>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ color: "#a7a7a7" }}
          >
            <IconButton
              color="inherit"
              size="small"
              href="https://github.com/mui"
              aria-label="GitHub"
              sx={{ alignSelf: "center" }}
            >
              <GitHubIcon />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              href="https://x.com/MaterialUI"
              aria-label="X"
              sx={{ alignSelf: "center" }}
            >
              <TwitterIcon />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              href="https://www.linkedin.com/company/mui/"
              aria-label="LinkedIn"
              sx={{ alignSelf: "center" }}
            >
              <LinkedInIcon />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </React.Fragment>
  );
}
