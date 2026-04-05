// ======================================================
// dashboard/Dashboard.jsx
// Main dashboard layout wrapper
// Controls service screen switching
// Now receives real banking data from UrBankHome
// ======================================================

import { useState } from "react";

import MainAccountCard from "./MainAccountCard";
import MainAccountNumber from "./MainAccountContainer/MainAccountNumber";
import UrBankSkeleton from "../UrBankSkeleton";
import OtherAccountContainer from "./OtherAccountContainer/OtherAccountContainer";
import ServicesContainer from "./Services/ServicesContainer";
import PayMerchant from "./Services/PayMerchant/PayMerchant";
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

export default function Dashboard({ account, refreshAccount, otherAccounts = [], user }) {
  const [activeService, setActiveService] = useState(null);

  return (
    <main className="w-full min-h-screen">
      {!activeService && (
        <div className="px-4 md:px-8 lg:px-12">
          {!account ? (
            <UrBankSkeleton />
          ) : (
            <>
              <MainAccountCard account={account} user={user} />
              <MainAccountNumber account={account} />
              <OtherAccountContainer accounts={otherAccounts} />
              <ServicesContainer setActiveService={setActiveService} />
            </>
          )}
        </div>
      )}

      {activeService === "merchant" && (
        <PayMerchant
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
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
        />
      )}

      {activeService === "insurance" && (
        <Insurance
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "tickets" && (
        <Ticket
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "restaurant" && (
        <Restaurant
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "hotel" && (
        <Hotel
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "supermarket" && (
        <Supermarket
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}

      {activeService === "pharmacy" && (
        <Pharmacy
          onBack={() => setActiveService(null)}
          refreshAccount={refreshAccount}
        />
      )}
    </main>
  );
}
