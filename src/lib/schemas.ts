import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const svceEmailRegex = /^[a-zA-Z0-9._%+-]+@svce\.ac\.in$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const teamInfoSchema = z
  .object({
    team_name: z
      .string()
      .min(2, "Team name too short")
      .max(50, "Max 50 characters")
      .regex(/^[a-zA-Z0-9\s]+$/, "Letters, numbers, spaces only"),
    team_size: z.union([z.literal(4), z.literal(5), z.literal(6)]),
    is_svce: z.boolean(),
    college_name: z.string().max(120).optional().or(z.literal("")),
    category: z.enum(["Hardware", "Software", "Industry Problem Statement"]),
  })
  .refine(
    (d) => d.is_svce || (d.college_name && d.college_name.trim().length >= 2),
    { message: "College name is required", path: ["college_name"] },
  );

export type TeamInfo = z.infer<typeof teamInfoSchema>;

export const memberSchema = (isSvce: boolean) =>
  z.object({
    full_name: z
      .string()
      .min(2, "Name too short")
      .max(80)
      .regex(/^[a-zA-Z\s.'-]+$/, "Letters only"),
    department: z.enum([
      "ECE",
      "CSE",
      "IT",
      "MECH",
      "CIVIL",
      "EEE",
      "AIDS",
      "AIML",
      "Other",
    ]),
    year_of_study: z.enum(["1st", "2nd", "3rd", "4th"]),
    registration_number: z
      .string()
      .min(4, "Too short")
      .max(20)
      .regex(/^[A-Z0-9]+$/, "Alphanumeric only"),
    college_name: z.string().min(2).max(120),
    phone_number: z.string().regex(phoneRegex, "Enter a valid 10-digit mobile"),
    college_email: isSvce
      ? z.string().regex(svceEmailRegex, "Must be a @svce.ac.in email")
      : z.string().regex(emailRegex, "Invalid email"),
    personal_email: z.string().regex(emailRegex, "Invalid email"),
  });

export type Member = z.infer<ReturnType<typeof memberSchema>>;

export const mentorSchema = z.object({
  mentor_name: z.string().min(2, "Required").max(80),
  mentor_department: z.string().max(80).optional().or(z.literal("")),
  mentor_phone: z.string().regex(phoneRegex, "Valid 10-digit mobile"),
  mentor_email: z.string().regex(emailRegex, "Invalid email"),
});
export type Mentor = z.infer<typeof mentorSchema>;

export const paymentSchema = z.object({
  payment_transaction_id: z
    .string()
    .min(8, "At least 8 characters")
    .max(40)
    .regex(/^[a-zA-Z0-9]+$/, "Alphanumeric only"),
  payment_bank_name: z.string().min(2).max(80),
  payment_ifsc_code: z.string().regex(ifscRegex, "Invalid IFSC format"),
  payment_branch_name: z.string().min(2).max(80),
  payment_branch_code: z.string().min(1).max(20),
});
export type Payment = z.infer<typeof paymentSchema>;
