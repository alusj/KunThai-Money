// ServicesContainer.jsx
// Displays all non-core banking services
// Improved spacing + responsive grid

import ServiceCard from "./ServiceCard";
import { useAppearance } from "../../../AppearanceProvider";

import { FaStore, FaShieldAlt, FaHotel, FaUtensils, FaShoppingCart, FaCapsules, FaUserTie } from "react-icons/fa";
import { MdElectricBolt, MdWifi, MdSchool, MdTv } from "react-icons/md";
import { BsQrCodeScan } from "react-icons/bs";
import { GiReceiveMoney } from "react-icons/gi";
import { RiGovernmentLine } from "react-icons/ri";
import { IoTicketOutline } from "react-icons/io5";
import { HiOutlineTrendingUp } from "react-icons/hi";

export default function ServicesContainer({ setActiveService }) {
  const { isDarkMode } = useAppearance();

  const services = [
    { key: "agent", title: "Agent Transfer", icon: <FaUserTie size={22} /> },
    { key: "merchant", title: "Pay Merchant", icon: <FaStore size={22} /> },
    { key: "school", title: "School Fees", icon: <MdSchool size={22} /> },
    { key: "hotel", title: "Hotel", icon: <FaHotel size={22} /> },
    { key: "restaurant", title: "Restaurant", icon: <FaUtensils size={22} /> },
    { key: "supermarket", title: "Supermarket", icon: <FaShoppingCart size={22} /> },
    { key: "pharmacy", title: "Pharmacy", icon: <FaCapsules size={22} /> },
    { key: "events", title: "Events", icon: <IoTicketOutline size={22} /> },
    { key: "insurance", title: "Insurance", icon: <FaShieldAlt size={22} /> },
    { key: "donation", title: "Donations", icon: <GiReceiveMoney size={22} /> },
    { key: "electricity", title: "Electricity", icon: <MdElectricBolt size={22} /> },
    { key: "internet", title: "Internet", icon: <MdWifi size={22} /> },
    { key: "tv", title: "TV Subscribe", icon: <MdTv size={22} /> },
    { key: "government", title: "Gov Services", icon: <RiGovernmentLine size={22} /> },
    { key: "investment", title: "Investments", icon: <HiOutlineTrendingUp size={22} /> },
    { key: "qr", title: "QR Pay", icon: <BsQrCodeScan size={22} /> },
  ];

  return (
    <div className="mt-10">

      <h2 className={`mb-5 text-base font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
        Services
      </h2>

      {/* Responsive Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-1 gap-2">

        {services.map((service) => (
          <ServiceCard
            key={service.key}
            icon={service.icon}
            title={service.title}
            onClick={() => setActiveService(service.key)}
          />
        ))}

      </div>

    </div>
  );
}
