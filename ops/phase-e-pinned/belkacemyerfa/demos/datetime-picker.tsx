"use client";
import { DatetimePicker } from "@/components/auto-index/belkacemyerfa-datetime-picker/datetime-picker";

export default function Demo() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center overflow-auto p-6">
      <DatetimePicker
        format={[
          ["months", "days", "years"],
          ["hours", "minutes", "am/pm"],
        ]}
      />
    </div>
  );
}
