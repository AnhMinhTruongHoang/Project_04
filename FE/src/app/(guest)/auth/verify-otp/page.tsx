"use client";

import * as React from "react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import MuiCard from "@mui/material/Card";
import MuiLink from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MarkEmailReadRoundedIcon from "@mui/icons-material/MarkEmailReadRounded";
import { styled } from "@mui/material/styles";
import { resendRegisterOtpAPI, verifyRegisterOtpAPI } from "@/utils/api";

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
    maxWidth: 480,
  },
}));

const AuthContainer = styled(Stack)(({ theme }) => ({
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
  "& .MuiInputBase-input": {
    textAlign: "center",
    letterSpacing: "0.35em",
    fontWeight: 900,
    fontSize: 22,
  },
  "& .MuiFormHelperText-root": {
    marginLeft: 0,
  },
};

const VerifyOtpContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"success" | "error">("error");

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setSeverity("error");
      setMessage("Email is required.");
      return;
    }

    if (!otp.trim()) {
      setSeverity("error");
      setMessage("OTP is required.");
      return;
    }

    try {
      setLoading(true);

      const res = await verifyRegisterOtpAPI({
        email: email.trim(),
        otp: otp.trim(),
      });

      if (res?.statusCode === 200 || res?.statusCode === 201) {
        setSeverity("success");
        setMessage(res?.message || "Verify OTP success.");

        setTimeout(() => {
          router.push("/auth/signin");
        }, 900);

        return;
      }

      setSeverity("error");
      setMessage(
        Array.isArray(res?.message)
          ? res.message[0]
          : res?.message || "Verify OTP failed."
      );
    } catch (error: any) {
      setSeverity("error");
      setMessage(error?.message || "Verify OTP failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      setSeverity("error");
      setMessage("Email is required.");
      return;
    }

    try {
      setResending(true);

      const res = await resendRegisterOtpAPI(email.trim());

      if (res?.statusCode === 200 || res?.statusCode === 201) {
        setSeverity("success");
        setMessage(res?.message || "OTP has been resent to your email.");
        return;
      }

      setSeverity("error");
      setMessage(
        Array.isArray(res?.message)
          ? res.message[0]
          : res?.message || "Resend OTP failed."
      );
    } catch (error: any) {
      setSeverity("error");
      setMessage(error?.message || "Resend OTP failed.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <CssBaseline />

      <AuthContainer direction="column" justifyContent="center">
        <Box
          component={NextLink}
          href="/auth/signin"
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
              sx={{
                width: 64,
                height: 64,
                bgcolor: "rgba(255,77,0,0.16)",
                color: "#FF7A00",
                border: "1px solid rgba(255,122,0,0.35)",
                boxShadow: "0 0 28px rgba(255,77,0,0.25)",
              }}
            >
              <MarkEmailReadRoundedIcon sx={{ fontSize: 34 }} />
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
              Verify OTP
            </Typography>

            <Typography
              sx={{ color: "#8B949E", textAlign: "center", fontSize: 14 }}
            >
              Enter the OTP code sent to your email.
            </Typography>
          </Box>

          {message && (
            <Alert severity={severity} sx={{ borderRadius: 2 }}>
              {message}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleVerify}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                Email
              </FormLabel>
              <TextField
                placeholder="your@email.com"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  ...inputSx,
                  "& .MuiInputBase-input": {
                    textAlign: "left",
                    letterSpacing: "normal",
                    fontWeight: 700,
                    fontSize: 16,
                  },
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel sx={{ color: "#E5E7EB", mb: 0.8, fontWeight: 600 }}>
                OTP Code
              </FormLabel>
              <TextField
                placeholder="000000"
                fullWidth
                inputProps={{ maxLength: 6 }}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setOtp(value);
                }}
                sx={inputSx}
              />
            </FormControl>

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
                },
                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.12)",
                },
              }}
            >
              {loading ? "Verifying..." : "Verify account"}
            </Button>

            <Button
              type="button"
              fullWidth
              disabled={resending}
              onClick={handleResendOtp}
              sx={{
                color: "#00FFE0",
                fontWeight: 800,
                textTransform: "none",
              }}
            >
              {resending ? "Sending..." : "Resend OTP"}
            </Button>

            <Typography
              sx={{ color: "#B8B8B8", textAlign: "center", fontSize: 14 }}
            >
              Already verified?{" "}
              <MuiLink
                component={NextLink}
                href="/auth/signin"
                sx={{
                  color: "#00FFE0",
                  fontWeight: 800,
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>
        </Card>
      </AuthContainer>
    </>
  );
};

const VerifyOtpPage = () => {
  return (
    <Suspense fallback={null}>
      <VerifyOtpContent />
    </Suspense>
  );
};

export default VerifyOtpPage;
