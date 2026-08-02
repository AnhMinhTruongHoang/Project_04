"use client";

import { useCallback, useMemo, useState } from "react";
import dayjs from "dayjs";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import {
  createAdminEarningRateApi,
  getActiveAdminEarningRateApi,
  getAdminEarningRatesApi,
} from "@/utils/api";

import { useToast } from "@/utils/toast";

const formatMoney = (value?: number | null) => {
  const normalizedValue = Number.isFinite(Number(value)) ? Number(value) : 0;

  return `${new Intl.NumberFormat("vi-VN").format(normalizedValue)} ₫`;
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = dayjs(value);

  return date.isValid() ? date.format("DD/MM/YYYY HH:mm") : "—";
};

const getStatusStyle = (status?: string | null) => {
  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();

  if (normalizedStatus === "ACTIVE") {
    return {
      color: "#63e6a6",
      backgroundColor: "rgba(99,230,166,0.12)",
      border: "1px solid rgba(99,230,166,0.28)",
    };
  }

  if (normalizedStatus === "SCHEDULED") {
    return {
      color: "#ffbd69",
      backgroundColor: "rgba(255,189,105,0.12)",
      border: "1px solid rgba(255,189,105,0.3)",
    };
  }

  return {
    color: "#aeb4bb",
    backgroundColor: "rgba(174,180,187,0.1)",
    border: "1px solid rgba(174,180,187,0.22)",
  };
};

const RateStatusChip = ({ status }: { status?: string | null }) => {
  const normalizedStatus = String(status || "UNKNOWN")
    .trim()
    .toUpperCase();

  return (
    <Chip
      size="small"
      label={normalizedStatus}
      sx={{
        ...getStatusStyle(normalizedStatus),
        height: 26,
        fontSize: 10,
        fontWeight: 900,

        "& .MuiChip-label": {
          color: "inherit",
          px: 1.1,
        },
      }}
    />
  );
};

