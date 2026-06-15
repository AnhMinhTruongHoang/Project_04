"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { sendRequest } from "@/utils/api";
import {
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
} from "@mui/material";
import TermsModal from "./termsModal";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.1)",
  background:
    "linear-gradient(180deg, rgba(18,20,22,0.95), rgba(10,12,14,0.96))",
  boxShadow: "0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)",
  backdropFilter: "blur(14px)",
  [theme.breakpoints.up("sm")]: {
    maxWidth: 520,
  },
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
  position: "relative",
  minHeight: "100vh",
  padding: theme.spacing(2),
  overflow: "hidden",
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(4),
  },
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -2,
    background:
      "radial-gradient(circle at 50% 20%, rgba(255,85,0,0.22), transparent 32%), radial-gradient(circle at 80% 70%, rgba(0,255,224,0.14), transparent 28%), linear-gradient(135deg, #050607 0%, #101214 45%, #1E2021 100%)",
  },
  "&::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    zIndex: -1,
    background:
      "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
    backgroundSize: "42px 42px",
    maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), rgba(0,0,0,0.25))",
  },
}));

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#fff",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 2,
    "& fieldset": {
      borderColor: "rgba(255,255,255,0.16)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(0,255,224,0.45)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#00FFE0",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#8B949E",
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#8B949E",
    opacity: 1,
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
  },
  "& .MuiSelect-icon": {
    color: "#8B949E",
  },
};

