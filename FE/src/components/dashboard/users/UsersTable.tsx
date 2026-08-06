"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { sendRequest } from "@/utils/api";
import DashboardTableToolbar from "@/components/dashboard/components/DashboardTableToolbar";
import { useToast } from "@/utils/toast";
import { getInitials, getUserAvatarUrl } from "@/utils/actions/getImages";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import DeleteForeverRoundedIcon from "@mui/icons-material/DeleteForeverRounded";
import CommentsDisabledRoundedIcon from "@mui/icons-material/CommentsDisabledRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ManageUserBadgesDialog from "./components/ManageUserBadgesDialog";

type Props = {
  users: IUser[];
  accessToken?: string;
};

const getItemId = (item?: any) => {
  return item?._id || item?.id || "";
};

const getAccountStatus = (user?: any) => {
  return String(user?.accountStatus || "ACTIVE")
    .trim()
    .toUpperCase();
};

const getChatStatus = (user?: IUser) => {
  return String(user?.chatStatus || "ACTIVE")
    .trim()
    .toUpperCase();
};

const UsersTable = ({ users, accessToken }: Props) => {
  const router = useRouter();
  const toast = useToast();

  const [confirmUser, setConfirmUser] = useState<IUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<UserAction | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState<EditUserState | null>(null);
  const [badgeUser, setBadgeUser] = useState<IUser | null>(null);
  const resetActionDialog = () => {
    setConfirmUser(null);
    setConfirmAction(null);
    setActionReason("");
  };

  const filteredUsers = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return [
        user.name,
        user.email,
        user.role,
        user.type,
        user.gender,
        user.subscriptionTier,
        user.following,
        user.followers,
        user.accountStatus,
        user.statusReason,
        user.chatStatus,
        user.chatBanReason,
      ]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(keyword));
    });
  }, [users, searchValue]);

  const revalidateUsers = async () => {
    await sendRequest<IBackendRes<any>>({
      url: "/api/revalidate",
      method: "POST",
      queryParams: {
        tag: "dashboard-users",
        secret: "justArandomString",
      },
    });
  };

  /* =========================
   OPEN USER PROFILE
========================= */
  const handleOpenUserProfile = (user: IUser) => {
    const userId = getItemId(user);

    if (!userId) {
      toast.error("User profile not found.");
      return;
    }

    router.push(`/profile/${encodeURIComponent(userId)}`);
  };

  /* =========================
     EDIT USER
  ========================= */

  const handleOpenEdit = (user: IUser) => {
    const userAny = user as any;

    setEditUser({
      _id: getItemId(user),
      name: user.name || "",
      email: user.email || "",
      age: user.age || "",
      gender: user.gender || "",
      bio: user.bio || "",
      role: user.role || "USER",
      avatarUrl: userAny.avatarUrl || "",
      avatar: userAny.avatar || "",
      image: userAny.image || "",
      picture: userAny.picture || "",
    });

    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    if (saving) return;

    setOpenEdit(false);
    setEditUser(null);
  };

  const handleSaveUser = async () => {
    if (!editUser?._id) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please sign in as an administrator first.");
      return;
    }

    setSaving(true);

    try {
      const res = await sendRequest<IBackendRes<IUser>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: "PATCH",
        body: {
          id: editUser._id,
          _id: editUser._id,
          bio: editUser.bio.trim(),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(res?.statusCode) === 200) {
        toast.success(res?.message || "User bio updated successfully.");

        await revalidateUsers();

        setOpenEdit(false);
        setEditUser(null);
        router.refresh();
        return;
      }

      toast.error(res?.message || "Unable to update this user's bio.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update this user's bio."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     SUSPEND USER FOR 7 DAYS
  ========================= */

  const suspendUser = async (user: IUser) => {
    const userId = getItemId(user);

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please sign in as an administrator first.");
      return;
    }

    setDeletingId(userId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}/suspend`,
        method: "PATCH",
        body: {
          reason: actionReason.trim(),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(res?.statusCode) === 200) {
        toast.success(res?.message || "User account suspended for 7 days.");

        resetActionDialog();

        await revalidateUsers();
        router.refresh();
        return;
      }

      toast.error(res?.message || "Unable to suspend this user account.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to suspend this user account."
      );
    } finally {
      setDeletingId("");
    }
  };

  /* =========================
     REACTIVATE USER
  ========================= */

  const activateUser = async (user: IUser) => {
    const userId = getItemId(user);

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please sign in as an administrator first.");
      return;
    }

    setDeletingId(userId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}/activate`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(res?.statusCode) === 200) {
        toast.success(res?.message || "User account reactivated successfully.");

        resetActionDialog();

        await revalidateUsers();
        router.refresh();
        return;
      }

      toast.error(res?.message || "Unable to reactivate this user account.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to reactivate this user account."
      );
    } finally {
      setDeletingId("");
    }
  };

  /* =========================
   DEACTIVATE USER FOREVER
========================= */
  const deactivateUser = async (user: IUser) => {
    const userId = getItemId(user);

    if (!userId || !accessToken) return;

    setDeletingId(userId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}`,
        method: "DELETE",
        body: {
          reason: actionReason.trim(),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(res?.statusCode) === 200) {
        toast.success(res?.message || "User account disabled indefinitely.");

        resetActionDialog();

        await revalidateUsers();
        router.refresh();
        return;
      }

      toast.error(res?.message || "Unable to disable this user account.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to disable this user account."
      );
    } finally {
      setDeletingId("");
    }
  };

  /* =========================
   BAN USER CHAT
========================= */
  const banUserChat = async (user: IUser) => {
    const userId = getItemId(user);

    if (!userId || !accessToken) return;

    setDeletingId(userId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}/ban-chat`,
        method: "PATCH",
        body: {
          reason: actionReason.trim(),
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(res?.statusCode) === 200) {
        toast.success(res?.message || "User commenting access disabled.");

        resetActionDialog();

        await revalidateUsers();
        router.refresh();
        return;
      }

      toast.error(res?.message || "Unable to disable this user's chat access.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to disable this user's chat access."
      );
    } finally {
      setDeletingId("");
    }
  };

  /* =========================
   ENABLE USER CHAT
========================= */
  const enableUserChat = async (user: IUser) => {
    const userId = getItemId(user);

    if (!userId || !accessToken) return;

    setDeletingId(userId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${userId}/enable-chat`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (Number(res?.statusCode) === 200) {
        toast.success(res?.message || "User commenting access enabled.");

        resetActionDialog();

        await revalidateUsers();
        router.refresh();
        return;
      }

      toast.error(res?.message || "Unable to enable this user's chat access.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to enable this user's chat access."
      );
    } finally {
      setDeletingId("");
    }
  };

  /* =========================
   OPEN USER ACTION DIALOG
========================= */
  const handleUserAction = (user: IUser, action: UserAction) => {
    const userId = getItemId(user);

    const isAdmin = String(user.role || "").toUpperCase() === "ADMIN";

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please sign in as an administrator first.");
      return;
    }

    if (isAdmin) {
      toast.error(
        "Administrator accounts cannot be restricted from this action."
      );
      return;
    }

    setActionReason("");
    setConfirmUser(user);
    setConfirmAction(action);
  };

  /* =========================
   MANAGE USER BADGES
========================= */
  const handleOpenBadges = (user: IUser) => {
    const userId = getItemId(user);

    if (!userId) {
      toast.error("User not found.");
      return;
    }

    if (!accessToken) {
      toast.error("Please sign in as an administrator first.");
      return;
    }

    setBadgeUser(user);
  };

  /* =========================
     TABLE COLUMNS
  ========================= */

  const columns: GridColDef<IUser>[] = [
    {
      field: "name",
      headerName: "User",
      flex: 1.3,
      minWidth: 260,
      sortable: true,
      renderCell: (params) => {
        const user = params.row;
        const userName = user.name || "Social user";
        const userEmail = user.email || "";
        const userAvatarUrl = getUserAvatarUrl(user);

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.4,
            }}
          >
            <Tooltip title="View user profile">
              <IconButton
                onClick={() => handleOpenUserProfile(user)}
                size="small"
                aria-label={`View ${userName} profile`}
                sx={{
                  p: 0,
                  flexShrink: 0,
                  borderRadius: "50%",
                }}
              >
                <Avatar
                  src={userAvatarUrl}
                  alt={userName}
                  sx={{
                    width: 42,
                    height: 42,
                    bgcolor: "#ff5500",
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "0.18s ease",

                    "&:hover": {
                      borderColor: "#ff5500",
                      transform: "scale(1.04)",
                    },
                  }}
                >
                  {getInitials(userName, userEmail)}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="button"
                type="button"
                title={`View ${userName} profile`}
                onClick={() => handleOpenUserProfile(user)}
                sx={{
                  display: "block",
                  width: "100%",
                  p: 0,
                  m: 0,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",

                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 900,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",

                  "&:hover": {
                    color: "#ff5500",
                    textDecoration: "underline",
                  },
                }}
              >
                {user.name || (
                  <Box component="span" sx={{ color: "#63e6a6" }}>
                    Social user
                  </Box>
                )}
              </Typography>

              <Typography
                title={userEmail}
                sx={{
                  color: "#8f8f8f",
                  fontSize: 12,
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userEmail}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      renderCell: (params) => {
        const role = String(params.row.role || "USER").toUpperCase();

        return (
          <Chip
            label={role}
            size="small"
            sx={{
              color: role === "ADMIN" ? "#ffffff" : "#d7d7d7",
              backgroundColor:
                role === "ADMIN"
                  ? "rgba(255,85,0,0.3)"
                  : "rgba(255,255,255,0.08)",
              fontWeight: 900,
            }}
          />
        );
      },
    },
    {
      field: "type",
      headerName: "Type",
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.row.type || "SYSTEM"}
          size="small"
          sx={{
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
            fontWeight: 800,
          }}
        />
      ),
    },
    {
      field: "accountStatus",
      headerName: "Status",
      width: 150,
      sortable: true,
      valueGetter: (params) => getAccountStatus(params.row),
      renderCell: (params) => {
        const userAny = params.row as any;
        const status = getAccountStatus(params.row);

        const statusStyle: Record<
          string,
          {
            color: string;
            backgroundColor: string;
          }
        > = {
          ACTIVE: {
            color: "#63e6a6",
            backgroundColor: "rgba(99,230,166,0.12)",
          },
          SUSPENDED: {
            color: "#ff7b7b",
            backgroundColor: "rgba(255,90,90,0.14)",
          },
          BANNED: {
            color: "#FF0000",
            backgroundColor: "rgba(255,90,90,0.14)",
          },
          DELETED: {
            color: "#b5b5b5",
            backgroundColor: "rgba(255,255,255,0.08)",
          },
        };

        const style = statusStyle[status] || statusStyle.ACTIVE;

        const suspendedUntil =
          userAny?.suspendedUntil && dayjs(userAny.suspendedUntil).isValid()
            ? dayjs(userAny.suspendedUntil).format("DD/MM/YYYY HH:mm")
            : "";

        const tooltipText =
          status === "SUSPENDED" && suspendedUntil
            ? `${
                userAny?.statusReason || "Account temporarily suspended."
              } Suspended until ${suspendedUntil}.`
            : userAny?.statusReason || `Account status: ${status}`;

        return (
          <Tooltip title={tooltipText}>
            <Chip
              label={status}
              size="small"
              sx={{
                color: style.color,
                backgroundColor: style.backgroundColor,
                fontWeight: 900,
                border: `1px solid ${style.color}33`,
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 120,
    },
    {
      field: "subscriptionTier",
      headerName: "Subscription",
      width: 160,
      sortable: true,
      valueGetter: (params) =>
        String(params.row.subscriptionTier || "FREE").toUpperCase(),

      renderCell: (params) => {
        const tier = String(
          params.row.subscriptionTier || "FREE"
        ).toUpperCase();

        const tierStyle: Record<
          string,
          {
            color: string;
            backgroundColor: string;
          }
        > = {
          FREE: {
            color: "#b5b5b5",
            backgroundColor: "rgba(255,255,255,0.08)",
          },

          ARTIST: {
            color: "#ffd166",
            backgroundColor: "rgba(255,209,102,0.12)",
          },

          ARTIST_PRO: {
            color: "#63e6a6",
            backgroundColor: "rgba(99,230,166,0.12)",
          },
        };

        const style = tierStyle[tier] || tierStyle.FREE;

        return (
          <Chip
            label={tier.replace("_", " ")}
            size="small"
            sx={{
              color: style.color,
              backgroundColor: style.backgroundColor,
              border: `1px solid ${style.color}33`,
              fontWeight: 900,
            }}
          />
        );
      },
    },
    {
      field: "followers",
      headerName: "Followers",
      width: 120,
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY") : "",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 300,
      align: "center",
      headerAlign: "center",
      sortable: false,
      filterable: false,

      renderCell: (params) => {
        const user = params.row;
        const userId = getItemId(user);

        const accountStatus = getAccountStatus(user);
        const chatStatus = getChatStatus(user);

        const isAdmin = String(user.role || "").toUpperCase() === "ADMIN";

        const isSuspended = accountStatus === "SUSPENDED";

        const isDeactivated = accountStatus === "DELETED";

        const isChatBanned = chatStatus === "BANNED";

        const isLoading = deletingId === userId;

        const accountReason = String(user.statusReason || "").trim();
        const chatBanReason = String(user.chatBanReason || "").trim();
        const hasRestrictionReason = Boolean(accountReason || chatBanReason);

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.4,
            }}
          >
            {/* MANAGE USER BADGES */}
            <Tooltip title="Manage badges">
              <span>
                <IconButton
                  onClick={() => handleOpenBadges(user)}
                  disabled={isLoading || isDeactivated}
                  size="small"
                  aria-label={`Manage badges for ${user.name || user.email}`}
                  sx={{
                    color: "#ffb020",

                    "&:hover": {
                      color: "#ffd166",
                      backgroundColor: "rgba(255,176,32,0.12)",
                    },

                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <WorkspacePremiumRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            {/* EDIT USER */}
            <Tooltip title="Edit user">
              <span>
                <IconButton
                  onClick={() => handleOpenEdit(user)}
                  disabled={isLoading || isDeactivated}
                  size="small"
                  sx={{
                    color: "#9a9a9a",
                    "&:hover": {
                      color: "#ffffff",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <EditRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* SUSPEND 7 DAYS / REACTIVATE */}
            <Tooltip
              title={
                isDeactivated
                  ? "Reactivate the account using the permanent-disable button"
                  : isSuspended
                  ? "Reactivate account"
                  : "Suspend account for 7 days"
              }
            >
              <span>
                <IconButton
                  onClick={() =>
                    handleUserAction(user, isSuspended ? "ACTIVATE" : "SUSPEND")
                  }
                  disabled={isLoading || isAdmin || isDeactivated}
                  size="small"
                  sx={{
                    color: isSuspended ? "#63e6a6" : "#ff5a5a",

                    "&:hover": {
                      backgroundColor: isSuspended
                        ? "rgba(99,230,166,0.12)"
                        : "rgba(255,90,90,0.12)",
                    },

                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  {isSuspended ? (
                    <LockOpenRoundedIcon fontSize="small" />
                  ) : (
                    <BlockRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {/* DISABLE FOREVER / REACTIVATE */}
            <Tooltip
              title={
                isDeactivated
                  ? "Reactivate account"
                  : "Disable account indefinitely"
              }
            >
              <span>
                <IconButton
                  onClick={() =>
                    handleUserAction(
                      user,
                      isDeactivated ? "ACTIVATE" : "DEACTIVATE"
                    )
                  }
                  disabled={isLoading || isAdmin}
                  size="small"
                  sx={{
                    color: isDeactivated ? "#63e6a6" : "#b5b5b5",

                    "&:hover": {
                      backgroundColor: isDeactivated
                        ? "rgba(99,230,166,0.12)"
                        : "rgba(255,255,255,0.1)",
                    },

                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  {isDeactivated ? (
                    <LockOpenRoundedIcon fontSize="small" />
                  ) : (
                    <DeleteForeverRoundedIcon fontSize="small" />
                  )}
                </IconButton>
              </span>
            </Tooltip>

            {/* BAN CHAT / ENABLE CHAT */}
            <Tooltip
              title={isChatBanned ? "Enable comments" : "Disable comments"}
            >
              <span>
                <IconButton
                  onClick={() =>
                    handleUserAction(
                      user,
                      isChatBanned ? "ENABLE_CHAT" : "BAN_CHAT"
                    )
                  }
                  disabled={isLoading || isAdmin}
                  size="small"
                  sx={{
                    color: isChatBanned ? "#63e6a6" : "#ffd166",

                    "&:hover": {
                      backgroundColor: isChatBanned
                        ? "rgba(99,230,166,0.12)"
                        : "rgba(255,209,102,0.12)",
                    },

                    "&.Mui-disabled": {
                      color: "rgba(255,255,255,0.2)",
                    },
                  }}
                >
                  <CommentsDisabledRoundedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            {/* RESTRICTION REASON */}
            {hasRestrictionReason && (
              <Tooltip
                arrow
                placement="top"
                title={
                  <Box
                    sx={{
                      maxWidth: 320,
                      py: 0.5,
                    }}
                  >
                    {accountReason && (
                      <Box sx={{ mb: chatBanReason ? 1.2 : 0 }}>
                        <Typography
                          sx={{
                            color: "#ff9b9b",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          Account restriction
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.3,
                            color: "#ffffff",
                            fontSize: 12,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {accountReason}
                        </Typography>

                        {accountStatus === "SUSPENDED" &&
                          user.suspendedUntil &&
                          dayjs(user.suspendedUntil).isValid() && (
                            <Typography
                              sx={{
                                mt: 0.5,
                                color: "#cfcfcf",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              Until:{" "}
                              {dayjs(user.suspendedUntil).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </Typography>
                          )}
                      </Box>
                    )}

                    {chatBanReason && (
                      <Box>
                        <Typography
                          sx={{
                            color: "#ffd166",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          Comment restriction
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.3,
                            color: "#ffffff",
                            fontSize: 12,
                            lineHeight: 1.5,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {chatBanReason}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              >
                <IconButton
                  size="small"
                  aria-label="View restriction reason"
                  sx={{
                    color: "#70b7ff",

                    "&:hover": {
                      color: "#9bceff",
                      backgroundColor: "rgba(112,183,255,0.12)",
                    },
                  }}
                >
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },
  ];

  const actionConfig: Record<
    UserAction,
    {
      title: string;
      description: string;
      buttonLabel: string;
      loadingLabel: string;
      backgroundColor: string;
      hoverColor: string;
      requiresReason: boolean;
      reasonLabel?: string;
      reasonPlaceholder?: string;
    }
  > = {
    SUSPEND: {
      title: "Suspend account for 7 days?",
      description:
        "The user will be unable to sign in for 7 days. Account data will be preserved.",
      buttonLabel: "Suspend 7 days",
      loadingLabel: "Suspending...",
      backgroundColor: "#ff4d4f",
      hoverColor: "#ff2f32",
      requiresReason: true,
      reasonLabel: "Suspension reason",
      reasonPlaceholder:
        "Example: Repeated spam activity or community guideline violations.",
    },

    ACTIVATE: {
      title: "Reactivate account?",
      description: "The user will immediately be allowed to sign in again.",
      buttonLabel: "Reactivate",
      loadingLabel: "Reactivating...",
      backgroundColor: "#2f9e68",
      hoverColor: "#27865a",
      requiresReason: false,
    },

    DEACTIVATE: {
      title: "Disable account indefinitely?",
      description:
        "The user will remain unable to sign in until an administrator reactivates the account. All account data will be preserved.",
      buttonLabel: "Disable account",
      loadingLabel: "Disabling...",
      backgroundColor: "#646464",
      hoverColor: "#505050",
      requiresReason: true,
      reasonLabel: "Account restriction reason",
      reasonPlaceholder:
        "Explain why this account is being disabled indefinitely.",
    },

    BAN_CHAT: {
      title: "Disable comments?",
      description:
        "The user can still sign in and listen to music, but cannot post comments until an administrator enables chat again.",
      buttonLabel: "Disable comments",
      loadingLabel: "Disabling...",
      backgroundColor: "#c79500",
      hoverColor: "#a97e00",
      requiresReason: true,
      reasonLabel: "Comment restriction reason",
      reasonPlaceholder:
        "Example: Spam, abusive comments or repeated policy violations.",
    },

    ENABLE_CHAT: {
      title: "Enable comments?",
      description: "The user will be allowed to post comments again.",
      buttonLabel: "Enable comments",
      loadingLabel: "Enabling...",
      backgroundColor: "#2f9e68",
      hoverColor: "#27865a",
      requiresReason: false,
    },
  };

  const currentActionConfig = confirmAction
    ? actionConfig[confirmAction]
    : null;

  return (
    <Box>
      <DashboardTableToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      />

      {/* USERS TABLE */}
      <Box
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
          backgroundColor: "#111314",
          border: "1px solid rgba(255,255,255,0.08)",

          "& .MuiDataGrid-sortIcon": {
            color: "#ffffff",
            opacity: 1,
          },

          "& .MuiDataGrid-menuIconButton": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-menuIconButton:hover": {
            color: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-iconSeparator": {
            color: "rgba(255,255,255,0.35)",
          },

          "& .MuiDataGrid-columnHeader .MuiIconButton-root": {
            color: "#cfcfcf",
          },

          "& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-sortIcon": {
            color: "#63e6a6",
          },

          "& .MuiDataGrid-root": {
            border: "none",
            color: "#ffffff",
            backgroundColor: "#111314",
          },

          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          },

          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 900,
          },

          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            color: "#ffffff",
          },

          "& .MuiDataGrid-row:hover": {
            backgroundColor: "rgba(255,255,255,0.035)",
          },

          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#181A1B",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "#ffffff",
          },

          "& .MuiTablePagination-root": {
            color: "#ffffff",
          },

          "& .MuiSvgIcon-root": {
            color: "inherit",
          },

          "& .MuiDataGrid-overlay": {
            backgroundColor: "#111314",
            color: "#9a9a9a",
            fontWeight: 800,
          },
        }}
      >
        <DataGrid
          rows={filteredUsers}
          columns={columns}
          getRowId={(row) => getItemId(row)}
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

      {/* EDIT USER DIALOG */}
      <Dialog
        open={openEdit}
        onClose={handleCloseEdit}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: "#111314",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: 900,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center",
          }}
        >
          User details
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: 1.2,
              mb: 5,
              mt: 5,
            }}
          >
            <Avatar
              src={getUserAvatarUrl(
                editUser
                  ? {
                      ...editUser,
                      age: editUser.age === "" ? null : Number(editUser.age),
                    }
                  : null
              )}
              alt={editUser?.name || "User"}
              sx={{
                width: 70,
                height: 70,
                bgcolor: "#ff5500",
                color: "#ffffff",
                fontWeight: 900,
                fontSize: 22,
              }}
            >
              {getInitials(editUser?.name, editUser?.email)}
            </Avatar>

            <Box>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontWeight: 900,
                }}
              >
                {editUser?.name || "Social user"}
              </Typography>

              <Typography
                sx={{
                  color: "#9a9a9a",
                  fontSize: 13,
                }}
              >
                {editUser?.email}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gap: 2 }}>
            {/* READ-ONLY USER NAME */}
            <TextField
              label="Name"
              value={editUser?.name || ""}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={readOnlyTextFieldSx}
            />

            {/* READ-ONLY USER EMAIL */}
            <TextField
              label="Email"
              value={editUser?.email || ""}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={readOnlyTextFieldSx}
            />

            {/* READ-ONLY USER AGE */}
            <TextField
              label="Age"
              value={editUser?.age || "Not provided"}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={readOnlyTextFieldSx}
            />

            {/* READ-ONLY USER GENDER */}
            <TextField
              label="Gender"
              value={editUser?.gender || "Not provided"}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={readOnlyTextFieldSx}
            />

            {/* EDITABLE USER BIO */}
            <TextField
              label="Bio"
              value={editUser?.bio || ""}
              onChange={(event) =>
                setEditUser((previous) =>
                  previous
                    ? {
                        ...previous,
                        bio: event.target.value.slice(0, 500),
                      }
                    : previous
                )
              }
              placeholder="Enter the user's profile bio."
              multiline
              minRows={4}
              maxRows={8}
              fullWidth
              helperText={`${editUser?.bio?.length || 0}/500 characters`}
              sx={{
                ...darkTextFieldSx,

                "& .MuiFormHelperText-root": {
                  color: "#8f8f8f",
                  fontWeight: 700,
                  marginLeft: 0,
                },
              }}
            />

            {/* READ-ONLY USER ROLE */}
            <TextField
              label="Role"
              value={editUser?.role || "USER"}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={readOnlyTextFieldSx}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Button
            onClick={handleCloseEdit}
            disabled={saving}
            sx={{
              color: "#d7d7d7",
              textTransform: "none",
              fontWeight: 900,
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSaveUser}
            disabled={saving}
            sx={{
              px: 2.2,
              borderRadius: "999px",
              backgroundColor: "#ff5500",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 900,

              "&:hover": {
                backgroundColor: "#ff6a1a",
              },

              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.55)",
                backgroundColor: "rgba(255,85,0,0.3)",
              },
            }}
          >
            {saving ? "Saving..." : "Save bio"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* USER ACTION CONFIRMATION DIALOG */}
      <Dialog
        open={!!confirmUser && !!confirmAction}
        onClose={() => {
          if (deletingId) return;

          resetActionDialog();
        }}
        PaperProps={{
          sx: {
            backgroundColor: "#181A1B",
            color: "#ffffff",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.12)",
            width: "calc(100% - 32px)",
            maxWidth: 460,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          {currentActionConfig?.title}
        </DialogTitle>

        <DialogContent>
          <Typography
            sx={{
              color: "#d7d7d7",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            User:{" "}
            <Box
              component="span"
              sx={{
                color: "#ffffff",
                fontWeight: 900,
              }}
            >
              {confirmUser?.name || confirmUser?.email}
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              color: "#9a9a9a",
              fontSize: 13,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            {currentActionConfig?.description}
          </Typography>

          {/* ADMIN RESTRICTION REASON */}
          {currentActionConfig?.requiresReason && (
            <TextField
              autoFocus
              required
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              label={currentActionConfig.reasonLabel || "Reason"}
              placeholder={
                currentActionConfig.reasonPlaceholder ||
                "Enter the reason for this action."
              }
              value={actionReason}
              onChange={(event) => {
                setActionReason(event.target.value.slice(0, 500));
              }}
              helperText={`Required • ${actionReason.length}/500 characters`}
              sx={{
                ...darkTextFieldSx,
                mt: 2.5,

                "& .MuiFormHelperText-root": {
                  color: actionReason.trim() ? "#8f8f8f" : "#ffd166",
                  fontWeight: 700,
                  marginLeft: 0,
                },
              }}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={resetActionDialog}
            disabled={!!deletingId}
            sx={{
              color: "#cfcfcf",
              fontWeight: 800,
              textTransform: "none",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              !!deletingId ||
              !confirmUser ||
              !confirmAction ||
              Boolean(
                currentActionConfig?.requiresReason && !actionReason.trim()
              )
            }
            onClick={async () => {
              const selectedUser = confirmUser;
              const selectedAction = confirmAction;

              if (!selectedUser || !selectedAction) {
                return;
              }

              const selectedConfig = actionConfig[selectedAction];

              if (selectedConfig.requiresReason && !actionReason.trim()) {
                toast.error("Please enter a reason before continuing.");
                return;
              }

              switch (selectedAction) {
                case "SUSPEND":
                  await suspendUser(selectedUser);
                  break;

                case "ACTIVATE":
                  await activateUser(selectedUser);
                  break;

                case "DEACTIVATE":
                  await deactivateUser(selectedUser);
                  break;

                case "BAN_CHAT":
                  await banUserChat(selectedUser);
                  break;

                case "ENABLE_CHAT":
                  await enableUserChat(selectedUser);
                  break;
              }
            }}
            sx={{
              minWidth: 140,
              backgroundColor:
                currentActionConfig?.backgroundColor || "#ff5500",
              color: "#ffffff",
              fontWeight: 900,
              textTransform: "none",

              "&:hover": {
                backgroundColor: currentActionConfig?.hoverColor || "#ff6a1a",
              },

              "&.Mui-disabled": {
                color: "rgba(255,255,255,0.55)",
                backgroundColor: "rgba(255,255,255,0.12)",
              },
            }}
          >
            {deletingId
              ? currentActionConfig?.loadingLabel
              : currentActionConfig?.buttonLabel}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MANAGE USER BADGES DIALOG */}
      <ManageUserBadgesDialog
        open={Boolean(badgeUser)}
        user={badgeUser}
        accessToken={accessToken}
        onClose={() => {
          setBadgeUser(null);
        }}
      />
    </Box>
  );
};

const readOnlyTextFieldSx = {
  "& .MuiInputLabel-root": {
    color: "#8f8f8f",
    fontWeight: 700,
  },

  "& .MuiOutlinedInput-root": {
    color: "#cfcfcf",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderRadius: 2,
    fontWeight: 700,
    cursor: "default",

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.08)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.08)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "rgba(255,255,255,0.12)",
    },
  },

  "& .MuiInputBase-input": {
    cursor: "default",
  },
};

const darkTextFieldSx = {
  "& .MuiInputLabel-root": {
    color: "#9a9a9a",
    fontWeight: 700,
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#ff5500",
  },

  "& .MuiOutlinedInput-root": {
    color: "#ffffff",
    backgroundColor: "#0f1111",
    borderRadius: 2,
    fontWeight: 700,

    "& fieldset": {
      borderColor: "rgba(255,255,255,0.1)",
    },

    "&:hover fieldset": {
      borderColor: "rgba(255,255,255,0.24)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#ff5500",
    },
  },

  "& .MuiSelect-icon": {
    color: "#ffffff",
  },
};

export default UsersTable;
