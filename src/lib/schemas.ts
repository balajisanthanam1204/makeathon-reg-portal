import { z } from "zod";

const phoneRegex = /^[6-9]\d{9}$/;
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

// Problem statement (asked on Step 1 too)
export const problemSchema = z
  .object({
    problem_statement_id: z.string().min(1, "Required").max(60),
    problem_statement_name: z.string().min(2, "Required").max(160),
    company_name: z.string().max(120).optional().or(z.literal("")),
    category: z.enum(["Hardware", "Software", "Industry Problem Statement"]),
  })
  .refine(
    (d) =>
      d.category !== "Industry Problem Statement" ||
      (d.company_name && d.company_name.trim().length >= 2),
    { message: "Company name is required", path: ["company_name"] },
  );

export type Problem = z.infer<typeof problemSchema>;

export const memberSchema = (isSvce: boolean) =>
  z
    .object({
      full_name: z
        .string()
        .min(2, "Name too short")
        .max(80)
        .regex(/^[a-zA-Z\s.'-]+$/, "Letters only"),
      department: z.enum([
        "ECE", "CSE", "IT", "MECH", "CIVIL", "EEE", "AIDS", "AIML", "Other",
      ]),
      department_other: z.string().max(60).optional().or(z.literal("")),
      year_of_study: z.enum(["1st", "2nd", "3rd", "4th"]),
      registration_number: z
        .string()
        .max(20)
        .regex(/^[A-Z0-9]*$/, "Alphanumeric only")
        .optional()
        .or(z.literal("")),
      phone_number: z.string().regex(phoneRegex, "Enter a valid 10-digit mobile"),
      whatsapp_number: z.string().regex(phoneRegex, "Enter a valid 10-digit WhatsApp number"),
      college_email: isSvce
        ? z.string().regex(svceEmailRegex, "Must be a @svce.ac.in email")
        : z.string().regex(emailRegex, "Invalid email"),
      personal_email: z.string().regex(emailRegex, "Invalid email"),
    })
    .refine(
      (d) => d.department !== "Other" || (d.department_other && d.department_other.trim().length >= 2),
      { message: "Specify your department", path: ["department_other"] },
    );

export type Member = z.infer<ReturnType<typeof memberSchema>>;

export const mentorSchema = z.object({
  mentor_name: z.string().min(2, "Required").max(80),
  mentor_designation: z.string().min(2, "Required").max(80),
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
  payment_bank_name: z.string().min(2, "Required").max(80),
});
export type Payment = z.infer<typeof paymentSchema>;

export const payerSchema = z.object({
  payer_name: z.string().min(2, "Required").max(80),
  payer_mobile: z.string().regex(phoneRegex, "10-digit mobile"),
});
export type Payer = z.infer<typeof payerSchema>;
