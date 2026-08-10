require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const stubCodes = {
  "attachment": `import * as React from "react"
import { cn } from "@/lib/utils"
export const Attachment = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-md text-sm", className)} {...props} />
))
Attachment.displayName = "Attachment"`,
  
  "bubble": `import * as React from "react"
import { cn } from "@/lib/utils"
export const Bubble = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { variant?: "user" | "assistant" }>(({ className, variant = "assistant", ...props }, ref) => (
  <div ref={ref} className={cn("px-4 py-2 rounded-2xl max-w-sm", variant === "user" ? "bg-primary text-primary-foreground ml-auto rounded-br-sm" : "bg-muted rounded-bl-sm", className)} {...props} />
))
Bubble.displayName = "Bubble"`,

  "direction": `import * as React from "react"
export const DirectionProvider = ({ children, dir }: { children: React.ReactNode, dir: "ltr" | "rtl" }) => (
  <div dir={dir}>{children}</div>
)`,

  "marker": `import * as React from "react"
import { cn } from "@/lib/utils"
export const Marker = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold", className)} {...props} />
))
Marker.displayName = "Marker"`,

  "message-scroller": `import * as React from "react"
import { cn } from "@/lib/utils"
export const MessageScroller = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-4 overflow-y-auto p-4 border rounded-lg", className)} {...props} />
))
MessageScroller.displayName = "MessageScroller"`,

  "message": `import * as React from "react"
import { cn } from "@/lib/utils"
export const Message = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { role?: "user" | "assistant" }>(({ className, role, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 py-2 rounded-2xl max-w-sm", role === "user" ? "bg-primary text-primary-foreground ml-auto rounded-br-sm" : "bg-muted rounded-bl-sm", className)} {...props} />
))
Message.displayName = "Message"`,

  "native-select": `import * as React from "react"
import { cn } from "@/lib/utils"
export const NativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />
))
NativeSelect.displayName = "NativeSelect"`
};

async function main() {
  for (const [slug, code] of Object.entries(stubCodes)) {
    console.log(`Updating ${slug} stub code in DB...`);
    const { error } = await supabase
      .from("components")
      .update({ code, direct_registry_dependencies: [], dependencies: [] })
      .eq("user_id", "user_shadcn")
      .eq("component_slug", slug);
      
    if (error) {
      console.error(`Error updating ${slug}:`, error);
    } else {
      console.log(`Successfully updated ${slug}`);
    }
  }
}

main();
