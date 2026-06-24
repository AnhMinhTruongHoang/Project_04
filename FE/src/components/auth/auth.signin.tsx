"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { signIn } from "next-auth/react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CssBaseline from "@mui/material/CssBaseline";
import FormControlLabel from "@mui/material/FormControlLabel";
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
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import { styled } from "@mui/material/styles";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  borderRadius: 18,
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background:
    "linear-gradient(180deg, rgba(18, 20, 22, 0.95), rgba(10, 12, 14, 0.96))",
  boxShadow:
    "0 24px 80px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04)",
  backdropFilter: "blur(14px)",
  [theme.breakpoints.up("sm")]: {
    maxWidth: 450,
  },
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
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
      "radial-gradient(circle at 50% 20%, rgba(255, 85, 0, 0.22), transparent 32%), radial-gradient(circle at 80% 70%, rgba(0, 255, 224, 0.14), transparent 28%), linear-gradient(135deg, #050607 0%, #101214 45%, #1E2021 100%)",
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

const AuthSignIn = (props: any) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [isErrorUsername, setIsErrorUsername] = useState<boolean>(false);
  const [isErrorPassword, setIsErrorPassword] = useState<boolean>(false);

  const [errorUsername, setErrorUsername] = useState<string>("");
  const [errorPassword, setErrorPassword] = useState<string>("");

  const [openMessage, setOpenMessage] = useState<boolean>(false);
  const [resMessage, setResMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const validateInputs = () => {
    let isValid = true;

    setIsErrorUsername(false);
    setIsErrorPassword(false);
    setErrorUsername("");
    setErrorPassword("");

    if (!username.trim()) {
      setIsErrorUsername(true);
      setErrorUsername("Username is not empty.");
      isValid = false;
    }

    if (!password.trim()) {
      setIsErrorPassword(true);
      setErrorPassword("Password is not empty.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!validateInputs()) return;

    try {
      setLoading(true);

      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!res?.error) {
        router.push("/");
      } else {
        setOpenMessage(true);
        setResMessage(res.error);
      }
    } catch (error) {
      setOpenMessage(true);
      setResMessage("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CssBaseline />

      <SignInContainer direction="column" justifyContent="center">
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
              alt="SoundClone Logo"
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
                fontWeight: 800,
                color: "#fff",
              }}
            >
              Sign in
            </Typography>

            <Typography
              sx={{
                color: "#8B949E",
                textAlign: "center",
                fontSize: 14,
              }}
            >
              Welcome back to SoundClone
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
              <FormLabel
                htmlFor="username"
                sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}
              >
                Username
              </FormLabel>

              <TextField
                id="username"
                name="username"
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
                required
                fullWidth
                variant="outlined"
                value={username}
                error={isErrorUsername}
                helperText={errorUsername}
                onChange={(event) => setUsername(event.target.value)}
                sx={{
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
                  "& .MuiInputBase-input::placeholder": {
                    color: "#8B949E",
                    opacity: 1,
                  },
                  "& .MuiFormHelperText-root": {
                    marginLeft: 0,
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel
                htmlFor="password"
                sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}
              >
                Password
              </FormLabel>

              <TextField
                id="password"
                name="password"
                placeholder="••••••"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                fullWidth
                variant="outlined"
                value={password}
                error={isErrorPassword}
                helperText={errorPassword}
                onChange={(event) => setPassword(event.target.value)}
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
                sx={{
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
                  "& .MuiInputBase-input::placeholder": {
                    color: "#8B949E",
                    opacity: 1,
                  },
                  "& .MuiFormHelperText-root": {
                    marginLeft: 0,
                  },
                }}
              />
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  sx={{
                    color: "#8B949E",
                    "&.Mui-checked": {
                      color: "#00FFE0",
                    },
                  }}
                />
              }
              label="Remember me"
              sx={{
                color: "#B8B8B8",
                width: "fit-content",
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.25,
                borderRadius: 2,
                fontWeight: 800,
                textTransform: "none",
                fontSize: 16,
                color: "#fff",
                background: "linear-gradient(135deg, #FF4D00, #FF7A00)",
                boxShadow: "0 12px 28px rgba(255, 77, 0, 0.28)",
                "&:hover": {
                  background: "linear-gradient(135deg, #FF6A00, #FF9100)",
                  boxShadow: "0 16px 34px rgba(255, 77, 0, 0.35)",
                },
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </Box>

          <Divider
            sx={{
              color: "#8B949E",
              "&::before, &::after": {
                borderColor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            or
          </Divider>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={() => signIn("google")}
              sx={{
                py: 1.15,
                borderRadius: 2,
                textTransform: "none",
                color: "#E5E7EB",
                borderColor: "rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.03)",
                "&:hover": {
                  borderColor: "rgba(0,255,224,0.45)",
                  background: "rgba(0,255,224,0.08)",
                  color: "#00FFE0",
                },
              }}
            >
              Sign in with Google
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={() => signIn("github")}
              sx={{
                py: 1.15,
                borderRadius: 2,
                textTransform: "none",
                color: "#E5E7EB",
                borderColor: "rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.03)",
                "&:hover": {
                  borderColor: "rgba(0,255,224,0.45)",
                  background: "rgba(0,255,224,0.08)",
                  color: "#00FFE0",
                },
              }}
            >
              Sign in with GitHub
            </Button>

            <Typography sx={{ textAlign: "center", color: "#B8B8B8", mt: 1 }}>
              Don&apos;t have an account?{" "}
              <MuiLink
                component={NextLink}
                href="/auth/signup"
                sx={{
                  color: "#00FFE0",
                  fontWeight: 700,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Sign up
              </MuiLink>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>

      <Snackbar
        open={openMessage}
        autoHideDuration={5000}
        onClose={() => setOpenMessage(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenMessage(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {resMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AuthSignIn;
