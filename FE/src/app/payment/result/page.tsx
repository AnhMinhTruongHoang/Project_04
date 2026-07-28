"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELED"
  | "EXPIRED"
  | "REFUNDED"
  | "INVALID"
  | "ERROR";

type PaymentData = {
  id?: string;
  orderCode?: string;
  planId?: string;
  subscriptionId?: string | null;
  provider?: string;
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  responseCode?: string | null;
  transactionStatus?: string | null;
  providerTransactionId?: string | null;
  failureReason?: string | null;
  paidAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
};

type ApiResponse<T> = {
  statusCode?: number;
  message?: string;
  data?: T;
};

const FINAL_STATUSES = new Set<PaymentStatus>([
  "PAID",
  "FAILED",
  "CANCELED",
  "EXPIRED",
  "REFUNDED",
  "INVALID",
  "ERROR",
]);

const VALID_STATUSES = new Set<PaymentStatus>([
  "PENDING",
  "PROCESSING",
  "PAID",
  "FAILED",
  "CANCELED",
  "EXPIRED",
  "REFUNDED",
  "INVALID",
  "ERROR",
]);

const normalizeStatus = (value: string | null): PaymentStatus => {
  const normalizedValue = value?.trim().toUpperCase() as
    | PaymentStatus
    | undefined;

  return normalizedValue && VALID_STATUSES.has(normalizedValue)
    ? normalizedValue
    : "PENDING";
};

const getAccessToken = (session: unknown): string | null => {
  if (!session || typeof session !== "object") {
    return null;
  }

  const sessionData = session as Record<string, unknown>;

  if (
    typeof sessionData.accessToken === "string" &&
    sessionData.accessToken.trim()
  ) {
    return sessionData.accessToken;
  }

  if (sessionData.user && typeof sessionData.user === "object") {
    const userData = sessionData.user as Record<string, unknown>;

    if (
      typeof userData.accessToken === "string" &&
      userData.accessToken.trim()
    ) {
      return userData.accessToken;
    }
  }

  return null;
};

