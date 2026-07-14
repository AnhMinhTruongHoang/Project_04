"use client";

import type { ReactNode } from "react";

import { useEffect, useMemo, useState } from "react";

import { signIn, useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import AttachMoneyRoundedIcon from "@mui/icons-material/AttachMoneyRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";

import {
  changeSubscriptionPlanApi,
  getMySubscriptionApi,
  getSubscriptionPlansApi,
} from "@/utils/api";

type NoticeState = {
  open: boolean;
  type: "success" | "error";
  message: string;
};

type CompareFeatureKey =
  | "upload"
  | "publicTracks"
  | "copyrightReview"
  | "insights"
  | "schedule"
  | "distribution"
  | "monetization"
  | "benefits";

type CompareFeature = {
  key: CompareFeatureKey;
  label: string;
  description: string;
};

type CompareGroup = {
  title: string;
  features: CompareFeature[];
};

const compareGroups: CompareGroup[] = [
  {
    title: "Get heard",
    features: [
      {
        key: "upload",
        label: "Upload allowance",
        description: "Upload original tracks to your SoundClone profile.",
      },
      {
        key: "publicTracks",
        label: "Public tracks",
        description: "Publish approved tracks and share them with listeners.",
      },
      {
        key: "copyrightReview",
        label: "Copyright review",
        description: "Uploaded audio is checked before it becomes public.",
      },
    ],
  },
  {
    title: "Manage your music",
    features: [
      {
        key: "insights",
        label: "Advanced insights",
        description: "Review performance and audience data for your tracks.",
      },
      {
        key: "schedule",
        label: "Schedule releases",
        description: "Choose when an approved release becomes available.",
      },
      {
        key: "distribution",
        label: "Music distribution",
        description: "Access supported distribution tools from Artist Studio.",
      },
    ],
  },
  {
    title: "Get paid",
    features: [
      {
        key: "monetization",
        label: "Track monetization",
        description: "Unlock supported creator monetization tools.",
      },
      {
        key: "benefits",
        label: "Artist Pro benefits",
        description: "Access premium creator benefits and partner offers.",
      },
    ],
  },
];

const getPlanAccent = (code: SubscriptionPlanCode) => {
  if (code === "ARTIST_PRO") {
    return {
      main: "#d7a928",
      soft: "rgba(215,169,40,0.12)",
      border: "rgba(215,169,40,0.72)",
      gradient:
        "linear-gradient(135deg, rgba(215,169,40,0.16), rgba(255,255,255,0.02))",
    };
  }

  if (code === "ARTIST") {
    return {
      main: "#8b5cf6",
      soft: "rgba(139,92,246,0.12)",
      border: "rgba(139,92,246,0.64)",
      gradient:
        "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(255,255,255,0.02))",
    };
  }

  return {
    main: "#c4c4c4",
    soft: "rgba(255,255,255,0.06)",
    border: "rgba(255,255,255,0.16)",
    gradient:
      "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.015))",
  };
};

const formatPrice = (value?: number) => {
  const price = Number(value || 0);

  if (price <= 0) {
    return "Free";
  }

  return new Intl.NumberFormat("vi-VN").format(price);
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
  }).format(date);
};

const getFeatureValue = (
  plan: ISubscriptionPlan,
  feature: CompareFeatureKey
): ReactNode => {
  switch (feature) {
    case "upload":
      return plan.unlimitedUploads
        ? "Unlimited"
        : `${plan.uploadMinutesLimit} minutes`;

    case "publicTracks":
      return true;

    case "copyrightReview":
      return true;

    case "insights":
      return plan.advancedInsightsDays <= 0
        ? "Unlimited"
        : `${plan.advancedInsightsDays} days`;

    case "schedule":
      return plan.canScheduleRelease;

    case "distribution":
      return plan.canDistribute;

    case "monetization":
      return plan.canMonetize;

    case "benefits":
      return plan.hasMembershipBenefits;

    default:
      return false;
  }
};

