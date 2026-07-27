"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import { Box, Typography } from "@mui/material";

import UploadQuotaBar from "./uploadQuotaBar";
import ArtistStudioStats from "./artistStudioStats";
import StudioActions from "./studioActions";
import ArtistTracksTable from "./artistTracksTable";
import ArtistBenefits from "./artistBenefits";
import {
  getArtistBenefitsApi,
  getArtistStudioStatsApi,
  getMySubscriptionApi,
} from "@/utils/api";
import StudioTabs, { studioTabs } from "./studioTabs";
import ArtistEarningsOverview from "./artistEarningsOverview";

const ArtistStudioView = () => {
  const { data: session, status: sessionStatus } = useSession();
  const [statsLoading, setStatsLoading] = useState(true);

  const [statsError, setStatsError] = useState("");

  const [activeTab, setActiveTab] = useState<StudioTab>("tracks");

  const [subscriptionData, setSubscriptionData] =
    useState<IMySubscriptionData | null>(null);

  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  const [subscriptionError, setSubscriptionError] = useState("");

  const [benefits, setBenefits] = useState<IArtistBenefit[]>([]);

  const [benefitsLoading, setBenefitsLoading] = useState(true);

  const [benefitsError, setBenefitsError] = useState("");

  const [studioStats, setStudioStats] = useState<IArtistStudioStats>({
    plays: 0,
    reposts: 0,
    downloads: 0,
    likes: 0,
    comments: 0,
    earnings: 0,
    fans: 0,
  });

  const accessToken =
    (session as any)?.access_token ||
    (session as any)?.accessToken ||
    (session as any)?.user?.access_token ||
    (session as any)?.user?.accessToken ||
    "";

  ///load stats
  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    const loadStudioStats = async () => {
      if (!accessToken) {
        setStatsLoading(false);
        setStatsError("Please login to view Artist Studio stats.");

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
      } catch (loadError) {
        console.error("Cannot load Artist Studio stats:", loadError);

        if (!cancelled) {
          setStatsError(
            loadError instanceof Error
              ? loadError.message
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

  ///

  useEffect(() => {
    if (sessionStatus === "loading") {
      return;
    }

    let cancelled = false;

    const loadSubscription = async () => {
      if (!accessToken) {
        setSubscriptionData(null);

        setSubscriptionLoading(false);

        setSubscriptionError("Please login to view your subscription.");

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

          setSubscriptionError("Cannot load subscription.");
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

          setBenefitsError("Cannot load membership benefits.");
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
      />

      <Box sx={{ mt: 2 }}>
        <ArtistStudioStats
          plan={subscriptionData?.plan || null}
          loading={subscriptionLoading || statsLoading}
          stats={studioStats}
        />
      </Box>

      <Box sx={{ mt: 3.5 }}>
        <StudioTabs
          tabs={studioTabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </Box>

      {/* ARTIST STUDIO TAB CONTENT */}
      <Box sx={{ mt: 3 }}>
        {activeTab === "tracks" ? (
          <>
            {/* TRACK ACTIONS */}
            <StudioActions
              plan={subscriptionData?.plan || null}
              loading={subscriptionLoading}
              onDistributionClick={() => {
                setActiveTab("distribution");
              }}
            />

            {/* ARTIST TRACKS */}
            <Box sx={{ mt: 3 }}>
              <ArtistTracksTable />
            </Box>
          </>
        ) : activeTab === "earnings" ? (
          /* ARTIST EARNINGS */
          <ArtistEarningsOverview />
        ) : (
          /* UNAVAILABLE TAB */
          <Box
            sx={{
              minHeight: 260,
              borderRadius: "18px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.035)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  color: "#ffffff",
                  fontSize: 20,
                  fontWeight: 950,
                  mb: 1,
                }}
              >
                {studioTabs.find((tab) => tab.value === activeTab)?.label}
              </Typography>

              <Typography
                sx={{
                  color: "#8B949E",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                This section is not available yet.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 4 }}>
        <ArtistBenefits
          plan={subscriptionData?.plan || null}
          loading={benefitsLoading || subscriptionLoading}
          error={benefitsError}
          benefits={benefits}
        />
      </Box>
    </Box>
  );
};

export default ArtistStudioView;
