"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import ArtistBenefits from "./artistBenefits";
import ArtistEarningsOverview from "./artistEarningsOverview";
import ArtistStudioStats from "./artistStudioStats";
import ArtistSubscriptionManager from "./artistSubscriptionManager";
import ArtistTracksTable from "./artistTracksTable";
import StudioActions from "./studioActions";
import StudioTabs, { studioTabs } from "./studioTabs";
import UploadQuotaBar from "./uploadQuotaBar";

import {
  getArtistBenefitsApi,
  getArtistStudioStatsApi,
  getMySubscriptionApi,
} from "@/utils/api";

const defaultStudioStats: IArtistStudioStats = {
  plays: 0,
  reposts: 0,
  downloads: 0,
  likes: 0,
  comments: 0,
  earnings: 0,
  fans: 0,
};

const ArtistStudioView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: session, status: sessionStatus } = useSession();

  const [activeTab, setActiveTab] = useState<StudioTab>("tracks");

  const [studioStats, setStudioStats] =
    useState<IArtistStudioStats>(defaultStudioStats);

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [subscriptionData, setSubscriptionData] =
    useState<IMySubscriptionData | null>(null);

  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [benefits, setBenefits] = useState<IArtistBenefit[]>([]);
  const [benefitsLoading, setBenefitsLoading] = useState(true);
  const [benefitsError, setBenefitsError] = useState("");

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (!requestedTab) {
      return;
    }

    const validTab = studioTabs.some((tab) => tab.value === requestedTab);

    if (!validTab) {
      return;
    }

    setActiveTab(requestedTab as StudioTab);
  }, [searchParams]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    const loadStudioStats = async () => {
      if (!accessToken) {
        setStudioStats(defaultStudioStats);
        setStatsError("Please login to view Artist Studio stats.");
        setStatsLoading(false);
        return;
      }

      try {
        setStatsLoading(true);
        setStatsError("");

        const response = await getArtistStudioStatsApi(accessToken);

        if (cancelled) {
          return;
        }

        if (
          response?.error ||
          Number(response?.statusCode) >= 400 ||
          !response?.data
        ) {
          throw new Error(
            response?.message || "Cannot load Artist Studio stats."
          );
        }

        setStudioStats({
          plays: Number(response.data.plays || 0),
          reposts: Number(response.data.reposts || 0),
          downloads: Number(response.data.downloads || 0),
          likes: Number(response.data.likes || 0),
          comments: Number(response.data.comments || 0),
          earnings: Number(response.data.earnings || 0),
          fans: Number(response.data.fans || 0),
        });
      } catch (error) {
        console.error("Cannot load Artist Studio stats:", error);

        if (!cancelled) {
          setStudioStats(defaultStudioStats);

          setStatsError(
            error instanceof Error
              ? error.message
              : "Cannot load Artist Studio stats."
          );
        }
      } finally {
        if (!cancelled) {
          setStatsLoading(false);
        }
      }
    };

    void loadStudioStats();

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    const loadSubscription = async () => {
      if (!accessToken) {
        setSubscriptionData(null);
        setSubscriptionError("Please login to view your subscription.");
        setSubscriptionLoading(false);
        return;
      }

      try {
        setSubscriptionLoading(true);
        setSubscriptionError("");

        const response = await getMySubscriptionApi(accessToken);

        if (cancelled) {
          return;
        }

        if (
          response?.error ||
          Number(response?.statusCode) >= 400 ||
          !response?.data
        ) {
          setSubscriptionData(null);
          setSubscriptionError(
            response?.message || "Cannot load subscription."
          );
          return;
        }

        setSubscriptionData(response.data);
      } catch (error) {
        console.error("Cannot load subscription:", error);

        if (!cancelled) {
          setSubscriptionData(null);

          setSubscriptionError(
            error instanceof Error
              ? error.message
              : "Cannot load subscription."
          );
        }
      } finally {
        if (!cancelled) {
          setSubscriptionLoading(false);
        }
      }
    };

    void loadSubscription();

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    const loadBenefits = async () => {
      try {
        setBenefitsLoading(true);
        setBenefitsError("");

        const response = await getArtistBenefitsApi(accessToken);

        if (cancelled) {
          return;
        }

        if (response?.error || Number(response?.statusCode) >= 400) {
          setBenefits([]);
          setBenefitsError(
            response?.message || "Cannot load membership benefits."
          );
          return;
        }

        setBenefits(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("Cannot load Artist Studio benefits:", error);

        if (!cancelled) {
          setBenefits([]);

          setBenefitsError(
            error instanceof Error
              ? error.message
              : "Cannot load membership benefits."
          );
        }
      } finally {
        if (!cancelled) {
          setBenefitsLoading(false);
        }
      }
    };

    void loadBenefits();

    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionStatus]);

  const handleTabChange = (nextTab: StudioTab) => {
    setActiveTab(nextTab);

    router.replace(`/artist-studio?tab=${encodeURIComponent(nextTab)}`, {
      scroll: false,
    });
  };

  const renderPlaceholder = () => {
    const currentTab = studioTabs.find((tab) => tab.value === activeTab);

    return (
      <Box
        sx={{
          minHeight: 280,
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.08)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
          py: 6,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: "#ffffff",
              fontSize: 20,
              fontWeight: 950,
            }}
          >
            {currentTab?.label || "Artist Studio"}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: "#8B949E",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            This section is being prepared and is not available yet.
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderBenefits = () => {
    return (
      <ArtistBenefits
        plan={subscriptionData?.plan || null}
        loading={benefitsLoading || subscriptionLoading}
        error={benefitsError}
        benefits={benefits}
      />
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "tracks":
        return (
          <>
            <StudioActions
              plan={subscriptionData?.plan || null}
              loading={subscriptionLoading}
              onDistributionClick={() => {
                handleTabChange("distribution");
              }}
            />

            <Box sx={{ mt: 3 }}>
              <ArtistTracksTable />
            </Box>

            <Box sx={{ mt: 4 }}>{renderBenefits()}</Box>
          </>
        );

      case "earnings":
        return <ArtistEarningsOverview />;

      case "subscription":
        return (
          <ArtistSubscriptionManager
            data={subscriptionData}
            accessToken={accessToken}
            loading={subscriptionLoading}
            error={subscriptionError}
            onUpdated={setSubscriptionData}
          />
        );

      case "benefits":
        return renderBenefits();

      case "distribution":
      case "vinyl":
      case "comments":
      default:
        return renderPlaceholder();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 20% 0%, rgba(255,77,0,0.08), transparent 32%), linear-gradient(180deg, #111314 0%, #0b0d0e 100%)",
        color: "#ffffff",
        px: {
          xs: 2,
          md: 3.5,
        },
        py: 3,
        pb: 10,
      }}
    >
      <UploadQuotaBar
        data={subscriptionData}
        loading={subscriptionLoading}
        error={subscriptionError}
        onManage={() => handleTabChange("subscription")}
      />

      <Box sx={{ mt: 2 }}>
        <ArtistStudioStats
          plan={subscriptionData?.plan || null}
          loading={subscriptionLoading || statsLoading}
          error={statsError}
          stats={studioStats}
        />
      </Box>

      <Box sx={{ mt: 3.5 }}>
        <StudioTabs
          tabs={studioTabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </Box>

      <Box
        id={`artist-studio-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`artist-studio-tab-${activeTab}`}
        sx={{
          mt: 3,
        }}
      >
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default ArtistStudioView;