const formatCurrency = (amount?: number, currency = "VND"): string => {
  if (typeof amount !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
};

export default function PaymentResultPage() {
  const router = useRouter();

  const { data: session, status: sessionStatus } = useSession();

  const [orderCode, setOrderCode] = useState("");

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("PENDING");

  const [payment, setPayment] = useState<PaymentData | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const backendUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000"
  ).replace(/\/+$/, "");

  const accessToken = getAccessToken(session);

  /*
   * =========================
   * READ VNPAY RETURN PARAMS
   * =========================
   */
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);

    const returnedOrderCode = parameters.get("orderCode")?.trim() ?? "";

    const returnedStatus = normalizeStatus(parameters.get("status"));

    setOrderCode(returnedOrderCode);
    setPaymentStatus(returnedStatus);

    if (!returnedOrderCode) {
      setError("Không tìm thấy mã giao dịch thanh toán.");

      setPaymentStatus("INVALID");
      setLoading(false);
    }
  }, []);

  /*
   * =========================
   * FETCH PAYMENT STATUS
   * =========================
   */
  const fetchPaymentStatus = useCallback(async (): Promise<PaymentStatus> => {
    if (!orderCode) {
      throw new Error("Không tìm thấy mã giao dịch.");
    }

    if (!accessToken) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const response = await fetch(
      `${backendUrl}/api/v1/payments/${encodeURIComponent(orderCode)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const result = (await response
      .json()
      .catch(() => null)) as ApiResponse<PaymentData> | null;

    if (!response.ok) {
      throw new Error(
        result?.message ?? "Không thể kiểm tra trạng thái thanh toán."
      );
    }

    if (!result?.data) {
      throw new Error("Dữ liệu giao dịch không hợp lệ.");
    }

    const currentStatus = normalizeStatus(result.data.status ?? null);

    setPayment(result.data);
    setPaymentStatus(currentStatus);
    setError(null);

    return currentStatus;
  }, [accessToken, backendUrl, orderCode]);

  /*
   * =========================
   * PAYMENT STATUS POLLING
   * =========================
   */
  useEffect(() => {
    if (!orderCode || sessionStatus === "loading") {
      return;
    }

    if (sessionStatus === "unauthenticated") {
      setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    if (sessionStatus === "authenticated" && !accessToken) {
      setError(
        "Phiên đăng nhập không chứa access token. Vui lòng đăng nhập lại."
      );
      setLoading(false);
      return;
    }

    let disposed = false;

    let timer: ReturnType<typeof setTimeout> | undefined;

    let attempt = 0;

    const maxAttempts = 30;

    const pollPayment = async () => {
      try {
        const currentStatus = await fetchPaymentStatus();

        if (disposed) {
          return;
        }

        setLoading(false);

        if (!FINAL_STATUSES.has(currentStatus) && attempt < maxAttempts) {
          attempt += 1;

          timer = setTimeout(pollPayment, 2000);
        }
      } catch (fetchError) {
        if (disposed) {
          return;
        }

        setLoading(false);

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Không thể kiểm tra trạng thái thanh toán."
        );
      }
    };

    pollPayment();

    return () => {
      disposed = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [accessToken, fetchPaymentStatus, orderCode, sessionStatus]);

  const handleSignInAgain = async () => {
    await signIn(undefined, {
      callbackUrl: window.location.href,
    });
  };

  /*
   * =========================
   * MANUAL REFRESH
   * =========================
   */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await fetchPaymentStatus();
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Không thể làm mới giao dịch."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const statusContent = useMemo(() => {
    switch (paymentStatus) {
      case "PAID":
        return {
          title: "Thanh toán thành công",
          description: "Gói đăng ký của bạn đã được kích hoạt.",
          chipLabel: "Đã thanh toán",
          chipColor: "success" as const,
        };

      case "FAILED":
        return {
          title: "Thanh toán thất bại",
          description:
            payment?.failureReason ?? "VNPAY không thể hoàn tất giao dịch.",
          chipLabel: "Thất bại",
          chipColor: "error" as const,
        };

      case "CANCELED":
        return {
          title: "Đã hủy thanh toán",
          description: "Bạn đã hủy giao dịch thanh toán.",
          chipLabel: "Đã hủy",
          chipColor: "warning" as const,
        };

      case "EXPIRED":
        return {
          title: "Giao dịch đã hết hạn",
          description:
            "Thời gian thanh toán đã hết. Vui lòng tạo giao dịch mới.",
          chipLabel: "Hết hạn",
          chipColor: "warning" as const,
        };

      case "REFUNDED":
        return {
          title: "Giao dịch đã hoàn tiền",
          description: "Khoản thanh toán đã được hoàn lại.",
          chipLabel: "Đã hoàn tiền",
          chipColor: "info" as const,
        };

      case "INVALID":
        return {
          title: "Dữ liệu thanh toán không hợp lệ",
          description: "Không thể xác minh kết quả trả về từ VNPAY.",
          chipLabel: "Không hợp lệ",
          chipColor: "error" as const,
        };

      case "ERROR":
        return {
          title: "Có lỗi xảy ra",
          description: "Không thể xử lý kết quả thanh toán.",
          chipLabel: "Lỗi",
          chipColor: "error" as const,
        };

      case "PROCESSING":
      case "PENDING":
      default:
        return {
          title: "Đang xác nhận thanh toán",
          description: "Hệ thống đang chờ VNPAY xác nhận giao dịch.",
          chipLabel: "Đang xử lý",
          chipColor: "info" as const,
        };
    }
  }, [payment?.failureReason, paymentStatus]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0d0d0d",
        color: "#ffffff",
        px: {
          xs: 2,
          sm: 3,
        },
        py: {
          xs: 4,
          md: 8,
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 680,
          mx: "auto",
          bgcolor: "#171717",
          color: "#ffffff",
          border: "1px solid #2c2c2c",
          borderRadius: 3,
          p: {
            xs: 2.5,
            sm: 4,
          },
        }}
      >
        {/* PAYMENT STATUS HEADER */}
        <Stack spacing={2} alignItems="center" textAlign="center">
          {(loading ||
            paymentStatus === "PENDING" ||
            paymentStatus === "PROCESSING") && (
            <CircularProgress size={46} thickness={4} />
          )}

          <Chip
            label={statusContent.chipLabel}
            color={statusContent.chipColor}
            variant="filled"
          />

          <Typography
            component="h1"
            variant="h4"
            fontWeight={700}
            sx={{
              fontSize: {
                xs: "1.65rem",
                sm: "2.125rem",
              },
            }}
          >
            {statusContent.title}
          </Typography>

          <Typography
            color="#bdbdbd"
            sx={{
              maxWidth: 520,
            }}
          >
            {statusContent.description}
          </Typography>
        </Stack>

        {error && (
          <Alert
            severity="error"
            sx={{
              mt: 3,
              bgcolor: "rgba(211, 47, 47, 0.14)",
              color: "#ffffff",
              border: "1px solid rgba(239, 83, 80, 0.45)",
              "& .MuiAlert-icon": {
                color: "#ef5350",
              },
            }}
          >
            {error}
          </Alert>
        )}

        <Divider
          sx={{
            my: 3,
            borderColor: "#303030",
          }}
        />

        {/* PAYMENT DETAILS */}
        <Stack spacing={1.8}>
          <PaymentDetailRow
            label="Mã giao dịch"
            value={payment?.orderCode ?? orderCode ?? "—"}
          />

          <PaymentDetailRow
            label="Nhà cung cấp"
            value={payment?.provider ?? "VNPAY"}
          />

          <PaymentDetailRow
            label="Số tiền"
            value={formatCurrency(payment?.amount, payment?.currency ?? "VND")}
          />

          <PaymentDetailRow
            label="Thời gian tạo"
            value={formatDateTime(payment?.createdAt)}
          />

          <PaymentDetailRow
            label="Thời gian thanh toán"
            value={formatDateTime(payment?.paidAt)}
          />

          <PaymentDetailRow
            label="Mã giao dịch VNPAY"
            value={payment?.providerTransactionId ?? "—"}
          />
        </Stack>

        {/* MOBILE AND DESKTOP ACTIONS */}
        {sessionStatus === "unauthenticated" && (
          <Button
            fullWidth
            variant="contained"
            color="error"
            onClick={handleSignInAgain}
            sx={{
              minHeight: 46,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            Đăng nhập lại
          </Button>
        )}
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.5}
          mt={4}
        >
          <Button
            fullWidth
            variant="contained"
            onClick={handleRefresh}
            disabled={refreshing || sessionStatus === "loading"}
            sx={{
              minHeight: 46,
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            {refreshing ? "Đang kiểm tra..." : "Kiểm tra lại"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            onClick={() => router.push("/")}
            sx={{
              minHeight: 46,
              color: "#ffffff",
              borderColor: "#555555",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                borderColor: "#ffffff",
                bgcolor: "rgba(255,255,255,0.06)",
              },
            }}
          >
            Về trang chủ
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

function PaymentDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      spacing={{
        xs: 0.5,
        sm: 2,
      }}
      justifyContent="space-between"
      sx={{
        py: 0.75,
      }}
    >
      <Typography color="#9e9e9e" fontSize="0.95rem">
        {label}
      </Typography>

      <Typography
        fontWeight={600}
        sx={{
          color: "#ffffff",
          textAlign: {
            xs: "left",
            sm: "right",
          },
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}
