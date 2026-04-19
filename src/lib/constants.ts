export const PER_MEMBER_FEE = 350;

export const COORDINATORS = [
  { name: "Roshan M", phone: "98410 92274" },
  { name: "Adarsh S", phone: "73059 70106" },
  { name: "Yaaminy S K", phone: "63809 89594" },
  { name: "Roobuck Rao C", phone: "81482 04922" },
  { name: "Mohammed Raeef", phone: "91501 58647" },
  { name: "Harinee V T", phone: "73581 20955" },
  { name: "Lakshanaa A M", phone: "99403 37194" },
  { name: "Harini C", phone: "86101 63433" },
  { name: "Bawadharani Sree R", phone: "90802 51947", role: "Treasurer" },
  { name: "Balaji S", phone: "81225 86514" },
  { name: "Surya K", phone: "87544 25137", role: "Treasurer" },
];

export const TREASURERS = COORDINATORS.filter((c) => c.role === "Treasurer");

// TODO: replace with real WhatsApp invite once available
export const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/";
