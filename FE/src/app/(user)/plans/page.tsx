import type { Metadata } from "next";
import SubscriptionPlansView from "./components/subscriptionPlansView";

export const metadata: Metadata = {
  title: "Available plans | SoundClone",
  description: "Compare SoundClone creator subscription plans.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SubscriptionPlansPage = () => {
  return <SubscriptionPlansView />;
};

export default SubscriptionPlansPage;
