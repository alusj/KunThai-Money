// ======================================================
// dashboard/Dashboard.jsx
// Main dashboard layout wrapper
// Controls service screen switching
// Now receives real banking data from UrBankHome
// ======================================================

import { useEffect, useState } from "react";

import MainAccountCard from "./MainAccountCard";
import MainAccountNumber from "./MainAccountContainer/MainAccountNumber";
import UrBankSkeleton from "../UrBankSkeleton";
import OtherAccountContainer from "./OtherAccountContainer/OtherAccountContainer";
import ServicesContainer from "./Services/ServicesContainer";
import PayMerchant from "./Services/PayMerchant/PayMerchant";
import AgentTransfer from "./Services/AgentTransfer/AgentTransfer";
import ElectricityPay from "./Services/Electricity/ElectricityPay";
import InternetPay from "./Services/InternetPay/InternetPay";
import TVSubscription from "./Services/TVSubscription/TVSubscription";
import SchoolFees from "./Services/SchoolFees/SchoolFees";
import GovServices from "./Services/GovServices/GovServices";
import QRPay from "./Services/QRPay/QRPay";
import Donation from "./Services/Donation/Donation";
import Insurance from "./Services/Insurance/Insurance";
import Ticket from "./Services/Tickets/Ticket";
import Restaurant from "./Services/Restaurant/Restaurant";
import Hotel from "./Services/Hotel/Hotel";
import Supermarket from "./Services/Supermarket/supermarket";
import Pharmacy from "./Services/Pharmacy/Pharmacy";
import { useAppearance } from "../../AppearanceProvider";

const DASHBOARD_SERVICE_KEY = "kuntai-dashboard-active-service";

export default function Dashboard({
  account,
  refreshAccount,
  otherAccounts = [],
  user,
  profile,
  isMainAccountNumberHidden = false,
  onHideMainAccountNumber,
  onHideOtherAccount,
  onMoveOtherAccountToMain,
  onEditRejectedAgent,
  onEditRejectedInsurance,
  onEditRejectedDonation,
}) {
  const { isDarkMode } = useAppearance();
  const [activeService, setActiveService] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedService = window.sessionStorage.getItem(DASHBOARD_SERVICE_KEY) || null;
    if (storedService === "tickets") {
      return "events";
    }

    if (storedService === "transport") {
      return null;
    }

    return storedService;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (activeService) {
      window.sessionStorage.setItem(DASHBOARD_SERVICE_KEY, activeService);
    } else {
      window.sessionStorage.removeItem(DASHBOARD_SERVICE_KEY);
    }
  }, [activeService]);

  return (
    <main
      className={`min-h-screen w-full transition-colors ${
        isDarkMode
          ? "bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.08),transparent_24%),linear-gradient(180deg,#0f172a_0%,#111827_44%,#172033_100%)]"
          : ""
      }`}
    >
      {!activeService && (
        <div className="px-4 md:px-8 lg:px-12">
          {!account ? (
            <UrBankSkeleton />
          ) : (
            <>
              <MainAccountCard
                account={account}
                user={user}
                profile={profile}
                refreshAccount={refreshAccount}
                otherAccounts={otherAccounts}
              />
              {!isMainAccountNumberHidden && (
                <MainAccountNumber
                  account={account}
                  onRemoveFromDashboard={onHideMainAccountNumber}
                />
              )}
              <OtherAccountContainer
                accounts={otherAccounts}
                mainAccount={account}
                user={user}
                profile={profile}
                refreshAccount={refreshAccount}
                onHideAccountFromDashboard={onHideOtherAccount}
                onMoveAccountToMain={onMoveOtherAccountToMain}
                onEditRejectedAgent={onEditRejectedAgent}
                onEditRejectedInsurance={onEditRejectedInsurance}
                onEditRejectedDonation={onEditRejectedDonation}
              />
              <ServicesContainer setActiveService={setActiveService} />
            </>
          )}
        </div>
      )}

      {activeService === "merchant" && (
        <PayMerchant
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "agent" && (
        <AgentTransfer
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "electricity" && (
        <ElectricityPay
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "internet" && (
        <InternetPay
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "tv" && (
        <TVSubscription
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "school" && (
        <SchoolFees
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "government" && (
        <GovServices
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "qr" && (
        <QRPay
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "donation" && (
        <Donation
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "insurance" && (
        <Insurance
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "events" && (
        <Ticket
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "restaurant" && (
        <Restaurant
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "hotel" && (
        <Hotel
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "supermarket" && (
        <Supermarket
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}

      {activeService === "pharmacy" && (
        <Pharmacy
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
          account={account}
          user={user}
          profile={profile}
        />
      )}
    </main>
  );
}
