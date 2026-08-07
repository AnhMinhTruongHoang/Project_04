"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { alpha } from "@mui/material/styles";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import PauseCircleOutlineRoundedIcon from "@mui/icons-material/PauseCircleOutlineRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createArtistMembershipPlanApi,
  getMyArtistMembershipPlansApi,
  updateArtistMembershipPlanApi,
} from "@/utils/api";

const MIN_PRICE = 10_000;
const MAX_PRICE = 10_000_000;
const MAX_PLANS = 2;

const formatPrice = (value?: number | null) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
};

const ProfileMembershipManagePlansDialog = ({
  open,
  accessToken,
  onClose,
  onChanged,
}: IProfileMembershipManagePlansDialogProps) => {
  const [plans, setPlans] = useState<IArtistMembershipPlan[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);

  const [editingPlan, setEditingPlan] = useState<IArtistMembershipPlan | null>(
    null
  );

  const [statusPlan, setStatusPlan] = useState<IArtistMembershipPlan | null>(
    null
  );

  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("40000");
  const [badgeName, setBadgeName] = useState("");
  const [badgeColor, setBadgeColor] = useState("#FF5500");
  const [displayOrder, setDisplayOrder] = useState("0");

  const isEditing = Boolean(editingPlan);

  const canCreatePlan = plans.length < MAX_PLANS;

  /*
   * =========================
   * LOAD OWNER MEMBERSHIP PLANS
   * =========================
   */
  const loadPlans = useCallback(async () => {
    if (!open) {
      return;
    }

    if (!accessToken) {
      setPlans([]);
      setError("Authentication is required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getMyArtistMembershipPlansApi(accessToken);

      setPlans(Array.isArray(response?.data) ? response.data : []);
    } catch (requestError) {
      console.error("Cannot load membership plans:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load membership plans."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, open]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  /*
   * =========================
   * RESET PLAN FORM
   * =========================
   */
  const resetForm = () => {
    setEditingPlan(null);

    setCode("");
    setName("");
    setDescription("");

    setMonthlyPrice("40000");

    setBadgeName("");
    setBadgeColor("#FF5500");

    setDisplayOrder("0");

    setError(null);
  };

  /*
   * =========================
   * OPEN CREATE PLAN
   * =========================
   */
  const handleOpenCreate = () => {
    if (!canCreatePlan) {
      setError("You can create a maximum of two membership plans.");

      return;
    }

    resetForm();

    setEditorOpen(true);
  };

  /*
   * =========================
   * OPEN EDIT PLAN
   * =========================
   */
  const handleOpenEdit = (plan: IArtistMembershipPlan) => {
    setEditingPlan(plan);

    setCode(plan.code || "");
    setName(plan.name || "");
    setDescription(plan.description || "");

    setMonthlyPrice(String(plan.monthlyPrice || ""));

    setBadgeName(plan.badgeName || "Member");

    setBadgeColor(
      /^#[0-9A-F]{6}$/i.test(plan.badgeColor || "")
        ? plan.badgeColor
        : "#FF5500"
    );

    setDisplayOrder(String(plan.displayOrder || 0));

    setError(null);

    setEditorOpen(true);
  };

  /*
   * =========================
   * VALIDATE PLAN FORM
   * =========================
   */
  const validationError = useMemo(() => {
    const normalizedCode = code.trim().toUpperCase();

    const normalizedName = name.trim();

    const normalizedBadgeName = badgeName.trim();

    const price = Number(monthlyPrice);

    const order = Number(displayOrder);

    if (!isEditing) {
      if (!/^[A-Z0-9_]{3,50}$/.test(normalizedCode)) {
        return "Plan code must contain 3–50 uppercase letters, numbers, or underscores.";
      }
    }

    if (!normalizedName) {
      return "Plan name is required.";
    }

    if (normalizedName.length > 100) {
      return "Plan name cannot exceed 100 characters.";
    }

    if (description.length > 1000) {
      return "Description cannot exceed 1,000 characters.";
    }

    if (!Number.isFinite(price) || price < MIN_PRICE || price > MAX_PRICE) {
      return "Monthly price must be between 10,000 and 10,000,000 VND.";
    }

    if (!normalizedBadgeName) {
      return "Badge name is required.";
    }

    if (normalizedBadgeName.length > 100) {
      return "Badge name cannot exceed 100 characters.";
    }

    if (!/^#[0-9A-F]{6}$/i.test(badgeColor.trim())) {
      return "Badge color must use #RRGGBB format.";
    }

    if (!Number.isInteger(order) || order < 0 || order > 100) {
      return "Display order must be between 0 and 100.";
    }

    return null;
  }, [
    badgeColor,
    badgeName,
    code,
    description,
    displayOrder,
    isEditing,
    monthlyPrice,
    name,
  ]);

  /*
   * =========================
   * SAVE MEMBERSHIP PLAN
   * =========================
   */
  const handleSavePlan = async () => {
    if (!accessToken || saving || validationError) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingPlan) {
        const response = await updateArtistMembershipPlanApi(
          editingPlan.id,
          {
            name: name.trim(),

            description: description.trim(),

            monthlyPrice: Number(monthlyPrice),

            badgeName: badgeName.trim(),

            badgeColor: badgeColor.trim().toUpperCase(),

            displayOrder: Number(displayOrder),
          },
          accessToken
        );

        if (!response?.data) {
          throw new Error(
            response?.message || "Unable to update membership plan."
          );
        }
      } else {
        const response = await createArtistMembershipPlanApi(
          {
            code: code.trim().toUpperCase(),

            name: name.trim(),

            description: description.trim(),

            monthlyPrice: Number(monthlyPrice),

            badgeName: badgeName.trim(),

            badgeColor: badgeColor.trim().toUpperCase(),

            displayOrder: Number(displayOrder),
          },
          accessToken
        );

        if (!response?.data) {
          throw new Error(
            response?.message || "Unable to create membership plan."
          );
        }
      }

      setEditorOpen(false);

      resetForm();

      await loadPlans();

      onChanged?.();
    } catch (requestError) {
      console.error("Cannot save membership plan:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to save membership plan."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================
   * OPEN STATUS CONFIRMATION
   * =========================
   */
  const handleOpenStatusDialog = (plan: IArtistMembershipPlan) => {
    setStatusPlan(plan);

    setStatusDialogOpen(true);
  };

  /*
   * =========================
   * ENABLE / DISABLE PLAN
   * =========================
   */
  const handleChangePlanStatus = async () => {
    if (!accessToken || !statusPlan || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await updateArtistMembershipPlanApi(
        statusPlan.id,
        {
          active: !statusPlan.active,
        },
        accessToken
      );

      if (!response?.data) {
        throw new Error(
          response?.message || "Unable to update membership plan status."
        );
      }

      setStatusDialogOpen(false);
      setStatusPlan(null);

      await loadPlans();

      onChanged?.();
    } catch (requestError) {
      console.error("Cannot update membership plan status:", requestError);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to update membership plan status."
      );
    } finally {
      setSaving(false);
    }
  };

  const darkTextFieldSx = {
    "& .MuiInputLabel-root": {
      color: "#9A9A9A",
      fontWeight: 600,
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#FF6A1A",
    },

    "& .MuiInputLabel-root.Mui-disabled": {
      color: "#6F6F6F",
    },

    "& .MuiOutlinedInput-root": {
      color: "#FFFFFF",

      bgcolor: "#171717",

      borderRadius: 2,

      "& fieldset": {
        borderColor: "rgba(255,255,255,0.14)",
      },

      "&:hover fieldset": {
        borderColor: "rgba(255,255,255,0.28)",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#FF5500",
        borderWidth: "1px",
      },

      "&.Mui-disabled": {
        bgcolor: "#141414",
      },

      "&.Mui-disabled fieldset": {
        borderColor: "rgba(255,255,255,0.08)",
      },
    },

    "& .MuiOutlinedInput-input": {
      color: "#FFFFFF",

      "&::placeholder": {
        color: "#666666",
        opacity: 1,
      },

      "&.Mui-disabled": {
        WebkitTextFillColor: "#777777",
      },
    },

    "& .MuiInputBase-inputMultiline": {
      color: "#FFFFFF",
    },

    "& .MuiFormHelperText-root": {
      color: "#777777",
      mx: 0.5,
    },

    "& .MuiFormHelperText-root.Mui-error": {
      color: "#FF8585",
    },

    "& input[type='number']": {
      colorScheme: "dark",
    },
  };

  return (
    <>
      {/* MANAGE MEMBERSHIP PLANS DIALOG */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        PaperProps={{
          sx: {
            bgcolor: "#101010",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,85,0,0.05), transparent 190px)",

            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.10)",

            borderRadius: {
              xs: 2,
              sm: 3,
            },

            boxShadow: "0 30px 100px rgba(0,0,0,0.78)",
          },
        }}
      >
        {/* DIALOG HEADER */}
        <DialogTitle
          sx={{
            p: 0,

            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{
              minHeight: 74,

              px: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.3}
              minWidth={0}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,

                  display: "grid",
                  placeItems: "center",

                  flexShrink: 0,

                  color: "#FF6A1A",

                  bgcolor: "rgba(255,85,0,0.12)",

                  border: "1px solid rgba(255,85,0,0.25)",

                  borderRadius: 2,
                }}
              >
                <WorkspacePremiumRoundedIcon />
              </Box>

              <Box minWidth={0}>
                <Typography
                  sx={{
                    color: "#FFFFFF",

                    fontSize: {
                      xs: 17,
                      sm: 20,
                    },

                    fontWeight: 900,
                  }}
                >
                  Manage membership plans
                </Typography>

                <Typography
                  sx={{
                    mt: 0.2,

                    color: "#858585",

                    fontSize: 12,
                  }}
                >
                  Create and manage up to two plans
                </Typography>
              </Box>
            </Stack>

            <IconButton
              aria-label="Close"
              onClick={onClose}
              sx={{
                color: "#A0A0A0",

                "&:hover": {
                  color: "#FFFFFF",
                  bgcolor: "#242424",
                },
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
          }}
        >
          {/* ERROR */}
          {error && (
            <Alert
              severity="error"
              onClose={() => {
                setError(null);
              }}
              sx={{
                mb: 2.5,

                color: "#FFD5D5",
                bgcolor: "#251313",

                border: "1px solid #653333",

                borderRadius: 2,
              }}
            >
              {error}
            </Alert>
          )}

          {/* MANAGEMENT ACTIONS */}
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{
              mb: 2.5,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#FFFFFF",
                  fontSize: 18,
                  fontWeight: 900,
                  mt: 2,
                }}
              >
                Your plans
              </Typography>

              <Typography
                sx={{
                  mt: 2,

                  color: "#7F7F7F",
                  fontSize: 13,
                }}
              >
                {plans.length} of {MAX_PLANS} plans created
              </Typography>
            </Box>

            <Button
              variant="contained"
              disabled={loading || !canCreatePlan}
              startIcon={<AddRoundedIcon />}
              onClick={handleOpenCreate}
              sx={{
                minHeight: 42,

                px: 2,

                color: "#FFFFFF",
                bgcolor: "#FF5500",

                borderRadius: 2,

                fontWeight: 850,
                textTransform: "none",

                boxShadow: "none",

                "&:hover": {
                  bgcolor: "#FF6A1A",
                  boxShadow: "none",
                },

                "&.Mui-disabled": {
                  color: "#777777",
                  bgcolor: "#292929",
                },
              }}
            >
              {canCreatePlan ? "Create plan" : "Plan limit reached"}
            </Button>
          </Stack>

          {/* PLAN LIST */}
          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                minHeight: 240,
              }}
            >
              <CircularProgress
                sx={{
                  color: "#FF5500",
                }}
              />
            </Stack>
          ) : plans.length === 0 ? (
            <Box
              sx={{
                py: 5,
                px: 2,

                textAlign: "center",

                bgcolor: "#151515",

                border: "1px dashed rgba(255,255,255,0.14)",

                borderRadius: 3,
              }}
            >
              <WorkspacePremiumRoundedIcon
                sx={{
                  color: "#5F5F5F",
                  fontSize: 42,
                }}
              />

              <Typography
                sx={{
                  mt: 1,

                  color: "#FFFFFF",

                  fontSize: 16,
                  fontWeight: 850,
                }}
              >
                No membership plans yet
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,

                  color: "#777777",
                  fontSize: 13,
                }}
              >
                Create your first plan to start building your membership.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {plans.map((plan) => {
                const accent = /^#[0-9A-F]{6}$/i.test(plan.badgeColor || "")
                  ? plan.badgeColor
                  : "#FF5500";

                return (
                  <Box
                    key={plan.id}
                    sx={{
                      p: {
                        xs: 1.75,
                        sm: 2,
                      },

                      bgcolor: "#151515",

                      border: `1px solid ${alpha(accent, 0.28)}`,

                      borderRadius: 2.5,
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      alignItems={{
                        xs: "stretch",
                        sm: "center",
                      }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box minWidth={0}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                          gap={0.8}
                        >
                          <Typography
                            sx={{
                              color: "#FFFFFF",

                              fontSize: 16,
                              fontWeight: 900,
                            }}
                          >
                            {plan.name}
                          </Typography>

                          <Chip
                            size="small"
                            label={plan.active ? "Active" : "Paused"}
                            sx={{
                              color: plan.active ? "#71DB8A" : "#B0B0B0",

                              bgcolor: plan.active
                                ? "rgba(45,180,85,0.12)"
                                : "#242424",

                              fontWeight: 800,
                            }}
                          />
                        </Stack>

                        <Typography
                          sx={{
                            mt: 0.4,

                            color: accent,

                            fontSize: 12,
                            fontWeight: 800,

                            letterSpacing: "0.05em",
                          }}
                        >
                          {plan.code}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 1,

                            color: "#FFFFFF",

                            fontSize: 19,
                            fontWeight: 900,
                          }}
                        >
                          {formatPrice(plan.monthlyPrice)}

                          <Box
                            component="span"
                            sx={{
                              ml: 0.7,

                              color: "#777777",

                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            / 30 days
                          </Box>
                        </Typography>

                        {plan.description && (
                          <Typography
                            sx={{
                              mt: 0.7,

                              color: "#8F8F8F",

                              fontSize: 13,
                              lineHeight: 1.5,
                            }}
                          >
                            {plan.description}
                          </Typography>
                        )}
                      </Box>

                      {/* PLAN ACTIONS */}
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          flexShrink: 0,
                        }}
                      >
                        <Button
                          startIcon={<EditRoundedIcon />}
                          onClick={() => {
                            handleOpenEdit(plan);
                          }}
                          sx={{
                            minHeight: 38,

                            color: "#FFFFFF",
                            bgcolor: "#252525",

                            borderRadius: 2,

                            fontWeight: 800,
                            textTransform: "none",

                            "&:hover": {
                              bgcolor: "#303030",
                            },
                          }}
                        >
                          Edit
                        </Button>

                        <Button
                          startIcon={
                            plan.active ? (
                              <PauseCircleOutlineRoundedIcon />
                            ) : (
                              <PlayCircleOutlineRoundedIcon />
                            )
                          }
                          onClick={() => {
                            handleOpenStatusDialog(plan);
                          }}
                          sx={{
                            minHeight: 38,

                            color: plan.active ? "#F0A0A0" : "#88D999",

                            bgcolor: "#252525",

                            borderRadius: 2,

                            fontWeight: 800,
                            textTransform: "none",

                            "&:hover": {
                              bgcolor: "#303030",
                            },
                          }}
                        >
                          {plan.active ? "Disable" : "Enable"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT PLAN DIALOG */}
      <Dialog
        open={editorOpen}
        onClose={() => {
          if (!saving) {
            setEditorOpen(false);
          }
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#111111",
            backgroundImage: "none",

            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.10)",

            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          {isEditing ? "Edit membership plan" : "Create membership plan"}
        </DialogTitle>

        <Divider
          sx={{
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            {/* PLAN CODE */}
            <TextField
              label="Plan code"
              value={code}
              disabled={isEditing}
              onChange={(event) => {
                setCode(
                  event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "")
                );
              }}
              helperText={
                isEditing
                  ? "Plan code cannot be changed after creation."
                  : "Example: SUPPORTER or VIP_MEMBER"
              }
              inputProps={{
                maxLength: 50,
              }}
              fullWidth
              sx={darkTextFieldSx}
            />

            {/* PLAN NAME */}
            <TextField
              label="Plan name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              inputProps={{
                maxLength: 100,
              }}
              fullWidth
              sx={darkTextFieldSx}
            />

            {/* PRICE */}
            <TextField
              label="Monthly price (VND)"
              type="number"
              value={monthlyPrice}
              onChange={(event) => {
                setMonthlyPrice(event.target.value);
              }}
              inputProps={{
                min: MIN_PRICE,
                max: MAX_PRICE,
                step: 1000,
              }}
              fullWidth
              sx={darkTextFieldSx}
            />

            {/* BADGE */}
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
            >
              <TextField
                label="Badge name"
                value={badgeName}
                onChange={(event) => {
                  setBadgeName(event.target.value);
                }}
                inputProps={{
                  maxLength: 100,
                }}
                fullWidth
                sx={darkTextFieldSx}
              />

              <TextField
                label="Badge color"
                value={badgeColor}
                onChange={(event) => {
                  setBadgeColor(event.target.value.toUpperCase());
                }}
                inputProps={{
                  maxLength: 7,
                }}
                sx={{
                  ...darkTextFieldSx,

                  width: {
                    xs: "100%",
                    sm: 190,
                  },
                }}
              />
            </Stack>

            {/* BADGE PREVIEW */}
            <Box
              sx={{
                p: 1.5,

                bgcolor: "#171717",

                border: "1px solid rgba(255,255,255,0.08)",

                borderRadius: 2,
              }}
            >
              <Typography
                sx={{
                  mb: 1,

                  color: "#777777",

                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Badge preview
              </Typography>

              <Chip
                label={badgeName.trim() || "Member"}
                sx={{
                  color: /^#[0-9A-F]{6}$/i.test(badgeColor)
                    ? badgeColor
                    : "#FF5500",

                  bgcolor: alpha(
                    /^#[0-9A-F]{6}$/i.test(badgeColor) ? badgeColor : "#FF5500",
                    0.12
                  ),

                  border: `1px solid ${alpha(
                    /^#[0-9A-F]{6}$/i.test(badgeColor) ? badgeColor : "#FF5500",
                    0.3
                  )}`,

                  fontWeight: 800,
                }}
              />
            </Box>

            {/* DISPLAY ORDER */}
            <TextField
              label="Display order"
              type="number"
              value={displayOrder}
              onChange={(event) => {
                setDisplayOrder(event.target.value);
              }}
              inputProps={{
                min: 0,
                max: 100,
              }}
              fullWidth
              sx={darkTextFieldSx}
            />

            {validationError && (
              <Alert
                severity="warning"
                sx={{
                  color: "#FFDCA8",
                  bgcolor: "#251D12",

                  border: "1px solid #5A452A",
                }}
              >
                {validationError}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            disabled={saving}
            onClick={() => {
              setEditorOpen(false);
            }}
            sx={{
              color: "#B0B0B0",
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={saving || Boolean(validationError)}
            onClick={() => {
              void handleSavePlan();
            }}
            startIcon={
              saving ? (
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{
                    color: "inherit",
                  }}
                />
              ) : undefined
            }
            sx={{
              minHeight: 42,

              px: 2.5,

              color: "#FFFFFF",
              bgcolor: "#FF5500",

              borderRadius: 2,

              fontWeight: 850,
              textTransform: "none",

              boxShadow: "none",

              "&:hover": {
                bgcolor: "#FF6A1A",
                boxShadow: "none",
              },
            }}
          >
            {saving ? "Saving..." : isEditing ? "Save changes" : "Create plan"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* PLAN STATUS CONFIRMATION DIALOG */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => {
          if (!saving) {
            setStatusDialogOpen(false);
            setStatusPlan(null);
          }
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#121212",
            backgroundImage: "none",

            color: "#FFFFFF",

            border: "1px solid rgba(255,255,255,0.10)",

            borderRadius: 3,
          },
        }}
      >
        <DialogTitle>
          {statusPlan?.active
            ? "Disable membership plan?"
            : "Enable membership plan?"}
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#A0A0A0",

              fontSize: 14,
              lineHeight: 1.65,
            }}
          >
            {statusPlan?.active
              ? "New members will no longer be able to join this plan. Existing memberships will remain active until their current period ends."
              : "This plan will become available for members to join again."}
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            disabled={saving}
            onClick={() => {
              setStatusDialogOpen(false);
              setStatusPlan(null);
            }}
            sx={{
              color: "#B0B0B0",
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={saving}
            onClick={() => {
              void handleChangePlanStatus();
            }}
            sx={{
              color: "#FFFFFF",

              bgcolor: statusPlan?.active ? "#C83F3F" : "#2E9148",

              borderRadius: 2,

              fontWeight: 850,
              textTransform: "none",

              boxShadow: "none",

              "&:hover": {
                bgcolor: statusPlan?.active ? "#D94A4A" : "#38A755",

                boxShadow: "none",
              },
            }}
          >
            {saving
              ? "Saving..."
              : statusPlan?.active
              ? "Disable plan"
              : "Enable plan"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileMembershipManagePlansDialog;
