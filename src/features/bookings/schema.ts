import { z } from "zod";

export const BookingRequestSchema = z.object({
  roomType: z.enum(["lecture", "multi-purpose"], {
    message: "Please select a room type.",
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Valid date is required.",
  }),
  timeSlotId: z.string().min(1, "Please select a time slot."),
  reason: z.string().min(5, "Please provide a reason or topic for the request."),
  
  // Multi-Purpose Fields (Optional initially, enforced strictly in superRefine)
  managerName: z.string().optional(),
  managerJobTitle: z.string().optional(),
  managerMobile: z.string().optional(),
  micsCount: z.coerce.number().min(0).optional(),
  hasLaptop: z.boolean().optional(),
  hasVideoConf: z.boolean().optional(),
  
}).superRefine((data, ctx) => {
  const requestedDate = new Date(`${data.date}T00:00:00`); 
  const now = new Date();
  const diffHours = (requestedDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Time constraints based on room type
  if (data.roomType === "lecture" && diffHours < 24) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["date"],
      message: "Lecture rooms require at least 24 hours notice.",
    });
  }

  // Multi-Purpose constraints
  if (data.roomType === "multi-purpose") {
    // Basic fields requirement
    if (!data.managerName || data.managerName.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["managerName"], message: "Manager name is required." });
    }
    if (!data.managerJobTitle || data.managerJobTitle.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["managerJobTitle"], message: "Manager job title is required." });
    }
    if (!data.managerMobile || data.managerMobile.trim().length < 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["managerMobile"], message: "Valid mobile number is required." });
    }
  }
});

export type BookingRequestFormValues = z.infer<typeof BookingRequestSchema>;
