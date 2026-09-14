/**
 * Seeded accounts offered as one-click fill on the sign-in page.
 *
 * Mirrors backend/prisma/seed.ts — every entry here must exist there, or the
 * button hands the user credentials that cannot log in. Phones are written in
 * the 2519XXXXXXXX form the sign-in form accepts.
 *
 * There is one administrator; every office has one manager and at least one
 * staff account, so each office can be driven through both approval steps from
 * this list alone. Only accounts whose password is the shared seed password are
 * listed: the customers created through real sign-ups have their own passwords
 * and are deliberately left out.
 */

export const DEMO_PASSWORD = "password123";

export type DemoAccount = {
  /** Seed username — unique, so it doubles as the React key. */
  username: string;
  role: "Admin" | "Manager" | "Staff" | "Customer";
  phone: string;
  /** Office the account belongs to; null for accounts with no office scope. */
  office: string | null;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    username: "admin",
    role: "Admin",
    phone: "251900112233",
    office: "Waajjirra Bulchinsaa Godina Shawaa Bahaa",
  },

  {
    username: "manager",
    role: "Manager",
    phone: "251910000001",
    office: "Waajjirra Misooma Albuuda Godina Shawaa Bahaa",
  },
  {
    username: "manager2",
    role: "Manager",
    phone: "251910000002",
    office: "Waajjirra Aadaa fi Turizimii Godina Shawaa Bahaa",
  },
  {
    username: "manager3",
    role: "Manager",
    phone: "251910000003",
    office: "Waajjirra Barnoota Godina Shawaa Bahaa",
  },
  {
    username: "manager4",
    role: "Manager",
    phone: "251910000004",
    office: "Waajjirra Dhimma Dubartootaa fi Daa'immanni Godina Shawaa Bahaa",
  },
  {
    username: "manager5",
    role: "Manager",
    phone: "251910000005",
    office: "Waajjirra Investiimantii fi Industrii Godiina Shawa Bahaa",
  },
  {
    username: "manager6",
    role: "Manager",
    phone: "251910000006",
    office: "Waajjirra Lafa Godina Shawaa Bahaa",
  },
  {
    username: "manager7",
    role: "Manager",
    phone: "251910000007",
    office: "Waajjirra Bulchinsaa fi Nageenya Godina Shawaa Bahaa",
  },
  {
    username: "manager8",
    role: "Manager",
    phone: "251910000008",
    office: "Ejeensii Geejjibaa Godina Shawaa Bahaa",
  },
  {
    username: "manager9",
    role: "Manager",
    phone: "251910000009",
    office: "Waajjirra Abbaa Taayitaa konistrakshinii Godina Shawaa Bahaa",
  },
  {
    username: "manager10",
    role: "Manager",
    phone: "251910000010",
    office: "Waajjirra Pabliik Sarvisii fi Misooma Qabeenya Nama Godina Shawaa Bahaa",
  },
  {
    username: "manager11",
    role: "Manager",
    phone: "251910000011",
    office: "Waajjirra Dargaggoo Ispoortii Godina Shawaa Bahaa",
  },
  {
    username: "manager12",
    role: "Manager",
    phone: "251910000012",
    office: "Waajjirra Misooma Jallissii fi Horsissee Bulaa",
  },
  {
    username: "manager13",
    role: "Manager",
    phone: "251910000013",
    office: "Ejensii Galmeessii Siviilii Godina Shawaa Bahaa",
  },
  {
    username: "manager14",
    role: "Manager",
    phone: "251910000014",
    office: "Waajjirra Fayyaa Godina Shawaa Bahaa",
  },
  {
    username: "manager15",
    role: "Manager",
    phone: "251910000015",
    office: "Waajjirra Carraa Hojii Uumuu fi Ogummaa Godina Shawaa Bahaa",
  },
  {
    username: "manager16",
    role: "Manager",
    phone: "251910000016",
    office: "Waajjirra Misooma Magaalaa fi Manneenii Godina Shawaa Bahaa",
  },
  {
    username: "manager17",
    role: "Manager",
    phone: "251910000017",
    office: "Waajjirra Galiiwwaan Godina Shawaa Bahaa",
  },
  {
    username: "manager18",
    role: "Manager",
    phone: "251910000018",
    office: "Waajjirra Bishaanii fi Inarjii Godina Shawaa Bahaa",
  },
  {
    username: "manager19",
    role: "Manager",
    phone: "251910000019",
    office: "Waajjirra Daandiiwwannii fi Loojistiksii Godina Shaawaa Bahaa",
  },
  {
    username: "manager20",
    role: "Manager",
    phone: "251910000020",
    office: "Waajjirra Babal'ina Waldoota Hojii Gamtaa Godina Shawaa Bahaa",
  },
  {
    username: "manager21",
    role: "Manager",
    phone: "251910000021",
    office: "Waajjira Kominikeeshinii Godina Shawaa Bahaa",
  },
  {
    username: "manager22",
    role: "Manager",
    phone: "251910000022",
    office: "Waajjirra Mallaqaa Godina Shawaa Bahaa",
  },
  {
    username: "manager23",
    role: "Manager",
    phone: "251910000023",
    office: "Waajjira Qonna Godina shawaa Bahaa",
  },
  {
    username: "manager24",
    role: "Manager",
    phone: "251910000024",
    office: "Waajjirra Abbaa Alangaa Godina Shawaa Bahaa",
  },

  {
    username: "staff_admin",
    role: "Staff",
    phone: "251920001001",
    office: "Waajjirra Bulchinsaa Godina Shawaa Bahaa",
  },
  {
    username: "fayyaastaff",
    role: "Staff",
    phone: "251920000014",
    office: "Waajjirra Fayyaa Godina Shawaa Bahaa",
  },
  {
    username: "staff_wchuo",
    role: "Staff",
    phone: "251920001002",
    office: "Waajjirra Carraa Hojii Uumuu fi Ogummaa Godina Shawaa Bahaa",
  },
  {
    username: "staff_wmmm",
    role: "Staff",
    phone: "251920001003",
    office: "Waajjirra Misooma Magaalaa fi Manneenii Godina Shawaa Bahaa",
  },
  {
    username: "staff_galii",
    role: "Staff",
    phone: "251920001004",
    office: "Waajjirra Galiiwwaan Godina Shawaa Bahaa",
  },
  {
    username: "staff_bishaani",
    role: "Staff",
    phone: "251920001005",
    office: "Waajjirra Bishaanii fi Inarjii Godina Shawaa Bahaa",
  },
  {
    username: "staff_daandiiwwaanni",
    role: "Staff",
    phone: "251920001006",
    office: "Waajjirra Daandiiwwannii fi Loojistiksii Godina Shaawaa Bahaa",
  },
  {
    username: "staff_ejensii",
    role: "Staff",
    phone: "251920001007",
    office: "Ejensii Galmeessii Siviilii Godina Shawaa Bahaa",
  },
  {
    username: "staff_dargaggoo",
    role: "Staff",
    phone: "251920001008",
    office: "Waajjirra Dargaggoo Ispoortii Godina Shawaa Bahaa",
  },
  {
    username: "staff_wmjhb",
    role: "Staff",
    phone: "251920001009",
    office: "Waajjirra Misooma Jallissii fi Horsissee Bulaa",
  },
  {
    username: "staff_albuuada",
    role: "Staff",
    phone: "251920001010",
    office: "Waajjirra Misooma Albuuda Godina Shawaa Bahaa",
  },
  {
    username: "staff_aadaa",
    role: "Staff",
    phone: "251920001011",
    office: "Waajjirra Aadaa fi Turizimii Godina Shawaa Bahaa",
  },
  {
    username: "staff1",
    role: "Staff",
    phone: "251920000004",
    office: "Waajjirra Dhimma Dubartootaa fi Daa'immanni Godina Shawaa Bahaa",
  },
  {
    username: "staff_barnoota",
    role: "Staff",
    phone: "251920001012",
    office: "Waajjirra Barnoota Godina Shawaa Bahaa",
  },
  {
    username: "Staffnahenya",
    role: "Staff",
    phone: "251910000036",
    office: "Waajjirra Bulchinsaa fi Nageenya Godina Shawaa Bahaa",
  },
  {
    username: "staff_geejjiba",
    role: "Staff",
    phone: "251920001013",
    office: "Ejeensii Geejjibaa Godina Shawaa Bahaa",
  },
  {
    username: "staff_investmantii",
    role: "Staff",
    phone: "251920001014",
    office: "Waajjirra Investiimantii fi Industrii Godiina Shawa Bahaa",
  },
  {
    username: "staff_konistraakshinii",
    role: "Staff",
    phone: "251920001015",
    office: "Waajjirra Abbaa Taayitaa konistrakshinii Godina Shawaa Bahaa",
  },
  {
    username: "staff_lafa",
    role: "Staff",
    phone: "251920001016",
    office: "Waajjirra Lafa Godina Shawaa Bahaa",
  },
  {
    username: "staff_psmqn",
    role: "Staff",
    phone: "251920001017",
    office: "Waajjirra Pabliik Sarvisii fi Misooma Qabeenya Nama Godina Shawaa Bahaa",
  },
  {
    username: "staff_coop",
    role: "Staff",
    phone: "251920001018",
    office: "Waajjirra Babal'ina Waldoota Hojii Gamtaa Godina Shawaa Bahaa",
  },
  {
    username: "staff_wmwd",
    role: "Staff",
    phone: "251920001019",
    office: "Waajjirra Mallaqaa Godina Shawaa Bahaa",
  },
  {
    username: "staff_agriculture",
    role: "Staff",
    phone: "251920001020",
    office: "Waajjira Qonna Godina shawaa Bahaa",
  },
  {
    username: "staff_communication",
    role: "Staff",
    phone: "251920001021",
    office: "Waajjira Kominikeeshinii Godina Shawaa Bahaa",
  },
  {
    username: "staff_attornery",
    role: "Staff",
    phone: "251920001022",
    office: "Waajjirra Abbaa Alangaa Godina Shawaa Bahaa",
  },

  {
    username: "customer",
    role: "Customer",
    phone: "251900112236",
    office: null,
  },
];

export const DEMO_ROLES = ["Admin", "Manager", "Staff", "Customer"] as const;
