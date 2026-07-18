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
      {/* FOOTER DIVIDER */}
      <Divider
        sx={{
          borderColor: "rgba(255,255,255,0.08)",
        }}
      />

      {/* FOOTER CONTAINER */}
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",

          gap: {
            xs: 4,
            sm: 6,
            md: 8,
          },

          py: {
            xs: 5,
            sm: 7,
            md: 10,
          },

          px: {
            xs: 2,
            sm: 3,
          },

          textAlign: {
            xs: "left",
            sm: "left",
          },
        }}
      >
        {/* FOOTER TOP */}
        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "1.5fr 1fr 1fr",
              md: "2fr 1fr 1fr 1fr",
            },

            gap: {
              xs: 4,
              sm: 4,
              md: 6,
            },

            width: "100%",
          }}
        >
          {/* NEWSLETTER */}
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 1,

                color: "#ffffff",

                fontSize: {
                  xs: 15,
                  md: 16,
                },

                fontWeight: 800,
              }}
            >
              Join the newsletter
            </Typography>

            <Typography
              variant="body2"
              sx={{
                maxWidth: 420,

                mb: 2,

                color: "#a7a7a7",

                fontSize: {
                  xs: 12.5,
                  sm: 13,
                },

                lineHeight: "21px",
              }}
            >
              Subscribe for weekly updates. No spams ever!
            </Typography>

            {/* NEWSLETTER FORM */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              useFlexGap
              sx={{
                width: "100%",

                maxWidth: 430,
              }}
            >
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
                  flex: 1,

                  minWidth: 0,

                  "& .MuiOutlinedInput-root": {
                    height: 40,

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

                  "& input": {
                    fontSize: 13,
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
                sx={{
                  height: 40,

                  px: 2.5,

                  flexShrink: 0,

                  borderRadius: "10px",

                  textTransform: "none",

                  fontWeight: 800,

                  whiteSpace: "nowrap",

                  width: {
                    xs: "100%",
                    sm: "auto",
                  },
                }}
              >
                Subscribe
              </Button>
            </Stack>
          </Box>

          {/* PRODUCT */}
          <Box
            sx={{
              display: {
                xs: "grid",
                sm: "flex",
              },

              gridTemplateColumns: {
                xs: "1fr 1fr",
              },

              flexDirection: "column",

              gap: {
                xs: 1,
                sm: 1,
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                gridColumn: {
                  xs: "1 / -1",
                  sm: "auto",
                },

                mb: 0.5,

                color: "#ffffff",

                fontWeight: 800,
              }}
            >
              Product
            </Typography>

            {["Features", "Testimonials", "Highlights", "Pricing", "FAQs"].map(
              (item) => (
                <Link
                  key={item}
                  variant="body2"
                  href="#"
                  sx={{
                    color: "#a7a7a7",

                    fontSize: 13,

                    textDecoration: "none",

                    "&:hover": {
                      color: "#ffffff",
                    },
                  }}
                >
                  {item}
                </Link>
              )
            )}
          </Box>

          {/* COMPANY */}
          <Box
            sx={{
              display: {
                xs: "grid",
                sm: "flex",
              },

              gridTemplateColumns: {
                xs: "1fr 1fr",
              },

              flexDirection: "column",

              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                gridColumn: {
                  xs: "1 / -1",
                  sm: "auto",
                },

                mb: 0.5,

                color: "#ffffff",

                fontWeight: 800,
              }}
            >
              Company
            </Typography>

            {["About us", "Careers", "Press"].map((item) => (
              <Link
                key={item}
                variant="body2"
                href="#"
                sx={{
                  color: "#a7a7a7",

                  fontSize: 13,

                  textDecoration: "none",

                  "&:hover": {
                    color: "#ffffff",
                  },
                }}
              >
                {item}
              </Link>
            ))}
          </Box>

          {/* LEGAL */}
          <Box
            sx={{
              display: {
                xs: "grid",
                sm: "flex",
              },

              gridTemplateColumns: {
                xs: "1fr 1fr",
              },

              flexDirection: "column",

              gap: 1,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                gridColumn: {
                  xs: "1 / -1",
                  sm: "auto",
                },

                mb: 0.5,

                color: "#ffffff",

                fontWeight: 800,
              }}
            >
              Legal
            </Typography>

            {["Terms", "Privacy", "Contact"].map((item) => (
              <Link
                key={item}
                variant="body2"
                href="#"
                sx={{
                  color: "#a7a7a7",

                  fontSize: 13,

                  textDecoration: "none",

                  "&:hover": {
                    color: "#ffffff",
                  },
                }}
              >
                {item}
              </Link>
            ))}
          </Box>
        </Box>

        {/* FOOTER BOTTOM */}
        <Box
          sx={{
            display: "flex",

            flexDirection: {
              xs: "column",
              sm: "row",
            },

            alignItems: {
              xs: "flex-start",
              sm: "center",
            },

            justifyContent: "space-between",

            gap: {
              xs: 2,
              sm: 3,
            },

            pt: {
              xs: 3,
              sm: 4,
              md: 5,
            },

            width: "100%",

            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* LEGAL BOTTOM */}
          <Box>
            <Box
              sx={{
                display: "flex",

                flexWrap: "wrap",

                alignItems: "center",

                gap: 0.8,
              }}
            >
              <Link
                variant="body2"
                href="#"
                sx={{
                  color: "#a7a7a7",

                  fontSize: {
                    xs: 11.5,
                    sm: 13,
                  },

                  textDecoration: "none",

                  "&:hover": {
                    color: "#ffffff",
                  },
                }}
              >
                Privacy Policy
              </Link>

              <Typography
                sx={{
                  color: "#666",

                  fontSize: 12,
                }}
              >
                •
              </Typography>

              <Link
                variant="body2"
                href="#"
                sx={{
                  color: "#a7a7a7",

                  fontSize: {
                    xs: 11.5,
                    sm: 13,
                  },

                  textDecoration: "none",

                  "&:hover": {
                    color: "#ffffff",
                  },
                }}
              >
                Terms of Service
              </Link>
            </Box>

            {/* COPYRIGHT */}
            <Box
              sx={{
                mt: 1,

                color: "#777",

                fontSize: {
                  xs: 11,
                  sm: 12,
                },
              }}
            >
              <Copyright />
            </Box>
          </Box>

          {/* SOCIAL LINKS */}
          <Stack
            direction="row"
            spacing={0.5}
            useFlexGap
            sx={{
              color: "#a7a7a7",
            }}
          >
            <IconButton
              color="inherit"
              size="small"
              href="https://github.com/mui"
              aria-label="GitHub"
              sx={{
                width: 36,
                height: 36,

                "&:hover": {
                  color: "#ffffff",

                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <GitHubIcon />
            </IconButton>

            <IconButton
              color="inherit"
              size="small"
              href="https://x.com/MaterialUI"
              aria-label="X"
              sx={{
                width: 36,
                height: 36,

                "&:hover": {
                  color: "#ffffff",

                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <TwitterIcon />
            </IconButton>

            <IconButton
              color="inherit"
              size="small"
              href="https://www.linkedin.com/company/mui/"
              aria-label="LinkedIn"
              sx={{
                width: 36,
                height: 36,

                "&:hover": {
                  color: "#ffffff",

                  backgroundColor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <LinkedInIcon />
            </IconButton>
          </Stack>
        </Box>
      </Container>
    </React.Fragment>
  );
}
