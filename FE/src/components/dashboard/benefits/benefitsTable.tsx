"use client";

import { useCallback, useEffect, useState } from "react";

import { useSession } from "next-auth/react";

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
  FormControlLabel,
  IconButton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import ImageNotSupportedRoundedIcon from "@mui/icons-material/ImageNotSupportedRounded";
import {
  createAdminArtistBenefitApi,
  deleteAdminArtistBenefitApi,
  getAdminArtistBenefitsApi,
  toggleAdminArtistBenefitApi,
  updateAdminArtistBenefitApi,
} from "@/utils/api";

import { getBenefitImageUrl } from "@/utils/actions/getImages";

type BenefitForm = {
  title: string;
  description: string;
  saveLabel: string;
  imageUrl: string;
  sortOrder: string;
  active: boolean;
};

const emptyForm: BenefitForm = {
  title: "",
  description: "",
  saveLabel: "",
  imageUrl: "",
  sortOrder: "0",
  active: true,
};

const formatDate = (value?: string) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const AdminBenefitsTable = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [benefits, setBenefits] = useState<IArtistBenefit[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingBenefit, setEditingBenefit] = useState<IArtistBenefit | null>(
    null
  );

  const [form, setForm] = useState<BenefitForm>(emptyForm);

  const [saving, setSaving] = useState(false);

  const [busyId, setBusyId] = useState("");

  const [notice, setNotice] = useState("");

  const [noticeSeverity, setNoticeSeverity] = useState<"success" | "error">(
    "success"
  );

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  const loadBenefits = useCallback(async () => {
    if (!accessToken) {
      setBenefits([]);
      setLoading(false);

      setError("Admin authentication is required.");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getAdminArtistBenefitsApi(accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "Cannot load artist benefits.");
      }

      const rows = Array.isArray(response?.data) ? response.data : [];

      setBenefits(rows);
    } catch (loadError) {
      console.error("Cannot load admin benefits:", loadError);

      setBenefits([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Cannot load artist benefits."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    void loadBenefits();
  }, [sessionStatus, loadBenefits]);

  const showNotice = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setNotice(message);
    setNoticeSeverity(severity);
  };

  const openCreateDialog = () => {
    setEditingBenefit(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (benefit: IArtistBenefit) => {
    setEditingBenefit(benefit);

    setForm({
      title: benefit.title || "",

      description: benefit.description || "",

      saveLabel: benefit.saveLabel || "",

      imageUrl: benefit.imageUrl || "",

      sortOrder: String(benefit.sortOrder ?? 0),

      active: benefit.active !== false,
    });

    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) {
      return;
    }

    setDialogOpen(false);
    setEditingBenefit(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const title = form.title.trim();

    if (!title) {
      showNotice("Benefit title is required.", "error");

      return;
    }

    const parsedSortOrder = Number(form.sortOrder);

    if (!Number.isFinite(parsedSortOrder) || parsedSortOrder < 0) {
      showNotice("Sort order must be zero or greater.", "error");

      return;
    }

    const payload: IArtistBenefitPayload = {
      title,

      description: form.description.trim(),

      saveLabel: form.saveLabel.trim(),

      imageUrl: form.imageUrl.trim() || null,

      sortOrder: Math.floor(parsedSortOrder),

      active: form.active,
    };

    try {
      setSaving(true);

      const response = editingBenefit
        ? await updateAdminArtistBenefitApi(
            editingBenefit.id,
            payload,
            accessToken
          )
        : await createAdminArtistBenefitApi(payload, accessToken);

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "Cannot save artist benefit.");
      }

      closeDialog();

      showNotice(
        editingBenefit
          ? "Benefit updated successfully."
          : "Benefit created successfully."
      );

      await loadBenefits();
    } catch (saveError) {
      console.error("Cannot save benefit:", saveError);

      showNotice(
        saveError instanceof Error
          ? saveError.message
          : "Cannot save artist benefit.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (benefit: IArtistBenefit) => {
    try {
      setBusyId(benefit.id);

      const response = await toggleAdminArtistBenefitApi(
        benefit.id,
        accessToken
      );

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "Cannot update benefit status.");
      }

      setBenefits((current) =>
        current.map((item) =>
          item.id === benefit.id
            ? {
                ...item,

                active: response?.data?.active ?? !item.active,
              }
            : item
        )
      );

      showNotice(
        benefit.active
          ? "Benefit hidden successfully."
          : "Benefit activated successfully."
      );
    } catch (toggleError) {
      console.error("Cannot toggle benefit:", toggleError);

      showNotice(
        toggleError instanceof Error
          ? toggleError.message
          : "Cannot update benefit status.",
        "error"
      );
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (benefit: IArtistBenefit) => {
    const confirmed = window.confirm(`Delete benefit "${benefit.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setBusyId(benefit.id);

      const response = await deleteAdminArtistBenefitApi(
        benefit.id,
        accessToken
      );

      if (response?.error || Number(response?.statusCode) >= 400) {
        throw new Error(response?.message || "Cannot delete artist benefit.");
      }

      setBenefits((current) =>
        current.filter((item) => item.id !== benefit.id)
      );

      showNotice("Benefit deleted successfully.");
    } catch (deleteError) {
      console.error("Cannot delete benefit:", deleteError);

      showNotice(
        deleteError instanceof Error
          ? deleteError.message
          : "Cannot delete artist benefit.",
        "error"
      );
    } finally {
      setBusyId("");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",

        background: "linear-gradient(180deg, #111315 0%, #0b0d0e 100%)",

        color: "#ffffff",

        px: {
          xs: 2,
          md: 3,
        },

        py: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",

          alignItems: {
            xs: "flex-start",
            md: "center",
          },

          justifyContent: "space-between",

          flexDirection: {
            xs: "column",
            md: "row",
          },

          gap: 2,
          mb: 3,
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
            <WorkspacePremiumRoundedIcon
              sx={{
                color: "#f4c542",
                fontSize: 30,
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",

                fontSize: {
                  xs: 24,
                  md: 30,
                },

                fontWeight: 950,
                letterSpacing: "-0.04em",
              }}
            >
              Artist Benefits
            </Typography>
          </Box>

          <Typography
            sx={{
              mt: 0.6,
              color: "#8B949E",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Manage Artist Pro membership benefits.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <span
              style={{
                display: "inline-flex",
              }}
            >
              <IconButton
                onClick={() => void loadBenefits()}
                disabled={loading}
                sx={{
                  width: 42,
                  height: 42,
                  color: "#ffffff",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",

                  "&:hover": {
                    background: "rgba(255,255,255,0.08)",
                  },

                  "&.Mui-disabled": {
                    color: "#626973",
                    borderColor: "rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                  },
                }}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Button
            onClick={openCreateDialog}
            startIcon={<AddRoundedIcon />}
            sx={{
              height: 42,

              px: 2.2,

              borderRadius: "8px",

              color: "#ffffff",

              backgroundColor: "#FF5500",

              textTransform: "none",

              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ff6a1a",
              },
            }}
          >
            Add benefit
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,

            color: "#ffffff",

            backgroundColor: "rgba(211,47,47,0.14)",

            border: "1px solid rgba(255,80,80,0.22)",
          }}
        >
          {error}
        </Alert>
      )}

      <TableContainer
        sx={{
          borderRadius: "12px",

          border: "1px solid rgba(255,255,255,0.08)",

          background: "rgba(255,255,255,0.025)",

          overflowX: "auto",
        }}
      >
        <Table
          sx={{
            minWidth: 1050,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                background: "rgba(255,255,255,0.045)",
              }}
            >
              {[
                "Image",
                "Benefit",
                "Saving",
                "Order",
                "Status",
                "Updated",
                "Actions",
              ].map((label) => (
                <TableCell
                  key={label}
                  sx={{
                    color: "#AEB7C2",

                    borderBottom: "1px solid rgba(255,255,255,0.08)",

                    fontSize: 11,
                    fontWeight: 950,

                    textTransform: "uppercase",

                    letterSpacing: "0.06em",
                  }}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  sx={{
                    height: 240,
                    borderBottom: 0,
                    textAlign: "center",
                  }}
                >
                  <CircularProgress
                    size={30}
                    sx={{
                      color: "#FF5500",
                    }}
                  />
                </TableCell>
              </TableRow>
            ) : benefits.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  sx={{
                    height: 240,
                    borderBottom: 0,
                    textAlign: "center",
                  }}
                >
                  <WorkspacePremiumRoundedIcon
                    sx={{
                      color: "#555c65",
                      fontSize: 40,
                    }}
                  />

                  <Typography
                    sx={{
                      mt: 1,

                      color: "#AEB7C2",

                      fontSize: 14,
                      fontWeight: 850,
                    }}
                  >
                    No artist benefits
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,

                      color: "#686f78",

                      fontSize: 12,
                    }}
                  >
                    Add the first benefit for Artist Pro members.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              benefits.map((benefit) => {
                const rowBusy = busyId === benefit.id;

                return (
                  <TableRow
                    key={benefit.id}
                    hover
                    sx={{
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.025)",
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        width: 100,

                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {benefit.imageUrl ? (
                        <Box
                          component="img"
                          src={getBenefitImageUrl(benefit.imageUrl)}
                          alt={benefit.title}
                          sx={{
                            width: 68,
                            height: 48,

                            objectFit: "cover",

                            borderRadius: "6px",

                            display: "block",

                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 68,
                            height: 48,

                            display: "flex",

                            alignItems: "center",

                            justifyContent: "center",

                            borderRadius: "6px",

                            color: "#5f6670",

                            background: "rgba(255,255,255,0.04)",

                            border: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          <ImageNotSupportedRoundedIcon
                            sx={{
                              fontSize: 22,
                            }}
                          />
                        </Box>
                      )}
                    </TableCell>

                    <TableCell
                      sx={{
                        minWidth: 330,

                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Typography
                        sx={{
                          color: "#ffffff",

                          fontSize: 13,
                          fontWeight: 900,
                        }}
                      >
                        {benefit.title}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,

                          color: "#7f8791",

                          fontSize: 11,
                          lineHeight: 1.5,

                          display: "-webkit-box",

                          WebkitLineClamp: 2,

                          WebkitBoxOrient: "vertical",

                          overflow: "hidden",

                          maxWidth: 420,
                        }}
                      >
                        {benefit.description || "No description"}
                      </Typography>
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {benefit.saveLabel ? (
                        <Chip
                          label={benefit.saveLabel}
                          size="small"
                          sx={{
                            color: "#ffffff",

                            backgroundColor: "#087A46",

                            fontSize: 10,
                            fontWeight: 900,
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            color: "#646b74",

                            fontSize: 12,
                          }}
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "#ffffff",

                        borderBottom: "1px solid rgba(255,255,255,0.06)",

                        fontSize: 12,
                        fontWeight: 850,
                      }}
                    >
                      {benefit.sortOrder}
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.6}>
                        <Switch
                          size="small"
                          checked={benefit.active}
                          disabled={rowBusy}
                          onChange={() => void handleToggle(benefit)}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#16c784",
                            },

                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                              {
                                backgroundColor: "#16c784",
                              },
                          }}
                        />

                        <Typography
                          sx={{
                            color: benefit.active ? "#16c784" : "#7f8791",

                            fontSize: 11,
                            fontWeight: 850,
                          }}
                        >
                          {benefit.active ? "Active" : "Hidden"}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "#8B949E",

                        borderBottom: "1px solid rgba(255,255,255,0.06)",

                        fontSize: 11,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(benefit.updatedAt || benefit.createdAt)}
                    </TableCell>

                    <TableCell
                      sx={{
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              disabled={rowBusy}
                              onClick={() => openEditDialog(benefit)}
                              sx={{
                                color: "#AEB7C2",

                                "&:hover": {
                                  color: "#ffffff",

                                  backgroundColor: "rgba(255,255,255,0.08)",
                                },
                              }}
                            >
                              <EditRoundedIcon
                                sx={{
                                  fontSize: 19,
                                }}
                              />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              disabled={rowBusy}
                              onClick={() => void handleDelete(benefit)}
                              sx={{
                                color: "#ff6673",

                                "&:hover": {
                                  color: "#ffffff",

                                  backgroundColor: "rgba(255,48,64,0.15)",
                                },
                              }}
                            >
                              {rowBusy ? (
                                <CircularProgress
                                  size={18}
                                  sx={{
                                    color: "#FF5500",
                                  }}
                                />
                              ) : (
                                <DeleteOutlineRoundedIcon
                                  sx={{
                                    fontSize: 20,
                                  }}
                                />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            color: "#ffffff",

            borderRadius: "14px",

            background: "linear-gradient(180deg, #202224, #17191b)",

            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 950,
            textAlign: "center",
          }}
        >
          {editingBenefit ? "Edit artist benefit" : "Add artist benefit"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              mt: 1,
            }}
          >
            <TextField
              label="Title"
              value={form.title}
              required
              fullWidth
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              sx={fieldStyles}
            />

            <TextField
              label="Description"
              value={form.description}
              fullWidth
              multiline
              minRows={4}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              sx={fieldStyles}
            />

            <TextField
              label="Saving label"
              placeholder="Example: Save $25"
              value={form.saveLabel}
              fullWidth
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  saveLabel: event.target.value,
                }))
              }
              sx={fieldStyles}
            />

            <TextField
              label="Image URL"
              placeholder="Optional — add later"
              value={form.imageUrl}
              fullWidth
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              sx={fieldStyles}
            />

            {form.imageUrl.trim() && (
              <Box
                component="img"
                src={getBenefitImageUrl(form.imageUrl.trim())}
                alt="Benefit preview"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
                sx={{
                  width: "100%",
                  height: 180,
                  display: "block",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                }}
              />
            )}

            <TextField
              label="Sort order"
              type="number"
              value={form.sortOrder}
              fullWidth
              inputProps={{
                min: 0,
              }}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  sortOrder: event.target.value,
                }))
              }
              sx={fieldStyles}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      active: event.target.checked,
                    }))
                  }
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#16c784",
                    },

                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#16c784",
                    },
                  }}
                />
              }
              label="Active"
              sx={{
                color: "#D1D5DB",
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 2.5,
          }}
        >
          <Button
            onClick={closeDialog}
            disabled={saving}
            sx={{
              color: "#AEB7C2",
              textTransform: "none",
              fontWeight: 850,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={() => void handleSubmit()}
            disabled={saving}
            sx={{
              minWidth: 110,

              color: "#ffffff",

              backgroundColor: "#FF5500",

              textTransform: "none",

              fontWeight: 950,

              "&:hover": {
                backgroundColor: "#ff6a1a",
              },
            }}
          >
            {saving ? (
              <CircularProgress
                size={19}
                sx={{
                  color: "#ffffff",
                }}
              />
            ) : editingBenefit ? (
              "Save changes"
            ) : (
              "Create"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3500}
        onClose={() => setNotice("")}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={noticeSeverity}
          variant="filled"
          onClose={() => setNotice("")}
        >
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const fieldStyles = {
  "& .MuiInputLabel-root": {
    color: "#8B949E",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#FF5500",
  },

  "& .MuiOutlinedInput-root": {
    color: "#ffffff",

    backgroundColor: "rgba(255,255,255,0.035)",

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.12)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.26)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#FF5500",
    },
  },

  "& input::placeholder, & textarea::placeholder": {
    color: "#626a74",
    opacity: 1,
  },
};

export default AdminBenefitsTable;