const FeatureValue = ({ value }: { value: ReactNode }) => {
  if (value === true) {
    return (
      <CheckCircleRoundedIcon
        sx={{
          color: "#22c55e",
          fontSize: 19,
        }}
      />
    );
  }

  if (value === false || value === null || value === undefined) {
    return (
      <RemoveRoundedIcon
        sx={{
          color: "#60656d",
          fontSize: 19,
        }}
      />
    );
  }

  return (
    <Typography
      sx={{
        color: "#f3f4f6",
        fontSize: 12,
        fontWeight: 850,
        textAlign: "center",
      }}
    >
      {value}
    </Typography>
  );
};

const PlanFeature = ({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          color: "#b8bec8",

          "& svg": {
            fontSize: 17,
          },
        }}
      >
        {icon}
      </Box>

      <Typography
        sx={{
          color: "#d1d5db",
          fontSize: 12,
          fontWeight: 750,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

const SubscriptionPlansView = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [plans, setPlans] = useState<ISubscriptionPlan[]>([]);

  const [mySubscription, setMySubscription] =
    useState<IMySubscriptionData | null>(null);

  const [loadingPlans, setLoadingPlans] = useState(true);

  const [loadingSubscription, setLoadingSubscription] = useState(false);

  const [changingPlanCode, setChangingPlanCode] = useState<
    SubscriptionPlanCode | ""
  >("");

  const [loadError, setLoadError] = useState("");

  const [notice, setNotice] = useState<NoticeState>({
    open: false,
    type: "success",
    message: "",
  });

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  useEffect(() => {
    let cancelled = false;

    const loadPlans = async () => {
      try {
        setLoadingPlans(true);
        setLoadError("");

        const response = await getSubscriptionPlansApi();

        if (cancelled) {
          return;
        }

        if (response?.error || Number(response?.statusCode) >= 400) {
          setPlans([]);

          setLoadError(response?.message || "Cannot load subscription plans.");

          return;
        }

        const responseData = response?.data as any;

        const nextPlans: ISubscriptionPlan[] = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.result)
          ? responseData.result
          : [];

        setPlans(nextPlans.filter((plan) => plan && plan.isActive !== false));
      } catch (error) {
        console.error("Cannot load subscription plans:", error);

        if (!cancelled) {
          setPlans([]);

          setLoadError("Cannot load subscription plans.");
        }
      } finally {
        if (!cancelled) {
          setLoadingPlans(false);
        }
      }
    };

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    if (!accessToken) {
      setMySubscription(null);
      setLoadingSubscription(false);

      return;
    }

    let cancelled = false;

    const loadCurrentSubscription = async () => {
      try {
        setLoadingSubscription(true);

        const response = await getMySubscriptionApi(accessToken);

        if (cancelled) {
          return;
        }

        if (response?.error || Number(response?.statusCode) >= 400) {
          setMySubscription(null);

          return;
        }

        setMySubscription(response?.data || null);
      } catch (error) {
        console.error("Cannot load current subscription:", error);

        if (!cancelled) {
          setMySubscription(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingSubscription(false);
        }
      }
    };

    void loadCurrentSubscription();

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  const sortedPlans = useMemo(() => {
    return [...plans].sort(
      (first, second) =>
        Number(first.monthlyPrice || 0) - Number(second.monthlyPrice || 0)
    );
  }, [plans]);

  const paidPlans = useMemo(() => {
    return sortedPlans.filter(
      (plan) => plan.code === "ARTIST" || plan.code === "ARTIST_PRO"
    );
  }, [sortedPlans]);

  const currentPlanCode = mySubscription?.plan?.code || "";

  const handleChoosePlan = async (plan: ISubscriptionPlan) => {
    if (currentPlanCode === plan.code) {
      return;
    }

    if (!accessToken) {
      await signIn();

      return;
    }

    try {
      setChangingPlanCode(plan.code);

      const response = await changeSubscriptionPlanApi(plan.code, accessToken);

      if (
        response?.error ||
        Number(response?.statusCode) >= 400 ||
        !response?.data
      ) {
        setNotice({
          open: true,
          type: "error",
          message: response?.message || "Cannot change subscription plan.",
        });

        return;
      }

      setMySubscription(response.data);

      setNotice({
        open: true,
        type: "success",
        message: `Your plan is now ${response.data.plan.name}.`,
      });
    } catch (error) {
      console.error("Cannot change plan:", error);

      setNotice({
        open: true,
        type: "error",
        message: "Cannot change subscription plan.",
      });
    } finally {
      setChangingPlanCode("");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: "#ffffff",

        background:
          "radial-gradient(circle at 50% -10%, rgba(255,85,0,0.11), transparent 30%), linear-gradient(180deg, #111314 0%, #090b0c 100%)",

        px: {
          xs: 2,
          sm: 3,
          md: 5,
        },

        pt: {
          xs: 5,
          md: 7,
        },

        pb: 12,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1160,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            mb: {
              xs: 4,
              md: 5,
            },
          }}
        >
          <Typography
            component="h1"
            sx={{
              color: "#ffffff",
              fontSize: {
                xs: 30,
                md: 42,
              },
              fontWeight: 950,
              letterSpacing: "-0.045em",
            }}
          >
            Available plans.
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#9ca3af",
              fontSize: {
                xs: 13,
                md: 15,
              },
              fontWeight: 650,
            }}
          >
            Choose the creator tools that match your music journey.
          </Typography>

          {loadingSubscription && (
            <CircularProgress
              size={18}
              sx={{
                mt: 2,
                color: "#FF5500",
              }}
            />
          )}

          {mySubscription && (
            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              <Chip
                size="small"
                label={`Current plan: ${mySubscription.plan.name}`}
                sx={{
                  color: "#ffffff",
                  backgroundColor: "rgba(255,85,0,0.16)",
                  border: "1px solid rgba(255,85,0,0.42)",
                  fontWeight: 900,
                }}
              />

              <Typography
                sx={{
                  color: "#8b949e",
                  fontSize: 12,
                }}
              >
                Renews until{" "}
                {formatDate(mySubscription.subscription.currentPeriodEnd)}
              </Typography>
            </Box>
          )}
        </Box>

        {loadingPlans && (
          <Box
            sx={{
              minHeight: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress
              sx={{
                color: "#FF5500",
              }}
            />
          </Box>
        )}

        {!loadingPlans && loadError && (
          <Alert
            severity="error"
            sx={{
              maxWidth: 700,
              mx: "auto",
              color: "#ffffff",
              backgroundColor: "rgba(211,47,47,0.14)",
            }}
          >
            {loadError}
          </Alert>
        )}

        {!loadingPlans && !loadError && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2.5,
              maxWidth: 820,
              mx: "auto",
            }}
          >
            {paidPlans.map((plan) => {
              const accent = getPlanAccent(plan.code);

              const isCurrent = currentPlanCode === plan.code;

              const isChanging = changingPlanCode === plan.code;

              const isPopular = plan.code === "ARTIST_PRO";

              return (
                <Box
                  key={plan.id}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    minHeight: 390,

                    borderRadius: "10px",

                    border: `1px solid ${
                      isCurrent ? accent.main : accent.border
                    }`,

                    background: accent.gradient,

                    boxShadow: isPopular
                      ? "0 22px 60px rgba(215,169,40,0.13)"
                      : "0 22px 60px rgba(0,0,0,0.24)",

                    p: {
                      xs: 2.5,
                      md: 3,
                    },

                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {isPopular && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,

                        px: 1.4,
                        py: 0.55,

                        color: "#111111",
                        backgroundColor: accent.main,

                        fontSize: 9,
                        fontWeight: 950,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      Most popular
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <WorkspacePremiumRoundedIcon
                      sx={{
                        color: accent.main,
                        fontSize: 20,
                      }}
                    />

                    <Typography
                      sx={{
                        color: "#ffffff",
                        fontSize: 19,
                        fontWeight: 950,
                      }}
                    >
                      {plan.name}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      mt: 1,
                      minHeight: 44,
                      color: "#aeb4bd",
                      fontSize: 12,
                      fontWeight: 650,
                      lineHeight: 1.6,
                    }}
                  >
                    {plan.description}
                  </Typography>

                  <Box
                    sx={{
                      mt: 2.5,
                      display: "flex",
                      alignItems: "baseline",
                      gap: 0.7,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#ffffff",
                        fontSize: 31,
                        fontWeight: 950,
                        letterSpacing: "-0.045em",
                      }}
                    >
                      {formatPrice(plan.monthlyPrice)}
                    </Typography>

                    {plan.monthlyPrice > 0 && (
                      <Typography
                        sx={{
                          color: "#8b949e",
                          fontSize: 11,
                          fontWeight: 750,
                        }}
                      >
                        VNĐ / month
                      </Typography>
                    )}
                  </Box>

                  <Button
                    fullWidth
                    disabled={isCurrent || isChanging}
                    onClick={() => void handleChoosePlan(plan)}
                    sx={{
                      mt: 2,
                      mb: 2.5,
                      height: 42,
                      borderRadius: "999px",
                      color: isCurrent ? "#a0a0a0" : "#ffffff",

                      backgroundColor: isCurrent
                        ? "rgba(255,255,255,0.06)"
                        : "#050505",

                      border: "1px solid rgba(255,255,255,0.2)",

                      textTransform: "none",
                      fontSize: 13,
                      fontWeight: 950,

                      "&:hover": {
                        backgroundColor: accent.main,
                        color:
                          plan.code === "ARTIST_PRO" ? "#111111" : "#ffffff",
                      },

                      "&.Mui-disabled": {
                        color: "#8c8c8c",
                        backgroundColor: "rgba(255,255,255,0.05)",
                      },
                    }}
                  >
                    {isChanging ? (
                      <CircularProgress
                        size={18}
                        sx={{
                          color: accent.main,
                        }}
                      />
                    ) : isCurrent ? (
                      "Current plan"
                    ) : accessToken ? (
                      `Choose ${plan.name}`
                    ) : (
                      "Sign in to upgrade"
                    )}
                  </Button>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.25,
                    }}
                  >
                    <PlanFeature icon={<CloudUploadRoundedIcon />}>
                      {plan.unlimitedUploads
                        ? "Unlimited uploads"
                        : `${plan.uploadMinutesLimit} upload minutes`}
                    </PlanFeature>

                    <PlanFeature icon={<InsightsRoundedIcon />}>
                      {plan.advancedInsightsDays <= 0
                        ? "Unlimited advanced insights"
                        : `${plan.advancedInsightsDays} days of advanced insights`}
                    </PlanFeature>

                    <PlanFeature icon={<PublicRoundedIcon />}>
                      {plan.canDistribute
                        ? "Music distribution included"
                        : "Standard public publishing"}
                    </PlanFeature>

                    <PlanFeature icon={<ScheduleRoundedIcon />}>
                      {plan.canScheduleRelease
                        ? "Schedule releases"
                        : "Manual publishing"}
                    </PlanFeature>

                    <PlanFeature icon={<AttachMoneyRoundedIcon />}>
                      {plan.canMonetize
                        ? "Creator monetization"
                        : "Monetization not included"}
                    </PlanFeature>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {!loadingPlans && !loadError && sortedPlans.length > 0 && (
          <Box
            sx={{
              mt: {
                xs: 9,
                md: 12,
              },
            }}
          >
            <Typography
              component="h2"
              sx={{
                mb: 4,
                color: "#ffffff",
                fontSize: {
                  xs: 28,
                  md: 38,
                },
                fontWeight: 950,
                textAlign: "center",
                letterSpacing: "-0.04em",
              }}
            >
              Compare features.
            </Typography>

            <Box
              sx={{
                overflowX: "auto",
                borderRadius: "10px",

                border: "1px solid rgba(255,255,255,0.1)",

                backgroundColor: "rgba(13,15,16,0.88)",

                "&::-webkit-scrollbar": {
                  height: 8,
                },

                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderRadius: "999px",
                },
              }}
            >
              <Box
                sx={{
                  minWidth: 850,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(280px,1.5fr) repeat(3,minmax(160px,1fr))",

                    minHeight: 130,
                    alignItems: "center",

                    borderBottom: "1px solid rgba(255,255,255,0.14)",
                  }}
                >
                  <Box
                    sx={{
                      px: 3,
                    }}
                  />

                  {sortedPlans.map((plan) => {
                    const accent = getPlanAccent(plan.code);

                    const isCurrent = currentPlanCode === plan.code;

                    return (
                      <Box
                        key={plan.id}
                        sx={{
                          px: 2,
                          py: 2.5,
                          textAlign: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            color: "#ffffff",
                            fontSize: 15,
                            fontWeight: 950,
                          }}
                        >
                          {plan.name}
                        </Typography>

                        <Typography
                          sx={{
                            mt: 0.5,
                            color: "#8b949e",
                            fontSize: 10.5,
                            fontWeight: 700,
                          }}
                        >
                          {plan.monthlyPrice > 0
                            ? `${formatPrice(plan.monthlyPrice)} VNĐ / month`
                            : "Free"}
                        </Typography>

                        <Chip
                          size="small"
                          label={
                            isCurrent
                              ? "Current"
                              : plan.code === "BASIC"
                              ? "Get started"
                              : "Select"
                          }
                          sx={{
                            mt: 1.2,
                            height: 22,

                            color: isCurrent ? accent.main : "#ffffff",

                            backgroundColor: isCurrent
                              ? accent.soft
                              : "rgba(255,255,255,0.06)",

                            border: `1px solid ${
                              isCurrent
                                ? accent.border
                                : "rgba(255,255,255,0.12)"
                            }`,

                            fontSize: 9,
                            fontWeight: 900,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>

                {compareGroups.map((group) => (
                  <Box key={group.title}>
                    <Box
                      sx={{
                        px: 3,
                        py: 1.4,
                        color: "#ffffff",
                        backgroundColor: "rgba(255,255,255,0.035)",
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 950,
                          textTransform: "uppercase",
                          letterSpacing: "0.045em",
                        }}
                      >
                        {group.title}
                      </Typography>
                    </Box>

                    {group.features.map((feature, featureIndex) => (
                      <Box
                        key={feature.key}
                        sx={{
                          display: "grid",

                          gridTemplateColumns:
                            "minmax(280px,1.5fr) repeat(3,minmax(160px,1fr))",

                          minHeight: 78,

                          alignItems: "center",

                          borderBottom:
                            featureIndex === group.features.length - 1
                              ? "none"
                              : "1px solid rgba(255,255,255,0.075)",
                        }}
                      >
                        <Box
                          sx={{
                            px: 3,
                            py: 1.5,
                          }}
                        >
                          <Typography
                            sx={{
                              color: "#ffffff",
                              fontSize: 12,
                              fontWeight: 900,
                            }}
                          >
                            {feature.label}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              maxWidth: 340,
                              color: "#777f89",
                              fontSize: 9.5,
                              fontWeight: 650,
                              lineHeight: 1.45,
                            }}
                          >
                            {feature.description}
                          </Typography>
                        </Box>

                        {sortedPlans.map((plan) => (
                          <Box
                            key={`${plan.id}-${feature.key}`}
                            sx={{
                              px: 2,
                              py: 1.5,

                              minHeight: 78,

                              display: "flex",

                              alignItems: "center",

                              justifyContent: "center",

                              borderLeft: "1px solid rgba(255,255,255,0.055)",
                            }}
                          >
                            <FeatureValue
                              value={getFeatureValue(plan, feature.key)}
                            />
                          </Box>
                        ))}
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )}

        <Divider
          sx={{
            mt: 8,
            mb: 3,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        />

        <Typography
          sx={{
            color: "#747b84",
            fontSize: 11,
            textAlign: "center",
            lineHeight: 1.8,
          }}
        >
          Subscription changes are activated directly while the payment module
          is still in test mode. AI mastering is not included in SoundClone
          plans.
        </Typography>
      </Box>

      <Snackbar
        open={notice.open}
        autoHideDuration={4000}
        onClose={() =>
          setNotice((previous) => ({
            ...previous,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
      >
        <Alert
          severity={notice.type}
          variant="filled"
          onClose={() =>
            setNotice((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SubscriptionPlansView;