const AuthSignUp = () => {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("MALE");
  const [address, setAddress] = useState("");

  const [agree, setAgree] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [error, setError] = useState<Record<string, string>>({});
  const [openMessage, setOpenMessage] = useState(false);
  const [resMessage, setResMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error">("error");

  const validateInputs = () => {
    const nextError: Record<string, string> = {};

    if (!name.trim()) nextError.name = "Name is required.";
    if (!email.trim()) {
      nextError.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      nextError.email = "Email is invalid.";
    }

    if (!password.trim()) {
      nextError.password = "Password is required.";
    } else if (password.length < 3) {
      nextError.password = "Password must be at least 3 characters.";
    }

    if (!rePassword.trim()) {
      nextError.rePassword = "Please re-enter your password.";
    } else if (rePassword !== password) {
      nextError.rePassword = "Passwords do not match.";
    }
    if (!age.trim()) {
      nextError.age = "Age is required.";
    } else if (Number.isNaN(Number(age)) || Number(age) <= 0) {
      nextError.age = "Age is invalid.";
    }

    if (!address.trim()) nextError.address = "Address is required.";

    if (!agree) {
      nextError.agree = "You must agree to the terms and privacy policy.";
    }

    setError(nextError);

    return Object.keys(nextError).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) return;

    try {
      setLoading(true);

      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/register`,
        method: "POST",
        body: {
          name,
          email,
          password,
          age,
          gender,
          address,
        },
      });

      if (res?.statusCode === 201 || res?.statusCode === 200) {
        setSeverity("success");
        setResMessage(res?.message || "Register success.");
        setOpenMessage(true);

        setTimeout(() => {
          router.push("/auth/signin");
        }, 1000);
      } else {
        setSeverity("error");
        setResMessage(
          Array.isArray(res?.message)
            ? res.message[0]
            : res?.message || "Register failed."
        );
        setOpenMessage(true);
      }
    } catch (err: any) {
      setSeverity("error");
      setResMessage(err?.message || "Register failed. Please try again.");
      setOpenMessage(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />

      <SignUpContainer direction="column" justifyContent="center">
        <Box
          component={NextLink}
          href="/"
          sx={{
            position: "fixed",
            top: 20,
            left: 20,
            zIndex: 10,
            width: 42,
            height: 42,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            textDecoration: "none",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
            transition: "0.25s",
            "&:hover": {
              color: "#00FFE0",
              borderColor: "rgba(0,255,224,0.45)",
              background: "rgba(0,255,224,0.08)",
            },
          }}
        >
          <ArrowBackIcon />
        </Box>

        <Card variant="outlined">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Avatar
              src="/images/logo/Sc.png"
              alt="SoundCloud Logo"
              sx={{
                width: 60,
                height: 60,
                bgcolor: "rgba(255,77,0,0.16)",
                border: "1px solid rgba(255,122,0,0.35)",
                boxShadow: "0 0 28px rgba(255,77,0,0.25)",
                p: 0.6,
                "& img": {
                  objectFit: "contain",
                },
              }}
            >
              <PersonAddAlt1Icon />
            </Avatar>

            <Typography
              component="h1"
              variant="h4"
              sx={{
                width: "100%",
                textAlign: "center",
                fontSize: "clamp(2rem, 8vw, 2.3rem)",
                fontWeight: 900,
                color: "#fff",
              }}
            >
              Sign Up
            </Typography>

            <Typography
              sx={{ color: "#8B949E", textAlign: "center", fontSize: 14 }}
            >
              Create your SoundCloud Clone account
            </Typography>

            <Typography
              sx={{ textAlign: "center", color: "#B8B8B8", fontSize: 14 }}
            >
              Already have an account?{" "}
              <MuiLink
                component={NextLink}
                href="/auth/signin"
                sx={{
                  color: "#00FFE0",
                  fontWeight: 700,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
              mt: 1,
            }}
          >
            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                Name
              </FormLabel>
              <TextField
                placeholder="Enter your name"
                fullWidth
                value={name}
                error={!!error.name}
                helperText={error.name}
                onChange={(e) => setName(e.target.value)}
                sx={inputSx}
              />
            </FormControl>
            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                Email
              </FormLabel>
              <TextField
                placeholder="your@email.com"
                type="email"
                fullWidth
                value={email}
                error={!!error.email}
                helperText={error.email}
                onChange={(e) => setEmail(e.target.value)}
                sx={inputSx}
              />
            </FormControl>
            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                Password
              </FormLabel>
              <TextField
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={password}
                error={!!error.password}
                helperText={error.password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "#8B949E" }}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </FormControl>
            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                Re Password
              </FormLabel>

              <TextField
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                fullWidth
                value={rePassword}
                error={!!error.rePassword}
                helperText={error.rePassword}
                onChange={(e) => setRePassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "#8B949E" }}
                      >
                        {showPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={inputSx}
              />
            </FormControl>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <FormControl>
                <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                  Age
                </FormLabel>
                <TextField
                  type="number"
                  fullWidth
                  value={age}
                  error={!!error.age}
                  helperText={error.age}
                  onChange={(e) => setAge(e.target.value)}
                  sx={inputSx}
                />
              </FormControl>

              <FormControl>
                <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                  Gender
                </FormLabel>
                <TextField
                  select
                  fullWidth
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  sx={inputSx}
                >
                  <MenuItem value="MALE">Male</MenuItem>
                  <MenuItem value="FEMALE">Female</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              </FormControl>
            </Box>
            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                Address
              </FormLabel>
              <TextField
                placeholder="Vietnam"
                fullWidth
                value={address}
                error={!!error.address}
                helperText={error.address}
                onChange={(e) => setAddress(e.target.value)}
                sx={inputSx}
              />
            </FormControl>
            <Divider
              sx={{
                color: "#8B949E",
                "&::before, &::after": {
                  borderColor: "rgba(255,255,255,0.12)",
                },
              }}
            >
              Term of service
            </Divider>
            <Box sx={{ mt: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    sx={{
                      color: "#8B949E",
                      p: "0",
                      minWidth: "auto",
                      marginRight: "8px",
                      "&.Mui-checked": {
                        color: "#00FFE0",
                      },
                    }}
                  />
                }
                label={
                  <Box
                    component="span"
                    sx={{
                      display: "inline",
                      color: "#B8B8B8",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    I agree to the{" "}
                    <MuiLink
                      component="button"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsModalOpen(true);
                      }}
                      sx={{
                        display: "inline",
                        color: "#00FFE0",
                        fontSize: 14,
                        fontWeight: 800,
                        textDecoration: "none",
                        verticalAlign: "baseline",
                        p: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Terms of Service
                    </MuiLink>{" "}
                    and{" "}
                    <MuiLink
                      component="button"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsModalOpen(true);
                      }}
                      sx={{
                        display: "inline",
                        color: "#00FFE0",
                        fontSize: 14,
                        fontWeight: 800,
                        textDecoration: "none",
                        verticalAlign: "baseline",
                        p: 0,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Privacy Policy
                    </MuiLink>
                    .
                  </Box>
                }
                sx={{
                  alignItems: "center",
                  m: 0,
                  color: "#B8B8B8",
                  "& .MuiFormControlLabel-label": {
                    display: "inline",
                    marginLeft: 0,
                  },
                }}
              />

              {error.agree && (
                <Typography
                  sx={{
                    color: "#ff4d4f",
                    fontSize: 12,
                    mt: 0.5,
                    ml: 4,
                  }}
                >
                  {error.agree}
                </Typography>
              )}

              {/* Checkbox nhận thông báo bằng tiếng Anh - không bắt buộc */}
              <FormControlLabel
                control={
                  <Checkbox
                    sx={{
                      color: "#8B949E",
                      p: "0",
                      minWidth: "auto",
                      marginRight: "8px",
                      "&.Mui-checked": {
                        color: "#00FFE0",
                      },
                    }}
                  />
                }
                label={
                  <Box
                    component="span"
                    sx={{
                      display: "inline",
                      color: "#B8B8B8",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    I want to receive notifications in English
                  </Box>
                }
                sx={{
                  alignItems: "center",
                  m: 0,
                  mt: 1.5,
                  color: "#B8B8B8",
                  "& .MuiFormControlLabel-label": {
                    display: "inline",
                    marginLeft: 0,
                  },
                }}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.25,
                borderRadius: 2,
                fontWeight: 900,
                textTransform: "none",
                fontSize: 16,
                color: "#fff",
                background: "linear-gradient(135deg, #FF4D00, #FF7A00)",
                boxShadow: "0 12px 28px rgba(255,77,0,0.28)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FF6A00, #FF9100)",
                  boxShadow: "0 16px 34px rgba(255,77,0,0.35)",
                },
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </Box>
        </Card>
      </SignUpContainer>

      <TermsModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        onAgree={() => setAgree(true)}
      />
    </>
  );
};

export default AuthSignUp;
