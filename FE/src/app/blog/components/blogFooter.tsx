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
      {/* FOOTER */}
      <Box
        component="footer"
        sx={{
          width: "100%",
          background:
            "linear-gradient(180deg, #121415 0%, #0b0c0d 55%, #080909 100%)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <Container
          sx={{
            py: {
              xs: 3.5,
              sm: 5,
              md: 7,
            },

            px: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          {/* NEWSLETTER */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",

              mb: {
                xs: 3,
                sm: 5,
              },

              p: {
                xs: 2,
                sm: 2.8,
                md: 3.2,
              },

              borderRadius: {
                xs: "16px",
                sm: "18px",
              },

              border: "1px solid rgba(255,255,255,0.09)",

              background:
                "linear-gradient(135deg, rgba(255,85,0,0.10) 0%, rgba(255,255,255,0.025) 45%, rgba(255,255,255,0.015) 100%)",

              boxShadow: {
                xs: "0 14px 35px rgba(0,0,0,0.26)",
                md: "0 20px 55px rgba(0,0,0,0.3)",
              },

              "&::before": {
                content: '""',
                position: "absolute",

                width: 170,
                height: 170,

                top: -90,
                right: -70,

                borderRadius: "50%",

                background: "rgba(255,85,0,0.12)",
                filter: "blur(30px)",

                pointerEvents: "none",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                zIndex: 1,

                display: {
                  xs: "block",
                  md: "flex",
                },

                alignItems: "center",
                justifyContent: "space-between",

                gap: 4,
              }}
            >
              <Box
                sx={{
                  mb: {
                    xs: 2,
                    md: 0,
                  },

                  maxWidth: 470,
                }}
              >
                <Typography
                  sx={{
                    color: "#ffffff",

                    fontSize: {
                      xs: 17,
                      sm: 19,
                    },

                    fontWeight: 950,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Join the newsletter
                </Typography>

                <Typography
                  sx={{
                    mt: 0.7,

                    color: "#8B949E",

                    fontSize: {
                      xs: 11.5,
                      sm: 12.5,
                    },

                    lineHeight: 1.6,
                    fontWeight: 650,
                  }}
                >
                  Get the latest SoundClone updates, creator news and platform
                  highlights.
                </Typography>
              </Box>

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
                  maxWidth: {
                    xs: "100%",
                    md: 500,
                  },
                }}
              >
                <TextField
                  id="email-newsletter"
                  hiddenLabel
                  size="small"
                  variant="outlined"
                  fullWidth
                  placeholder="Enter your email"
                  inputProps={{
                    autoComplete: "off",
                    "aria-label": "Enter your email address",
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,

                    "& .MuiOutlinedInput-root": {
                      height: {
                        xs: 44,
                        sm: 46,
                      },

                      px: 0.4,

                      color: "#ffffff",

                      backgroundColor: "rgba(5,6,7,0.72)",

                      borderRadius: "10px",

                      "& fieldset": {
                        borderColor: "rgba(255,255,255,0.11)",
                      },

                      "&:hover fieldset": {
                        borderColor: "rgba(255,255,255,0.24)",
                      },

                      "&.Mui-focused fieldset": {
                        borderColor: "#FF5500",
                        borderWidth: "1px",
                      },
                    },

                    "& input": {
                      fontSize: 12.5,
                      fontWeight: 650,
                    },

                    "& input::placeholder": {
                      color: "#626A74",
                      opacity: 1,
                    },
                  }}
                />

                <Button
                  variant="contained"
                  sx={{
                    height: {
                      xs: 44,
                      sm: 46,
                    },

                    px: 3,

                    width: {
                      xs: "100%",
                      sm: "auto",
                    },

                    minWidth: {
                      sm: 125,
                    },

                    flexShrink: 0,

                    borderRadius: "10px",

                    color: "#ffffff",
                    backgroundColor: "#FF5500",

                    boxShadow: "none",

                    textTransform: "none",

                    fontSize: 12,
                    fontWeight: 950,

                    "&:hover": {
                      backgroundColor: "#ff681f",
                      boxShadow: "0 8px 24px rgba(255,85,0,0.22)",
                    },
                  }}
                >
                  Subscribe
                </Button>
              </Stack>
            </Box>
          </Box>

          {/* FOOTER LINKS */}
          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },

              gap: {
                xs: 1.4,
                sm: 4,
                md: 7,
              },
            }}
          >
            {/* PRODUCT */}
            <Box
              sx={{
                p: {
                  xs: 1.8,
                  sm: 0,
                },

                borderRadius: {
                  xs: "12px",
                  sm: 0,
                },

                border: {
                  xs: "1px solid rgba(255,255,255,0.06)",
                  sm: "none",
                },

                backgroundColor: {
                  xs: "rgba(255,255,255,0.018)",
                  sm: "transparent",
                },
              }}
            >
              <Typography
                sx={{
                  mb: 1.4,

                  color: "#ffffff",

                  fontSize: {
                    xs: 12,
                    sm: 13,
                  },

                  fontWeight: 950,
                }}
              >
                Product
              </Typography>

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    sm: "1fr",
                  },

                  rowGap: 1.1,
                  columnGap: 2,
                }}
              >
                {[
                  "Features",
                  "Testimonials",
                  "Highlights",
                  "Pricing",
                  "FAQs",
                ].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    sx={{
                      width: "fit-content",

                      color: "#858C95",

                      fontSize: {
                        xs: 11.5,
                        sm: 12.5,
                      },

                      fontWeight: 650,

                      textDecoration: "none",

                      transition: "color 0.18s ease",

                      "&:hover": {
                        color: "#FF6A1A",
                      },
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* COMPANY */}
            <Box
              sx={{
                p: {
                  xs: 1.8,
                  sm: 0,
                },

                borderRadius: {
                  xs: "12px",
                  sm: 0,
                },

                border: {
                  xs: "1px solid rgba(255,255,255,0.06)",
                  sm: "none",
                },

                backgroundColor: {
                  xs: "rgba(255,255,255,0.018)",
                  sm: "transparent",
                },
              }}
            >
              <Typography
                sx={{
                  mb: 1.4,

                  color: "#ffffff",

                  fontSize: {
                    xs: 12,
                    sm: 13,
                  },

                  fontWeight: 950,
                }}
              >
                Company
              </Typography>

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    sm: "1fr",
                  },

                  rowGap: 1.1,
                  columnGap: 2,
                }}
              >
                {["About us", "Careers", "Press"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    sx={{
                      width: "fit-content",

                      color: "#858C95",

                      fontSize: {
                        xs: 11.5,
                        sm: 12.5,
                      },

                      fontWeight: 650,

                      textDecoration: "none",

                      transition: "color 0.18s ease",

                      "&:hover": {
                        color: "#FF6A1A",
                      },
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </Box>
            </Box>

            {/* LEGAL */}
            <Box
              sx={{
                p: {
                  xs: 1.8,
                  sm: 0,
                },

                borderRadius: {
                  xs: "12px",
                  sm: 0,
                },

                border: {
                  xs: "1px solid rgba(255,255,255,0.06)",
                  sm: "none",
                },

                backgroundColor: {
                  xs: "rgba(255,255,255,0.018)",
                  sm: "transparent",
                },
              }}
            >
              <Typography
                sx={{
                  mb: 1.4,

                  color: "#ffffff",

                  fontSize: {
                    xs: 12,
                    sm: 13,
                  },

                  fontWeight: 950,
                }}
              >
                Legal
              </Typography>

              <Box
                sx={{
                  display: "grid",

                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    sm: "1fr",
                  },

                  rowGap: 1.1,
                  columnGap: 2,
                }}
              >
                {["Terms", "Privacy", "Contact"].map((item) => (
                  <Link
                    key={item}
                    href="#"
                    sx={{
                      width: "fit-content",

                      color: "#858C95",

                      fontSize: {
                        xs: 11.5,
                        sm: 12.5,
                      },

                      fontWeight: 650,

                      textDecoration: "none",

                      transition: "color 0.18s ease",

                      "&:hover": {
                        color: "#FF6A1A",
                      },
                    }}
                  >
                    {item}
                  </Link>
                ))}
              </Box>
            </Box>
          </Box>

          {/* FOOTER BOTTOM */}
          <Box
            sx={{
              mt: {
                xs: 3,
                sm: 5,
              },

              pt: {
                xs: 2.3,
                sm: 3,
              },

              display: "flex",

              flexDirection: {
                xs: "column",
                sm: "row",
              },

              alignItems: {
                xs: "center",
                sm: "center",
              },

              justifyContent: "space-between",

              gap: 2,

              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* COPYRIGHT + LEGAL */}
            <Box
              sx={{
                textAlign: {
                  xs: "center",
                  sm: "left",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",

                  justifyContent: {
                    xs: "center",
                    sm: "flex-start",
                  },

                  alignItems: "center",
                  flexWrap: "wrap",

                  gap: 0.8,
                }}
              >
                <Link
                  href="#"
                  sx={{
                    color: "#6F767F",

                    fontSize: {
                      xs: 10.5,
                      sm: 11.5,
                    },

                    fontWeight: 650,

                    textDecoration: "none",

                    "&:hover": {
                      color: "#ffffff",
                    },
                  }}
                >
                  Privacy Policy
                </Link>

                <Box
                  component="span"
                  sx={{
                    width: 3,
                    height: 3,

                    borderRadius: "50%",

                    backgroundColor: "#454A50",
                  }}
                />

                <Link
                  href="#"
                  sx={{
                    color: "#6F767F",

                    fontSize: {
                      xs: 10.5,
                      sm: 11.5,
                    },

                    fontWeight: 650,

                    textDecoration: "none",

                    "&:hover": {
                      color: "#ffffff",
                    },
                  }}
                >
                  Terms of Service
                </Link>
              </Box>

              <Box
                sx={{
                  mt: 0.8,

                  color: "#535960",

                  fontSize: {
                    xs: 10,
                    sm: 11,
                  },
                }}
              >
                <Copyright />
              </Box>
            </Box>

            {/* SOCIAL */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",

                p: 0.5,

                borderRadius: "999px",

                border: "1px solid rgba(255,255,255,0.07)",

                backgroundColor: "rgba(255,255,255,0.025)",
              }}
            >
              <IconButton
                size="small"
                href="https://github.com/mui"
                aria-label="GitHub"
                sx={{
                  width: 34,
                  height: 34,

                  color: "#747B84",

                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.07)",
                  },
                }}
              >
                <GitHubIcon
                  sx={{
                    fontSize: 18,
                  }}
                />
              </IconButton>

              <IconButton
                size="small"
                href="https://x.com/MaterialUI"
                aria-label="X"
                sx={{
                  width: 34,
                  height: 34,

                  color: "#747B84",

                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.07)",
                  },
                }}
              >
                <TwitterIcon
                  sx={{
                    fontSize: 18,
                  }}
                />
              </IconButton>

              <IconButton
                size="small"
                href="https://www.linkedin.com/company/mui/"
                aria-label="LinkedIn"
                sx={{
                  width: 34,
                  height: 34,

                  color: "#747B84",

                  "&:hover": {
                    color: "#ffffff",
                    backgroundColor: "rgba(255,255,255,0.07)",
                  },
                }}
              >
                <LinkedInIcon
                  sx={{
                    fontSize: 18,
                  }}
                />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>
    </React.Fragment>
  );
}