const EarningRatesTable = ({
  initialRates,
  initialActiveRate,
  initialMeta,
  accessToken,
}: EarningRatesTableProps) => {
  const toast = useToast();

  const [rates, setRates] = useState<IEarningRate[]>(initialRates);

  const [activeRate, setActiveRate] = useState<IEarningRate | null>(
    initialActiveRate
  );

  const [meta, setMeta] = useState<IEarningRateHistoryMeta>(initialMeta);

  const [searchValue, setSearchValue] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [amountPerStream, setAmountPerStream] = useState("25");

  const [applyMode, setApplyMode] = useState("NOW");

  const [scheduledAt, setScheduledAt] = useState("");

  const [reason, setReason] = useState("");

  /* =========================
     FILTERED RATE HISTORY
  ========================= */

  const filteredRates = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) {
      return rates;
    }

    return rates.filter((rate) => {
      return [
        rate.id,
        rate.amountPerStream,
        rate.currency,
        rate.status,
        rate.reason,
        rate.createdBy,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [rates, searchValue]);

  /* =========================
     RELOAD RATE DATA
  ========================= */

  const reloadRates = useCallback(
    async (showSuccess = false) => {
      if (!accessToken) {
        toast.error("Please login first.");

        return;
      }

      setRefreshing(true);

      try {
        const [historyResponse, activeResponse] = await Promise.all([
          getAdminEarningRatesApi(accessToken, {
            current: 1,
            pageSize: 100,
          }),

          getActiveAdminEarningRateApi(accessToken),
        ]);

        if (historyResponse?.statusCode !== 200) {
          toast.error(historyResponse?.message || "Cannot load earning rates.");

          return;
        }

        const historyData = historyResponse?.data;
        const historyResult = historyData?.result;

        const nextRates: IEarningRate[] = Array.isArray(historyResult)
          ? historyResult
          : [];

        setRates(nextRates);

        setMeta({
          current: Number(historyData?.meta?.current) || 1,

          pageSize: Number(historyData?.meta?.pageSize) || 100,

          pages: Number(historyData?.meta?.pages) || 0,

          total: Number(historyData?.meta?.total) || nextRates.length,
        });

        if (activeResponse?.statusCode === 200 && activeResponse?.data) {
          setActiveRate(activeResponse.data);
        } else {
          setActiveRate(
            nextRates.find(
              (rate) => String(rate.status || "").toUpperCase() === "ACTIVE"
            ) || null
          );
        }

        if (showSuccess) {
          toast.success("Earning rates refreshed.");
        }
      } catch (error) {
        console.error("Cannot reload earning rates:", error);

        toast.error("Cannot load earning rates.");
      } finally {
        setRefreshing(false);
      }
    },
    [accessToken, toast]
  );

  /* =========================
     OPEN CREATE DIALOG
  ========================= */

  const handleOpenDialog = () => {
    const suggestedAmount =
      Number(activeRate?.amountPerStream) > 0
        ? String(activeRate?.amountPerStream)
        : "20";

    setAmountPerStream(suggestedAmount);

    setApplyMode("NOW");

    setScheduledAt("");

    setReason("");

    setDialogOpen(true);
  };

  /* =========================
     CREATE NEW RATE
  ========================= */

  const handleCreateRate = async () => {
    if (!accessToken) {
      toast.error("Please login first.");

      return;
    }

    const normalizedAmount = Number(amountPerStream);

    if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
      toast.error("Amount per stream must be a positive integer.");

      return;
    }

    if (normalizedAmount > 100000) {
      toast.error("Amount per stream cannot exceed 100,000 VND.");

      return;
    }

    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      toast.error("Adjustment reason is required.");

      return;
    }

    let effectiveFrom: string | null = null;

    if (applyMode === "SCHEDULED") {
      if (!scheduledAt) {
        toast.error("Scheduled time is required.");

        return;
      }

      const selectedTime = dayjs(scheduledAt);

      if (!selectedTime.isValid()) {
        toast.error("Scheduled time is invalid.");

        return;
      }

      if (!selectedTime.isAfter(dayjs())) {
        toast.error("Scheduled time must be in the future.");

        return;
      }

      effectiveFrom = selectedTime.format("YYYY-MM-DDTHH:mm:ss");
    }

    const payload: CreateEarningRatePayload = {
      amountPerStream: normalizedAmount,

      currency: "VND",

      effectiveFrom,

      reason: normalizedReason,
    };

    setSubmitting(true);

    try {
      const response = await createAdminEarningRateApi(payload, accessToken);

      if (response?.statusCode !== 201 || !response?.data) {
        toast.error(response?.message || "Cannot create earning rate.");

        return;
      }

      const createdRate = response.data;

      toast.success(
        createdRate.status === "SCHEDULED"
          ? "Earning rate scheduled successfully."
          : "Earning rate activated successfully."
      );

      setDialogOpen(false);

      await reloadRates(false);
    } catch (error) {
      console.error("Cannot create earning rate:", error);

      toast.error("Cannot create earning rate.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     DATA GRID COLUMNS
  ========================= */

  const columns = useMemo<GridColDef<IEarningRate>[]>(
    () => [
      {
        field: "amountPerStream",

        headerName: "Rate",

        width: 160,

        align: "right",

        headerAlign: "right",

        renderCell: (params) => (
          <Box
            sx={{
              width: "100%",
              textAlign: "right",
            }}
          >
            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 900,
              }}
            >
              {formatMoney(params.row.amountPerStream)}
            </Typography>

            <Typography
              sx={{
                color: "#777d83",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              per qualified stream
            </Typography>
          </Box>
        ),
      },

      {
        field: "status",

        headerName: "Status",

        width: 130,

        renderCell: (params) => <RateStatusChip status={params.row.status} />,
      },

      {
        field: "effectiveFrom",

        headerName: "Effective from",

        width: 180,

        valueFormatter: (params) => formatDateTime(params.value),
      },

      {
        field: "effectiveTo",

        headerName: "Effective to",

        width: 180,

        valueFormatter: (params) => formatDateTime(params.value),
      },

      {
        field: "reason",

        headerName: "Reason",

        flex: 1,

        minWidth: 260,

        renderCell: (params) => (
          <Tooltip title={params.row.reason || "No reason"} arrow>
            <Typography
              sx={{
                width: "100%",
                color: "#d6d6d6",
                fontSize: 13,
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {params.row.reason || "No reason"}
            </Typography>
          </Tooltip>
        ),
      },

      {
        field: "createdBy",

        headerName: "Created by",

        width: 210,

        renderCell: (params) => (
          <Tooltip title={params.row.createdBy || "Unknown"} arrow>
            <Typography
              sx={{
                width: "100%",
                color: "#b7bdc3",
                fontSize: 12,
                fontWeight: 800,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {params.row.createdBy || "Unknown"}
            </Typography>
          </Tooltip>
        ),
      },

      {
        field: "createdAt",

        headerName: "Created",

        width: 180,

        valueFormatter: (params) => formatDateTime(params.value),
      },
    ],
    []
  );

  return (
    <Box>
      {/* ACTIVE RATE SUMMARY */}
      <Box
        sx={{
          mb: 3,
          p: {
            xs: 2,
            sm: 2.5,
            md: 3,
          },
          borderRadius: 3,
          background:
            "linear-gradient(135deg, rgba(255,122,47,0.16), rgba(17,19,20,0.96) 55%)",
          border: "1px solid rgba(255,122,47,0.24)",
          overflow: "hidden",
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2.5}
          alignItems={{
            xs: "stretch",
            md: "center",
          }}
          justifyContent="space-between"
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                color: "#ff9a5f",
                backgroundColor: "rgba(255,122,47,0.14)",
                border: "1px solid rgba(255,122,47,0.24)",
              }}
            >
              <CurrencyExchangeRoundedIcon />
            </Box>

            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  color: "#9da3a8",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                Current earning rate
              </Typography>

              <Typography
                sx={{
                  mt: 0.3,
                  color: "#ffffff",
                  fontSize: {
                    xs: 27,
                    sm: 32,
                  },
                  lineHeight: 1.15,
                  fontWeight: 950,
                }}
              >
                {activeRate
                  ? formatMoney(activeRate.amountPerStream)
                  : "No active rate"}
              </Typography>

              <Typography
                sx={{
                  mt: 0.6,
                  color: "#a7adb2",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {activeRate
                  ? `Per qualified stream · Effective since ${formatDateTime(
                      activeRate.effectiveFrom
                    )}`
                  : "Create an earning rate to enable artist earnings."}
              </Typography>
            </Box>
          </Box>

          {/* DESKTOP AND MOBILE ACTIONS */}
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.2}
            sx={{
              flexShrink: 0,
            }}
          >
            <Button
              variant="outlined"
              startIcon={
                refreshing ? (
                  <CircularProgress
                    size={16}
                    sx={{
                      color: "#ffffff",
                    }}
                  />
                ) : (
                  <RefreshRoundedIcon />
                )
              }
              disabled={refreshing}
              onClick={() => void reloadRates(true)}
              sx={{
                minHeight: 44,
                color: "#ffffff",
                fontWeight: 900,
                textTransform: "none",
                borderColor: "rgba(255,255,255,0.18)",

                "&:hover": {
                  borderColor: "rgba(255,255,255,0.35)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                },

                "&.Mui-disabled": {
                  color: "rgba(255,255,255,0.45)",
                  borderColor: "rgba(255,255,255,0.1)",
                },
              }}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenDialog}
              sx={{
                minHeight: 44,
                px: 2.2,
                color: "#ffffff",
                fontWeight: 900,
                textTransform: "none",
                backgroundColor: "#ff6b1f",

                "&:hover": {
                  backgroundColor: "#ff7a2f",
                },
              }}
            >
              Create new rate
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* HISTORY HEADER */}
      <Box
        sx={{
          mb: 1.5,
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 1.5,
          alignItems: {
            xs: "stretch",
            sm: "center",
          },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <HistoryRoundedIcon
              sx={{
                color: "#ff8a45",
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontSize: 18,
                fontWeight: 950,
              }}
            >
              Rate history
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 0.4,
              color: "#7f858a",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {meta.total} earning rate version
            {meta.total === 1 ? "" : "s"}
          </Typography>
        </Box>

        <TextField
          size="small"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search rate history..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon
                  sx={{
                    color: "#777d83",
                    fontSize: 20,
                  }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            width: {
              xs: "100%",
              sm: 300,
            },

            "& .MuiInputBase-root": {
              color: "#ffffff",
              backgroundColor: "#111314",
            },

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.12)",
            },

            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255,255,255,0.25)",
            },

            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "#ff7a2f",
              },

            "& input::placeholder": {
              color: "#6f757b",
              opacity: 1,
            },
          }}
        />
      </Box>

      {/* MOBILE RATE CARDS */}
      <Stack
        spacing={1.4}
        sx={{
          display: {
            xs: "flex",
            md: "none",
          },
        }}
      >
        {filteredRates.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              borderRadius: 3,
              color: "#868c91",
              backgroundColor: "#111314",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            No earning rates found.
          </Box>
        ) : (
          filteredRates.map((rate) => (
            <Box
              key={rate.id}
              sx={{
                p: 2,
                borderRadius: 2.5,
                backgroundColor: "#111314",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="flex-start"
                justifyContent="space-between"
              >
                <Box>
                  <Typography
                    sx={{
                      color: "#ffffff",
                      fontSize: 22,
                      fontWeight: 950,
                    }}
                  >
                    {formatMoney(rate.amountPerStream)}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#777d83",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    per qualified stream
                  </Typography>
                </Box>

                <RateStatusChip status={rate.status} />
              </Stack>

              <Divider
                sx={{
                  my: 1.5,
                  borderColor: "rgba(255,255,255,0.07)",
                }}
              />

              <Stack spacing={1}>
                <Box>
                  <Typography
                    sx={{
                      color: "#777d83",
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    Effective period
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      color: "#d7d7d7",
                      fontSize: 12,
                      fontWeight: 750,
                    }}
                  >
                    {formatDateTime(rate.effectiveFrom)}
                    {" → "}
                    {formatDateTime(rate.effectiveTo)}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#777d83",
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    Reason
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      color: "#d7d7d7",
                      fontSize: 12,
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {rate.reason || "No reason"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: "#777d83",
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: "uppercase",
                    }}
                  >
                    Created by
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.2,
                      color: "#aeb4bb",
                      fontSize: 11,
                      fontWeight: 700,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {rate.createdBy || "Unknown"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))
        )}
      </Stack>

      {/* DESKTOP RATE TABLE */}
      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.08)",

          "& .MuiDataGrid-root": {
            border: "none",
            color: "#ffffff",
            backgroundColor: "#111314",
          },

          "& .MuiDataGrid-columnHeaders": {
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            color: "#ffffff",
            fontWeight: 900,
          },

          "& .MuiDataGrid-sortIcon": {
            color: "#ffffff",
          },

          "& .MuiDataGrid-menuIconButton": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-iconSeparator": {
            color: "rgba(255,255,255,0.25)",
          },

          "& .MuiDataGrid-cell": {
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255,255,255,0.035)",
          },

          "& .MuiDataGrid-footerContainer": {
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiTablePagination-root": {
            color: "#ffffff",
          },

          "& .MuiTablePagination-actions .MuiIconButton-root": {
            color: "#ffffff",
          },

          "& .MuiDataGrid-overlay": {
            color: "#8f959a",
            backgroundColor: "#111314",
            fontWeight: 800,
          },
        }}
      >
        <DataGrid
          rows={filteredRates}
          columns={columns}
          getRowId={(row) => row.id}
          rowHeight={64}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20, 50]}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
                page: 0,
              },
            },
          }}
        />
      </Box>

      {/* CREATE EARNING RATE DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (submitting) {
            return;
          }

          setDialogOpen(false);
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            mx: {
              xs: 1.5,
              sm: 3,
            },
            width: "100%",
            color: "#ffffff",
            backgroundColor: "#181A1B",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            color: "#ffffff",
            fontWeight: 950,
          }}
        >
          Create earning rate
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              mb: 2.5,
              color: "#969ca1",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Historical earnings will keep their original rate. The new rate only
            applies from its effective time.
          </Typography>

          <Stack spacing={2}>
            {/* RATE AMOUNT INPUT */}
            <TextField
              fullWidth
              type="number"
              label="Amount per qualified stream"
              value={amountPerStream}
              onChange={(event) => setAmountPerStream(event.target.value)}
              inputProps={{
                min: 1,
                max: 100000,
                step: 1,
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PaymentsRoundedIcon
                      sx={{
                        color: "#ff8a45",
                      }}
                    />
                  </InputAdornment>
                ),

                endAdornment: (
                  <InputAdornment position="end">VND</InputAdornment>
                ),
              }}
              sx={{
                "& .MuiInputBase-root": {
                  color: "#ffffff",
                  backgroundColor: "#111314",
                },

                "& .MuiInputLabel-root": {
                  color: "#979da2",
                },

                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ff8a45",
                },

                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.14)",
                },

                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.28)",
                },

                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "#ff7a2f",
                  },
              }}
            />

            {/* APPLY MODE */}
            <FormControl fullWidth>
              <InputLabel
                sx={{
                  color: "#979da2",

                  "&.Mui-focused": {
                    color: "#ff8a45",
                  },
                }}
              >
                Apply mode
              </InputLabel>

              <Select
                value={applyMode}
                label="Apply mode"
                onChange={(event) => setApplyMode(String(event.target.value))}
                sx={{
                  color: "#ffffff",
                  backgroundColor: "#111314",

                  "& .MuiSelect-icon": {
                    color: "#ffffff",
                  },

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.14)",
                  },

                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.28)",
                  },

                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ff7a2f",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      color: "#ffffff",
                      backgroundColor: "#181A1B",
                      border: "1px solid rgba(255,255,255,0.1)",

                      "& .MuiMenuItem-root:hover": {
                        backgroundColor: "rgba(255,255,255,0.07)",
                      },

                      "& .Mui-selected": {
                        backgroundColor: "rgba(255,122,47,0.15) !important",
                      },
                    },
                  },
                }}
              >
                <MenuItem value="NOW">Apply immediately</MenuItem>

                <MenuItem value="SCHEDULED">Schedule for later</MenuItem>
              </Select>
            </FormControl>

            {/* SCHEDULED DATE INPUT */}
            {applyMode === "SCHEDULED" && (
              <TextField
                fullWidth
                type="datetime-local"
                label="Effective from"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                inputProps={{
                  min: dayjs().add(1, "minute").format("YYYY-MM-DDTHH:mm"),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ScheduleRoundedIcon
                        sx={{
                          color: "#ffbd69",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiInputBase-root": {
                    color: "#ffffff",
                    backgroundColor: "#111314",
                    colorScheme: "dark",
                  },

                  "& .MuiInputLabel-root": {
                    color: "#979da2",
                  },

                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#ff8a45",
                  },

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.14)",
                  },

                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.28)",
                  },

                  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                    {
                      borderColor: "#ff7a2f",
                    },
                }}
              />
            )}

            {/* REASON INPUT */}
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Adjustment reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Example: Adjust artist earning policy from 20 to 25 VND."
              inputProps={{
                maxLength: 500,
              }}
              helperText={`${reason.length}/500`}
              sx={{
                "& .MuiInputBase-root": {
                  color: "#ffffff",
                  backgroundColor: "#111314",
                },

                "& .MuiInputLabel-root": {
                  color: "#979da2",
                },

                "& .MuiInputLabel-root.Mui-focused": {
                  color: "#ff8a45",
                },

                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.14)",
                },

                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.28)",
                },

                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "#ff7a2f",
                  },

                "& .MuiFormHelperText-root": {
                  color: "#747a7f",
                  textAlign: "right",
                },

                "& textarea::placeholder": {
                  color: "#666c71",
                  opacity: 1,
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
            pt: 1.5,
            flexDirection: {
              xs: "column-reverse",
              sm: "row",
            },
            gap: {
              xs: 1,
              sm: 0,
            },

            "& .MuiButton-root": {
              width: {
                xs: "100%",
                sm: "auto",
              },
            },
          }}
        >
          <Button
            disabled={submitting}
            onClick={() => setDialogOpen(false)}
            sx={{
              color: "#c7cbd0",
              fontWeight: 900,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={submitting || !reason.trim() || !amountPerStream}
            onClick={() => void handleCreateRate()}
            startIcon={
              submitting ? (
                <CircularProgress
                  size={17}
                  sx={{
                    color: "#ffffff",
                  }}
                />
              ) : applyMode === "SCHEDULED" ? (
                <ScheduleRoundedIcon />
              ) : (
                <AddRoundedIcon />
              )
            }
            sx={{
              minHeight: 42,
              px: 2.4,
              color: "#ffffff",
              fontWeight: 950,
              textTransform: "none",
              backgroundColor: "#ff6b1f",

              "&:hover": {
                backgroundColor: "#ff7a2f",
              },

              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.38)",
                backgroundColor: "rgba(255,107,31,0.22)",
              },
            }}
          >
            {applyMode === "SCHEDULED" ? "Schedule rate" : "Activate rate"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EarningRatesTable;
